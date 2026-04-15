import { useState } from "react";
import { MentionInput } from "./MentionInput.js";
import type { ParticipantInfo } from "./participants.js";

/** Standalone test harness for MentionInput — no document model needed */
export function MentionInputTest() {
  const [log, setLog] = useState<string[]>([]);

  const participants: ParticipantInfo[] = [
    {
      id: "agent-1",
      name: "Connect Agent",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=CA",
      isAgent: true,
      removed: false,
    },
    {
      id: "user-bob",
      name: "Bob Smith",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=BS",
      isAgent: false,
      removed: false,
    },
    {
      id: "user-carol",
      name: "Carol Wu",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=CW",
      isAgent: false,
      removed: false,
    },
    {
      id: "agent-2",
      name: "Research Agent",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=RA",
      isAgent: true,
      removed: false,
    },
  ];

  const handleSubmit = (text: string, mentionedIds: string[]) => {
    const entry = `[${new Date().toLocaleTimeString()}] text="${text}" mentioned=[${mentionedIds.join(", ")}]`;
    setLog((prev) => [entry, ...prev]);
  };

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", fontFamily: "system-ui, sans-serif" }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
        MentionInput Test Harness
      </h2>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
        Type <code>@</code> to mention. Arrow keys to navigate. Enter/Tab to select.
        Ctrl+Enter to submit. Backspace to delete pills.
      </p>

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 16,
          background: "#fff",
        }}
      >
        <MentionInput
          participants={participants}
          onSubmit={handleSubmit}
          placeholder="Try typing @ to mention someone..."
        />
      </div>

      <div style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: "#374151" }}>
          Submit log
        </h3>
        {log.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            No submissions yet — press Ctrl+Enter to submit
          </p>
        ) : (
          <div
            style={{
              fontSize: 12,
              fontFamily: "monospace",
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              padding: 12,
              maxHeight: 200,
              overflowY: "auto",
            }}
          >
            {log.map((entry, i) => (
              <div key={i} style={{ marginBottom: 4 }}>
                {entry}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
