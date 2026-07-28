import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/70 to-slate-50 min-h-screen flex items-center justify-center px-6">
      <div className="absolute top-1/4 left-1/4 w-[420px] h-[420px] rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[360px] h-[360px] rounded-full bg-green-500/12 blur-3xl pointer-events-none" />

      <div className="relative max-w-md mx-auto text-center">
        <div className="mx-auto mb-6 w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <SearchX className="w-7 h-7 text-white" strokeWidth={2.2} />
        </div>

        <h1 className="font-heading text-2xl md:text-4xl font-black text-green-800 mb-3 leading-tight">
          <span className="me-3">404</span>
          <span className="me-3 border-l border-1 border-green-900"></span>
          <span>Page not found</span>
        </h1>

        <p className="text-slate-600 text-sm md:text-base leading-relaxed mb-8">
          The page you're looking for doesn't exist or may have moved.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-emerald-600/25 transition-all duration-200 hover:-translate-y-0.5"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}