"use client";

import { useState } from "react";
import type { ChatResponse } from "@/shared/types/chat";

interface Props {
  debug: NonNullable<ChatResponse["debug"]>;
}

export default function DebugPanel({ debug }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 text-xs">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
      >
        <span className="font-semibold">
          Debug — {debug.llmMode === "real" ? "🤖 Real LLM" : "🔧 Mock LLM"}
        </span>
        <span className="text-amber-500">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3 border-t border-amber-200">
          {/* LLM mode */}
          <div className="pt-2">
            <span className="font-semibold text-amber-800">LLM Mode: </span>
            <code className="bg-amber-100 px-1 rounded">{debug.llmMode}</code>
          </div>

          {/* Extracted intent */}
          <div>
            <p className="font-semibold text-amber-800 mb-1">Extracted Intent</p>
            <div className="space-y-0.5 text-amber-700">
              <div>
                <span className="text-amber-500">goal:</span>{" "}
                <code className="bg-amber-100 px-1 rounded">{debug.intent.goal}</code>
              </div>
              <div>
                <span className="text-amber-500">constraints:</span>
              </div>
              <pre className="bg-amber-100 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify(debug.intent.constraints, null, 2)}
              </pre>
            </div>
          </div>

          {/* Tool result */}
          <div>
            <p className="font-semibold text-amber-800 mb-1">
              Tool: {debug.tool.toolName}
            </p>
            <div className="text-amber-700 space-y-0.5">
              <div>
                <span className="text-amber-500">matched:</span>{" "}
                <span className="font-medium text-green-700">
                  {debug.tool.candidateCount}
                </span>{" "}
                products
              </div>
              <div>
                <span className="text-amber-500">rejected:</span>{" "}
                <span className="font-medium text-red-600">
                  {debug.tool.rejectedCount}
                </span>{" "}
                products
              </div>
              <div>
                <span className="text-amber-500">constraints passed to tool:</span>
              </div>
              <pre className="bg-amber-100 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify(debug.tool.inputConstraints, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
