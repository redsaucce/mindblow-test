"""RAG retrieval primitives shared by two pipeline steps (see
rag-implementation-plan.md):

1. Semantic deduplication of extracted document text, run once per document
   before the main generation prompt is assembled (see `deduplicate_chunks`).
2. Multiple-choice distractor grounding, run once per MCQ question after
   the initial quiz is generated (see `retrieve_related_chunks`).

Nothing here is persisted — chunks and embeddings live only for the
duration of a single `generate_quiz()` call, matching how the rest of the
system already treats uploaded documents as transient input (never saved
to disk or DB). No new dependency: embeddings use the same `google-genai`
client `ai_service.py` already uses for generation, just a different model
endpoint.
"""

import math
import re

from google import genai

from app.config import settings

EMBEDDING_MODEL = "gemini-embedding-001"

# Deduplication safeguards (see rag-implementation-plan.md "Safeguards
# against false-positive collapsing"). Both are deliberately conservative —
# biased toward under-collapsing rather than over-collapsing when uncertain,
# since surviving near-duplicates only cost prompt space, while a wrongly
# collapsed pair loses real content the quiz could've covered.
DEDUP_SIMILARITY_THRESHOLD = 0.95
DEDUP_MIN_CHUNK_CHARS = 500

# How many related-but-different chunks to retrieve per correct answer when
# grounding multiple-choice distractors.
DISTRACTOR_TOP_K = 3

_client = genai.Client(api_key=settings.gemini_api_key)


class Chunk:
    """A segment of source document text paired with its embedding vector.
    Purely in-memory — never persisted."""

    def __init__(self, text: str, embedding: list[float]):
        self.text = text
        self.embedding = embedding


def chunk_text(text: str, target_chars: int = 800) -> list[str]:
    """Splits text into paragraph-aligned chunks of roughly `target_chars`
    characters. Paragraphs are kept whole where possible rather than cut
    mid-sentence; a paragraph longer than `target_chars` on its own becomes
    its own chunk rather than being force-split."""
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]

    chunks: list[str] = []
    current: list[str] = []
    current_len = 0

    for para in paragraphs:
        if current and current_len + len(para) > target_chars:
            chunks.append("\n\n".join(current))
            current = []
            current_len = 0
        current.append(para)
        current_len += len(para)

    if current:
        chunks.append("\n\n".join(current))

    return chunks


async def embed_chunks(texts: list[str]) -> list[Chunk]:
    """Embeds a batch of text segments and pairs each with its source text.
    Returns an empty list for empty input rather than calling the API."""
    if not texts:
        return []

    response = await _client.aio.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=texts,
    )
    return [
        Chunk(text=text, embedding=embedding.values)
        for text, embedding in zip(texts, response.embeddings)
    ]


async def embed_text(text: str) -> list[float]:
    """Embeds a single piece of text (e.g. a question's correct answer)."""
    response = await _client.aio.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
    )
    return response.embeddings[0].values


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def deduplicate_chunks(chunks: list[Chunk]) -> list[Chunk]:
    """Collapses near-duplicate chunks, keeping the first occurrence of each
    group and dropping the rest. Chunks under DEDUP_MIN_CHUNK_CHARS are
    exempt from comparison entirely (both as the item being compared and as
    a candidate match) and always survive — short fragments (headings,
    captions, list items) are the most prone to false-positive similarity,
    since there's little content to distinguish meaning.

    This only ever removes text, never rewrites or merges it — the survivor
    of a collapsed group is the original text verbatim. See
    rag-implementation-plan.md for why the threshold is set conservatively
    (0.95+) and why a shared-key-terms secondary check was considered and
    rejected.
    """
    survivors: list[Chunk] = []

    for chunk in chunks:
        if len(chunk.text) < DEDUP_MIN_CHUNK_CHARS:
            survivors.append(chunk)
            continue

        is_duplicate = False
        for kept in survivors:
            if len(kept.text) < DEDUP_MIN_CHUNK_CHARS:
                # A short chunk was kept as-is above; never treat it as a
                # comparison target for a longer chunk's duplicate check.
                continue
            if _cosine_similarity(chunk.embedding, kept.embedding) >= DEDUP_SIMILARITY_THRESHOLD:
                is_duplicate = True
                break

        if not is_duplicate:
            survivors.append(chunk)

    return survivors


def retrieve_related_chunks(
    chunks: list[Chunk], answer_embedding: list[float], top_k: int = DISTRACTOR_TOP_K
) -> list[str]:
    """Returns the top_k chunk texts most similar to a correct answer's
    embedding — content that's topically related without being the answer
    itself. Used to ground multiple-choice distractor generation instead of
    letting the model invent wrong answers ungrounded in the source
    document."""
    if not chunks:
        return []

    scored = [
        (_cosine_similarity(chunk.embedding, answer_embedding), chunk)
        for chunk in chunks
    ]
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [chunk.text for _, chunk in scored[:top_k]]