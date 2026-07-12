import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const variants = {
    primary: `
      border border-[#18ff6d55]
      bg-gradient-to-r from-[#18ff6d] via-[#3cffb4] to-[#2fbfff]
      text-black
      shadow-[0_0_35px_rgba(24,255,109,.35)]
      hover:shadow-[0_0_55px_rgba(24,255,109,.75)]
      hover:brightness-110
    `,

    secondary: `
      border border-[#18ff6d55]
      bg-[#121212]/70
      backdrop-blur-xl
      text-[#18ff6d]
      hover:bg-[#18ff6d22]
      hover:border-[#18ff6d]
      hover:shadow-[0_0_40px_rgba(24,255,109,.25)]
    `,

    danger: `
      border border-red-500/60
      bg-[#1a1010]
      text-red-400
      hover:bg-red-600
      hover:text-white
      hover:shadow-[0_0_35px_rgba(255,0,0,.45)]
    `,
  };

  return (
    <button
      {...props}
      className={`
        relative
        overflow-hidden
        rounded-2xl
        px-7
        py-4
        font-bold
        tracking-wide
        transition-all
        duration-300
        hover:-translate-y-1
        hover:scale-[1.02]
        active:scale-[0.98]
        disabled:opacity-40
        disabled:cursor-not-allowed
        disabled:hover:scale-100
        ${variants[variant]}
        ${className}
      `}
    >
      <span className="relative z-10">{children}</span>

      <div
        className="
          absolute
          inset-0
          opacity-0
          transition-opacity
          duration-300
          hover:opacity-100
          bg-gradient-to-r
          from-white/0
          via-white/20
          to-white/0
          -translate-x-full
          animate-[shine_2.5s_linear_infinite]
        "
      />
    </button>
  );
}