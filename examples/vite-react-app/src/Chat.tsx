import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSpritz } from "./SpritzContext";
import type { PublicChannel, ChannelMessage } from "@spritz-labs/sdk";
import "./Chat.css";

const POLL_INTERVAL_MS = 5000;

export function Chat() {
  const { client, isAuthenticated, logout } = useSpritz();
  const navigate = useNavigate();
  const [channels, setChannels] = useState<PublicChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<PublicChannel | null>(null);
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [input, setInput] = useState("");
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
  }, [isAuthenticated, navigate]);

  const loadChannels = useCallback(async () => {
    if (!client) return;
    setLoadingChannels(true);
    setError(null);
    try {
      const { channels: list } = await client.channels.list();
      setChannels(list);
      if (list.length && !selectedChannel) setSelectedChannel(list[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load channels");
    } finally {
      setLoadingChannels(false);
    }
  }, [client, selectedChannel]);

  useEffect(() => {
    if (client && isAuthenticated) loadChannels();
  }, [client, isAuthenticated, loadChannels]);

  const loadMessages = useCallback(async () => {
    if (!client || !selectedChannel) return;
    setLoadingMessages(true);
    try {
      const { messages: list } = await client.channels.getMessages(selectedChannel.id, {
        limit: 50,
        messagingType: selectedChannel.messaging_type ?? "standard",
      });
      setMessages(list);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [client, selectedChannel]);

  useEffect(() => {
    if (!selectedChannel) return;
    loadMessages();
    const id = setInterval(loadMessages, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [selectedChannel, loadMessages]);

  const handleJoin = async (ch: PublicChannel) => {
    if (!client || ch.is_member) return;
    try {
      await client.channels.join(ch.id);
      await loadChannels();
      setSelectedChannel(ch);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join");
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!client || !selectedChannel || !text || sending) return;
    setSending(true);
    setError(null);
    try {
      await client.channels.sendMessage(
        selectedChannel.id,
        {
          content: text,
          messagingType: selectedChannel.messaging_type ?? "standard",
        }
      );
      setInput("");
      await loadMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  if (!isAuthenticated) return null;

  return (
    <div className="chat-layout">
      <header className="chat-header">
        <h1>Spritz Chat</h1>
        <button type="button" className="logout-btn" onClick={handleLogout}>
          Sign out
        </button>
      </header>

      <div className="chat-body">
        <aside className="channel-list">
          <h2>Channels</h2>
          {loadingChannels ? (
            <p className="muted">Loading…</p>
          ) : (
            <ul>
              {channels.map((ch) => (
                <li key={ch.id}>
                  <button
                    type="button"
                    className={selectedChannel?.id === ch.id ? "active" : ""}
                    onClick={() => setSelectedChannel(ch)}
                  >
                    <span className="emoji">{ch.emoji}</span>
                    <span className="name">{ch.name}</span>
                    {!ch.is_member && (
                      <span
                        className="join"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoin(ch);
                        }}
                      >
                        Join
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main className="chat-main">
          {selectedChannel ? (
            <>
              <div className="channel-title">
                <span className="emoji">{selectedChannel.emoji}</span>
                {selectedChannel.name}
                {selectedChannel.description && (
                  <span className="muted desc"> — {selectedChannel.description}</span>
                )}
              </div>

              {error && <p className="error inline">{error}</p>}

              <div className="messages">
                {loadingMessages ? (
                  <p className="muted">Loading messages…</p>
                ) : messages.length === 0 ? (
                  <p className="muted">No messages yet. Say hello!</p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="message">
                      <span className="sender">
                        {msg.sender_address.slice(0, 6)}…{msg.sender_address.slice(-4)}
                      </span>
                      <span className="content">{msg.content}</span>
                      <span className="time">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {selectedChannel.is_member !== false ? (
                <form onSubmit={handleSend} className="send-form">
                  <input
                    type="text"
                    placeholder="Type a message…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={sending}
                  />
                  <button type="submit" disabled={sending || !input.trim()}>
                    {sending ? "Sending…" : "Send"}
                  </button>
                </form>
              ) : (
                <p className="muted">Join this channel to send messages.</p>
              )}
            </>
          ) : (
            <p className="muted">Select a channel or join one to start chatting.</p>
          )}
        </main>
      </div>
    </div>
  );
}
