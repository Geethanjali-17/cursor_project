import { useState } from "react";
import { ChatPanel } from "./components/ChatPanel";
import { Dashboard } from "./components/Dashboard";

function App() {
  const [refreshToken, setRefreshToken] = useState(0);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <header className="border-b border-slate-800/80 bg-slate-950/70 px-8 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary-600 text-lg font-bold text-white shadow-lg shadow-primary-600/40">
              ₿
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-slate-50">
                LLM Expense Console
              </h1>
              <p className="text-xs text-slate-400">
                Chat-first, AI-native expense tracking and insights.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="hidden md:inline">
              Model: <span className="font-medium text-slate-200">GPT</span>
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(52,211,153,0.25)]" />
            <span className="font-medium text-emerald-300">Connected</span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 gap-5 p-5">
        <div className="flex w-full flex-col gap-5 lg:flex-row">
          <div className="h-[520px] flex-1">
            <ChatPanel
              onExpensesAdded={() =>
                setRefreshToken((token) => token + 1)
              }
            />
          </div>
          <div className="h-[520px] flex-1">
            <Dashboard refreshToken={refreshToken} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;


