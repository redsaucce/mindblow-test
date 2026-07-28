"use client";

import { useState } from "react";
import { Megaphone } from "lucide-react";
import AlertModal from "@/components/ui/alert-modal";
import { announcementPageContent as copy } from "@/data/dashboard/admin/announcements";
import { sendAnnouncement } from "@/services/dashboard/admin-announcement-service";

export default function AnnouncementsPage() {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState("");

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 3000);
  };

  const handleSendClick = () => {
    if (!title.trim() || !subject.trim() || !message.trim()) {
      showFeedback(copy.feedback.validation);
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmSend = async () => {
    setIsSending(true);
    try {
      const result = await sendAnnouncement(title, subject, message);
      setConfirmOpen(false);
      setTitle("");
      setSubject("");
      setMessage("");
      showFeedback(result.message);
    } catch {
      setConfirmOpen(false);
      showFeedback(copy.feedback.error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full max-w-5xl mx-auto">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <h2 className="font-heading text-lg font-bold text-slate-900 mb-1">{copy.title}</h2>
          <p className="text-sm text-slate-400 mb-6">{copy.subtitle}</p>

          <div className="flex flex-col gap-5">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                {copy.fields.title.label}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={copy.fields.title.placeholder}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                {copy.fields.subject.label}
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={copy.fields.subject.placeholder}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                {copy.fields.message.label}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={copy.fields.message.placeholder}
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all resize-y"
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleSendClick}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-emerald-600/25 transition-all duration-200"
              >
                <Megaphone className="w-4 h-4" />
                {copy.sendLabel}
              </button>
              {feedback && <p className="text-sm text-slate-500">{feedback}</p>}
            </div>
          </div>
        </div>
      </div>

      <AlertModal
        open={confirmOpen}
        onClose={() => {
          if (!isSending) setConfirmOpen(false);
        }}
        title={copy.confirmDialog.title}
        description={copy.confirmDialog.description}
        cancelLabel={copy.confirmDialog.cancelLabel}
        confirmLabel={copy.confirmDialog.confirmLabel}
        loadingLabel={copy.sendingLabel}
        isLoading={isSending}
        onConfirm={handleConfirmSend}
        confirmVariant="primary"
        confirmIcon={Megaphone}
      />
    </div>
  );
}