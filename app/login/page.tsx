"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setMessage("");

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setMessage(error.message);
          setLoading(false);
          return;
        }

        setMessage("Kontot skapades! Du kan nu logga in.");
        setMode("login");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      setMessage("Något gick fel.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0E0E0E] px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1A1A1A] p-8">
        <p className="text-[#E8DCC8]">BrainStats Account</p>

        <h1 className="mt-3 text-5xl font-bold text-white">
          {mode === "login" ? "Logga in" : "Skapa konto"}
        </h1>

        <p className="mt-4 text-[#A9A9A9]">
          {mode === "login"
            ? "Logga in med e-post och lösenord."
            : "Skapa ett konto för att spara dina analyser."}
        </p>

        <input
          type="email"
          placeholder="E-post"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-8 w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none"
        />

        <input
          type="password"
          placeholder="Lösenord"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none"
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 w-full rounded-full bg-[#E8DCC8] py-4 font-bold text-black disabled:opacity-40"
        >
          {loading
            ? "Vänta..."
            : mode === "login"
            ? "Logga in"
            : "Skapa konto"}
        </button>

        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setMessage("");
          }}
          className="mt-5 w-full text-[#E8DCC8]"
        >
          {mode === "login"
            ? "Har du inget konto? Skapa konto"
            : "Har du redan konto? Logga in"}
        </button>

        {message && (
          <div className="mt-5 rounded-2xl bg-black/30 p-4 text-[#E8DCC8]">
            {message}
          </div>
        )}
      </div>
    </main>
  );
}