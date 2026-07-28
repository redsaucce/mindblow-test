interface SectionHeaderProps {
  variant: "green" | "white";
  prefix?: string;
  title: string;
  subtitle?: string;
}

export default function SectionHeader({
  variant,
  prefix,
  title,
  subtitle,
}: SectionHeaderProps) {
  const styles = {
    green: {
      prefix: "text-emerald-600",
      title: "text-green-800 text-2xl sm:text-4xl md:text-5xl",
      subtitle: "text-slate-600",
    },
    white: {
      prefix: "text-white/70",
      title: "text-white/95 text-2xl sm:text-3xl md:text-4xl",
      subtitle: "text-white/70",
    },
  } as const;

  const current = styles[variant];

  return (
    <div className="text-center">
      {prefix ? (
        <span className={`text-xs md:text-sm font-bold uppercase tracking-widest ${current.prefix}`}>
          {prefix}
        </span>
      ) : null}
      <h2
        className={`font-heading font-black leading-tight ${current.title} ${prefix ? "mt-2 md:mt-3" : ""} mb-3 md:mb-4`}
      >
        {title}
      </h2>
      {subtitle ? (
        <p className={`max-w-2xl mx-auto text-base md:text-lg leading-relaxed ${current.subtitle}`}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}