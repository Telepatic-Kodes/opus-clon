"use client";

import { motion } from "framer-motion";
import { RotateCcw, Sparkles } from "lucide-react";
import type { Clip } from "@/types";
import ClipCard from "./clip-card";

interface ClipsGridProps {
  clips: Clip[];
  jobId: string;
  onReset: () => void;
}

export default function ClipsGrid({ clips, onReset }: ClipsGridProps) {
  const sorted = [...clips].sort((a, b) => b.score - a.score);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full
                          bg-green-500/10 border border-green-500/20">
            <Sparkles className="w-3.5 h-3.5 text-green-400" />
            <span className="text-green-400 text-sm font-semibold">
              {sorted.length} clip{sorted.length !== 1 ? "s" : ""} generated
            </span>
          </div>
          <span className="text-[#525252] text-sm">
            Sorted by virality score
          </span>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl
                     bg-[#111] border border-[#262626] hover:border-violet-500/40
                     text-[#a3a3a3] hover:text-white text-sm font-medium
                     transition-all duration-200"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Create another video
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {sorted.map((clip, i) => (
          <ClipCard key={clip.id} clip={clip} index={i} />
        ))}
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: sorted.length * 0.08 + 0.3, duration: 0.5 }}
        className="mt-12 text-center"
      >
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                     font-semibold text-sm text-white
                     bg-gradient-to-r from-violet-600 to-violet-500
                     hover:from-violet-500 hover:to-violet-400
                     transition-all duration-200
                     shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50"
        >
          <Sparkles className="w-4 h-4" />
          Process another video
        </button>
      </motion.div>
    </motion.div>
  );
}
