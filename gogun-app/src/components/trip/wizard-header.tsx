export function WizardHeader({
  step,
  totalSteps,
  onBack,
}: {
  step: number;
  totalSteps: number;
  onBack: () => void;
}) {
  const progress = (step / totalSteps) * 100;

  return (
    <div className="flex h-[60px] w-full shrink-0 items-center gap-[12px] px-[20px] pb-[8px] pt-[16px]">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="flex size-[36px] shrink-0 items-center justify-center rounded-[18.5px] border border-[#e5e1d7] bg-white"
      >
        <img src="/images/icon-chevron-left.svg" alt="" className="h-[10px] w-[6px]" />
      </button>
      <div className="h-[3px] flex-1 overflow-hidden rounded-[2px] bg-[#f2efe8]">
        <div
          className="h-full rounded-[2px] bg-[#14110d] transition-[width]"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="shrink-0 text-[10px] tracking-[1.6px] text-[#767168]">
        {step}/{totalSteps}
      </p>
    </div>
  );
}
