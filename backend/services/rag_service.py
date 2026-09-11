"""
RAG Service - Retrieval-Augmented Generation
Handles document chunking, embedding, and retrieval for Q&A

LLM: Groq (free tier) — https://console.groq.com
     Sign up → API Keys → Create key → paste in .env as GROQ_API_KEY
"""
from dotenv import load_dotenv
load_dotenv()

import os
import re
import numpy as np
from typing import List, Tuple, Optional
from dataclasses import dataclass
import asyncio

# PDF/Document processing
import fitz  # PyMuPDF
from docx import Document as DocxDocument

# Embeddings
from sentence_transformers import SentenceTransformer

# Groq LLM client (free)
from groq import Groq

# Vector similarity
from sklearn.metrics.pairwise import cosine_similarity


@dataclass
class DocumentChunk:
    text: str
    chunk_index: int
    document_id: str
    document_title: str
    page_number: Optional[int] = None
    embedding: Optional[List[float]] = None


# ── Groq model options (all free tier) ────────────────────────────────────────
# "llama3-8b-8192"       — fastest, lightest
# "llama3-70b-8192"      — best quality, still free
# "mixtral-8x7b-32768"   — long context (32k tokens)
# "gemma2-9b-it"         — Google Gemma 2, great for instruction following
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")


