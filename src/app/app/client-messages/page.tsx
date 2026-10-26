"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import type { PortalConversationDto, PortalMessageDto } from "@/lib/portal-messages-types";

export default function StaffClientMessagesPage() {
  const [conversations, setConversations] = useState<PortalConversationDto[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<PortalMessageDto[]>([]);
  const [subject, setSubject] = useState("");
  const [clientName, setClientName] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const loadList = useCallback(async () => {
    const res = await fetch("/api/staff/portal-messages", { credentials: "include" });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "تعذر تحميل الصندوق");
      return;
    }
    setConversations(json.conversations || []);
  }, []);

  const loadThread = useCallback(async (id: string) => {
    const res = await fetch(`/api/staff/portal-messages/${id}`, { credentials: "include" });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "تعذر فتح المحادثة");
      return;
    }
    setActiveId(id);
    setMessages(json.messages || []);
    setSubject(json.conversation?.subject || "");
    setClientName(json.conversation?.clientName || "");
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (!activeId) return;
    const t = setInterval(() => void loadThread(activeId), 8000);
    return () => clearInterval(t);
  }, [activeId, loadThread]);

  const sendReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeId) return;
    setError("");
    setOk("");
    const res = await fetch(`/api/staff/portal-messages/${activeId}`, {
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
    setOk("تم إرسال الرد للعميل");
    await loadThread(activeId);
    await loadList();
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6" dir="rtl">
        <h1 className="text-2xl font-black text-[#101D32] mb-1">رسائل العملاء</h1>
        <p className="text-slate-600 font-semibold mb-4">صندوق مراسلات بوابة العميل — عزل كامل لكل موكل</p>
        {error ? <div className="mb-3 rounded-xl border border-red-200 bg-red-50 text-red-800 px-4 py-3 font-bold">{error}</div> : null}
        {ok ? <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-3 font-bold">{ok}</div> : null}

        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <h2 className="font-extrabold text-[#101D32] mb-2">الوارد</h2>
            {conversations.length === 0 ? (
              <p className="text-slate-500 text-sm">لا رسائل حالياً.</p>
            ) : (
              <ul className="space-y-2">
                {conversations.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => void loadThread(c.id)}
                      className={`w-full text-right rounded-xl border px-3 py-2 ${
                        activeId === c.id ? "border-[#B79A61] bg-[#F5F1E8]" : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="font-bold text-[#101D32]">{c.clientName}</div>
                      <div className="text-sm font-semibold">{c.subject}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(c.lastMessageAt).toLocaleString("ar")}
                        {c.unreadCount ? ` · ${c.unreadCount} جديدة` : ""}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm min-h-[420px]">
            {!activeId ? (
              <p className="text-slate-500 font-semibold">اختر محادثة من الوارد للرد.</p>
            ) : (
              <>
                <div className="mb-3 border-b border-slate-100 pb-3">
                  <h2 className="text-lg font-black text-[#101D32]">{subject}</h2>
                  <p className="text-sm text-slate-600 font-semibold">العميل: {clientName}</p>
                </div>
                <div className="max-h-[360px] overflow-y-auto space-y-2 mb-4">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`max-w-[85%] rounded-xl px-3 py-2 ${
                        m.senderRole === "staff" ? "mr-auto bg-[#101D32] text-white" : "ml-auto bg-[#F5F1E8] text-[#101D32]"
                      }`}
                    >
                      <div className="text-xs opacity-80 mb-1">
                        {m.senderName} · {new Date(m.createdAt).toLocaleString("ar")}
                        {m.readAt ? " · مقروءة" : ""}
                      </div>
                      <div className="font-semibold whitespace-pre-wrap">{m.body}</div>
                    </div>
                  ))}
                </div>
                <form onSubmit={sendReply} className="space-y-2">
                  <textarea
                    className="w-full rounded-xl border border-slate-200 p-3 font-semibold"
                    rows={3}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="اكتب ردك للعميل…"
                    required
                  />
                  <button type="submit" className="rounded-xl bg-[#101D32] text-white font-extrabold px-4 py-2">
                    إرسال الرد
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
