import Link from "next/link";

type HomeCtaLinkProps = {
  href: string;
  variant?: "primary" | "secondary";
  className?: string;
  children: React.ReactNode;
};

export default function HomeCtaLink({
  href,
  variant = "primary",
  className = "",
  children,
}: HomeCtaLinkProps) {
  const variants = {
    primary:
      "border border-[#18ff6d55] bg-gradient-to-r from-[#18ff6d] via-[#3cffb4] to-[#2fbfff] text-black shadow-[0_0_35px_rgba(24,255,109,.35)] hover:shadow-[0_0_55px_rgba(24,255,109,.75)] hover:brightness-110",
    secondary:
      "border border-[#18ff6d55] bg-[#121212]/70 text-[#18ff6d] hover:bg-[#18ff6d22] hover:border-[#18ff6d] hover:shadow-[0_0_40px_rgba(24,255,109,.25)] max-md:backdrop-blur-none backdrop-blur-xl",
  };

  return (
    <Link
      href={href}
      prefetch={false}
      className={`inline-flex items-center justify-center rounded-2xl px-7 py-4 text-center font-bold tracking-wide transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
