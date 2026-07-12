"use client";

import { useEffect, useRef, useState } from "react";

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

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!open || window.innerWidth >= 640) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function closePicker() {
    setOpen(false);
    setSearch("");
  }

  return (
    <div ref={containerRef} className="relative min-w-0 sm:z-50">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`group relative min-h-28 w-full overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 sm:min-h-40 sm:rounded-3xl sm:p-6 ${
          open
            ? "border-[#18ff6d] bg-[#07150d] shadow-[0_0_40px_rgba(24,255,109,.18)]"
            : "border-[#18ff6d22] bg-[#111]/80 hover:border-[#18ff6d88]"
        }`}
      >
        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#18ff6d]/10 blur-3xl" />

        <div className="relative flex h-full min-w-0 flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#18ff6d33] bg-[#18ff6d]/10 text-lg sm:h-12 sm:w-12 sm:rounded-2xl sm:text-2xl">
              {icon}
            </span>

            <span
              className={`shrink-0 text-xs text-[#18ff6d] transition-transform duration-300 ${
                open ? "rotate-180" : ""
              }`}
            >
              ▼
            </span>
          </div>

          <div className="mt-3 min-w-0 sm:mt-6">
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-[#7C8A82] sm:text-xs sm:tracking-[0.3em]">
              {label}
            </p>

            <div className="mt-1 flex min-w-0 items-center gap-2 sm:mt-2 sm:gap-3">
              {selectedOption?.image && (
                <img
                  src={selectedOption.image}
                  alt=""
                  className="h-6 w-6 shrink-0 object-contain sm:h-8 sm:w-8"
                />
              )}

              {!selectedOption?.image && selectedOption?.icon && (
                <span className="shrink-0 text-base sm:text-xl">
                  {selectedOption.icon}
                </span>
              )}

              <p className="min-w-0 truncate text-sm font-black text-white sm:text-xl">
                {selectedOption?.label || "Välj"}
              </p>
            </div>

            {selectedOption?.description && (
              <p className="mt-1 hidden truncate text-sm text-[#A9A9A9] sm:block">
                {selectedOption.description}
              </p>
            )}
          </div>
        </div>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Stäng väljaren"
            onClick={closePicker}
            className="fixed inset-0 z-[290] bg-black/70 backdrop-blur-sm sm:hidden"
          />

          <div className="fixed inset-x-3 bottom-3 top-16 z-[300] flex flex-col overflow-hidden rounded-3xl border border-[#18ff6d55] bg-[#07100b] p-4 shadow-[0_0_80px_rgba(24,255,109,.28)] sm:absolute sm:inset-auto sm:left-0 sm:top-full sm:z-[200] sm:mt-3 sm:max-h-[70vh] sm:w-[min(420px,calc(100vw-2rem))]">
            <div className="mb-3 flex items-center justify-between sm:hidden">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#18ff6d]">
                  {label}
                </p>
                <p className="mt-1 text-sm text-[#A9A9A9]">
                  Välj ett alternativ
                </p>
              </div>

              <button
                type="button"
                onClick={closePicker}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl text-white"
              >
                ✕
              </button>
            </div>

            {searchable && (
              <div className="mb-3 shrink-0">
                <input
                  autoFocus
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={`Sök ${label.toLowerCase()}...`}
                  className="w-full rounded-2xl border border-[#18ff6d33] bg-black/60 px-4 py-3 text-base text-white outline-none placeholder:text-[#667069] focus:border-[#18ff6d]"
                />
              </div>
            )}

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1">
              {filteredOptions.length === 0 ? (
                <p className="p-4 text-center text-sm text-[#A9A9A9]">
                  Inga alternativ hittades.
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
                        closePicker();
                      }}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition sm:gap-4 sm:px-4 sm:py-4 ${
                        selected
                          ? "border-[#18ff6d66] bg-[#18ff6d]/15 text-[#18ff6d]"
                          : "border-transparent bg-white/[0.03] text-white hover:border-[#18ff6d33] hover:bg-white/[0.07]"
                      }`}
                    >
                      {option.image ? (
                        <img
                          src={option.image}
                          alt=""
                          className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10"
                        />
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-lg sm:h-10 sm:w-10 sm:text-xl">
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
                        <span className="shrink-0 text-lg font-black">✓</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}