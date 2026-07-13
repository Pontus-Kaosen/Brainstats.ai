"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { formatTranslation } from "@/lib/locale";

type PickerOption = {
  label: string;
  value: string | number;
  icon?: string;
  image?: string;
  description?: string;
};

type BuilderPickerProps = {
  label: string;
  icon: string;
  value: string | number;
  options: PickerOption[];
  onChange: (value: string) => void;
  searchable?: boolean;
};

export default function BuilderPicker({
  label,
  icon,
  value,
  options,
  onChange,
  searchable = true,
}: BuilderPickerProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(
    (option) => String(option.value) === String(value)
  );

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.trim().toLowerCase())
  );

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative min-w-0">
      <div className="relative sm:hidden">
        <div className="pointer-events-none flex items-center gap-3 rounded-xl border border-[#18ff6d22] bg-[#111]/90 px-3 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#18ff6d33] bg-[#18ff6d]/10 text-base">
            {icon}
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7C8A82]">
              {label}
            </p>

            <div className="mt-0.5 flex min-w-0 items-center gap-2">
              {selectedOption?.image && (
                <img
                  src={selectedOption.image}
                  alt=""
                  className="h-5 w-5 shrink-0 object-contain"
                />
              )}

              <p className="min-w-0 truncate text-sm font-bold text-white">
                {selectedOption?.label || t.builderPicker.select}
              </p>
            </div>
          </div>

          <span className="shrink-0 text-xs text-[#18ff6d]">▼</span>
        </div>

        <select
          aria-label={label}
          value={String(value)}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        >
          {options.map((option) => (
            <option key={String(option.value)} value={String(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="hidden sm:block">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className={`group relative min-h-40 w-full overflow-hidden rounded-3xl border p-6 text-left transition-all duration-300 ${
            open
              ? "border-[#18ff6d] bg-[#07150d] shadow-[0_0_55px_rgba(24,255,109,.2)]"
              : "border-[#18ff6d22] bg-[#111]/80 hover:-translate-y-1 hover:border-[#18ff6d88] hover:shadow-[0_0_45px_rgba(24,255,109,.15)]"
          }`}
        >
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#18ff6d]/10 blur-3xl" />

          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#18ff6d33] bg-[#18ff6d]/10 text-2xl">
                {icon}
              </span>

              <span
                className={`text-[#18ff6d] transition-transform duration-300 ${
                  open ? "rotate-180" : ""
                }`}
              >
                ▼
              </span>
            </div>

            <div className="mt-6 min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#7C8A82]">
                {label}
              </p>

              <div className="mt-2 flex min-w-0 items-center gap-3">
                {selectedOption?.image && (
                  <img
                    src={selectedOption.image}
                    alt=""
                    className="h-8 w-8 shrink-0 object-contain"
                  />
                )}

                {!selectedOption?.image && selectedOption?.icon && (
                  <span className="shrink-0 text-xl">
                    {selectedOption.icon}
                  </span>
                )}

                <p className="min-w-0 truncate text-xl font-black text-white">
                  {selectedOption?.label || t.builderPicker.select}
                </p>
              </div>

              {selectedOption?.description && (
                <p className="mt-2 truncate text-sm text-[#A9A9A9]">
                  {selectedOption.description}
                </p>
              )}
            </div>
          </div>
        </button>

        {open && (
          <div className="absolute left-0 top-full z-[200] mt-3 w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-[#18ff6d55] bg-[#07100b]/98 p-4 shadow-[0_0_80px_rgba(24,255,109,.28)] backdrop-blur-2xl">
            {searchable && (
              <div className="mb-3">
                <input
                  autoFocus
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={formatTranslation(
                    t.builderPicker.searchPlaceholder,
                    { label: label.toLowerCase() }
                  )}
                  className="w-full rounded-2xl border border-[#18ff6d33] bg-black/60 px-4 py-4 text-base text-white outline-none placeholder:text-[#667069] focus:border-[#18ff6d]"
                />
              </div>
            )}

            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-2">
              {filteredOptions.length === 0 ? (
                <p className="p-4 text-center text-sm text-[#A9A9A9]">
                  {t.builderPicker.noOptions}
                </p>
              ) : (
                filteredOptions.map((option) => {
                  const selected =
                    String(option.value) === String(value);

                  return (
                    <button
                      key={String(option.value)}
                      type="button"
                      onClick={() => {
                        onChange(String(option.value));
                        setOpen(false);
                        setSearch("");
                      }}
                      className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition ${
                        selected
                          ? "border-[#18ff6d66] bg-[#18ff6d]/15 text-[#18ff6d]"
                          : "border-transparent bg-white/[0.03] text-white hover:border-[#18ff6d33] hover:bg-white/[0.07]"
                      }`}
                    >
                      {option.image ? (
                        <img
                          src={option.image}
                          alt=""
                          className="h-10 w-10 shrink-0 object-contain"
                        />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-xl">
                          {option.icon || "⚽"}
                        </span>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="break-words font-bold leading-5">
                          {option.label}
                        </p>

                        {option.description && (
                          <p className="mt-1 text-xs leading-5 text-[#8F9892]">
                            {option.description}
                          </p>
                        )}
                      </div>

                      {selected && (
                        <span className="shrink-0 text-lg font-black">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
