export function MemberAvatar({
  name,
  color,
  statusLabel,
  statusColor,
  muted,
}: {
  name: string;
  color: string;
  statusLabel: string;
  statusColor: string;
  muted?: boolean;
}) {
  return (
    <div className="flex w-[64px] shrink-0 flex-col items-center gap-[6px] px-[8px]">
      <div
        className={`flex size-[48px] items-center justify-center rounded-[24px] text-[16px] font-medium text-white ${
          muted ? "opacity-45" : ""
        }`}
        style={{ backgroundColor: color }}
      >
        {name.trim().charAt(0)}
      </div>
      <p className="text-[11px] tracking-[0.08px] text-[#14110d]">{name}</p>
      <p
        className="text-[9px] uppercase tracking-[0.08px]"
        style={{ color: statusColor }}
      >
        {statusLabel}
      </p>
    </div>
  );
}
