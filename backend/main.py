from __future__ import annotations

from datetime import date
from typing import List

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, extract
from sqlalchemy.orm import Session

from .config import settings
from .database import Base, engine, get_db
from .expense_parser import parse_expenses_from_message
from .models import Expense
from .schemas import (
    ChatMessage,
    ChatResponse,
    DashboardSummary,
    ExpenseCreate,
    ExpenseRead,
)

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(
    payload: ChatMessage,
    db: Session = Depends(get_db),
):
    """
    Core chat endpoint.
    - Uses LLM reasoning to interpret the message and extract expenses.
    - Persists those expenses.
    - Returns a friendly natural-language confirmation plus the structured records.
    """
    parsed_expenses = await parse_expenses_from_message(payload.message)

    saved_expenses: List[Expense] = []

    for pe in parsed_expenses:
        expense = Expense(
            merchant=pe.merchant,
            amount=pe.amount,
            currency=pe.currency or "USD",
            category=pe.category,
            note=pe.note,
            expense_date=pe.expense_date or date.today(),
        )
        db.add(expense)
        saved_expenses.append(expense)

    db.commit()

    for e in saved_expenses:
        db.refresh(e)

    if saved_expenses:
        parts = []
        for e in saved_expenses:
            when = e.expense_date.strftime("%Y-%m-%d")
            currency = e.currency or "USD"
            parts.append(f"{e.amount:.2f} {currency} at {e.merchant} on {when}")
        summary = "; ".join(parts)
        reply = (
            "Got it! I've added these expenses to your tracker: "
            f"{summary}. Your dashboards and reports are now up to date."
        )
    else:
        reply = (
            "I didn't clearly see any expenses in that message. "
            "You can say things like “I spent 70 dollars at Walmart and 20 on Apple subscriptions.”"
        )

    return ChatResponse(
        reply=reply,
        expenses=[
            ExpenseRead.from_orm(e)  # type: ignore[arg-type]
            for e in saved_expenses
        ],
    )


@app.get("/expenses/recent", response_model=List[ExpenseRead])
def get_recent_expenses(limit: int = 20, db: Session = Depends(get_db)):
    q = (
        db.query(Expense)
        .order_by(Expense.expense_date.desc(), Expense.created_at.desc())
        .limit(limit)
    )
    return [ExpenseRead.from_orm(e) for e in q.all()]  # type: ignore[arg-type]


@app.get("/dashboard/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    today = date.today()

    today_total = (
        db.query(func.coalesce(func.sum(Expense.amount), 0.0))
        .filter(Expense.expense_date == today)
        .scalar()
        or 0.0
    )

    month_total = (
        db.query(func.coalesce(func.sum(Expense.amount), 0.0))
        .filter(extract("year", Expense.expense_date) == today.year)
        .filter(extract("month", Expense.expense_date) == today.month)
        .scalar()
        or 0.0
    )

    recent = (
        db.query(Expense)
        .order_by(Expense.expense_date.desc(), Expense.created_at.desc())
        .limit(10)
        .all()
    )

    return DashboardSummary(
        today_total=today_total,
        month_total=month_total,
        recent_expenses=[ExpenseRead.from_orm(e) for e in recent],  # type: ignore[arg-type]
    )


