"use client";
type Status = "available" | "uncertain" | "unavailable";
export function AvailabilityBrush({ value, onChange, disabled }: { value: Status; onChange: (s: Status) => void; disabled?: boolean }) {
  return <fieldset className="clay-brush" disabled={disabled}>
    <legend>1. เลือกสถานะ · 2. แตะหรือลากบนวันที่</legend>
    <div className="flex flex-wrap gap-2">{([
      ["available", "✓ ว่าง", "mint"], ["uncertain", "? ไม่แน่ใจ", "ochre"], ["unavailable", "– ไม่ว่าง", "cream"],
    ] as const).map(([status, label, tone]) => <button type="button" key={status} aria-pressed={value === status} className={`workspace-button clay-${tone}`} onClick={() => onChange(status)}>{label}</button>)}</div>
    <p className="workspace-meta">แตะซ้ำจะใช้สถานะที่เลือกอยู่ จากนั้นกดบันทึกวันว่าง</p>
  </fieldset>;
}
