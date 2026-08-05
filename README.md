# Analog Archive

A clean, archival film negative organization and roll tracking app. Built with Next.js 14 and Tailwind CSS.

---

## Getting started locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploying to Vercel from GitHub

1. **Push this folder** to your GitHub repo (replace existing files)
2. Go to [vercel.com](https://vercel.com) → your project → **Redeploy**
3. That's it — Vercel auto-detects Next.js, no config needed

---

## Project structure

```
analog-archive/
├── app/
│   ├── globals.css       # Base styles + status pill classes
│   ├── layout.jsx        # Root layout with Inter font
│   └── page.jsx          # Main app — all panels and state
├── components/
│   ├── Sidebar.jsx       # Left navigation
│   ├── RollModal.jsx     # Add / edit roll modal
│   ├── FrameModal.jsx    # Edit individual frame metadata
│   └── Lightbox.jsx      # Full-screen frame viewer
├── lib/
│   └── store.js          # Seed data, localStorage persistence, constants
├── tailwind.config.js
├── next.config.mjs
└── package.json
```

---

## Features (v3)

- Dashboard with stats, recent rolls, recent scans
- Full roll management — add, edit, delete
- Per-roll metadata: camera, lens, ISO metered, box speed, push/pull, dev process, location, notes
- Push/pull tracking displayed across all cards and detail views
- Contact sheet view for developed rolls (36 frames)
- Frame-level editing — aperture, shutter, subject, lighting, flag (star/reject/review)
- Lightbox frame viewer with keyboard navigation (← →)
- Scan organization panel (color / B&W filter)
- Sessions and film stock panels
- Export panel
- All data persisted to localStorage — survives page refresh

---

## Adding a database later (Supabase)

When you're ready to add real persistence and multi-device sync:

1. Create a free project at [supabase.com](https://supabase.com)
2. Run the SQL below in the Supabase SQL editor
3. Add your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vercel environment variables
4. Replace `loadRolls` / `saveRolls` in `lib/store.js` with Supabase queries

```sql
create table rolls (
  id bigint primary key generated always as identity,
  name text not null,
  stock text,
  camera text,
  lens text,
  iso text,
  box_speed text,
  format text,
  process text,
  pushpull text default 'none',
  session_name text,
  status text default 'shot',
  location text,
  notes text,
  frames int default 36,
  color boolean default true,
  frames_data jsonb default '{}',
  date_shot text,
  created_at timestamptz default now()
);
```
