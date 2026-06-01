"use client";
import { ArrowRight } from "lucide-react";

export default function CtaSection() {
  return (
    <section
      className="py-24 px-6 lg:px-12 relative overflow-hidden"
      style={{ borderTop: "1px solid #1E2030" }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(168,255,0,0.06), transparent)",
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="max-w-3xl">
          <p
            className="text-xs tracking-widest mb-6"
            style={{ fontFamily: "var(--font-mono)", color: "#A8FF00" }}
          >
            ¿LISTO PARA EMPEZAR? /
          </p>
          <h2
            className="font-black uppercase leading-[0.9] mb-8"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(40px, 6vw, 88px)",
            }}
          >
            TUS VIDEOS.
            <br />
            <span style={{ color: "#A8FF00" }}>SUS MEJORES</span>
            <br />
            MOMENTOS.
          </h2>
          <p
            className="text-sm mb-10 max-w-md"
            style={{ fontFamily: "var(--font-mono)", color: "#6B6D82" }}
          >
            Sin tarjeta de crédito. 90 créditos gratis.
            <br />
            Cancela cuando quieras.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-3 px-8 py-4 font-black uppercase tracking-widest text-sm transition-all hover:gap-5"
            style={{
              background: "#A8FF00",
              color: "#0B0C10",
              fontFamily: "var(--font-display)",
            }}
          >
            EMPEZAR GRATIS
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
