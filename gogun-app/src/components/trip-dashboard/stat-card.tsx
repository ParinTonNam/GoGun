export function StatCard({
  value,
  valueColor,
  label,
  onClick,
}: {
  value: string;
  valueColor: string;
  label: string;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className="flex flex-1 flex-col gap-[3px] rounded-[14px] border border-[#e5e1d7] bg-white px-[17px] pb-[14px] pt-[15px] text-left">
      <p
        className="text-[24px] font-medium tracking-[-0.24px]"
        style={{ color: valueColor }}
      >
        {value}
      </p>
      <p className="text-[11px] tracking-[0.22px] text-[#767168]">{label}</p>
    </Tag>
  );
}
