"use client"

import { useCallback, useEffect, useState } from "react"
import { ApiError } from "./api"

export function loadErrorMessage(e: unknown): string {
  if (e instanceof ApiError) return "โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
  return "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่"
}

/**
 * รัน loader ใน useEffect พร้อมจัดการ loading / error / retry ให้
 * — ใช้แทน pattern `load().catch(console.error).finally(...)` เดิมทุกหน้า
 * deps ต้องเป็นค่า primitive (string/number/boolean/null) เพราะใช้ JSON key เทียบ
 */
export function useLoad(load: () => Promise<void>, deps: readonly unknown[]) {
  const key = JSON.stringify(deps)
  const [state, setState] = useState({
    key,
    attempt: 0,
    loading: true,
    error: null as string | null,
  })

  // deps เปลี่ยนโดยไม่ remount (เช่นสลับ trip) → รีเซ็ตเป็นสถานะกำลังโหลดตั้งแต่ render นี้
  if (state.key !== key) {
    setState({ key, attempt: 0, loading: true, error: null })
  }

  useEffect(() => {
    let cancelled = false
    load()
      .then(() => {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: null }))
      })
      .catch((e) => {
        console.error(e)
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: loadErrorMessage(e) }))
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, state.attempt])

  const retry = useCallback(() => {
    setState((s) => ({ ...s, attempt: s.attempt + 1, loading: true, error: null }))
  }, [])

  return { loading: state.loading, error: state.error, retry }
}

/**
 * สำหรับ action (save/delete/vote ฯลฯ) ที่ล้มเหลว — แจ้งผู้ใช้แทนการกลืนเงียบ
 * 401 ไม่ต้องแจ้งเพราะ api client redirect ไป /login ให้แล้ว
 */
export function notifyError(e: unknown, message = "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง") {
  console.error(e)
  if (e instanceof ApiError && e.status === 401) return
  if (typeof window !== "undefined") window.alert(message)
}
