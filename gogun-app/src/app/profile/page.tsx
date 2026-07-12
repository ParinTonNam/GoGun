"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { NotificationToggle } from "@/components/notification-toggle";
import { getMe, getMyTrips, updateMe, clearToken, type User, type Trip } from "@/lib/api";

/* ─── Types ─── */
type SheetType = "name" | "email" | "phone" | "payment" | "qr" | "language" | "help";

/* ─── Constants ─── */
const IC = "#767168";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatThaiPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)]
    .filter(Boolean)
    .join("-");
}

function isPhoneLikeDigits(digits: string): boolean {
  return digits.startsWith("0") && digits.length <= 10;
}

function formatThaiId(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 13);
  return [digits.slice(0, 1), digits.slice(1, 5), digits.slice(5, 10), digits.slice(10, 12), digits.slice(12, 13)]
    .filter(Boolean)
    .join("-");
}

// PromptPay accepts either a phone number or a 13-digit national ID —
// format as a phone while under 10 digits, switch to ID grouping past that.
function formatPromptPayNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.length > 10 ? formatThaiId(digits) : formatThaiPhone(digits);
}

// Catch the case where a phone number was typed into the bank account
// field (some banks link transfers to a phone-linked PromptPay account)
// instead of forcing the generic bank account grouping onto it.
function formatBankAccountNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (isPhoneLikeDigits(digits)) return formatThaiPhone(digits);
  const d = digits.slice(0, 10);
  return [d.slice(0, 3), d.slice(3, 4), d.slice(4, 9), d.slice(9, 10)].filter(Boolean).join("-");
}

const FIELD_CONFIG = {
  name:  { label: "ชื่อที่แสดง",    placeholder: "ชื่อเล่น เช่น ฟ้า, ปอนด์", helper: "ชื่อนี้จะแสดงให้เพื่อร่วมทริปเห็น", inputMode: "text"    as const, type: "text"  },
  email: { label: "อีเมล",          placeholder: "อีเมลของคุณ",               helper: "ใช้สำหรับติดต่อและแจ้งเตือน",           inputMode: "email"   as const, type: "email" },
  phone: { label: "เบอร์โทร",       placeholder: "09X-XXX-XXXX",              helper: "เบอร์โทรศัพท์มือถือของคุณ",             inputMode: "tel"     as const, type: "tel"   },
} as const;

const BANKS = ["กสิกรไทย","กรุงเทพ","กรุงไทย","ไทยพาณิชย์","กรุงศรีอยุธยา","ทหารไทยธนชาต","ออมสิน","ธ.ก.ส.","อาคารสงเคราะห์"];

const LANGUAGES = [
  { id: "th", label: "ภาษาไทย", sub: "Thai" },
  { id: "en", label: "English",  sub: "อังกฤษ" },
];

const FAQ = [
  { q: "วิธีสร้างทริปใหม่",        a: "ไปที่หน้า 'จัดการทริป' แล้วกดปุ่ม 'สร้างทริปใหม่' ที่มุมขวาบน จากนั้นทำตามขั้นตอน 4 ขั้น ได้แก่ ตั้งชื่อ วันที่ สมาชิก และสกุลเงิน" },
  { q: "วิธีเชิญเพื่อนเข้าทริป",   a: "เปิดทริปที่ต้องการ แล้วกดปุ่ม 'เชิญ' หรือ 'แชร์ลิงก์' เพื่อนไม่จำเป็นต้องมีบัญชีก็เข้าร่วมได้ทันที" },
  { q: "วิธีบันทึกค่าใช้จ่าย",     a: "เข้าไปในทริป กดปุ่ม '+' เพื่อเพิ่มรายการ ระบุจำนวนเงิน หมวดหมู่ และผู้จ่าย ระบบจะคำนวณส่วนแบ่งให้อัตโนมัติ" },
  { q: "วิธีตั้งค่าพร้อมเพย์รับเงิน", a: "ไปที่ 'โปรไฟล์' → 'การชำระเงิน' → 'พร้อมเพย์ / บัญชีที่โอน' แล้วกรอกเบอร์โทรหรือเลขบัตรประชาชน" },
  { q: "ข้อมูลของฉันปลอดภัยไหม",   a: "ข้อมูลทั้งหมดเข้ารหัสด้วย TLS และจัดเก็บบนเซิร์ฟเวอร์ที่ได้มาตรฐาน เราไม่เปิดเผยข้อมูลให้บุคคลภายนอกในทุกกรณี" },
];

