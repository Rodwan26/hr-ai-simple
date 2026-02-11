import os
import hashlib
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import UploadFile
from app.services.base import BaseService
from app.services.ai_orchestrator import AIOrchestrator, AIDomain
from app.core.cache import cache_ai_response
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.services.embedding_service import generate_embeddings, hybrid_search

class DocumentService(BaseService):
    """Domain service for handling documents and search."""

    @cache_ai_response(AIDomain.DOCUMENTS)
    def query(self, question: str, organization_id: int, top_k: int = 5) -> Dict[str, Any]:
        self.log_info(f"Querying documents for organization {organization_id}: {question[:50]}...")
        
        query_embeddings = generate_embeddings([question], self.db)
        if not query_embeddings:
            return {"answer": "Error generating embeddings.", "sources": []}
            
        # hybrid_search will need to be updated to take organization_id instead of company_id
        results = hybrid_search(question, query_embeddings[0], organization_id, self.db, top_k)
        if not results:
            return {"answer": "No relevant info found.", "sources": []}
            
        context = "\n\n".join([r["chunk_text"] for r in results])
        system_prompt = "You are a professional HR assistant. Answer based on the context. Cite sources."
        user_content = f"Context:\n{context}\n\nQuestion: {question}"
        
        try:
            answer = AIOrchestrator.call_model(
                [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_content}],
                temperature=0.3,
                domain=AIDomain.DOCUMENTS,
                json_output=False
            )
            return {
                "answer": answer,
                "sources": [{"doc_id": r["document_id"], "filename": r.get("filename", "??")} for r in results]
            }
        except Exception as e:
            self.log_error(f"RAG Error: {e}")
            return {"answer": "Error generating answer.", "sources": []}
