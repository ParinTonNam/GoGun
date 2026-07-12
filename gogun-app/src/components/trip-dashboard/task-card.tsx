export function TaskCard({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon: string;
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex w-full items-center gap-[12px] rounded-[14px] border border-[#e5e1d7] bg-white px-[15px] py-[13px]">
      <div className="flex size-[36px] shrink-0 items-center justify-center rounded-[10px] bg-[#fcede3]">
        <img src={icon} alt="" className="size-[20px]" />
      </div>
      <div className="flex flex-1 flex-col gap-[2px]">
        <p className="text-[13.5px] font-medium tracking-[0.08px] text-[#14110d]">
          {title}
        </p>
        <p className="text-[11px] tracking-[0.08px] text-[#767168]">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="shrink-0 rounded-[9px] bg-[#14110d] px-[14px] py-[7px] text-[12px] font-medium text-[#f7f5f0]"
      >
        {actionLabel}
      </button>
    </div>
  );
}
