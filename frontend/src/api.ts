import axios from "axios";
import type { ChatResponse, DashboardSummary } from "./types";

const API_BASE = "http://localhost:8000";

export async function sendChatMessage(message: string): Promise<ChatResponse> {
  const { data } = await axios.post<ChatResponse>(`${API_BASE}/chat`, {
    message,
  });
  return data;
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await axios.get<DashboardSummary>(
    `${API_BASE}/dashboard/summary`
  );
  return data;
}


