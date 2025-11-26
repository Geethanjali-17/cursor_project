import { FormEvent, useMemo, useRef, useState } from "react";
import { sendChatMessage } from "../api";
import type { ChatMessage } from "../types";

interface ChatPanelProps {
  onExpensesAdded?: () => void;
}

export function ChatPanel({ onExpensesAdded }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! Tell me about what you spent, in your own words. For example: “I spent 70 dollars at Walmart and 20 on Apple subscriptions yesterday.”",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const orderedMessages = useMemo(
    () => [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [messages]
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const response = await sendChatMessage(trimmed);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.reply,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      if (response.expenses.length && onExpensesAdded) {
        onExpensesAdded();
      }
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "Hmm, something went wrong while talking to the expense brain. Please try again in a moment.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      });
    }
  }

  return (
    <section className="glass-panel flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-slate-700/60 px-5 py-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-50">
            Expense Assistant
          </h1>
          <p className="text-xs text-slate-400">
            Chat naturally, I&apos;ll handle the categories, dates, and reports.
          </p>
        </div>
        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
          Live · GPT
        </span>
      </header>

      <div
        ref={scrollRef}
        className="scroll-thin flex-1 space-y-3 overflow-y-auto px-5 py-4"
      >
        {orderedMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                msg.role === "user"
                  ? "bg-primary-600 text-slate-50"
                  : "bg-slate-800/80 text-slate-100"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex justify-start">
            <div className="max-w-[70%] rounded-2xl bg-slate-800/80 px-4 py-3 text-sm text-slate-300">
              Thinking about how to record that…
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-slate-700/60 p-4"
      >
        <div className="flex gap-3">
          <textarea
            rows={2}
            className="min-h-[44px] flex-1 resize-none rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none ring-primary-500/40 placeholder:text-slate-500 focus:border-primary-500 focus:ring-2"
            placeholder='e.g. "I spent 70 dollars at Walmart and 20 on Apple subscriptions yesterday"'
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="inline-flex h-[44px] items-center rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white shadow-lg shadow-primary-600/30 transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {isSending ? "Sending…" : "Send"}
          </button>
        </div>
      </form>
    </section>
  );
}


