import Link from "next/link";
import { wixMadeforDisplay } from "@/lib/fonts";

type TextFieldProps = {
  id: string;
  label: string;
  icon: string;
  placeholder?: string;
  type?: string;
};

export function TextField({
  id,
  label,
  icon,
  placeholder,
  type = "text",
}: TextFieldProps) {
  return (
    <div className="flex w-full flex-col gap-[5px]">
      <label htmlFor={id} className="text-[13px] font-light text-[#14110d]">
        {label}
      </label>
      <div className="flex h-[33px] w-full items-center gap-[10px] rounded-[6px] bg-white p-[10px]">
        <img src={icon} alt="" className="size-[15px]" />
        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          className="w-full bg-transparent text-[11px] font-semibold text-[#14110d] placeholder:text-[#b5b0a4] focus:outline-none"
        />
      </div>
    </div>
  );
}

export function PasswordField({
  id,
  label,
  placeholder,
}: {
  id: string;
  label: string;
  placeholder?: string;
}) {
  return (
    <div className="flex w-full flex-col gap-[5px]">
      <label htmlFor={id} className="text-[13px] font-light text-[#14110d]">
        {label}
      </label>
      <div className="flex h-[33px] w-full items-center justify-between rounded-[6px] bg-white p-[10px]">
        <div className="flex items-center gap-[10px]">
          <img src="/images/icon-lock.svg" alt="" className="size-[15px]" />
          <input
            id={id}
            name={id}
            type="password"
            placeholder={placeholder}
            className="w-full bg-transparent text-[11px] font-semibold text-[#14110d] placeholder:text-[#b5b0a4] focus:outline-none"
          />
        </div>
        <img src="/images/icon-eye-off.svg" alt="" className="size-[15px]" />
      </div>
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-[7px]">
      <span className="h-px w-[98px] bg-[#121333]" />
      <span
        className={`${wixMadeforDisplay.className} text-[11px] font-semibold text-[#121333]`}
      >
        or
      </span>
      <span className="h-px w-[98px] bg-[#121333]" />
    </div>
  );
}

export function SubmitButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className={`${wixMadeforDisplay.className} flex h-[33px] w-full items-center justify-center rounded-[43px] bg-[#e85a2c] text-[11px] font-bold text-white`}
    >
      {children}
    </button>
  );
}

export function SocialIconButton({
  icon,
  label,
}: {
  icon: string;
  label: string;
}) {
  return (
    <a
      href="#"
      aria-label={label}
      className="flex size-[42px] items-center justify-center rounded-[21px] bg-[#e85a2c]"
    >
      <img src={icon} alt="" className="size-[27px]" />
    </a>
  );
}

export function FooterLink({
  text,
  linkText,
  href,
}: {
  text: string;
  linkText: string;
  href: string;
}) {
  return (
    <p className={`${wixMadeforDisplay.className} flex gap-[5px] text-[11px]`}>
      <span className="font-semibold text-[#121333]">{text}</span>
      <Link href={href} className="font-extrabold text-[#e85a2c] underline">
        {linkText}
      </Link>
    </p>
  );
}
