import { Kanit, Wix_Madefor_Display } from "next/font/google";

export const kanit = Kanit({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600"],
});

export const wixMadeforDisplay = Wix_Madefor_Display({
  subsets: ["latin"],
});
