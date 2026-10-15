export type GradeLevel = 'ม.1' | 'ม.2' | 'ม.3' | 'ม.4' | 'ม.5' | 'ม.6'
export type EducationLevel = 'มัธยมศึกษาตอนต้น' | 'มัธยมศึกษาตอนปลาย'

export type UserProfile = {
  id: string
  name: string
  grade: GradeLevel
  level: EducationLevel
  createdAt: string
  lastActiveAt: string
}

export type ProgressData = {
  completedLessons: string[]
  bookmarks: string[]
  xp: number
  streak: number
  exerciseCorrect: number
  exerciseTotal: number
  assessmentScore?: number
}

export type SavePayload = {
  version: 1
  app: 'CommuMathy'
  exportedAt: string
  user: UserProfile
  progress: ProgressData
  settings: Record<string, unknown>
  recentPerformance?: unknown[]
  history?: unknown[]
}

export type SecureSaveEnvelope = {
  format: 'commumathy-secure-save'
  version: 1
  exportedAt: string
  userName: string
  userGrade: string
  checksum: string
  payload: string
}

const SALT = 'commumathy_antihack_signature_salt_2026@secure'
const USER_KEY = 'commumathy-user'
const PROGRESS_KEY = 'commumathy-progress'
const SETTINGS_KEY = 'commumathy-settings'
const PERFORMANCE_KEY = 'commumathy-exercise-performance-v2'
const HISTORY_KEY = 'commumathy-exercise-sessions-v2'
let userIdCounter = 1;

function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount))
}

export function sha256Sync(ascii: string): string {
  let result = ''
  const words: number[] = []
  const asciiBitLength = ascii.length * 8
  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]

  for (let i = 0; i < ascii.length; i += 1) {
    words[i >> 2] |= ascii.charCodeAt(i) << (24 - (i % 4) * 8)
  }
  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32))
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength

  const w = new Array<number>(64)
  for (let i = 0; i < words.length; i += 16) {
    const a = [...hash]
    for (let j = 0; j < 64; j += 1) {
      if (j < 16) {
        w[j] = words[i + j] || 0
      } else {
        const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3)
        const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10)
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0
      }
      const ch = (a[4] & a[5]) ^ (~a[4] & a[6])
      const maj = (a[0] & a[1]) ^ (a[0] & a[2]) ^ (a[1] & a[2])
      const temp1 = (a[7] + (rightRotate(a[4], 6) ^ rightRotate(a[4], 11) ^ rightRotate(a[4], 25)) + ch + k[j] + w[j]) | 0
      const temp2 = ((rightRotate(a[0], 2) ^ rightRotate(a[0], 13) ^ rightRotate(a[0], 22)) + maj) | 0
      a[7] = a[6]
      a[6] = a[5]
      a[5] = a[4]
      a[4] = (a[3] + temp1) | 0
      a[3] = a[2]
      a[2] = a[1]
      a[1] = a[0]
      a[0] = (temp1 + temp2) | 0
    }
    for (let j = 0; j < 8; j += 1) hash[j] = (hash[j] + a[j]) | 0
  }

  for (let i = 0; i < 8; i += 1) {
    result += ('00000000' + (hash[i] >>> 0).toString(16)).slice(-8)
  }
  return result
}

export function sha256Utf8(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return sha256Sync(binary)
}

function xorCipher(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) {
    const xorVal = bytes[i] ^ SALT.charCodeAt(i % SALT.length)
    binary += String.fromCharCode(xorVal)
  }
  return btoa(binary)
}

function xorDecipher(base64Str: string): string {
  const binary = atob(base64Str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i) ^ SALT.charCodeAt(i % SALT.length)
  }
  return new TextDecoder().decode(bytes)
}

export function determineLevel(grade: GradeLevel): EducationLevel {
  return ['ม.1', 'ม.2', 'ม.3'].includes(grade) ? 'มัธยมศึกษาตอนต้น' : 'มัธยมศึกษาตอนปลาย'
}

export function getUserInitials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return 'CM'
  const parts = trimmed.split(/\s+/)
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0].slice(0, 1) + parts[1].slice(0, 1))
  }
  return trimmed.slice(0, 2)
}

export function createNewUser(name: string, grade: GradeLevel): UserProfile {
  const now = new Date().toISOString()
  // Deterministic user ID using incremental counter
  const id = `user-${userIdCounter++}`;
  return {
    id,
    name: name.trim() || 'นักเรียน',
    grade,
    level: determineLevel(grade),
    createdAt: now,
    lastActiveAt: now,
  };
}

