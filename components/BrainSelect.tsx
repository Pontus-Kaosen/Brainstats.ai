"use client";

type Option = {
  label: string;
  value: string | number;
};

type BrainSelectProps = {
  label: string;
  value: string | number;
  options: Option[];
  onChange: (value: string) => void;
};

export default function BrainSelect({
  label,
  value,
  options,
  onChange,
}: BrainSelectProps) {
  return (
    <div>
      <label className="text-sm text-[#A9A9A9]">{label}</label>

      <div className="relative mt-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="
            w-full
            appearance-none
            rounded-2xl
            border
            border-[#18ff6d33]
            bg-[#07110d]/90
            px-5
            py-4
            pr-12
            font-semibold
            text-white
            outline-none
            backdrop-blur-xl
            transition
            hover:border-[#18ff6d88]
            focus:border-[#18ff6d]
            focus:shadow-[0_0_35px_rgba(24,255,109,.22)]
          "
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-[#07110d] text-white"
            >
              {option.label}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#18ff6d]">
          ▼
        </div>
      </div>
    </div>
  );
}