const CONTACTS = [
  { label: "อีเมล",      value: "support@gogun.app" },
  { label: "LINE",       value: "@gogunapp" },
  { label: "เวลาทำการ", value: "จ–ศ 9:00–18:00" },
];

const SHEET_TITLE: Record<SheetType, string> = {
  name:     "ชื่อที่แสดง",
  email:    "อีเมล",
  phone:    "เบอร์โทร",
  payment:  "พร้อมเพย์ / บัญชีที่โอน",
  qr:       "QR รับเงิน",
  language: "ภาษา",
  help:     "ช่วยเหลือ & ติดต่อ",
};

/* ─── SVG icons ─── */
function IconUser() {
  return <svg width="20" height="20" viewBox="0 0 15 15" fill="none"><path d="M4.0625 4.6875C4.0625 3.77582 4.42466 2.90148 5.06932 2.25682C5.71398 1.61216 6.58832 1.25 7.5 1.25C8.41168 1.25 9.28602 1.61216 9.93068 2.25682C10.5753 2.90148 10.9375 3.77582 10.9375 4.6875C10.9375 5.59918 10.5753 6.47352 9.93068 7.11818C9.28602 7.76284 8.41168 8.125 7.5 8.125C6.58832 8.125 5.71398 7.76284 5.06932 7.11818C4.42466 6.47352 4.0625 5.59918 4.0625 4.6875ZM1.875 11.875C1.875 11.0462 2.20424 10.2513 2.79029 9.66529C3.37634 9.07924 4.1712 8.75 5 8.75H10C10.8288 8.75 11.6237 9.07924 12.2097 9.66529C12.7958 10.2513 13.125 11.0462 13.125 11.875V13.75H1.875V11.875Z" fill={IC}/></svg>;
}
function IconEmail() {
  return <svg width="20" height="20" viewBox="0 0 15 15" fill="none"><path d="M12.5 5L7.5 8.125L2.5 5V3.75L7.5 6.875L12.5 3.75M12.5 2.5H2.5C1.80625 2.5 1.25 3.05625 1.25 3.75V11.25C1.25 11.5815 1.3817 11.8995 1.61612 12.1339C1.85054 12.3683 2.16848 12.5 2.5 12.5H12.5C12.8315 12.5 13.1495 12.3683 13.3839 12.1339C13.6183 11.8995 13.75 11.5815 13.75 11.25V3.75C13.75 3.41848 13.6183 3.10054 13.3839 2.86612C13.1495 2.6317 12.8315 2.5 12.5 2.5Z" fill={IC}/></svg>;
}
function IconPhone() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.68 14.91 16.08 14.82 16.43 14.94C17.55 15.31 18.76 15.51 20 15.51C20.55 15.51 21 15.96 21 16.51V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z" fill={IC}/></svg>;
}
function IconPayment() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke={IC} strokeWidth="1.5"/><path d="M2 10H22" stroke={IC} strokeWidth="1.5"/><rect x="5" y="13" width="4" height="2" rx="0.5" fill={IC}/></svg>;
}
function IconQR() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 11H11V3H3V11ZM5 5H9V9H5V5ZM3 21H11V13H3V21ZM5 15H9V19H5V15ZM13 3V11H21V3H13ZM19 9H15V5H19V9ZM13 13H15V15H13V13ZM15 15H17V17H15V15ZM13 17H15V19H13V17ZM17 17H19V19H17V17ZM19 19H21V21H19V19ZM15 19H17V21H15V19ZM17 13H19V15H17V13ZM19 15H21V17H19V15Z" fill={IC}/></svg>;
}
function IconBell() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke={IC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6981 21.5547 10.4458 21.3031 10.27 21" stroke={IC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function IconGlobe() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={IC} strokeWidth="1.5"/><path d="M12 3C12 3 9 7 9 12C9 17 12 21 12 21" stroke={IC} strokeWidth="1.5"/><path d="M12 3C12 3 15 7 15 12C15 17 12 21 12 21" stroke={IC} strokeWidth="1.5"/><path d="M3 12H21" stroke={IC} strokeWidth="1.5"/><path d="M4.5 7.5H19.5M4.5 16.5H19.5" stroke={IC} strokeWidth="1.5"/></svg>;
}
function IconHelp() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={IC} strokeWidth="1.5"/><path d="M9.5 9.5C9.5 8.12 10.62 7 12 7C13.38 7 14.5 8.12 14.5 9.5C14.5 10.88 13.38 12 12 12V13" stroke={IC} strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="16" r="0.75" fill={IC}/></svg>;
}
function IconLogout() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke={IC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 17L21 12L16 7" stroke={IC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12H9" stroke={IC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function ChevronLeft() {
  return <svg width="6" height="10" viewBox="0 0 6 10" fill="none"><path d="M5 1L1 5L5 9" stroke={IC} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function ChevronRight() {
  return <svg width="6" height="10" viewBox="0 0 6 10" fill="none"><path d="M1 1L5 5L1 9" stroke={IC} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function ChevronDown({ up }: { up?: boolean }) {
  return <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d={up ? "M1 5L5 1L9 5" : "M1 1L5 5L9 1"} stroke="#767168" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function ChevronAccordion({ up }: { up: boolean }) {
  return <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="shrink-0"><path d={up ? "M1 5L5 1L9 5" : "M1 1L5 5L9 1"} stroke="#767168" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function ClearIcon() {
  return <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><circle cx="13" cy="13" r="13" fill="#d4cfc2"/><path d="M9.5 9.5L16.5 16.5M16.5 9.5L9.5 16.5" stroke="#767168" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function Checkmark() {
  return <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M1 6L6 11L15 1" stroke="#e85a2c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function UploadIcon() {
  return <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><path d="M20 26V14M14 20l6-6 6 6" stroke="#b5b0a4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 30h16" stroke="#b5b0a4" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}

/* ─── Shared sub-components ─── */
function UnderlineInput({ value, onChange, placeholder, type = "text", inputMode, autoFocus, maxLength }: {
  value: string; onChange: (v: string) => void; placeholder: string;
  type?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; autoFocus?: boolean; maxLength?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className={`border-b pb-[15px] pt-[14px] ${focused || value ? "border-[#e85a2c]" : "border-[#e5e1d7]"}`}>
      <input
        autoFocus={autoFocus}
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="w-full bg-transparent text-[17px] text-[#14110d] outline-none placeholder:text-[#b5b0a4]"
      />
    </div>
  );
}

/* ─── Sheet content components ─── */
function FieldContent({ field, value, onChange, error }: {
  field: "name" | "email" | "phone";
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const config = FIELD_CONFIG[field];
  return (
    <div className="flex flex-col gap-[10px] px-[24px] pb-[48px] pt-[24px]">
      <p className="text-[12px] tracking-[0.08px] text-[#767168]">{config.label}</p>
      <div className="relative flex items-center">
        <input
          autoFocus
          type={config.type}
          inputMode={config.inputMode}
          maxLength={field === "phone" ? 12 : undefined}
          value={value}
          onChange={(e) => onChange(field === "phone" ? formatThaiPhone(e.target.value) : e.target.value)}
          placeholder={config.placeholder}
          className={`h-[55px] w-full border-b bg-transparent pb-[15px] pt-[14px] text-[17px] text-[#14110d] outline-none placeholder:text-[#b5b0a4] ${
            value ? "border-[#e85a2c]" : "border-[#e5e1d7]"
          }`}
        />
        {value && (
          <button type="button" onClick={() => onChange("")} className="absolute right-0 shrink-0" aria-label="ลบ">
            <ClearIcon />
          </button>
        )}
      </div>
      {error ? (
        <p className="text-[12px] tracking-[0.08px] text-red-500">{error}</p>
      ) : (
        <p className="text-[12px] tracking-[0.08px] text-[#767168]">{config.helper}</p>
      )}
    </div>
  );
}

function PaymentContent() {
  const [mode, setMode] = useState<"promptpay" | "bank">("promptpay");
  const [number, setNumber] = useState("");
  const [bank, setBank] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [bankOpen, setBankOpen] = useState(false);

  return (
    <div className="flex flex-col gap-[24px] px-[24px] pb-[48px] pt-[24px]">
      <div className="flex rounded-[14px] border border-[#e5e1d7] bg-white p-[4px]">
        <button type="button" onClick={() => setMode("promptpay")} className={`flex-1 rounded-[10px] py-[10px] text-[13px] font-medium transition-colors ${mode === "promptpay" ? "bg-[#14110d] text-white" : "text-[#767168]"}`}>พร้อมเพย์</button>
        <button type="button" onClick={() => setMode("bank")}      className={`flex-1 rounded-[10px] py-[10px] text-[13px] font-medium transition-colors ${mode === "bank"      ? "bg-[#14110d] text-white" : "text-[#767168]"}`}>บัญชีธนาคาร</button>
      </div>

      {mode === "promptpay" ? (
        <div className="flex flex-col gap-[10px]">
          <p className="text-[12px] tracking-[0.08px] text-[#767168]">หมายเลขพร้อมเพย์</p>
          <UnderlineInput
            value={number}
            onChange={(v) => setNumber(formatPromptPayNumber(v))}
            placeholder="เบอร์โทร หรือหมายเลขบัตรประชาชน"
            inputMode="numeric"
            maxLength={17}
          />
          <p className="text-[12px] tracking-[0.08px] text-[#767168]">เบอร์โทร หรือหมายเลขบัตรประชาชน 13 หลัก</p>
        </div>
      ) : (
        <div className="flex flex-col gap-[20px]">
          <div className="flex flex-col gap-[10px]">
            <p className="text-[12px] tracking-[0.08px] text-[#767168]">ธนาคาร</p>
            <button type="button" onClick={() => setBankOpen((o) => !o)} className={`flex items-center justify-between border-b pb-[15px] pt-[14px] ${bankOpen ? "border-[#e85a2c]" : "border-[#e5e1d7]"}`}>
              <span className={`text-[17px] ${bank ? "text-[#14110d]" : "text-[#b5b0a4]"}`}>{bank || "เลือกธนาคาร"}</span>
              <ChevronDown up={bankOpen} />
            </button>
            {bankOpen && (
              <div className="overflow-hidden rounded-[14px] border border-[#e5e1d7] bg-white">
                {BANKS.map((b, i) => (
                  <button key={b} type="button" onClick={() => { setBank(b); setBankOpen(false); }} className={`flex w-full items-center justify-between px-[16px] py-[13px] text-[14px] text-[#14110d] ${i < BANKS.length - 1 ? "border-b border-[#e5e1d7]" : ""}`}>
                    {b}
                    {bank === b && <Checkmark />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-[10px]">
            <p className="text-[12px] tracking-[0.08px] text-[#767168]">เลขบัญชี</p>
            <UnderlineInput
              value={accountNo}
              onChange={(v) => setAccountNo(formatBankAccountNumber(v))}
              placeholder="XXX-X-XXXXX-X"
              inputMode="numeric"
              maxLength={13}
            />
            <p className="text-[12px] tracking-[0.08px] text-[#767168]">เลขบัญชีธนาคารของคุณ</p>
          </div>
        </div>
      )}
    </div>
  );
}

function QRContent() {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  return (
    <div className="flex flex-col items-center gap-[24px] px-[24px] pb-[48px] pt-[40px]">
      <button type="button" onClick={() => inputRef.current?.click()} className="relative flex h-[220px] w-[220px] items-center justify-center overflow-hidden rounded-[24px] border-2 border-dashed border-[#d4cfc2] bg-white">
        {preview ? (
          <img src={preview} alt="QR Code" className="size-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-[10px]">
            <UploadIcon />
            <p className="text-[13px] tracking-[0.08px] text-[#b5b0a4]">แตะเพื่ออัปโหลด QR</p>
          </div>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {preview && (
        <button type="button" onClick={() => { setPreview(null); if (inputRef.current) inputRef.current.value = ""; }} className="rounded-[10px] border border-[#e5e1d7] bg-white px-[20px] py-[10px] text-[13px] tracking-[0.08px] text-[#767168]">
          เปลี่ยนรูป QR
        </button>
      )}
      <p className="text-center text-[12px] leading-[1.6] tracking-[0.08px] text-[#767168]">
        อัปโหลด QR Code พร้อมเพย์ของคุณ<br />เพื่อให้เพื่อนร่วมทริปสแกนโอนเงิน
      </p>
    </div>
  );
}

function LanguageContent() {
  const [selected, setSelected] = useState("th");
  return (
    <div className="flex flex-col gap-[10px] px-[24px] pb-[48px] pt-[24px]">
      <p className="text-[12px] tracking-[0.08px] text-[#767168]">เลือกภาษา</p>
      <div className="overflow-hidden rounded-[16px] border border-[#e5e1d7] bg-white">
        {LANGUAGES.map((lang, i) => (
          <button key={lang.id} type="button" onClick={() => setSelected(lang.id)} className={`flex w-full items-center justify-between px-[16px] py-[16px] ${i < LANGUAGES.length - 1 ? "border-b border-[#e5e1d7]" : ""}`}>
            <div className="flex flex-col items-start gap-[3px]">
              <span className="text-[14px] font-medium tracking-[0.08px] text-[#14110d]">{lang.label}</span>
              <span className="text-[11px] font-light tracking-[0.08px] text-[#767168]">{lang.sub}</span>
            </div>
            {selected === lang.id && <Checkmark />}
          </button>
        ))}
      </div>
    </div>
  );
}

function HelpContent() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-[24px] px-[24px] pb-[48px] pt-[24px]">
      <div className="flex flex-col gap-[8px]">
        <p className="text-[11px] uppercase tracking-[0.08px] text-[#767168]">คำถามที่พบบ่อย</p>
        <div className="overflow-hidden rounded-[16px] border border-[#e5e1d7] bg-white">
          {FAQ.map((item, i) => (
            <div key={i} className={i < FAQ.length - 1 ? "border-b border-[#e5e1d7]" : ""}>
              <button type="button" onClick={() => setOpenIndex((p) => (p === i ? null : i))} className="flex w-full items-center justify-between gap-[12px] px-[16px] py-[14px] text-left">
                <span className="text-[14px] font-medium tracking-[0.08px] text-[#14110d]">{item.q}</span>
                <ChevronAccordion up={openIndex === i} />
              </button>
              {openIndex === i && (
                <div className="bg-[#f7f5f0] px-[16px] pb-[16px] pt-[4px]">
                  <p className="text-[13px] font-light leading-[1.7] tracking-[0.08px] text-[#767168]">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-[8px]">
        <p className="text-[11px] uppercase tracking-[0.08px] text-[#767168]">ช่องทางติดต่อ</p>
        <div className="overflow-hidden rounded-[16px] border border-[#e5e1d7] bg-white">
          {CONTACTS.map((c, i) => (
            <div key={i} className={`flex items-center justify-between px-[16px] py-[14px] ${i < CONTACTS.length - 1 ? "border-b border-[#e5e1d7]" : ""}`}>
              <span className="text-[13px] font-light tracking-[0.08px] text-[#767168]">{c.label}</span>
              <span className="text-[13px] font-medium tracking-[0.08px] text-[#14110d]">{c.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Profile sheet with slide-up animation ─── */
function ProfileSheet({ sheet, open, onClose, fieldValue, onFieldChange, onSave, saving, error }: {
  sheet: SheetType | null; open: boolean; onClose: () => void;
  fieldValue: string; onFieldChange: (v: string) => void;
  onSave: () => void; saving: boolean; error: string;
}) {
  const isHelp = sheet === "help";
  const isField = sheet === "name" || sheet === "email" || sheet === "phone";
  const emailFormatError =
    sheet === "email" && fieldValue.trim() && !EMAIL_REGEX.test(fieldValue.trim())
      ? "รูปแบบอีเมลไม่ถูกต้อง เช่น name@email.com"
      : "";
  const canSave =
    !saving &&
    (sheet === "name" || sheet === "email" ? fieldValue.trim().length > 0 : true) &&
    !emailFormatError;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-1/2 z-50 flex max-h-[90vh] min-h-[50vh] w-full max-w-[430px] -translate-x-1/2 flex-col overflow-y-auto rounded-t-[25px] bg-[#f7f5f0] transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Drag handle */}
        <div className="flex shrink-0 justify-center pb-[2px] pt-[10px]">
          <div className="h-[4px] w-[36px] rounded-full bg-[#d4cfc2]" />
        </div>

        {/* Nav bar */}
        <div className="flex h-[49px] shrink-0 items-center justify-between border-b border-[#e5e1d7]/50 px-[24px]">
          <button type="button" onClick={onClose} className="py-[1.5px] text-[12px] tracking-[0.08px] text-[#767168]">
            {isHelp ? "กลับ" : "ยกเลิก"}
          </button>
          <p className="text-[15px] font-medium tracking-[0.08px] text-[#14110d]">
            {sheet ? SHEET_TITLE[sheet] : ""}
          </p>
          {isHelp || !isField ? (
            <span className="w-[40px]" />
          ) : (
            <button
              type="button"
              onClick={onSave}
              disabled={!canSave}
              className="py-[1.5px] text-[12px] font-medium tracking-[0.08px] text-[#e85a2c] disabled:opacity-40"
            >
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          )}
        </div>

        {/* Content */}
        {sheet === "name"  && <FieldContent field="name"  value={fieldValue} onChange={onFieldChange} error={error} />}
        {sheet === "email" && <FieldContent field="email" value={fieldValue} onChange={onFieldChange} error={error || emailFormatError} />}
        {sheet === "phone" && <FieldContent field="phone" value={fieldValue} onChange={onFieldChange} error={error} />}
        {sheet === "payment"  && <PaymentContent />}
        {sheet === "qr"       && <QRContent />}
        {sheet === "language" && <LanguageContent />}
        {sheet === "help"     && <HelpContent />}
      </div>
    </>
  );
}

/* ─── Page layout components ─── */
function SettingRow({ icon, label, sublabel, value, onClick, children, divider = true }: {
  icon: React.ReactNode; label: string; sublabel?: string; value?: string;
  onClick?: () => void; children?: React.ReactNode; divider?: boolean;
}) {
  const inner = (
    <>
      <div className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] bg-[#f2efe8]">{icon}</div>
      {sublabel ? (
        <div className="flex flex-1 flex-col gap-[1px]">
          <span className="text-[14px] tracking-[0.08px] text-[#14110d]">{label}</span>
          <span className="text-[11px] font-light tracking-[0.08px] text-[#767168]">{sublabel}</span>
        </div>
      ) : (
        <span className="flex-1 text-[14px] tracking-[0.08px] text-[#14110d]">{label}</span>
      )}
      {children ?? (
        <>
          {value && <span className="text-[13px] font-light tracking-[0.08px] text-[#767168]">{value}</span>}
          <ChevronRight />
        </>
      )}
    </>
  );

  const cls = `flex items-center gap-[12px] px-[16px] py-[13px] ${divider ? "border-b border-[#e5e1d7]" : ""}`;
  if (onClick) return <button type="button" onClick={onClick} className={`w-full text-left ${cls}`}>{inner}</button>;
  return <div className={cls}>{inner}</div>;
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[16px] border border-[#e5e1d7] bg-white">
      <div className="bg-[#f2efe8] px-[16px] pb-[6px] pt-[12px]">
        <p className="text-[10.5px] font-light uppercase text-[#767168]">{title}</p>
      </div>
      {children}
    </div>
  );
}

/* ─── Page ─── */
export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSheet, setActiveSheet] = useState<SheetType | null>(null);
  const [displaySheet, setDisplaySheet] = useState<SheetType | null>(null);
  const [fieldValue, setFieldValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    Promise.all([getMe(), getMyTrips()])
      .then(([me, myTrips]) => {
        setUser(me);
        setTrips(myTrips);
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  function openSheet(s: SheetType) {
    if (s === "name") setFieldValue(user?.display_name ?? "");
    if (s === "email") setFieldValue(user?.email ?? "");
    if (s === "phone") setFieldValue(formatThaiPhone(user?.phone ?? ""));
    setSaveError("");
    setDisplaySheet(s);
    setActiveSheet(s);
  }

  function closeSheet() {
    setActiveSheet(null);
    setTimeout(() => setDisplaySheet(null), 300);
  }

  async function handleSaveField() {
    if (!displaySheet || saving) return;
    const key =
      displaySheet === "name" ? "display_name" :
      displaySheet === "email" ? "email" :
      displaySheet === "phone" ? "phone" : null;
    if (!key) return;

    setSaving(true);
    setSaveError("");
    try {
      const updated = await updateMe({ [key]: fieldValue.trim() });
      setUser(updated);
      closeSheet();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    clearToken();
    router.replace("/login");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0]">
        <p className="text-[#767168]">กำลังโหลด...</p>
      </main>
    );
  }

  const displayName = user?.display_name ?? "";
  const avatarColor = user?.avatar_color ?? "#c0613e";
  const email = user?.email ?? "";

  const tripsOrganized = trips.filter((t) => t.organizer_id === user?.id).length;
  const tripsTotal = trips.length;
  const countries = new Set(trips.map((t) => t.destination)).size;

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="w-full max-w-[430px] pb-[96px]">
        <div className="flex flex-col gap-[24px] px-[24px] pb-[30px] pt-[24px]">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[7px]">
              <img src="/images/logo.svg" alt="" className="size-[19px]" />
              <span className="text-[11px] tracking-[0.08px] text-[#767168]">GOGUN</span>
              <span className="text-[13px] font-medium tracking-[0.08px] text-[#14110d]">ไปกัน</span>
            </div>
            <div className="flex h-[33px] items-center gap-[8px] rounded-[48px] border border-[#edeae2] bg-white p-[7px]">
              <div className="flex size-[22px] items-center justify-center rounded-full text-[12px] font-medium text-white" style={{ backgroundColor: avatarColor }}>
                {displayName.slice(0, 1)}
              </div>
              <span className="text-[12px] font-medium tracking-[0.08px] text-[#14110d]">{displayName}</span>
            </div>
          </div>

          {/* Title */}
          <div className="pb-[4px]">
            <h1 className="text-[22px] font-medium tracking-[0.08px] text-[#14110d]">โปรไฟล์</h1>
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center gap-[10px]">
            <div className="flex size-[75px] items-center justify-center rounded-full text-[20px] font-medium text-white" style={{ backgroundColor: avatarColor }}>
              {displayName.slice(0, 2)}
            </div>
            <p className="text-[15px] font-medium tracking-[0.08px] text-[#14110d]">{displayName}</p>
            <p className="text-[10.5px] uppercase text-[#767168]">จัดทริป</p>
          </div>

          {/* Stats */}
          <div className="flex items-center rounded-[18px] border border-[#e5e1d7] bg-white p-[10px]">
            <div className="flex flex-1 flex-col items-center gap-[5px]">
              <p className="text-[20px] font-medium tracking-[0.08px] text-[#14110d]">{tripsOrganized}</p>
              <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">ทริปที่จัด</p>
            </div>
            <div className="h-[48px] w-px bg-[#e5e1d7]" />
            <div className="flex flex-1 flex-col items-center gap-[5px]">
              <p className="text-[20px] font-medium tracking-[0.08px] text-[#14110d]">{tripsTotal}</p>
              <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">ทริปทั้งหมด</p>
            </div>
            <div className="h-[48px] w-px bg-[#e5e1d7]" />
            <div className="flex flex-1 flex-col items-center gap-[5px]">
              <p className="text-[20px] font-medium tracking-[0.08px] text-[#14110d]">{countries}</p>
              <p className="text-[12px] font-light tracking-[0.08px] text-[#767168]">ประเทศ</p>
            </div>
          </div>

          {/* Guest nudge — link an email to lock this name */}
          {user?.is_guest && (
            <button
              type="button"
              onClick={() => router.push("/link-account?returnTo=/profile")}
              className="flex items-center gap-[12px] rounded-[18px] border border-[#f3d9cc] bg-[#fdf3ee] px-[16px] py-[14px] text-left"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
                <rect x="3.5" y="9" width="13" height="8" rx="2.5" stroke="#e85a2c" strokeWidth="1.6" />
                <path d="M6.5 9V6.5a3.5 3.5 0 0 1 6.93-.7" stroke="#e85a2c" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="10" cy="13" r="1.2" fill="#e85a2c" />
              </svg>
              <span className="flex flex-1 flex-col gap-[2px]">
                <span className="text-[13px] font-medium tracking-[0.08px] text-[#14110d]">
                  บันทึกบัญชีนี้ไว้ด้วยการเชื่อมอีเมล
                </span>
                <span className="text-[11px] font-light leading-[1.5] tracking-[0.08px] text-[#767168]">
                  ชื่อ {displayName} ยังไม่ล็อก ใครมีลิงก์ทริปก็เข้าได้ จนกว่าจะเชื่อมอีเมล
                </span>
              </span>
              <svg width="7" height="12" viewBox="0 0 7 12" fill="none" className="shrink-0">
                <path d="M1 1l5 5-5 5" stroke="#e85a2c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          {/* Personal info */}
          <SectionCard title="ข้อมูลส่วนตัว">
            <SettingRow icon={<IconUser />}  label="ชื่อที่แสดง" value={displayName} onClick={() => openSheet("name")} />
            {user?.is_guest ? (
              <SettingRow icon={<IconEmail />} label="อีเมล" value="ยังไม่เชื่อม" onClick={() => router.push("/link-account?returnTo=/profile")} />
            ) : (
              <SettingRow icon={<IconEmail />} label="อีเมล" value={email} onClick={() => openSheet("email")} />
            )}
            <SettingRow icon={<IconPhone />} label="เบอร์โทร"    value={user?.phone ? formatThaiPhone(user.phone) : "—"} onClick={() => openSheet("phone")} divider={false} />
          </SectionCard>

          {/* Payment */}
          <SectionCard title="การชำระเงิน">
            <SettingRow icon={<IconPayment />} label="พร้อมเพย์ / บัญชีที่โอน" value="ตั้งค่าแล้ว" onClick={() => openSheet("payment")} />
            <SettingRow icon={<IconQR />}      label="QR รับเงิน"                value="ดู"          onClick={() => openSheet("qr")} divider={false} />
          </SectionCard>

          {/* Settings */}
          <SectionCard title="การตั้งค่า">
            <div className="flex items-center gap-[12px] border-b border-[#e5e1d7] px-[16px] py-[13px]">
              <div className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] bg-[#f2efe8]"><IconBell /></div>
              <div className="flex flex-1 flex-col gap-[1px]">
                <span className="text-[14px] tracking-[0.08px] text-[#14110d]">การแจ้งเตือน</span>
                <span className="text-[11px] font-light tracking-[0.08px] text-[#767168]">เปิดแจ้งเตือนทุกทริป</span>
              </div>
              <NotificationToggle />
            </div>
            <SettingRow icon={<IconGlobe />}  label="ภาษา"              value="ไทย" onClick={() => openSheet("language")} />
            <SettingRow icon={<IconHelp />}   label="ช่วยเหลือ & ติดต่อ" value="ดู"  onClick={() => openSheet("help")} />
            <SettingRow icon={<IconLogout />} label="ออกจากระบบ" onClick={handleLogout} divider={false}>
              <span />
            </SettingRow>
          </SectionCard>

        </div>
      </div>

      <BottomNav active="profile" />

      <ProfileSheet
        sheet={displaySheet}
        open={activeSheet !== null}
        onClose={closeSheet}
        fieldValue={fieldValue}
        onFieldChange={setFieldValue}
        onSave={handleSaveField}
        saving={saving}
        error={saveError}
      />
    </main>
  );
}
