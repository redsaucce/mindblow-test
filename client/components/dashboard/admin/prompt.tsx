"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { promptPageContent as copy } from "@/data/dashboard/admin/prompt";
import { type PromptFields, getPrompt, updatePrompt } from "@/services/dashboard/admin-prompt-service";

const EMPTY_PROMPT: PromptFields = {
  prefix: "",
  objectives: "",
  constraints: "",
  suffix: "",
};

type FieldKey = keyof PromptFields;

const FIELD_ORDER: FieldKey[] = ["prefix", "objectives", "constraints", "suffix"];

export default function PromptPage() {
  const [values, setValues] = useState<PromptFields>(EMPTY_PROMPT);
  const [feedback, setFeedback] = useState("");
  const [activeField, setActiveField] = useState<FieldKey>("prefix");

  // On error this silently keeps EMPTY_PROMPT via the sync effect below —
  // same fallback behavior as the original, fields just show placeholder
  // text either way rather than surfacing a load error.
  const { data } = useQuery({
    queryKey: ["admin-prompt"],
    queryFn: getPrompt,
  });

  useEffect(() => {
    if (data) setValues(data);
  }, [data]);

  const updateField = (field: FieldKey, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const showFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(""), 3000);
  };

  const saveMutation = useMutation({
    mutationFn: (fields: PromptFields) => updatePrompt(fields),
    onSuccess: () => showFeedback(copy.savedMessage),
    onError: () => showFeedback(copy.errorMessage),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(values);
  };

  const activeMeta = copy.fields[activeField];

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full max-w-6xl mx-auto">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <h2 className="font-heading text-lg font-bold text-slate-900 mb-1">{copy.title}</h2>
          <p className="text-sm text-slate-400 mb-6">{copy.subtitle}</p>

          <form onSubmit={handleSave} className="flex flex-col gap-5">
            <div className="flex gap-6 min-h-[420px]">
              {/* Left panel: field list */}
              <div className="w-56 shrink-0 border-r border-slate-200 pr-4">
                <nav className="flex flex-col gap-1">
                  {FIELD_ORDER.map((key) => {
                    const isActive = key === activeField;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setActiveField(key)}
                        className={`text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/30"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {copy.fields[key].label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Right panel: full text editor for the selected field */}
              <div className="flex-1 flex flex-col">
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  {activeMeta.label}
                </label>
                <textarea
                  value={values[activeField]}
                  onChange={(e) => updateField(activeField, e.target.value)}
                  placeholder={activeMeta.placeholder}
                  className="flex-1 w-full min-h-[380px] rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 disabled:opacity-60 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-emerald-600/25 transition-all duration-200"
              >
                {saveMutation.isPending ? copy.savingLabel : copy.saveLabel}
              </button>
              {feedback && <p className="text-sm text-slate-500">{feedback}</p>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}