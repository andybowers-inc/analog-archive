"use client";
import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import RollModal from "../components/RollModal";
import FrameModal from "../components/FrameModal";
import Lightbox from "../components/Lightbox";
import {
  loadRolls, saveRolls,
  THUMB_BGS, STATUS_LABELS, PILL_MAP, DOT_COLORS, PP_LABELS,
} from "../lib/store";

/* ─── small helpers ─── */
const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const nowDate = () => `${months[new Date().getMonth()]} ${new Date().getFullYear()}`;

function PushPill({ pp }) {
  if (!pp || pp === "none") return null;
  const cls = pp.startsWith("push") ? "push-pill" : "pull-pill";
  return <span className={`${cls} text-[10px] font-medium px-2 py-0.5 rounded-full`}>{PP_LABELS[pp]}</span>;
}

function StatusPill({ status }) {
  return <span className={`${PILL_MAP[status]} text-[10px] font-medium px-2 py-0.5 rounded-full`}>{STATUS_LABELS[status]}</span>;
}

/* ─── contact sheet ─── */
function ContactSheet({ roll, onFrameClick }) {
  if (roll.status !== "developed") {
    return (
      <div className="border border-dashed border-[#D8D7D0] rounded-xl p-8 text-center text-[#9A9990] text-sm">
        {roll.status === "lab" ? "Roll is at the lab — scans will appear once returned." : "Roll has not yet been developed."}
      </div>
    );
  }
  return (
    <div className="border border-[#E5E4DF] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#F7F6F3] border-b border-[#E5E4DF]">
        <span className="text-xs font-medium text-[#1A1A18]">{roll.frames} frames · {roll.stock} · {roll.format} · {PP_LABELS[roll.pushpull] || "Normal"}</span>
        <span className="text-xs text-[#9A9990]">Click a frame to view or edit</span>
      </div>
      <div className="grid grid-cols-6 gap-px bg-[#E5E4DF]">
        {Array.from({ length: roll.frames }, (_, i) => {
          const n = i + 1;
          const fd = roll.frames_data?.[n] || {};
          const isColor = n % 4 !== 0 && roll.color;
          const flagEl = fd.flag === "star"
            ? <span className="absolute top-0.5 right-1 text-[9px] text-yellow-600">★</span>
            : fd.flag === "reject"
            ? <span className="absolute top-0.5 right-1 text-[9px] text-red-600">✕</span>
            : null;
          return (
            <button
              key={n}
              onClick={() => onFrameClick(n)}
              className="aspect-square bg-[#F7F6F3] hover:bg-[#EEEEE8] flex items-center justify-center relative transition-colors"
            >
              <span className="text-[9px] text-[#9A9990]">{roll.color ? "▪" : "◆"}</span>
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

/* ─── panels ─── */
function Dashboard({ rolls, onNewRoll, onViewRolls, onViewScans, onRollClick, onEditRoll }) {
  const developed = rolls.filter(r => r.status === "developed");
  const labCount = rolls.filter(r => r.status === "lab").length;
  const stocks = new Set(rolls.map(r => r.stock)).size;

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
            { label:"Total rolls", value: rolls.length, detail:"Since Jan 2025" },
            { label:"Scans",       value: developed.length * 36, detail:"Across all rolls" },
            { label:"At lab",      value: labCount, detail:"Pending return" },
            { label:"Film stocks", value: stocks, detail:"Used to date" },
          ].map(s => (
            <div key={s.label} className="bg-white border border-[#E5E4DF] rounded-xl p-4">
              <p className="text-[10px] font-medium text-[#9A9990] uppercase tracking-wide mb-1.5">{s.label}</p>
              <p className="text-2xl font-medium text-[#1A1A18]">{s.value}</p>
              <p className="text-[11px] text-[#9A9990] mt-0.5">{s.detail}</p>
            </div>
          ))}
        </div>

        {/* Recent rolls */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-[#1A1A18]">Recent rolls</p>
          <button onClick={onViewRolls} className="text-xs text-[#9A9990] hover:text-[#4A4A46]">View all</button>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {rolls.slice(0, 3).map(r => (
            <div key={r.id} className="bg-white border border-[#E5E4DF] rounded-xl overflow-hidden cursor-pointer hover:border-[#C8C7C0] transition-colors relative group" onClick={() => onRollClick(r.id)}>
              <button className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 bg-white border border-[#E5E4DF] rounded px-1.5 py-0.5 text-[10px] text-[#4A4A46] hover:bg-[#F7F6F3] z-10 transition-opacity"
                onClick={e=>{e.stopPropagation();onEditRoll(r.id);}}>✎ Edit</button>
              <div className="h-18 flex items-center justify-center relative" style={{height:72,background:THUMB_BGS[r.stock]||"#F1EFE8"}}>
                <span className="text-[10px] font-medium text-[#4A4A46] uppercase tracking-wide">{r.stock}</span>
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{background:DOT_COLORS[r.status]}}/>
              </div>
              <div className="p-2.5">
                <p className="text-xs font-medium text-[#1A1A18] truncate">{r.name}</p>
                <p className="text-[11px] text-[#9A9990] mt-0.5">{r.format} · {r.date}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recent scans */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-[#1A1A18]">Recent scans</p>
          <button onClick={onViewScans} className="text-xs text-[#9A9990] hover:text-[#4A4A46]">View all</button>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {developed.slice(0, 6).map((r, i) => (
            <div key={r.id+i} className="aspect-square bg-white border border-[#E5E4DF] rounded-lg flex items-center justify-center relative overflow-hidden cursor-pointer hover:border-[#C8C7C0]">
              <span className="text-[9px] text-[#9A9990]">{r.id}-0{i+1}</span>
              <span className={`${r.color?"tag-color":"tag-bw"} absolute bottom-1 left-1 text-[8px] px-1 py-px rounded font-medium`}>{r.color?"C":"B&W"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RollsList({ rolls, activeFilter, onFilter, onRollClick, onEditRoll, onNewRoll }) {
  const filtered = activeFilter === "all" ? rolls : rolls.filter(r => r.status === activeFilter);
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E4DF]">
        <div><p className="text-[15px] font-medium text-[#1A1A18]">Rolls</p><p className="text-xs text-[#9A9990] mt-0.5">{filtered.length} roll{filtered.length !== 1 ? "s" : ""}</p></div>
        <button onClick={onNewRoll} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#D8D7D0] rounded-lg text-[#4A4A46] hover:bg-[#F7F6F3]">+ Add roll</button>
      </div>
      <div className="p-6">
        <div className="flex gap-1.5 mb-4 flex-wrap">
          {["all","developed","lab","shot"].map(f => (
            <button key={f} onClick={() => onFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${activeFilter===f?"bg-[#1A1A18] text-white border-[#1A1A18]":"border-[#D8D7D0] text-[#4A4A46] hover:bg-[#F7F6F3]"}`}>
              {f==="all"?"All":STATUS_LABELS[f]}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {filtered.map(r => (
            <div key={r.id} className="bg-white border border-[#E5E4DF] rounded-xl px-4 py-3 flex items-center gap-4 hover:border-[#C8C7C0] transition-colors">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-[#9A9990] cursor-pointer" style={{background:THUMB_BGS[r.stock]||"#F1EFE8"}} onClick={()=>onRollClick(r.id)}>
                <span className="text-xs">⊡</span>
              </div>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={()=>onRollClick(r.id)}>
                <p className="text-sm font-medium text-[#1A1A18] truncate">{r.name}</p>
                <p className="text-xs text-[#9A9990] mt-0.5">{r.stock} · {r.camera} · {r.format}{r.location ? " · "+r.location : ""}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <PushPill pp={r.pushpull}/>
                <StatusPill status={r.status}/>
                <button onClick={()=>onEditRoll(r.id)} className="text-xs px-2.5 py-1 border border-[#D8D7D0] rounded-lg text-[#9A9990] hover:text-[#1A1A18] hover:border-[#C8C7C0] flex items-center gap-1">✎ Edit</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RollDetail({ roll, onBack, onEdit, onFrameClick }) {
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
        <div className="flex gap-2">
          <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#D8D7D0] rounded-lg text-[#4A4A46] hover:bg-[#F7F6F3]">✎ Edit roll</button>
        </div>
      </div>
      <div className="p-6">
        {/* Hero */}
        <div className="bg-[#F7F6F3] border border-[#E5E4DF] rounded-xl p-5 mb-4 flex gap-5 items-start">
          <div className="w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:THUMB_BGS[roll.stock]||"#F1EFE8"}}>
            <span className="text-[9px] font-medium text-[#4A4A46] uppercase tracking-wide text-center leading-relaxed px-1">{roll.stock}</span>
          </div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-3 flex-1">
            {[
              ["Camera",     roll.camera],
              ["Lens",       roll.lens || "—"],
              ["Format",     roll.format],
      { label:"Scans", value: developed.reduce((sum, r) => sum + (r.frames || 36), 0), detail:"Across all rolls" },
              ["ISO metered",roll.iso],
              ["Box speed",  roll.box || "—"],
              ["Dev process",roll.process],
            ].map(([l,v]) => (
              <div key={l}>
                <p className="text-[10px] font-medium text-[#9A9990] uppercase tracking-wide mb-0.5">{l}</p>
                <p className="text-sm font-medium text-[#1A1A18]">{v}</p>
              </div>
            ))}
            <div>
              <p className="text-[10px] font-medium text-[#9A9990] uppercase tracking-wide mb-0.5">Push / pull</p>
              {ppCls
                ? <span className={`${ppCls} text-xs font-medium px-2 py-0.5 rounded-full`}>{ppLabel}</span>
                : <p className="text-sm font-medium text-[#1A1A18]">Normal</p>}
            </div>
            <div>
              <p className="text-[10px] font-medium text-[#9A9990] uppercase tracking-wide mb-0.5">Status</p>
              <StatusPill status={roll.status}/>
            </div>
            <div>
              <p className="text-[10px] font-medium text-[#9A9990] uppercase tracking-wide mb-0.5">Session</p>
              <p className="text-sm font-medium text-[#1A1A18]">{roll.session || "—"}</p>
            </div>
          </div>
        </div>

        {roll.location && (
          <p className="text-xs text-[#9A9990] mb-3 flex items-center gap-1">📍 {roll.location}</p>
        )}
        {roll.notes && (
          <div className="bg-[#F7F6F3] rounded-xl p-4 mb-4">
            <p className="text-[10px] font-medium text-[#9A9990] uppercase tracking-wide mb-1.5">Notes</p>
            <p className="text-sm text-[#4A4A46] leading-relaxed">{roll.notes}</p>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-[#1A1A18]">Contact sheet</p>
        </div>
        <ContactSheet roll={roll} onFrameClick={onFrameClick}/>
      </div>
    </div>
  );
}

function ScansPanel({ rolls }) {
  const [filter, setFilter] = useState("all");
  const developed = rolls.filter(r => r.status === "developed");
  const items = [];
  developed.forEach(r => { for(let i=1;i<=6;i++) items.push({roll:r,frame:i,color:i%3!==0&&r.color}); });
  const filtered = filter==="all" ? items : items.filter(x => filter==="color" ? x.color : !x.color);
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E4DF]">
        <div><p className="text-[15px] font-medium text-[#1A1A18]">Scans</p><p className="text-xs text-[#9A9990] mt-0.5">Untouched negatives, organized by roll</p></div>
      </div>
      <div className="p-6">
        <div className="border border-dashed border-[#D8D7D0] rounded-xl p-6 text-center mb-6">
          <p className="text-2xl text-[#9A9990] mb-1">☁</p>
          <p className="text-sm font-medium text-[#1A1A18] mb-1">Upload raw scans</p>
          <p className="text-xs text-[#9A9990] mb-3">Drag and drop TIF or JPEG — stored untouched.</p>
          <button className="px-4 py-1.5 border border-[#D8D7D0] rounded-lg text-xs text-[#4A4A46] hover:bg-[#F7F6F3]">Browse files</button>
        </div>
        <div className="flex gap-1.5 mb-4">
          {["all","color","bw"].map(f => (
            <button key={f} onClick={()=>setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filter===f?"bg-[#1A1A18] text-white border-[#1A1A18]":"border-[#D8D7D0] text-[#4A4A46] hover:bg-[#F7F6F3]"}`}>
              {f==="all"?"All":f==="color"?"Color":"B&W"}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-6 gap-2">
          {filtered.map(({roll,frame,color},i) => (
            <div key={i} className="aspect-square bg-white border border-[#E5E4DF] rounded-lg flex items-center justify-center relative overflow-hidden cursor-pointer hover:border-[#C8C7C0]">
              <span className="text-[9px] text-[#9A9990]">{roll.id}-0{frame}</span>
              <span className={`${color?"tag-color":"tag-bw"} absolute bottom-1 left-1 text-[8px] px-1 py-px rounded font-medium`}>{color?"C":"B&W"}</span>
            </div>
          ))}
        </div>
      </div>
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

/* ─── main app ─── */
export default function App() {
  const [rolls, setRolls] = useState([]);
  const [panel, setPanel] = useState("dashboard");
  const [rollFilter, setRollFilter] = useState("all");
  const [detailId, setDetailId] = useState(null);
  const [rollModal, setRollModal] = useState(null); // null | "new" | rollId
  const [frameModal, setFrameModal] = useState(null); // null | { rollId, frame }
  const [lightbox, setLightbox] = useState(null); // null | { rollId, frame }
  const [toast, setToast] = useState("");

  useEffect(() => { setRolls(loadRolls()); }, []);

  const persist = (next) => { setRolls(next); saveRolls(next); };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const handleSaveRoll = (form) => {
    const isEdit = typeof rollModal === "number";
    if (isEdit) {
      persist(rolls.map(r => r.id === rollModal ? { ...r, ...form, color: form.stock !== "Kentmere Pan 400" } : r));
      showToast("Roll updated");
      openDetail(rollModal);
    } else {
      const next = [{ id: Date.now(), ...form, date: nowDate(), frames: 36, color: form.stock !== "Kentmere Pan 400", frames_data: {} }, ...rolls];
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
    persist(rolls.map(r => r.id === rollId
      ? { ...r, frames_data: { ...r.frames_data, [frame]: form } }
      : r));
    setFrameModal(null);
    showToast("Frame saved");
  };

  const openDetail = (id) => { setDetailId(id); setPanel("detail"); };

  const currentRoll = rolls.find(r => r.id === (lightbox?.rollId || frameModal?.rollId || detailId));
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
          <Dashboard rolls={rolls} onNewRoll={()=>setRollModal("new")}
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
            onBack={()=>setPanel("rolls")}
            onEdit={()=>setRollModal(detailId)}
            onFrameClick={frame=>setLightbox({rollId:detailId,frame})}
          />
        )}
        {panel === "scans" && <ScansPanel rolls={rolls}/>}
        {panel === "sessions" && (
          <SimplePanel title="Sessions" sub="Group rolls by shoot">
            {[
              { name:"Portraits of Aēmoni", meta:"Bushwick Studio · Jul 2025 · 2 rolls", status:"developed" },
              { name:"TWA Terminal editorial", meta:"JFK Airport · Aug 2025 · 1 roll", status:"lab" },
              { name:"Stadium series", meta:"Citi Field · Sep 2025 · 3 rolls", status:"shot" },
            ].map(s => (
              <div key={s.name} className="bg-white border border-[#E5E4DF] rounded-xl px-4 py-3 flex items-center gap-4 mb-2 hover:border-[#C8C7C0]">
                <div className="w-9 h-9 rounded-lg bg-[#F7F6F3] flex items-center justify-center text-[#9A9990]">⊟</div>
                <div className="flex-1"><p className="text-sm font-medium text-[#1A1A18]">{s.name}</p><p className="text-xs text-[#9A9990] mt-0.5">{s.meta}</p></div>
                <div className="flex items-center gap-2"><StatusPill status={s.status}/><button className="text-xs px-2.5 py-1 border border-[#D8D7D0] rounded-lg text-[#9A9990] hover:text-[#1A1A18]">✎ Edit</button></div>
              </div>
            ))}
          </SimplePanel>
        )}
        {panel === "stocks" && (
          <SimplePanel title="Film stocks" sub="All stocks used in your archive">
            {[
              { process:"C41", name:"CineStill 400D", meta:"ISO 400 · Color negative · Daylight", count:"3 rolls" },
              { process:"C41", name:"Kodak Portra 400", meta:"ISO 400 · Color negative · Daylight", count:"2 rolls" },
              { process:"B&W", name:"Kentmere Pan 400", meta:"ISO 400 · Black & white · Panchromatic", count:"1 roll" },
              { process:"C41", name:"Kodak Gold 200", meta:"ISO 200 · Color negative · Daylight", count:"1 roll" },
              { process:"C41", name:"Portra 160 NC (expired)", meta:"ISO 40 metered · Color negative · 2004", count:"0 rolls yet" },
            ].map(s => (
              <div key={s.name} className="bg-white border border-[#E5E4DF] rounded-xl px-4 py-3 flex items-center gap-4 mb-2 hover:border-[#C8C7C0]">
                <div className="w-9 h-9 rounded-lg bg-[#F7F6F3] flex items-center justify-center text-[10px] font-medium text-[#9A9990]">{s.process}</div>
                <div className="flex-1"><p className="text-sm font-medium text-[#1A1A18]">{s.name}</p><p className="text-xs text-[#9A9990] mt-0.5">{s.meta}</p></div>
                <div className="flex items-center gap-2"><span className="text-xs text-[#9A9990]">{s.count}</span><button className="text-xs px-2.5 py-1 border border-[#D8D7D0] rounded-lg text-[#9A9990] hover:text-[#1A1A18]">✎ Edit</button></div>
              </div>
            ))}
          </SimplePanel>
        )}
        {panel === "export" && (
          <SimplePanel title="Export" sub="Download your archive in different formats">
            {[
              { icon:"⊞", title:"Full archive as CSV", sub:"All rolls, stocks, push/pull notes and metadata" },
              { icon:"◫", title:"Contact sheet PDF", sub:"Print-ready contact sheets for any roll or session" },
              { icon:"↓", title:"Raw scans ZIP", sub:"All untouched scan files for a roll or session" },
              { icon:"◎", title:"Contact sheet for social", sub:"1:1 formatted contact sheet image ready to share" },
            ].map(e => (
              <div key={e.title} className="bg-white border border-[#E5E4DF] rounded-xl px-4 py-3.5 flex items-center gap-4 mb-2 cursor-pointer hover:border-[#C8C7C0] transition-colors">
                <span className="text-xl text-[#9A9990] w-8 text-center">{e.icon}</span>
                <div><p className="text-sm font-medium text-[#1A1A18]">{e.title}</p><p className="text-xs text-[#9A9990] mt-0.5">{e.sub}</p></div>
              </div>
            ))}
          </SimplePanel>
        )}
      </main>

      {/* Modals */}
      {rollModal !== null && (
        <RollModal
          roll={editingRoll}
          onSave={handleSaveRoll}
          onDelete={handleDeleteRoll}
          onClose={() => setRollModal(null)}
        />
      )}
      {frameModal && (
        <FrameModal
          roll={rolls.find(r=>r.id===frameModal.rollId)}
          frame={frameModal.frame}
          onSave={handleSaveFrame}
          onClose={() => setFrameModal(null)}
        />
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-[#1A1A18] text-white text-xs font-medium px-4 py-2 rounded-full z-50 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