export function getStoredUser(): UserProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as UserProfile) : null
  } catch {
    return null
  }
}

export function saveStoredUser(user: UserProfile | null): void {
  if (typeof window === 'undefined') return
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify({ ...user, lastActiveAt: new Date().toISOString() }))
  } else {
    localStorage.removeItem(USER_KEY)
  }
}

export function buildSavePayload(user: UserProfile, progress: ProgressData, settings: Record<string, unknown>): SavePayload {
  let performance: unknown[] = []
  let history: unknown[] = []
  if (typeof window !== 'undefined') {
    try { performance = JSON.parse(localStorage.getItem(PERFORMANCE_KEY) ?? '[]') } catch { performance = [] }
    try { history = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') } catch { history = [] }
  }

  return {
    version: 1,
    app: 'CommuMathy',
    exportedAt: new Date().toISOString(),
    user,
    progress,
    settings,
    recentPerformance: performance,
    history,
  }
}

export function createEncryptedSaveString(savePayload: SavePayload): string {
  const jsonStr = JSON.stringify(savePayload)
  const checksum = sha256Utf8(`${SALT}::${jsonStr}::${SALT}`)
  const encrypted = xorCipher(jsonStr)

  const envelope: SecureSaveEnvelope = {
    format: 'commumathy-secure-save',
    version: 1,
    exportedAt: savePayload.exportedAt,
    userName: savePayload.user.name,
    userGrade: savePayload.user.grade,
    checksum,
    payload: encrypted,
  }

  return JSON.stringify(envelope, null, 2)
}

export function exportSaveFile(user: UserProfile, progress: ProgressData, settings: Record<string, unknown>): void {
  const payload = buildSavePayload(user, progress, settings)
  const saveText = createEncryptedSaveString(payload)
  const blob = new Blob([saveText], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const dateStr = new Date().toISOString().slice(0, 10)
  const safeName = user.name.replace(/[^a-zA-Z0-9ก-๙_-]/g, '_') || 'user'
  const fileName = `commumathy_save_${safeName}_${user.grade}_${dateStr}.cmmathy`

  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export type ParseSaveResult =
  | { success: true; payload: SavePayload; isSecure: boolean }
  | { success: false; error: string }

export function parseSaveFileContent(content: string): ParseSaveResult {
  try {
    const raw = JSON.parse(content)

    // Check if it's the secure encrypted envelope
    if (raw && raw.format === 'commumathy-secure-save' && typeof raw.payload === 'string') {
      const envelope = raw as SecureSaveEnvelope
      let decrypted = ''
      try {
        decrypted = xorDecipher(envelope.payload)
      } catch {
        return { success: false, error: 'ไม่สามารถถอดรหัสข้อมูลในไฟล์บันทึกได้ โครงสร้างไฟล์เสียหาย' }
      }

      // Anti-tamper verification
      const expectedChecksum = sha256Utf8(`${SALT}::${decrypted}::${SALT}`)
      if (expectedChecksum !== envelope.checksum) {
        return {
          success: false,
          error: 'ตรวจพบว่าข้อมูลในไฟล์ถูกดัดแปลงแก้ไข (Invalid Anti-Tamper Signature) ระบบไม่อนุญาตให้นำเข้าไฟล์ที่ถูกแก้ไขสถิติ',
        }
      }

      const payload = JSON.parse(decrypted) as SavePayload
      if (!payload.user || !payload.progress) {
        return { success: false, error: 'ข้อมูลในไฟล์ไม่สมบูรณ์ (Missing user or progress data)' }
      }

      return { success: true, payload, isSecure: true }
    }

    // Direct plain JSON fallback (e.g. if user saved as standard JSON)
    if (raw && raw.app === 'CommuMathy' && raw.user && raw.progress) {
      return { success: true, payload: raw as SavePayload, isSecure: false }
    }

    return { success: false, error: 'รูปแบบไฟล์บันทึกไม่ถูกต้อง ไม่ใช่ไฟล์บันทึกของ CommuMathy' }
  } catch {
    return { success: false, error: 'ไม่สามารถอ่านไฟล์ได้ กรุณาตรวจสอบว่าเป็นไฟล์บันทึก (.cmmathy หรือ .json) ที่ถูกต้อง' }
  }
}

export function restoreSaveToLocalStorage(payload: SavePayload): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(USER_KEY, JSON.stringify(payload.user))
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(payload.progress))
  if (payload.settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload.settings))
  }
  if (payload.recentPerformance) {
    localStorage.setItem(PERFORMANCE_KEY, JSON.stringify(payload.recentPerformance))
  }
  if (payload.history) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(payload.history))
  }
}
