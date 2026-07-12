export function ToolRow({
  icon,
  title,
  subtitle,
  showDivider,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  showDivider: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-[12px] px-[16px] py-[13px] text-left ${
        showDivider ? "border-b border-[#e5e1d7]" : ""
      }`}
    >
      <div className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] bg-[#f2efe8]">
        {icon}
      </div>
      <div className="flex flex-1 flex-col gap-px tracking-[0.08px]">
        <p className="text-[14px] text-[#14110d]">{title}</p>
        <p className="text-[11px] text-[#767168]">{subtitle}</p>
      </div>
      <img
        src="/images/icon-chevron-left.svg"
        alt=""
        className="h-[10px] w-[6px] rotate-180"
      />
    </button>
  );
}
