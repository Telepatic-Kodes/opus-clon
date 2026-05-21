"use client";

import { motion } from "framer-motion";
import { Scissors, Type, Expand, Film } from "lucide-react";

const features = [
  {
    icon: Scissors,
    title: "ClipAnything",
    description:
      "Our AI watches your entire video, detects the most engaging moments, and extracts 10 viral-ready clips automatically. No editing skills required.",
    badge: "AI Powered",
    gradient: "from-violet-500/20 to-purple-500/10",
    iconBg: "bg-violet-500/15 text-violet-400",
    highlight: "from-violet-500 to-purple-500",
    metric: "10× faster",
    metricLabel: "clip creation",
  },
  {
    icon: Type,
    title: "Auto Captions",
    description:
      "Generate animated, speaker-aware captions with 99%+ accuracy. Customize fonts, colors, and animations to match your brand in seconds.",
    badge: "AI Powered",
    gradient: "from-blue-500/20 to-cyan-500/10",
    iconBg: "bg-blue-500/15 text-blue-400",
    highlight: "from-blue-500 to-cyan-500",
    metric: "99%+",
    metricLabel: "accuracy",
  },
  {
    icon: Expand,
    title: "ReframeAnything",
    description:
      "Intelligently reframe any horizontal video for 9:16, 1:1, or any aspect ratio. The AI tracks speakers and action to keep your subjects perfectly centered.",
    badge: "AI Powered",
    gradient: "from-emerald-500/20 to-teal-500/10",
    iconBg: "bg-emerald-500/15 text-emerald-400",
    highlight: "from-emerald-500 to-teal-500",
    metric: "3 formats",
    metricLabel: "auto-generated",
  },
  {
    icon: Film,
    title: "B-Roll AI",
    description:
      "Automatically source and insert contextually relevant B-roll footage that matches your content. Turn talking-head videos into dynamic, professional productions.",
    badge: "AI Powered",
    gradient: "from-orange-500/20 to-amber-500/10",
    iconBg: "bg-orange-500/15 text-orange-400",
    highlight: "from-orange-500 to-amber-500",
    metric: "1M+",
    metricLabel: "stock clips",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 lg:py-32 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-sm font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            AI Models
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Everything you need to go{" "}
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              viral
            </span>
          </h2>
          <p className="text-lg text-[#737373] max-w-2xl mx-auto">
            Four powerful AI models working together to transform any long video
            into platform-optimized short clips that drive results.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative group rounded-2xl border border-[#262626] bg-gradient-to-br ${feature.gradient} p-px overflow-hidden`}
              >
                {/* Inner card */}
                <div className="relative h-full rounded-2xl bg-[#0f0f0f] p-6 lg:p-8 overflow-hidden">
                  {/* Hover glow */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${feature.gradient} pointer-events-none`} />

                  <div className="relative z-10">
                    {/* Icon + badge row */}
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${feature.iconBg} ring-1 ring-white/5`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${feature.highlight} text-white shadow-sm`}
                      >
                        <span className="w-1 h-1 rounded-full bg-white/80" />
                        {feature.badge}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-violet-100 transition-colors">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-[#737373] leading-relaxed mb-6">
                      {feature.description}
                    </p>

                    {/* Metric */}
                    <div className="flex items-center gap-3 pt-5 border-t border-[#1f1f1f]">
                      <span
                        className={`text-2xl font-bold bg-gradient-to-r ${feature.highlight} bg-clip-text text-transparent`}
                      >
                        {feature.metric}
                      </span>
                      <span className="text-xs text-[#525252]">
                        {feature.metricLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mt-12"
        >
          <a
            href="#"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 transition-all duration-200 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
          >
            Start creating for free
            <span className="text-violet-200">→</span>
          </a>
          <p className="mt-3 text-xs text-[#525252]">
            No credit card required · 90 free credits on signup
          </p>
        </motion.div>
      </div>
    </section>
  );
}
