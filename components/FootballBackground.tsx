export default function FootballBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Nattarena + gräsplan */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #04080c 0%, #071018 22%, #0a1f18 52%, #0d281c 78%, #0a2018 100%)",
        }}
      />

      {/* Gräsremsor (klippt plan) */}
      <div
        className="absolute inset-0 opacity-[0.14] max-md:opacity-[0.1]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            90deg,
            rgba(24, 255, 109, 0.22) 0px,
            rgba(24, 255, 109, 0.22) 72px,
            rgba(12, 120, 62, 0.12) 72px,
            rgba(12, 120, 62, 0.12) 144px
          )`,
        }}
      />

      {/* Fin grästextur */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `radial-gradient(rgba(255,255,255,0.35) 0.6px, transparent 0.6px)`,
          backgroundSize: "6px 6px",
        }}
      />

      {/* Stadium glow */}
      <div
        className="absolute left-[-10%] top-[6%] h-[520px] w-[520px] rounded-full opacity-30 blur-[100px] max-md:h-[320px] max-md:w-[320px] max-md:opacity-20"
        style={{
          background:
            "radial-gradient(circle, rgba(24,255,109,0.4) 0%, rgba(24,255,109,0.1) 45%, transparent 72%)",
        }}
      />

      <div
        className="absolute right-[-8%] top-[14%] h-[480px] w-[480px] rounded-full opacity-25 blur-[110px] max-md:hidden"
        style={{
          background:
            "radial-gradient(circle, rgba(47,191,255,0.35) 0%, rgba(47,191,255,0.08) 50%, transparent 75%)",
        }}
      />

      <div
        className="absolute bottom-[4%] left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full opacity-22 blur-[120px] max-md:h-[340px] max-md:w-[340px]"
        style={{
          background:
            "radial-gradient(circle, rgba(32,140,72,0.35) 0%, rgba(24,255,109,0.08) 40%, transparent 70%)",
        }}
      />

      {/* Planmarkeringar — sett ovanifrån */}
      <div className="absolute left-1/2 top-1/2 h-[min(920px,88vh)] w-[min(680px,92vw)] -translate-x-1/2 -translate-y-1/2">
        {/* Yttre kant */}
        <div className="absolute inset-0 rounded-[2px] border border-white/[0.14]" />

        {/* Mittlinje */}
        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-white/[0.16]" />

        {/* Mittcirkel */}
        <div className="absolute left-1/2 top-1/2 h-[168px] w-[168px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.16] max-md:h-[120px] max-md:w-[120px]" />
        <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25" />

        {/* Straffområden */}
        <div className="absolute left-[14%] right-[14%] top-0 h-[22%] border border-t-0 border-white/[0.12]" />
        <div className="absolute bottom-0 left-[14%] right-[14%] h-[22%] border border-b-0 border-white/[0.12]" />

        {/* Straffpunkter */}
        <div className="absolute left-1/2 top-[16%] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white/20" />
        <div className="absolute bottom-[16%] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white/20" />

        {/* Hörnbågar */}
        <div className="absolute left-0 top-0 h-10 w-10 rounded-br-full border border-l-0 border-t-0 border-white/[0.1]" />
        <div className="absolute right-0 top-0 h-10 w-10 rounded-bl-full border border-r-0 border-t-0 border-white/[0.1]" />
        <div className="absolute bottom-0 left-0 h-10 w-10 rounded-tr-full border border-b-0 border-l-0 border-white/[0.1]" />
        <div className="absolute bottom-0 right-0 h-10 w-10 rounded-tl-full border border-b-0 border-r-0 border-white/[0.1]" />
      </div>

      {/* Läktare / spotlights upptill */}
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#2fbfff]/10 via-[#18ff6d]/6 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#06140e]/80 to-transparent" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_32%,rgba(4,10,8,.62)_100%)]" />
    </div>
  );
}
