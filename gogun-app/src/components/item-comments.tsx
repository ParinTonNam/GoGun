"use client";
import { useState } from "react";
import { getComments, postComment, type ItemComment } from "@/lib/api";
export function ItemComments({ tripId, type, id }: { tripId: string; type: "expense" | "activity" | "poll"; id: string }) {
  const [open, setOpen] = useState(false), [comments, setComments] = useState<ItemComment[]>([]);
  const [text, setText] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function load() {
    setOpen(true); setBusy(true); setError("");
    try { setComments(await getComments(tripId, type, id)); } catch (e) { setError(e instanceof Error ? e.message : "โหลดไม่สำเร็จ"); } finally { setBusy(false); }
  }
  return <div className="item-comments">
    <button type="button" className="workspace-link" aria-expanded={open} onClick={() => open ? setOpen(false) : void load()}>คุยเกี่ยวกับรายการนี้{open ? " −" : " +"}</button>
    {open && <div className="clay-comment-body">
      {busy && <p role="status">กำลังโหลดหรือบันทึก…</p>}
      {error && <p role="alert">{error} <button className="workspace-link" onClick={load}>ลองโหลดใหม่</button></p>}
      {!busy && !error && !comments.length && <p className="workspace-meta">ยังไม่มีคอมเมนต์ เริ่มถามหรือฝากรายละเอียดได้เลย</p>}
      <ul className="workspace-list">{comments.map(c => <li key={c.id}><strong data-user-content>{c.user.display_name}</strong><p className="whitespace-pre-wrap" data-user-content>{c.text}</p><time className="workspace-meta">{new Date(c.created_at).toLocaleString("th-TH")}</time></li>)}</ul>
      <form onSubmit={async e => { e.preventDefault(); if (busy || !text.trim()) return; setBusy(true); setError(""); try { const c = await postComment(tripId, type, id, text); setComments(prev => [...prev, c]); setText(""); } catch (e) { setError(e instanceof Error ? e.message : "ส่งไม่สำเร็จ"); } finally { setBusy(false); } }}>
        <label className="clay-field">คอมเมนต์สั้น ๆ<textarea maxLength={500} value={text} onChange={e => setText(e.target.value)} placeholder="เช่น อันนี้รวมค่าทิปหรือยัง" rows={2} /></label>
        <div className="workspace-page-heading"><small>{text.length}/500</small><button className="workspace-button workspace-button-primary" disabled={busy || !text.trim()}>ส่งคอมเมนต์</button></div>
      </form>
    </div>}
  </div>;
}
