type BrainStatsLogoProps = {
  variant?: "hero" | "nav" | "footer";
  className?: string;
};

const variants = {
  hero: "text-5xl sm:text-6xl",
  nav: "text-xl sm:text-2xl",
  footer: "text-2xl sm:text-3xl",
} as const;

export default function BrainStatsLogo({
  variant = "nav",
  className = "",
}: BrainStatsLogoProps) {
  return (
    <span
      className={`inline-block font-black tracking-tight ${variants[variant]} ${className}`}
    >
      <span className="text-white">Brain</span>
      <span className="text-[#18ff6d]">Stats</span>
    </span>
  );
}
