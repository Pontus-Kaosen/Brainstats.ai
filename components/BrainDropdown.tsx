"use client";

import { useEffect, useRef, useState } from "react";

type Option = {
  label: string;
  value: string | number;
  icon?: string;
};

type Props = {
  label: string;
  value: string | number;
  options: Option[];
  onChange: (value: string) => void;
};

export default function BrainDropdown({
  label,
  value,
  options,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((option) => String(option.value) === String(value));

  const filtered = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="text-sm text-[#A9A9A9]">{label}</label>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="mt-2 flex w-full items-center justify-between rounded-2xl border border-[#18ff6d33] bg-[#07110d]/90 px-5 py-4 text-left font-semibold text-white backdrop-blur-xl transition hover:border-[#18ff6d88] hover:shadow-[0_0_35px_rgba(24,255,109,.18)]"
      >
        <span>
          {selected?.icon ? `${selected.icon} ` : ""}
          {selected?.label || "Välj"}
        </span>

        <span className="text-[#18ff6d]">▼</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-3 w-full overflow-hidden rounded-3xl border border-[#18ff6d33] bg-[#07110d]/95 p-3 shadow-[0_0_60px_rgba(24,255,109,.18)] backdrop-blur-xl">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök..."
            className="mb-3 w-full rounded-2xl border border-[#18ff6d22] bg-black/40 px-4 py-3 text-white outline-none placeholder:text-[#666] focus:border-[#18ff6d88]"
          />

          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <p className="p-3 text-sm text-[#A9A9A9]">Inga resultat</p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(String(option.value));
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition ${
                    String(option.value) === String(value)
                      ? "bg-[#18ff6d]/15 text-[#18ff6d]"
                      : "text-white hover:bg-white/5"
                  }`}
                >
                  <span>
                    {option.icon ? `${option.icon} ` : ""}
                    {option.label}
                  </span>

                  {String(option.value) === String(value) && <span>✓</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}