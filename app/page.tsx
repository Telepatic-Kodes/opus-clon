import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import Features from "@/components/features";

export default function Home() {
  return (
    <main className="relative bg-[#0a0a0a] text-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <Features />

      {/* Footer */}
      <footer className="border-t border-[#1f1f1f] py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
              <span className="text-white text-xs font-bold">O</span>
            </div>
            <span className="text-sm text-[#737373]">
              © 2025 OpusClip. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-6">
            {["Privacy", "Terms", "Contact"].map((link) => (
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
