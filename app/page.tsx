import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import Features from "@/components/features";
import WelcomeBanner from "@/components/welcome-banner";
import RecentClips from "@/components/recent-clips";
import CtaSection from "@/components/cta-section";

export default function Home() {
  return (
    <main className="relative bg-[#0a0a0a] text-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <Features />
      <RecentClips />
      <WelcomeBanner />
      <CtaSection />

      {/* Footer */}
      <footer className="py-10 px-6 lg:px-12" style={{ borderTop: "1px solid #1E2030" }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <span
              className="font-black text-lg tracking-widest uppercase"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <span style={{ color: "#F0F0F2" }}>AI</span>
              <span style={{ color: "#A8FF00" }}>AI</span>
              <span style={{ color: "#F0F0F2" }}>AI</span>
            </span>
            <p
              className="text-xs mt-1"
              style={{ fontFamily: "var(--font-mono)", color: "#4B4D62" }}
            >
              © 2025 AIAIAI. Todos los derechos reservados.
            </p>
          </div>
          <div className="flex items-center gap-8">
            {["Privacidad", "Términos", "Contacto"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-xs uppercase tracking-widest transition-colors hover:text-white"
                style={{ fontFamily: "var(--font-mono)", color: "#4B4D62" }}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
