import { CURRENCIES, type Permissions, type TripFormData } from "@/lib/trip";

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors ${
        checked ? "bg-[#e85a2c]" : "bg-[#f2efe8]"
      }`}
    >
      <span
        className={`absolute top-[2px] size-[22px] rounded-[11px] bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.15)] transition-all ${
          checked ? "left-[20px]" : "left-[2px]"
        }`}
      />
    </button>
  );
}

const PERMISSION_ITEMS: {
  key: keyof Permissions;
  title: string;
  subtitle: string;
}[] = [
  {
    key: "addExpenses",
    title: "เพิ่มค่าใช้จ่ายเองได้",
    subtitle: "ทุกคนเพิ่มบิลของตัวเองได้",
  },
  {
    key: "editItinerary",
    title: "แก้แผนเดินทางได้",
    subtitle: "สมาชิกแก้ itinerary ร่วมกัน",
  },
  {
    key: "inviteOthers",
    title: "เชิญคนอื่นเพิ่มได้",
    subtitle: "ถ้าปิด มีแค่คุณที่เชิญเพิ่มได้",
  },
];

export function StepSettings({
  formData,
  onChange,
}: {
  formData: TripFormData;
  onChange: (patch: Partial<TripFormData>) => void;
}) {
  const currentCurrency = CURRENCIES.find((c) => c.code === formData.currency);

  return (
    <div className="flex w-full flex-1 flex-col gap-[8px] overflow-y-auto px-[24px] pb-[24px] pt-[16px]">
      <div className="flex h-[22px] w-full items-center gap-[6px] pb-[16px]">
        <div className="flex size-[22px] items-center justify-center rounded-[11px] bg-[#14110d]">
          <p className="text-[11px] font-medium text-[#f7f5f0]">4</p>
        </div>
        <p className="text-[11px] tracking-[0.44px] text-[#767168]">ตั้งค่า</p>
      </div>
      <h1 className="text-[28px] font-medium tracking-[-0.28px] text-[#14110d]">
        ตั้งค่าทริป
      </h1>
      <p className="pb-[20px] text-[13px] tracking-[0.08px] text-[#767168]">
        ปรับได้ทุกอย่างทีหลังในเมนู Settings
      </p>
      <div className="flex w-full flex-col gap-[14px] pb-[14px]">
        <p className="text-[10.5px] uppercase tracking-[1.68px] text-[#767168]">
          สกุลเงินหลัก
        </p>
        <div className="flex flex-wrap gap-[8px]">
          {CURRENCIES.map((c) => {
            const selected = c.code === formData.currency;
            return (
              <button
                type="button"
                key={c.code}
                onClick={() => onChange({ currency: c.code })}
                className={`rounded-full border px-[13px] py-[8px] text-[12px] tracking-[0.08px] ${
                  selected
                    ? "border-[#14110d] bg-[#14110d] text-[#f7f5f0]"
                    : "border-[#e5e1d7] bg-white text-[#14110d]"
                }`}
              >
                {c.code}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex w-full flex-col gap-[6px] pb-[14px]">
        <p className="text-[10.5px] uppercase tracking-[1.68px] text-[#767168]">
          งบประมาณ / คน (ตัวเลือก)
        </p>
        <div className="flex items-start gap-[6px] border-b border-[#e5e1d7] pb-[11px] pt-[10px]">
          <span className="pt-[6px] text-[16px] text-[#767168]">
            {currentCurrency?.symbol}
          </span>
          <input
            value={formData.budgetPerPerson}
            onChange={(e) => onChange({ budgetPerPerson: e.target.value })}
            inputMode="numeric"
            placeholder="80,000"
            className="flex-1 bg-transparent text-[22px] font-medium text-[#14110d] placeholder:text-[#757575] focus:outline-none"
          />
        </div>
        <p className="text-[11.5px] tracking-[0.08px] text-[#767168]">
          ใช้เป็นเกณฑ์เตือนเมื่อใช้เกิน — ไม่บังคับ
        </p>
      </div>
      <div className="flex w-full flex-col gap-[10px]">
        <p className="text-[10.5px] uppercase tracking-[1.68px] text-[#767168]">
          สิทธิ์สมาชิก
        </p>
        <div className="flex w-full flex-col rounded-[16px] border border-[#e5e1d7] bg-white">
          {PERMISSION_ITEMS.map((item, i) => (
            <div
              key={item.key}
              className={`flex items-center gap-[12px] px-[16px] py-[13px] ${
                i < PERMISSION_ITEMS.length - 1 ? "border-b border-[#e5e1d7]" : ""
              }`}
            >
              <div className="flex flex-1 flex-col gap-px tracking-[0.08px]">
                <p className="text-[14px] text-[#14110d]">{item.title}</p>
                <p className="text-[11px] text-[#767168]">{item.subtitle}</p>
              </div>
              <Toggle
                checked={formData.permissions[item.key]}
                onChange={(checked) =>
                  onChange({
                    permissions: { ...formData.permissions, [item.key]: checked },
                  })
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
