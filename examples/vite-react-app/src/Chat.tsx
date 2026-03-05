import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSpritz } from "./SpritzContext";
import type { PublicChannel, ChannelMessage } from "@spritz-labs/sdk";
import "./Chat.css";

const POLL_INTERVAL_MS = 25000; // 25s – comfortable for full-screen demo (was 5s)

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : d.toLocaleDateString();
}

function shortAddress(addr: string) {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function Chat() {
  const { client, isAuthenticated, logout } = useSpritz();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [channels, setChannels] = useState<PublicChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<PublicChannel | null>(null);
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [input, setInput] = useState("");
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createCategory, setCreateCategory] = useState("general");
  const [createMessagingType, setCreateMessagingType] = useState<"standard" | "waku">("standard");
  const [creating, setCreating] = useState(false);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const joinedChannels = channels.filter((ch) => ch.is_member);
  const discoverChannels = channels.filter((ch) => !ch.is_member);

  const handleJoin = async (ch: PublicChannel) => {
    if (!client || ch.is_member) return;
    try {
      setError(null);
      const session = await client.auth.getSession();
      const userAddress = session?.userAddress ?? (session as { session?: { userAddress?: string } })?.session?.userAddress;
      if (!userAddress) {
        setError("Session missing user address. Try signing out and back in.");
        return;
      }
      await client.channels.join(ch.id, userAddress);
      await loadChannels();
      const updated = channels.map((c) => (c.id === ch.id ? { ...c, is_member: true } : c));
      setSelectedChannel(updated.find((c) => c.id === ch.id) ?? ch);
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
      await client.channels.sendMessage(selectedChannel.id, {
        content: text,
        messagingType: selectedChannel.messaging_type ?? "standard",
      });
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

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = createName.trim();
    if (!client || !name || creating) return;
    setCreating(true);
    setError(null);
    try {
      const session = await client.auth.getSession();
      const userAddress =
        session?.userAddress ??
        (session as { session?: { userAddress?: string } })?.session?.userAddress;
      if (!userAddress) {
        setError("Session missing user address. Try signing out and back in.");
        setCreating(false);
        return;
      }
      const channel = await client.channels.create({
        name,
        description: createDescription.trim() || undefined,
        category: createCategory || "general",
        messagingType: createMessagingType,
        creatorAddress: userAddress,
      });
      await client.channels.join(channel.id, userAddress);
      await loadChannels();
      setSelectedChannel(channel);
      setShowCreateModal(false);
      setCreateName("");
      setCreateDescription("");
      setCreateCategory("general");
      setCreateMessagingType("standard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create channel");
    } finally {
      setCreating(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="chat-layout">
      <header className="chat-header">
        <div className="chat-header-brand">
          <span className="chat-header-logo">Spritz</span>
          <span className="chat-header-tagline">Chat</span>
        </div>
        <button type="button" className="btn btn-ghost" onClick={handleLogout}>
          Sign out
        </button>
      </header>

      <div className="chat-body">
        <aside className="sidebar">
          <div className="sidebar-section">
            <button
              type="button"
              className="btn btn-primary btn-create"
              onClick={() => setShowCreateModal(true)}
            >
              <span className="btn-icon">+</span>
              Create channel
            </button>
          </div>

          {loadingChannels ? (
            <div className="sidebar-section">
              <div className="sidebar-loading">Loading channels…</div>
            </div>
          ) : (
            <>
              {joinedChannels.length > 0 && (
                <div className="sidebar-section">
                  <h3 className="sidebar-label">Your channels</h3>
                  <ul className="channel-list">
                    {joinedChannels.map((ch) => (
                      <li key={ch.id}>
                        <button
                          type="button"
                          className={`channel-item ${selectedChannel?.id === ch.id ? "active" : ""}`}
                          onClick={() => setSelectedChannel(ch)}
                        >
                          <span className="channel-emoji">{ch.emoji}</span>
                          <span className="channel-name">{ch.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {discoverChannels.length > 0 && (
                <div className="sidebar-section">
                  <h3 className="sidebar-label">Discover</h3>
                  <ul className="channel-list">
                    {discoverChannels.map((ch) => (
                      <li key={ch.id}>
                        <button
                          type="button"
                          className="channel-item"
                          onClick={() => setSelectedChannel(ch)}
                        >
                          <span className="channel-emoji">{ch.emoji}</span>
                          <span className="channel-name">{ch.name}</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-join"
                          onClick={() => handleJoin(ch)}
                          title="Join channel"
                        >
                          Join
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </aside>

        <main className="main">
          {selectedChannel ? (
            <>
              <div className="channel-header">
                <span className="channel-header-emoji">{selectedChannel.emoji}</span>
                <div className="channel-header-info">
                  <h1 className="channel-header-name">{selectedChannel.name}</h1>
                  {selectedChannel.description && (
                    <p className="channel-header-desc">{selectedChannel.description}</p>
                  )}
                </div>
              </div>

              {error && (
                <div className="banner banner-error" role="alert">
                  {error}
                </div>
              )}

              <div className="messages-wrap">
                {loadingMessages ? (
                  <div className="messages-loading">Loading messages…</div>
                ) : messages.length === 0 ? (
                  <div className="messages-empty">
                    <p className="messages-empty-title">No messages yet</p>
                    <p className="messages-empty-hint">
                      You’re in. Type below and press Enter to send your first message.
                    </p>
                  </div>
                ) : (
                  <div className="messages">
                    {messages.map((msg) => (
                      <div key={msg.id} className="message">
                        <div className="message-avatar">{shortAddress(msg.sender_address).slice(0, 2)}</div>
                        <div className="message-body">
                          <div className="message-meta">
                            <span className="message-sender">{shortAddress(msg.sender_address)}</span>
                            <span className="message-time">{formatTime(msg.created_at)}</span>
                          </div>
                          <div className="message-content">{msg.content}</div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {selectedChannel.is_member !== false ? (
                <form onSubmit={handleSend} className="composer">
                  <textarea
                    placeholder={`Message #${selectedChannel.name}`}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (input.trim()) handleSend(e as unknown as React.FormEvent);
                      }
                    }}
                    disabled={sending}
                    rows={1}
                  />
                  <button type="submit" className="btn btn-primary btn-send" disabled={sending || !input.trim()}>
                    {sending ? "Sending…" : "Send"}
                  </button>
                </form>
              ) : (
                <div className="composer-locked">
                  <p>Join this channel to send messages.</p>
                  <button type="button" className="btn btn-primary" onClick={() => handleJoin(selectedChannel)}>
                    Join channel
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="welcome">
              <div className="welcome-inner">
                <h2 className="welcome-title">Welcome to Spritz Chat</h2>
                <p className="welcome-subtitle">Create a channel, join one, or pick a channel from the sidebar to start.</p>
                <div className="welcome-steps">
                  <div className="welcome-step">
                    <div className="welcome-step-icon">1</div>
                    <h3>Create a channel</h3>
                    <p>Click <strong>Create channel</strong> in the sidebar to make a new chat. Name it, add a description, and invite others.</p>
                  </div>
                  <div className="welcome-step">
                    <div className="welcome-step-icon">2</div>
                    <h3>Join a channel</h3>
                    <p>Under <strong>Discover</strong>, click <strong>Join</strong> on any channel to become a member and see messages.</p>
                  </div>
                  <div className="welcome-step">
                    <div className="welcome-step-icon">3</div>
                    <h3>Send messages</h3>
                    <p>Select a channel you’ve joined, type in the box at the bottom, and press <kbd>Enter</kbd> to send.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => !creating && setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create a channel</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => !creating && setShowCreateModal(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateChannel} className="modal-form">
              <label>
                Channel name
                <input
                  type="text"
                  placeholder="e.g. dev-team"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  required
                  autoFocus
                />
              </label>
              <label>
                Description <span className="label-optional">(optional)</span>
                <input
                  type="text"
                  placeholder="What’s this channel about?"
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                />
              </label>
              <label>
                Category
                <select value={createCategory} onChange={(e) => setCreateCategory(e.target.value)}>
                  <option value="general">General</option>
                  <option value="development">Development</option>
                  <option value="community">Community</option>
                </select>
              </label>
              <label>
                Messaging type
                <select
                  value={createMessagingType}
                  onChange={(e) => setCreateMessagingType(e.target.value as "standard" | "waku")}
                >
                  <option value="standard">Standard (Supabase)</option>
                  <option value="waku">Waku / Logos</option>
                </select>
              </label>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => !creating && setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating || !createName.trim()}>
                  {creating ? "Creating…" : "Create channel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
