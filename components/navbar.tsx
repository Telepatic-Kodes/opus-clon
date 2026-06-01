"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Funciones", href: "#features" },
  { label: "Soluciones", href: "#solutions" },
  { label: "Recursos", href: "#resources" },
  { label: "Precios", href: "/pricing" },
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
          ? "bg-[#0B0C10]/95 backdrop-blur-xl border-b border-[#A8FF00]/20"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-0 group">
            <span
              style={{ fontFamily: "var(--font-display)" }}
              className="text-xl font-black tracking-widest uppercase"
            >
              <span className="text-white">AI</span>
              <span style={{ color: "#A8FF00" }}>AI</span>
              <span className="text-white">AI</span>
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0">
            {navLinks.map((link, i) => (
              <span key={link.label} className="flex items-center">
                {i > 0 && (
                  <span
                    className="text-[#2E3050] select-none px-1"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    /
                  </span>
                )}
                <a
                  href={link.href}
                  className="px-3 py-2 text-xs uppercase tracking-widest transition-colors duration-150"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "#6B6D82",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#F0F0F2")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#6B6D82")
                  }
                >
                  {link.label}
                </a>
              </span>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="#"
              className="text-xs font-medium uppercase tracking-widest transition-colors duration-150"
              style={{ fontFamily: "var(--font-mono)", color: "#6B6D82" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#F0F0F2")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#6B6D82")}
            >
              ACCEDER
            </a>
            <a
              href="#"
              className="px-5 py-2 text-xs font-black uppercase tracking-widest
                         bg-[#A8FF00] text-[#0B0C10] rounded-none
                         hover:bg-white transition-colors duration-150"
              style={{ fontFamily: "var(--font-display)" }}
            >
              PROCESAR VIDEO →
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 transition-colors"
            style={{ color: "#6B6D82" }}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = "#F0F0F2")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = "#6B6D82")
            }
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden border-b"
          style={{
            background: "rgba(11,12,16,0.97)",
            backdropFilter: "blur(20px)",
            borderColor: "#1E2030",
          }}
        >
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-0.5">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block px-4 py-3 text-xs uppercase tracking-widest transition-colors duration-150"
                style={{ fontFamily: "var(--font-mono)", color: "#6B6D82" }}
                onClick={() => setMobileOpen(false)}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "#F0F0F2")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "#6B6D82")
                }
              >
                {link.label}
              </a>
            ))}
            <div
              className="pt-3 mt-2 border-t flex flex-col gap-2"
              style={{ borderColor: "#1E2030" }}
            >
              <a
                href="#"
                className="block px-4 py-3 text-xs text-center uppercase tracking-widest transition-colors"
                style={{ fontFamily: "var(--font-mono)", color: "#6B6D82" }}
              >
                ACCEDER
              </a>
              <a
                href="#"
                className="block px-4 py-3 text-xs font-black text-center uppercase tracking-widest
                           bg-[#A8FF00] text-[#0B0C10] hover:bg-white transition-colors duration-150"
                style={{ fontFamily: "var(--font-display)" }}
              >
                PROCESAR VIDEO →
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
