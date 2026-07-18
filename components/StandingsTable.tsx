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
  hideMobile?: boolean;
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

export default function StandingsTable({ rows, labels }: Props) {
  const columns: Column[] = [
    { key: "rank", label: labels.rank, align: "center" },
    { key: "teamName", label: labels.team, align: "left" },
    { key: "played", label: labels.played, align: "center" },
    { key: "won", label: labels.won, align: "center", hideMobile: true },
    { key: "draw", label: labels.draw, align: "center", hideMobile: true },
    { key: "lost", label: labels.lost, align: "center", hideMobile: true },
    { key: "goalsFor", label: labels.goalsFor, align: "center" },
    { key: "goalsAgainst", label: labels.goalsAgainst, align: "center", hideMobile: true },
    { key: "goalsDiff", label: labels.goalsDiff, align: "center" },
    { key: "points", label: labels.points, align: "center" },
  ];

  function cellValue(row: StandingRow, key: Column["key"]) {
    if (key === "teamName") return row.teamName;
    if (key === "goalsDiff") return row.goalsDiff;
    return row[key];
  }

  return (
    <div className="overflow-x-auto rounded-[1.5rem] border border-[#18ff6d22] bg-[#121212]/75">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-[#747474]">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-3 py-4 sm:px-4 ${
                  column.hideMobile ? "hidden md:table-cell" : ""
                } ${column.align === "center" ? "text-center" : ""}`}
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
                    <td key={column.key} className="px-3 py-3 sm:px-4">
                      <div className="flex min-w-[180px] items-center gap-3">
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
                        <span className="font-semibold text-white">{row.teamName}</span>
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
                    className={`px-3 py-3 text-[#D8D8D8] sm:px-4 ${
                      column.hideMobile ? "hidden md:table-cell" : ""
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
                    {isDiff && row.goalsDiff > 0 ? `+${value}` : value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
