"use client";

import { motion } from "framer-motion";
import { Scissors, Type, Expand, Film, ArrowRight } from "lucide-react";

const features = [
  {
    num: "01",
    icon: Scissors,
    title: "ClipAnything",
    tag: "DETECCIÓN VIRAL",
    description:
      "IA que analiza tu video completo y extrae los 8–12 momentos con mayor potencial viral. Sin editar.",
    metric: "10×",
    metricLabel: "MÁS RÁPIDO",
  },
  {
    num: "02",
    icon: Type,
    title: "Auto Captions",
    tag: "SUBTÍTULOS IA",
    description:
      "Transcripción con Whisper. Subtítulos sincronizados, exportables como SRT o VTT.",
    metric: "99%+",
    metricLabel: "PRECISIÓN",
  },
  {
    num: "03",
    icon: Expand,
    title: "ReframeAnything",
    tag: "MULTI-FORMATO",
    description:
      "Reencuadre automático para 9:16, 1:1 y 16:9. La IA rastrea al hablante en todo momento.",
    metric: "3",
    metricLabel: "FORMATOS",
  },
  {
    num: "04",
    icon: Film,
    title: "B-Roll AI",
    tag: "EDICIÓN AUTOMÁTICA",
    description:
      "Detecta y elimina muletillas. Inserta B-roll contextual. Exporta listos para publicar.",
    metric: "1M+",
    metricLabel: "CLIPS STOCK",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="py-24 px-6 lg:px-12"
      style={{ borderTop: "1px solid #1E2030" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-16">
          <div>
            <p
              className="text-xs tracking-widest mb-3"
              style={{ fontFamily: "var(--font-mono)", color: "#A8FF00" }}
            >
              MODELOS DE IA / v2.0
            </p>
            <h2
              className="font-black uppercase leading-none"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(32px, 5vw, 64px)",
              }}
            >
              TODO LO QUE
              <br />
              NECESITAS.
            </h2>
          </div>
          <a
            href="/"
            className="hidden md:flex items-center gap-2 px-6 py-3 font-black uppercase tracking-widest text-xs transition-colors"
            style={{
              fontFamily: "var(--font-display)",
              background: "#A8FF00",
              color: "#0B0C10",
            }}
          >
            EMPEZAR <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Features list */}
        <div className="space-y-0">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.num}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="group flex items-start gap-6 py-8 cursor-default"
                style={{ borderBottom: "1px solid #1E2030" }}
              >
                {/* Number */}
                <span
                  className="font-black text-4xl w-16 flex-shrink-0 pt-1 transition-colors"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "#1E2030",
                  }}
                >
                  {f.num}
                </span>

                {/* Icon */}
                <div
                  className="w-10 h-10 flex items-center justify-center flex-shrink-0 mt-1"
                  style={{ border: "1px solid #1E2030" }}
                >
                  <Icon className="w-4 h-4" style={{ color: "#6B6D82" }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3
                      className="font-black uppercase text-lg"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {f.title}
                    </h3>
                    <span
                      className="text-xs px-2 py-0.5 tracking-widest"
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: "#A8FF00",
                        border: "1px solid rgba(168,255,0,0.3)",
                        background: "rgba(168,255,0,0.08)",
                      }}
                    >
                      {f.tag}
                    </span>
                  </div>
                  <p
                    className="text-sm leading-relaxed max-w-lg"
                    style={{ color: "#6B6D82" }}
                  >
                    {f.description}
                  </p>
                </div>

                {/* Metric */}
                <div className="text-right flex-shrink-0">
                  <div
                    className="font-black text-3xl transition-colors"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: "#2E3050",
                    }}
                  >
                    {f.metric}
                  </div>
                  <div
                    className="text-xs tracking-widest"
                    style={{ fontFamily: "var(--font-mono)", color: "#4B4D62" }}
                  >
                    {f.metricLabel}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
