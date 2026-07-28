export default function FootballBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(165deg, #071018 0%, #0c1e30 38%, #081420 72%, #060e16 100%)",
        }}
      />

      <div
        className="absolute left-[-10%] top-[8%] h-[520px] w-[520px] rounded-full opacity-35 blur-[100px] max-md:h-[320px] max-md:w-[320px] max-md:opacity-25"
        style={{
          background:
            "radial-gradient(circle, rgba(24,255,109,0.45) 0%, rgba(24,255,109,0.12) 45%, transparent 72%)",
        }}
      />

      <div
        className="absolute right-[-8%] top-[18%] h-[480px] w-[480px] rounded-full opacity-30 blur-[110px] max-md:hidden"
        style={{
          background:
            "radial-gradient(circle, rgba(47,191,255,0.42) 0%, rgba(47,191,255,0.1) 50%, transparent 75%)",
        }}
      />

      <div
        className="absolute bottom-[6%] left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full opacity-25 blur-[120px] max-md:h-[340px] max-md:w-[340px]"
        style={{
          background:
            "radial-gradient(circle, rgba(232,220,200,0.18) 0%, rgba(24,255,109,0.08) 40%, transparent 70%)",
        }}
      />

      <div
        className="absolute left-1/2 top-1/2 h-[1200px] w-[1200px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 max-md:h-[700px] max-md:w-[700px] max-md:opacity-22"
        style={{
          background:
            "radial-gradient(circle, rgba(24,255,109,0.2) 0%, rgba(47,191,255,0.08) 35%, transparent 70%)",
        }}
      />

      <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#2fbfff44] max-md:h-[320px] max-md:w-[320px]" />
      <div className="absolute left-1/2 top-1/2 hidden h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#18ff6d33] md:block" />
      <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#18ff6d44] to-transparent sm:block" />
      <div className="absolute left-1/2 top-20 hidden h-[280px] w-[700px] -translate-x-1/2 rounded-b-[40px] border border-[#2fbfff33] md:block" />
      <div className="absolute bottom-20 left-1/2 hidden h-[280px] w-[700px] -translate-x-1/2 rounded-t-[40px] border border-[#18ff6d33] md:block" />

      <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-[#2fbfff]/12 via-[#18ff6d]/8 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_40%,rgba(4,10,16,.58)_100%)]" />
    </div>
  );
}
