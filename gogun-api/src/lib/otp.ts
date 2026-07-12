const store = new Map<string, { code: string; expires: number }>()

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function setOtp(phone: string, code: string): void {
  store.set(phone, { code, expires: Date.now() + 5 * 60 * 1000 })
}

export function verifyOtp(phone: string, code: string): boolean {
  const entry = store.get(phone)
  if (!entry) return false
  if (Date.now() > entry.expires) {
    store.delete(phone)
    return false
  }
  if (entry.code !== code) return false
  store.delete(phone)
  return true
}
