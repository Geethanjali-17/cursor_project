export interface Expense {
  id: number;
  merchant: string;
  amount: number;
  currency: string;
  category?: string | null;
  note?: string | null;
  expense_date: string;
  created_at: string;
}

export interface ChatResponse {
  reply: string;
  expenses: Expense[];
}

export interface DashboardSummary {
  today_total: number;
  month_total: number;
  recent_expenses: Expense[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}


