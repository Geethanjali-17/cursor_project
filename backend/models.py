from datetime import datetime, date

from sqlalchemy import Column, Integer, String, Date, DateTime, Float

from .database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    merchant = Column(String, index=True, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    category = Column(String, nullable=True)
    note = Column(String, nullable=True)
    expense_date = Column(Date, default=date.today, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


