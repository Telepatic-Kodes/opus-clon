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
      <footer className="border-t border-[#1f1f1f] py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-white text-sm font-black tracking-tighter">AI</span>
              <span className="text-violet-400 text-sm font-black tracking-tighter">AI</span>
              <span className="text-white text-sm font-black tracking-tighter">AI</span>
            </div>
            <span className="text-sm text-[#737373]">
              © 2025 AIAIAI. Todos los derechos reservados.
            </span>
          </div>
          <div className="flex items-center gap-6">
            {["Privacidad", "Términos", "Contacto"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-sm text-[#525252] hover:text-[#a3a3a3] transition-colors"
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
