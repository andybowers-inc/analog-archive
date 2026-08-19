"use client";
import { useState, useEffect } from "react";

const COMMON_STOCKS = [
  "CineStill 400D",
  "CineStill 50D",
  "CineStill 800T",
  "Kodak Portra 400",
  "Kodak Portra 160",
  "Kodak Portra 800",
  "Kodak Gold 200",
  "Kodak ColorPlus 200",
  "Kodak UltraMax 400",
  "Kodak Ektar 100",
  "Kodak T-Max 100",
  "Kodak T-Max 400",
  "Kodak Tri-X 400",
  "Kodak Double-X",
  "Fujifilm Pro 400H",
  "Fujifilm Velvia 50",
  "Fujifilm Velvia 100",
  "Fujifilm Provia 100F",
  "Fujifilm Acros 100",
  "Fujifilm Acros 100 II",
  "Fujifilm Superia 400",
  "Ilford HP5 Plus 400",
  "Ilford FP4 Plus 125",
  "Ilford Delta 100",
  "Ilford Delta 400",
  "Ilford Delta 3200",
  "Ilford XP2 Super 400",
  "Kentmere Pan 400",
  "Kentmere Pan 100",
  "Lomography Color 400",
  "Lomography Color 800",
  "Lomography Lady Grey 400",
  "Lomography Berlin Kino 400",
  "Rollei RPX 400",
  "Rollei RPX 100",
  "Fomapan 400",
  "Fomapan 200",
  "Fomapan 100",
  "Portra 160 NC",
  "Portra 160 VC",
];

const FORMATS = ["35mm","120"];
const FORMAT_FRAMES = { "35mm": 36, "120": 10 };
const PROCESSES = ["C-41","B&W standard","E-6","ECN-2","Home dev"];
const PUSHPULL = [
  { value:"none",  label:"Normal (no push/pull)" },
  { value:"push1", label:"Push +1" },
  { value:"push2", label:"Push +2" },
  { value:"push3", label:"Push +3" },
  { value:"pull1", label:"Pull -1" },
  { value:"pull2", label:"Pull -2" },
];
const STATUSES = [
  { value:"shot",      label:"Shot — not yet sent" },
  { value:"lab",       label:"At lab" },
  { value:"developed", label:"Developed & scanned" },
];

const EMPTY = {
  name:"", stock:"", format:"35mm",
  camera:"", lens:"", iso:"", box:"",
  frames: 36,
  pushpull:"none", process:"C-41",
  session:"", status:"shot",
  location:"", notes:"",
};

export default function RollModal({ roll, sessions = [], onSave, onDelete, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const isEdit = !!roll;

  useEffect(() => {
    setForm(roll ? { ...EMPTY, ...roll } : EMPTY);
  }, [roll]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inp = "w-full px-2.5 py-1.5 border border-[#D8D7D0] rounded-lg text-sm bg-[#F7F6F3] text-[#1A1A18] focus:outline-none focus:border-[#1A1A18]";
  const lbl = "block text-xs font-medium text-[#4A4A46] mb-1";

  const Section = ({ title }) => (
    <>
      <hr className="border-[#E5E4DF] my-3" />
      <p className="text-[10px] font-medium text-[#9A9990] uppercase tracking-wider mb-2">{title}</p>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-[#E5E4DF] rounded-xl w-full max-w-md flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E4DF]">
          <h2 className="text-sm font-medium text-[#1A1A18]">{isEdit ? "Edit roll" : "Add new roll"}</h2>
          <button onClick={onClose} className="text-[#9A9990] hover:text-[#1A1A18] text-lg leading-none">✕</button>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1 text-sm">
          <p className="text-[10px] font-medium text-[#9A9990] uppercase tracking-wider mb-2">Roll details</p>

          <div className="mb-3">
            <label className={lbl}>Roll name</label>
            <input className={inp} type="text" value={form.name}
              onChange={e=>set("name",e.target.value)}
              placeholder="e.g. Aēmoni portraits #2"/>
          </div>

          <div className="mb-3">
            <label className={lbl}>Film stock</label>
            <input
              className={inp}
              type="text"
              list="stock-suggestions"
              value={form.stock}
              onChange={e=>set("stock",e.target.value)}
              placeholder="Type or select a film stock…"
            />
            <datalist id="stock-suggestions">
              {COMMON_STOCKS.map(s=><option key={s} value={s}/>)}
            </datalist>
            <p className="text-[11px] text-[#9A9990] mt-1">Type any stock name — common stocks are suggested as you type.</p>
          </div>

          <div className="form-row grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className={lbl}>Format</label>
              <select className={inp} value={form.format} onChange={e=>{
                const fmt = e.target.value;
                set("format", fmt);
                set("frames", FORMAT_FRAMES[fmt] ?? 36);
              }}>
                {FORMATS.map(f=><option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Number of frames</label>
              <input className={inp} type="number" min="1" max="220"
                value={form.frames}
                onChange={e=>set("frames", parseInt(e.target.value)||1)}/>
            </div>
          </div>

          <Section title="Camera & Exposure" />
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className={lbl}>Camera body</label>
              <input className={inp} type="text" value={form.camera}
                onChange={e=>set("camera",e.target.value)} placeholder="e.g. Mamiya RB67"/>
            </div>
            <div>
              <label className={lbl}>Lens</label>
              <input className={inp} type="text" value={form.lens}
                onChange={e=>set("lens",e.target.value)} placeholder="e.g. 65mm f/2.8"/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className={lbl}>ISO metered at</label>
              <input className={inp} type="text" value={form.iso}
                onChange={e=>set("iso",e.target.value)} placeholder="e.g. 400"/>
            </div>
            <div>
              <label className={lbl}>Box speed</label>
              <input className={inp} type="text" value={form.box}
                onChange={e=>set("box",e.target.value)} placeholder="e.g. 400"/>
            </div>
          </div>

          <Section title="Push / Pull" />
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className={lbl}>Push / pull</label>
              <select className={inp} value={form.pushpull} onChange={e=>set("pushpull",e.target.value)}>
                {PUSHPULL.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Dev process</label>
              <select className={inp} value={form.process} onChange={e=>set("process",e.target.value)}>
                {PROCESSES.map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <Section title="Organisation" />
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className={lbl}>Session</label>
              <select className={inp} value={form.session} onChange={e=>set("session",e.target.value)}>
                <option value="">— none —</option>
                {sessions.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Status</label>
              <select className={inp} value={form.status} onChange={e=>set("status",e.target.value)}>
                {STATUSES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className={lbl}>Location shot</label>
            <input className={inp} type="text" value={form.location}
              onChange={e=>set("location",e.target.value)}
              placeholder="e.g. Bushwick Studio, Brooklyn"/>
          </div>
          <div className="mb-1">
            <label className={lbl}>Notes</label>
            <textarea className={inp} rows={3} value={form.notes}
              onChange={e=>set("notes",e.target.value)}
              placeholder="Metering notes, lighting conditions, push/pull reasoning…"
              style={{resize:"none"}}/>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-[#E5E4DF]">
          {isEdit ? (
            <button onClick={()=>onDelete(roll.id)}
              className="text-xs text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 flex items-center gap-1">
              ✕ Delete roll
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <button onClick={onClose}
              className="text-sm px-4 py-1.5 border border-[#D8D7D0] rounded-lg text-[#4A4A46] hover:bg-[#F7F6F3]">
              Cancel
            </button>
            <button onClick={()=>onSave(form)}
              className="text-sm px-4 py-1.5 bg-[#1A1A18] text-white rounded-lg font-medium hover:bg-[#333]">
              Save roll
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