class RAGService:
    """
    Core RAG implementation:
    1. Document ingestion → chunking → embedding → storage
    2. Query → embedding → similarity search → context → Groq LLM answer
    """

    def __init__(self):
        self.embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
        self.groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.chunk_size = 500      # characters per chunk
        self.chunk_overlap = 100   # overlap between chunks
        self.top_k = 5             # number of chunks to retrieve

    # ─────────────────── Document Processing ───────────────────

    def extract_text_from_pdf(self, file_bytes: bytes) -> List[Tuple[str, int]]:
        """Extract text with page numbers from PDF"""
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        pages = []
        for page_num, page in enumerate(doc, start=1):
            text = page.get_text("text")
            if text.strip():
                pages.append((text, page_num))
        doc.close()
        return pages

    def extract_text_from_docx(self, file_bytes: bytes) -> List[Tuple[str, int]]:
        """Extract text from DOCX"""
        import io
        doc = DocxDocument(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        pages, current_page, current_text = [], 1, ""
        for para in paragraphs:
            if len(current_text) + len(para) > 1500:
                pages.append((current_text, current_page))
                current_page += 1
                current_text = para
            else:
                current_text += "\n" + para
        if current_text:
            pages.append((current_text, current_page))
        return pages

    def extract_text_from_txt(self, file_bytes: bytes) -> List[Tuple[str, int]]:
        """Extract text from plain text files"""
        text = file_bytes.decode("utf-8", errors="ignore")
        lines = text.split("\n")
        pages, current_page, current_text = [], 1, ""
        for line in lines:
            if len(current_text) + len(line) > 1500:
                pages.append((current_text, current_page))
                current_page += 1
                current_text = line
            else:
                current_text += "\n" + line
        if current_text:
            pages.append((current_text, current_page))
        return pages

    def chunk_text(
        self, text: str, page_number: int, document_id: str, document_title: str
    ) -> List[DocumentChunk]:
        """Split text into overlapping chunks"""
        text = re.sub(r"\s+", " ", text).strip()
        if not text:
            return []

        chunks = []
        start, chunk_index = 0, 0
        while start < len(text):
            end = start + self.chunk_size
            chunk_text = text[start:end]

            # Try to break at sentence boundary
            if end < len(text):
                last_period = chunk_text.rfind(". ")
                if last_period > self.chunk_size // 2:
                    chunk_text = chunk_text[: last_period + 1]
                    end = start + last_period + 1

            if chunk_text.strip():
                chunks.append(
                    DocumentChunk(
                        text=chunk_text.strip(),
                        chunk_index=chunk_index,
                        document_id=document_id,
                        document_title=document_title,
                        page_number=page_number,
                    )
                )
                chunk_index += 1

            start = end - self.chunk_overlap
            if start >= len(text):
                break

        return chunks

    def embed_chunks(self, chunks: List[DocumentChunk]) -> List[DocumentChunk]:
        """Generate embeddings for all chunks"""
        texts = [c.text for c in chunks]
        embeddings = self.embedding_model.encode(texts, show_progress_bar=False)
        for chunk, embedding in zip(chunks, embeddings):
            chunk.embedding = embedding.tolist()
        return chunks

    async def process_document(
        self,
        file_bytes: bytes,
        filename: str,
        document_id: str,
        document_title: str,
    ) -> List[dict]:
        """Full pipeline: extract → chunk → embed → return chunk dicts"""
        ext = filename.lower().split(".")[-1]

        if ext == "pdf":
            pages = self.extract_text_from_pdf(file_bytes)
        elif ext in ("docx", "doc"):
            pages = self.extract_text_from_docx(file_bytes)
        elif ext == "txt":
            pages = self.extract_text_from_txt(file_bytes)
        else:
            raise ValueError(f"Unsupported file type: {ext}")

        all_chunks = []
        for text, page_num in pages:
            chunks = self.chunk_text(text, page_num, document_id, document_title)
            all_chunks.extend(chunks)

        # Embed in thread pool to avoid blocking the event loop
        loop = asyncio.get_event_loop()
        all_chunks = await loop.run_in_executor(
            None, self.embed_chunks, all_chunks
        )

        return [
            {
                "text": c.text,
                "chunk_index": c.chunk_index,
                "document_id": c.document_id,
                "document_title": c.document_title,
                "page_number": c.page_number,
                "embedding": c.embedding,
            }
            for c in all_chunks
        ]

    # ─────────────────── Retrieval ───────────────────

    def retrieve_relevant_chunks(
        self,
        query: str,
        all_chunks: List[dict],
        top_k: Optional[int] = None,
    ) -> List[dict]:
        """Find most relevant chunks for a query using cosine similarity"""
        if not all_chunks:
            return []

        top_k = top_k or self.top_k
        query_embedding = self.embedding_model.encode([query])[0].reshape(1, -1)
        chunk_embeddings = np.array([c["embedding"] for c in all_chunks])

        similarities = cosine_similarity(query_embedding, chunk_embeddings)[0]
        top_indices = np.argsort(similarities)[::-1][:top_k]

        results = []
        for idx in top_indices:
            chunk = dict(all_chunks[idx])
            chunk["similarity_score"] = float(similarities[idx])
            results.append(chunk)

        return results

    # ─────────────────── Generation (Groq) ───────────────────

    async def generate_answer(
        self,
        query: str,
        relevant_chunks: List[dict],
        conversation_history: Optional[List[dict]] = None,
    ) -> dict:
        """Generate answer using retrieved context + Groq LLM"""

        if not relevant_chunks:
            return {
                "answer": "I couldn't find relevant information in the uploaded documents. Please try rephrasing your question or upload relevant study materials.",
                "sources": [],
                "confidence": 0.0,
            }

        # Build context from retrieved chunks
        context_parts = []
        sources = []
        for i, chunk in enumerate(relevant_chunks, start=1):
            context_parts.append(
                f"[Source {i} - {chunk['document_title']}, Page {chunk.get('page_number', 'N/A')}]\n{chunk['text']}"
            )
            sources.append({
                "document_title": chunk["document_title"],
                "document_id": chunk["document_id"],
                "page_number": chunk.get("page_number"),
                "similarity_score": chunk.get("similarity_score", 0),
                "excerpt": chunk["text"][:200] + "...",
            })

        context = "\n\n---\n\n".join(context_parts)

        system_prompt = """You are StudyHive AI, an intelligent study assistant that helps students understand their course materials.

You have access to excerpts from study documents uploaded by students. Your role is to:
1. Answer questions accurately based on the provided context
2. Cite specific sources when referencing information (e.g. "According to [Source 1]...")
3. Explain concepts clearly and at a student-friendly level
4. If the context doesn't fully answer the question, acknowledge this honestly
5. Help students understand the material deeply, not just give surface answers

Always be encouraging and educational in your responses."""

        # Build messages list — include last 3 turns of history for context
        messages = [{"role": "system", "content": system_prompt}]

        if conversation_history:
            for msg in conversation_history[-6:]:  # last 3 turns (user + assistant)
                messages.append({"role": msg["role"], "content": msg["content"]})

        messages.append({
            "role": "user",
            "content": (
                f"Based on the following study materials, please answer my question.\n\n"
                f"STUDY MATERIALS:\n{context}\n\n"
                f"MY QUESTION: {query}\n\n"
                f"Please provide a comprehensive answer based on the study materials above. "
                f"Cite specific sources when relevant."
            ),
        })

        # Groq is synchronous — run in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: self.groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages,
                max_tokens=1500,
                temperature=0.4,      # lower = more factual, less creative
                top_p=0.9,
            ),
        )

        answer_text = response.choices[0].message.content
        avg_confidence = float(np.mean([c.get("similarity_score", 0) for c in relevant_chunks]))

        return {
            "answer": answer_text,
            "sources": sources,
            "confidence": avg_confidence,
            "tokens_used": response.usage.completion_tokens,
            "model": GROQ_MODEL,
        }

    async def answer_question(
        self,
        query: str,
        chunks_from_db: List[dict],
        conversation_history: Optional[List[dict]] = None,
    ) -> dict:
        """Full RAG pipeline: retrieve relevant chunks → generate answer"""
        relevant_chunks = self.retrieve_relevant_chunks(query, chunks_from_db)
        return await self.generate_answer(query, relevant_chunks, conversation_history)


# Singleton instance used by the routes
rag_service = RAGService()
