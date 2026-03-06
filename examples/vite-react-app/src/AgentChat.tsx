import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSpritz } from "./SpritzContext";
import type { Agent, AgentChatStreamEvent } from "@spritzlabs/sdk";
import "./AgentChat.css";

const DEFAULT_AGENT_ID = import.meta.env.VITE_SPRITZ_AGENT_ID ?? "";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function AgentChat() {
  const { client } = useSpritz();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [agentId, setAgentId] = useState(DEFAULT_AGENT_ID);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingAgent, setLoadingAgent] = useState(false);

  const loadAgent = useCallback(async () => {
    if (!client || !agentId.trim()) return;
    setLoadingAgent(true);
    setError(null);
    setAgent(null);
    setMessages([]);
    setSessionId(undefined);
    try {
      const data = await client.agents.get(agentId.trim());
      setAgent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load agent");
    } finally {
      setLoadingAgent(false);
    }
  }, [client, agentId]);

  useEffect(() => {
    if (agentId.trim()) loadAgent();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!client || !agent || !text || streaming) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setStreaming(true);
    setStreamingText("");

    try {
      let fullText = "";
      const stream = client.agents.chatStream(agent.id, {
        message: text,
        sessionId,
      });

      for await (const event of stream as AsyncIterable<AgentChatStreamEvent>) {
        if (event.type === "chunk") {
          fullText += event.text;
          setStreamingText(fullText);
        } else if (event.type === "done") {
          setSessionId(event.sessionId);
          setMessages((prev) => [...prev, { role: "assistant", content: event.message }]);
          setStreamingText("");
        } else if (event.type === "error") {
          setError(event.error);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setStreaming(false);
      setStreamingText("");
    }
  };

  const handleLoadAgent = (e: React.FormEvent) => {
    e.preventDefault();
    loadAgent();
  };

  return (
    <div className="agent-layout">
      <header className="agent-header">
        <div className="agent-header-brand">
          <span className="agent-header-logo">Spritz</span>
          <span className="agent-header-tagline">Agent Chat</span>
        </div>
        <Link to="/chat" className="btn btn-ghost">
          Channel Chat
        </Link>
      </header>

      <div className="agent-body">
        <aside className="agent-sidebar">
          <form onSubmit={handleLoadAgent} className="agent-id-form">
            <label className="agent-id-label">Agent ID</label>
            <input
              type="text"
              className="agent-id-input"
              placeholder="Paste an agent ID..."
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-load" disabled={loadingAgent || !agentId.trim()}>
              {loadingAgent ? "Loading..." : "Load Agent"}
            </button>
          </form>

          {agent && (
            <div className="agent-info-card">
              <div className="agent-info-avatar">{agent.avatar_emoji || "🤖"}</div>
              <h3 className="agent-info-name">{agent.name}</h3>
              {agent.personality && (
                <p className="agent-info-personality">{agent.personality}</p>
              )}
              {agent.tags && agent.tags.length > 0 && (
                <div className="agent-info-tags">
                  {agent.tags.map((tag) => (
                    <span key={tag} className="agent-tag">{tag}</span>
                  ))}
                </div>
              )}
              {agent.suggested_questions && agent.suggested_questions.length > 0 && (
                <div className="agent-suggestions">
                  <span className="agent-suggestions-label">Try asking:</span>
                  {agent.suggested_questions.map((q, i) => (
                    <button
                      key={i}
                      type="button"
                      className="agent-suggestion-btn"
                      onClick={() => {
                        setInput(q);
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
              {sessionId && (
                <div className="agent-session">
                  <span className="agent-session-label">Session</span>
                  <code className="agent-session-id">{sessionId.slice(0, 16)}...</code>
                </div>
              )}
            </div>
          )}
        </aside>

        <main className="agent-main">
          {!agent ? (
            <div className="agent-welcome">
              <div className="agent-welcome-inner">
                <h2 className="agent-welcome-title">Chat with an AI Agent</h2>
                <p className="agent-welcome-subtitle">
                  Enter an agent ID in the sidebar to start a conversation. Agent chat supports real-time streaming responses.
                </p>
                {error && (
                  <div className="banner banner-error" role="alert">{error}</div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="agent-chat-header">
                <span className="agent-chat-emoji">{agent.avatar_emoji || "🤖"}</span>
                <div className="agent-chat-header-info">
                  <h1 className="agent-chat-name">{agent.name}</h1>
                  {agent.personality && (
                    <p className="agent-chat-personality">{agent.personality}</p>
                  )}
                </div>
              </div>

              {error && (
                <div className="banner banner-error" role="alert">{error}</div>
              )}

              <div className="agent-messages-wrap">
                {messages.length === 0 && !streaming ? (
                  <div className="agent-messages-empty">
                    <p className="agent-messages-empty-title">Start chatting with {agent.name}</p>
                    <p className="agent-messages-empty-hint">
                      Type a message below to begin. Responses stream in real time.
                    </p>
                  </div>
                ) : (
                  <div className="agent-messages">
                    {messages.map((msg, i) => (
                      <div key={i} className={`agent-message agent-message-${msg.role}`}>
                        <div className="agent-message-avatar">
                          {msg.role === "assistant" ? (agent.avatar_emoji || "🤖") : "You"}
                        </div>
                        <div className="agent-message-body">
                          <div className="agent-message-sender">
                            {msg.role === "assistant" ? agent.name : "You"}
                          </div>
                          <div className="agent-message-content">{msg.content}</div>
                        </div>
                      </div>
                    ))}
                    {streaming && streamingText && (
                      <div className="agent-message agent-message-assistant">
                        <div className="agent-message-avatar">{agent.avatar_emoji || "🤖"}</div>
                        <div className="agent-message-body">
                          <div className="agent-message-sender">{agent.name}</div>
                          <div className="agent-message-content agent-message-streaming">
                            {streamingText}
                            <span className="agent-cursor" />
                          </div>
                        </div>
                      </div>
                    )}
                    {streaming && !streamingText && (
                      <div className="agent-message agent-message-assistant">
                        <div className="agent-message-avatar">{agent.avatar_emoji || "🤖"}</div>
                        <div className="agent-message-body">
                          <div className="agent-message-sender">{agent.name}</div>
                          <div className="agent-message-content agent-message-thinking">
                            Thinking...
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <form onSubmit={handleSend} className="agent-composer">
                <textarea
                  placeholder={`Message ${agent.name}...`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (input.trim() && !streaming) handleSend(e as unknown as React.FormEvent);
                    }
                  }}
                  disabled={streaming}
                  rows={1}
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-send"
                  disabled={streaming || !input.trim()}
                >
                  {streaming ? "Streaming..." : "Send"}
                </button>
              </form>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
