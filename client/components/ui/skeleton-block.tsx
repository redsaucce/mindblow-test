export default function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-linear-to-r from-emerald-200 to-green-200 ${className}`}
    />
  );
}