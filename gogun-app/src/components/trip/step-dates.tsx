import { Calendar } from "@/components/trip/calendar";
import { formatThaiShortDate, type TripFormData } from "@/lib/trip";

export function StepDates({
  formData,
  onChange,
}: {
  formData: TripFormData;
  onChange: (patch: Partial<TripFormData>) => void;
}) {
  function handleSelectDay(day: Date) {
    if (!formData.startDate || (formData.startDate && formData.endDate)) {
      onChange({ startDate: day, endDate: null });
    } else if (day < formData.startDate) {
      onChange({ startDate: day, endDate: null });
    } else {
      onChange({ endDate: day });
    }
  }

  return (
    <div className="flex w-full flex-1 flex-col gap-[8px] overflow-y-auto px-[24px] pb-[24px] pt-[16px]">
      <div className="flex h-[22px] w-full items-center gap-[6px] pb-[16px]">
        <div className="flex size-[22px] items-center justify-center rounded-[11px] bg-[#14110d]">
          <p className="text-[11px] font-medium text-[#f7f5f0]">2</p>
        </div>
        <p className="text-[11px] tracking-[0.44px] text-[#767168]">เลือกวันที่</p>
      </div>
      <h1 className="text-[28px] font-medium tracking-[-0.28px] text-[#14110d]">
        วันไหนดี?
      </h1>
      <p className="pb-[20px] text-[13px] tracking-[0.08px] text-[#767168]">
        ใส่เป็น &quot;วันที่เสนอ&quot; ก่อนได้ — เพื่อนช่วยโหวตยืนยันได้ในแอป
      </p>
      <div className="flex gap-[12px] pb-[6px]">
        <div className="flex flex-1 flex-col gap-[2px] rounded-[14px] border border-[#e5e1d7] bg-white p-[15px]">
          <p className="pb-[4px] text-[10px] uppercase text-[#767168]">เริ่ม</p>
          <p className="text-[18px] font-medium tracking-[0.08px] text-[#14110d]">
            {formData.startDate ? formatThaiShortDate(formData.startDate) : "—"}
          </p>
          <p className="text-[11px] tracking-[0.08px] text-[#767168]">
            {formData.startDate ? "" : "ยังไม่เลือก"}
          </p>
        </div>
        <div className="flex flex-1 flex-col gap-[2px] rounded-[14px] border border-[#e5e1d7] bg-white p-[15px]">
          <p className="pb-[4px] text-[10px] uppercase text-[#767168]">สิ้นสุด</p>
          <p className="text-[18px] font-medium tracking-[0.08px] text-[#14110d]">
            {formData.endDate ? formatThaiShortDate(formData.endDate) : "—"}
          </p>
          <p className="text-[11px] tracking-[0.08px] text-[#767168]">
            {formData.endDate ? "" : "เลือกในปฏิทิน"}
          </p>
        </div>
      </div>
      <Calendar
        startDate={formData.startDate}
        endDate={formData.endDate}
        onSelectDay={handleSelectDay}
      />
      <p className="text-[11.5px] tracking-[0.08px] text-[#767168]">
        แตะวันเริ่มต้นในปฏิทินด้านบน
      </p>
    </div>
  );
}
