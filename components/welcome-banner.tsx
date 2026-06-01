"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function WelcomeBanner() {
  const [visible, setVisible] = useState(false);

  // Only check localStorage on mount (client-side)
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("opus_visited")) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    if (typeof window !== "undefined") {
      localStorage.setItem("opus_visited", "1");
    }
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="welcome-banner"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="fixed bottom-6 right-6 z-50 w-80 bg-[#111] border border-[#262626] rounded-2xl p-5 shadow-2xl shadow-black/60"
        >
          {/* Close button */}
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-[#525252] hover:text-white hover:bg-[#1f1f1f] transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Content */}
          <p className="text-base font-semibold text-white mb-2 pr-6">
            👋 Bienvenido a OpusClip
          </p>
          <p className="text-xs text-[#a3a3a3] leading-relaxed mb-3">
            Pega cualquier URL de YouTube y la IA generará clips virales
            automáticamente.
          </p>
          <p className="text-xs text-[#737373] leading-relaxed mb-4">
            💡 Tip: Funciona mejor con videos de +5 minutos con diálogo.
          </p>

          <button
            onClick={dismiss}
            className="w-full py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 transition-all shadow-lg shadow-violet-500/25"
          >
            Entendido
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
