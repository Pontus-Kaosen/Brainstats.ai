"use client";

import Image from "next/image";

export type StandingRow = {
  rank: number;
  teamId: number;
  teamName: string;
  logo: string;
  points: number;
  goalsDiff: number;
  goalsFor: number;
  goalsAgainst: number;
  played: number;
  won: number;
  draw: number;
  lost: number;
  form?: string;
};

type Column = {
  key: keyof StandingRow | "goalsDiff";
  label: string;
  align?: "left" | "center" | "right";
  hideTablet?: boolean;
};

type Props = {
  rows: StandingRow[];
  labels: {
    rank: string;
    team: string;
    played: string;
    won: string;
    draw: string;
    lost: string;
    goalsFor: string;
    goalsAgainst: string;
    goalsDiff: string;
    points: string;
  };
};

function formatDiff(value: number) {
  if (value > 0) return `+${value}`;
  return String(value);
}

export default function StandingsTable({ rows, labels }: Props) {
  const columns: Column[] = [
    { key: "rank", label: labels.rank, align: "center" },
    { key: "teamName", label: labels.team, align: "left" },
    { key: "played", label: labels.played, align: "center" },
    { key: "won", label: labels.won, align: "center", hideTablet: true },
    { key: "draw", label: labels.draw, align: "center", hideTablet: true },
    { key: "lost", label: labels.lost, align: "center", hideTablet: true },
    { key: "goalsFor", label: labels.goalsFor, align: "center" },
    { key: "goalsAgainst", label: labels.goalsAgainst, align: "center" },
    { key: "goalsDiff", label: labels.goalsDiff, align: "center" },
    { key: "points", label: labels.points, align: "center" },
  ];

  function cellValue(row: StandingRow, key: Column["key"]) {
    if (key === "teamName") return row.teamName;
    if (key === "goalsDiff") return row.goalsDiff;
    return row[key];
  }

  return (
    <div className="rounded-[1.5rem] border border-[#18ff6d22] bg-[#121212]/75">
      <div className="md:hidden">
        <div className="grid grid-cols-[2rem_1fr_auto] gap-x-3 border-b border-white/10 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#747474]">
          <span className="text-center">{labels.rank}</span>
          <span>{labels.team}</span>
          <span className="text-right">{labels.points}</span>
        </div>

        <div className="divide-y divide-white/5">
          {rows.map((row) => (
            <article
              key={row.teamId}
              className="grid grid-cols-[2rem_1fr_auto] items-center gap-x-3 px-4 py-3.5"
            >
              <span className="text-center text-sm font-black text-[#A9A9A9]">
                {row.rank}
              </span>

              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  {row.logo ? (
                    <Image
                      src={row.logo}
                      alt=""
                      width={24}
                      height={24}
                      className="h-6 w-6 shrink-0 rounded-full bg-white/5 object-contain"
                    />
                  ) : (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/5 text-[10px] text-[#888]">
                      {row.rank}
                    </span>
                  )}
                  <p className="truncate text-sm font-semibold text-white">
                    {row.teamName}
                  </p>
                </div>

                <p className="mt-1.5 pl-8 text-[11px] leading-5 text-[#777]">
                  {row.played} {labels.played} · {row.won}-{row.draw}-{row.lost} ·{" "}
                  {row.goalsFor}-{row.goalsAgainst} · {labels.goalsDiff}{" "}
                  <span
                    className={
                      row.goalsDiff > 0
                        ? "text-[#18ff6d]"
                        : row.goalsDiff < 0
                          ? "text-red-400"
                          : ""
                    }
                  >
                    {formatDiff(row.goalsDiff)}
                  </span>
                </p>
              </div>

              <div className="text-right">
                <p className="text-lg font-black leading-none text-[#18ff6d]">
                  {row.points}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-[#747474]">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`whitespace-nowrap px-3 py-4 lg:px-4 ${
                    column.hideTablet ? "hidden lg:table-cell" : ""
                  } ${column.align === "center" ? "text-center" : ""} ${
                    column.key === "teamName"
                      ? "sticky left-0 z-10 bg-[#121212] shadow-[8px_0_16px_rgba(0,0,0,0.35)]"
                      : ""
                  }`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.teamId}
                className="border-b border-white/5 transition hover:bg-white/[0.02]"
              >
                {columns.map((column) => {
                  if (column.key === "teamName") {
                    return (
                      <td
                        key={column.key}
                        className="sticky left-0 z-10 bg-[#121212] px-3 py-3 shadow-[8px_0_16px_rgba(0,0,0,0.35)] sm:px-4"
                      >
                        <div className="flex min-w-[160px] items-center gap-3 lg:min-w-[200px]">
                          {row.logo ? (
                            <Image
                              src={row.logo}
                              alt=""
                              width={28}
                              height={28}
                              className="h-7 w-7 shrink-0 rounded-full bg-white/5 object-contain"
                            />
                          ) : (
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-xs font-bold text-[#888]">
                              {row.rank}
                            </span>
                          )}
                          <span className="font-semibold text-white">
                            {row.teamName}
                          </span>
                        </div>
                      </td>
                    );
                  }

                  const value = cellValue(row, column.key);
                  const isPoints = column.key === "points";
                  const isDiff = column.key === "goalsDiff";

                  return (
                    <td
                      key={column.key}
                      className={`whitespace-nowrap px-3 py-3 text-[#D8D8D8] lg:px-4 ${
                        column.hideTablet ? "hidden lg:table-cell" : ""
                      } ${column.align === "center" ? "text-center" : ""} ${
                        isPoints ? "font-black text-[#18ff6d]" : ""
                      } ${
                        isDiff
                          ? row.goalsDiff > 0
                            ? "text-[#18ff6d]"
                            : row.goalsDiff < 0
                              ? "text-red-400"
                              : ""
                          : ""
                      }`}
                    >
                      {isDiff ? formatDiff(row.goalsDiff) : value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
