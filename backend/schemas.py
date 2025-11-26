from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ExpenseCreate(BaseModel):
    merchant: str
    amount: float
    currency: str = "USD"
    category: Optional[str] = None
    note: Optional[str] = None
    expense_date: date


class ExpenseRead(ExpenseCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ChatMessage(BaseModel):
    message: str = Field(..., description="Raw user message in natural language")


class ParsedExpense(BaseModel):
    merchant: str
    amount: float
    currency: str | None = None
    category: str | None = None
    note: str | None = None
    expense_date: date | None = None


class ChatResponse(BaseModel):
    reply: str
    expenses: List[ExpenseRead]


class AnalyticsSummary(BaseModel):
    date: date
    total: float


class DashboardSummary(BaseModel):
    today_total: float
    month_total: float
    recent_expenses: list[ExpenseRead]


