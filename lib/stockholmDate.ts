const STOCKHOLM_DATE = {
  timeZone: "Europe/Stockholm",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
} as const;

export function getStockholmDateKey(date: Date = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", STOCKHOLM_DATE).format(date);
}

export function getFixtureStockholmDateKey(isoDate: string) {
  return new Intl.DateTimeFormat("sv-SE", STOCKHOLM_DATE).format(
    new Date(isoDate)
  );
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const next = new Date(year, month - 1, day + days);

  return [
    next.getFullYear(),
    String(next.getMonth() + 1).padStart(2, "0"),
    String(next.getDate()).padStart(2, "0"),
  ].join("-");
}
