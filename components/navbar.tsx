"use client";

import { useState, useEffect } from "react";
import { Zap, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Solutions", href: "#solutions" },
  { label: "Resources", href: "#resources" },
  { label: "Pricing", href: "#pricing" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#262626]"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              OpusClip
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-sm text-[#a3a3a3] hover:text-white rounded-lg hover:bg-white/5 transition-all duration-150"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="#"
              className="text-sm text-[#a3a3a3] hover:text-white transition-colors"
            >
              Sign in
            </a>
            <a
              href="#"
              className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 transition-all duration-200 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
            >
              Get free clips
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-[#a3a3a3] hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-[#262626]">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block px-4 py-3 text-sm text-[#a3a3a3] hover:text-white rounded-lg hover:bg-white/5 transition-all"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-[#262626] flex flex-col gap-2">
              <a
                href="#"
                className="block px-4 py-3 text-sm text-center text-[#a3a3a3] hover:text-white rounded-lg hover:bg-white/5 transition-all"
              >
                Sign in
              </a>
              <a
                href="#"
                className="block px-4 py-3 text-sm font-semibold text-center text-white rounded-lg bg-gradient-to-r from-violet-600 to-violet-500"
              >
                Get free clips
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
