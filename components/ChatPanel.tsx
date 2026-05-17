"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatRequest, ChatResponse } from "@/shared/types/chat";
import MessageList, { type Message } from "./MessageList";
import FollowUpChips from "./FollowUpChips";

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastFollowUps, setLastFollowUps] = useState<string[]>([]);
  const [debugMode, setDebugMode] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput("");
    setLastFollowUps([]);
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setLoading(true);

    try {
      const body: ChatRequest = { message: trimmed, debug: debugMode };
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: ChatResponse = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", response: data },
      ]);
      setLastFollowUps(data.followUps ?? []);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          response: {
            assistantMessage: "Something went wrong. Please try again.",
            recommendations: [],
            followUps: [],
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  function handleChip(chip: string) {
    send(chip);
  }

  return (
    <div className="flex flex-col w-full max-w-2xl h-[600px]">
      {/* Message area */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-4 flex flex-col gap-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 gap-3">
            <p className="text-sm">Ask about a skincare product.</p>
            <p className="text-xs">
              Example: &ldquo;I have oily sensitive skin and want SPF under 500 CZK, ideally fragrance-free.&rdquo;
            </p>
            <div className="flex flex-col gap-2 mt-1">
              {[
                "Oily sensitive skin SPF under 500 CZK",
                "Fragrance-free moisturizer for dry skin",
                "Serum for acne-prone skin under 400 CZK",
              ].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => send(prompt)}
                  disabled={loading}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs text-gray-500 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <MessageList messages={messages} />
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-sm bg-gray-200 px-4 py-2.5 text-sm text-gray-500 animate-pulse">
                  Searching…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Follow-up chips */}
      {lastFollowUps.length > 0 && !loading && (
        <FollowUpChips chips={lastFollowUps} onSelect={handleChip} />
      )}

      {/* Debug toggle */}
      <div className="flex justify-end mt-2">
        <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={debugMode}
            onChange={(e) => setDebugMode(e.target.checked)}
            className="rounded accent-amber-500"
          />
          Debug mode
        </label>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your skin type, budget, and needs…"
          className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
