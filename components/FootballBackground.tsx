export default function FootballBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[#050505]" />

      <div
        className="absolute left-1/2 top-1/2 h-[1200px] w-[1200px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 max-md:h-[700px] max-md:w-[700px] max-md:opacity-20"
        style={{
          background:
            "radial-gradient(circle,#18ff6d22 0%,#18ff6d11 35%,transparent 70%)",
        }}
      />

      <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#1aff6a55] max-md:h-[320px] max-md:w-[320px]" />
      <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-[#18ff6d33] sm:block" />
      <div className="absolute left-1/2 top-20 hidden h-[280px] w-[700px] -translate-x-1/2 rounded-b-[40px] border border-[#18ff6d33] md:block" />
      <div className="absolute bottom-20 left-1/2 hidden h-[280px] w-[700px] -translate-x-1/2 rounded-t-[40px] border border-[#18ff6d33] md:block" />

      <div className="absolute left-1/2 top-1/3 hidden h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-green-400/10 blur-[120px] md:block" />
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-green-400/10 to-transparent md:hidden" />

      <div className="absolute top-0 hidden h-72 w-full bg-gradient-to-b from-cyan-400/10 to-transparent md:block" />
      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_45%,rgba(0,0,0,.72)_100%)]" />
    </div>
  );
}
