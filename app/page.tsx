import Link from "next/link";
import Navbar from "@/components/Navbar";
import Button from "@/components/Button";
import FootballBackground from "@/components/FootballBackground";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-[#FAFAF8]">
      <FootballBackground />
  
      <div className="relative z-10">
        <Navbar />

      <section className="mx-auto flex max-w-7xl flex-col items-center px-8 py-32 text-center">
        <span className="rounded-full border border-[#E8DCC8]/20 px-5 py-2 text-sm text-[#E8DCC8]">
          🧠 AI-driven fotbollsanalys
        </span>

        <h2 className="mt-8 max-w-5xl text-6xl font-bold leading-tight">
          Klistra in din spelidé. Få smart AI-analys.
        </h2>

        <p className="mt-8 max-w-2xl text-lg text-[#A9A9A9]">
          BrainStats hjälper dig att analysera matcher, statistik, form, skador
          och risker. Tjänsten är ett analysverktyg och tar inte emot spel eller
          pengar.
        </p>

        <div className="mt-12 flex flex-wrap justify-center gap-5">
          <Link href="/analyze">
            <Button>📝 Klistra in spelidé</Button>
          </Link>

          <Link href="/builder">
            <Button variant="secondary">⚽ Bygg spelidé</Button>
          </Link>

          <Link href="/premium">
            <Button variant="secondary">💎 Se Premium</Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-8 pb-24 md:grid-cols-3">
        {[
          ["📋 Klistra in", "Kopiera din spelidé och låt BrainStats tolka den."],
          [
            "🧠 Brain Engine",
            "Få BrainScore™, risknivå och identifierade marknader.",
          ],
          ["💎 Premium", "Lås upp djupare rapporter och fler analyser."],
        ].map(([title, text]) => (
          <div key={title} className="rounded-3xl bg-[#1A1A1A] p-8">
            <h3 className="text-xl font-bold text-[#E8DCC8]">{title}</h3>
            <p className="mt-4 text-[#A9A9A9]">{text}</p>
          </div>
        ))}
      </section>
      </div>
    </main>
  );
}