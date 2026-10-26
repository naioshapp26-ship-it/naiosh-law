"use client";

import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PortalShell } from "@/components/portal/portal-shell";
import type { PortalConversationDto, PortalMessageDto } from "@/lib/portal-messages-types";

function MessagesInner() {
  const params = useSearchParams();
  const [demo, setDemo] = useState(false);
  const [conversations, setConversations] = useState<PortalConversationDto[]>([]);
  const [activeId, setActiveId] = useState<string | null>(params.get("c"));
  const [messages, setMessages] = useState<PortalMessageDto[]>([]);
  const [activeSubject, setActiveSubject] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [cases, setCases] = useState<{ id: string; caseNo: string }[]>([]);
  const [caseId, setCaseId] = useState("");
  const [loading, setLoading] = useState(true);

  const loadList = useCallback(async () => {
    const [cRes, pRes, casesRes] = await Promise.all([
      fetch("/api/portal/messages", { credentials: "include" }),
      fetch("/api/portal/profile", { credentials: "include" }),
      fetch("/api/portal/cases", { credentials: "include" }),
    ]);
    const cJson = await cRes.json();
    const pJson = await pRes.json();
    const casesJson = await casesRes.json();
    setConversations(cJson.conversations || []);
    setDemo(Boolean(pJson.profile?.isDemo));
    setCases((casesJson.cases || []).map((c: { id: string; caseNo: string }) => ({ id: c.id, caseNo: c.caseNo })));
    setLoading(false);
  }, []);

  const loadThread = useCallback(async (id: string) => {
    const res = await fetch(`/api/portal/messages/${id}`, { credentials: "include" });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "تعذر تحميل المحادثة");
      return;
    }
    setActiveId(id);
    setMessages(json.messages || []);
    setActiveSubject(json.conversation?.subject || "");
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    const c = params.get("c");
    if (c) void loadThread(c);
  }, [params, loadThread]);

  // Polling every 8s while a thread is open
  useEffect(() => {
    if (!activeId || demo) return;
    const t = setInterval(() => void loadThread(activeId), 8000);
    return () => clearInterval(t);
  }, [activeId, demo, loadThread]);

  const startConversation = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMsg("");
    const res = await fetch("/api/portal/messages", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body, caseId: caseId || undefined }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "تعذر الإرسال");
      return;
    }
    setSubject("");
    setBody("");
    setCaseId("");
    setMsg("تم إرسال الرسالة إلى المكتب");
    await loadList();
    if (json.conversationId) await loadThread(json.conversationId);
  };

  const sendReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeId) return;
    setError("");
    const res = await fetch(`/api/portal/messages/${activeId}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: reply }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "تعذر الإرسال");
      return;
    }
    setReply("");
    await loadThread(activeId);
    await loadList();
  };

  return (
    <PortalShell title="الرسائل" demoBanner={demo}>
      {error ? <div className="portal-card" style={{ color: "#b91c1c" }}>{error}</div> : null}
      {msg ? <div className="portal-card" style={{ color: "#166534" }}>{msg}</div> : null}

      <div className="portal-grid" style={{ gridTemplateColumns: "minmax(240px, 0.9fr) 1.4fr", gap: "1rem", alignItems: "start" }}>
        <section className="portal-card">
          <h2>محادثاتي</h2>
          {loading ? <div className="portal-empty">جاري التحميل…</div> : null}
          {!loading && conversations.length === 0 ? (
            <div className="portal-empty">لا محادثات بعد. ابدأ مراسلة المكتب من النموذج.</div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.5rem" }}>
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => void loadThread(c.id)}
                    style={{
                      width: "100%",
                      textAlign: "right",
                      border: activeId === c.id ? "1px solid #B79A61" : "1px solid #e5e7eb",
                      background: activeId === c.id ? "rgba(183,154,97,.12)" : "#fff",
                      borderRadius: "0.75rem",
                      padding: "0.75rem",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    <strong style={{ display: "block" }}>{c.subject}</strong>
                    <span style={{ fontSize: "0.8rem", color: "#526071" }}>
                      {c.preview || "—"} · {new Date(c.lastMessageAt).toLocaleString("ar")}
                      {c.unreadCount ? ` · ${c.unreadCount} غير مقروء` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div style={{ display: "grid", gap: "1rem" }}>
          {activeId ? (
            <section className="portal-card">
              <h2>{activeSubject || "المحادثة"}</h2>
              <div
                style={{
                  maxHeight: 360,
                  overflowY: "auto",
                  display: "grid",
                  gap: "0.65rem",
                  padding: "0.5rem 0",
                  marginBottom: "0.75rem",
                }}
              >
                {messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      justifySelf: m.isMine ? "start" : "end",
                      maxWidth: "85%",
                      background: m.isMine ? "#101D32" : "#F5F1E8",
                      color: m.isMine ? "#fff" : "#101D32",
                      borderRadius: "0.85rem",
                      padding: "0.75rem 0.9rem",
                      border: m.isMine ? "none" : "1px solid #e5e7eb",
                    }}
                  >
                    <div style={{ fontSize: "0.75rem", opacity: 0.8, marginBottom: 4 }}>
                      {m.senderName} · {new Date(m.createdAt).toLocaleString("ar")}
                      {m.readAt ? " · مقروءة" : m.isMine ? "" : " · جديدة"}
                    </div>
                    <div style={{ whiteSpace: "pre-wrap", fontWeight: 600 }}>{m.body}</div>
                    {m.attachmentUrl ? (
                      <a
                        href={m.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: m.isMine ? "#B79A61" : "#1A304D", fontSize: "0.85rem" }}
                      >
                        مرفق: {m.attachmentName || "ملف"}
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
              {!demo ? (
                <form className="portal-form" onSubmit={sendReply}>
                  <label>
                    ردك
                    <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} required />
                  </label>
                  <button className="portal-btn primary" type="submit">
                    إرسال الرد
                  </button>
                </form>
              ) : (
                <p style={{ color: "#526071", fontWeight: 600 }}>المحادثة التجريبية للقراءة فقط.</p>
              )}
            </section>
          ) : null}

          {!demo ? (
            <form className="portal-card portal-form" onSubmit={startConversation}>
              <h2>رسالة جديدة للمكتب / المحامي</h2>
              <label>
                الموضوع
                <input value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="مثال: استفسار عن موعد جلسة" />
              </label>
              {cases.length ? (
                <label>
                  ربط بقضية (اختياري)
                  <select value={caseId} onChange={(e) => setCaseId(e.target.value)}>
                    <option value="">— بدون ربط —</option>
                    {cases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.caseNo}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label>
                نص الرسالة
                <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} required />
              </label>
              <button className="portal-btn primary" type="submit">
                إرسال إلى المكتب
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </PortalShell>
  );
}

export default function PortalMessagesPage() {
  return (
    <Suspense fallback={<div className="portal-loading">جاري التحميل…</div>}>
      <MessagesInner />
    </Suspense>
  );
}
