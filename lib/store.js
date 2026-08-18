"use client";

// Empty seed — every user starts with a clean archive
export const SEED_ROLLS = [];

export const PP_LABELS = {
  none: "Normal", push1: "Push +1", push2: "Push +2",
  push3: "Push +3", pull1: "Pull -1", pull2: "Pull -2",
};

export const THUMB_BGS = {
  "Kentmere Pan 400":"#F1EFE8",
  "Kodak Portra 400":"#FAEEDA",
};

export const STATUS_LABELS = { developed: "Developed", lab: "At lab", shot: "Shot" };
export const PILL_MAP = { developed: "pill-developed", lab: "pill-lab", shot: "pill-shot" };
export const DOT_COLORS = { developed: "#639922", lab: "#BA7517", shot: "#888780" };

const STORAGE_KEY = "analog-archive-rolls-v2";

export function loadRolls() {
  if (typeof window === "undefined") return SEED_ROLLS;
  try {
    localStorage.removeItem("analog-archive-rolls");
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : SEED_ROLLS;
  } catch { return SEED_ROLLS; }
}

export function saveRolls(rolls) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rolls));
}
