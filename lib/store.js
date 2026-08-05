"use client";

export const SEED_ROLLS = [
  {
    id: 1, name: "Aēmoni portraits — color",
    stock: "CineStill 400D", camera: "Nikon FM2", lens: "50mm f/1.4",
    iso: "400", box: "400", format: "35mm", process: "C-41",
    pushpull: "none", session: "Portraits of Aēmoni",
    status: "developed", date: "Jul 2025", frames: 36, color: true,
    location: "Bushwick Studio, Brooklyn",
    notes: "South-facing windows, noon light. Direct sun — no diffusion. Exposed at box speed.",
    frames_data: {},
  },
  {
    id: 2, name: "Aēmoni portraits — B&W",
    stock: "Kentmere Pan 400", camera: "Nikon FM2", lens: "50mm f/1.4",
    iso: "400", box: "400", format: "35mm", process: "B&W standard",
    pushpull: "none", session: "Portraits of Aēmoni",
    status: "developed", date: "Jul 2025", frames: 36, color: false,
    location: "Bushwick Studio, Brooklyn",
    notes: "High contrast noon light worked beautifully in B&W.",
    frames_data: {},
  },
  {
    id: 3, name: "TWA Terminal roll 1",
    stock: "Kodak Portra 400", camera: "Nikon FM2", lens: "35mm f/2",
    iso: "400", box: "400", format: "35mm", process: "C-41",
    pushpull: "none", session: "TWA Terminal editorial",
    status: "lab", date: "Aug 2025", frames: 36, color: true,
    location: "JFK Airport, Queens NY",
    notes: "West-facing lobby glass. Shot 3–5pm for warm directional light.",
    frames_data: {},
  },
  {
    id: 4, name: "Citi Field series #1",
    stock: "CineStill 400D", camera: "Nikon FM2", lens: "50mm f/1.4",
    iso: "400", box: "400", format: "35mm", process: "C-41",
    pushpull: "none", session: "Stadium series",
    status: "shot", date: "Sep 2025", frames: 36, color: true,
    location: "Citi Field, Queens NY",
    notes: "Blue and orange seat bowl. Late afternoon natural light.",
    frames_data: {},
  },
  {
    id: 5, name: "Street — Brooklyn",
    stock: "CineStill 400D", camera: "Nikon FM2", lens: "35mm f/2",
    iso: "800", box: "400", format: "35mm", process: "C-41",
    pushpull: "push1", session: "",
    status: "lab", date: "Oct 2025", frames: 36, color: true,
    location: "Brooklyn, NY",
    notes: "Push +1 — metered at 800 for low light street work at dusk.",
    frames_data: {},
  },
  {
    id: 6, name: "Test roll expired Portra",
    stock: "Portra 160 NC", camera: "Nikon FM2", lens: "50mm f/1.4",
    iso: "40", box: "160", format: "35mm", process: "C-41",
    pushpull: "none", session: "",
    status: "shot", date: "Nov 2025", frames: 36, color: true,
    location: "",
    notes: "Expired 2004. Metered 2 stops over (ISO 40). Develop normally C-41.",
    frames_data: {},
  },
];

export const PP_LABELS = {
  none: "Normal", push1: "Push +1", push2: "Push +2",
  push3: "Push +3", pull1: "Pull -1", pull2: "Pull -2",
};

export const THUMB_BGS = {
  "CineStill 400D":  "#E6F1FB",
  "Kentmere Pan 400":"#F1EFE8",
  "Kodak Portra 400":"#FAEEDA",
  "Kodak Gold 200":  "#FDF3DC",
  "CineStill 50D":   "#EAF3DE",
  "Portra 160 NC":   "#FAECE7",
};

export const STATUS_LABELS = { developed: "Developed", lab: "At lab", shot: "Shot" };
export const PILL_MAP = { developed: "pill-developed", lab: "pill-lab", shot: "pill-shot" };
export const DOT_COLORS = { developed: "#639922", lab: "#BA7517", shot: "#888780" };

const STORAGE_KEY = "analog-archive-rolls-v2";

export function loadRolls() {
  if (typeof window === "undefined") return SEED_ROLLS;
  try {
    // Clear old v1 cache so stale frame counts don't persist
    localStorage.removeItem("analog-archive-rolls");
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : SEED_ROLLS;
  } catch { return SEED_ROLLS; }
}

export function saveRolls(rolls) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rolls));
}
