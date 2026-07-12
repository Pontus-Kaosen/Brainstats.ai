export default function FootballBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">

      {/* Mörk bas */}
      <div className="absolute inset-0 bg-[#050505]" />

      {/* Stor fotbollsplan */}
      <div
        className="absolute left-1/2 top-1/2 h-[1700px] w-[1700px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25"
        style={{
          background:
            "radial-gradient(circle,#18ff6d22 0%,#18ff6d11 35%,transparent 70%)",
        }}
      />

      {/* Mittcirkel */}
      <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#1aff6a55]" />

      {/* Mittlinje */}
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#18ff6d33]" />

      {/* Straffområden */}
      <div className="absolute left-1/2 top-20 h-[280px] w-[700px] -translate-x-1/2 rounded-b-[40px] border border-[#18ff6d33]" />

      <div className="absolute bottom-20 left-1/2 h-[280px] w-[700px] -translate-x-1/2 rounded-t-[40px] border border-[#18ff6d33]" />

      {/* Spotlight vänster */}
      <div className="absolute -left-64 top-40 h-[900px] w-[900px] rounded-full bg-cyan-500/20 blur-[220px]" />

      {/* Spotlight höger */}
      <div className="absolute -right-64 bottom-40 h-[900px] w-[900px] rounded-full bg-yellow-400/15 blur-[220px]" />

      {/* AI Glow */}
      <div className="absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-400/10 blur-[180px]" />

      {/* Top Glow */}
      <div className="absolute top-0 h-96 w-full bg-gradient-to-b from-cyan-400/10 to-transparent" />

      {/* Bottom Glow */}
      <div className="absolute bottom-0 h-96 w-full bg-gradient-to-t from-green-500/10 to-transparent" />

      {/* Vinjett */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_45%,rgba(0,0,0,.72)_100%)]" />

    </div>
  );
}