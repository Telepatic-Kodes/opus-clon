"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  LayoutDashboard,
  Folder,
  Settings,
  Menu,
  X,
  CalendarClock,
  Palette,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Nav items ────────────────────────────────────────────────────────────────

const navItems = [
  { label: "Home",          href: "/",                    icon: LayoutDashboard },
  { label: "Mis Proyectos", href: "/dashboard",           icon: Folder },
  { label: "Programar",     href: "/dashboard/schedule",  icon: CalendarClock },
  { label: "Brand Kit",     href: "/dashboard/brand",     icon: Palette },
  { label: "Analytics",     href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Settings",      href: "/dashboard/settings",  icon: Settings },
] as const;

// ─── Sidebar content ──────────────────────────────────────────────────────────

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-[#1E2030]">
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          onClick={onClose}
        >
          <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5" style={{ color: "#A8FF00" }} />
          </div>
          <span
            className="font-black text-sm tracking-tighter"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span style={{ color: "#F0F0F2" }}>AI</span>
            <span style={{ color: "#A8FF00" }}>AI</span>
            <span style={{ color: "#F0F0F2" }}>AI</span>
          </span>
        </Link>
        {/* Close button — only on mobile overlay */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 transition-colors lg:hidden"
            style={{ color: "#6B6D82" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#F0F0F2"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#6B6D82"; }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard" || pathname.startsWith("/dashboard/")
              : pathname === href;

          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              style={{ fontFamily: "var(--font-mono)" }}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-xs uppercase tracking-widest transition-colors",
                isActive
                  ? "bg-[#A8FF00]/8 border-l-2 border-l-[#A8FF00] text-[#A8FF00]"
                  : "text-[#6B6D82] hover:text-white border-l-2 border-l-transparent"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[#1E2030]">
        <p className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "#4B4D62" }}>
          © 2025 AIAIAI
        </p>
      </div>
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex" style={{ background: "#0B0C10" }}>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-56 flex-shrink-0 fixed inset-y-0 left-0 z-30 border-r border-[#1E2030]"
        style={{ background: "#0B0C10" }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile: top nav bar */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-40 border-b border-[#1E2030] flex items-center px-4 h-14"
        style={{ background: "#0B0C10" }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 transition-colors mr-3"
          style={{ color: "#6B6D82" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#F0F0F2"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#6B6D82"; }}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center">
            <Zap className="w-4 h-4" style={{ color: "#A8FF00" }} />
          </div>
          <span
            className="font-black text-sm tracking-tighter"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span style={{ color: "#F0F0F2" }}>AI</span>
            <span style={{ color: "#A8FF00" }}>AI</span>
            <span style={{ color: "#F0F0F2" }}>AI</span>
          </span>
        </Link>
      </header>

      {/* Mobile: slide-in sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r border-[#1E2030]"
              style={{ background: "#0B0C10" }}
            >
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 lg:ml-56 flex flex-col min-h-screen">
        {/* Mobile top nav spacer */}
        <div className="lg:hidden h-14 flex-shrink-0" />
        {children}
      </main>
    </div>
  );
}
