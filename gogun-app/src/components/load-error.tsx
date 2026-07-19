"use client";

export function LoadError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0]">
      <div className="flex w-full max-w-[420px] flex-col items-center gap-[16px] px-[24px] text-center">
        <p className="text-[14px] font-light leading-[1.5] text-[#767168]">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-[12px] bg-[#14110d] px-[20px] py-[10px] text-[13px] font-medium text-[#f7f5f0]"
        >
          ลองใหม่
        </button>
      </div>
    </main>
  );
}
