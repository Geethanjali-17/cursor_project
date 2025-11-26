import { useEffect, useMemo, useState } from "react";
import { fetchDashboardSummary } from "../api";
import type { DashboardSummary, Expense } from "../types";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DashboardProps {
  refreshToken: number;
}

export function Dashboard({ refreshToken }: DashboardProps) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const data = await fetchDashboardSummary();
        if (!cancelled) setSummary(data);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  const dailySeries = useMemo(() => {
    if (!summary) return [];
    const byDate = new Map<string, number>();
    summary.recent_expenses.forEach((e: Expense) => {
      const key = e.expense_date;
      byDate.set(key, (byDate.get(key) ?? 0) + e.amount);
    });
    return Array.from(byDate.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [summary]);

  return (
    <section className="glass-panel flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-slate-700/60 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-50">
            Spending Overview
          </h2>
          <p className="text-xs text-slate-400">
            Live view of your daily and monthly spending, powered by your chat.
          </p>
        </div>
        {isLoading && (
          <span className="text-xs text-slate-400">Refreshing…</span>
        )}
      </header>

      <div className="grid grid-cols-2 gap-4 border-b border-slate-700/60 px-6 py-4">
        <div className="rounded-2xl bg-slate-900/70 p-4 shadow-inner">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Today&apos;s Spend
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-50">
            ${summary?.today_total.toFixed(2) ?? "0.00"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Everything you&apos;ve added for today.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-900/70 p-4 shadow-inner">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            This Month
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-50">
            ${summary?.month_total.toFixed(2) ?? "0.00"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            All expenses recorded in the current month.
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="glass-panel flex-1 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Recent Daily Totals
          </p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySeries}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1f2937"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  style={{ fontSize: "0.7rem" }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  style={{ fontSize: "0.7rem" }}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#020617",
                    borderColor: "#1f2937",
                    borderRadius: "0.75rem",
                    fontSize: "0.75rem",
                  }}
                  formatter={(value) => [`$${value}`, "Total spend"]}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#6366F1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSpend)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel max-h-48 flex-1 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-700/60 px-4 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Most Recent Expenses
            </p>
          </div>
          <div className="scroll-thin max-h-40 overflow-y-auto px-4 py-2 text-xs">
            {summary?.recent_expenses.length ? (
              summary.recent_expenses.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between border-b border-slate-800/80 py-1 last:border-0"
                >
                  <div>
                    <p className="font-medium text-slate-100">{e.merchant}</p>
                    <p className="text-[0.7rem] text-slate-400">
                      {e.category || "Uncategorized"} · {e.expense_date}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-300">
                    ${e.amount.toFixed(2)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-slate-500">
                As you add expenses in the chat, they&apos;ll appear here.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}


