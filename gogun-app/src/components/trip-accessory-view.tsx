"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTripWorkspace } from "@/components/trip-workspace";
import {
  HomeBottomNav,
  MaewDropdown,
  MaewTopbar,
  TripTicketSelector,
  getCatAvatarUrl,
} from "@/components/trip-ticket-selector";
import {
  addChecklistItem,
  addWheelOption,
  checkItem,
  clearWheel,
  closeQuest,
  createPoll,
  createQuest,
  deleteChecklistItem,
  deleteWheelOption,
  getChecklist,
  getPolls,
  getQuests,
  getWheel,
  setQuestProgress,
  uncheckItem,
  unvote,
  updateChecklistItem,
  updatePoll,
  vote,
  type ChecklistItem,
  type Poll,
  type Quest,
  type User,
  type WheelOption,
} from "@/lib/api";

export type AccessoryTabId = "event" | "wheel" | "vote" | "checklist";

function VoteAvatarStack({
  voters,
}: {
  voters: Pick<User, "id" | "display_name" | "avatar_color">[];
}) {
  if (!voters || voters.length === 0) return null;
  const STEP = 12;
  const totalW = 16 + (voters.length - 1) * STEP;
  return (
    <div style={{ position: "relative", height: 16, width: totalW, flexShrink: 0 }}>
      {voters.map((v, i) => (
        <div
          key={v.id || i}
          style={{
            position: "absolute",
            top: 0,
            left: i * STEP,
            width: 16,
            height: 16,
            borderRadius: 8,
            border: "0.8px solid #ffffff",
            backgroundColor: "#f2efe8",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
          }}
        >
          <img
            src={getCatAvatarUrl(v.display_name, i, v.avatar_color)}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      ))}
    </div>
  );
}

function OptionRemoveCrossIcon() {
  return (
    <div
      style={{
        width: 15.68,
        height: 15.68,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg
        width="11.09"
        height="11.09"
        viewBox="0 0 11.0865 11.0865"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ transform: "rotate(-45deg)", display: "block" }}
      >
        <path
          d="M6.33512 4.75134V0.791891C6.33512 0.581868 6.25169 0.380448 6.10319 0.231939C5.95468 0.0834312 5.75326 0 5.54323 0C5.33321 0 5.13179 0.0834312 4.98328 0.231939C4.83477 0.380448 4.75134 0.581868 4.75134 0.791891V4.75134H0.791891C0.581868 4.75134 0.380448 4.83477 0.231939 4.98328C0.0834312 5.13179 0 5.33321 0 5.54323C0 5.75326 0.0834312 5.95468 0.231939 6.10319C0.380448 6.25169 0.581868 6.33512 0.791891 6.33512H4.75134V10.2946C4.75134 10.5046 4.83477 10.706 4.98328 10.8545C5.13179 11.003 5.33321 11.0865 5.54323 11.0865C5.75326 11.0865 5.95468 11.003 6.10319 10.8545C6.25169 10.706 6.33512 10.5046 6.33512 10.2946V6.33512H10.2946C10.5046 6.33512 10.706 6.25169 10.8545 6.10319C11.003 5.95468 11.0865 5.75326 11.0865 5.54323C11.0865 5.33321 11.003 5.13179 10.8545 4.98328C10.706 4.83477 10.5046 4.75134 10.2946 4.75134H6.33512Z"
          fill="#767168"
        />
      </svg>
    </div>
  );
}

const WHEEL_OPTION_COLORS = [
  "#D96843",
  "#9875B5",
  "#D96843",
  "#5F8995",
  "#8DA45F",
  "#9875B5",
  "#DDA557",
  "#8BC0AA",
];

const CAT_TREAT_FLAVORS = [
  "#FF6880", // Pink
  "#87C334", // Lime Green
  "#389CE2", // Sky Blue
  "#F3B735", // Golden Yellow
  "#EB4D75", // Salmon Rose
  "#44CFE2", // Seafood Cyan
  "#965DE2", // Berry Purple
  "#F47B25", // Chicken Orange
];

const CAT_TREAT_SACHETS: Record<string, string> = {
  "#FF6880": "/images/cat-treat/pink.svg",
  "#87C334": "/images/cat-treat/green.svg",
  "#389CE2": "/images/cat-treat/blue.svg",
  "#F3B735": "/images/cat-treat/yellow.svg",
  "#EB4D75": "/images/cat-treat/rose.svg",
  "#44CFE2": "/images/cat-treat/cyan.svg",
  "#965DE2": "/images/cat-treat/purple.svg",
  "#F47B25": "/images/cat-treat/orange.svg",
};

const CAT_CUP_SLOTS: Array<{ x: number; y: number; rot: number }> = [
  { x: 40, y: 101, rot: 83.5 },
  { x: 60, y: 117, rot: 79.02 },
  { x: 84, y: 103, rot: 92.63 },
  { x: 108, y: 97, rot: 95.49 },
  { x: 96, y: 114, rot: 97.38 },
  { x: 122, y: 116, rot: 103.28 },
  { x: 152, y: 111, rot: 95.29 },
  { x: 176, y: 100, rot: 101.11 },
];

type CatTreatPhysicsBody = {
  id: string;
  x: number;
  y: number;
  rot: number;
  vx: number;
  vy: number;
  vRot: number;
  restX: number;
  restY: number;
  restRot: number;
  mode: "dropping" | "cup" | "dragging";
  bounces: number;
};

function getCatTreatSlot(idx: number): { x: number; y: number; rot: number } {
  const base = CAT_CUP_SLOTS[idx % CAT_CUP_SLOTS.length];
  const tier = Math.floor(idx / CAT_CUP_SLOTS.length);
  if (tier === 0) return base;
  const offset = (tier % 2 === 1 ? 1 : -1) * 7 * tier;
  return {
    x: Math.max(34, Math.min(186, base.x + offset)),
    y: base.y - Math.min(10, tier * 3),
    rot: base.rot + (tier % 2 === 1 ? 3.5 : -3.5),
  };
}

function CatTreatSachet({
  color,
  width,
  height,
}: {
  color: string;
  width: number;
  height: number;
}) {
  return (
    <img
      src={CAT_TREAT_SACHETS[color] ?? CAT_TREAT_SACHETS["#F47B25"]}
      alt=""
      width={width}
      height={height}
      aria-hidden="true"
      style={{ display: "block", width: "100%", height: "100%", pointerEvents: "none" }}
    />
  );
}

const WHEEL_SIZE = 229;
const WHEEL_R = WHEEL_SIZE / 2;

function wheelToRad(deg: number) {
  return ((deg - 90) * Math.PI) / 180;
}

