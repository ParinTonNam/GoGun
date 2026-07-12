import Link from "next/link";

type Tab = "trips" | "recommend" | "profile";

function IconTrips({ color }: { color: string }) {
  return (
    <svg className="block" width="15" height="14.5" viewBox="0 0 15 14.5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.5 14H0.5V5.5V0.5H14.5V5.5V14Z" stroke={color} />
      <path d="M5.5 5.5H2.5V3.61111V2.5H5.5V3.61111V5.5Z" stroke={color} />
      <path d="M2 8.5H13" stroke={color} strokeWidth="0.9" />
      <path d="M7.83301 2.5L12.833 2.5" stroke={color} strokeWidth="0.9" />
      <path d="M7.83301 5.5L12.833 5.5" stroke={color} strokeWidth="0.9" />
      <path d="M2 11.5H13" stroke={color} strokeWidth="0.9" />
    </svg>
  );
}

function IconRecommend({ color }: { color: string }) {
  return (
    <svg className="block" width="16" height="15" viewBox="0 0 19.1256 18.1242" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0.5 5.5V0.5H14.5V5.5M0.5 5.5V14H10M0.5 5.5H14.5M14.5 5.5V8.5" stroke={color} />
      <path d="M4.5 5.5V9M10.5 5.5V8.5" stroke={color} />
      <path d="M12.7014 7.5C13.4807 7.50019 14.2446 7.71722 14.9077 8.12679C15.5707 8.53637 16.1067 9.12234 16.4557 9.81915C16.8047 10.516 16.9529 11.2961 16.8838 12.0724C16.8147 12.8487 16.531 13.5904 16.0644 14.2146L19.1256 17.2758L18.2772 18.1242L15.216 15.063C14.6832 15.4616 14.0634 15.7279 13.4076 15.84C12.7518 15.9521 12.0787 15.9067 11.4438 15.7077C10.8089 15.5087 10.2304 15.1617 9.75586 14.6953C9.28135 14.2289 8.92444 13.6565 8.71452 13.0251C8.5046 12.3938 8.44768 11.7216 8.54845 11.0639C8.64922 10.4062 8.9048 9.7819 9.29413 9.24235C9.68346 8.70281 10.1954 8.26348 10.7878 7.96056C11.3802 7.65763 12.0361 7.49978 12.7014 7.5ZM12.7014 8.7C11.9057 8.7 11.1427 9.01607 10.5801 9.57868C10.0175 10.1413 9.7014 10.9044 9.7014 11.7C9.7014 12.4956 10.0175 13.2587 10.5801 13.8213C11.1427 14.3839 11.9057 14.7 12.7014 14.7C13.497 14.7 14.2601 14.3839 14.8227 13.8213C15.3853 13.2587 15.7014 12.4956 15.7014 11.7C15.7014 10.9044 15.3853 10.1413 14.8227 9.57868C14.2601 9.01607 13.497 8.7 12.7014 8.7Z" fill={color} />
    </svg>
  );
}

function IconProfile({ color }: { color: string }) {
  return (
    <svg className="block" width="14" height="17" viewBox="0 0 13.3085 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.73119 7.26923C9.73119 8.08528 9.40701 8.86791 8.82998 9.44495C8.25294 10.022 7.47032 10.3462 6.65427 10.3462C5.83822 10.3462 5.05559 10.022 4.47855 9.44495C3.90152 8.86791 3.57734 8.08528 3.57734 7.26923M11.2838 16.4938H2.0315C1.10657 16.4938 0.392729 15.796 0.513959 14.8791L0.584113 14.3443C0.711498 13.6058 1.38719 13.1412 2.12073 12.9818L6.60996 12.1923H6.69857L11.1878 12.9818C11.9337 13.1542 12.597 13.5929 12.7244 14.3443L12.7946 14.8858C12.9158 15.8028 12.202 16.5 11.277 16.5L11.2838 16.4938Z" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.13164 4.65385L2.13795 5.44862C2.08805 5.48877 2.04777 5.53957 2.02006 5.59731C1.99235 5.65505 1.97791 5.71826 1.9778 5.78231C1.97682 5.85945 1.99783 5.93527 2.03837 6.0009C2.07891 6.06654 2.13731 6.11927 2.20672 6.15292C3.26549 6.64769 4.83749 6.96154 6.59318 6.96154C8.34888 6.96154 9.92134 6.64769 10.9792 6.15292C11.0487 6.11933 11.1072 6.06663 11.1478 6.00099C11.1884 5.93535 11.2095 5.8595 11.2086 5.78231C11.2085 5.71826 11.194 5.65505 11.1663 5.59731C11.1386 5.53957 11.0983 5.48877 11.0484 5.44862L10.0547 4.65385" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.13161 2.80769H7.05469M6.59315 5.11539C8.00869 5.11539 9.26546 4.934 10.0547 4.65385L9.86684 2.96323C9.73669 1.79185 9.67161 1.20569 9.27746 0.853078C8.88238 0.500001 8.29346 0.500001 7.11469 0.500001H6.07161C4.89284 0.500001 4.30346 0.500001 3.90884 0.853078C3.51469 1.20569 3.44961 1.79185 3.31946 2.96323L3.13161 4.65385C3.92084 4.934 5.17761 5.11539 6.59315 5.11539Z" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BottomNav({ active }: { active: Tab }) {
  const ACTIVE_ICON_COLOR = "#e85a2c";
  const INACTIVE_ICON_COLOR = "#6e6a62";

  const tabs: Array<{
    id: Tab;
    href: string;
    label: string;
    Icon: React.ComponentType<{ color: string }>;
  }> = [
    { id: "trips",     href: "/trips",     label: "จัดการทริป", Icon: IconTrips },
    { id: "recommend", href: "/recommend", label: "แนะนำทริป",  Icon: IconRecommend },
    { id: "profile",   href: "/profile",   label: "โปรไฟล์",    Icon: IconProfile },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50">
      <div className="mx-[13px] flex h-[62px] items-start justify-center rounded-[18px] border border-[#d4cfc2] bg-white pt-[8px]">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          const iconColor = isActive ? ACTIVE_ICON_COLOR : INACTIVE_ICON_COLOR;
          return (
            <Link key={tab.id} href={tab.href} className="flex flex-1 flex-col items-center gap-[3px]">
              <div className="flex size-[20px] shrink-0 items-center justify-center">
                <tab.Icon color={iconColor} />
              </div>
              <div className="flex flex-col items-center">
                <span className={`text-[10px] tracking-[0.08px] ${isActive ? "font-medium text-[#14110d]" : "font-light text-[#767168]"}`}>
                  {tab.label}
                </span>
                {isActive && <div className="mt-[2px] size-[3px] rounded-full bg-[#e85a2c]" />}
              </div>
            </Link>
          );
        })}
      </div>
      <div className="flex justify-center py-[8px]">
        <div className="h-[5px] w-[139px] rounded-full bg-black/25" />
      </div>
    </div>
  );
}
