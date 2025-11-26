from __future__ import annotations

from datetime import date
from typing import List

from .llm_client import llm_client
from .schemas import ParsedExpense


async def parse_expenses_from_message(message: str) -> List[ParsedExpense]:
    """
    Use the LLM client to semantically understand the message and convert it
    into structured expense objects. We deliberately avoid regex-based templates
    or brittle rule systems and instead rely on model reasoning.
    """
    raw_expenses = await llm_client.extract_expenses(message)

    parsed: list[ParsedExpense] = []
    today = date.today()

    for item in raw_expenses:
        try:
            pe = ParsedExpense(
                merchant=item.get("merchant") or "",
                amount=float(item.get("amount")),
                currency=item.get("currency"),
                category=item.get("category"),
                note=item.get("note"),
                expense_date=item.get("expense_date") or today,
            )
            # Coerce string dates if necessary
            if isinstance(pe.expense_date, str):
                pe.expense_date = date.fromisoformat(pe.expense_date)
            if not pe.expense_date:
                pe.expense_date = today
            parsed.append(pe)
        except Exception:
            # Skip malformed entries; we trust the model but don't crash on bad outputs.
            continue

    return parsed