function wheelSlicePath(startDeg: number, endDeg: number): string {
  const x1 = WHEEL_R + WHEEL_R * Math.cos(wheelToRad(startDeg));
  const y1 = WHEEL_R + WHEEL_R * Math.sin(wheelToRad(startDeg));
  const x2 = WHEEL_R + WHEEL_R * Math.cos(wheelToRad(endDeg));
  const y2 = WHEEL_R + WHEEL_R * Math.sin(wheelToRad(endDeg));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${WHEEL_R} ${WHEEL_R} L ${x1} ${y1} A ${WHEEL_R} ${WHEEL_R} 0 ${large} 1 ${x2} ${y2} Z`;
}

type EventPresetId = "color_hunting" | "photo_hunt_bingo";

type EventPresetConfig = {
  id: EventPresetId;
  title: string;
  shortDesc: string;
  detailDescription: string;
  challengeText: string;
  bannerImage: string;
  defaultFinishGridImage: string;
  targets: string[];
};

type ColorHuntColor = { name: string; hex: string; showCat?: boolean };

// The twelve color treatments in Figma 836:5064–836:5141 use one field image
// with a hue layer. The mint design is the background-only variant.
const COLOR_HUNT_PALETTE: ColorHuntColor[] = [
  { name: "แดง", hex: "#ff0000" },
  { name: "เขียว", hex: "#00ff22" },
  { name: "ส้ม", hex: "#ff4b00" },
  { name: "ฟ้า", hex: "#00ccff" },
  { name: "น้ำเงิน", hex: "#1a00ff" },
  { name: "ม่วง", hex: "#b700ff" },
  { name: "เขียวมะนาว", hex: "#bbff00" },
  { name: "เขียวมิ้นต์", hex: "#00ff99", showCat: false },
  { name: "ชมพู", hex: "#ff00a6" },
  { name: "ฟ้านีออน", hex: "#00fff6" },
  { name: "ชมพูเข้ม", hex: "#ff00d4" },
  { name: "เหลือง", hex: "#ffe500" },
];

const EVENT_PRESETS: EventPresetConfig[] = [
  {
    id: "color_hunting",
    title: "Color Hunting",
    shortDesc: "อีเวนท์ตามล่าหาสี ถ่ายรูปตามสีที่สุ่มได้",
    detailDescription:
      "เทรนด์ยอดนิยมในการเดินสำรวจสถานที่ต่าง ๆ เช่น ย่านเมืองหรือสวนสาธารณะ แล้วถ่ายภาพวัตถุหรือฉากที่มีสีตรงกับโจทย์ที่เลือกไว้",
    challengeText:
      "เหมียวเที่ยวจะกำหนดธีมสีที่ต้องการค้นหา แล้วให้ทุกคนไปออกล่า สิ่งต่าง ๆ รอบตัว เช่น ดอกไม้ ป้าย ประตูอาคาร หรือเสื้อผ้าผู้คน ถ่ายรูปเก็บไว้เพื่อนำมาจัดเรียงเป็น ตารางภาพ ทั้งหมด 9 รูป",
    bannerImage: "/images/figma-color-hunt-details-grid.png",
    defaultFinishGridImage: "/images/event-color-hunting-grid.png",
    targets: [
      "รูปที่ 1",
      "รูปที่ 2",
      "รูปที่ 3",
      "รูปที่ 4",
      "รูปที่ 5",
      "รูปที่ 6",
      "รูปที่ 7",
      "รูปที่ 8",
      "รูปที่ 9",
    ],
  },
  {
    id: "photo_hunt_bingo",
    title: "Photo Hunt Bingo",
    shortDesc: "ตามล่าหาของที่สุ่มให้",
    detailDescription:
      "สนุกไปกับการเดินสำรวจรอบๆ ทริปพร้อมเพื่อนๆ ค้นหาสิ่งของหรือแลนด์มาร์กตามโจทย์ที่สุ่มได้ แล้วถ่ายภาพเก็บให้ครบตาราง",
    challengeText:
      "เหมียวเที่ยวจะสุ่มโจทย์สิ่งของหรือสถานที่รอบตัว ให้ทุกคนถ่ายภาพตามโจทย์ที่ได้รับให้ครบทั้งหมด 9 รูป เพื่อเรียงเป็นตารางภาพสุดพิเศษประจำทริป",
    bannerImage: "/images/figma-color-hunt-details-grid.png",
    defaultFinishGridImage: "/images/event-color-hunting-grid.png",
    targets: [
      "โจทย์ที่ 1",
      "โจทย์ที่ 2",
      "โจทย์ที่ 3",
      "โจทย์ที่ 4",
      "โจทย์ที่ 5",
      "โจทย์ที่ 6",
      "โจทย์ที่ 7",
      "โจทย์ที่ 8",
      "โจทย์ที่ 9",
    ],
  },
];

const EVENT_FILTER_OPTIONS = [
  { value: "all", label: "ประเภท" },
  { value: "running", label: "กำลังดำเนิน" },
  { value: "not_started", label: "ยังไม่เริ่ม" },
];

function getSingleInitial(name?: string | null): string {
  const cleaned = (name ?? "").trim();
  if (!cleaned) return "ต";
  return cleaned.slice(0, 1);
}

function getAssignedColorForUser(userId: string, tripId: string): ColorHuntColor {
  // Stable across devices: the random user ID and trip ID pick one of the 12 colors.
  let hash = 0;
  const seed = `${tripId}:${userId}`;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return COLOR_HUNT_PALETTE[hash % COLOR_HUNT_PALETTE.length];
}

function PillChevronDown() {
  return (
    <svg width="7" height="4.083" viewBox="0 0 7 4.08333" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M4.02358 3.87638C3.88586 4.0089 3.69918 4.08333 3.50454 4.08333C3.3099 4.08333 3.12322 4.0089 2.9855 3.87638L0.215022 1.20804C0.0772995 1.07528 -4.58939e-05 0.89525 2.04302e-08 0.70755C4.59347e-05 0.519855 0.0774795 0.33986 0.215266 0.207168C0.353053 0.0744765 0.539905 -4.42176e-05 0.73472 1.9684e-08C0.929535 4.42569e-05 1.11635 0.0746495 1.25408 0.207404L3.50454 2.37567L5.755 0.207404C5.89345 0.078434 6.07895 0.00702055 6.27155 0.00854485C6.46415 0.0100691 6.6484 0.084409 6.78465 0.215554C6.92085 0.346698 6.9982 0.524155 6.99995 0.7097C7.00175 0.895245 6.9278 1.07404 6.79405 1.20756L4.02407 3.87685L4.02358 3.87638Z"
        fill="white"
      />
    </svg>
  );
}

function SheetCloseIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="18" cy="18" r="15.5" fill="#E5E1D7" stroke="#D9D9D9" />
      <path
        d="M17.8392 16.8801L15.0395 14.0803C14.8909 13.9319 14.6895 13.8484 14.4795 13.8484C14.2695 13.8484 14.0681 13.9319 13.9196 14.0803C13.7711 14.2289 13.6877 14.4302 13.6877 14.6402C13.6877 14.8503 13.7711 15.0517 13.9196 15.2002L16.7194 18.0001L13.9196 20.7998C13.7711 20.9483 13.6877 21.1497 13.6877 21.3598C13.6877 21.5698 13.7711 21.7712 13.9196 21.9197C14.0681 22.0681 14.2695 22.1516 14.4795 22.1516C14.6895 22.1516 14.8909 22.0681 15.0395 21.9197L17.8392 19.12L20.639 21.9197C20.7875 22.0681 20.9889 22.1516 21.1989 22.1516C21.409 22.1516 21.6104 22.0681 21.7589 21.9197C21.9074 21.7712 21.9908 21.5698 21.9908 21.3598C21.9908 21.1497 21.9074 20.9483 21.7589 20.7998L18.9591 18.0001L21.7589 15.2002C21.9074 15.0517 21.9908 14.8503 21.9908 14.6402C21.9908 14.4302 21.9074 14.2289 21.7589 14.0803C21.6104 13.9319 21.409 13.8484 21.1989 13.8484C20.9889 13.8484 20.7875 13.9319 20.639 14.0803L17.8392 16.8801Z"
        fill="#767168"
      />
    </svg>
  );
}

function AccessoryTabIcon({ tab, active }: { tab: AccessoryTabId; active: boolean }) {
  const color = active ? "#FFFFFF" : "#767168";
  if (tab === "event") {
    return (
      <span className="maew-accessory-tab-icon-box" aria-hidden="true">
        <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M6.53409 15.1514L6.53409 13.2575H18.1818L18.1818 15.1514H6.53409ZM6.53409 18.1817L6.53409 16.6666H16.2879L16.2879 18.1817H6.53409ZM5.85 21.875C5.37014 21.875 4.96979 21.7146 4.64896 21.3937C4.32812 21.0729 4.16736 20.6725 4.16667 20.1927V6.8906C4.16667 6.41143 4.32743 6.01143 4.64896 5.6906C4.97049 5.36977 5.37083 5.209 5.85 5.20831H7.69271V2.88539H8.81458V5.20831H16.2667V2.88539H17.3083V5.20831H19.151C19.6302 5.20831 20.0306 5.36907 20.3521 5.6906C20.6736 6.01213 20.834 6.41247 20.8333 6.89164V20.1927C20.8333 20.6718 20.6729 21.0722 20.3521 21.3937C20.0312 21.7153 19.6306 21.8757 19.15 21.875H5.85ZM5.85 20.8333H19.151C19.3108 20.8333 19.4576 20.7666 19.5917 20.6333C19.7257 20.5 19.7924 20.3528 19.7917 20.1916V11.0583H5.20833V20.1927C5.20833 20.3524 5.275 20.4993 5.40833 20.6333C5.54167 20.7673 5.68854 20.834 5.84896 20.8333"
            fill={color}
          />
        </svg>
      </span>
    );
  }
  if (tab === "wheel") {
    return (
      <span className="maew-accessory-tab-icon-box" aria-hidden="true">
        <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M13.0206 12.5C13.0206 12.6381 12.9658 12.7706 12.8681 12.8683C12.7704 12.9659 12.638 13.0208 12.4998 13.0208C12.3617 13.0208 12.2292 12.9659 12.1315 12.8683C12.0339 12.7706 11.979 12.6381 11.979 12.5C11.979 12.3618 12.0339 12.2294 12.1315 12.1317C12.2292 12.034 12.3617 11.9791 12.4998 11.9791C12.638 11.9791 12.7704 12.034 12.8681 12.1317C12.9658 12.2294 13.0206 12.3618 13.0206 12.5ZM9.37482 8.85413C9.37482 8.99227 9.31994 9.12474 9.22227 9.22242C9.12459 9.32009 8.99212 9.37497 8.85398 9.37497C8.71585 9.37497 8.58337 9.32009 8.4857 9.22242C8.38802 9.12474 8.33315 8.99227 8.33315 8.85413C8.33315 8.716 8.38802 8.58352 8.4857 8.48585C8.58337 8.38817 8.71585 8.3333 8.85398 8.3333C8.99212 8.3333 9.12459 8.38817 9.22227 8.48585C9.31994 8.58352 9.37482 8.716 9.37482 8.85413ZM9.37482 16.1458C9.37482 16.2839 9.31994 16.4164 9.22227 16.5141C9.12459 16.6118 8.99212 16.6666 8.85398 16.6666C8.71585 16.6666 8.58337 16.6118 8.4857 16.5141C8.38802 16.4164 8.33315 16.2839 8.33315 16.1458C8.33315 16.0077 8.38802 15.8752 8.4857 15.7775C8.58337 15.6798 8.71585 15.625 8.85398 15.625C8.99212 15.625 9.12459 15.6798 9.22227 15.7775C9.31994 15.8752 9.37482 16.0077 9.37482 16.1458ZM16.6665 8.85413C16.6665 8.99227 16.6116 9.12474 16.5139 9.22242C16.4163 9.32009 16.2838 9.37497 16.1456 9.37497C16.0075 9.37497 15.875 9.32009 15.7774 9.22242C15.6797 9.12474 15.6248 8.99227 15.6248 8.85413C15.6248 8.716 15.6797 8.58352 15.7774 8.48585C15.875 8.38817 16.0075 8.3333 16.1456 8.3333C16.2838 8.3333 16.4163 8.38817 16.5139 8.48585C16.6116 8.58352 16.6665 8.716 16.6665 8.85413ZM16.6665 16.1458C16.6665 16.2839 16.6116 16.4164 16.5139 16.5141C16.4163 16.6118 16.2838 16.6666 16.1456 16.6666C16.0075 16.6666 15.875 16.6118 15.7774 16.5141C15.6797 16.4164 15.6248 16.2839 15.6248 16.1458C15.6248 16.0077 15.6797 15.8752 15.7774 15.7775C15.875 15.6798 16.0075 15.625 16.1456 15.625C16.2838 15.625 16.4163 15.6798 16.5139 15.7775C16.6116 15.8752 16.6665 16.0077 16.6665 16.1458Z"
            fill={color}
            stroke={color}
            strokeWidth="2.08333"
          />
          <path
            d="M4.16669 6.24997C4.16669 5.69744 4.38619 5.16753 4.77689 4.77683C5.16759 4.38613 5.69749 4.16664 6.25003 4.16664H18.75C19.3026 4.16664 19.8325 4.38613 20.2232 4.77683C20.6139 5.16753 20.8334 5.69744 20.8334 6.24997V18.75C20.8334 19.3025 20.6139 19.8324 20.2232 20.2231C19.8325 20.6138 19.3026 20.8333 18.75 20.8333H6.25003C5.69749 20.8333 5.16759 20.6138 4.77689 20.2231C4.38619 19.8324 4.16669 19.3025 4.16669 18.75V6.24997Z"
            strokeWidth="2.08333"
            stroke={color}
          />
        </svg>
      </span>
    );
  }
  if (tab === "vote") {
    return (
      <span className="maew-accessory-tab-icon-box" aria-hidden="true">
        <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M19.0004 13.7922C18.8401 13.6319 18.6226 13.5418 18.3958 13.5418C18.1691 13.5418 17.9516 13.6319 17.7912 13.7922L17.144 14.4395C16.7065 14.877 17.0163 15.6251 17.6351 15.6251C17.834 15.6251 18.0234 15.7104 18.1552 15.8594L18.3201 16.0457C18.8913 16.6911 18.4331 17.7085 17.5713 17.7085H7.43703C6.57388 17.7085 6.11619 16.6884 6.69003 16.0437L6.84 15.8751C6.98154 15.7161 7.18428 15.6251 7.39718 15.6251C8.06169 15.6251 8.39449 14.8217 7.9246 14.3518L7.40748 13.8347C7.21994 13.6472 6.96559 13.5418 6.70037 13.5418H6.66421C6.399 13.5418 6.14464 13.6472 5.95711 13.8347L3.41789 16.3739C3.23036 16.5615 3.125 16.8158 3.125 17.081V21.9168C3.125 22.4691 3.57272 22.9168 4.125 22.9168H20.875C21.4273 22.9168 21.875 22.4691 21.875 21.9168V17.081C21.875 16.8158 21.7696 16.5615 21.5821 16.3739L19.0004 13.7922ZM19.9274 8.99892C20.3184 8.60847 20.3186 7.97495 19.9279 7.58425L14.7171 2.37347C14.3267 1.98312 13.6939 1.98292 13.3033 2.37301L6.62468 9.04304C6.23373 9.43349 6.23353 10.067 6.62423 10.4577L11.835 15.6685C12.2254 16.0588 12.8582 16.059 13.2488 15.669L19.9274 8.99892ZM13.3137 5.301C13.7043 4.91048 14.3374 4.91048 14.7279 5.301L17.0012 7.57429C17.3917 7.96481 17.3918 8.59798 17.0012 8.9885L13.2592 12.7305C12.8687 13.1211 12.2355 13.1211 11.845 12.7305L9.57169 10.4573C9.18117 10.0667 9.18117 9.43357 9.57169 9.04304L13.3137 5.301Z"
            fill={color}
          />
        </svg>
      </span>
    );
  }
  return (
    <span className="maew-accessory-tab-icon-box" aria-hidden="true">
      <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M3.60835 3.60835C2.08335 5.13543 2.08335 7.5896 2.08335 12.5C2.08335 17.4104 2.08335 19.8656 3.60835 21.3906C5.13543 22.9167 7.5896 22.9167 12.5 22.9167C17.4104 22.9167 19.8656 22.9167 21.3906 21.3906C22.9167 19.8667 22.9167 17.4104 22.9167 12.5C22.9167 7.5896 22.9167 5.13439 21.3906 3.60835C19.8667 2.08335 17.4104 2.08335 12.5 2.08335C7.5896 2.08335 5.13439 2.08335 3.60835 3.60835ZM10.9833 7.83022C11.0541 7.75588 11.1095 7.66833 11.1463 7.57258C11.1832 7.47682 11.2009 7.37474 11.1983 7.27216C11.1958 7.16958 11.173 7.06851 11.1314 6.97472C11.0898 6.88093 11.0301 6.79626 10.9557 6.72554C10.8814 6.65481 10.7938 6.59943 10.6981 6.56254C10.6023 6.52565 10.5003 6.50799 10.3977 6.51055C10.2951 6.51311 10.194 6.53586 10.1002 6.57748C10.0065 6.6191 9.92178 6.67879 9.85106 6.75314L7.44064 9.28439L6.81564 8.62814C6.74568 8.55083 6.66096 8.4883 6.56646 8.44425C6.47196 8.40019 6.3696 8.3755 6.26541 8.37162C6.16122 8.36774 6.05731 8.38476 5.95979 8.42167C5.86228 8.45857 5.77314 8.51463 5.69763 8.58652C5.62212 8.65842 5.56177 8.7447 5.52012 8.84028C5.47848 8.93587 5.45639 9.03883 5.45515 9.14308C5.45392 9.24734 5.47357 9.35078 5.51294 9.44733C5.55231 9.54387 5.6106 9.63156 5.68439 9.70522L6.87502 10.9552C6.94798 11.0318 7.03574 11.0928 7.13296 11.1344C7.23019 11.1761 7.33486 11.1976 7.44064 11.1976C7.54642 11.1976 7.65109 11.1761 7.74832 11.1344C7.84555 11.0928 7.9333 11.0318 8.00627 10.9552L10.9833 7.83022ZM13.5417 8.59377C13.3345 8.59377 13.1358 8.67608 12.9893 8.82259C12.8427 8.9691 12.7604 9.16782 12.7604 9.37502C12.7604 9.58222 12.8427 9.78093 12.9893 9.92744C13.1358 10.074 13.3345 10.1563 13.5417 10.1563H18.75C18.9572 10.1563 19.1559 10.074 19.3024 9.92744C19.449 9.78093 19.5313 9.58222 19.5313 9.37502C19.5313 9.16782 19.449 8.9691 19.3024 8.82259C19.1559 8.67608 18.9572 8.59377 18.75 8.59377H13.5417ZM10.9823 15.1219C11.0561 15.0482 11.1144 14.9605 11.1538 14.864C11.1931 14.7675 11.2128 14.664 11.2115 14.5597C11.2103 14.4555 11.1882 14.3525 11.1466 14.257C11.1049 14.1614 11.0446 14.0751 10.9691 14.0032C10.8936 13.9313 10.8044 13.8752 10.7069 13.8383C10.6094 13.8014 10.5055 13.7844 10.4013 13.7883C10.2971 13.7922 10.1947 13.8169 10.1002 13.8609C10.0057 13.905 9.92101 13.9675 9.85106 14.0448L7.44064 16.5761L6.81564 15.9198C6.74568 15.8425 6.66096 15.78 6.56646 15.7359C6.47196 15.6919 6.3696 15.6672 6.26541 15.6633C6.16122 15.6594 6.05731 15.6764 5.95979 15.7133C5.86228 15.7502 5.77314 15.8063 5.69763 15.8782C5.62212 15.9501 5.56177 16.0364 5.52012 16.132C5.47848 16.2275 5.45639 16.3305 5.45515 16.4347C5.45392 16.539 5.47357 16.6425 5.51294 16.739C5.55231 16.8355 5.6106 16.9232 5.68439 16.9969L6.87502 18.2469C6.94798 18.3235 7.03574 18.3844 7.13296 18.4261C7.23019 18.4678 7.33486 18.4892 7.44064 18.4892C7.54642 18.4892 7.65109 18.4678 7.74832 18.4261C7.84555 18.3844 7.9333 18.3235 8.00627 18.2469L10.9823 15.1219ZM13.5417 15.8854C13.3345 15.8854 13.1358 15.9677 12.9893 16.1143C12.8427 16.2608 12.7604 16.4595 12.7604 16.6667C12.7604 16.8739 12.8427 17.0726 12.9893 17.2191C13.1358 17.3656 13.3345 17.4479 13.5417 17.4479H18.75C18.9572 17.4479 19.1559 17.3656 19.3024 17.2191C19.449 17.0726 19.5313 16.8739 19.5313 16.6667C19.5313 16.4595 19.449 16.2608 19.3024 16.1143C19.1559 15.9677 18.9572 15.8854 18.75 15.8854H13.5417Z"
          fillRule="evenodd"
          clipRule="evenodd"
          fill={color}
        />
      </svg>
    </span>
  );
}

type SheetStep = "details" | "your_color" | "finish_color";
type DraftPollOption = { id?: string; text: string };

export function TripAccessoryView({ initialTab = "event" }: { initialTab?: AccessoryTabId }) {
  const { trip, me, permissions } = useTripWorkspace();
  const isOrganizer = permissions.isOrganizer;
  const canStartEvents = permissions.canStartEvents;
  const canCreatePolls = permissions.canCreatePolls;
  const avatarBg = me?.avatar_color || "#c0613e";

  const [quests, setQuests] = useState<Quest[]>([]);
  const [eventFilter, setEventFilter] = useState<string>("all");

  // Spin Wheel & Cat Random state (Figma 666:15682 & 788:3805)
  const [wheelOptions, setWheelOptions] = useState<WheelOption[]>([]);
  const [wheelNewText, setWheelNewText] = useState("");
  const [wheelTotalDeg, setWheelTotalDeg] = useState(0);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelWinnerIdx, setWheelWinnerIdx] = useState<number | null>(null);
  const [pendingWheelDeleteId, setPendingWheelDeleteId] = useState<string | null>(null);
  const [wheelFunMode, setWheelFunMode] = useState(true);
  const [wheelAdding, setWheelAdding] = useState(false);

  // Cat Treat Cup Physics & Interaction state (Figma 788:3805)
  const [selectedCatTreatId, setSelectedCatTreatId] = useState<string | null>(null);
  const [draggingCatTreatId, setDraggingCatTreatId] = useState<string | null>(null);
  const [draggingOutsideCup, setDraggingOutsideCup] = useState(false);
  const [catCupShaking, setCatCupShaking] = useState(false);
  const [drawnCatTreat, setDrawnCatTreat] = useState<(WheelOption & { flavorColor: string }) | null>(null);
  const [, setPhysicsTick] = useState(0);

  const cupContainerRef = useRef<HTMLDivElement | null>(null);
  const catPhysicsRef = useRef<Map<string, CatTreatPhysicsBody>>(new Map());
  const dragPointerRef = useRef<{
    id: string;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    originX: number;
    originY: number;
    targetX: number;
    targetY: number;
    moved: boolean;
  } | null>(null);
  const wheelInitializedRef = useRef(false);

  // Vote / Poll state (Figma 639:1342, 660:8393, 660:8535)
  const [polls, setPolls] = useState<Poll[]>([]);
  const [votingPollId, setVotingPollId] = useState<string | null>(null);
  const [pollModalMode, setPollModalMode] = useState<"add" | "edit" | null>(null);
  const [pollModalClosing, setPollModalClosing] = useState(false);
  const [editingPollId, setEditingPollId] = useState<string | null>(null);
  const [pollFormTitle, setPollFormTitle] = useState("");
  const [pollFormOptionDraft, setPollFormOptionDraft] = useState("");
  const [pollFormOptions, setPollFormOptions] = useState<DraftPollOption[]>([]);
  const [savingPoll, setSavingPoll] = useState(false);
  const [pollFormError, setPollFormError] = useState("");

  // Checklist state (Figma 639:1690, 704:5638)
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null);
  const [checklistModalMode, setChecklistModalMode] = useState<"add" | "edit" | null>(null);
  const [checklistModalClosing, setChecklistModalClosing] = useState(false);
  const [checklistDraft, setChecklistDraft] = useState("");
  const [checklistFormItems, setChecklistFormItems] = useState<Array<{ id?: string; text: string }>>([]);
  const [savingChecklist, setSavingChecklist] = useState(false);
  const [checklistError, setChecklistError] = useState("");

  // Bottom sheet state for events (Figma 660:7715, 666:16309, 660:8173, 666:16482, 660:8194, 666:16498)
  const [activePreset, setActivePreset] = useState<EventPresetConfig | null>(null);
  const [sheetStep, setSheetStep] = useState<SheetStep>("details");
  const [sheetClosing, setSheetClosing] = useState(false);
  const [startingEvent, setStartingEvent] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadedPreviewUrls, setUploadedPreviewUrls] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function loadQuests() {
    try {
      const list = await getQuests(trip.id);
      setQuests(list);
    } catch {
      // ignore load error
    }
  }

  async function loadWheel() {
    try {
      const list = await getWheel(trip.id);
      if (list.length === 0 && !wheelInitializedRef.current) {
        wheelInitializedRef.current = true;
        const memberNames =
          trip.members
            ?.map((m) => m.user?.display_name?.trim())
            .filter((n): n is string => Boolean(n)) ?? [];
        const defaultLabels =
          memberNames.length >= 4
            ? memberNames.slice(0, 8)
            : ["ต้นน้ำ", "อาตีฟ", "นาย", "เจมส์", "ทาโกะยากิ", "ราเมง", "คาเฟ่แมว", "ปิ้งย่าง"];
        const seeded: WheelOption[] = defaultLabels.map((text, idx) => ({
          id: `seed-${idx}-${Date.now()}`,
          trip_id: trip.id,
          text,
          color: CAT_TREAT_FLAVORS[idx % CAT_TREAT_FLAVORS.length],
          sort_order: idx,
        }));
        setWheelOptions(seeded);
        // Also persist asynchronously so backend stays in sync
        void (async () => {
          try {
            for (const [idx, label] of defaultLabels.entries()) {
              await addWheelOption(
                trip.id,
                label,
                CAT_TREAT_FLAVORS[idx % CAT_TREAT_FLAVORS.length]
              );
            }
            const fresh = await getWheel(trip.id);
            if (fresh.length > 0) setWheelOptions(fresh);
          } catch {
            // keep local seeded items if offline/demo
          }
        })();
        return;
      }
      wheelInitializedRef.current = true;
      setWheelOptions(list);
    } catch {
      if (!wheelInitializedRef.current) {
        wheelInitializedRef.current = true;
        const fallbackLabels = ["ต้นน้ำ", "อาตีฟ", "นาย", "เจมส์", "ทาโกะยากิ", "ราเมง", "คาเฟ่แมว", "ปิ้งย่าง"];
        setWheelOptions(
          fallbackLabels.map((text, idx) => ({
            id: `seed-${idx}`,
            trip_id: trip.id,
            text,
            color: CAT_TREAT_FLAVORS[idx % CAT_TREAT_FLAVORS.length],
            sort_order: idx,
          }))
        );
      }
    }
  }

  async function loadPolls() {
    try {
      const list = await getPolls(trip.id);
      setPolls(list);
    } catch {
      // ignore load error
    }
  }

  async function loadChecklist() {
    try {
      const list = await getChecklist(trip.id);
      setChecklistItems(list);
    } catch {
      // ignore load error
    }
  }

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      void loadQuests();
      void loadWheel();
      void loadPolls();
      void loadChecklist();
    });
    return () => { active = false; };
  }, [trip.id]);

  async function handleToggleChecklistItem(item: ChecklistItem) {
    if (togglingItemId) return;
    setTogglingItemId(item.id);
    try {
      if (item.is_checked) {
        await uncheckItem(trip.id, item.id);
      } else {
        await checkItem(trip.id, item.id);
      }
      await loadChecklist();
    } catch {
      // ignore toggle error
    } finally {
      setTogglingItemId(null);
    }
  }

  function openChecklistModal(mode: "add" | "edit") {
    setChecklistDraft("");
    setChecklistError("");
    setChecklistFormItems(
      mode === "edit" ? checklistItems.map((i) => ({ id: i.id, text: i.text })) : []
    );
    setChecklistModalClosing(false);
    setChecklistModalMode(mode);
  }

  function closeChecklistModal() {
    setChecklistModalClosing(true);
    window.setTimeout(() => {
      setChecklistModalMode(null);
      setChecklistModalClosing(false);
    }, 220);
  }

  function handleAddDraftChecklistItem() {
    const trimmed = checklistDraft.trim();
    if (!trimmed) return;
    setChecklistFormItems((prev) => [...prev, { text: trimmed }]);
    setChecklistDraft("");
    setChecklistError("");
  }

  async function handleSubmitChecklistModal() {
    if (savingChecklist) return;
    const pending = checklistDraft.trim();
    const finalItems = pending ? [...checklistFormItems, { text: pending }] : checklistFormItems;
    if (finalItems.some((item) => !item.text.trim())) {
      setChecklistError("กรุณากรอกชื่อรายการให้ครบหรือลบช่องที่ว่าง");
      return;
    }
    const keptIds = new Set(finalItems.filter((i) => i.id).map((i) => i.id as string));
    const removed = checklistModalMode === "edit"
      ? checklistItems.filter((i) => !keptIds.has(i.id))
      : [];
    const added = finalItems.filter((i) => !i.id);
    const changed = finalItems.filter((item) =>
      item.id && item.text.trim() !== checklistItems.find((existing) => existing.id === item.id)?.text
    );
    if (removed.length === 0 && added.length === 0 && changed.length === 0) {
      closeChecklistModal();
      return;
    }
    setSavingChecklist(true);
    setChecklistError("");
    try {
      for (const item of changed) {
        await updateChecklistItem(trip.id, item.id as string, item.text.trim());
      }
      for (const item of removed) {
        await deleteChecklistItem(trip.id, item.id);
      }
      const nextSortOrder = Math.max(-1, ...checklistItems.map((item) => item.sort_order)) + 1;
      for (const [index, item] of added.entries()) {
        await addChecklistItem(trip.id, item.text.trim(), nextSortOrder + index);
      }
      await loadChecklist();
      closeChecklistModal();
    } catch {
      setChecklistError("บันทึกเช็คลิสต์ไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setSavingChecklist(false);
    }
  }

  function openAddPollModal() {
    if (!canCreatePolls) return;
    setPollFormError("");
    setEditingPollId(null);
    setPollFormTitle("");
    setPollFormOptionDraft("");
    setPollFormOptions([]);
    setPollModalClosing(false);
    setPollModalMode("add");
  }

  function openEditPollModal(poll: Poll) {
    if (!canCreatePolls) return;
    setPollFormError("");
    setEditingPollId(poll.id);
    setPollFormTitle(poll.title);
    setPollFormOptionDraft("");
    setPollFormOptions(poll.options.map((o) => ({ id: o.id, text: o.text })));
    setPollModalClosing(false);
    setPollModalMode("edit");
  }

  function closePollModal() {
    setPollModalClosing(true);
    window.setTimeout(() => {
      setPollModalMode(null);
      setEditingPollId(null);
      setPollModalClosing(false);
    }, 220);
  }

  function handleAddDraftPollOption() {
    const trimmed = pollFormOptionDraft.trim();
    if (!trimmed) return;
    setPollFormOptions((prev) => [...prev, { text: trimmed }]);
    setPollFormOptionDraft("");
    setPollFormError("");
  }

  function handleRemoveDraftPollOption(idx: number) {
    setPollFormOptions((prev) => prev.filter((_, i) => i !== idx));
    setPollFormError("");
  }

  async function handleSubmitPollModal() {
    const title = pollFormTitle.trim();
    const pendingDraft = pollFormOptionDraft.trim();
    const finalOptions = pendingDraft
      ? [...pollFormOptions, { text: pendingDraft }]
      : pollFormOptions;
    if (savingPoll) return;
    if (!title || finalOptions.length === 0 || finalOptions.some((option) => !option.text.trim())) {
      setPollFormError("กรุณากรอกชื่อโหวตและชื่อตัวเลือกให้ครบ");
      return;
    }
    const cleanOptions = finalOptions.map((o, i) => ({ id: o.id, text: o.text.trim(), sort_order: i }));
    setSavingPoll(true);
    setPollFormError("");
    try {
      if (pollModalMode === "edit" && editingPollId) {
        await updatePoll(trip.id, editingPollId, {
          title,
          options: cleanOptions,
        });
      } else {
        await createPoll(trip.id, {
          title,
          options: cleanOptions.map((o) => ({ text: o.text, sort_order: o.sort_order })),
        });
      }
      await loadPolls();
      closePollModal();
    } catch {
      setPollFormError("บันทึกโหวตไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setSavingPoll(false);
    }
  }

  async function handleCastVote(pollId: string, optionId: string, currentVoteId: string | null) {
    if (votingPollId) return;
    setVotingPollId(pollId);
    try {
      if (currentVoteId === optionId) {
        await unvote(trip.id, pollId);
      } else {
        await vote(trip.id, pollId, optionId);
      }
      await loadPolls();
    } catch {
      // ignore vote error
    } finally {
      setVotingPollId(null);
    }
  }

  function formatPollSubtitle(poll: Poll): string {
    if (poll.subtitle && poll.subtitle.trim()) {
      return poll.subtitle.trim();
    }
    const memberCount = trip.members?.filter((m) => m.status === "joined").length || trip.members?.length || 1;
    if (poll.status === "closed") {
      const winner =
        poll.options.find((o) => o.is_winner) ||
        [...poll.options].sort((a, b) => b.vote_count - a.vote_count)[0];
      if (winner && winner.vote_count > 0) {
        return `ตกลงแล้ว · ${winner.text} ชนะ`;
      }
      return "ตกลงแล้ว";
    }
    if (poll.close_date) {
      const d = new Date(poll.close_date);
      if (!Number.isNaN(d.getTime())) {
        const formatted = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
        return `ปิดโหวต ${formatted} · ${memberCount} คนต้องโหวต`;
      }
    }
    return `${memberCount} คนต้องโหวต`;
  }

  // Sync wheelOptions with catPhysicsRef bodies
  useEffect(() => {
    let active = true;
    const map = catPhysicsRef.current;
    const validIds = new Set(wheelOptions.map((o) => o.id));
    for (const key of Array.from(map.keys())) {
      if (!validIds.has(key)) {
        map.delete(key);
      }
    }
    wheelOptions.forEach((opt, idx) => {
      const slot = getCatTreatSlot(idx);
      const existing = map.get(opt.id);
      if (existing) {
        existing.restX = slot.x;
        existing.restY = slot.y;
        existing.restRot = slot.rot;
      } else {
        map.set(opt.id, {
          id: opt.id,
          x: slot.x,
          y: slot.y,
          rot: slot.rot,
          vx: 0,
          vy: 0,
          vRot: 0,
          restX: slot.x,
          restY: slot.y,
          restRot: slot.rot,
          mode: "cup",
          bounces: 0,
        });
      }
    });
    queueMicrotask(() => { if (active) setPhysicsTick((v) => v + 1); });
    return () => { active = false; };
  }, [wheelOptions]);

  // 60fps 2D spring & bounce physics simulation for Cat Mode
  useEffect(() => {
    if (initialTab !== "wheel" || !wheelFunMode) return;
    let rafId = 0;

    const step = () => {
      const map = catPhysicsRef.current;
      let needsRender = false;
      const dragInfo = dragPointerRef.current;
      const dragBody = dragInfo ? map.get(dragInfo.id) : undefined;

      map.forEach((b) => {
        if (b.mode === "dragging" && dragInfo && dragInfo.id === b.id) {
          const dx = dragInfo.targetX - b.x;
          const dy = dragInfo.targetY - b.y;
          b.vx = dx * 0.45;
          b.vy = dy * 0.45;
          b.x += b.vx;
          b.y += b.vy;
          // Tilt smoothly while dragging; orient more horizontally if pulled out of cup so label is easy to read
          const outside = b.y < 24 || b.y > 235 || b.x < 6 || b.x > 220;
          const desiredRot = outside
            ? Math.max(-25, Math.min(35, b.vx * 1.6))
            : b.restRot + Math.max(-28, Math.min(28, b.vx * 1.8));
          b.vRot = (desiredRot - b.rot) * 0.28;
          b.rot += b.vRot;
          needsRender = true;
          return;
        }

        if (b.mode === "dropping") {
          // Gravity & air steering toward the cup slot
          b.vy += 0.72;
          b.vx += (b.restX - b.x) * 0.04;
          b.vx *= 0.94;
          b.x += b.vx;
          b.y += b.vy;
          b.vRot = (b.restRot - b.rot) * 0.14;
          b.rot += b.vRot;

          if (b.y >= b.restY) {
            b.y = b.restY;
            if (b.bounces < 2 && Math.abs(b.vy) > 2.2) {
              b.vy = -b.vy * 0.5;
              b.vx += (Math.random() - 0.5) * 4;
              b.rot += (Math.random() - 0.5) * 14;
              b.bounces += 1;
              // Jostle neighboring sticks in the cup when bouncing in
              map.forEach((other) => {
                if (other.id !== b.id && other.mode === "cup") {
                  const dist = other.x - b.x;
                  if (Math.abs(dist) < 75) {
                    other.vx += (dist >= 0 ? 1 : -1) * 2.4;
                    other.vy -= 2.2;
                    other.vRot += (dist >= 0 ? 1 : -1) * 3.2;
                  }
                }
              });
            } else {
              b.mode = "cup";
              b.vy = -1.5;
            }
          }
          needsRender = true;
          return;
        }

        // mode === "cup"
        const isSelected = selectedCatTreatId === b.id;
        const targetX = b.restX;
        const targetY = isSelected ? b.restY - 16 : b.restY;
        const targetRot = b.restRot;

        let fx = (targetX - b.x) * 0.14;
        let fy = (targetY - b.y) * 0.14;
        let fRot = (targetRot - b.rot) * 0.14;

        // Interactive collision/stirring when user drags another stick near this one
        if (dragBody && dragBody.id !== b.id) {
          const dx = b.x - dragBody.x;
          const dy = b.y - dragBody.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 3600 && distSq > 1) {
            const dist = Math.sqrt(distSq);
            const push = (60 - dist) / 60;
            fx += (dx / dist) * push * 2.8;
            fy += (dy / dist) * push * 1.4;
            fRot += (dx >= 0 ? 1 : -1) * push * 4.2;
          }
        }

        b.vx = (b.vx + fx) * 0.78;
        b.vy = (b.vy + fy) * 0.78;
        b.vRot = (b.vRot + fRot) * 0.78;

        if (
          Math.abs(b.vx) > 0.04 ||
          Math.abs(b.vy) > 0.04 ||
          Math.abs(b.vRot) > 0.04 ||
          Math.abs(targetX - b.x) > 0.15 ||
          Math.abs(targetY - b.y) > 0.15 ||
          Math.abs(targetRot - b.rot) > 0.15
        ) {
          b.x += b.vx;
          b.y += b.vy;
          b.rot += b.vRot;
          needsRender = true;
        } else {
          b.x = targetX;
          b.y = targetY;
          b.rot = targetRot;
        }
      });

      if (needsRender) {
        setPhysicsTick((v) => (v + 1) % 1000000);
      }
      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [initialTab, wheelFunMode, selectedCatTreatId]);

  function handleSpinWheel() {
    if (wheelSpinning || wheelOptions.length === 0) return;
    setPendingWheelDeleteId(null);
    const n = wheelOptions.length;
    const seg = 360 / n;
    const idx = Math.floor(Math.random() * n);
    const targetMod = (360 - (idx * seg + seg / 2) + 360) % 360;
    const currentMod = ((wheelTotalDeg % 360) + 360) % 360;
    const extra = (targetMod - currentMod + 360) % 360;
    const extraSpins = wheelFunMode ? 8 : 5;
    const newTotal = wheelTotalDeg + extraSpins * 360 + extra;
    setWheelWinnerIdx(null);
    setWheelTotalDeg(newTotal);
    setWheelSpinning(true);
    window.setTimeout(() => {
      setWheelSpinning(false);
      setWheelWinnerIdx(idx);
    }, 3000);
  }

  async function handleAddWheelOption() {
    const t = wheelNewText.trim();
    if (!t || wheelAdding || wheelOptions.length >= 20) return;
    const nextIdx = wheelOptions.length;
    const flavorColor = CAT_TREAT_FLAVORS[nextIdx % CAT_TREAT_FLAVORS.length];
    const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const slot = getCatTreatSlot(nextIdx);

    // Pre-seed physics body at the top input sachet so it bounces down into the cup!
    catPhysicsRef.current.set(tempId, {
      id: tempId,
      x: 113 + (Math.random() - 0.5) * 18,
      y: -118,
      rot: (Math.random() - 0.5) * 20,
      vx: (slot.x - 113) * 0.08,
      vy: -3.2,
      vRot: 5,
      restX: slot.x,
      restY: slot.y,
      restRot: slot.rot,
      mode: "dropping",
      bounces: 0,
    });

    const optimisticOption: WheelOption = {
      id: tempId,
      trip_id: trip.id,
      text: t,
      color: flavorColor,
      sort_order: nextIdx,
    };

    setWheelNewText("");
    setPendingWheelDeleteId(null);
    setWheelWinnerIdx(null);
    setWheelOptions((prev) => [...prev, optimisticOption]);
    setSelectedCatTreatId(null);

    setWheelAdding(true);
    try {
      const created = await addWheelOption(trip.id, t, flavorColor);
      if (created && created.id) {
        const body = catPhysicsRef.current.get(tempId);
        if (body) {
          body.id = created.id;
          catPhysicsRef.current.delete(tempId);
          catPhysicsRef.current.set(created.id, body);
        }
        setWheelOptions((prev) =>
          prev.map((item) => (item.id === tempId ? { ...created, color: flavorColor } : item))
        );
      }
    } catch {
      // Keep optimistic cat treat in cup if offline/demo
    } finally {
      setWheelAdding(false);
    }
  }

  function handleWheelSliceClick(optId: string) {
    if (wheelSpinning) return;
    if (pendingWheelDeleteId !== optId) {
      setPendingWheelDeleteId(optId);
      return;
    }
    setPendingWheelDeleteId(null);
    void handleDeleteWheelSlice(optId);
  }

  async function handleDeleteWheelSlice(optId: string) {
    if (wheelSpinning) return;
    catPhysicsRef.current.delete(optId);
    setWheelOptions((prev) => prev.filter((item) => item.id !== optId));
    setSelectedCatTreatId((prev) => (prev === optId ? null : prev));
    setWheelWinnerIdx(null);
    try {
      if (!optId.startsWith("local-") && !optId.startsWith("seed-")) {
        await deleteWheelOption(trip.id, optId);
      }
    } catch {
      // ignore delete error
    }
  }

  async function handleClearWheel() {
    if (wheelSpinning || wheelOptions.length === 0) return;
    catPhysicsRef.current.clear();
    setWheelOptions([]);
    setPendingWheelDeleteId(null);
    setSelectedCatTreatId(null);
    setWheelWinnerIdx(null);
    try {
      await clearWheel(trip.id);
    } catch {
      // ignore clear error
    }
  }

  function handleCatTreatPointerDown(
    e: React.PointerEvent<HTMLDivElement>,
    opt: WheelOption
  ) {
    if (catCupShaking) return;
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore capture error
    }
    const body = catPhysicsRef.current.get(opt.id);
    if (!body) return;
    body.mode = "dragging";
    dragPointerRef.current = {
      id: opt.id,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      originX: body.x,
      originY: body.y,
      targetX: body.x,
      targetY: body.y,
      moved: false,
    };
    setSelectedCatTreatId(opt.id);
    setDraggingCatTreatId(opt.id);
    setDraggingOutsideCup(false);
    setPhysicsTick((v) => v + 1);
  }

  function handleCatTreatPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const info = dragPointerRef.current;
    if (!info || info.pointerId !== e.pointerId) return;
    const dx = e.clientX - info.startClientX;
    const dy = e.clientY - info.startClientY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      info.moved = true;
    }
    info.targetX = info.originX + dx;
    info.targetY = info.originY + dy;

    const outside =
      info.targetY < 24 ||
      info.targetY > 235 ||
      info.targetX < 6 ||
      info.targetX > 220;
    if (outside !== draggingOutsideCup) {
      setDraggingOutsideCup(outside);
    }
  }

  function handleCatTreatPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const info = dragPointerRef.current;
    if (!info || info.pointerId !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore release error
    }
    const body = catPhysicsRef.current.get(info.id);
    const outside =
      info.targetY < 24 ||
      info.targetY > 235 ||
      info.targetX < 6 ||
      info.targetX > 220;

    dragPointerRef.current = null;
    setDraggingCatTreatId(null);
    setDraggingOutsideCup(false);

    if (outside && info.moved) {
      // Dragged out of the cup -> delete from options!
      void handleDeleteWheelSlice(info.id);
      return;
    }

    if (body) {
      body.mode = "cup";
      body.vy -= 2.5;
    }
    setSelectedCatTreatId(info.id);
    setPhysicsTick((v) => v + 1);
  }

  function handleDrawCatTreat() {
    if (catCupShaking || wheelOptions.length === 0) return;
    setCatCupShaking(true);
    setSelectedCatTreatId(null);

    const pulseSticks = () => {
      catPhysicsRef.current.forEach((b) => {
        if (b.mode === "cup") {
          b.vx += (Math.random() - 0.5) * 20;
          b.vy -= 5 + Math.random() * 10;
          b.vRot += (Math.random() - 0.5) * 24;
        }
      });
      setPhysicsTick((v) => v + 1);
    };

    pulseSticks();
    const t1 = window.setTimeout(pulseSticks, 180);
    const t2 = window.setTimeout(pulseSticks, 360);
    const t3 = window.setTimeout(pulseSticks, 540);
    const t4 = window.setTimeout(pulseSticks, 720);

    window.setTimeout(() => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
      setCatCupShaking(false);
      if (wheelOptions.length === 0) return;
      const winIdx = Math.floor(Math.random() * wheelOptions.length);
      const chosen = wheelOptions[winIdx];
      if (!chosen) return;
      const flavorColor =
        CAT_TREAT_FLAVORS.includes(chosen.color)
          ? chosen.color
          : CAT_TREAT_FLAVORS[winIdx % CAT_TREAT_FLAVORS.length];
      setDrawnCatTreat({ ...chosen, flavorColor });
      setSelectedCatTreatId(chosen.id);
    }, 920);
  }

  // Match backend Quest for a preset
  function findQuestForPreset(preset: EventPresetConfig): Quest | undefined {
    const lowerTitle = preset.title.toLowerCase();
    return quests.find((q) => {
      const t = q.title.trim().toLowerCase();
      if (preset.id === "color_hunting") {
        return t === lowerTitle || t === "color hunter" || t.includes("color hunt");
      }
      return t === lowerTitle || t.includes("photo hunt") || t.includes("bingo");
    });
  }

  function isPresetRunning(preset: EventPresetConfig): boolean {
    const q = findQuestForPreset(preset);
    return !!q && !q.closed;
  }

  function hasUserFinishedPreset(preset: EventPresetConfig): boolean {
    const q = findQuestForPreset(preset);
    if (!q) return false;
    const myProg = q.progress.find((p) => p.user_id === me.id);
    return !!myProg && myProg.completed.length >= Math.min(9, q.targets.length || 1);
  }

  const assignedColor = useMemo(
    () => getAssignedColorForUser(me.id, trip.id),
    [me.id, trip.id]
  );

  const visiblePresets = useMemo(() => {
    return EVENT_PRESETS.filter((preset) => {
      const running = isPresetRunning(preset);
      if (eventFilter === "running") return running;
      if (eventFilter === "not_started") return !running;
      return true;
    });
  }, [quests, eventFilter]);

  const selectedFilterLabel =
    EVENT_FILTER_OPTIONS.find((o) => o.value === eventFilter)?.label || "ประเภท";

  function openEventDetailsSheet(preset: EventPresetConfig) {
    setActivePreset(preset);
    setSheetStep("details");
    setSheetClosing(false);
  }

  function openYourColorSheet(preset: EventPresetConfig) {
    setActivePreset(preset);
    if (hasUserFinishedPreset(preset) || uploadedPreviewUrls.length > 0) {
      setSheetStep("finish_color");
    } else {
      setSheetStep("your_color");
    }
    setSheetClosing(false);
  }

  function closeSheet() {
    setSheetClosing(true);
    window.setTimeout(() => {
      setActivePreset(null);
      setSheetClosing(false);
    }, 220);
  }

  async function handleStartEvent() {
    if (!activePreset || startingEvent || !canStartEvents) return;
    setStartingEvent(true);
    try {
      const existing = findQuestForPreset(activePreset);
      if (existing) {
        if (existing.closed) {
          await closeQuest(trip.id, existing.id, false);
        }
      } else {
        await createQuest(trip.id, {
          title: activePreset.title,
          description: activePreset.shortDesc,
          targets: activePreset.targets,
        });
      }
      await loadQuests();
      closeSheet();
    } catch {
      closeSheet();
    } finally {
      setStartingEvent(false);
    }
  }

  async function markNinePhotosCompleted(urls: string[]) {
    if (!activePreset) return;
    setUploadingPhotos(true);
    try {
      setUploadedPreviewUrls(urls);
      const q = findQuestForPreset(activePreset);
      if (q && !q.closed) {
        const allIndices = q.targets.map((_, idx) => idx);
        await setQuestProgress(trip.id, q.id, allIndices);
        await loadQuests();
      }
      setSheetStep("finish_color");
    } catch {
      setSheetStep("finish_color");
    } finally {
      setUploadingPhotos(false);
    }
  }

  function handleTriggerUploadClick() {
    if (uploadingPhotos) return;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    } else {
      void markNinePhotosCompleted([]);
    }
  }

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) {
      // Even if user cancels or selects 0 in demo, advance to the 9-photo finish grid per Figma flow
      void markNinePhotosCompleted([]);
      return;
    }
    const urls = files.slice(0, 9).map((f) => URL.createObjectURL(f));
    void markNinePhotosCompleted(urls);
  }

  async function handleDownloadGridImage() {
    if (!activePreset) return;
    const filename = `${activePreset.id}-${trip.name.replace(/\s+/g, "-")}.png`;

    if (uploadedPreviewUrls.length > 0) {
      try {
        const canvasWidth = 1086;
        const canvasHeight = 1359;
        const cols = 3;
        const rows = 3;
        const cellW = canvasWidth / cols;
        const cellH = canvasHeight / rows;

        const canvas = document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context unavailable");

        ctx.fillStyle = "#14110d";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        const loadImg = (url: string) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(err);
            img.src = url;
          });

        const gridUrls = Array.from(
          { length: 9 },
          (_, i) => uploadedPreviewUrls[i % uploadedPreviewUrls.length]
        );
        const images = await Promise.all(gridUrls.map((u) => loadImg(u)));

        images.forEach((img, idx) => {
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          const dx = col * cellW;
          const dy = row * cellH;

          // Draw with object-fit: cover cropping to match the UI grid
          const imgRatio = img.naturalWidth / (img.naturalHeight || 1);
          const cellRatio = cellW / cellH;
          let sx = 0;
          let sy = 0;
          let sw = img.naturalWidth;
          let sh = img.naturalHeight;

          if (imgRatio > cellRatio) {
            sw = img.naturalHeight * cellRatio;
            sx = (img.naturalWidth - sw) / 2;
          } else {
            sh = img.naturalWidth / cellRatio;
            sy = (img.naturalHeight - sh) / 2;
          }

          ctx.drawImage(img, sx, sy, sw, sh, dx, dy, cellW, cellH);
        });

        const dataUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      } catch {
        // Fallback below if canvas fails
      }
    }

    try {
      const imageUrl = activePreset.defaultFinishGridImage;
      const a = document.createElement("a");
      a.href = imageUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      // ignore download error
    }
  }

  return (
    <main className="maew-home-scene maew-trip-fixed-scene">
      {/* Top Bar (Figma 660:7089) */}
      <MaewTopbar me={me} />

      <div className="maew-trip-scroll-content">
      {/* Section Hero Header + 4-Button Section Bar (Figma 768:4621 & 768:4680) */}
      <TripTicketSelector trip={trip} activeVariant="accessory" isOrganizer={isOrganizer} />

      {/* 4 Accessory Sub-Tool Selection Bar (Figma 768:5918 / 768:5921) */}
      <nav className="maew-accessory-tabs-card" aria-label="หมวดหมู่อุปกรณ์เสริม">
        <Link
          href={`/trips/${trip.id}/group`}
          aria-current={initialTab === "event" ? "page" : undefined}
          className={`maew-accessory-tab-btn${initialTab === "event" ? " is-active" : ""}`}
        >
          <AccessoryTabIcon tab="event" active={initialTab === "event"} />
          <span className="maew-accessory-tab-label">อีเวนท์</span>
        </Link>

        <Link
          href={`/trips/${trip.id}/tools/wheel`}
          aria-current={initialTab === "wheel" ? "page" : undefined}
          className={`maew-accessory-tab-btn${initialTab === "wheel" ? " is-active" : ""}`}
        >
          <AccessoryTabIcon tab="wheel" active={initialTab === "wheel"} />
          <span className="maew-accessory-tab-label">กงล้อสุ่ม</span>
        </Link>

        <Link
          href={`/trips/${trip.id}/tools/vote`}
          aria-current={initialTab === "vote" ? "page" : undefined}
          className={`maew-accessory-tab-btn${initialTab === "vote" ? " is-active" : ""}`}
        >
          <AccessoryTabIcon tab="vote" active={initialTab === "vote"} />
          <span className="maew-accessory-tab-label">ตั้งโหวต</span>
        </Link>

        <Link
          href={`/trips/${trip.id}/tools/checklist`}
          aria-current={initialTab === "checklist" ? "page" : undefined}
          className={`maew-accessory-tab-btn${initialTab === "checklist" ? " is-active" : ""}`}
        >
          <AccessoryTabIcon tab="checklist" active={initialTab === "checklist"} />
          <span className="maew-accessory-tab-label">เช็คลิสต์</span>
        </Link>
      </nav>

      {initialTab === "checklist" ? (
        /* Main White Card: เช็คลิสต์ (Figma 639:1783) */
        <section
          aria-label="เช็คลิสต์"
          style={{
            width: "100%",
            minHeight: 438,
            backgroundColor: "#ffffff",
            borderRadius: 14,
            padding: "20px 17px",
            marginTop: 10,
            display: "flex",
            flexDirection: "column",
            gap: 20,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 500,
                lineHeight: "26.4px",
                letterSpacing: "-0.24px",
                color: "#e85a2c",
                whiteSpace: "nowrap",
              }}
            >
              เช็คลิสต์
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <button
                type="button"
                onClick={() => openChecklistModal("add")}
                style={{
                  height: 26,
                  padding: "6px 10px",
                  borderRadius: 18,
                  border: "1px solid #e5e1d7",
                  backgroundColor: "#e85a2c",
                  color: "#ffffff",
                  fontSize: 11.25,
                  fontWeight: 500,
                  lineHeight: "normal",
                  letterSpacing: "0.06px",
                  cursor: "pointer",
                  boxSizing: "border-box",
                  whiteSpace: "nowrap",
                }}
              >
                เพิ่ม
              </button>
              <button
                type="button"
                disabled={checklistItems.length === 0}
                onClick={() => openChecklistModal("edit")}
                style={{
                  height: 26,
                  padding: "6px 10px",
                  borderRadius: 18,
                  border: "1px solid #e5e1d7",
                  backgroundColor: "#767168",
                  opacity: 0.5,
                  color: "#ffffff",
                  fontSize: 11.25,
                  fontWeight: 500,
                  lineHeight: "normal",
                  letterSpacing: "0.06px",
                  cursor: checklistItems.length === 0 ? "default" : "pointer",
                  boxSizing: "border-box",
                  whiteSpace: "nowrap",
                }}
              >
                แก้ไข
              </button>
            </div>
          </div>

          {checklistItems.length === 0 ? (
            <p
              style={{
                margin: 0,
                padding: "30px 0",
                textAlign: "center",
                fontSize: 13,
                fontWeight: 300,
                color: "#767168",
              }}
            >
              ยังไม่มีรายการ
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 5, width: "100%" }}>
              {checklistItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={item.is_checked}
                  disabled={togglingItemId === item.id}
                  onClick={() => void handleToggleChecklistItem(item)}
                  style={{
                    width: "100%",
                    background: "none",
                    border: "none",
                    borderBottom: "1px solid #e5e1d7",
                    padding: "10px 0 11px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "inherit",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 7,
                      border: `1px solid ${item.is_checked ? "#14110d" : "#d4cfc2"}`,
                      backgroundColor: item.is_checked ? "#14110d" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxSizing: "border-box",
                    }}
                  >
                    {item.is_checked && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2.5 6L5 8.5L9.5 3.5"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  <span
                    style={{
                      flex: "1 0 0",
                      minWidth: 0,
                      padding: "0.5px 0",
                      fontSize: 14,
                      fontWeight: 300,
                      lineHeight: "normal",
                      letterSpacing: "0.08px",
                      color: item.is_checked ? "#b5b0a4" : "#14110d",
                      textDecoration: item.is_checked ? "line-through" : "none",
                      wordBreak: "break-word",
                    }}
                  >
                    <span data-user-content>{item.text}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      ) : initialTab === "vote" ? (
        /* Main White Card: ตั้งโหวต (Figma 639:1435) */
        <section
          aria-label="ตั้งโหวต"
          style={{
            width: "100%",
            minHeight: 466,
            backgroundColor: "#ffffff",
            borderRadius: 14,
            padding: "20px 17px",
            marginTop: 10,
            display: "flex",
            flexDirection: "column",
            gap: 20,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 500,
                lineHeight: "26.4px",
                letterSpacing: "-0.24px",
                color: "#e85a2c",
                whiteSpace: "nowrap",
              }}
            >
              ตั้งโหวต
            </h2>

            {canCreatePolls && (
              <button
                type="button"
                onClick={openAddPollModal}
                style={{
                  height: 26,
                  padding: "6px 10px",
                  borderRadius: 18,
                  border: "1px solid #e5e1d7",
                  backgroundColor: "#e85a2c",
                  color: "#ffffff",
                  fontSize: 11.25,
                  fontWeight: 500,
                  lineHeight: "normal",
                  letterSpacing: "0.06px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxSizing: "border-box",
                  whiteSpace: "nowrap",
                }}
              >
                เพิ่มโหวต
              </button>
            )}
          </div>

          {polls.length === 0 && (
            <p
              style={{
                margin: 0,
                padding: "30px 0",
                textAlign: "center",
                fontSize: 13,
                fontWeight: 300,
                color: "#767168",
              }}
            >
              ยังไม่มีการโหวต
            </p>
          )}

          {polls.map((poll) => {
            const maxVotes = Math.max(1, ...poll.options.map((o) => o.vote_count));
            const closed = poll.status === "closed";
            return (
              <div key={poll.id} style={{ width: "100%", paddingBottom: 14, boxSizing: "border-box" }}>
                <div
                  style={{
                    width: "100%",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e1d7",
                    borderRadius: 16,
                    padding: "15px 15px 11px",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, width: "100%" }}>
                    <div style={{ flex: "1 0 0", minWidth: 0, paddingBottom: 4 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14.5,
                          fontWeight: 500,
                          lineHeight: "normal",
                          letterSpacing: "0.08px",
                          color: "#14110d",
                        }}
                      >
                        <span data-user-content>{poll.title}</span>
                      </p>
                    </div>
                    {canCreatePolls && (
                      <button
                        type="button"
                        onClick={() => openEditPollModal(poll)}
                        style={{
                          height: 26,
                          padding: "6px 10px",
                          borderRadius: 18,
                          border: "1px solid #e5e1d7",
                          backgroundColor: "#767168",
                          opacity: 0.5,
                          color: "#ffffff",
                          fontSize: 11.25,
                          fontWeight: 500,
                          lineHeight: "normal",
                          letterSpacing: "0.06px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          boxSizing: "border-box",
                          flexShrink: 0,
                          whiteSpace: "nowrap",
                        }}
                      >
                        แก้ไข
                      </button>
                    )}
                  </div>

                  <p
                    style={{
                      margin: 0,
                      paddingBottom: 12,
                      fontSize: 11.5,
                      fontWeight: 300,
                      lineHeight: "normal",
                      letterSpacing: "0.08px",
                      color: "#767168",
                    }}
                  >
                    {formatPollSubtitle(poll)}
                  </p>

                  {poll.options.map((opt) => {
                    const isMine = poll.my_vote_option_id === opt.id;
                    const highlighted = isMine || !!opt.is_winner;
                    const pct = opt.vote_count === 0 ? 0 : (opt.vote_count / maxVotes) * 100;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={closed || votingPollId === poll.id}
                        onClick={() => void handleCastVote(poll.id, opt.id, poll.my_vote_option_id)}
                        style={{
                          width: "100%",
                          background: "none",
                          border: "none",
                          borderTop: "1px solid #e5e1d7",
                          padding: "11px 0 10px",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          cursor: closed ? "default" : "pointer",
                          textAlign: "left",
                          fontFamily: "inherit",
                        }}
                      >
                        <div
                          style={{
                            flex: "1 0 0",
                            minWidth: 0,
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {highlighted && (
                              <span
                                aria-hidden="true"
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: 3,
                                  backgroundColor: "#e85a2c",
                                  flexShrink: 0,
                                }}
                              />
                            )}
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 400,
                                lineHeight: "normal",
                                letterSpacing: "0.08px",
                                color: "#14110d",
                              }}
                            >
                              <span data-user-content>{opt.text}</span>
                            </span>
                          </div>
                          <div
                            style={{
                              width: "100%",
                              height: 4,
                              borderRadius: 2,
                              backgroundColor: "#f2efe8",
                              overflow: "hidden",
                              position: "relative",
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                top: 0,
                                bottom: 0,
                                left: 0,
                                width: opt.vote_count === 0 ? 1 : `${pct}%`,
                                borderRadius: 2,
                                backgroundColor: "#e85a2c",
                                transition: "width 300ms ease",
                              }}
                            />
                          </div>
                        </div>
                        <VoteAvatarStack voters={opt.voters} />
                        <span
                          style={{
                            width: 22,
                            flexShrink: 0,
                            textAlign: "right",
                            fontSize: 11,
                            fontWeight: 300,
                            letterSpacing: "0.08px",
                            color: "#767168",
                            padding: "5.5px 0",
                          }}
                        >
                          {opt.vote_count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      ) : initialTab === "wheel" ? (
        /* Main White Card: แมวสุ่ม / กงล้อสุ่ม (Figma 788:3872 & 666:15742) */
        <section
          aria-label={wheelFunMode ? "แมวสุ่ม" : "กงล้อสุ่ม"}
          onClick={() => setSelectedCatTreatId(null)}
          style={{
            width: "100%",
            height: wheelFunMode ? 450 : undefined,
            minHeight: 450,
            backgroundColor: "#ffffff",
            borderRadius: 14,
            padding: wheelFunMode ? "20px 17px 0" : "20px 17px",
            marginTop: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
            boxSizing: "border-box",
            overflow: wheelFunMode ? "hidden" : "visible",
            position: "relative",
          }}
        >
          {/* Header Row (788:3873 / 666:15743) */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 500,
                lineHeight: "26.4px",
                letterSpacing: "-0.24px",
                color: "#e85a2c",
                whiteSpace: "nowrap",
              }}
            >
              {wheelFunMode ? "แมวสุ่ม" : "กงล้อสุ่ม"}
            </h2>

            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              {/* โหมดแมว Toggle Pill (788:3876) */}
              <button
                type="button"
                aria-pressed={wheelFunMode}
                onClick={(e) => {
                  e.stopPropagation();
                  setWheelFunMode((prev) => !prev);
                }}
                style={{
                  height: 26,
                  padding: "6px 10px",
                  borderRadius: 18,
                  border: "1px solid #e5e1d7",
                  backgroundColor: "#e85a2c",
                  color: "#ffffff",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  cursor: "pointer",
                  boxSizing: "border-box",
                  transition: "opacity 150ms ease",
                }}
              >
                <span
                  style={{
                    fontSize: 11.25,
                    fontWeight: 500,
                    lineHeight: "normal",
                    letterSpacing: "0.06px",
                    color: "#ffffff",
                    whiteSpace: "nowrap",
                  }}
                >
                  โหมดแมว
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 7,
                    backgroundColor: "#ffffff",
                    border: "1px solid #d4cfc2",
                    boxSizing: "border-box",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {wheelFunMode && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2.2 6.2L4.8 8.8L9.8 3.2"
                        stroke="#E85A2C"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
              </button>

              {/* ล้าง Pill Button (788:3881) */}
              <button
                type="button"
                disabled={wheelSpinning || catCupShaking || wheelOptions.length === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  void handleClearWheel();
                }}
                style={{
                  height: 26,
                  padding: "6px 10px",
                  borderRadius: 18,
                  border: "1px solid #e5e1d7",
                  backgroundColor: "#ffffff",
                  color: wheelOptions.length > 0 ? "#767168" : "#b5b0a4",
                  fontSize: 11.25,
                  fontWeight: 500,
                  lineHeight: "normal",
                  letterSpacing: "0.06px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor:
                    wheelSpinning || catCupShaking || wheelOptions.length === 0
                      ? "default"
                      : "pointer",
                  boxSizing: "border-box",
                  whiteSpace: "nowrap",
                }}
              >
                ล้าง
              </button>
            </div>
          </div>

          {wheelFunMode ? (
            /* ─── CAT RANDOM MODE (แมวสุ่ม - Figma 788:3805) ─── */
            <>
              {/* Top Cat Treat Sachet Input + Hint (788:4321) */}
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flexShrink: 0,
                  position: "relative",
                  zIndex: 30,
                }}
              >
                {/* Horizontal Cat Treat Sachet Input (788:4030) */}
                <div
                  style={{
                    position: "relative",
                    width: 325.844,
                    height: 73.654,
                    flexShrink: 0,
                  }}
                >
                  <CatTreatSachet color="#F47B25" width={325.844} height={73.654} />

                  {/* Center White Pill Input + Add Button (788:4038) */}
                  <div
                    style={{
                      position: "absolute",
                      left: 7.99,
                      top: "calc(50% - 0.06px)",
                      transform: "translateY(-50%)",
                      backgroundColor: "#ffffff",
                      borderRadius: 55.047,
                      padding: "0 8.879px",
                      display: "flex",
                      alignItems: "center",
                      gap: 7.103,
                      boxSizing: "border-box",
                    }}
                  >
                    <div
                      style={{
                        width: 210.422,
                        padding: "8.879px 0",
                        display: "flex",
                        alignItems: "center",
                        overflow: "hidden",
                      }}
                    >
                      <input
                        type="text"
                        value={wheelNewText}
                        maxLength={40}
                        disabled={wheelOptions.length >= 20}
                        onChange={(e) => setWheelNewText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void handleAddWheelOption();
                          }
                        }}
                        placeholder="พิมพ์ข้อความเพื่อเพิ่ม"
                        style={{
                          width: "100%",
                          border: "none",
                          outline: "none",
                          background: "transparent",
                          fontSize: 12.43,
                          fontWeight: 400,
                          lineHeight: "normal",
                          color: "#14110d",
                          fontFamily: "inherit",
                        }}
                      />
                    </div>

                    <div style={{ padding: "4.883px 0", flexShrink: 0 }}>
                      <button
                        type="button"
                        disabled={!wheelNewText.trim() || wheelAdding || wheelOptions.length >= 20}
                        onClick={() => void handleAddWheelOption()}
                        style={{
                          backgroundColor: "#14110d",
                          borderRadius: 12.43,
                          padding: "5.327px 8.879px",
                          border: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 7.103,
                          opacity:
                            !wheelNewText.trim() || wheelAdding || wheelOptions.length >= 20
                              ? 0.4
                              : 1,
                          cursor:
                            !wheelNewText.trim() || wheelAdding || wheelOptions.length >= 20
                              ? "default"
                              : "pointer",
                          transition: "opacity 150ms ease, transform 120ms ease",
                        }}
                      >
                        <svg
                          width="13.318"
                          height="13.318"
                          viewBox="0 0 15 15"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                        >
                          <path
                            d="M7.5 3.125V7.5M7.5 7.5V11.875M7.5 7.5H3.125M7.5 7.5H11.875"
                            stroke="#F7F5F0"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span
                          style={{
                            fontSize: 9.988,
                            fontWeight: 500,
                            lineHeight: "normal",
                            letterSpacing: "0.1154px",
                            color: "#f7f5f0",
                            whiteSpace: "nowrap",
                          }}
                        >
                          เพิ่ม
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Hint Below Cat Treat Input (788:3915) */}
                <p
                  style={{
                    margin: 0,
                    height: 21,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: draggingOutsideCup ? 500 : 400,
                    lineHeight: "26.4px",
                    letterSpacing: "-0.24px",
                    color: "#e85a2c",
                    opacity: draggingOutsideCup ? 1 : 0.5,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    transition: "opacity 150ms ease",
                  }}
                >
                  {draggingOutsideCup
                    ? "ปล่อยเพื่อลบแมวเลียออกจากถ้วย!"
                    : "ลากแมวเลียออกจากกล่องเพื่อทิ้ง"}
                </p>
              </div>

              {/* Cup + Cat Treat Sticks Physics Container (788:4319) */}
              <div
                ref={cupContainerRef}
                className={catCupShaking ? "maew-cup-shaking" : undefined}
                style={{
                  position: "relative",
                  width: 225.821,
                  height: 304,
                  flexShrink: 0,
                  userSelect: "none",
                  touchAction: "none",
                }}
              >
                {/* 1. Back Cup Rim / Dark Interior Opening (788:4167) */}
                <svg
                  width="221"
                  height="32"
                  viewBox="0 0 221 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 101,
                    width: 221,
                    height: 32,
                    zIndex: 1,
                    pointerEvents: "none",
                  }}
                >
                  <ellipse cx="110.5" cy="16" rx="110.5" ry="16" fill="#AD5618" />
                </svg>

                {/* 2. Draggable Physics Cat Treat Sticks Inside the Cup */}
                {wheelOptions.map((opt, idx) => {
                  const slot = getCatTreatSlot(idx);
                  const body = catPhysicsRef.current.get(opt.id) ?? {
                    id: opt.id,
                    x: slot.x,
                    y: slot.y,
                    rot: slot.rot,
                    vx: 0,
                    vy: 0,
                    vRot: 0,
                    restX: slot.x,
                    restY: slot.y,
                    restRot: slot.rot,
                    mode: "cup" as const,
                    bounces: 0,
                  };
                  const flavorColor = CAT_TREAT_FLAVORS.includes(opt.color)
                    ? opt.color
                    : CAT_TREAT_FLAVORS[idx % CAT_TREAT_FLAVORS.length];
                  const isSelected = selectedCatTreatId === opt.id;
                  const isDragging = draggingCatTreatId === opt.id;
                  const isOut = isDragging && draggingOutsideCup;

                  return (
                    <div
                      key={opt.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`แมวเลีย ${opt.text}`}
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => handleCatTreatPointerDown(e, opt)}
                      onPointerMove={handleCatTreatPointerMove}
                      onPointerUp={handleCatTreatPointerUp}
                      onPointerCancel={handleCatTreatPointerUp}
                      style={{
                        position: "absolute",
                        left: body.x - 195 / 2,
                        top: body.y - 44.078 / 2,
                        width: 195,
                        height: 44.078,
                        transform: `rotate(${body.rot}deg) scale(${
                          isOut ? 0.92 : isDragging ? 1.06 : isSelected ? 1.03 : 1
                        })`,
                        transformOrigin: "center center",
                        // While actively dragged or flying in from above the rim, render above the front cup wall;
                        // once inside the cup, keep zIndex < 25 so the stick's bottom is tucked inside the cup,
                        // with the selected stick on top of all other sticks inside the cup (zIndex 24).
                        zIndex: isDragging
                          ? 50
                          : body.mode === "dropping" && body.y < 85
                          ? 35
                          : isSelected
                          ? 24
                          : 2 + idx,
                        cursor: isDragging ? "grabbing" : "grab",
                        filter:
                          isDragging || isSelected
                            ? "drop-shadow(0 8px 16px rgba(20, 17, 13, 0.24))"
                            : "drop-shadow(0 2px 4px rgba(20, 17, 13, 0.08))",
                        opacity: isOut ? 0.72 : 1,
                        touchAction: "none",
                      }}
                    >
                      <CatTreatSachet color={flavorColor} width={195} height={44.078} />

                      {/* White Pill Label on Cat Treat Stick (788:4190) */}
                      <div
                        style={{
                          position: "absolute",
                          left: 24.49,
                          top: "calc(50% + 1.1px)",
                          transform: "translateY(-50%)",
                          width: 152.4,
                          height: 19.5,
                          borderRadius: 44.932,
                          backgroundColor: "#ffffff",
                          padding: "1.63px 7.25px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: isSelected || isDragging ? "center" : "flex-end",
                          boxSizing: "border-box",
                          overflow: "hidden",
                          pointerEvents: "none",
                        }}
                      >
                        <span
                          style={{
                            width: isSelected || isDragging ? "100%" : 92,
                            fontSize: 10.146,
                            fontWeight: isSelected || isDragging ? 500 : 400,
                            lineHeight: "normal",
                            color: isOut ? "#e85a2c" : isSelected || isDragging ? "#14110d" : "#757575",
                            opacity: isSelected || isDragging ? 0.95 : 0.65,
                            textAlign: "center",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          <span data-user-content>{isOut ? `ทิ้ง "${opt.text}"` : opt.text}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* 3. Front Cup Wall, Highlight, Rim Collar & "คลิกเพื่อจุ่ม" Button (788:4177, 788:4180, 788:4318, 788:4320) */}
                <button
                  type="button"
                  disabled={catCupShaking || wheelOptions.length === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDrawCatTreat();
                  }}
                  aria-label="คลิกเพื่อจุ่มแมวเลีย"
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 117,
                    width: 221,
                    height: 187,
                    padding: 0,
                    border: "none",
                    background: "transparent",
                    zIndex: 25,
                    cursor:
                      catCupShaking || wheelOptions.length === 0 ? "default" : "pointer",
                  }}
                >
                  {/* Cup Body (788:4177: left 6, top 145 -> relative top 28) */}
                  <div
                    style={{
                      position: "absolute",
                      left: 6,
                      top: 28,
                      width: 209,
                      height: 159,
                      backgroundColor: "#fbb783",
                      borderBottomLeftRadius: 26,
                      borderBottomRightRadius: 26,
                    }}
                  />

                  {/* Cup Right Glossy Highlight (788:4180: left 187.78, top 164 -> relative top 47) */}
                  <svg
                    width="17"
                    height="127"
                    viewBox="0 0 16.719 126.693"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: 187.78,
                      top: 47,
                      width: 16.719,
                      height: 126.693,
                      pointerEvents: "none",
                    }}
                  >
                    <path
                      d="M0 4.5C5.8 3.2 11.4 1.6 16.719 0V126.693H5.2C5.2 84 3.4 42 0 4.5Z"
                      fill="#FCEDE3"
                      fillOpacity="0.85"
                    />
                  </svg>

                  {/* Cup Front Collar / Lip (788:4318 Subtract: left 0, top 117 -> relative top 0, 221 × 40.5) */}
                  <svg
                    width="221"
                    height="40.5"
                    viewBox="0 0 221 40.5"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: 221,
                      height: 40.5,
                      pointerEvents: "none",
                    }}
                  >
                    <path
                      d="M0 0A110.5 16 0 0 0 221 0V24.5A110.5 16 0 0 1 0 24.5V0Z"
                      fill="#EA7824"
                    />
                  </svg>

                  {/* "คลิกเพื่อจุ่ม" Text (788:4320: left 102.91, top 194.32 -> relative top 77.32) */}
                  <span
                    style={{
                      position: "absolute",
                      left: 102.91,
                      top: 77.32,
                      transform: "translate(-50%, -50%)",
                      width: 114,
                      height: 21,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 400,
                      lineHeight: "26.4px",
                      letterSpacing: "-0.24px",
                      color: "#fcede3",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      pointerEvents: "none",
                    }}
                  >
                    {catCupShaking
                      ? "กำลังเขย่าจุ่ม…"
                      : wheelOptions.length === 0
                      ? "เพิ่มแมวเลียก่อนนะ"
                      : "คลิกเพื่อจุ่ม"}
                  </span>
                </button>
              </div>
            </>
          ) : (
            /* ─── CLASSIC SPIN WHEEL MODE (เมื่อไม่ติ๊ก โหมดแมว) ─── */
            <>
              {/* Wheel Section (666:15754) */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                {/* Status Label + Downward Pointer Triangle (666:15755) */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      fontWeight: 500,
                      lineHeight: "normal",
                      letterSpacing: "-0.22px",
                      color:
                        wheelWinnerIdx !== null && wheelOptions[wheelWinnerIdx]
                          ? "#e85a2c"
                          : "#767168",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {wheelSpinning
                      ? "กำลังสุ่ม…"
                      : wheelWinnerIdx !== null && wheelOptions[wheelWinnerIdx]
                      ? `${wheelOptions[wheelWinnerIdx].text} ชนะ!`
                      : "กดเพื่อสุ่มเลย "}
                  </p>
                  <svg
                    width="11.02"
                    height="6.5"
                    viewBox="0 0 11.0197 6.49999"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    style={{ transform: "rotate(180deg)", display: "block" }}
                  >
                    <path d="M5.9144 0L11.0197 6.49999H0L5.9144 0Z" fill="#D9D9D9" />
                  </svg>
                </div>

                {/* 229px Wheel (666:15758) */}
                <div
                  style={{
                    position: "relative",
                    width: WHEEL_SIZE,
                    height: WHEEL_SIZE,
                    flexShrink: 0,
                  }}
                >
                  {wheelOptions.length === 0 ? (
                    <div
                      role="status"
                      aria-label="ยังไม่มีตัวเลือก"
                      style={{
                        width: WHEEL_SIZE,
                        height: WHEEL_SIZE,
                        borderRadius: "50%",
                        backgroundColor: "#f2efe8",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        transform: `rotate(${wheelTotalDeg}deg)`,
                        transition: wheelSpinning
                          ? "transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)"
                          : "none",
                      }}
                    >
                      <svg
                        width={WHEEL_SIZE}
                        height={WHEEL_SIZE}
                        viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
                        style={{ display: "block" }}
                      >
                        {wheelOptions.map((opt, i) => {
                          const n = wheelOptions.length;
                          const seg = 360 / n;
                          const startDeg = i * seg;
                          const endDeg = (i + 1) * seg;
                          const midDeg = startDeg + seg / 2;
                          const midRad = wheelToRad(midDeg);
                          const textR = WHEEL_R * (n <= 2 ? 0.55 : 0.63);
                          const tx = WHEEL_R + textR * Math.cos(midRad);
                          const ty = WHEEL_R + textR * Math.sin(midRad);
                          const maxChars = n <= 4 ? 14 : n <= 8 ? 10 : 7;
                          const label =
                            opt.text.length > maxChars
                              ? `${opt.text.slice(0, maxChars - 1)}…`
                              : opt.text;
                          const color =
                            WHEEL_OPTION_COLORS[i % WHEEL_OPTION_COLORS.length] || opt.color;

                          return (
                            <g
                              key={opt.id}
                              role="button"
                              tabIndex={0}
                              aria-label={pendingWheelDeleteId === opt.id ? `ยืนยันลบ ${opt.text}` : `เลือก ${opt.text} เพื่อลบ`}
                              aria-pressed={pendingWheelDeleteId === opt.id}
                              onClick={() => handleWheelSliceClick(opt.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  handleWheelSliceClick(opt.id);
                                }
                              }}
                              style={{ cursor: wheelSpinning ? "default" : "pointer", outline: "none" }}
                            >
                              {n === 1 ? (
                                <circle cx={WHEEL_R} cy={WHEEL_R} r={WHEEL_R} fill={color} />
                              ) : (
                                <path d={wheelSlicePath(startDeg, endDeg)} fill={color} />
                              )}
                              {pendingWheelDeleteId === opt.id ? (
                                <g pointerEvents="none">
                                  <circle cx={tx} cy={ty} r={13} fill="#ffffff" />
                                  <path d={`M${tx - 5} ${ty - 5}L${tx + 5} ${ty + 5}M${tx + 5} ${ty - 5}L${tx - 5} ${ty + 5}`} stroke="#e85a2c" strokeWidth={2.5} strokeLinecap="round" />
                                </g>
                              ) : (
                                <text
                                  x={tx}
                                  y={ty}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fill="#ffffff"
                                  fontSize={12}
                                  fontFamily="Kanit, sans-serif"
                                  fontWeight={500}
                                  letterSpacing="-0.22px"
                                  transform={`rotate(${midDeg}, ${tx}, ${ty})`}
                                  style={{ pointerEvents: "none", userSelect: "none" }}
                                >
                                  {label}
                                </text>
                              )}
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  )}

                  {/* Center SPIN Button (666:15775 & 666:15776) */}
                  <button
                    type="button"
                    disabled={wheelSpinning || wheelOptions.length === 0}
                    onClick={handleSpinWheel}
                    aria-label="หมุนกงล้อสุ่ม"
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      width: 49,
                      height: 49,
                      borderRadius: "50%",
                      backgroundColor: "#ffffff",
                      border: "none",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor:
                        wheelSpinning || wheelOptions.length === 0 ? "default" : "pointer",
                      zIndex: 5,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        lineHeight: "normal",
                        letterSpacing: "-0.22px",
                        color: "#767168",
                      }}
                    >
                      SPIN
                    </span>
                  </button>
                </div>

                {/* Delete Hint Below Wheel (666:15777) */}
                <p
                  style={{
                    margin: 0,
                    height: 21,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 400,
                    lineHeight: "26.4px",
                    letterSpacing: "-0.24px",
                    color: "#e85a2c",
                    opacity: 0.5,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  {pendingWheelDeleteId ? "กดกากบาทอีกครั้งเพื่อลบคำ" : "กดที่วงล้อเพื่อลบคำ"}
                </p>
              </div>

              {/* Bottom Add Input Row (666:15778) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                }}
              >
                <div
                  style={{
                    flex: "1 0 0",
                    minWidth: 0,
                    borderBottom: "1px solid #e5e1d7",
                    padding: "10px 0",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="text"
                    value={wheelNewText}
                    maxLength={40}
                    disabled={wheelOptions.length >= 20}
                    onChange={(e) => setWheelNewText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleAddWheelOption();
                      }
                    }}
                    placeholder="พิมพ์ข้อความเพื่อเพิ่ม (เพิ่มได้สูงสุด 20 คำ)"
                    style={{
                      width: "100%",
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontSize: 14,
                      fontWeight: 400,
                      lineHeight: "normal",
                      color: "#14110d",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <div style={{ padding: "5.5px 0", flexShrink: 0 }}>
                  <button
                    type="button"
                    disabled={!wheelNewText.trim() || wheelAdding || wheelOptions.length >= 20}
                    onClick={() => void handleAddWheelOption()}
                    style={{
                      backgroundColor: "#14110d",
                      borderRadius: 14,
                      padding: "6px 10px",
                      border: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      opacity:
                        !wheelNewText.trim() || wheelAdding || wheelOptions.length >= 20
                          ? 0.4
                          : 1,
                      cursor:
                        !wheelNewText.trim() || wheelAdding || wheelOptions.length >= 20
                          ? "default"
                          : "pointer",
                      transition: "opacity 150ms ease",
                    }}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 15 15"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M7.5 3.125V7.5M7.5 7.5V11.875M7.5 7.5H3.125M7.5 7.5H11.875"
                        stroke="#F7F5F0"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span
                      style={{
                        fontSize: 11.25,
                        fontWeight: 500,
                        lineHeight: "normal",
                        letterSpacing: "0.13px",
                        color: "#f7f5f0",
                        whiteSpace: "nowrap",
                      }}
                    >
                      เพิ่ม
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      ) : (
        /* Main White Card: อีเวนท์ (Figma 625:7699 & 660:8055) */
        <section
          aria-label="อีเวนท์"
          style={{
            width: "100%",
            minHeight: 441,
            backgroundColor: "#ffffff",
            borderRadius: 14,
            padding: "20px 17px",
            marginTop: 10,
            display: "flex",
            flexDirection: "column",
            gap: 20,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 500,
                lineHeight: "26.4px",
                letterSpacing: "-0.24px",
                color: "#e85a2c",
              }}
            >
              อีเวนท์
            </h2>

            {/* ประเภท Filter Pill */}
            <MaewDropdown
              ariaLabel="กรองสถานะอีเวนท์"
              value={eventFilter}
              displayLabel={selectedFilterLabel}
              options={EVENT_FILTER_OPTIONS.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
              onChange={(val) =>
                setEventFilter(val as "all" | "running" | "not_started")
              }
              minMenuWidth={136}
            />
          </div>

          {/* Event Cards List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
            {visiblePresets.map((preset) => {
              const running = isPresetRunning(preset);
              return (
                <div
                  key={preset.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openEventDetailsSheet(preset)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openEventDetailsSheet(preset);
                    }
                  }}
                  style={{
                    width: "100%",
                    backgroundColor: "#ffffff",
                    border: "1px solid #d9d9d9",
                    borderRadius: 14,
                    padding: "15px 17px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 20,
                    cursor: "pointer",
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: 5,
                      width: "100%",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 15 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 18,
                          fontWeight: 500,
                          lineHeight: "normal",
                          letterSpacing: "-0.22px",
                          color: "#14110d",
                        }}
                      >
                        {preset.title}
                      </p>

                      <span
                        style={{
                          height: 26,
                          padding: "6px 10px",
                          borderRadius: 18,
                          border: "1px solid #e5e1d7",
                          backgroundColor: running ? "#2e8b5c" : "#d9d9d9",
                          color: "#ffffff",
                          fontSize: 11.25,
                          fontWeight: 500,
                          lineHeight: 1,
                          letterSpacing: "0.06px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxSizing: "border-box",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {running ? "กำลังดำเนิน" : "ยังไม่เริ่ม"}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        fontWeight: 300,
                        lineHeight: "18px",
                        letterSpacing: "0.08px",
                        color: "#767168",
                      }}
                    >
                      {preset.shortDesc}
                    </p>
                  </div>

                  {running && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openYourColorSheet(preset);
                      }}
                      style={{
                        height: 26,
                        padding: "6px 10px",
                        borderRadius: 18,
                        border: "1px solid #e5e1d7",
                        backgroundColor: "#e85a2c",
                        color: "#ffffff",
                        fontSize: 11.25,
                        fontWeight: 500,
                        lineHeight: 1,
                        letterSpacing: "0.06px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxSizing: "border-box",
                      }}
                    >
                      กดเพื่อดูสีของคุณ
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      </div>

      {/* Hidden multi-file input for 9-photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={handleFilesSelected}
      />

      {/* Bottom Navigation Bar */}
      <HomeBottomNav />

      {/* Event Slide-Up Bottom Sheet (Figma 660:7715, 666:16309, 660:8173, 666:16482, 660:8194, 666:16498) */}
      {activePreset && (
        <div
          className={`maew-plan-modal-backdrop${sheetClosing ? " is-closing" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-sheet-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeSheet();
          }}
        >
          <div
            className={`maew-plan-modal-sheet${sheetClosing ? " is-closing" : ""}`}
            style={{
              backgroundColor: "#f7f5f0",
              borderTopLeftRadius: 25,
              borderTopRightRadius: 25,
              padding: "34px 20px 28px",
              display: "flex",
              flexDirection: "column",
              gap: 15,
            }}
          >
            {/* Top Drag Pill */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 11,
                left: "50%",
                transform: "translateX(-50%)",
                width: 139,
                height: 5,
                borderRadius: 100,
                backgroundColor: "rgba(0, 0, 0, 0.25)",
              }}
            />

            {/* Header: Event Title + Close Button */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                height: 36,
              }}
            >
              <h2
                id="event-sheet-title"
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 500,
                  color: "#14110d",
                  letterSpacing: "0.08px",
                }}
              >
                {activePreset.title}
              </h2>

              <button
                type="button"
                aria-label="ปิดหน้าต่างอีเวนท์"
                onClick={closeSheet}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SheetCloseIcon />
              </button>
            </div>

            {/* Step 1: Event Details (Figma 660:7715 for Organizer / 666:16309 for Participant) */}
            {sheetStep === "details" && (
              <>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    fontWeight: 400,
                    lineHeight: 1.5,
                    color: "#767168",
                    letterSpacing: "0.08px",
                  }}
                >
                  {activePreset.detailDescription}
                </p>

                <div
                  style={{
                    width: "100%",
                    aspectRatio: "362 / 241",
                    position: "relative",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={activePreset.bannerImage}
                      alt={activePreset.title}
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "-26.71%",
                        width: "100%",
                        height: "172.05%",
                        maxWidth: "none",
                        display: "block",
                      }}
                    />
                  </div>
                  <img
                    src="/images/figma-color-hunt-sitting-cat.svg"
                    alt=""
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: "75.14%",
                      top: "59.75%",
                      width: "29.83%",
                      height: "46.91%",
                      maxWidth: "none",
                      display: "block",
                      pointerEvents: "none",
                    }}
                  />
                </div>

                <h3
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 500,
                    color: "#14110d",
                    letterSpacing: "0.08px",
                  }}
                >
                  โจทย์
                </h3>

                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    fontWeight: 400,
                    lineHeight: 1.5,
                    color: "#767168",
                    letterSpacing: "0.08px",
                  }}
                >
                  {activePreset.challengeText}
                </p>

                {isPresetRunning(activePreset) ? (
                  <button
                    type="button"
                    onClick={() => openYourColorSheet(activePreset)}
                    style={{
                      width: "100%",
                      height: 51,
                      borderRadius: 59,
                      border: "1px solid #e5e1d7",
                      backgroundColor: "#e85a2c",
                      color: "#fcede3",
                      fontSize: 16,
                      fontWeight: 500,
                      letterSpacing: "0.08px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    กดเพื่อดูสีของคุณ
                  </button>
                ) : isOrganizer || canStartEvents ? (
                  <button
                    type="button"
                    disabled={startingEvent}
                    onClick={() => void handleStartEvent()}
                    style={{
                      width: "100%",
                      height: 51,
                      borderRadius: 59,
                      border: "1px solid #e5e1d7",
                      backgroundColor: "#e85a2c",
                      color: "#fcede3",
                      fontSize: 16,
                      fontWeight: 500,
                      letterSpacing: "0.08px",
                      cursor: startingEvent ? "wait" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {startingEvent ? "กำลังเริ่มอีเวนท์…" : "เริ่มอีเวนท์"}
                  </button>
                ) : (
                  <p
                    style={{
                      margin: "4px 0 0",
                      width: "100%",
                      textAlign: "center",
                      fontSize: 16,
                      fontWeight: 500,
                      color: "#d96843",
                      letterSpacing: "0.08px",
                    }}
                  >
                    บอกให้คนจัดทริปกดเริ่มอีเวนท์ เพื่อเริ่มอีเวนท์
                  </p>
                )}
              </>
            )}

            {/* Step 2: Your Color (Figma 660:8173 & 666:16482) */}
            {sheetStep === "your_color" && (
              <>
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "362 / 241",
                    borderRadius: 10,
                    position: "relative",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src="/images/figma-color-hunt-field.png"
                    alt=""
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: 10,
                      display: "block",
                      pointerEvents: "none",
                    }}
                  />
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 10,
                      backgroundColor: assignedColor.hex,
                      mixBlendMode: "hue",
                      pointerEvents: "none",
                    }}
                  />
                  {assignedColor.showCat !== false && <img
                    src="/images/figma-color-hunt-dancing-cat.svg"
                    alt=""
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: "36.19%",
                      top: "22.82%",
                      width: "32.87%",
                      height: "54.65%",
                      maxWidth: "none",
                      display: "block",
                      pointerEvents: "none",
                    }}
                  />}
                </div>

                <p
                  style={{
                    margin: 0,
                    width: "100%",
                    textAlign: "center",
                    fontSize: 20,
                    fontWeight: 500,
                    color: "#14110d",
                    letterSpacing: "0.08px",
                  }}
                >
                  สีของคุณคือ {assignedColor.name}
                </p>

                <button
                  type="button"
                  disabled={uploadingPhotos}
                  onClick={handleTriggerUploadClick}
                  style={{
                    width: "100%",
                    height: 51,
                    borderRadius: 59,
                    border: "1px solid #e5e1d7",
                    backgroundColor: "#e85a2c",
                    color: "#fcede3",
                    fontSize: 16,
                    fontWeight: 500,
                    letterSpacing: "0.08px",
                    cursor: uploadingPhotos ? "wait" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {uploadingPhotos ? "กำลังอัปโหลด…" : "อัปโหลดรูป 9 รูป"}
                </button>
              </>
            )}

            {/* Step 3: Finish Color 9-Photo Grid (Figma 660:8194 & 666:16498) */}
            {sheetStep === "finish_color" && (
              <>
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "362 / 453",
                    borderRadius: 10,
                    overflow: "hidden",
                    position: "relative",
                    backgroundColor: "#14110d",
                  }}
                >
                  {uploadedPreviewUrls.length > 0 ? (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gridTemplateRows: "repeat(3, 1fr)",
                        width: "100%",
                        height: "100%",
                      }}
                    >
                      {Array.from(
                        { length: 9 },
                        (_, idx) => uploadedPreviewUrls[idx % uploadedPreviewUrls.length]
                      ).map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`รูปที่ ${idx + 1}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <img
                      src={activePreset.defaultFinishGridImage}
                      alt="ตารางภาพ 9 รูปของคุณ"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  )}
                </div>

                <p
                  style={{
                    margin: 0,
                    width: "100%",
                    textAlign: "center",
                    fontSize: 20,
                    fontWeight: 500,
                    color: "#14110d",
                    letterSpacing: "0.08px",
                  }}
                >
                  นี่คือรูปของคุณ!!
                </p>

                <button
                  type="button"
                  onClick={() => void handleDownloadGridImage()}
                  style={{
                    width: "100%",
                    height: 51,
                    borderRadius: 59,
                    border: "1px solid #e5e1d7",
                    backgroundColor: "#e85a2c",
                    color: "#fcede3",
                    fontSize: 16,
                    fontWeight: 500,
                    letterSpacing: "0.08px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ดาวน์โหลดรูปเล๊ย
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {/* Add / Edit Vote Sheet (Figma 660:8393 & 660:8535) */}
      {pollModalMode && (
        <div
          className={`maew-plan-modal-backdrop${pollModalClosing ? " is-closing" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="poll-sheet-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closePollModal();
          }}
        >
          <div
            className={`maew-plan-modal-sheet${pollModalClosing ? " is-closing" : ""}`}
            style={{
              backgroundColor: "#f7f5f0",
              borderTopLeftRadius: 25,
              borderTopRightRadius: 25,
              padding: "34px 20px calc(28px + env(safe-area-inset-bottom))",
              display: "flex",
              flexDirection: "column",
              gap: 15,
              maxHeight: "92vh",
              overflowY: "auto",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 11,
                left: "50%",
                transform: "translateX(-50%)",
                width: 139,
                height: 5,
                borderRadius: 100,
                backgroundColor: "rgba(0, 0, 0, 0.25)",
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                height: 36,
              }}
            >
              <h2
                id="poll-sheet-title"
                style={{ margin: 0, fontSize: 20, fontWeight: 500, color: "#14110d", letterSpacing: "0.08px" }}
              >
                {pollModalMode === "edit" ? "แก้ไขโหวต" : "เพิ่มโหวต"}
              </h2>
              <button
                type="button"
                aria-label="ปิดหน้าต่างโหวต"
                onClick={closePollModal}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SheetCloseIcon />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: 15, fontWeight: 500, lineHeight: "26.4px", letterSpacing: "-0.24px", color: "#d96843" }}>
              ชื่อโหวต
            </p>
            <input
              type="text"
              value={pollFormTitle}
              onChange={(e) => { setPollFormTitle(e.target.value); setPollFormError(""); }}
              placeholder="ชื่อการโหวต"
              style={{
                width: "100%",
                height: 52,
                borderRadius: 18,
                border: "1px solid #e5e1d7",
                backgroundColor: "#ffffff",
                padding: "15px 20px",
                fontSize: 12,
                fontWeight: 300,
                color: "#14110d",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />

            <p style={{ margin: 0, fontSize: 15, fontWeight: 500, lineHeight: "26.4px", letterSpacing: "-0.24px", color: "#d96843" }}>
              เพิ่มตัวเลือกได้เลย
            </p>

            <div
              style={{
                width: "100%",
                backgroundColor: "#ffffff",
                border: "1px solid #e5e1d7",
                borderRadius: 14,
                padding: "20px 17px",
                display: "flex",
                flexDirection: "column",
                gap: 20,
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", gap: 5, height: 48, width: "100%" }}>
                <input
                  type="text"
                  value={pollFormOptionDraft}
                  onChange={(e) => { setPollFormOptionDraft(e.target.value); setPollFormError(""); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddDraftPollOption();
                    }
                  }}
                  placeholder="เพิ่มตัวเลือกได้เลย"
                  style={{
                    flex: "1 0 0",
                    minWidth: 0,
                    height: "100%",
                    borderRadius: 12,
                    border: "1px solid #e5e1d7",
                    backgroundColor: "#ffffff",
                    padding: "15px 20px",
                    fontSize: 12,
                    fontWeight: 300,
                    color: "#14110d",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddDraftPollOption}
                  disabled={!pollFormOptionDraft.trim()}
                  style={{
                    width: 47,
                    height: "100%",
                    borderRadius: 10,
                    border: "1px solid #e5e1d7",
                    backgroundColor: "#e85a2c",
                    color: "#fcede3",
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: "0.08px",
                    cursor: pollFormOptionDraft.trim() ? "pointer" : "default",
                    opacity: pollFormOptionDraft.trim() ? 1 : 0.6,
                    padding: 10,
                    boxSizing: "border-box",
                    flexShrink: 0,
                  }}
                >
                  เพิ่ม
                </button>
              </div>

              {pollFormOptions.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 11, width: "100%" }}>
                  {pollFormOptions.map((opt, idx) => (
                    <div key={`${opt.id ?? "new"}-${idx}`} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                      <input
                        type="text"
                        aria-label={`ตัวเลือกโหวต ${idx + 1}`}
                        value={opt.text}
                        onChange={(e) => {
                          const text = e.target.value;
                          setPollFormOptions((prev) => prev.map((entry, i) => i === idx ? { ...entry, text } : entry));
                          setPollFormError("");
                        }}
                        className="maew-option-edit-input"
                      />
                      <button
                        type="button"
                        aria-label={`ลบตัวเลือก ${opt.text || `ลำดับ ${idx + 1}`}`}
                        onClick={() => handleRemoveDraftPollOption(idx)}
                        className="maew-option-remove-button"
                      >
                        <OptionRemoveCrossIcon />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {pollFormError && <p role="alert" className="maew-plan-modal-error">{pollFormError}</p>}

            <button
              type="button"
              disabled={
                savingPoll ||
                !pollFormTitle.trim() ||
                pollFormOptions.length + (pollFormOptionDraft.trim() ? 1 : 0) === 0 ||
                pollFormOptions.some((option) => !option.text.trim())
              }
              onClick={() => void handleSubmitPollModal()}
              style={{
                width: "100%",
                height: 51,
                borderRadius: 59,
                border: "1px solid #e5e1d7",
                backgroundColor: "#e85a2c",
                color: "#fcede3",
                fontSize: 16,
                fontWeight: 500,
                letterSpacing: "0.08px",
                cursor: savingPoll ? "wait" : "pointer",
                opacity:
                  !pollFormTitle.trim() ||
                  pollFormOptions.length + (pollFormOptionDraft.trim() ? 1 : 0) === 0 ||
                  pollFormOptions.some((option) => !option.text.trim())
                    ? 0.5
                    : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {savingPoll ? "กำลังบันทึก…" : pollModalMode === "edit" ? "บันทึก" : "เพิ่มโหวต"}
            </button>
          </div>
        </div>
      )}
      {/* Add / Edit Checklist Sheet (Figma 666:16329) */}
      {checklistModalMode && (
        <div
          className={`maew-plan-modal-backdrop${checklistModalClosing ? " is-closing" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="checklist-sheet-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeChecklistModal();
          }}
        >
          <div
            className={`maew-plan-modal-sheet${checklistModalClosing ? " is-closing" : ""}`}
            style={{
              backgroundColor: "#f7f5f0",
              borderTopLeftRadius: 25,
              borderTopRightRadius: 25,
              padding: "34px 20px calc(28px + env(safe-area-inset-bottom))",
              display: "flex",
              flexDirection: "column",
              gap: 15,
              maxHeight: "92vh",
              overflowY: "auto",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 11,
                left: "50%",
                transform: "translateX(-50%)",
                width: 139,
                height: 5,
                borderRadius: 100,
                backgroundColor: "rgba(0, 0, 0, 0.25)",
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                height: 36,
              }}
            >
              <h2
                id="checklist-sheet-title"
                style={{ margin: 0, fontSize: 20, fontWeight: 500, color: "#14110d", letterSpacing: "0.08px" }}
              >
                {checklistModalMode === "edit" ? "แก้ไขเช็คลิสต์" : "เพิ่มเช็คลิสต์"}
              </h2>
              <button
                type="button"
                aria-label="ปิดหน้าต่างเช็คลิสต์"
                onClick={closeChecklistModal}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SheetCloseIcon />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: 15, fontWeight: 500, lineHeight: "26.4px", letterSpacing: "-0.24px", color: "#d96843" }}>
              เพิ่มรายการได้เลย
            </p>

            <div
              style={{
                width: "100%",
                backgroundColor: "#ffffff",
                border: "1px solid #e5e1d7",
                borderRadius: 14,
                padding: "20px 17px",
                display: "flex",
                flexDirection: "column",
                gap: 20,
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", gap: 5, height: 48, width: "100%" }}>
                <input
                  type="text"
                  value={checklistDraft}
                  onChange={(e) => { setChecklistDraft(e.target.value); setChecklistError(""); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddDraftChecklistItem();
                    }
                  }}
                  placeholder="พิมพ์รายการเช็คลิสต์"
                  style={{
                    flex: "1 0 0",
                    minWidth: 0,
                    height: "100%",
                    borderRadius: 12,
                    border: "1px solid #e5e1d7",
                    backgroundColor: "#ffffff",
                    padding: "15px 20px",
                    fontSize: 12,
                    fontWeight: 300,
                    color: "#14110d",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddDraftChecklistItem}
                  disabled={!checklistDraft.trim()}
                  style={{
                    width: 47,
                    height: "100%",
                    borderRadius: 10,
                    border: "1px solid #e5e1d7",
                    backgroundColor: "#e85a2c",
                    color: "#fcede3",
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: "0.08px",
                    cursor: checklistDraft.trim() ? "pointer" : "default",
                    opacity: checklistDraft.trim() ? 1 : 0.6,
                    padding: 10,
                    boxSizing: "border-box",
                    flexShrink: 0,
                  }}
                >
                  เพิ่ม
                </button>
              </div>

              {checklistFormItems.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 11, width: "100%" }}>
                  {checklistFormItems.map((item, idx) => (
                    <div key={`${item.id ?? "new"}-${idx}`} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                      <input
                        type="text"
                        aria-label={`รายการเช็คลิสต์ ${idx + 1}`}
                        value={item.text}
                        onChange={(e) => {
                          const text = e.target.value;
                          setChecklistFormItems((prev) => prev.map((entry, i) => i === idx ? { ...entry, text } : entry));
                          setChecklistError("");
                        }}
                        className="maew-checklist-edit-input"
                        style={{
                          flex: "1 1 auto",
                          minWidth: 0,
                          height: 44,
                          borderRadius: 12,
                          border: "1px solid #e5e1d7",
                          backgroundColor: "#ffffff",
                          padding: "10px 16px",
                          fontSize: 12,
                          fontWeight: 300,
                          letterSpacing: "0.08px",
                          color: "#14110d",
                          boxSizing: "border-box",
                          fontFamily: "inherit",
                        }}
                      />
                      <button
                        type="button"
                        aria-label={`ลบ ${item.text || `รายการ ${idx + 1}`}`}
                        onClick={() => setChecklistFormItems((prev) => prev.filter((_, i) => i !== idx))}
                        style={{ width: 24, height: 44, background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                      >
                        <OptionRemoveCrossIcon />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {checklistError && <p role="alert" className="maew-plan-modal-error">{checklistError}</p>}

            <button
              type="button"
              disabled={savingChecklist}
              onClick={() => void handleSubmitChecklistModal()}
              style={{
                width: "100%",
                height: 51,
                borderRadius: 59,
                border: "1px solid #e5e1d7",
                backgroundColor: "#e85a2c",
                color: "#fcede3",
                fontSize: 16,
                fontWeight: 500,
                letterSpacing: "0.08px",
                cursor: savingChecklist ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {savingChecklist
                ? "กำลังบันทึก…"
                : checklistModalMode === "edit"
                ? "บันทึก"
                : "เพิ่มเช็คลิสต์"}
            </button>
          </div>
        </div>
      )}

      {/* Drawn Cat Treat Popup Modal (ป็อปอัพแมวเลียแสดง 1 อัน ประกอบด้วยปุ่ม ตกลง และลบทิ้ง) */}
      {drawnCatTreat && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="maew-cat-draw-popup-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDrawnCatTreat(null);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 90,
            backgroundColor: "rgba(20, 17, 13, 0.52)",
            backdropFilter: "blur(3px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            className="maew-cat-popup-card"
            style={{
              width: "min(352px, calc(100vw - 36px))",
              backgroundColor: "#f7f5f0",
              borderRadius: 24,
              padding: "24px 20px 20px",
              boxShadow: "0 20px 48px rgba(20, 17, 13, 0.28)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                textAlign: "center",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 400,
                  color: "#767168",
                  letterSpacing: "0.06px",
                }}
              >
                เหมียวจุ่มได้แล้ว!
              </span>
              <h3
                id="maew-cat-draw-popup-title"
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 500,
                  lineHeight: "26.4px",
                  letterSpacing: "-0.24px",
                  color: "#e85a2c",
                }}
              >
                แมวเลียที่คุณสุ่มได้
              </h3>
            </div>

            {/* Single Drawn Cat Treat Sachet (แมวเลีย 1 อัน) */}
            <div
              className="maew-cat-popup-treat"
              style={{
                position: "relative",
                width: 312,
                height: 70.5,
                maxWidth: "100%",
                filter: "drop-shadow(0 10px 20px rgba(20, 17, 13, 0.18))",
                margin: "6px 0",
              }}
            >
              <CatTreatSachet
                color={drawnCatTreat.flavorColor}
                width={312}
                height={70.5}
              />
              <div
                style={{
                  position: "absolute",
                  left: 16,
                  right: 26,
                  top: "50%",
                  transform: "translateY(-50%)",
                  height: 38,
                  borderRadius: 55,
                  backgroundColor: "#ffffff",
                  padding: "0 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxSizing: "border-box",
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 500,
                    color: "#14110d",
                    letterSpacing: "0.06px",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "100%",
                  }}
                >
                  <span data-user-content>{drawnCatTreat.text}</span>
                </span>
              </div>
            </div>

            {/* Action Buttons: ลบทิ้ง & ตกลง */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  const idToRemove = drawnCatTreat.id;
                  setDrawnCatTreat(null);
                  void handleDeleteWheelSlice(idToRemove);
                }}
                style={{
                  flex: "1 0 0",
                  height: 46,
                  borderRadius: 59,
                  border: "1px solid #e5e1d7",
                  backgroundColor: "#ffffff",
                  color: "#767168",
                  fontSize: 15,
                  fontWeight: 500,
                  letterSpacing: "0.08px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ลบทิ้ง
              </button>

              <button
                type="button"
                onClick={() => setDrawnCatTreat(null)}
                style={{
                  flex: "1 0 0",
                  height: 46,
                  borderRadius: 59,
                  border: "1px solid #e5e1d7",
                  backgroundColor: "#e85a2c",
                  color: "#fcede3",
                  fontSize: 15,
                  fontWeight: 500,
                  letterSpacing: "0.08px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

