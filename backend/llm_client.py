from __future__ import annotations

import json
import logging
from typing import Any, List

import httpx
from httpx import HTTPStatusError, RequestError

from .config import settings

logger = logging.getLogger(__name__)


class LLMClient:
    """
    Thin wrapper around an LLM API (e.g. OpenAI) used exclusively for semantic
    understanding and structured extraction, not hand-written parsing rules.
    """

    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or settings.openai_api_key
        self.model = model or settings.openai_model

    async def extract_expenses(self, message: str) -> List[dict[str, Any]]:
        """
        Ask the LLM to read the user's free-form message and output a clean,
        structured list of expense objects as JSON.
        """
        if not self.api_key:
            # In dev mode without an API key, return an empty list rather than guessing.
            return []

        system_prompt = (
            "You are an expense tracking assistant. The user will send casual, "
            "free-form messages about things they spent money on.\n"
            "Your job is to understand their natural language using reasoning and "
            "output a pure JSON array called 'expenses'.\n\n"
            "Each expense must have:\n"
            "- merchant: short merchant or store name\n"
            "- amount: number (no currency symbol)\n"
            "- currency: 3-letter code if you can infer it, otherwise null\n"
            "- category: short category label you infer (e.g. groceries, rent, travel)\n"
            "- note: any extra descriptive text\n"
            "- expense_date: ISO date (YYYY-MM-DD) if mentioned; if no date is "
            "clearly stated, use today's date based on the user's perspective.\n\n"
            "Important:\n"
            "- The user may mix chit-chat with spending details.\n"
            "- There may be multiple expenses in one message.\n"
            "- Ignore non-spending parts of the message.\n"
            "- Be robust to typos, slang, and varied phrasing.\n"
            "- Do NOT invent expenses that are not clearly implied.\n"
            "- Output strictly valid JSON with the shape: {\"expenses\": [ ... ]} "
            "and nothing else."
        )

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message},
            ],
            "response_format": {"type": "json_object"},
        }
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                resp.raise_for_status()
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
        except HTTPStatusError as exc:
            # If we are rate limited or otherwise rejected by the API,
            # log it and degrade gracefully instead of crashing the app.
            logger.warning(
                "LLM HTTP error while extracting expenses: %s (status=%s)",
                exc,
                exc.response.status_code if exc.response else None,
            )
            return []
        except RequestError as exc:
            logger.warning("LLM network error while extracting expenses: %s", exc)
            return []

        try:
            parsed = json.loads(content)
            expenses = parsed.get("expenses") or []
            if not isinstance(expenses, list):
                return []
            return expenses
        except Exception:
            # If the LLM returns something unexpected, fail gracefully.
            return []


llm_client = LLMClient()


