import io
import re
import zipfile

import pypdf
from docx import Document as DocxDocument
from fastapi import HTTPException, UploadFile
from lxml import etree

from app.config import settings
from app.core.exceptions import (
    DocumentWithoutTextError,
    DocumentTooLongError,
    DocumentTooShortError,
    FileTooLargeError,
    UnsupportedFileTypeError,
)

MIN_EXTRACTED_CHARS = 50
MAX_EXTRACTED_CHARS = 150_000
MAX_FILES_PER_QUIZ = 10
MAX_TOTAL_UPLOAD_BYTES = 30 * 1024 * 1024

DOCX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
PDF_CONTENT_TYPE = "application/pdf"

_READ_CHUNK_SIZE = 1024 * 1024  # 1 MB per chunk

# Limit on the expanded size of a DOCX, to block zip bombs.
MAX_DOCX_UNCOMPRESSED_BYTES = 50 * 1024 * 1024


async def _read_bounded(file: UploadFile) -> bytes:
    """Reads the upload in chunks, rejecting it as soon as it exceeds the
    configured max size instead of buffering an arbitrarily large file into
    memory first."""
    chunks: list[bytes] = []
    total = 0

    while True:
        chunk = await file.read(_READ_CHUNK_SIZE)
        if not chunk:
            break
        total += len(chunk)
        if total > settings.max_upload_size_bytes:
            raise FileTooLargeError()
        chunks.append(chunk)

    return b"".join(chunks)


def _ensure_has_text(text: str) -> str:
    """Images are not read, so a file with no text at all (only images) is rejected with its own message.
    Files that have some text, plus images, pass through and are processed normally."""
    if not text.strip():
        raise DocumentWithoutTextError()
    return text


async def extract_text_from_files(files: list[UploadFile]) -> tuple[str, list[str]]:
    """Extracts and combines the text of every file, in the order selected.

    The whole upload is rejected if any file fails. Each error names the file.
    A single file is returned without a source label, as before.
    """
    from app.core.exceptions import DuplicateFileError, TooManyFilesError, UploadTooLargeError

    if len(files) > MAX_FILES_PER_QUIZ:
        raise TooManyFilesError(MAX_FILES_PER_QUIZ)
    if sum(f.size or 0 for f in files) > MAX_TOTAL_UPLOAD_BYTES:
        raise UploadTooLargeError(MAX_TOTAL_UPLOAD_BYTES // (1024 * 1024))

    names: list[str] = []
    parts: list[str] = []
    seen: set[str] = set()
    for file in files:
        name = file.filename or "document"
        if name.lower() in seen:
            raise DuplicateFileError(name)
        seen.add(name.lower())
        try:
            text = await extract_text(file)
        except HTTPException as exc:
            raise HTTPException(status_code=exc.status_code, detail=f"{name}: {exc.detail}") from exc
        names.append(name)
        parts.append(text if len(files) == 1 else f"[Source: {name}]\n{text}")

    return "\n\n".join(parts), names


async def extract_text(file: UploadFile) -> str:
    raw_bytes = await _read_bounded(file)
    filename = (file.filename or "").lower()

    if filename.endswith(".pdf") or file.content_type == PDF_CONTENT_TYPE:
        return _ensure_has_text(_extract_pdf(raw_bytes))

    if filename.endswith(".docx") or file.content_type == DOCX_CONTENT_TYPE:
        return _ensure_has_text(_extract_docx(raw_bytes))

    if filename.endswith(".doc"):
        raise UnsupportedFileTypeError(
            "Legacy .doc files are not supported. Please upload a .docx or .pdf file."
        )

    raise UnsupportedFileTypeError("Only PDF or DOCX files are supported.")


def _extract_pdf(raw_bytes: bytes) -> str:
    try:
        reader = pypdf.PdfReader(io.BytesIO(raw_bytes))
        pages_text = [page.extract_text() or "" for page in reader.pages]
        return "\n".join(pages_text)
    except Exception as e:
        raise UnsupportedFileTypeError(
            "This file could not be read as a PDF. Please try a different file."
        ) from e


def _extract_docx(raw_bytes: bytes) -> str:
    # python-docx parses the .docx zip's XML parts internally via lxml. We can't
    # inject a hardened parser into python-docx's own internals, but explicitly
    # constructing a defused lxml parser here (no entity resolution, no network
    # access, bounded expansion) and probing the document.xml part with it first
    # gives an early, explicit rejection of XXE/billion-laughs-style payloads
    # before python-docx's own parsing runs.
    try:
        with zipfile.ZipFile(io.BytesIO(raw_bytes)) as zf:
            uncompressed = sum(info.file_size for info in zf.infolist())
            if uncompressed > MAX_DOCX_UNCOMPRESSED_BYTES:
                raise UnsupportedFileTypeError("This file is too large once expanded. Please try a smaller file.")
            if "word/document.xml" in zf.namelist():
                xml_bytes = zf.read("word/document.xml")
                safe_parser = etree.XMLParser(
                    resolve_entities=False,
                    no_network=True,
                    huge_tree=False,
                )
                etree.fromstring(xml_bytes, parser=safe_parser)
    except Exception as e:
        raise UnsupportedFileTypeError(
            "This file could not be read as a DOCX. Please try a different file."
        ) from e

    try:
        doc = DocxDocument(io.BytesIO(raw_bytes))
        paragraphs = [p.text for p in doc.paragraphs]
        return "\n".join(paragraphs)
    except Exception as e:
        raise UnsupportedFileTypeError(
            "This file could not be read as a DOCX. Please try a different file."
        ) from e


_PAGE_NUMBER_LINE = re.compile(r"^\s*(page\s+)?\d+(\s+of\s+\d+)?\s*$", re.IGNORECASE)
_TOC_DOT_LEADER_LINE = re.compile(r".+\.{4,}\s*\d+\s*$")
_TOC_HEADING_LINE = re.compile(r"^\s*(table of contents|contents)\s*$", re.IGNORECASE)
_REFERENCES_HEADING_LINE = re.compile(
    r"^\s*(references|bibliography|works cited)\s*$", re.IGNORECASE
)


def clean_extracted_text(text: str) -> str:
    lines = text.splitlines()
    cleaned_lines: list[str] = []

    for line in lines:
        stripped = line.strip()

        if not stripped:
            continue
        if _PAGE_NUMBER_LINE.match(stripped):
            continue
        if _TOC_DOT_LEADER_LINE.match(stripped):
            continue
        if _TOC_HEADING_LINE.match(stripped):
            continue
        if _REFERENCES_HEADING_LINE.match(stripped):
            break

        cleaned_lines.append(stripped)

    cleaned = "\n".join(cleaned_lines)

    if len(cleaned) < MIN_EXTRACTED_CHARS:
        raise DocumentTooShortError()

    if len(cleaned) > MAX_EXTRACTED_CHARS:
        raise DocumentTooLongError()

    return cleaned