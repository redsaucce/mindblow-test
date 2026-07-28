import io
import re

import pypdf
from docx import Document as DocxDocument
from fastapi import UploadFile

from app.core.exceptions import (
    DocumentTooLongError,
    DocumentTooShortError,
    UnsupportedFileTypeError,
)

MIN_EXTRACTED_CHARS = 50
MAX_EXTRACTED_CHARS = 150_000

DOCX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
PDF_CONTENT_TYPE = "application/pdf"


async def extract_text(file: UploadFile) -> str:
    raw_bytes = await file.read()
    filename = (file.filename or "").lower()

    if filename.endswith(".pdf") or file.content_type == PDF_CONTENT_TYPE:
        return _extract_pdf(raw_bytes)

    if filename.endswith(".docx") or file.content_type == DOCX_CONTENT_TYPE:
        return _extract_docx(raw_bytes)

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