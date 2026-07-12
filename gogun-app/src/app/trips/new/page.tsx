"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WizardHeader } from "@/components/trip/wizard-header";
import { StepName } from "@/components/trip/step-name";
import { StepDates } from "@/components/trip/step-dates";
import { StepMembers } from "@/components/trip/step-members";
import { StepSettings } from "@/components/trip/step-settings";
import { FinishScreen } from "@/components/trip/finish-screen";
import { createInitialTripFormData, DESTINATIONS, type TripFormData } from "@/lib/trip";
import { createTrip } from "@/lib/api";

const TOTAL_STEPS = 4;

export default function NewTripPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<TripFormData>(createInitialTripFormData);
  const [createdTripId, setCreatedTripId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function patch(p: Partial<TripFormData>) {
    setFormData((prev) => ({ ...prev, ...p }));
  }

  function goBack() {
    if (step === 1) {
      router.push("/trips");
    } else {
      setStep((s) => s - 1);
    }
  }

  function goNext() {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS + 1));
  }

  async function handleCreate() {
    if (creating) return;
    setCreating(true);
    try {
      const primaryDest = DESTINATIONS.find((d) => formData.destinationCodes.includes(d.code));
      const durationDays = formData.startDate && formData.endDate
        ? Math.max(1, Math.round((formData.endDate.getTime() - formData.startDate.getTime()) / 86400000) + 1)
        : 5;
      const trip = await createTrip({
        name: formData.name || "ทริปใหม่",
        destination: primaryDest?.name ?? formData.destinationCodes[0] ?? "ไม่ระบุ",
        duration_days: durationDays,
        currency: formData.currency || "JPY",
        proposed_start_date: formData.startDate ? formData.startDate.toISOString().slice(0, 10) : undefined,
      });
      setCreatedTripId(trip.id);
      goNext();
    } catch (e) {
      console.error(e);
      goNext();
    } finally {
      setCreating(false);
    }
  }

  const canProceedStep1 = formData.name.trim().length > 0;
  const canProceedStep2 = formData.startDate !== null;

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex min-h-screen w-full max-w-[420px] flex-col">
        {step <= TOTAL_STEPS && (
          <WizardHeader step={step} totalSteps={TOTAL_STEPS} onBack={goBack} />
        )}

        {step === 1 && <StepName formData={formData} onChange={patch} />}
        {step === 2 && <StepDates formData={formData} onChange={patch} />}
        {step === 3 && <StepMembers formData={formData} onChange={patch} />}
        {step === 4 && <StepSettings formData={formData} onChange={patch} />}
        {step === 5 && (
          <FinishScreen
            formData={formData}
            onManageTrip={() => router.push(createdTripId ? `/trips/${createdTripId}` : "/trips/demo")}
          />
        )}

        {step === 1 && (
          <div className="flex w-full shrink-0 border-t border-[#e5e1d7] px-[20px] pb-[28px] pt-[13px]">
            <button
              type="button"
              onClick={goNext}
              disabled={!canProceedStep1}
              className="flex h-[48px] w-full items-center justify-center rounded-[14px] bg-[#e85a2c] text-[14px] font-medium tracking-[0.14px] text-white disabled:opacity-40"
            >
              ถัดไป
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex w-full shrink-0 items-start gap-[10px] border-t border-[#e5e1d7] px-[20px] pb-[28px] pt-[13px]">
            <button
              type="button"
              onClick={goNext}
              className="px-[12px] py-[14.5px] text-[13px] tracking-[0.08px] text-[#767168]"
            >
              ข้าม
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={!canProceedStep2}
              className="flex h-[48px] flex-1 items-center justify-center rounded-[14px] bg-[#e85a2c] text-[14px] font-medium tracking-[0.14px] text-white disabled:opacity-40"
            >
              ถัดไป
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="flex w-full shrink-0 border-t border-[#e5e1d7] px-[20px] pb-[28px] pt-[13px]">
            <button
              type="button"
              onClick={goNext}
              className="flex h-[48px] w-full items-center justify-center gap-[5px] rounded-[14px] bg-[#e85a2c] text-[14px] font-medium tracking-[0.14px] text-white"
            >
              ถัดไป · {formData.members.length} คน
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="flex w-full shrink-0 border-t border-[#e5e1d7] px-[20px] pb-[28px] pt-[13px]">
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="flex h-[48px] w-full items-center justify-center rounded-[14px] bg-[#e85a2c] text-[14px] font-medium tracking-[0.14px] text-white disabled:opacity-50"
            >
              {creating ? "กำลังสร้างทริป..." : "เปิดทริป"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
