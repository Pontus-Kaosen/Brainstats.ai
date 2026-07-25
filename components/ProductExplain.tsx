"use client";

type ProductExplainProps = {
  variant: "aiTips" | "valueBets";
  title: string;
  text: string;
  differentNote: string;
  differentHref: string;
  differentLink: string;
};

const styles = {
  aiTips: {
    box: "border-[#18ff6d22] bg-[#18ff6d]/5",
    label: "text-[#18ff6d]",
    link: "text-[#18ff6d] hover:text-[#7dffb0]",
  },
  valueBets: {
    box: "border-[#72d5ff22] bg-[#2fbfff]/5",
    label: "text-[#72d5ff]",
    link: "text-[#72d5ff] hover:text-[#9de5ff]",
  },
} as const;

export default function ProductExplain({
  variant,
  title,
  text,
  differentNote,
  differentHref,
  differentLink,
}: ProductExplainProps) {
  const style = styles[variant];

  return (
    <div className={`mt-5 rounded-2xl border p-4 sm:p-5 ${style.box}`}>
      <p className={`text-xs font-black uppercase tracking-[0.18em] ${style.label}`}>
        {title}
      </p>
      <p className="mt-2 text-sm leading-7 text-[#CFCFCF]">{text}</p>
      <p className="mt-3 text-sm leading-6 text-[#888]">
        {differentNote}{" "}
        <a href={differentHref} className={`font-semibold underline-offset-2 hover:underline ${style.link}`}>
          {differentLink}
        </a>
      </p>
    </div>
  );
}
