"use client";
import { useState, useEffect } from "react";

const EMPTY = { aperture:"", shutter:"", focal:"", filter:"", subject:"", lighting:"", notes:"", flag:"" };

export default function FrameModal({ roll, frame, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const inp = "w-full px-2.5 py-1.5 border border-[#D8D7D0] rounded-lg text-sm bg-[#F7F6F3] text-[#1A1A18] focus:outline-none focus:border-[#1A1A18]";
  const lbl = "block text-xs font-medium text-[#4A4A46] mb-1";

  useEffect(() => {
    if (roll && frame) {
      setForm({ ...EMPTY, ...(roll.frames_data?.[frame] || {}) });
    }
  }, [roll, frame]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-[#E5E4DF] rounded-xl w-full max-w-sm flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E4DF]">
          <div>
            <h2 className="text-sm font-medium text-[#1A1A18]">Edit frame {frame}</h2>
            <p className="text-xs text-[#9A9990] mt-0.5">{roll?.name}</p>
          </div>
          <button onClick={onClose} className="text-[#9A9990] hover:text-[#1A1A18] text-lg leading-none">✕</button>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1">
          <p className="text-[10px] font-medium text-[#9A9990] uppercase tracking-wider mb-2">Exposure</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className={lbl}>Aperture</label><input className={inp} value={form.aperture} onChange={e=>set("aperture",e.target.value)} placeholder="f/2.8"/></div>
            <div><label className={lbl}>Shutter speed</label><input className={inp} value={form.shutter} onChange={e=>set("shutter",e.target.value)} placeholder="1/250"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className={lbl}>Focal length</label><input className={inp} value={form.focal} onChange={e=>set("focal",e.target.value)} placeholder="50mm"/></div>
            <div><label className={lbl}>Filter used</label><input className={inp} value={form.filter} onChange={e=>set("filter",e.target.value)} placeholder="e.g. Red 25A"/></div>
          </div>

          <hr className="border-[#E5E4DF] my-3"/>
          <p className="text-[10px] font-medium text-[#9A9990] uppercase tracking-wider mb-2">Notes</p>
          <div className="mb-3"><label className={lbl}>Subject / description</label><input className={inp} value={form.subject} onChange={e=>set("subject",e.target.value)} placeholder="e.g. Aēmoni, window light, profile"/></div>
          <div className="mb-3"><label className={lbl}>Lighting notes</label><input className={inp} value={form.lighting} onChange={e=>set("lighting",e.target.value)} placeholder="e.g. South window, direct noon sun"/></div>
          <div className="mb-3"><label className={lbl}>Additional notes</label><textarea className={inp} rows={2} value={form.notes} onChange={e=>set("notes",e.target.value)} style={{resize:"none"}} placeholder="Anything worth noting..."/></div>

          <hr className="border-[#E5E4DF] my-3"/>
          <div>
            <label className={lbl}>Flag frame</label>
            <select className={inp} value={form.flag} onChange={e=>set("flag",e.target.value)}>
              <option value="">No flag</option>
              <option value="star">⭐ Starred — best of roll</option>
              <option value="reject">✕ Reject</option>
              <option value="review">○ Needs review</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-[#E5E4DF]">
          <button onClick={onClose} className="text-sm px-4 py-1.5 border border-[#D8D7D0] rounded-lg text-[#4A4A46] hover:bg-[#F7F6F3]">Cancel</button>
          <button onClick={()=>onSave(form)} className="text-sm px-4 py-1.5 bg-[#1A1A18] text-white rounded-lg font-medium hover:bg-[#333]">Save frame</button>
        </div>
      </div>
    </div>
  );
}
