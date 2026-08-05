"use client";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "rolls",     label: "Rolls",     icon: "⊡" },
  { id: "scans",     label: "Scans",     icon: "◫" },
];
const NAV2 = [
  { id: "sessions", label: "Sessions",    icon: "⊟" },
  { id: "stocks",   label: "Film stocks", icon: "≡" },
  { id: "export",   label: "Export",      icon: "↓" },
];

export default function Sidebar({ active, onChange, onNewRoll }) {
  const item = (nav) => nav.map(({ id, label, icon }) => (
    <button
      key={id}
      onClick={() => onChange(id)}
      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-left transition-colors
        ${active === id
          ? "bg-[#F7F6F3] text-[#1A1A18] font-medium"
          : "text-[#4A4A46] hover:bg-[#F7F6F3] hover:text-[#1A1A18]"}`}
    >
      <span className="text-base w-4 text-center leading-none">{icon}</span>
      {label}
    </button>
  ));

  return (
    <aside className="w-48 min-w-[192px] border-r border-[#E5E4DF] bg-white flex flex-col py-5">
      {/* Logo */}
      <div className="px-5 pb-4 border-b border-[#E5E4DF] mb-3">
        <div className="text-sm font-medium text-[#1A1A18] tracking-wide">Analog Archive</div>
        <div className="text-xs text-[#9A9990] mt-0.5">Film management</div>
      </div>

      {/* Main nav */}
      <div className="px-3 mb-1">
        <p className="text-[10px] font-medium text-[#9A9990] uppercase tracking-widest px-2 mb-1">Main</p>
        {item(NAV)}
      </div>

      {/* Organize nav */}
      <div className="px-3 mt-3">
        <p className="text-[10px] font-medium text-[#9A9990] uppercase tracking-widest px-2 mb-1">Organize</p>
        {item(NAV2)}
      </div>

      {/* New roll btn */}
      <div className="mt-auto px-3 pt-3 border-t border-[#E5E4DF]">
        <button
          onClick={onNewRoll}
          className="w-full py-2 bg-[#1A1A18] text-white text-sm font-medium rounded-lg flex items-center justify-center gap-1.5 hover:bg-[#333] transition-colors"
        >
          + New roll
        </button>
      </div>
    </aside>
  );
}
