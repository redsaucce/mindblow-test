import type { LucideIcon } from "lucide-react";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: EmptyStateAction;
}

export default function EmptyState({ icon: Icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16">
      <Icon className="w-10 h-10 text-slate-300" />
      <p className="text-sm text-slate-500 mt-2">{title}</p>
      {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-3 inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-emerald-600/25 transition-all duration-200"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}