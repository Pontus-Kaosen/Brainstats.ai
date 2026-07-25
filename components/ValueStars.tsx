"use client";

type ValueStarsProps = {
  tier: number;
  label?: string;
  size?: "sm" | "md";
};

export default function ValueStars({
  tier,
  label,
  size = "md",
}: ValueStarsProps) {
  const safeTier = Math.min(5, Math.max(1, tier));
  const starClass = size === "sm" ? "text-sm" : "text-base";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`flex leading-none ${starClass}`} aria-hidden>
        {Array.from({ length: 5 }, (_, index) => {
          const filled = index < safeTier;

          return (
            <span
              key={index}
              className={
                filled ? "text-[#18ff6d]" : "text-[#18ff6d]/20"
              }
            >
              ★
            </span>
          );
        })}
      </span>

      {label ? (
        <span className="text-sm font-bold text-[#18ff6d]">{label}</span>
      ) : null}
    </div>
  );
}
