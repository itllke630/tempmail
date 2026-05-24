import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import type { OtpMatch } from "../../types";

interface OtpBadgeProps {
  code: string;
  confidence: OtpMatch["confidence"];
}

const confidenceColors: Record<string, string> = {
  high: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/40",
  medium: "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/30",
  low: "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-700/40",
};

export function OtpBadge({ code, confidence }: OtpBadgeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("OTP copied");
      setTimeout(() => setCopied(false), 1500);
    } catch { /* noop */ }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-xs font-mono font-bold cursor-pointer transition-colors ${confidenceColors[confidence] || confidenceColors.low}`}
    >
      {copied ? "✓" : "OTP"}: {code}
    </motion.button>
  );
}
