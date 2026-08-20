"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "../components/Sidebar";
import RollModal from "../components/RollModal";
import FrameModal from "../components/FrameModal";
import Lightbox from "../components/Lightbox";
import {
  loadRolls, saveRolls,
  THUMB_BGS, STATUS_LABELS, PILL_MAP, DOT_COLORS, PP_LABELS,
} from "../lib/store";
import { saveScans, loadScans } from "../lib/scanStorage";

const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const nowDate = () => `${months[new Date().getMonth()]} ${new Date().getFullYear()}`;

// Empty seed — every user starts with no sessions
const SEED_SESSIONS = [];

function loadSessions() {
  if (typeof window === "undefined") return SEED_SESSIONS;
  try {
    const s = localStorage.getItem("analog-archive-sessions-v1");
    return s ? JSON.parse(s) : SEED_SESSIONS;
  } catch { return SEED_SESSIONS; }
}
function saveSessions(sessions) {
  if (typeof window === "undefined") return;
  localStorage.setItem("analog-archive-sessions-v1", JSON.stringify(sessions));
}

function PushPill({ pp }) {
  if (!pp || pp === "none") return null;
  const cls = pp.startsWith("push") ? "push-pill" : "pull-pill";
  return <span className={`${cls} text-[10px] font-medium px-2 py-0.5 rounded-full`}>{PP_LABELS[pp]}</span>;
}

function StatusPill({ status }) {
  return <span className={`${PILL_MAP[status]} text-[10px] font-medium px-2 py-0.5 rounded-full`}>{STATUS_LABELS[status]}</span>;
}

