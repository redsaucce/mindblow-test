"use client";

import { useEffect, useState } from "react";
import { promptPageContent as copy } from "@/data/dashboard/admin/prompt";
import { type PromptFields, getPrompt, updatePrompt } from "@/services/dashboard/admin-prompt-service";

const EMPTY_PROMPT: PromptFields = {
  prefix: "",
  objectives: "",
  constraints: "",
  suffix: "",
};

function FormField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700 mb-2 block">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={1}
        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all resize-y"
      />
    </div>
  );
}

export default function PromptPage() {
  const [values, setValues] = useState<PromptFields>(EMPTY_PROMPT);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let cancelled = false;
    getPrompt()
      .then((fields) => {
        if (cancelled) return;
        setValues(fields);
      })
      .catch(() => {
        // Silently keep EMPTY_PROMPT — fields still show placeholder text either way.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = (field: keyof PromptFields, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const showFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(""), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updatePrompt(values);
      showFeedback(copy.savedMessage);
    } catch {
      showFeedback(copy.errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full max-w-5xl mx-auto">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <h2 className="font-heading text-lg font-bold text-slate-900 mb-1">{copy.title}</h2>
          <p className="text-sm text-slate-400 mb-6">{copy.subtitle}</p>

          <form onSubmit={handleSave} className="flex flex-col gap-5">
            <FormField
              label={copy.fields.prefix.label}
              placeholder={copy.fields.prefix.placeholder}
              value={values.prefix}
              onChange={(v) => updateField("prefix", v)}
            />
            <FormField
              label={copy.fields.objectives.label}
              placeholder={copy.fields.objectives.placeholder}
              value={values.objectives}
              onChange={(v) => updateField("objectives", v)}
            />
            <FormField
              label={copy.fields.constraints.label}
              placeholder={copy.fields.constraints.placeholder}
              value={values.constraints}
              onChange={(v) => updateField("constraints", v)}
            />
            <FormField
              label={copy.fields.suffix.label}
              placeholder={copy.fields.suffix.placeholder}
              value={values.suffix}
              onChange={(v) => updateField("suffix", v)}
            />

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 disabled:opacity-60 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-emerald-600/25 transition-all duration-200"
              >
                {isSaving ? copy.savingLabel : copy.saveLabel}
              </button>
              {feedback && <p className="text-sm text-slate-500">{feedback}</p>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}