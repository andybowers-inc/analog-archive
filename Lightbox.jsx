"use client";
import { useEffect } from "react";
import { PP_LABELS } from "../lib/store";

export default function Lightbox({ roll, frame, onClose, onNav, onEditFrame }) {
  const fd = roll?.frames_data?.[frame] || {};
  const tags = [roll?.stock, roll?.format, `ISO ${roll?.iso}`];
  if (fd.aperture) tags.push(fd.aperture);
  if (fd.shutter) tags.push(fd.shutter);
  if (roll?.pushpull && roll.pushpull !== "none") tags.push(PP_LABELS[roll.pushpull]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowLeft") onNav(-1);
      if (e.key === "ArrowRight") onNav(1);
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onNav, onClose]);

  if (!roll) return null;

  return (
    <div className="fixed inset-0 bg-black/92 flex items-center justify-center z-50 flex-col">
      <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white text-2xl leading-none">✕</button>

      {/* Frame placeholder */}
      <div className="w-64 h-64 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-4">
        <span className="text-white/20 text-xs uppercase tracking-widest">Scan not uploaded</span>
      </div>

      {/* Meta */}
      <p className="text-white/75 text-sm mb-1">{roll.name} · Frame {frame}</p>
      <p className="text-white/40 text-xs mb-3">{fd.subject || "No subject noted"}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 justify-center mb-4">
        {tags.map(t => (
          <span key={t} className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-white/55">{t}</span>
        ))}
      </div>

      {/* Edit frame btn */}
      <button
        onClick={onEditFrame}
        className="mb-4 px-4 py-1.5 border border-white/20 rounded-lg text-sm text-white/65 bg-white/07 hover:bg-white/15 transition-colors"
      >
        ✎ Edit frame
      </button>

      {/* Nav */}
      <div className="flex gap-3">
        <button onClick={()=>onNav(-1)} className="px-5 py-1.5 bg-white/08 border border-white/14 text-white/65 text-sm rounded-lg hover:bg-white/16">← Prev</button>
        <button onClick={()=>onNav(1)}  className="px-5 py-1.5 bg-white/08 border border-white/14 text-white/65 text-sm rounded-lg hover:bg-white/16">Next →</button>
      </div>
      <p className="text-white/25 text-xs mt-3">Use arrow keys to navigate</p>
    </div>
  );
}
