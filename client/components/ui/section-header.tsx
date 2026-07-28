interface SectionHeaderProps {
  variant: "green" | "white";
  title: string;
  subtitle?: string;
}

export default function SectionHeader({
  variant,
  title,
  subtitle,
}: SectionHeaderProps) {
  const styles = {
    green: {
      title: "text-green-800 text-2xl sm:text-4xl md:text-5xl",
      subtitle: "text-slate-600",
    },
    white: {
      title: "text-white/95 text-2xl sm:text-3xl md:text-4xl",
      subtitle: "text-white/70",
    },
  } as const;

  const current = styles[variant];

  return (
    <div className="text-center">
      <h2 className={`font-heading font-black leading-tight ${current.title} mb-3 md:mb-4`}>
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