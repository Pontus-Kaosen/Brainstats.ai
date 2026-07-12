import Image from "next/image";

type BrainStatsLogoProps = {
  variant?: "hero" | "nav" | "footer";
  className?: string;
  priority?: boolean;
};

const variants = {
  hero: {
    containerClass:
      "relative h-[210px] w-[min(300px,88vw)] overflow-hidden sm:h-[250px] sm:w-[320px]",
    sizes: "(max-width: 640px) 88vw, 320px",
    priority: true,
  },
  nav: {
    containerClass:
      "relative h-10 w-[132px] overflow-hidden sm:h-11 sm:w-[148px]",
    sizes: "148px",
    priority: true,
  },
  footer: {
    containerClass: "relative h-14 w-[180px] overflow-hidden",
    sizes: "180px",
    priority: false,
  },
} as const;

export default function BrainStatsLogo({
  variant = "nav",
  className = "",
  priority,
}: BrainStatsLogoProps) {
  const config = variants[variant];

  return (
    <div className={`${config.containerClass} ${className}`}>
      <Image
        src="/brainstats-logo.png"
        alt="BrainStats"
        fill
        priority={priority ?? config.priority}
        sizes={config.sizes}
        className="object-cover object-top"
      />
    </div>
  );
}
