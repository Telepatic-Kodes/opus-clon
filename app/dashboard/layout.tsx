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
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Nav items ────────────────────────────────────────────────────────────────

const navItems = [
  { label: "Home", href: "/", icon: LayoutDashboard },
  { label: "My Projects", href: "/dashboard", icon: Folder },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
] as const;

// ─── Sidebar content ──────────────────────────────────────────────────────────

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-[#1a1a1a]">
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          onClick={onClose}
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/25">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="text-sm font-bold text-white tracking-tight">
            OpusClip
          </span>
        </Link>
        {/* Close button — only on mobile overlay */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#737373] hover:text-white hover:bg-[#1f1f1f] transition-colors lg:hidden"
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
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative",
                isActive
                  ? "bg-violet-500/10 text-violet-400 border border-violet-500/20 border-l-2 border-l-violet-500"
                  : "text-[#737373] hover:text-white hover:bg-[#1a1a1a] border border-transparent"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#1f1f1f]">
        <p className="text-[10px] text-[#404040]">
          © {new Date().getFullYear()} OpusClip
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
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 bg-[#0d0d0d] border-r border-[#1f1f1f] fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile: top nav bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#0d0d0d] border-b border-[#1f1f1f] flex items-center px-4 h-14">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-[#737373] hover:text-white hover:bg-[#1f1f1f] transition-colors mr-3"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white fill-white" />
          </div>
          <span className="text-sm font-bold text-white">OpusClip</span>
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
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-[#0d0d0d] border-r border-[#1f1f1f] flex flex-col"
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
