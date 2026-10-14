import React, { useRef, useState } from 'react'
import {
  Award,
  Check,
  Download,
  Flame,
  Info,
  LogOut,
  Save,
  ShieldCheck,
  Target,
  Upload,
  UserCheck,
  UserRound,
  X,
  Zap,
} from 'lucide-react'
import {
  getUserInitials,
  parseSaveFileContent,
  type GradeLevel,
  type SavePayload,
  type UserProfile,
} from './saveSystem'

type SignInModalProps = {
  isOpen: boolean
  onClose?: () => void
  onSignIn: (name: string, grade: GradeLevel) => void
  onImportSuccess: (payload: SavePayload) => void
  currentGrade?: GradeLevel
}

const JUNIOR_GRADES: GradeLevel[] = ['ม.1', 'ม.2', 'ม.3']
const SENIOR_GRADES: GradeLevel[] = ['ม.4', 'ม.5', 'ม.6']

export function SignInModal({
  isOpen,
  onClose,
  onSignIn,
  onImportSuccess,
  currentGrade = 'ม.3',
}: SignInModalProps) {
  const [name, setName] = useState('')
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(currentGrade)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setErrorMessage('กรุณากรอกชื่อหรือชื่อเล่นของคุณเพื่อเริ่มต้นใช้งาน')
      return
    }
    setErrorMessage(null)
    onSignIn(trimmed, selectedGrade)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setErrorMessage(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const result = parseSaveFileContent(text)
      if (result.success) {
        onImportSuccess(result.payload)
      } else {
        setErrorMessage(result.error)
      }
    }
    reader.onerror = () => {
      setErrorMessage('ไม่สามารถอ่านไฟล์ได้ กรุณาลองใหม่อีกครั้ง')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="modal-backdrop" style={{ zIndex: 110 }}>
      <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
        <div className="auth-modal-header">
          <div className="auth-icon-badge">
            <UserCheck size={28} />
          </div>
          <h2 id="auth-modal-title">เริ่มต้นใช้งาน CommuMathy</h2>
          <p>
            ไม่จำเป็นต้องใช้อีเมลหรือรหัสผ่าน เพียงบอกชื่อและระดับชั้น
            หรือใช้ไฟล์ Save เดิมเพื่อเรียนต่อได้ทันที
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-field">
            <span>ชื่อหรือชื่อเล่นที่ต้องการให้เรียก</span>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (errorMessage) setErrorMessage(null)
              }}
              placeholder="เช่น พิมพ์ชนก, ต้นน้ำ, ก้อง"
              autoFocus
              maxLength={40}
            />
          </label>

          <div className="auth-field">
            <span>ระดับชั้นการศึกษา</span>

            <div className="grade-section-title">มัธยมศึกษาตอนต้น</div>
            <div className="grade-pills">
              {JUNIOR_GRADES.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`grade-pill ${selectedGrade === g ? 'active' : ''}`}
                  onClick={() => setSelectedGrade(g)}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="grade-section-title">มัธยมศึกษาตอนปลาย</div>
            <div className="grade-pills">
              {SENIOR_GRADES.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`grade-pill ${selectedGrade === g ? 'active' : ''}`}
                  onClick={() => setSelectedGrade(g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {errorMessage && (
            <div className="auth-error-banner" role="alert">
              <Info size={16} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          <button type="submit" className="primary-button auth-submit-button">
            เข้าสู่ระบบและเริ่มเรียน
          </button>
        </form>

        <div className="auth-divider">
          <span>หรือเข้าใช้งานด้วยไฟล์บันทึกเดิม</span>
        </div>

        <div className="auth-import-section">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".cmmathy,.json"
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="outline-button auth-import-button"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={16} />
            <span>นำเข้าไฟล์ Save (.cmmathy / .json)</span>
          </button>

          <div className="auth-security-hint">
            <ShieldCheck size={14} />
            <span>ไฟล์ Save มีการเข้ารหัสและตรวจสอบลายเซ็นดิจิทัล SHA-256 ป้องกันการโกง</span>
          </div>
        </div>

        {onClose && (
          <button type="button" className="auth-close-text" onClick={onClose}>
            ปิดหน้าต่างนี้ (ใช้งานบัญชีเดิม)
          </button>
        )}
      </div>
    </div>
  )
}

type SaveManagerModalProps = {
  isOpen: boolean
  onClose: () => void
  user: UserProfile | null
  progress: {
    completedLessons: string[]
    bookmarks: string[]
    xp: number
    streak: number
    exerciseCorrect: number
    exerciseTotal: number
    assessmentScore?: number
  }
  settings: Record<string, unknown>
  onExport: () => void
  onImportSuccess: (payload: SavePayload) => void
  onSignOut: () => void
}

export function SaveManagerModal({
  isOpen,
  onClose,
  user,
  progress,
  onExport,
  onImportSuccess,
  onSignOut,
}: SaveManagerModalProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setErrorMessage(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const result = parseSaveFileContent(text)
      if (result.success) {
        onImportSuccess(result.payload)
      } else {
        setErrorMessage(result.error)
      }
    }
    reader.onerror = () => {
      setErrorMessage('ไม่สามารถอ่านไฟล์ได้ กรุณาลองใหม่อีกครั้ง')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const accuracy = Math.round(
    (progress.exerciseCorrect / Math.max(1, progress.exerciseTotal)) * 100
  )

  return (
    <div className="modal-backdrop" style={{ zIndex: 110 }} onClick={onClose}>
      <div
        className="save-manager-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="save-modal-title">
            <Save size={24} />
            <div>
              <strong>จัดการไฟล์บันทึกความคืบหน้า (Save & Backup)</strong>
              <small>ดาวน์โหลดเก็บไว้ในเครื่อง หรือนำเข้าไฟล์เพื่อเรียนต่อ</small>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="ปิด">
            <X size={18} />
          </button>
        </div>

        {user ? (
          <div className="save-user-card">
            <div className="save-user-avatar">{getUserInitials(user.name)}</div>
            <div className="save-user-info">
              <h3>{user.name}</h3>
              <p>
                {user.grade} • {user.level}
              </p>
            </div>
            <span className="save-user-badge">
              <Check size={12} style={{ display: 'inline', marginRight: 3 }} /> บันทึกในเครื่องแล้ว
            </span>
          </div>
        ) : (
          <div className="save-user-card empty-user">
            <UserRound size={34} />
            <div className="save-user-info">
              <h3>ยังไม่ได้ลงชื่อเข้าใช้</h3>
              <p>โปรดลงชื่อเข้าใช้เพื่อให้สามารถผูกความคืบหน้าได้ถูกต้อง</p>
            </div>
          </div>
        )}

        <div className="save-stats-grid">
          <div className="save-stat-box">
            <div className="save-stat-icon yellow">
              <Zap size={16} />
            </div>
            <small>คะแนนสะสม</small>
            <strong>{progress.xp.toLocaleString()} XP</strong>
          </div>
          <div className="save-stat-box">
            <div className="save-stat-icon orange">
              <Flame size={16} />
            </div>
            <small>สตรีคเรียน</small>
            <strong>{progress.streak} วัน</strong>
          </div>
          <div className="save-stat-box">
            <div className="save-stat-icon purple">
              <Award size={16} />
            </div>
            <small>บทเรียนที่จบ</small>
            <strong>{progress.completedLessons.length} บท</strong>
          </div>
          <div className="save-stat-box">
            <div className="save-stat-icon green">
              <Target size={16} />
            </div>
            <small>ความแม่นยำ</small>
            <strong>{accuracy}%</strong>
          </div>
        </div>

        <div className="security-callout">
          <div className="security-callout-icon">
            <ShieldCheck size={20} />
          </div>
          <div>
            <strong>ระบบป้องกันการแฮ็กและแก้ไขสถิติ (Anti-Tamper & Cryptography)</strong>
            <p>
              ไฟล์บันทึก <code>.cmmathy</code> ถูกเข้ารหัสและกำกับด้วยลายเซ็นดิจิทัล SHA-256
              หากมีการแฮ็ก ดัดแปลงแก้ไขตัวเลขคะแนน XP หรือข้อมูลในไฟล์
              ระบบจะปฏิเสธการโหลดทันทีเพื่อความปลอดภัยและยุติธรรม
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="auth-error-banner" role="alert" style={{ marginBottom: 14 }}>
            <Info size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="save-actions-list">
          <button type="button" className="primary-button save-action-btn" onClick={onExport}>
            <Download size={20} />
            <div>
              <strong>ดาวน์โหลดไฟล์ Save (.cmmathy)</strong>
              <small>บันทึกบทเรียน คะแนน XP สตรีค และการตั้งค่าลงคอม/มือถือของคุณ</small>
            </div>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".cmmathy,.json"
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="outline-button save-action-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={20} />
            <div>
              <strong>นำเข้าไฟล์ Save จากเครื่อง</strong>
              <small>โหลดไฟล์ .cmmathy หรือ .json ที่เคยบันทึกไว้ เพื่อเรียนต่อ</small>
            </div>
          </button>

          {user && (
            <button
              type="button"
              className="text-button subtle-signout"
              onClick={onSignOut}
            >
              <LogOut size={16} />
              <span>สลับบัญชีผู้ใช้ / ลงชื่อออก</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
