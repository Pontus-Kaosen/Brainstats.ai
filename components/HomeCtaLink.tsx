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
      "border border-[#18ff6d]/40 bg-[#18ff6d] text-black shadow-[0_0_24px_rgba(24,255,109,.18)] hover:bg-[#2aff7a]",
    secondary:
      "border border-white/12 bg-transparent text-[#E8E8E8] hover:border-[#E8DCC8]/40 hover:text-[#E8DCC8]",
  };

  return (
    <Link
      href={href}
      prefetch={false}
      className={`inline-flex items-center justify-center rounded-full px-7 py-3.5 text-center text-sm font-semibold tracking-[0.04em] transition-colors duration-300 sm:text-[15px] ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
