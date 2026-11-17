import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { api } from '../api/client';
import { formatShortDate } from '../constants';
import { useAuth } from '../context/AuthContext';
import type { ChatMessage } from '../types';

interface MessagesPageProps {
  initialRecipientId?: string | null;
  initialItemId?: string | null;
}

export function MessagesPage({
  initialRecipientId,
  initialItemId,
}: MessagesPageProps) {
  const { user, notify } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getMessages();
      setMessages(res.messages);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const threads = useMemo(() => {
    if (!user) return [];
    const map = new Map<
      string,
      {
        threadId: string;
        otherUserId: string;
        otherUserName: string;
        itemId: string | null;
        itemTitle: string | null;
        lastMessage: ChatMessage;
        unreadCount: number;
      }
    >();

    for (const msg of messages) {
      const isSender = msg.senderId === user.id;
      const otherUserId = isSender ? msg.recipientId : msg.senderId;
      const otherUserName = isSender ? msg.recipientName : msg.senderName;
      const existing = map.get(msg.threadId);
      const unread = !isSender && !msg.read ? 1 : 0;

      if (!existing) {
        map.set(msg.threadId, {
          threadId: msg.threadId,
          otherUserId,
          otherUserName,
          itemId: msg.itemId,
          itemTitle: msg.itemTitle || null,
          lastMessage: msg,
          unreadCount: unread,
        });
      } else {
        existing.lastMessage = msg;
        existing.unreadCount += unread;
        if (msg.itemTitle) existing.itemTitle = msg.itemTitle;
      }
    }

    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.lastMessage.createdAt).getTime() -
        new Date(a.lastMessage.createdAt).getTime()
    );
  }, [messages, user]);

  useEffect(() => {
    if (initialRecipientId && user) {
      const pair = [user.id, initialRecipientId].sort();
      setSelectedThreadId(`thread_${pair[0]}_${pair[1]}`);
    } else if (!selectedThreadId && threads.length > 0) {
      setSelectedThreadId(threads[0].threadId);
    }
  }, [initialRecipientId, threads, user, selectedThreadId]);

  const activeThread = threads.find((t) => t.threadId === selectedThreadId) || null;
  const threadMessages = messages.filter((m) => m.threadId === selectedThreadId);

  useEffect(() => {
    if (selectedThreadId && activeThread && activeThread.unreadCount > 0) {
      api.markThreadRead(selectedThreadId).catch(() => null);
      setMessages((prev) =>
        prev.map((m) =>
          m.threadId === selectedThreadId && m.recipientId === user?.id
            ? { ...m, read: true }
            : m
        )
      );
    }
  }, [selectedThreadId, activeThread?.unreadCount, user?.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const recipientId = activeThread?.otherUserId || initialRecipientId;
    if (!recipientId || !draft.trim()) return;

    setSending(true);
    try {
      const res = await api.sendMessage({
        recipientId,
        itemId: activeThread?.itemId || initialItemId || null,
        body: draft.trim(),
      });
      setMessages((prev) => [...prev, res.message]);
      setSelectedThreadId(res.message.threadId);
      setDraft('');
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Failed to send.', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#172554]">
          Campus Messages
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Coordinate pickup times, ask item questions, and confirm handover details.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[480px]">
        {/* Thread List */}
        <aside className="md:col-span-4 border-b md:border-b-0 md:border-r border-slate-200 divide-y divide-slate-100">
          <div className="px-4 py-3 bg-slate-50/70 text-xs font-semibold text-slate-600">
            Conversations ({threads.length})
          </div>

          {loading ? (
            <div className="p-4 text-xs text-slate-500">Loading messages...</div>
          ) : threads.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No conversations yet. Click &ldquo;Contact Owner&rdquo; on any item to start chatting.
            </div>
          ) : (
            threads.map((t) => (
              <button
                key={t.threadId}
                type="button"
                onClick={() => setSelectedThreadId(t.threadId)}
                className={`w-full text-left p-4 transition-colors cursor-pointer ${
                  t.threadId === selectedThreadId
                    ? 'bg-[#172554]/5'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-semibold text-sm text-[#172554] truncate">
                    {t.otherUserName}
                  </span>
                  {t.unreadCount > 0 && (
                    <span className="text-xs font-semibold text-[#6D5CE7] tabular-nums">
                      {t.unreadCount} new
                    </span>
                  )}
                </div>
                {t.itemTitle && (
                  <p className="text-xs text-[#14B8A6] font-medium truncate mb-1">
                    {t.itemTitle}
                  </p>
                )}
                <p className="text-xs text-slate-500 truncate">
                  {t.lastMessage.body}
                </p>
              </button>
            ))
          )}
        </aside>

        {/* Active Conversation */}
        <div className="md:col-span-8 flex flex-col justify-between">
          {activeThread || initialRecipientId ? (
            <>
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-sm font-semibold text-[#172554]">
                    {activeThread?.otherUserName || 'Campus Peer'}
                  </h2>
                  {activeThread?.itemTitle && (
                    <p className="text-xs text-slate-500">
                      Regarding: {activeThread.itemTitle}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex-1 p-5 space-y-3 overflow-y-auto max-h-[360px] bg-[#F8FAFC]">
                {threadMessages.map((msg) => {
                  const isMine = msg.senderId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isMine ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                          isMine
                            ? 'bg-[#172554] text-white'
                            : 'bg-white border border-slate-200 text-slate-800'
                        }`}
                      >
                        {msg.body}
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 tabular-nums">
                        {msg.senderName} · {formatShortDate(msg.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={handleSend}
                className="p-4 border-t border-slate-200 bg-white flex items-center gap-2.5"
              >
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a message about pickup time or item details..."
                  className="flex-1 px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-[#172554] hover:bg-[#1e3270] disabled:opacity-50 rounded-lg cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center text-slate-500">
              <MessageSquare className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-700">
                Select a conversation to view messages
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