function ContactSheet({ roll, rollScans, onFrameClick }) {
  if (roll.status !== "developed") {
    return (
      <div className="border border-dashed border-[#D8D7D0] rounded-xl p-8 text-center text-[#9A9990] text-sm">
        {roll.status === "lab" ? "Roll is at the lab — scans will appear once returned." : "Roll has not yet been developed."}
      </div>
    );
  }
  const uploadedScans = (rollScans?.[roll.id] || []);
  return (
    <div className="border border-[#E5E4DF] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#F7F6F3] border-b border-[#E5E4DF]">
        <span className="text-xs font-medium text-[#1A1A18]">{roll.frames} frames · {roll.stock} · {roll.format} · {PP_LABELS[roll.pushpull] || "Normal"}</span>
        <span className="text-xs text-[#9A9990]">{uploadedScans.length}/{roll.frames} scans uploaded · Click a frame to view or edit</span>
      </div>
      <div className="grid grid-cols-6 gap-px bg-[#E5E4DF]">
        {Array.from({ length: roll.frames }, (_, i) => {
          const n = i + 1;
          const fd = roll.frames_data?.[n] || {};
          const scan = uploadedScans.find(s => s.frame === n);
          const isColor = scan ? scan.color : (n % 4 !== 0 && roll.color);
          const flagEl = fd.flag === "star"
            ? <span className="absolute top-0.5 right-1 text-[9px] text-yellow-600">★</span>
            : fd.flag === "reject"
            ? <span className="absolute top-0.5 right-1 text-[9px] text-red-600">✕</span>
            : null;
          return (
            <button key={n} onClick={() => onFrameClick(n)}
              className="aspect-square bg-[#F7F6F3] hover:bg-[#EEEEE8] flex items-center justify-center relative transition-colors overflow-hidden">
              {scan ? (
                <img src={scan.src} alt={`Frame ${n}`} className="w-full h-full object-cover"/>
              ) : (
                <span className="text-[9px] text-[#9A9990]">{roll.color ? "▪" : "◆"}</span>
              )}
              <span className={`${isColor ? "tag-color" : "tag-bw"} absolute bottom-0.5 left-0.5 text-[8px] px-1 py-px rounded font-medium`}>
                {isColor ? "C" : "B&W"}
              </span>
              {flagEl}
              <span className="absolute bottom-0.5 right-1 text-[8px] text-[#C0BFB8]">{n}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Dashboard({ rolls, rollScans, onNewRoll, onViewRolls, onViewScans, onRollClick, onEditRoll }) {
  const developed = rolls.filter(r => r.status === "developed");
  const labCount = rolls.filter(r => r.status === "lab").length;
  const stocks = new Set(rolls.map(r => r.stock)).size;
  const totalScans = developed.reduce((sum, r) => sum + (r.frames || 36), 0);
  const earliestDate = rolls.length > 0 ? [...rolls].sort((a, b) => a.id - b.id)[0].date : "your first roll";

  // Gather all uploaded scans with their roll context, sorted by most recently assigned (id desc)
  const allUploadedScans = [];
  developed.forEach(r => {
    (rollScans[r.id] || []).forEach(scan => {
      allUploadedScans.push({ ...scan, roll: r });
    });
  });
  allUploadedScans.sort((a, b) => b.id - a.id);

  // 30-day window with fallback to most recent 6 if window is empty
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentScans = allUploadedScans.filter(s => s.id > thirtyDaysAgo);
  const displayScans = recentScans.length > 0 ? recentScans.slice(0, 6) : allUploadedScans.slice(0, 6);
  const isFiltered = recentScans.length > 0;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E4DF]">
        <div><p className="text-[15px] font-medium text-[#1A1A18]">Dashboard</p><p className="text-xs text-[#9A9990] mt-0.5">Your archive at a glance</p></div>
        <button onClick={onNewRoll} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#D8D7D0] rounded-lg text-[#4A4A46] hover:bg-[#F7F6F3]">+ Add roll</button>
      </div>
      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label:"Total rolls", value: rolls.length, detail:`Since ${earliestDate}` },
            { label:"Scans",       value: totalScans,   detail:"Across all rolls" },
            { label:"At lab",      value: labCount,     detail:"Pending return" },
            { label:"Film stocks", value: stocks,        detail:"Used to date" },
          ].map(s => (
            <div key={s.label} className="bg-white border border-[#E5E4DF] rounded-xl p-4">
              <p className="text-[10px] font-medium text-[#9A9990] uppercase tracking-wide mb-1.5">{s.label}</p>
              <p className="text-2xl font-medium text-[#1A1A18]">{s.value}</p>
              <p className="text-[11px] text-[#9A9990] mt-0.5">{s.detail}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-[#1A1A18]">Recent rolls</p>
          <button onClick={onViewRolls} className="text-xs text-[#9A9990] hover:text-[#4A4A46]">View all</button>
        </div>
        {rolls.length === 0 ? (
          <div className="bg-white border border-dashed border-[#D8D7D0] rounded-xl p-8 text-center mb-6">
            <p className="text-sm font-medium text-[#1A1A18] mb-1">No rolls yet</p>
            <p className="text-xs text-[#9A9990] mb-4">Add your first roll to start building your archive</p>
            <button onClick={onNewRoll} className="px-4 py-2 bg-[#1A1A18] text-white text-xs rounded-lg font-medium hover:bg-[#333]">+ Add your first roll</button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {rolls.slice(0, 3).map(r => (
              <div key={r.id} className="bg-white border border-[#E5E4DF] rounded-xl overflow-hidden cursor-pointer hover:border-[#C8C7C0] transition-colors relative group" onClick={() => onRollClick(r.id)}>
                <button className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 bg-white border border-[#E5E4DF] rounded px-1.5 py-0.5 text-[10px] text-[#4A4A46] hover:bg-[#F7F6F3] z-10 transition-opacity"
                  onClick={e=>{e.stopPropagation();onEditRoll(r.id);}}>✎ Edit</button>
                <div className="flex items-center justify-center relative" style={{height:72,background:THUMB_BGS[r.stock]||"#F1EFE8"}}>
                  <span className="text-[10px] font-medium text-[#4A4A46] uppercase tracking-wide">{r.stock}</span>
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{background:DOT_COLORS[r.status]}}/>
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-medium text-[#1A1A18] truncate">{r.name}</p>
                  <p className="text-[11px] text-[#9A9990] mt-0.5">{r.format} · {r.year || r.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-[#1A1A18]">Recent scans</p>
          <div className="flex items-center gap-3">
            {isFiltered && <span className="text-[10px] text-[#9A9990]">Last 30 days</span>}
            <button onClick={onViewScans} className="text-xs text-[#9A9990] hover:text-[#4A4A46]">View all</button>
          </div>
        </div>
        {displayScans.length > 0 ? (
          <div className="grid grid-cols-6 gap-2">
            {displayScans.map((scan, i) => (
              <div key={scan.id || i} className="aspect-square bg-white border border-[#E5E4DF] rounded-lg overflow-hidden relative cursor-pointer hover:border-[#C8C7C0]"
                onClick={() => onRollClick(scan.roll.id)}>
                <img src={scan.src} alt={scan.name} className="w-full h-full object-cover"/>
                <span className={`${scan.color ? "tag-color" : "tag-bw"} absolute bottom-1 left-1 text-[8px] px-1 py-px rounded font-medium`}>
                  {scan.color ? "C" : "B&W"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-[#D8D7D0] rounded-xl p-6 text-center">
            <p className="text-sm text-[#9A9990]">No scans uploaded yet</p>
            <p className="text-xs text-[#C0BFB8] mt-1">Upload scans in the Scans tab to see them here</p>
          </div>
        )}
      </div>
    </div>
  );
}

function RollsList({ rolls, activeFilter, onFilter, onRollClick, onEditRoll, onNewRoll }) {
  const [query, setQuery] = useState("");

  const statusFiltered = activeFilter === "all" ? rolls : rolls.filter(r => r.status === activeFilter);

  const filtered = query.trim() === "" ? statusFiltered : statusFiltered.filter(r => {
    const q = query.toLowerCase();
    return (
      r.name?.toLowerCase().includes(q) ||
      r.stock?.toLowerCase().includes(q) ||
      r.camera?.toLowerCase().includes(q) ||
      r.lens?.toLowerCase().includes(q) ||
      r.format?.toLowerCase().includes(q) ||
      r.location?.toLowerCase().includes(q) ||
      r.session?.toLowerCase().includes(q) ||
      r.notes?.toLowerCase().includes(q) ||
      r.year?.toString().includes(q) ||
      r.date?.toLowerCase().includes(q) ||
      r.status?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E4DF]">
        <div>
          <p className="text-[15px] font-medium text-[#1A1A18]">Rolls</p>
          <p className="text-xs text-[#9A9990] mt-0.5">
            {filtered.length} roll{filtered.length !== 1 ? "s" : ""}{query ? ` matching "${query}"` : ""}
          </p>
        </div>
        <button onClick={onNewRoll} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#D8D7D0] rounded-lg text-[#4A4A46] hover:bg-[#F7F6F3]">+ Add roll</button>
      </div>
      <div className="p-6">
        {/* Search bar */}
        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9990] text-sm pointer-events-none">⌕</span>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, stock, camera, location, year…"
            className="w-full pl-8 pr-8 py-2 border border-[#D8D7D0] rounded-lg text-sm bg-white text-[#1A1A18] placeholder-[#C0BFB8] focus:outline-none focus:border-[#1A1A18] transition-colors"
          />
          {query && (
            <button onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A9990] hover:text-[#1A1A18] text-sm leading-none">✕</button>
          )}
        </div>

        {/* Status filters */}
        <div className="flex gap-1.5 mb-4 flex-wrap">
          {["all","developed","lab","shot"].map(f => (
            <button key={f} onClick={() => onFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${activeFilter===f?"bg-[#1A1A18] text-white border-[#1A1A18]":"border-[#D8D7D0] text-[#4A4A46] hover:bg-[#F7F6F3]"}`}>
              {f==="all"?"All":STATUS_LABELS[f]}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-[#D8D7D0] rounded-xl p-8 text-center">
            {query ? (
              <>
                <p className="text-sm font-medium text-[#1A1A18] mb-1">No rolls found</p>
                <p className="text-xs text-[#9A9990]">No rolls match "{query}" — try a different search term</p>
                <button onClick={() => setQuery("")} className="mt-3 text-xs text-[#4A4A46] border border-[#D8D7D0] px-3 py-1.5 rounded-lg hover:bg-[#F7F6F3]">Clear search</button>
              </>
            ) : (
              <p className="text-sm text-[#9A9990]">No rolls yet — add your first roll to get started.</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(r => (
              <div key={r.id} className="bg-white border border-[#E5E4DF] rounded-xl px-4 py-3 flex items-center gap-4 hover:border-[#C8C7C0] transition-colors">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-[#9A9990] cursor-pointer" style={{background:THUMB_BGS[r.stock]||"#F1EFE8"}} onClick={()=>onRollClick(r.id)}>
                  <span className="text-xs">⊡</span>
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={()=>onRollClick(r.id)}>
                  <p className="text-sm font-medium text-[#1A1A18] truncate">{r.name}</p>
                  <p className="text-xs text-[#9A9990] mt-0.5">{r.stock} · {r.camera} · {r.format}{r.year ? " · "+r.year : r.date ? " · "+r.date : ""}{r.location ? " · "+r.location : ""}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <PushPill pp={r.pushpull}/>
                  <StatusPill status={r.status}/>
                  <button onClick={()=>onEditRoll(r.id)} className="text-xs px-2.5 py-1 border border-[#D8D7D0] rounded-lg text-[#9A9990] hover:text-[#1A1A18] hover:border-[#C8C7C0] flex items-center gap-1">✎ Edit</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RollDetail({ roll, rollScans, onBack, onEdit, onFrameClick }) {
  if (!roll) return null;
  const ppLabel = PP_LABELS[roll.pushpull] || "Normal";
  const ppCls = roll.pushpull && roll.pushpull !== "none" ? (roll.pushpull.startsWith("push") ? "push-pill" : "pull-pill") : "";
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E4DF]">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="text-xs text-[#9A9990] hover:text-[#1A1A18] flex items-center gap-1">← Rolls</button>
          <span className="text-[#D8D7D0]">/</span>
          <p className="text-sm font-medium text-[#1A1A18]">{roll.name}</p>
        </div>
        <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#D8D7D0] rounded-lg text-[#4A4A46] hover:bg-[#F7F6F3]">✎ Edit roll</button>
      </div>
      <div className="p-6">
        <div className="bg-[#F7F6F3] border border-[#E5E4DF] rounded-xl p-5 mb-4 flex gap-5 items-start">
          <div className="w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:THUMB_BGS[roll.stock]||"#F1EFE8"}}>
            <span className="text-[9px] font-medium text-[#4A4A46] uppercase tracking-wide text-center leading-relaxed px-1">{roll.stock}</span>
          </div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-3 flex-1">
            {[["Camera",roll.camera],["Lens",roll.lens||"—"],["Format",roll.format],["ISO metered",roll.iso],["Box speed",roll.box||"—"],["Dev process",roll.process],["Year shot",roll.year||roll.date||"—"]].map(([l,v])=>(
              <div key={l}>
                <p className="text-[10px] font-medium text-[#9A9990] uppercase tracking-wide mb-0.5">{l}</p>
                <p className="text-sm font-medium text-[#1A1A18]">{v}</p>
              </div>
            ))}
            <div>
              <p className="text-[10px] font-medium text-[#9A9990] uppercase tracking-wide mb-0.5">Push / pull</p>
              {ppCls ? <span className={`${ppCls} text-xs font-medium px-2 py-0.5 rounded-full`}>{ppLabel}</span>
                     : <p className="text-sm font-medium text-[#1A1A18]">Normal</p>}
            </div>
            <div>
              <p className="text-[10px] font-medium text-[#9A9990] uppercase tracking-wide mb-0.5">Status</p>
              <StatusPill status={roll.status}/>
            </div>
            <div>
              <p className="text-[10px] font-medium text-[#9A9990] uppercase tracking-wide mb-0.5">Session</p>
              <p className="text-sm font-medium text-[#1A1A18]">{roll.session||"—"}</p>
            </div>
          </div>
        </div>
        {roll.location && <p className="text-xs text-[#9A9990] mb-3 flex items-center gap-1">📍 {roll.location}</p>}
        {roll.notes && (
          <div className="bg-[#F7F6F3] rounded-xl p-4 mb-4">
            <p className="text-[10px] font-medium text-[#9A9990] uppercase tracking-wide mb-1.5">Notes</p>
            <p className="text-sm text-[#4A4A46] leading-relaxed">{roll.notes}</p>
          </div>
        )}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-[#1A1A18]">Contact sheet</p>
        </div>
        <ContactSheet roll={roll} rollScans={rollScans} onFrameClick={onFrameClick}/>
      </div>
    </div>
  );
}

function ScansPanel({ rolls, rollScans, onAssignScan, onRemoveScan }) {
  const [dragging, setDragging] = useState(false);
  const [unassigned, setUnassigned] = useState([]);
  const [lightboxScan, setLightboxScan] = useState(null);
  const [assigningId, setAssigningId] = useState(null);
  const [filterRoll, setFilterRoll] = useState("all");
  const fileInputRef = useRef(null);

  const developed = rolls.filter(r => r.status === "developed");

  const processFiles = (files) => {
    const accepted = Array.from(files).filter(f =>
      f.type.startsWith("image/") || f.name.toLowerCase().endsWith(".tif") || f.name.toLowerCase().endsWith(".tiff")
    );
    accepted.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUnassigned(prev => [...prev, {
          id: Date.now() + Math.random(),
          name: file.name,
          src: e.target.result,
          size: file.size,
          color: true, // will be overridden by roll.color on assignment
          rollId: null,
          frame: null,
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileInput = (e) => { if (e.target.files?.length) processFiles(e.target.files); };
  const handleDrop = (e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files); };
  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const assignScan = (scanId, rollId, frame) => {
    const scan = unassigned.find(s => s.id === scanId);
    if (!scan) return;
    onAssignScan({ ...scan, rollId: parseInt(rollId), frame: parseInt(frame) });
    setUnassigned(prev => prev.filter(s => s.id !== scanId));
    setAssigningId(null);
  };

  const [dragOverSlot, setDragOverSlot] = useState(null);
  const frameInputRef = useRef(null);
  const pendingSlot = useRef(null);

  const openFramePicker = (rollId, frame) => {
    pendingSlot.current = { rollId, frame };
    frameInputRef.current?.click();
  };

  const handleFrameFileInput = (e) => {
    const file = e.target.files?.[0];
    if (!file || !pendingSlot.current) return;
    const { rollId, frame } = pendingSlot.current;
    const roll = rolls.find(r => r.id === rollId);
    const reader = new FileReader();
    reader.onload = (ev) => {
      onAssignScan({
        id: Date.now() + Math.random(),
        name: file.name,
        src: ev.target.result,
        size: file.size,
        color: roll ? roll.color : true,
        rollId,
        frame,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
    pendingSlot.current = null;
  };

  const handleFrameDrop = (e, rollId, frame) => {
    e.preventDefault();
    setDragOverSlot(null);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const roll = rolls.find(r => r.id === rollId);
    const reader = new FileReader();
    reader.onload = (ev) => {
      onAssignScan({
        id: Date.now() + Math.random(),
        name: file.name,
        src: ev.target.result,
        size: file.size,
        color: roll ? roll.color : true,
        rollId,
        frame,
      });
    };
    reader.readAsDataURL(file);
  };

  const visibleRolls = filterRoll === "all" ? developed : developed.filter(r => r.id === parseInt(filterRoll));

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E4DF]">
        <div>
          <p className="text-[15px] font-medium text-[#1A1A18]">Scans</p>
          <p className="text-xs text-[#9A9990] mt-0.5">Upload and organize by roll</p>
        </div>
        <div className="flex items-center gap-3">
          {unassigned.length > 0 && (
            <span className="text-xs font-medium text-[#BA7517] bg-[#FAEEDA] px-2.5 py-1 rounded-full">
              {unassigned.length} unassigned
            </span>
          )}
          <button onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#D8D7D0] rounded-lg text-[#4A4A46] hover:bg-[#F7F6F3]">
            + Upload scans
          </button>
        </div>
      </div>

      <div className="p-6">
        <input ref={fileInputRef} type="file" multiple accept="image/*,.tif,.tiff" className="hidden" onChange={handleFileInput}/>
        <input ref={frameInputRef} type="file" accept="image/*,.tif,.tiff" className="hidden" onChange={handleFrameFileInput}/>

        {/* Drop zone — compact when scans exist */}
        {unassigned.length === 0 && Object.keys(rollScans).length === 0 && (
          <div
            onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center mb-6 transition-colors cursor-pointer ${dragging ? "border-[#1A1A18] bg-[#F0EFEB]" : "border-[#D8D7D0] hover:border-[#C8C7C0] hover:bg-[#FAFAF8]"}`}
          >
            <p className="text-3xl text-[#9A9990] mb-2">{dragging ? "⬇" : "☁"}</p>
            <p className="text-sm font-medium text-[#1A1A18] mb-1">{dragging ? "Drop to upload" : "Upload raw scans"}</p>
            <p className="text-xs text-[#9A9990] mb-3">Drag and drop here, or click to browse</p>
            <button onClick={e=>{e.stopPropagation();fileInputRef.current?.click();}}
              className="px-4 py-1.5 border border-[#D8D7D0] rounded-lg text-xs text-[#4A4A46] hover:bg-[#EEEEE8]">Browse files</button>
            <p className="text-[10px] text-[#C0BFB8] mt-2">JPEG, PNG, TIF, TIFF accepted</p>
          </div>
        )}

        {/* Inline drop target when already have content */}
        {(unassigned.length > 0 || Object.keys(rollScans).length > 0) && (
          <div
            onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-xl p-4 text-center mb-6 transition-colors cursor-pointer ${dragging ? "border-[#1A1A18] bg-[#F0EFEB]" : "border-[#D8D7D0] hover:border-[#C8C7C0]"}`}
          >
            <p className="text-xs text-[#9A9990]">{dragging ? "Drop files to upload" : "Drop more files here or click to browse"}</p>
          </div>
        )}

        {/* Unassigned scans — assign to roll */}
        {unassigned.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-[#1A1A18]">Unassigned scans</p>
                <p className="text-xs text-[#9A9990] mt-0.5">Assign each scan to a roll and frame number</p>
              </div>
              <button onClick={()=>setUnassigned([])} className="text-xs text-[#9A9990] hover:text-red-600">Clear all</button>
            </div>
            <div className="flex flex-col gap-3">
              {unassigned.map(scan => (
                <div key={scan.id} className="bg-white border border-[#E5E4DF] rounded-xl p-3 flex items-center gap-4 hover:border-[#C8C7C0]">
                  {/* Thumb */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer border border-[#E5E4DF]"
                    onClick={()=>setLightboxScan(scan)}>
                    <img src={scan.src} alt={scan.name} className="w-full h-full object-cover"/>
                  </div>
                  {/* Filename */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1A1A18] truncate">{scan.name}</p>
                    <p className="text-xs text-[#9A9990] mt-0.5">{(scan.size/1024/1024).toFixed(2)} MB · {scan.color?"Color":"B&W"}</p>
                  </div>
                  {/* Assignment controls */}
                  {assigningId === scan.id ? (
                    <AssignForm scan={scan} rolls={developed} onAssign={assignScan} onCancel={()=>setAssigningId(null)}/>
                  ) : (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={()=>setAssigningId(scan.id)}
                        className="px-3 py-1.5 bg-[#1A1A18] text-white text-xs rounded-lg font-medium hover:bg-[#333]">
                        Assign to roll
                      </button>
                      <button onClick={()=>setUnassigned(prev=>prev.filter(s=>s.id!==scan.id))}
                        className="px-3 py-1.5 border border-[#D8D7D0] text-xs rounded-lg text-[#9A9990] hover:text-red-600 hover:border-red-200">
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Organized by roll */}
        {developed.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-[#1A1A18]">Organized by roll</p>
              <select
                className="text-xs border border-[#D8D7D0] rounded-lg px-2.5 py-1.5 bg-white text-[#4A4A46] focus:outline-none focus:border-[#1A1A18]"
                value={filterRoll} onChange={e=>setFilterRoll(e.target.value)}>
                <option value="all">All rolls</option>
                {developed.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>

            {visibleRolls.map(roll => {
              const assigned = (rollScans[roll.id] || []);
              const total = roll.frames || 36;
              return (
                <div key={roll.id} className="mb-6">
                  {/* Roll header */}
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#E5E4DF]">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{background: roll.color ? "#185FA5" : "#5F5E5A"}}/>
                      <p className="text-sm font-medium text-[#1A1A18]">{roll.name}</p>
                      <span className="text-xs text-[#9A9990]">· {roll.stock} · {roll.format}</span>
                    </div>
                    <span className="text-xs text-[#9A9990]">{assigned.length}/{total} scans</span>
                  </div>
                  {/* Frame grid */}
                  <div className="grid grid-cols-6 gap-2">
                    {Array.from({ length: total }, (_, i) => {
                      const frame = i + 1;
                      const scan = assigned.find(s => s.frame === frame);
                      const isOver = dragOverSlot?.rollId === roll.id && dragOverSlot?.frame === frame;
                      return (
                        <div key={frame}
                          className={`aspect-square rounded-lg border overflow-hidden relative cursor-pointer transition-colors group
                            ${scan
                              ? "border-[#C8C7C0] hover:border-[#1A1A18]"
                              : isOver
                              ? "border-[#1A1A18] bg-[#F0EFEB] border-solid"
                              : "border-dashed border-[#D8D7D0] bg-[#FAFAF8] hover:bg-[#F0EFEB] hover:border-[#C8C7C0]"
                            }`}
                          onClick={() => scan ? setLightboxScan(scan) : openFramePicker(roll.id, frame)}
                          onDragOver={e=>{e.preventDefault();setDragOverSlot({rollId:roll.id,frame});}}
                          onDragLeave={()=>setDragOverSlot(null)}
                          onDrop={e=>handleFrameDrop(e, roll.id, frame)}
                        >
                          {scan ? (
                            <>
                              <img src={scan.src} alt={scan.name} className="w-full h-full object-cover"/>
                              <button
                                onClick={e=>{e.stopPropagation();onRemoveScan(roll.id,frame);}}
                                className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 bg-black/60 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] transition-opacity">✕</button>
                              <span className={`${scan.color?"tag-color":"tag-bw"} absolute bottom-0.5 left-0.5 text-[8px] px-1 py-px rounded font-medium`}>{scan.color?"C":"B&W"}</span>
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                              <span className="text-[9px] text-[#C0BFB8]">{frame}</span>
                              {isOver && <span className="text-[9px] text-[#9A9990]">Drop here</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {developed.length === 0 && (
          <p className="text-center text-sm text-[#9A9990] mt-6">No developed rolls yet — mark a roll as developed to start organizing scans.</p>
        )}
      </div>

      {/* Lightbox */}
      {lightboxScan && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-6" onClick={()=>setLightboxScan(null)}>
          <button className="absolute top-4 right-4 text-white/50 hover:text-white text-2xl leading-none">✕</button>
          <div className="max-w-3xl max-h-full flex flex-col items-center gap-3" onClick={e=>e.stopPropagation()}>
            <img src={lightboxScan.src} alt={lightboxScan.name} className="max-h-[78vh] max-w-full object-contain rounded-lg"/>
            <p className="text-white/50 text-xs">{lightboxScan.name}{lightboxScan.size ? ` · ${(lightboxScan.size/1024/1024).toFixed(1)} MB` : ""}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function AssignForm({ scan, rolls, onAssign, onCancel }) {
  const [rollId, setRollId] = useState(rolls[0]?.id || "");
  const [frame, setFrame] = useState(1);
  const selectedRoll = rolls.find(r => r.id === parseInt(rollId));

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <select value={rollId} onChange={e=>setRollId(e.target.value)}
        className="text-xs border border-[#D8D7D0] rounded-lg px-2 py-1.5 bg-white text-[#1A1A18] focus:outline-none focus:border-[#1A1A18] max-w-[140px]">
        {rolls.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
      </select>
      <input type="number" min="1" max={selectedRoll?.frames||36} value={frame}
        onChange={e=>setFrame(e.target.value)}
        className="text-xs border border-[#D8D7D0] rounded-lg px-2 py-1.5 w-16 bg-white text-[#1A1A18] focus:outline-none focus:border-[#1A1A18]"
        placeholder="Frame"/>
      <button onClick={()=>onAssign(scan.id, rollId, frame)}
        className="px-3 py-1.5 bg-[#1A1A18] text-white text-xs rounded-lg font-medium hover:bg-[#333]">Save</button>
      <button onClick={onCancel}
        className="px-3 py-1.5 border border-[#D8D7D0] text-xs rounded-lg text-[#9A9990] hover:bg-[#F7F6F3]">Cancel</button>
    </div>
  );
}

function SimplePanel({ title, sub, children }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-4 border-b border-[#E5E4DF]">
        <p className="text-[15px] font-medium text-[#1A1A18]">{title}</p>
        {sub && <p className="text-xs text-[#9A9990] mt-0.5">{sub}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

const INP = "w-full px-2.5 py-1.5 border border-[#D8D7D0] rounded-lg text-sm bg-[#F7F6F3] text-[#1A1A18] focus:outline-none focus:border-[#1A1A18]";
const LBL = "block text-xs font-medium text-[#4A4A46] mb-1";

function SessionModal({ session, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({ name:"", location:"", date:"", rolls:0, status:"shot" });
  useEffect(() => { if (session) setForm({ ...session }); }, [session]);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const isEdit = !!session?.id;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-[#E5E4DF] rounded-xl w-full max-w-sm flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E4DF]">
          <h2 className="text-sm font-medium text-[#1A1A18]">{isEdit ? "Edit session" : "New session"}</h2>
          <button onClick={onClose} className="text-[#9A9990] hover:text-[#1A1A18] text-lg leading-none">✕</button>
        </div>
        <div className="px-5 py-4">
          <div className="mb-3">
            <label className={LBL}>Session name</label>
            <input className={INP} value={form.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. Portraits of Aēmoni"/>
          </div>
          <div className="mb-3">
            <label className={LBL}>Location</label>
            <input className={INP} value={form.location} onChange={e=>set("location",e.target.value)} placeholder="e.g. Bushwick Studio"/>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className={LBL}>Date</label>
              <input className={INP} value={form.date} onChange={e=>set("date",e.target.value)} placeholder="e.g. Jul 2025"/>
            </div>
            <div>
              <label className={LBL}>Number of rolls</label>
              <input className={INP} type="number" min="0" value={form.rolls} onChange={e=>set("rolls",parseInt(e.target.value)||0)}/>
            </div>
          </div>
          <div>
            <label className={LBL}>Status</label>
            <select className={INP} value={form.status} onChange={e=>set("status",e.target.value)}>
              <option value="developed">Developed</option>
              <option value="lab">At lab</option>
              <option value="shot">Shot</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#E5E4DF]">
          {isEdit
            ? <button onClick={()=>onDelete(session.id)} className="text-xs text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50">✕ Delete</button>
            : <div/>}
          <div className="flex gap-2">
            <button onClick={onClose} className="text-sm px-4 py-1.5 border border-[#D8D7D0] rounded-lg text-[#4A4A46] hover:bg-[#F7F6F3]">Cancel</button>
            <button onClick={()=>onSave(form)} className="text-sm px-4 py-1.5 bg-[#1A1A18] text-white rounded-lg font-medium hover:bg-[#333]">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Export Panel ───────────────────────────────────────────────────────────
function ExportPanel({ rolls, rollScans }) {
  const [selectedScans, setSelectedScans] = useState({}); // { rollId: Set of frames }
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewName, setPreviewName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [expandedRoll, setExpandedRoll] = useState(null);

  const developed = rolls.filter(r => r.status === "developed" && (rollScans[r.id]||[]).length > 0);

  // Toggle a single scan frame
  const toggleScan = (rollId, frame) => {
    setSelectedScans(prev => {
      const current = new Set(prev[rollId] || []);
      if (current.has(frame)) current.delete(frame);
      else current.add(frame);
      return { ...prev, [rollId]: current };
    });
  };

  // Toggle all scans for a roll
  const toggleRoll = (rollId) => {
    const scans = rollScans[rollId] || [];
    const current = selectedScans[rollId] || new Set();
    const allSelected = scans.every(s => current.has(s.frame));
    setSelectedScans(prev => ({
      ...prev,
      [rollId]: allSelected ? new Set() : new Set(scans.map(s => s.frame))
    }));
  };

  const selectAll = () => {
    const next = {};
    developed.forEach(r => {
      next[r.id] = new Set((rollScans[r.id]||[]).map(s=>s.frame));
    });
    setSelectedScans(next);
  };

  const clearAll = () => setSelectedScans({});

  // Collect all selected scan objects in order
  const getSelectedScanObjects = () => {
    const out = [];
    developed.forEach(r => {
      const frames = selectedScans[r.id] || new Set();
      const scans = (rollScans[r.id]||[]).filter(s=>frames.has(s.frame)).sort((a,b)=>a.frame-b.frame);
      scans.forEach(s => out.push({ ...s, rollName: r.name, rollStock: r.stock, rollFormat: r.format, rollDate: r.date, rollId: r.id }));
    });
    return out;
  };

  const totalSelected = Object.values(selectedScans).reduce((n, set) => n + set.size, 0);

  // Build contact sheet canvas
  const buildContactSheet = (scans, title) => new Promise((resolve) => {
    const COLS = 3;
    const ROWS = Math.ceil(scans.length / COLS);
    const CELL_W = 900;
    const CELL_H = 1100;
    const PAD = 48;
    const LABEL_H = 52;
    const HEADER_H = 120;
    const FOOTER_H = 80;
    const W = COLS * CELL_W + (COLS + 1) * PAD;
    const H = HEADER_H + ROWS * (CELL_H + LABEL_H + PAD) + PAD + FOOTER_H;

    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#1A1A18";
    ctx.font = "bold 52px Arial, sans-serif";
    ctx.fillText(title, PAD, 70);
    ctx.fillStyle = "#9A9990";
    ctx.font = "36px Arial, sans-serif";
    ctx.fillText(`${scans.length} frame${scans.length!==1?"s":""} selected`, PAD, 110);

    ctx.strokeStyle = "#E5E4DF";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(PAD, HEADER_H-10); ctx.lineTo(W-PAD, HEADER_H-10); ctx.stroke();

    const loadImage = (src) => new Promise((res) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = src;
    });

    Promise.all(scans.map(s => loadImage(s.src))).then(images => {
      scans.forEach((scan, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const x = PAD + col * (CELL_W + PAD);
        const y = HEADER_H + row * (CELL_H + LABEL_H + PAD);

        ctx.strokeStyle = "#E5E4DF"; ctx.lineWidth = 2;
        ctx.strokeRect(x, y, CELL_W, CELL_H);

        const img = images[i];
        if (img) {
          const scale = Math.max(CELL_W / img.width, CELL_H / img.height);
          const dw = img.width * scale, dh = img.height * scale;
          const dx = x + (CELL_W - dw) / 2, dy = y + (CELL_H - dh) / 2;
          ctx.save();
          ctx.beginPath(); ctx.rect(x, y, CELL_W, CELL_H); ctx.clip();
          ctx.drawImage(img, dx, dy, dw, dh);
          ctx.restore();
        } else {
          ctx.fillStyle = "#F7F6F3"; ctx.fillRect(x, y, CELL_W, CELL_H);
          ctx.fillStyle = "#C0BFB8"; ctx.font = "32px Arial"; ctx.textAlign = "center";
          ctx.fillText(`Frame ${scan.frame}`, x + CELL_W/2, y + CELL_H/2);
          ctx.textAlign = "left";
        }

        const label = scan.name.replace(/\.[^/.]+$/, "").slice(0, 40);
        ctx.fillStyle = "#5F5E5A"; ctx.font = "28px Arial, sans-serif";
        ctx.fillText(label, x, y + CELL_H + 36);
      });

      const now = new Date();
      ctx.fillStyle = "#C0BFB8"; ctx.font = "28px Arial"; ctx.textAlign = "right";
      ctx.fillText(`Analog Archive · ${now.toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}`, W-PAD, H-28);
      ctx.textAlign = "left";
      resolve(canvas);
    });
  });

  const handleContactSheet = async () => {
    const scans = getSelectedScanObjects();
    if (!scans.length) return;
    setGenerating(true);
    const title = totalSelected === 1 ? scans[0].rollName : "Selected frames";
    const canvas = await buildContactSheet(scans, title);
    setPreviewUrl(canvas.toDataURL("image/jpeg", 0.95));
    setPreviewName(`analog-archive_contact-sheet.jpg`);
    setGenerating(false);
  };

  const buildXMP = (scan, roll) => {
    const slug = (str) => (str||"").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    const keywords = [
      roll.rollStock,
      roll.rollFormat,
      roll.rollDate,
      roll.camera,
      roll.lens,
      roll.rollName,
      roll.pushpull && roll.pushpull !== "none" ? PP_LABELS[roll.pushpull] : null,
      roll.session || null,
      roll.location || null,
      scan.color ? "color" : "black and white",
      "analog",
      "film",
    ].filter(Boolean);

    return `<?xpacket begin='' id='W5M0MpCehiHzreSzNTczkc9d'?>
<x:xmpmeta xmlns:x='adobe:ns:meta/'>
  <rdf:RDF xmlns:rdf='http://www.w3.org/1999/02/22-rdf-syntax-ns#'>
    <rdf:Description rdf:about=''
      xmlns:dc='http://purl.org/dc/elements/1.1/'
      xmlns:xmp='http://ns.adobe.com/xap/1.0/'
      xmlns:lr='http://ns.adobe.com/lightroom/1.0/'
      xmlns:exif='http://ns.adobe.com/exif/1.0/'>
      <dc:title><rdf:Alt><rdf:li xml:lang='x-default'>${scan.rollName} — Frame ${scan.frame}</rdf:li></rdf:Alt></dc:title>
      <dc:description><rdf:Alt><rdf:li xml:lang='x-default'>${roll.rollStock} · ${roll.rollFormat} · ${roll.rollDate}${roll.location ? " · " + roll.location : ""}</rdf:li></rdf:Alt></dc:description>
      <dc:subject>
        <rdf:Bag>
          ${keywords.map(k => `<rdf:li>${k}</rdf:li>`).join("\n          ")}
        </rdf:Bag>
      </dc:subject>
      <xmp:CreatorTool>Analog Archive</xmp:CreatorTool>
      <lr:hierarchicalSubject>
        <rdf:Bag>
          <rdf:li>Analog Archive|${roll.rollName}</rdf:li>
          <rdf:li>Film Stock|${roll.rollStock}</rdf:li>
          <rdf:li>Format|${roll.rollFormat}</rdf:li>
        </rdf:Bag>
      </lr:hierarchicalSubject>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end='w'?>`;
  };

  const handleDownloadScans = () => {
    const scans = getSelectedScanObjects();
    if (!scans.length) return;

    // Group by roll for folder-style naming
    const byRoll = {};
    scans.forEach(scan => {
      const key = scan.rollId;
      if (!byRoll[key]) byRoll[key] = { roll: scan, scans: [] };
      byRoll[key].scans.push(scan);
    });

    let delay = 0;
    Object.values(byRoll).forEach(({ roll, scans: rollScansGroup }) => {
      // Sanitize roll name for filename
      const rollSlug = roll.rollName
        .replace(/[^a-zA-Z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase();
      const stockSlug = roll.rollStock
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase();

      rollScansGroup.forEach((scan) => {
        const frameNum = String(scan.frame).padStart(2, "0");
        const filename = `${rollSlug}_${stockSlug}_${roll.rollFormat}_frame-${frameNum}.jpg`;
        const xmpFilename = `${rollSlug}_${stockSlug}_${roll.rollFormat}_frame-${frameNum}.xmp`;

        // Download image with structured filename
        setTimeout(() => {
          const a = document.createElement("a");
          a.href = scan.src;
          a.download = filename;
          a.click();
        }, delay);
        delay += 250;

        // Download XMP sidecar for Lightroom metadata
        setTimeout(() => {
          const xmpContent = buildXMP(scan, roll);
          const blob = new Blob([xmpContent], { type: "application/xml" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = xmpFilename;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }, delay);
        delay += 250;
      });
    });
  };

  const downloadPreview = () => {
    const a = document.createElement("a");
    a.href = previewUrl; a.download = previewName; a.click();
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E4DF]">
        <div>
          <p className="text-[15px] font-medium text-[#1A1A18]">Export</p>
          <p className="text-xs text-[#9A9990] mt-0.5">Select scans across rolls to export</p>
        </div>
        {totalSelected > 0 && (
          <span className="text-xs font-medium text-[#185FA5] bg-[#E6F1FB] px-2.5 py-1 rounded-full">
            {totalSelected} scan{totalSelected!==1?"s":""} selected
          </span>
        )}
      </div>

      <div className="p-6 flex gap-6">

        {/* Left — scan selector */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-[#1A1A18]">Select scans</p>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-xs text-[#4A4A46] hover:text-[#1A1A18] px-2.5 py-1 border border-[#D8D7D0] rounded-lg hover:bg-[#F7F6F3]">Select all</button>
              <button onClick={clearAll} className="text-xs text-[#9A9990] hover:text-[#1A1A18] px-2.5 py-1 border border-[#D8D7D0] rounded-lg hover:bg-[#F7F6F3]">Clear</button>
            </div>
          </div>

          {developed.length === 0 && (
            <div className="bg-white border border-dashed border-[#D8D7D0] rounded-xl p-8 text-center">
              <p className="text-sm text-[#9A9990]">No developed rolls with scans yet.</p>
              <p className="text-xs text-[#C0BFB8] mt-1">Upload scans in the Scans tab first.</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {developed.map(roll => {
              const scans = (rollScans[roll.id]||[]).sort((a,b)=>a.frame-b.frame);
              const rollSelected = selectedScans[roll.id] || new Set();
              const allSelected = scans.every(s=>rollSelected.has(s.frame));
              const someSelected = scans.some(s=>rollSelected.has(s.frame));
              const isOpen = expandedRoll === roll.id;

              return (
                <div key={roll.id} className="bg-white border border-[#E5E4DF] rounded-xl overflow-hidden">
                  {/* Roll header */}
                  <div className="px-4 py-3 flex items-center gap-3">
                    <input type="checkbox" checked={allSelected} ref={el => { if(el) el.indeterminate = someSelected && !allSelected; }}
                      onChange={()=>toggleRoll(roll.id)}
                      className="w-4 h-4 rounded accent-[#1A1A18] cursor-pointer flex-shrink-0"/>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={()=>setExpandedRoll(isOpen?null:roll.id)}>
                      <p className="text-sm font-medium text-[#1A1A18] truncate">{roll.name}</p>
                      <p className="text-xs text-[#9A9990] mt-0.5">{roll.stock} · {roll.format} · {scans.length} scan{scans.length!==1?"s":""}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {someSelected && <span className="text-[10px] font-medium text-[#185FA5] bg-[#E6F1FB] px-2 py-0.5 rounded-full">{rollSelected.size} selected</span>}
                      <button onClick={()=>setExpandedRoll(isOpen?null:roll.id)} className="text-[#C8C7C0] text-xs">{isOpen?"▲":"▼"}</button>
                    </div>
                  </div>

                  {/* Scan grid */}
                  {isOpen && (
                    <div className="border-t border-[#E5E4DF] p-3 bg-[#FAFAF8]">
                      <div className="grid grid-cols-5 gap-2">
                        {scans.map(scan => {
                          const checked = rollSelected.has(scan.frame);
                          return (
                            <div key={scan.frame}
                              onClick={()=>toggleScan(roll.id, scan.frame)}
                              className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-colors ${checked?"border-[#1A1A18]":"border-transparent hover:border-[#C8C7C0]"}`}>
                              <img src={scan.src} alt={scan.name} className="w-full h-full object-cover"/>
                              <div className={`absolute inset-0 transition-colors ${checked?"bg-[#1A1A18]/15":"bg-transparent"}`}/>
                              {checked && (
                                <div className="absolute top-1 right-1 w-4 h-4 bg-[#1A1A18] rounded-full flex items-center justify-center">
                                  <span className="text-white text-[9px]">✓</span>
                                </div>
                              )}
                              <span className="absolute bottom-0.5 right-1 text-[8px] text-white drop-shadow">{scan.frame}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right — export actions */}
        <div className="w-56 flex-shrink-0">
          <p className="text-sm font-medium text-[#1A1A18] mb-3">Export as</p>
          <div className="flex flex-col gap-3">
            <div className="bg-white border border-[#E5E4DF] rounded-xl p-4">
              <p className="text-sm font-medium text-[#1A1A18] mb-1">Contact sheet</p>
              <p className="text-xs text-[#9A9990] mb-3">3-column grid, archival style. Preview before download.</p>
              <button onClick={handleContactSheet} disabled={generating||totalSelected===0}
                className="w-full py-1.5 bg-[#1A1A18] text-white text-xs rounded-lg font-medium hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed">
                {generating?"Building…":"Generate"}
              </button>
            </div>
            <div className="bg-white border border-[#E5E4DF] rounded-xl p-4">
              <p className="text-sm font-medium text-[#1A1A18] mb-1">Download for Lightroom</p>
              <p className="text-xs text-[#9A9990] mb-3">Structured filenames + XMP sidecar files with roll, stock, camera, and keyword metadata pre-embedded.</p>
              <button onClick={handleDownloadScans} disabled={generating||totalSelected===0}
                className="w-full py-1.5 border border-[#D8D7D0] text-[#4A4A46] text-xs rounded-lg font-medium hover:bg-[#F7F6F3] disabled:opacity-40 disabled:cursor-not-allowed">
                Download {totalSelected>0?`(${totalSelected} scans)`:""}
              </button>
              {totalSelected > 0 && (
                <p className="text-[10px] text-[#C0BFB8] mt-2 leading-relaxed">Each scan downloads with a paired .xmp file. Place both in the same folder, then import the folder into Lightroom.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-xl overflow-hidden flex flex-col max-w-4xl w-full max-h-[92vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E4DF]">
              <div>
                <p className="text-sm font-medium text-[#1A1A18]">Contact sheet preview</p>
                <p className="text-xs text-[#9A9990] mt-0.5">{previewName}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={downloadPreview} className="px-4 py-1.5 bg-[#1A1A18] text-white text-xs rounded-lg font-medium hover:bg-[#333]">↓ Download</button>
                <button onClick={()=>setPreviewUrl(null)} className="px-3 py-1.5 border border-[#D8D7D0] text-xs rounded-lg text-[#4A4A46] hover:bg-[#F7F6F3]">Close</button>
              </div>
            </div>
            <div className="overflow-auto flex-1 bg-[#F7F6F3] p-4">
              <img src={previewUrl} alt="Contact sheet preview" className="w-full rounded-lg shadow-sm"/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stocks Panel ────────────────────────────────────────────────────────────
const DEFAULT_SPECS = {
  "CineStill 400D":   { process:"C-41", type:"Color negative", balance:"Daylight", iso:"400", grain:"Fine", notes:"Remjet-removed cinema stock. Halation at bright edges. Excellent skin tones in natural light." },
  "Kentmere Pan 400": { process:"B&W",  type:"Black & white",  balance:"Panchromatic", iso:"400", grain:"Medium", notes:"Budget B&W with strong contrast. Pushes well to 800 or 1600." },
  "Kodak Portra 400": { process:"C-41", type:"Color negative", balance:"Daylight", iso:"400", grain:"Fine", notes:"Industry standard portrait stock. Wide latitude, accurate skin tones." },
  "Kodak Gold 200":   { process:"C-41", type:"Color negative", balance:"Daylight", iso:"200", grain:"Medium", notes:"Warm, saturated budget stock. Best in bright natural light." },
  "CineStill 50D":    { process:"C-41", type:"Color negative", balance:"Daylight", iso:"50",  grain:"Very fine", notes:"Ultra-fine grain cinema stock. Best for controlled or bright environments." },
  "Portra 160 NC":    { process:"C-41", type:"Color negative", balance:"Daylight", iso:"160", grain:"Very fine", notes:"Discontinued Natural Color stock. Low contrast, neutral palette. Expired stock metered at ISO 40." },
};

function loadStockOverrides() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem("analog-archive-stock-specs-v1") || "{}"); } catch { return {}; }
}
function saveStockOverrides(data) {
  if (typeof window === "undefined") return;
  localStorage.setItem("analog-archive-stock-specs-v1", JSON.stringify(data));
}

function StocksPanel({ rolls }) {
  const [overrides, setOverrides] = useState({});
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { setOverrides(loadStockOverrides()); }, []);

  // Derive stocks dynamically from actual rolls
  const stockMap = {};
  rolls.forEach(r => {
    if (!stockMap[r.stock]) stockMap[r.stock] = { name: r.stock, rolls: [], formats: new Set(), cameras: new Set() };
    stockMap[r.stock].rolls.push(r);
    stockMap[r.stock].formats.add(r.format);
    stockMap[r.stock].cameras.add(r.camera);
  });
  const stocks = Object.values(stockMap).sort((a,b) => b.rolls.length - a.rolls.length);

  const getSpecs = (name) => ({ ...DEFAULT_SPECS[name], ...overrides[name] });

  const saveEdit = (name, form) => {
    const next = { ...overrides, [name]: form };
    setOverrides(next);
    saveStockOverrides(next);
    setEditing(null);
  };

  const PROCESS_COLORS = {
    "C-41": { bg:"#E6F1FB", text:"#185FA5" },
    "B&W":  { bg:"#F1EFE8", text:"#5F5E5A" },
    "E-6":  { bg:"#EAF3DE", text:"#3B6D11" },
  };

  const inp = "w-full px-2.5 py-1.5 border border-[#D8D7D0] rounded-lg text-sm bg-[#F7F6F3] text-[#1A1A18] focus:outline-none focus:border-[#1A1A18]";
  const lbl = "block text-xs font-medium text-[#4A4A46] mb-1";

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E4DF]">
        <div>
          <p className="text-[15px] font-medium text-[#1A1A18]">Film stocks</p>
          <p className="text-xs text-[#9A9990] mt-0.5">{stocks.length} stock{stocks.length!==1?"s":""} used across your archive</p>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-3">
        {stocks.length === 0 && (
          <p className="text-sm text-[#9A9990] text-center mt-6">No rolls added yet — add your first roll to see stocks here.</p>
        )}

        {stocks.map(stock => {
          const specs = getSpecs(stock.name);
          const isExpanded = expanded === stock.name;
          const pc = PROCESS_COLORS[specs.process] || { bg:"#F1EFE8", text:"#5F5E5A" };
          const developedCount = stock.rolls.filter(r=>r.status==="developed").length;
          const labCount = stock.rolls.filter(r=>r.status==="lab").length;
          const shotCount = stock.rolls.filter(r=>r.status==="shot").length;

          return (
            <div key={stock.name} className="bg-white border border-[#E5E4DF] rounded-xl overflow-hidden hover:border-[#C8C7C0] transition-colors">
              {/* Main row */}
              <div className="px-4 py-3.5 flex items-center gap-4 cursor-pointer" onClick={()=>setExpanded(isExpanded?null:stock.name)}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
                  style={{background:pc.bg, color:pc.text}}>
                  {specs.process||"?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A1A18]">{stock.name}</p>
                  <p className="text-xs text-[#9A9990] mt-0.5">
                    ISO {specs.iso||"—"} · {specs.type||"—"} · {specs.balance||"—"}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Roll count badges */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-[#1A1A18]">{stock.rolls.length}</span>
                    <span className="text-xs text-[#9A9990]">roll{stock.rolls.length!==1?"s":""}</span>
                  </div>
                  {developedCount>0 && <span className="pill-developed text-[10px] font-medium px-2 py-0.5 rounded-full">{developedCount} dev</span>}
                  {labCount>0 && <span className="pill-lab text-[10px] font-medium px-2 py-0.5 rounded-full">{labCount} lab</span>}
                  {shotCount>0 && <span className="pill-shot text-[10px] font-medium px-2 py-0.5 rounded-full">{shotCount} shot</span>}
                  <span className="text-[#C8C7C0] text-xs">{isExpanded?"▲":"▼"}</span>
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-[#E5E4DF] bg-[#FAFAF8]">
                  {/* Specs grid */}
                  <div className="px-5 py-4 grid grid-cols-4 gap-4 border-b border-[#E5E4DF]">
                    {[
                      ["Process",  specs.process||"—"],
                      ["ISO",      specs.iso||"—"],
                      ["Type",     specs.type||"—"],
                      ["Balance",  specs.balance||"—"],
                      ["Grain",    specs.grain||"—"],
                      ["Formats",  [...stock.formats].join(", ")||"—"],
                      ["Cameras",  [...stock.cameras].join(", ")||"—"],
                      ["Total rolls", stock.rolls.length],
                    ].map(([label,value])=>(
                      <div key={label}>
                        <p className="text-[10px] font-medium text-[#9A9990] uppercase tracking-wide mb-0.5">{label}</p>
                        <p className="text-sm text-[#1A1A18] font-medium">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  {specs.notes && (
                    <div className="px-5 py-3 border-b border-[#E5E4DF]">
                      <p className="text-[10px] font-medium text-[#9A9990] uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm text-[#4A4A46] leading-relaxed">{specs.notes}</p>
                    </div>
                  )}

                  {/* Roll list */}
                  <div className="px-5 py-3 border-b border-[#E5E4DF]">
                    <p className="text-[10px] font-medium text-[#9A9990] uppercase tracking-wide mb-2">Rolls using this stock</p>
                    <div className="flex flex-col gap-1.5">
                      {stock.rolls.map(r=>(
                        <div key={r.id} className="flex items-center gap-3 text-xs">
                          <span className="text-[#1A1A18] font-medium flex-1">{r.name}</span>
                          <span className="text-[#9A9990]">{r.format} · {r.date}</span>
                          <span className={`${PILL_MAP[r.status]} text-[10px] font-medium px-2 py-0.5 rounded-full`}>{STATUS_LABELS[r.status]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Edit button */}
                  <div className="px-5 py-3 flex justify-end">
                    <button onClick={()=>setEditing({name:stock.name, ...specs})}
                      className="text-xs px-3 py-1.5 border border-[#D8D7D0] rounded-lg text-[#4A4A46] hover:bg-white hover:border-[#C8C7C0]">
                      ✎ Edit specs
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#E5E4DF] rounded-xl w-full max-w-sm flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E4DF]">
              <div>
                <h2 className="text-sm font-medium text-[#1A1A18]">Edit stock specs</h2>
                <p className="text-xs text-[#9A9990] mt-0.5">{editing.name}</p>
              </div>
              <button onClick={()=>setEditing(null)} className="text-[#9A9990] hover:text-[#1A1A18] text-lg leading-none">✕</button>
            </div>
            <div className="px-5 py-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div><label className={lbl}>ISO</label>
                  <input className={inp} value={editing.iso||""} onChange={e=>setEditing(f=>({...f,iso:e.target.value}))} placeholder="e.g. 400"/></div>
                <div><label className={lbl}>Process</label>
                  <select className={inp} value={editing.process||""} onChange={e=>setEditing(f=>({...f,process:e.target.value}))}>
                    <option>C-41</option><option>B&W</option><option>E-6</option><option>ECN-2</option><option>Home dev</option>
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div><label className={lbl}>Type</label>
                  <select className={inp} value={editing.type||""} onChange={e=>setEditing(f=>({...f,type:e.target.value}))}>
                    <option>Color negative</option><option>Black & white</option><option>Color reversal</option>
                  </select></div>
                <div><label className={lbl}>Balance</label>
                  <select className={inp} value={editing.balance||""} onChange={e=>setEditing(f=>({...f,balance:e.target.value}))}>
                    <option>Daylight</option><option>Tungsten</option><option>Panchromatic</option>
                  </select></div>
              </div>
              <div className="mb-3">
                <label className={lbl}>Grain</label>
                <select className={inp} value={editing.grain||""} onChange={e=>setEditing(f=>({...f,grain:e.target.value}))}>
                  <option>Very fine</option><option>Fine</option><option>Medium</option><option>Coarse</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Notes</label>
                <textarea className={inp} rows={3} style={{resize:"none"}} value={editing.notes||""}
                  onChange={e=>setEditing(f=>({...f,notes:e.target.value}))}
                  placeholder="Characteristics, tips, metering notes..."/>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[#E5E4DF]">
              <button onClick={()=>setEditing(null)} className="text-sm px-4 py-1.5 border border-[#D8D7D0] rounded-lg text-[#4A4A46] hover:bg-[#F7F6F3]">Cancel</button>
              <button onClick={()=>saveEdit(editing.name, {iso:editing.iso,process:editing.process,type:editing.type,balance:editing.balance,grain:editing.grain,notes:editing.notes})}
                className="text-sm px-4 py-1.5 bg-[#1A1A18] text-white rounded-lg font-medium hover:bg-[#333]">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [rolls, setRolls] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [rollScans, setRollScans] = useState({});
  const [panel, setPanel] = useState("dashboard");
  const [rollFilter, setRollFilter] = useState("all");
  const [detailId, setDetailId] = useState(null);
  const [rollModal, setRollModal] = useState(null);
  const [frameModal, setFrameModal] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [sessionModal, setSessionModal] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const rollData = loadRolls();
    setRolls(rollData);
    setSessions(loadSessions());
    loadScans().then(data => {
      if (!data) { setRollScans({}); return; }
      // Correct color flag on all saved scans using the roll's actual color property
      const corrected = {};
      Object.entries(data).forEach(([rollId, scans]) => {
        const roll = rollData.find(r => r.id === parseInt(rollId));
        corrected[rollId] = (scans || []).map(s => ({
          ...s,
          color: roll ? roll.color : s.color,
        }));
      });
      setRollScans(corrected);
      // Persist the corrected data back so future loads are clean
      saveScans(corrected).catch(() => {});
    });
  }, []);

  const persist = (next) => { setRolls(next); saveRolls(next); };
  const persistSessions = (next) => { setSessions(next); saveSessions(next); };

  const persistScans = (next) => {
    setRollScans(next);
    saveScans(next).catch(() => showToast("Error saving scan — please try again"));
  };

  // Compress image src to JPEG at reduced size before saving
  const compressImage = (src, maxWidth = 1200) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.src = src;
  });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const handleSaveRoll = (form) => {
    const isEdit = typeof rollModal === "number";
    if (isEdit) {
      persist(rolls.map(r => r.id === rollModal ? { ...r, ...form, color: form.stock !== "Kentmere Pan 400" } : r));
      showToast("Roll updated");
      openDetail(rollModal);
    } else {
      const next = [{ id: Date.now(), ...form, date: nowDate(), color: form.stock !== "Kentmere Pan 400", frames_data: {} }, ...rolls];
      persist(next);
      showToast("Roll added");
    }
    setRollModal(null);
  };

  const handleDeleteRoll = (id) => {
    persist(rolls.filter(r => r.id !== id));
    setRollModal(null);
    setPanel("rolls");
    showToast("Roll deleted");
  };

  const handleSaveFrame = (form) => {
    const { rollId, frame } = frameModal;
    persist(rolls.map(r => r.id === rollId ? { ...r, frames_data: { ...r.frames_data, [frame]: form } } : r));
    setFrameModal(null);
    showToast("Frame saved");
  };

  const handleSaveSession = (form) => {
    if (form.id) {
      persistSessions(sessions.map(s => s.id === form.id ? { ...s, ...form } : s));
      showToast("Session updated");
    } else {
      persistSessions([...sessions, { ...form, id: Date.now() }]);
      showToast("Session added");
    }
    setSessionModal(null);
  };

  const handleDeleteSession = (id) => {
    persistSessions(sessions.filter(s => s.id !== id));
    setSessionModal(null);
    showToast("Session deleted");
  };

  const handleAssignScan = async (scan) => {
    const compressed = await compressImage(scan.src);
    // Determine color from the roll itself, not the filename
    const roll = rolls.find(r => r.id === scan.rollId);
    const isColor = roll ? roll.color : true;
    const saved = { ...scan, src: compressed, color: isColor };
    setRollScans(prev => {
      const existing = prev[scan.rollId] || [];
      const filtered = existing.filter(s => s.frame !== scan.frame);
      const next = { ...prev, [scan.rollId]: [...filtered, saved] };
      saveScans(next).catch(() => showToast("Error saving scan — please try again"));
      return next;
    });
    showToast("Scan saved to frame " + scan.frame);
  };

  const handleRemoveScan = (rollId, frame) => {
    setRollScans(prev => {
      const next = { ...prev, [rollId]: (prev[rollId] || []).filter(s => s.frame !== frame) };
      saveScans(next).catch(() => {});
      return next;
    });
    showToast("Scan removed");
  };

  const openDetail = (id) => { setDetailId(id); setPanel("detail"); };
  const editingRoll = typeof rollModal === "number" ? rolls.find(r => r.id === rollModal) : null;

  const lbNav = useCallback((dir) => {
    if (!lightbox) return;
    const roll = rolls.find(r => r.id === lightbox.rollId);
    const max = roll?.frames || 36;
    setLightbox(lb => ({ ...lb, frame: Math.max(1, Math.min(max, lb.frame + dir)) }));
  }, [lightbox, rolls]);

  return (
    <div className="flex h-screen bg-[#F7F6F3] font-sans">
      <Sidebar
        active={panel}
        onChange={p => { setPanel(p); if(p==="detail" && !detailId) setPanel("rolls"); }}
        onNewRoll={() => setRollModal("new")}
      />

      <main className="flex-1 overflow-hidden flex flex-col">
        {panel === "dashboard" && (
          <Dashboard rolls={rolls} rollScans={rollScans} onNewRoll={()=>setRollModal("new")}
            onViewRolls={()=>setPanel("rolls")} onViewScans={()=>setPanel("scans")}
            onRollClick={openDetail} onEditRoll={id=>setRollModal(id)}/>
        )}
        {panel === "rolls" && (
          <RollsList rolls={rolls} activeFilter={rollFilter} onFilter={setRollFilter}
            onRollClick={openDetail} onEditRoll={id=>setRollModal(id)} onNewRoll={()=>setRollModal("new")}/>
        )}
        {panel === "detail" && (
          <RollDetail
            roll={rolls.find(r=>r.id===detailId)}
            rollScans={rollScans}
            onBack={()=>setPanel("rolls")}
            onEdit={()=>setRollModal(detailId)}
            onFrameClick={frame=>setLightbox({rollId:detailId,frame})}
          />
        )}
        {panel === "scans" && <ScansPanel rolls={rolls} rollScans={rollScans} onAssignScan={handleAssignScan} onRemoveScan={handleRemoveScan}/>}

        {panel === "sessions" && (
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E4DF]">
              <div><p className="text-[15px] font-medium text-[#1A1A18]">Sessions</p><p className="text-xs text-[#9A9990] mt-0.5">Group rolls by shoot</p></div>
              <button onClick={()=>setSessionModal({})} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#D8D7D0] rounded-lg text-[#4A4A46] hover:bg-[#F7F6F3]">+ New session</button>
            </div>
            <div className="p-6 flex flex-col gap-2">
              {sessions.length === 0 ? (
                <div className="bg-white border border-dashed border-[#D8D7D0] rounded-xl p-8 text-center">
                  <p className="text-sm font-medium text-[#1A1A18] mb-1">No sessions yet</p>
                  <p className="text-xs text-[#9A9990] mb-4">Group your rolls by shoot to keep your archive organized</p>
                  <button onClick={()=>setSessionModal({})} className="px-4 py-2 bg-[#1A1A18] text-white text-xs rounded-lg font-medium hover:bg-[#333]">+ Create your first session</button>
                </div>
              ) : (
                sessions.map(s => (
                  <div key={s.id} className="bg-white border border-[#E5E4DF] rounded-xl px-4 py-3 flex items-center gap-4 hover:border-[#C8C7C0] transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-[#F7F6F3] flex items-center justify-center text-[#9A9990] flex-shrink-0">⊟</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A18]">{s.name}</p>
                      <p className="text-xs text-[#9A9990] mt-0.5">{s.location} · {s.date} · {s.rolls} roll{s.rolls !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusPill status={s.status}/>
                      <button onClick={()=>setSessionModal(s)} className="text-xs px-2.5 py-1 border border-[#D8D7D0] rounded-lg text-[#9A9990] hover:text-[#1A1A18] hover:border-[#C8C7C0]">✎ Edit</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {panel === "stocks" && (
          <StocksPanel rolls={rolls} />
        )}

        {panel === "export" && (
          <ExportPanel rolls={rolls} rollScans={rollScans} />
        )}
      </main>

      {rollModal !== null && (
        <RollModal roll={editingRoll} sessions={sessions} onSave={handleSaveRoll} onDelete={handleDeleteRoll} onClose={() => setRollModal(null)}/>
      )}
      {frameModal && (
        <FrameModal roll={rolls.find(r=>r.id===frameModal.rollId)} frame={frameModal.frame} onSave={handleSaveFrame} onClose={() => setFrameModal(null)}/>
      )}
      {lightbox && (
        <Lightbox
          roll={rolls.find(r=>r.id===lightbox.rollId)}
          frame={lightbox.frame}
          onClose={() => setLightbox(null)}
          onNav={lbNav}
          onEditFrame={() => { setFrameModal({rollId:lightbox.rollId, frame:lightbox.frame}); setLightbox(null); }}
        />
      )}
      {sessionModal !== null && (
        <SessionModal
          session={sessionModal?.id ? sessionModal : null}
          onSave={handleSaveSession}
          onDelete={handleDeleteSession}
          onClose={() => setSessionModal(null)}
        />
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-[#1A1A18] text-white text-xs font-medium px-4 py-2 rounded-full z-50 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
