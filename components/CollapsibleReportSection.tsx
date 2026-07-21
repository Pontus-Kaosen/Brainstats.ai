"use client";

import { useState, type ReactNode } from "react";

type CollapsibleReportSectionProps = {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
};

export default function CollapsibleReportSection({
  title,
  defaultOpen = false,
  children,
  className = "",
}: CollapsibleReportSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={`rounded-3xl border border-white/10 bg-black/25 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
        aria-expanded={open}
      >
        <h3 className="text-xl font-bold text-white sm:text-2xl">{title}</h3>
        <span className="shrink-0 text-lg text-[#18ff6d]">{open ? "−" : "+"}</span>
      </button>

      {open ? <div className="border-t border-white/10 px-6 pb-6 pt-2">{children}</div> : null}
    </section>
  );
}
