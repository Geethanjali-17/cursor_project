from datetime import date
import sys
from pathlib import Path

from fastapi.testclient import TestClient


ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.main import app  # type: ignore  # noqa: E402
from backend import llm_client as llm_module  # type: ignore  # noqa: E402


client = TestClient(app)


def test_chat_parses_and_saves_expenses(monkeypatch):
    async def fake_extract_expenses(message: str):
        # Simulate the LLM understanding a casual message
        return [
            {
                "merchant": "Walmart",
                "amount": 70,
                "currency": "USD",
                "category": "groceries",
                "note": "weekly groceries",
                "expense_date": date.today().isoformat(),
            },
            {
                "merchant": "Apple",
                "amount": 20,
                "currency": "USD",
                "category": "subscriptions",
                "note": "Apple subscriptions",
                "expense_date": date.today().isoformat(),
            },
        ]

    # Patch the LLM client so tests don't hit the real OpenAI API.
    monkeypatch.setattr(llm_module.llm_client, "extract_expenses", fake_extract_expenses)

    resp = client.post(
        "/chat",
        json={"message": "I spent 70 dollars at Walmart and 20 on Apple subscriptions"},
    )

    assert resp.status_code == 200
    body = resp.json()

    # The assistant should confirm and persist both expenses.
    assert "I've added these expenses" in body["reply"]
    assert len(body["expenses"]) == 2
    merchants = {e["merchant"] for e in body["expenses"]}
    assert {"Walmart", "Apple"}.issubset(merchants)


def test_chat_gracefully_handles_llm_rate_limits(monkeypatch):
    async def fake_extract_expenses(_message: str):
        # Simulate LLM returning no data, e.g. due to temporary issues.
        return []

    monkeypatch.setattr(llm_module.llm_client, "extract_expenses", fake_extract_expenses)

    resp = client.post(
        "/chat",
        json={"message": "Just chatting, no real expenses here"},
    )

    assert resp.status_code == 200
    body = resp.json()

    # When no expenses are found, we should respond clearly but not error.
    assert body["expenses"] == []
    assert "didn't clearly see any expenses" in body["reply"]


