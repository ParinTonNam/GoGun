import { DESTINATIONS, type TripFormData } from "@/lib/trip";

export function StepName({
  formData,
  onChange,
}: {
  formData: TripFormData;
  onChange: (patch: Partial<TripFormData>) => void;
}) {
  function toggleDestination(code: string) {
    const isSelected = formData.destinationCodes.includes(code);
    onChange({
      destinationCodes: isSelected
        ? formData.destinationCodes.filter((c) => c !== code)
        : [...formData.destinationCodes, code],
    });
  }

  const selectedCities = DESTINATIONS.filter((d) =>
    formData.destinationCodes.includes(d.code),
  )
    .map((d) => d.cities)
    .join(" · ");

  return (
    <div className="flex w-full flex-1 flex-col gap-[8px] overflow-y-auto px-[24px] pb-[24px] pt-[16px]">
      <div className="flex h-[22px] w-full items-center gap-[6px] pb-[16px]">
        <div className="flex size-[22px] items-center justify-center rounded-[11px] bg-[#14110d]">
          <p className="text-[11px] font-medium text-[#f7f5f0]">1</p>
        </div>
        <p className="text-[11px] tracking-[0.44px] text-[#767168]">ตั้งชื่อทริป</p>
      </div>
      <h1 className="text-[28px] font-medium tracking-[-0.28px] text-[#14110d]">
        จะไปไหนกันดี?
      </h1>
      <p className="pb-[20px] text-[13px] tracking-[0.08px] text-[#767168]">
        ตั้งชื่อสั้นๆ ให้จำง่าย — เปลี่ยนทีหลังได้
      </p>
      <div className="flex w-full flex-col gap-[8px] pb-[14px]">
        <div className="flex gap-[2px] text-[10.5px] uppercase">
          <span className="text-[#767168]">ชื่อทริป</span>
          <span className="tracking-[1.68px] text-[#e85a2c]">*</span>
        </div>
        <input
          value={formData.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="เช่น Tokyo Autumn"
          className="w-full border-b border-[#e85a2c] bg-transparent pb-[15px] pt-[14px] text-[26px] font-medium tracking-[-0.26px] text-[#14110d] placeholder:text-[#b5b0a4] focus:outline-none"
        />
      </div>
      <div className="flex w-full flex-col gap-[6px]">
        <p className="pb-[8px] text-[10.5px] uppercase tracking-[1.68px] text-[#767168]">
          จุดหมาย
        </p>
        <div className="flex flex-wrap gap-[8px] text-[12px] tracking-[0.08px]">
          {DESTINATIONS.map((d) => {
            const selected = formData.destinationCodes.includes(d.code);
            return (
              <button
                type="button"
                key={d.code}
                onClick={() => toggleDestination(d.code)}
                className={`flex items-center gap-[6px] rounded-full border px-[13px] py-[9px] ${
                  selected
                    ? "border-[#14110d] bg-[#14110d] text-[#f7f5f0]"
                    : "border-[#e5e1d7] bg-white text-[#14110d]"
                }`}
              >
                <span className="font-medium">{d.flag}</span>
                <span>{d.name}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[11.5px] tracking-[0.08px] text-[#767168]">
          {selectedCities || "ยังไม่เลือกจุดหมาย"}
        </p>
      </div>
    </div>
  );
}
