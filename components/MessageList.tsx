import type { ChatResponse } from "@/shared/types/chat";
import ProductCard from "./ProductCard";
import DebugPanel from "./DebugPanel";

interface Message {
  role: "user" | "assistant";
  text?: string;
  response?: ChatResponse;
}

interface Props {
  messages: Message[];
}

export default function MessageList({ messages }: Props) {
  if (messages.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 w-full">
      {messages.map((msg, i) => {
        if (msg.role === "user") {
          return (
            <div key={i} className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-2.5 text-sm text-white">
                {msg.text}
              </div>
            </div>
          );
        }

        const r = msg.response!;
        return (
          <div key={i} className="flex flex-col gap-3">
            <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-2.5 text-sm text-gray-800 leading-relaxed">
              {r.assistantMessage}
            </div>
            {r.recommendations.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-1">
                {r.recommendations.map((rec) => (
                  <ProductCard key={rec.product.id} recommendation={rec} />
                ))}
              </div>
            )}
            {r.recommendations.length === 0 && (
              <p className="text-sm text-gray-500 italic">
                No matching products found. Try adjusting your criteria.
              </p>
            )}
            {r.debug && <DebugPanel debug={r.debug} />}
          </div>
        );
      })}
    </div>
  );
}

export type { Message };
