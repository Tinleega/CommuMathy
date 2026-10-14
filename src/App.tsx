import { useEffect, useMemo, useRef, useState } from 'react'
import { renderToString } from 'katex'
import {
  ArrowLeft, ArrowRight, Award, Bell, BookOpen, Bookmark, BookmarkCheck, Bot, Check, ChevronDown, ChevronRight,
  CircleHelp, Clock3, Download, FileImage, Filter, Flame, GraduationCap, Home, ImagePlus, Info, LayoutDashboard, Lightbulb,
  ListChecks, LogOut, Menu, MessageCircle, MoreHorizontal, Paperclip, Palette, PenLine, Plus, RotateCcw, Save, Search, Send, Settings, ShieldCheck, Sparkles,
  Target, ThumbsUp, Trophy, Upload, UserRound, Users, X, Zap,
} from 'lucide-react'
import { exerciseQuestions, initialPosts, leaderboard, lessons, type DiscussionPost, type ExerciseQuestion, type Lesson } from './data'
import { chapterOfferingLabel, curriculumChapters, offeringsFor, type CurriculumChapter, type CurriculumCourse, type CurriculumLesson, type EducationLevel } from './curriculum'
import { QuestionBankExercisesPage } from './QuestionBankExercisesPage'
import {
  createNewUser,
  determineLevel,
  exportSaveFile,
  getStoredUser,
  getUserInitials,
  parseSaveFileContent,
  restoreSaveToLocalStorage,
  saveStoredUser,
  type GradeLevel,
  type SavePayload,
  type UserProfile,
} from './saveSystem'
import { SignInModal, SaveManagerModal } from './AuthModals'

type Page = 'home' | 'lessons' | 'lesson-detail' | 'curriculum-chapter' | 'curriculum-lesson' | 'exercises' | 'assessment' | 'tutor' | 'community' | 'leaderboard' | 'profile' | 'settings'
type ProgressState = { completedLessons: string[]; bookmarks: string[]; xp: number; streak: number; exerciseCorrect: number; exerciseTotal: number; assessmentScore?: number }
type TutorMessage = { role: 'user' | 'tutor'; text: string; time: string }
type GeminiStatus = { configured: boolean; model: string }
type NotificationItem = { id: string; kind: 'reply' | 'streak' | 'lesson'; title: string; body: string; time: string; read: boolean }
type SettingsTab = 'profile' | 'notifications' | 'appearance' | 'learning'
type SettingsState = { displayName: string; grade: GradeLevel; bio: string; dailyReminder: boolean; communityReplies: boolean; weeklySummary: boolean; showHints: boolean; fullScreenMath: boolean; difficulty: 'พื้นฐาน' | 'กำลังดี' | 'ท้าทาย'; theme: 'สว่าง' | 'มืด' | 'ตามระบบ'; fontSize: 'มาตรฐาน' | 'ใหญ่' }
const defaultSettings: SettingsState = { displayName: 'นักเรียน', grade: 'ม.3', bio: 'กำลังฝึกทำความเข้าใจคณิตศาสตร์ให้มากขึ้น', dailyReminder: true, communityReplies: true, weeklySummary: false, showHints: true, fullScreenMath: false, difficulty: 'กำลังดี', theme: 'ตามระบบ', fontSize: 'มาตรฐาน' }

const defaultProgress: ProgressState = { completedLessons: [], bookmarks: ['linear-equation'], xp: 840, streak: 5, exerciseCorrect: 7, exerciseTotal: 9 }
const defaultTutor: TutorMessage[] = [
  { role: 'tutor', text: 'สวัสดีค่ะ พิมพ์ชนก 👋 วันนี้อยากทำความเข้าใจคณิตศาสตร์เรื่องไหนเป็นพิเศษคะ? ฉันจะช่วยไล่เหตุผลไปทีละขั้น โดยยังไม่เฉลยทันทีถ้าคุณอยากลองคิดเองก่อน', time: '09:41' },
  { role: 'user', text: 'ช่วยอธิบายว่าทำไมการย้ายข้างในสมการถึงต้องเปลี่ยนเครื่องหมายหน่อยค่ะ', time: '09:42' },
  { role: 'tutor', text: 'ได้เลยค่ะ ลองนึกถึงสมการเหมือนตาชั่งที่สมดุลนะคะ\n\nจาก 2x + 3 = 11 ถ้าเราต้องการเอา +3 ออก เราจะ “ลบ 3” จากทั้งสองข้าง ไม่ใช่แค่ข้างเดียว:\n\n2x + 3 - 3 = 11 - 3\nจึงเหลือ 2x = 8\n\nคำว่า “ย้าย +3 ไปอีกข้างเป็น -3” เป็นเพียงวิธีเขียนสั้น ๆ ของการลบ 3 ทั้งสองข้างค่ะ ความเท่ากันจึงยังคงเดิม', time: '09:42' },
]
const defaultNotifications: NotificationItem[] = [
  { id: 'reply-1', kind: 'reply', title: 'มีคนตอบคำถามของคุณ', body: 'มินตราช่วยต่อยอดเรื่องสมการเชิงเส้นแล้ว', time: '12 นาทีที่แล้ว', read: false },
  { id: 'streak-1', kind: 'streak', title: 'รักษาสตรีคไว้ได้อีกวัน', body: 'คุณเรียนต่อเนื่องมาแล้ว 5 วัน เก่งมาก!', time: 'วันนี้ 09:00', read: false },
  { id: 'lesson-1', kind: 'lesson', title: 'บทเรียนใหม่ที่น่าลอง', body: 'ฟังก์ชันเชิงเส้นและกราฟพร้อมให้เรียนแล้ว', time: 'เมื่อวาน', read: true },
]

const navItems: { id: Page; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'หน้าหลัก', icon: Home },
  { id: 'lessons', label: 'บทเรียน', icon: BookOpen },
  { id: 'exercises', label: 'แบบฝึกหัด', icon: PenLine },
  { id: 'assessment', label: 'แบบประเมิน', icon: ListChecks },
  { id: 'tutor', label: 'ติวเตอร์ AI', icon: Sparkles },
  { id: 'community', label: 'ชุมชนการเรียนรู้', icon: Users },
  { id: 'leaderboard', label: 'กระดานคะแนน', icon: Trophy },
]

function readStorage<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? '') as T } catch { return fallback }
}

function MathText({ formula, display = false }: { formula: string; display?: boolean }) {
  let html = formula
  try { html = renderToString(formula, { throwOnError: false, displayMode: display, strict: 'ignore' }) } catch { /* plain text fallback */ }
  return <span className={display ? 'math-display' : 'math-inline'} dangerouslySetInnerHTML={{ __html: html }} />
}

function App() {
  const [page, setPage] = useState<Page>(() => readStorage('commumathy-page', 'home'))
  const [user, setUser] = useState<UserProfile | null>(() => getStoredUser())
  const [showAuthModal, setShowAuthModal] = useState<boolean>(() => !getStoredUser())
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [appTheme, setAppTheme] = useState<SettingsState['theme']>(() => {
    const savedSettings = readStorage<Partial<SettingsState> | null>('commumathy-settings', null)
    return savedSettings?.theme ?? 'ตามระบบ'
  })
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(lessons[0])
  const [selectedChapter, setSelectedChapter] = useState<CurriculumChapter>(curriculumChapters[0])
  const [selectedCurriculumLesson, setSelectedCurriculumLesson] = useState<CurriculumLesson>(curriculumChapters[0].lessons[0])
  const [practiceChapter, setPracticeChapter] = useState<CurriculumChapter | null>(null)
  const [progress, setProgress] = useState<ProgressState>(() => readStorage('commumathy-progress', defaultProgress))
  const [posts, setPosts] = useState<DiscussionPost[]>(() => readStorage('commumathy-posts', initialPosts))
  const [tutorMessages, setTutorMessages] = useState<TutorMessage[]>(() => readStorage('commumathy-tutor', defaultTutor))
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => readStorage('commumathy-notifications', defaultNotifications))
  const [globalSearch, setGlobalSearch] = useState('')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)

  useEffect(() => { localStorage.setItem('commumathy-progress', JSON.stringify(progress)) }, [progress])
  useEffect(() => { localStorage.setItem('commumathy-page', JSON.stringify(page)) }, [page])
  useEffect(() => { localStorage.setItem('commumathy-posts', JSON.stringify(posts)) }, [posts])
  useEffect(() => { localStorage.setItem('commumathy-tutor', JSON.stringify(tutorMessages)) }, [tutorMessages])
  useEffect(() => { localStorage.setItem('commumathy-notifications', JSON.stringify(notifications)) }, [notifications])
  useEffect(() => {
    if (!toastMessage) return
    const timer = setTimeout(() => setToastMessage(null), 4200)
    return () => clearTimeout(timer)
  }, [toastMessage])

  useEffect(() => {
    if (!notificationsOpen) return
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setNotificationsOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [notificationsOpen])
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = () => { document.documentElement.dataset.theme = appTheme === 'มืด' || (appTheme === 'ตามระบบ' && media.matches) ? 'มืด' : 'สว่าง' }
    applyTheme()
    media.addEventListener('change', applyTheme)
    return () => media.removeEventListener('change', applyTheme)
  }, [appTheme])

  const go = (next: Page) => { setPage(next); setMobileMenu(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const changeTheme = (theme: SettingsState['theme']) => {
    setAppTheme(theme)
    const savedSettings = readStorage<SettingsState>('commumathy-settings', defaultSettings)
    localStorage.setItem('commumathy-settings', JSON.stringify({ ...savedSettings, theme }))
  }
  const toggleTheme = () => changeTheme(appTheme === 'มืด' ? 'สว่าง' : 'มืด')
  const openLesson = (lesson: Lesson) => { setSelectedLesson(lesson); go('lesson-detail') }
  const openChapter = (chapter: CurriculumChapter) => { setSelectedChapter(chapter); go('curriculum-chapter') }
  const openCurriculumLesson = (chapter: CurriculumChapter, lesson: CurriculumLesson) => { setSelectedChapter(chapter); setSelectedCurriculumLesson(lesson); go('curriculum-lesson') }
  const startChapterPractice = (chapter: CurriculumChapter) => { setPracticeChapter(chapter); go('exercises') }
  const toggleBookmark = (id: string) => setProgress((p) => ({ ...p, bookmarks: p.bookmarks.includes(id) ? p.bookmarks.filter((x) => x !== id) : [...p.bookmarks, id] }))
  const completeLesson = () => setProgress((p) => ({ ...p, completedLessons: p.completedLessons.includes(selectedLesson.id) ? p.completedLessons : [...p.completedLessons, selectedLesson.id], xp: p.xp + (p.completedLessons.includes(selectedLesson.id) ? 0 : 40) }))
  const completeCurriculumLesson = (lessonId: string) => setProgress((p) => ({ ...p, completedLessons: p.completedLessons.includes(lessonId) ? p.completedLessons : [...p.completedLessons, lessonId], xp: p.xp + (p.completedLessons.includes(lessonId) ? 0 : 40) }))
  const unreadNotifications = notifications.filter((notification) => !notification.read).length
  const markNotificationRead = (id: string) => setNotifications((items) => items.map((item) => item.id === id ? { ...item, read: true } : item))
  const markAllNotificationsRead = () => setNotifications((items) => items.map((item) => ({ ...item, read: true })))

  const handleSignIn = (name: string, grade: GradeLevel) => {
    const newUser = createNewUser(name, grade)
    setUser(newUser)
    saveStoredUser(newUser)
    const savedSettings = readStorage<SettingsState>('commumathy-settings', defaultSettings)
    localStorage.setItem('commumathy-settings', JSON.stringify({ ...savedSettings, displayName: newUser.name, grade: newUser.grade }))
    setShowAuthModal(false)
    setToastMessage({ type: 'success', message: `ยินดีต้อนรับคุณ ${newUser.name} (${newUser.grade}) เริ่มเรียนได้ทันที!` })
  }

  const handleSignOut = () => {
    setUser(null)
    saveStoredUser(null)
    setShowSaveModal(false)
    setShowAuthModal(true)
    setToastMessage({ type: 'success', message: 'ออกจากระบบเรียบร้อยแล้ว' })
  }

  const handleExportSave = () => {
    if (!user) {
      setShowAuthModal(true)
      return
    }
    const savedSettings = readStorage<SettingsState>('commumathy-settings', defaultSettings)
    exportSaveFile(user, progress, savedSettings)
    setToastMessage({ type: 'success', message: `ดาวน์โหลดไฟล์ Save (${user.name}) สำเร็จแล้ว!` })
  }

  const handleImportSuccess = (payload: SavePayload) => {
    restoreSaveToLocalStorage(payload)
    setUser(payload.user)
    setProgress(payload.progress)
    if (payload.settings) {
      const saved = readStorage<SettingsState>('commumathy-settings', defaultSettings)
      const nextSettings = { ...saved, ...payload.settings }
      localStorage.setItem('commumathy-settings', JSON.stringify(nextSettings))
      if (nextSettings.theme) setAppTheme(nextSettings.theme)
    }
    setShowAuthModal(false)
    setShowSaveModal(false)
    setToastMessage({ type: 'success', message: `โหลดไฟล์สำเร็จ! ยินดีต้อนรับกลับ ${payload.user.name}` })
  }

  const searchResults = useMemo(() => {
    if (!globalSearch.trim()) return []
    const q = globalSearch.toLowerCase()
    return [...lessons.map((lesson) => ({ kind: 'lesson' as const, lesson })), ...curriculumChapters.map((chapter) => ({ kind: 'chapter' as const, chapter }))].filter((item) => {
      const target = item.kind === 'lesson' ? `${item.lesson.title} ${item.lesson.subject} ${item.lesson.grade}` : `${item.chapter.title} ${item.chapter.englishTitle} ${item.chapter.offerings.map((offering) => offering.grade).join(' ')}`
      return target.toLowerCase().includes(q)
    }).slice(0, 7)
  }, [globalSearch])

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <div className="brand" onClick={() => go('home')} role="button" tabIndex={0}>
          <div className="brand-mark"><span>∑</span></div>
          <div><strong>Commu<span>Mathy</span></strong><small>เรียนคณิตให้เข้าใจ</small></div>
        </div>
        <div className="sidebar-section-label">เมนูหลัก</div>
        <nav className="sidebar-nav">
          {navItems.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${page === id || (id === 'lessons' && ['lesson-detail', 'curriculum-chapter', 'curriculum-lesson'].includes(page)) ? 'active' : ''}`} onClick={() => go(id)}><Icon size={19} strokeWidth={page === id ? 2.4 : 1.8} /><span>{label}</span>{id === 'tutor' && <span className="nav-new">ใหม่</span>}</button>)}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-tip"><div className="tip-icon"><Lightbulb size={17} /></div><div><strong>เคล็ดลับวันนี้</strong><p>ลองอธิบายวิธีคิดของตัวเองเป็นคำพูด จะช่วยให้จำได้นานขึ้น</p></div></div>
        <nav className="sidebar-nav sidebar-bottom">
          <button className={`nav-item ${page === 'profile' ? 'active' : ''}`} onClick={() => go('profile')}><UserRound size={19} /><span>โปรไฟล์ของฉัน</span></button>
          <button className={`nav-item ${page === 'settings' ? 'active' : ''}`} onClick={() => go('settings')}><Settings size={19} /><span>ตั้งค่า</span></button>
        </nav>
        <div className="mini-profile" onClick={() => user ? setShowSaveModal(true) : setShowAuthModal(true)} role="button" tabIndex={0} title="จัดการโปรไฟล์และไฟล์ Save" style={{ cursor: 'pointer' }}>
          <div className="avatar avatar-indigo">{getUserInitials(user?.name ?? 'นักเรียน')}</div>
          <div>
            <strong>{user?.name ?? 'ยังไม่ลงชื่อเข้าใช้'}</strong>
            <small>{user ? `${user.grade} • ${user.level}` : 'แตะเพื่อลงชื่อเข้าใช้'}</small>
          </div>
          <MoreHorizontal size={17} />
        </div>
      </aside>
      {mobileMenu && <div className="sidebar-overlay" onClick={() => setMobileMenu(false)} />}
      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu-button" onClick={() => setMobileMenu(true)} aria-label="เปิดเมนู"><Menu size={22} /></button>
          <div className="breadcrumbs"><span>CommuMathy</span><ChevronRight size={14} /> <strong>{pageTitle(page)}</strong></div>
          <div className="topbar-actions">
            <div className="global-search"><Search size={17} /><input value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} placeholder="ค้นหาบทเรียน แบบฝึกหัด..." aria-label="ค้นหา" />{globalSearch && <button onClick={() => setGlobalSearch('')}><X size={15} /></button>}
              {searchResults.length > 0 && <div className="search-dropdown">{searchResults.map((result) => result.kind === 'lesson' ? <button key={result.lesson.id} onClick={() => { openLesson(result.lesson); setGlobalSearch('') }}><div className={`course-icon ${result.lesson.color}`}>{result.lesson.icon}</div><div><strong>{result.lesson.title}</strong><small>{result.lesson.grade} • {result.lesson.subject}</small></div><ChevronRight size={15} /></button> : <button key={result.chapter.id} onClick={() => { openChapter(result.chapter); setGlobalSearch('') }}><div className={`course-icon ${result.chapter.color}`}>{result.chapter.icon}</div><div><strong>{result.chapter.title}</strong><small>{result.chapter.offerings[0].grade} • {result.chapter.englishTitle}</small></div><ChevronRight size={15} /></button>)}</div>}
            </div>
            <div className="notification-menu" ref={notificationRef}>
              <button className="icon-button notification-button" onClick={() => setNotificationsOpen((open) => !open)} aria-label="การแจ้งเตือน" aria-expanded={notificationsOpen}><Bell size={19} />{unreadNotifications > 0 && <span />}</button>
              {notificationsOpen && <div className="notification-dropdown" role="dialog" aria-label="การแจ้งเตือน"><div className="notification-dropdown-head"><div><strong>การแจ้งเตือน</strong><span>{unreadNotifications > 0 ? `${unreadNotifications} รายการใหม่` : 'ไม่มีรายการใหม่'}</span></div>{unreadNotifications > 0 && <button onClick={markAllNotificationsRead}>อ่านทั้งหมด</button>}</div><div className="notification-list">{notifications.length === 0 ? <div className="notification-empty"><Bell size={18} /><span>ยังไม่มีการแจ้งเตือน</span></div> : notifications.map((notification) => <button className={`notification-item ${notification.read ? 'read' : ''}`} key={notification.id} onClick={() => { markNotificationRead(notification.id); setNotificationsOpen(false) }}><span className={`notification-icon ${notification.kind}`}>{notification.kind === 'reply' ? <MessageCircle size={15} /> : notification.kind === 'streak' ? <Flame size={15} /> : <BookOpen size={15} />}</span><span className="notification-copy"><strong>{notification.title}</strong><span>{notification.body}</span><small>{notification.time}</small></span>{!notification.read && <i />}</button>)}</div></div>}
            </div>
            <button className="outline-button save-trigger-button" onClick={() => user ? setShowSaveModal(true) : setShowAuthModal(true)} title="จัดการไฟล์ Save & โหลดข้อมูล">
              <Save size={15} /> <span className="desktop-only">ไฟล์ Save</span>
            </button>
            <button className="icon-button theme-toggle" onClick={toggleTheme} aria-label="สลับธีม" title="สลับธีม"><Palette size={18} /></button>
            <button className="top-avatar" onClick={() => go('profile')}>{getUserInitials(user?.name ?? 'นักเรียน')}</button>
          </div>
        </header>
        <div className="page-content">
          {page === 'home' && <HomePage user={user} progress={progress} onNavigate={go} onLesson={openLesson} />}
          {page === 'lessons' && <CurriculumBrowser user={user} progress={progress} onChapter={openChapter} onBookmark={toggleBookmark} />}
          {page === 'lesson-detail' && <LessonDetail lesson={selectedLesson} progress={progress} onBack={() => go('lessons')} onComplete={completeLesson} onBookmark={toggleBookmark} onPractice={() => go('exercises')} />}
          {page === 'curriculum-chapter' && <CurriculumChapterPage chapter={selectedChapter} progress={progress} onBack={() => go('lessons')} onLesson={(lesson) => openCurriculumLesson(selectedChapter, lesson)} onPractice={() => startChapterPractice(selectedChapter)} onBookmark={toggleBookmark} />}
          {page === 'curriculum-lesson' && <CurriculumLessonPage chapter={selectedChapter} lesson={selectedCurriculumLesson} progress={progress} onBack={() => go('curriculum-chapter')} onLesson={(lesson) => openCurriculumLesson(selectedChapter, lesson)} onComplete={() => completeCurriculumLesson(selectedCurriculumLesson.id)} onPractice={() => startChapterPractice(selectedChapter)} />}
          {page === 'exercises' && <QuestionBankExercisesPage progress={progress} setProgress={setProgress} onLesson={() => practiceChapter ? openChapter(practiceChapter) : openLesson(lessons[0])} activeChapter={practiceChapter} />}
          {page === 'assessment' && <AssessmentPage progress={progress} setProgress={setProgress} onLessons={() => go('lessons')} />}
          {page === 'tutor' && <GeminiTutorPage messages={tutorMessages} setMessages={setTutorMessages} />}
          {page === 'community' && <CommunityPage posts={posts} setPosts={setPosts} user={user} />}
          {page === 'leaderboard' && <LeaderboardPage progress={progress} user={user} />}
          {page === 'profile' && <ProfilePage user={user} progress={progress} onNavigate={go} onLesson={openLesson} onOpenSave={() => setShowSaveModal(true)} onOpenAuth={() => setShowAuthModal(true)} />}
          {page === 'settings' && <SettingsPage user={user} onUpdateUser={setUser} onThemeChange={changeTheme} onOpenSave={() => setShowSaveModal(true)} onOpenAuth={() => setShowAuthModal(true)} />}
        </div>
      </main>
      <nav className="mobile-bottom-nav">
        {navItems.slice(0, 4).map(({ id, label, icon: Icon }) => <button key={id} className={page === id ? 'active' : ''} onClick={() => go(id)}><Icon size={19} /><span>{label}</span></button>)}
        <button className={page === 'tutor' ? 'active' : ''} onClick={() => go('tutor')}><Sparkles size={19} /><span>ติวเตอร์</span></button>
      </nav>

      {showAuthModal && (
        <SignInModal
          isOpen={showAuthModal}
          onClose={user ? () => setShowAuthModal(false) : undefined}
          onSignIn={handleSignIn}
          onImportSuccess={handleImportSuccess}
          currentGrade={user?.grade}
        />
      )}

      {showSaveModal && (
        <SaveManagerModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          user={user}
          progress={progress}
          settings={readStorage<SettingsState>('commumathy-settings', defaultSettings)}
          onExport={handleExportSave}
          onImportSuccess={handleImportSuccess}
          onSignOut={handleSignOut}
        />
      )}

      {toastMessage && (
        <div className={`toast-notification ${toastMessage.type}`}>
          {toastMessage.type === 'success' ? <Check size={18} /> : <CircleHelp size={18} />}
          <span>{toastMessage.message}</span>
          <button onClick={() => setToastMessage(null)} aria-label="ปิด"><X size={15} /></button>
        </div>
      )}
    </div>
  )
}

function pageTitle(page: Page) { return ({ home: 'หน้าหลัก', lessons: 'บทเรียน', 'lesson-detail': 'รายละเอียดบทเรียน', 'curriculum-chapter': 'บทในหลักสูตร', 'curriculum-lesson': 'บทเรียนย่อย', exercises: 'แบบฝึกหัด', assessment: 'แบบประเมิน', tutor: 'ติวเตอร์ AI', community: 'ชุมชนการเรียนรู้', leaderboard: 'กระดานคะแนน', profile: 'โปรไฟล์ของฉัน', settings: 'ตั้งค่า' } as Record<Page, string>)[page] }

function HomePage({ user, progress, onNavigate, onLesson }: { user: UserProfile | null; progress: ProgressState; onNavigate: (p: Page) => void; onLesson: (l: Lesson) => void }) {
  const accuracy = Math.round((progress.exerciseCorrect / progress.exerciseTotal) * 100)
  return <>
    <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot" /> ประจำวัน</div><h1>สวัสดี, {user?.name ?? 'นักเรียน'} <span className="wave">👋</span></h1><p className="page-intro">{user ? `กำลังเรียนระดับ ${user.grade} (${user.level}) มาเติบโตไปทีละก้าวด้วยกันนะ` : 'พร้อมเรียนรู้สิ่งใหม่วันนี้หรือยัง? มาเติบโตไปทีละก้าวด้วยกันนะ'}</p></div><button className="outline-button desktop-only"><CalendarIcon /> ตารางการเรียน</button></section>
    <section className="hero-card"><div className="hero-copy"><div className="hero-label"><Sparkles size={15} /> เส้นทางการเรียนรู้ของคุณ</div><h2>วางรากฐานพีชคณิต<br /><em>ให้แน่นขึ้นอีกนิด</em></h2><p>บทเรียนถัดไปของคุณรออยู่ ใช้เวลาเพียง 25 นาทีเพื่อทำความเข้าใจเรื่องสมการให้ชัดเจนขึ้น</p><button className="primary-button" onClick={() => onLesson(lessons[0])}>เรียนต่อ <ArrowRight size={17} /></button></div><div className="hero-art"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="floating-card card-one"><span>∑</span><small>เข้าใจ</small></div><div className="floating-card card-two"><span>x²</span><small>ลองคิด</small></div><div className="hero-equation"><MathText formula="2x + 3 = 11" display /><span>ให้เหตุผลกับทุกคำตอบ</span></div></div></section>
    <div className="stats-grid"><StatCard icon={<Flame size={19} />} label="เรียนต่อเนื่อง" value={`${progress.streak} วัน`} note="เพิ่มขึ้น 2 วันจากสัปดาห์ก่อน" tone="orange" /><StatCard icon={<Target size={19} />} label="ความแม่นยำแบบฝึกหัด" value={`${accuracy}%`} note="ดีขึ้น 8% จากครั้งก่อน" tone="green" /><StatCard icon={<Award size={19} />} label="บทเรียนที่จบแล้ว" value={`${progress.completedLessons.length} บท`} note={`จากทั้งหมด ${lessons.length} บท`} tone="purple" /><StatCard icon={<Zap size={19} />} label="คะแนนสะสม" value={`${progress.xp.toLocaleString()} XP`} note="อีก 160 XP ถึงระดับถัดไป" tone="yellow" /></div>
    <div className="content-grid home-grid"><div className="primary-column"><SectionHeading title="เรียนต่อจากครั้งล่าสุด" link="ดูบทเรียนทั้งหมด" onLink={() => onNavigate('lessons')} /><div className="continue-card"><div className="continue-cover indigo-cover"><span className="cover-formula"><MathText formula="2x + 3 = 11" display /></span><span className="cover-tag">พีชคณิต • ม.1</span></div><div className="continue-body"><div className="card-kicker">บทเรียนที่กำลังเรียน</div><h3>{lessons[0].title}</h3><p>{lessons[0].subtitle}</p><div className="progress-line"><span style={{ width: `${lessons[0].progress}%` }} /></div><div className="progress-meta"><span>เรียนไปแล้ว {lessons[0].progress}%</span><span>{lessons[0].duration} ที่เหลือ</span></div><button className="text-button" onClick={() => onLesson(lessons[0])}>กลับไปเรียนต่อ <ArrowRight size={15} /></button></div></div><SectionHeading title="บทเรียนแนะนำสำหรับคุณ" link="ดูทั้งหมด" onLink={() => onNavigate('lessons')} /><div className="lesson-mini-grid">{lessons.slice(1, 3).map((lesson) => <LessonMiniCard key={lesson.id} lesson={lesson} onClick={() => onLesson(lesson)} />)}</div></div><aside className="secondary-column"><ProgressCard progress={progress} /><TutorShortcut onClick={() => onNavigate('tutor')} /><CommunitySnippet onNavigate={onNavigate} /></aside></div>
  </>
}

function CalendarIcon() { return <span className="calendar-icon">▦</span> }
function StatCard({ icon, label, value, note, tone }: { icon: React.ReactNode; label: string; value: string; note: string; tone: string }) { return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></div> }
function SectionHeading({ title, link, onLink }: { title: string; link?: string; onLink?: () => void }) { return <div className="section-heading"><h2>{title}</h2>{link && <button onClick={onLink}>{link} <ArrowRight size={14} /></button>}</div> }
function ProgressCard({ progress }: { progress: ProgressState }) { return <div className="side-card progress-card"><div className="side-card-heading"><h3>ภาพรวมการเรียน</h3><button aria-label="ตัวเลือก"><MoreHorizontal size={18} /></button></div><div className="progress-ring-wrap"><div className="progress-ring" style={{ '--progress': `${Math.min(100, progress.xp / 12)}%` } as React.CSSProperties}><div><strong>{Math.round(progress.xp / 12)}%</strong><span>โดยรวม</span></div></div><div className="ring-legend"><div><i className="legend-dot indigo-dot" /><span>บทเรียน</span><strong>68%</strong></div><div><i className="legend-dot yellow-dot" /><span>แบบฝึกหัด</span><strong>{Math.round((progress.exerciseCorrect / progress.exerciseTotal) * 100)}%</strong></div><div><i className="legend-dot gray-dot" /><span>แบบประเมิน</span><strong>{progress.assessmentScore ?? 0}%</strong></div></div></div><div className="streak-strip"><Flame size={16} /><span>คุณกำลังเรียนต่อเนื่อง <strong>{progress.streak} วัน</strong></span><ChevronRight size={15} /></div></div> }
function TutorShortcut({ onClick }: { onClick: () => void }) { return <button className="tutor-shortcut" onClick={onClick}><div className="tutor-orb"><Sparkles size={20} /></div><div><span>ติดขัดตรงไหนไหม?</span><strong>ถามติวเตอร์ AI ได้เลย</strong></div><ArrowRight size={17} /></button> }
function CommunitySnippet({ onNavigate }: { onNavigate: (p: Page) => void }) { return <div className="side-card community-snippet"><div className="side-card-heading"><h3>พูดคุยล่าสุด</h3><button onClick={() => onNavigate('community')}>ดูทั้งหมด</button></div><div className="snippet-post"><div className="avatar avatar-peach">พพ</div><div><strong>ทำไมเวลาย้ายข้างต้อง...</strong><span><span className="tag-dot" /> พีชคณิต <i>•</i> 12 นาทีที่แล้ว</span></div></div><div className="snippet-post"><div className="avatar avatar-teal">ตน</div><div><strong>มีวิธีจำสูตรพีทาโกรัส...</strong><span><span className="tag-dot teal-dot" /> เรขาคณิต <i>•</i> 1 ชม.ที่แล้ว</span></div></div></div> }
function LessonMiniCard({ lesson, onClick }: { lesson: Lesson; onClick: () => void }) { return <button className="lesson-mini-card" onClick={onClick}><div className={`course-icon ${lesson.color}`}>{lesson.icon}</div><div className="lesson-mini-info"><div><span>{lesson.grade} • {lesson.subject}</span><Bookmark size={15} /></div><h3>{lesson.title}</h3><p>{lesson.duration} <i>•</i> {lesson.level}</p></div><ChevronRight size={17} /></button> }

function CurriculumBrowser({ user, progress, onChapter, onBookmark }: { user: UserProfile | null; progress: ProgressState; onChapter: (chapter: CurriculumChapter) => void; onBookmark: (id: string) => void }) {
  const [level, setLevel] = useState<EducationLevel>(() => user?.level ?? 'มัธยมศึกษาตอนต้น')
  const [grade, setGrade] = useState(() => user?.grade ?? 'ทั้งหมด')
  const [semester, setSemester] = useState('ทั้งหมด')
  const [course, setCourse] = useState<CurriculumCourse | 'ทั้งหมด'>('ทั้งหมด')
  const gradeOptions = level === 'มัธยมศึกษาตอนต้น' ? ['ทั้งหมด', 'ม.1', 'ม.2', 'ม.3'] : ['ทั้งหมด', 'ม.4', 'ม.5', 'ม.6']
  const shown = curriculumChapters.filter((chapter) => chapter.educationLevel === level && offeringsFor(chapter, grade, semester, course).length > 0)
  const changeLevel = (next: EducationLevel) => { setLevel(next); setGrade('ทั้งหมด'); setSemester('ทั้งหมด'); setCourse('ทั้งหมด') }
  const chapterProgress = (chapter: CurriculumChapter) => Math.round((chapter.lessons.filter((lesson) => progress.completedLessons.includes(lesson.id)).length / chapter.lessons.length) * 100)
  return <><PageIntro eyebrow="หลักสูตรคณิตศาสตร์ไทย ม.1–ม.6" title="เส้นทางการเรียนรู้" description="เลือกช่วงชั้น ภาคเรียน และประเภทวิชา เพื่อค้นหาบทที่เหมาะกับคุณ พร้อมบทเรียนย่อยและแบบฝึกหัดที่เชื่อมต่อกัน" action={<div className="curriculum-summary"><strong>{shown.length} บท</strong><span>{shown.reduce((sum, chapter) => sum + chapter.lessons.length, 0)} บทเรียนย่อย • {shown.reduce((sum, chapter) => sum + chapter.exercises.length, 0)} แบบฝึกหัด</span></div>} /><div className="curriculum-level-tabs"><button className={level === 'มัธยมศึกษาตอนต้น' ? 'active' : ''} onClick={() => changeLevel('มัธยมศึกษาตอนต้น')}><span className="level-number">ม.1–3</span><span>มัธยมศึกษาตอนต้น</span><small>พื้นฐานแน่น ก่อนต่อยอด</small></button><button className={level === 'มัธยมศึกษาตอนปลาย' ? 'active' : ''} onClick={() => changeLevel('มัธยมศึกษาตอนปลาย')}><span className="level-number">ม.4–6</span><span>มัธยมศึกษาตอนปลาย</span><small>พื้นฐานและเพิ่มเติม</small></button></div><div className="curriculum-filter-bar"><div className="curriculum-filter-group"><span>ระดับชั้น</span><div>{gradeOptions.map((item) => <button key={item} className={grade === item ? 'selected' : ''} onClick={() => setGrade(item)}>{item}</button>)}</div></div><div className="curriculum-filter-group"><span>ภาคเรียน</span><div>{['ทั้งหมด', 'ภาคเรียนที่ 1', 'ภาคเรียนที่ 2'].map((item) => <button key={item} className={semester === item ? 'selected' : ''} onClick={() => setSemester(item)}>{item === 'ทั้งหมด' ? item : item.replace('ภาคเรียนที่ ', 'ภาค ')}</button>)}</div></div>{level === 'มัธยมศึกษาตอนปลาย' && <div className="curriculum-filter-group course-group"><span>ประเภทวิชา</span><div>{(['ทั้งหมด', 'คณิตศาสตร์พื้นฐาน', 'คณิตศาสตร์เพิ่มเติม'] as const).map((item) => <button key={item} className={course === item ? 'selected' : ''} onClick={() => setCourse(item)}>{item === 'ทั้งหมด' ? item : item.replace('คณิตศาสตร์', '')}</button>)}</div></div>}</div><div className="curriculum-results-heading"><div><strong>{level}</strong><span>{grade !== 'ทั้งหมด' ? ` • ${grade}` : ''}{course !== 'ทั้งหมด' ? ` • ${course}` : ''}</span></div><span className="verified-note"><Check size={13} /> เนื้อหามีสถานะการตรวจสอบ</span></div><div className="curriculum-card-grid">{shown.map((chapter) => { const offering = offeringsFor(chapter, grade, semester, course)[0]; const completion = chapterProgress(chapter); const bookmarked = progress.bookmarks.includes(chapter.id); return <article className="curriculum-card" key={chapter.id}><button className={`curriculum-card-cover ${chapter.color}-cover`} onClick={() => onChapter(chapter)}><span className="curriculum-card-formula"><MathText formula={chapter.formula} display /></span><span className="curriculum-card-level">{offering ? chapterOfferingLabel(offering) : 'หลายระดับ'}</span></button><div className="curriculum-card-body"><div className="curriculum-card-meta"><span>{chapter.category}</span><button onClick={() => onBookmark(chapter.id)} aria-label="บันทึกบท"><Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} /></button></div><button className="curriculum-title-button" onClick={() => onChapter(chapter)}><h3>{chapter.title}</h3><small>{chapter.englishTitle}</small></button><p>{chapter.intro}</p><div className="curriculum-subtopics">{chapter.subtopics.map((topic) => <span key={topic}>{topic}</span>)}</div><div className="curriculum-card-foot"><span><Clock3 size={13} /> {chapter.estimatedMinutes} นาที</span><span>{completion > 0 ? `เรียนแล้ว ${completion}%` : `${chapter.lessons.length} บทเรียน`}</span></div><div className="progress-line slim"><span style={{ width: `${completion}%` }} /></div></div></article> })}</div>{shown.length === 0 && <div className="empty-state"><BookOpen size={25} /><h3>ยังไม่มีบทในตัวกรองนี้</h3><p>ลองเลือก “ทั้งหมด” หรือเปลี่ยนระดับชั้น/ประเภทวิชา</p></div>}</>
}

function CurriculumChapterPage({ chapter, progress, onBack, onLesson, onPractice, onBookmark }: { chapter: CurriculumChapter; progress: ProgressState; onBack: () => void; onLesson: (lesson: CurriculumLesson) => void; onPractice: () => void; onBookmark: (id: string) => void }) {
  const completedCount = chapter.lessons.filter((lesson) => progress.completedLessons.includes(lesson.id)).length
  const bookmarked = progress.bookmarks.includes(chapter.id)
  return <><button className="back-button" onClick={onBack}><ArrowLeft size={16} /> กลับไปยังเส้นทางการเรียนรู้</button><div className="curriculum-chapter-head"><div><div className="chip-row"><span className="chip chip-indigo">{chapter.educationLevel}</span><span className="chip">{chapter.category}</span><span className="chip chip-yellow">{chapter.offerings.length > 1 ? 'หลายรายวิชา' : chapter.offerings[0].course}</span></div><h1>{chapter.title}</h1><p className="english-title">{chapter.englishTitle}</p><p className="page-intro">{chapter.intro}</p></div><div className="detail-actions"><button className="icon-button" onClick={() => onBookmark(chapter.id)} aria-label="บันทึกบท">{bookmarked ? <BookmarkCheck size={20} fill="currentColor" /> : <Bookmark size={20} />}</button><button className="primary-button" onClick={onPractice}><PenLine size={16} /> ฝึกทำบทนี้</button></div></div><div className="offering-strip"><div><span className="offering-label">เส้นทางที่เปิดสอน</span><strong>{chapter.offerings.map(chapterOfferingLabel).join('  •  ')}</strong></div><span className="source-status"><Check size={13} /> {chapter.sourceStatus}</span></div><div className="chapter-overview-grid"><div className="chapter-overview-main"><div className="chapter-progress-head"><div><span>ความคืบหน้าของบท</span><strong>{completedCount}/{chapter.lessons.length} บทเรียน</strong></div><Target size={20} /></div><div className="progress-line"><span style={{ width: `${(completedCount / chapter.lessons.length) * 100}%` }} /></div><div className="chapter-objectives"><h2>เมื่อเรียนจบบทนี้ คุณจะ...</h2>{chapter.objectives.map((objective) => <div key={objective}><Check size={15} /> <span>{objective}</span></div>)}</div><div className="chapter-prerequisite"><div className="callout-icon"><Info size={17} /></div><div><strong>พื้นฐานที่ควรรู้</strong><p>{chapter.prerequisites.join(' • ')}</p></div></div></div><aside className="chapter-meta-card"><div className={`chapter-icon-large ${chapter.color}`}>{chapter.icon}</div><span>เวลาโดยประมาณ</span><strong>{chapter.estimatedMinutes} นาที</strong><span>แบบฝึกหัดเริ่มต้น</span><strong>{chapter.exercises.length} ข้อ</strong><button className="text-button" onClick={onPractice}>เริ่มฝึกตอนนี้ <ArrowRight size={14} /></button></aside></div><div className="chapter-content-layout"><section className="chapter-lessons-panel"><div className="section-heading"><h2>บทเรียนย่อยในบทนี้</h2><span className="lesson-count-pill">{chapter.lessons.length} บทเรียน</span></div>{chapter.lessons.map((lesson) => { const done = progress.completedLessons.includes(lesson.id); return <button className={`curriculum-lesson-row ${done ? 'done' : ''}`} key={lesson.id} onClick={() => onLesson(lesson)}><span className="lesson-order">{done ? <Check size={14} /> : String(lesson.order).padStart(2, '0')}</span><span className="curriculum-lesson-copy"><strong>{lesson.title}</strong><small>{lesson.objective}</small></span><span className="lesson-duration">{lesson.duration}</span><ChevronRight size={16} /></button> })}</section><aside className="chapter-support-panel"><div className="side-card"><div className="side-card-heading"><h3>แผนผังบท</h3><span>{chapter.subtopics.length} ช่วง</span></div>{chapter.subtopics.map((subtopic, index) => <div className="chapter-map-row" key={subtopic}><span>{index + 1}</span><div><strong>{subtopic}</strong><small>{chapter.lessons[index]?.duration}</small></div></div>)}</div><div className="source-card"><Info size={16} /><div><strong>สถานะแหล่งอ้างอิง</strong><p>{chapter.sourceStatus}</p>{chapter.sourceReferences.length > 0 && <a href={chapter.sourceReferences[0].url} target="_blank" rel="noreferrer">ดูเอกสารอ้างอิงจาก สสวท. <ArrowRight size={13} /></a>}</div></div></aside></div></>
}

function CurriculumLessonPage({ chapter, lesson, progress, onBack, onLesson, onComplete, onPractice }: { chapter: CurriculumChapter; lesson: CurriculumLesson; progress: ProgressState; onBack: () => void; onLesson: (lesson: CurriculumLesson) => void; onComplete: () => void; onPractice: () => void }) {
  const completed = progress.completedLessons.includes(lesson.id)
  const lessonIndex = chapter.lessons.findIndex((item) => item.id === lesson.id)
  const previous = chapter.lessons[lessonIndex - 1]
  const next = chapter.lessons[lessonIndex + 1]
  return <><button className="back-button" onClick={onBack}><ArrowLeft size={16} /> กลับไปยัง {chapter.title}</button><div className="curriculum-lesson-header"><div><div className="eyebrow"><span className="eyebrow-dot" /> {chapter.title} • บทที่ {lesson.order}</div><h1>{lesson.title}</h1><p className="page-intro">{lesson.objective}</p></div><button className={`primary-button ${completed ? 'success-button' : ''}`} onClick={onComplete}>{completed ? <><Check size={16} /> เรียนจบแล้ว</> : <>ทำเครื่องหมายว่าเรียนจบ <Check size={16} /></>}</button></div><div className="curriculum-lesson-layout"><article className="curriculum-lesson-article"><div className={`curriculum-lesson-banner ${chapter.color}-cover`}><span className="lesson-banner-label">เข้าใจแนวคิดก่อนใช้สูตร</span><h2>{chapter.title}</h2><MathText formula={lesson.workedExample.formula} display /></div><div className="curriculum-lesson-section"><h2>แนวคิดหลัก</h2><p>{lesson.summary}</p><div className="lesson-definition-box"><strong>คำจำกัดความและสัญลักษณ์</strong><p>{lesson.definitions}</p></div></div><div className="curriculum-lesson-section"><h2>พื้นฐานทางคณิตศาสตร์</h2><p>{lesson.foundation}</p><div className="formula-panel"><MathText formula={lesson.workedExample.formula} display /></div></div><div className="curriculum-lesson-section"><h2>ตัวอย่างทำไปพร้อมกัน</h2><div className="worked-example-card"><span className="worked-label">โจทย์ตัวอย่าง</span><h3>{lesson.workedExample.problem}</h3><div className="worked-steps">{lesson.workedExample.steps.map((step, index) => <div key={step}><span>{index + 1}</span><p>{step}</p></div>)}</div><div className="worked-answer"><Check size={16} /><strong>คำตอบ: {lesson.workedExample.answer}</strong></div></div></div><div className="curriculum-two-column"><div className="curriculum-lesson-section compact-section"><h2>วิธีคิดทางเลือก</h2><p>{lesson.alternative}</p></div><div className="curriculum-lesson-section compact-section mistake-section"><h2><CircleHelp size={17} /> ข้อผิดพลาดที่พบบ่อย</h2><p>{lesson.commonMistake}</p></div></div><div className="curriculum-lesson-section"><h2>ลองเชื่อมกับชีวิตจริง</h2><p>{lesson.application}</p></div><div className="lesson-summary-box"><div className="summary-icon"><Lightbulb size={18} /></div><div><strong>สรุปบทเรียน</strong><p>{chapter.summary}</p></div></div><div className="curriculum-lesson-footer"><button className="secondary-nav-button" disabled={!previous} onClick={() => previous ? onLesson(previous) : onBack()}><ArrowLeft size={15} /> {previous ? 'บทก่อนหน้า' : 'ต้นบท'}</button><button className="primary-button" onClick={onPractice}>ไปทำแบบฝึกหัด <ArrowRight size={16} /></button><button className="secondary-nav-button" disabled={!next} onClick={() => next && onLesson(next)}>{next ? 'บทถัดไป' : 'จบบท'} <ArrowRight size={15} /></button></div></article><aside className="curriculum-lesson-aside"><div className="outline-sticky"><div className="outline-heading"><strong>ในบทเรียนนี้</strong><span>{lesson.duration}</span></div><div className="lesson-aside-progress"><span style={{ width: `${completed ? 100 : 38}%` }} /></div>{['แนวคิดหลัก', 'คำจำกัดความ', 'พื้นฐานทางคณิตศาสตร์', 'ตัวอย่างทำไปพร้อมกัน', 'วิธีคิดทางเลือก', 'สรุปบทเรียน'].map((item, index) => <div className={index === 0 ? 'lesson-aside-item current' : 'lesson-aside-item'} key={item}><span>{index + 1}</span>{item}</div>)}<div className="lesson-aside-next"><span>ต่อไป</span><strong>{lesson.furtherLearning}</strong></div></div></aside></div></>
}

function LessonsPage({ progress, onLesson, onBookmark }: { progress: ProgressState; onLesson: (l: Lesson) => void; onBookmark: (id: string) => void }) {
  const [grade, setGrade] = useState('ทั้งหมด')
  const filtered = grade === 'ทั้งหมด' ? lessons : lessons.filter((l) => l.grade === grade)
  return <><PageIntro eyebrow="คลังความรู้" title="บทเรียนคณิตศาสตร์" description="เลือกเส้นทางที่เหมาะกับคุณ แล้วค่อย ๆ สร้างความเข้าใจที่แข็งแรงไปด้วยกัน" action={<button className="primary-button" onClick={() => onLesson(lessons[0])}><BookOpen size={17} /> เรียนต่อจากครั้งล่าสุด</button>} /><div className="filter-bar"><div className="filter-label"><Filter size={16} /> ระดับชั้น</div>{['ทั้งหมด', 'ม.1', 'ม.2', 'ม.3'].map((item) => <button key={item} className={grade === item ? 'selected' : ''} onClick={() => setGrade(item)}>{item}</button>)}<div className="filter-spacer" /><button className="filter-sort">เรียงตาม: แนะนำ <ChevronDown size={15} /></button></div><div className="lesson-page-grid">{filtered.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} bookmarked={progress.bookmarks.includes(lesson.id)} onClick={() => onLesson(lesson)} onBookmark={() => onBookmark(lesson.id)} />)}</div><div className="curriculum-note"><Info size={17} /><div><strong>หลักสูตรที่กำลังพัฒนา</strong><p>เนื้อหานี้จัดกลุ่มตามแนวทางหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พ.ศ. 2551 (ฉบับปรับปรุง พ.ศ. 2560) สำหรับต้นแบบ CommuMathy</p></div></div></>
}
function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) { return <section className="page-intro-row"><div><div className="eyebrow"><span className="eyebrow-dot" /> {eyebrow}</div><h1>{title}</h1><p className="page-intro">{description}</p></div>{action}</section> }
function LessonCard({ lesson, bookmarked, onClick, onBookmark }: { lesson: Lesson; bookmarked: boolean; onClick: () => void; onBookmark: () => void }) { return <article className="lesson-card"><button className={`lesson-card-cover ${lesson.color}-cover`} onClick={onClick}><span className="cover-formula"><MathText formula={lesson.formula} display /></span><span className="lesson-card-badge">{lesson.level}</span></button><div className="lesson-card-content"><div className="lesson-card-meta"><span>{lesson.grade} • {lesson.subject}</span><button onClick={onBookmark} aria-label="บันทึกบทเรียน">{bookmarked ? <BookmarkCheck size={17} fill="currentColor" /> : <Bookmark size={17} />}</button></div><button className="lesson-title-button" onClick={onClick}><h3>{lesson.title}</h3></button><p>{lesson.subtitle}</p><div className="lesson-card-footer"><span><Clock3 size={14} /> {lesson.duration}</span><span className={lesson.progress > 0 ? 'progress-text' : ''}>{lesson.progress > 0 ? `เรียนแล้ว ${lesson.progress}%` : 'ยังไม่ได้เริ่ม'}</span></div>{lesson.progress > 0 && <div className="progress-line slim"><span style={{ width: `${lesson.progress}%` }} /></div>}</div></article> }

function LessonDetail({ lesson, progress, onBack, onComplete, onBookmark, onPractice }: { lesson: Lesson; progress: ProgressState; onBack: () => void; onComplete: () => void; onBookmark: (id: string) => void; onPractice: () => void }) {
  const completed = progress.completedLessons.includes(lesson.id)
  const bookmarked = progress.bookmarks.includes(lesson.id)
  return <><button className="back-button" onClick={onBack}><ArrowLeft size={16} /> กลับไปยังบทเรียนทั้งหมด</button><div className="lesson-detail-header"><div><div className="chip-row"><span className="chip chip-indigo">{lesson.grade}</span><span className="chip">{lesson.subject}</span><span className="chip chip-yellow">{lesson.level}</span></div><h1>{lesson.title}</h1><p className="page-intro">{lesson.subtitle}</p></div><div className="detail-actions"><button className="icon-button" onClick={() => onBookmark(lesson.id)} aria-label="บันทึกบทเรียน">{bookmarked ? <BookmarkCheck size={20} fill="currentColor" /> : <Bookmark size={20} />}</button><button className={`primary-button ${completed ? 'success-button' : ''}`} onClick={onComplete}>{completed ? <><Check size={17} /> เรียนจบแล้ว</> : <>ทำเครื่องหมายว่าเรียนจบ <Check size={17} /></>}</button></div></div><div className="lesson-detail-layout"><article className="lesson-article"><div className="lesson-hero-banner"><div><span className="banner-overline">ทำความเข้าใจ ไม่ใช่แค่จำ</span><h2>สมการคือการรักษา<br /><em>ความสมดุล</em></h2><p>ทุกการเปลี่ยนแปลงในข้างหนึ่ง ต้องทำเหมือนกันกับอีกข้าง</p></div><div className="balance-illustration"><div className="balance-beam" /><div className="balance-pan left"><span>2x + 3</span></div><div className="balance-pan right"><span>11</span></div><div className="balance-stand" /></div></div><div className="article-section"><h2>สมการเชิงเส้นตัวแปรเดียวคืออะไร?</h2><p>{lesson.description} ลองสังเกตตัวอย่างนี้:</p><div className="formula-panel"><MathText formula={lesson.formula} display /></div><div className="why-callout"><div className="callout-icon"><Lightbulb size={19} /></div><div><strong>ลองคิดก่อนอ่านต่อ</strong><p>ถ้าเราอยากให้เหลือเพียง x เราควรทำอะไรกับทั้งสองข้างก่อน?</p></div></div></div><div className="article-section"><div className="section-number">01</div><div><h2>หลักการรักษาสมดุล</h2><p>สมการเหมือนตาชั่งที่สมดุล เราสามารถบวก ลบ คูณ หรือหารด้วยจำนวนเดียวกันทั้งสองข้างได้ โดยสมการยังคงเป็นจริง</p><div className="steps-row"><Step number="1" title="ลบ 3 ทั้งสองข้าง" formula="2x + 3 - 3 = 11 - 3" /><Step number="2" title="ลดรูป" formula="2x = 8" /><Step number="3" title="หารด้วย 2" formula="x = 4" /></div></div></div><div className="mistake-panel"><div className="mistake-icon"><CircleHelp size={20} /></div><div><strong>ข้อผิดพลาดที่พบบ่อย</strong><p>“ย้ายข้างแล้วเปลี่ยนเครื่องหมาย” เป็นคำพูดสั้น ๆ แต่จริง ๆ แล้วเรากำลังทำสิ่งเดียวกันทั้งสองข้างเสมอ อย่าลืมตรวจคำตอบด้วยการแทนค่ากลับเข้าไป</p></div></div><div className="article-footer-cta"><div><h3>พร้อมลองทำด้วยตัวเองแล้วหรือยัง?</h3><p>ฝึกใช้หลักการนี้กับโจทย์สั้น ๆ 3 ข้อ</p></div><button className="primary-button" onClick={onPractice}>ไปทำแบบฝึกหัด <ArrowRight size={17} /></button></div></article><aside className="lesson-outline"><div className="outline-sticky"><div className="outline-heading"><strong>เนื้อหาในบทเรียน</strong><span>{lesson.progress}%</span></div><div className="outline-progress"><span style={{ width: `${completed ? 100 : lesson.progress}%` }} /></div><div className="outline-list">{lesson.sections.map((section, index) => <button key={section} className={index === 0 ? 'current' : ''}><span>{index === 0 ? <Check size={13} /> : index + 1}</span>{section}<ChevronRight size={14} /></button>)}</div><div className="prerequisite"><span><Info size={14} /> พื้นฐานที่ควรรู้</span><p>{lesson.prerequisite}</p></div></div></aside></div></>
}
function Step({ number, title, formula }: { number: string; title: string; formula: string }) { return <div className="step-card"><span className="step-number">{number}</span><strong>{title}</strong><MathText formula={formula} display /></div> }

function ExercisesPage({ progress, setProgress, onLesson, activeChapter }: { progress: ProgressState; setProgress: React.Dispatch<React.SetStateAction<ProgressState>>; onLesson: () => void; activeChapter: CurriculumChapter | null }) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const questions = activeChapter?.exercises ?? exerciseQuestions
  const question = questions[questionIndex]
  const chapterTitle = activeChapter?.title ?? 'สมการเชิงเส้นตัวแปรเดียว'
  const difficulty = activeChapter?.exercises[questionIndex]?.difficulty ?? 'พื้นฐาน'
  const submit = () => { if (selected === null) return; setSubmitted(true); setProgress((p) => ({ ...p, exerciseCorrect: p.exerciseCorrect + (selected === question.correct ? 1 : 0), exerciseTotal: p.exerciseTotal + 1, xp: p.xp + (selected === question.correct ? 15 : 5) })) }
  const next = () => { setQuestionIndex((i) => (i + 1) % questions.length); setSelected(null); setSubmitted(false) }
  return <><PageIntro eyebrow="ฝึกให้คล่อง" title={activeChapter ? `แบบฝึกหัด: ${chapterTitle}` : 'แบบฝึกหัดพีชคณิต'} description="ลองคิดด้วยตัวเองก่อน แล้วใช้คำใบ้เมื่อจำเป็น การผิดคือข้อมูลสำคัญของการเรียนรู้" action={<button className="outline-button"><Bookmark size={16} /> แบบฝึกหัดที่บันทึกไว้</button>} /><div className="exercise-layout"><aside className="exercise-sidebar"><div className="exercise-filter-card"><strong>ตั้งค่าการฝึก</strong><label>หัวข้อ</label><button className="select-button">{chapterTitle} <ChevronDown size={16} /></button><label>ระดับความยาก</label><div className="difficulty-row"><button className="active">พื้นฐาน</button><button>กำลังดี</button><button>ท้าทาย</button></div><label>จำนวนข้อ</label><div className="question-count"><button>−</button><strong>{questions.length} ข้อ</strong><button>+</button></div><button className="text-button subtle">รีเซ็ตการตั้งค่า</button></div><div className="session-card"><div className="session-icon"><Clock3 size={18} /></div><div><strong>เซสชันของคุณ</strong><p>บันทึกอัตโนมัติแล้ว<br />กลับมาทำต่อได้เสมอ</p></div></div></aside><section className="exercise-workspace"><div className="workspace-top"><div><span className="workspace-label">ข้อที่ {questionIndex + 1} จาก {questions.length}</span><div className="workspace-progress"><span style={{ width: `${((questionIndex + (submitted ? 1 : 0)) / questions.length) * 100}%` }} /></div></div><span className="score-pill"><Zap size={14} /> +{submitted && selected === question.correct ? 15 : 0} XP</span></div><div className="question-card"><div className="question-meta"><span className="chip chip-indigo">{question.topic}</span><span className="difficulty-dots"><i /><i /><i className="off" /> {difficulty}</span></div><h2>{question.prompt}</h2><div className="answer-options">{question.choices.map((choice, index) => <button key={choice} className={`answer-option ${selected === index ? 'selected' : ''} ${submitted && index === question.correct ? 'correct' : ''} ${submitted && selected === index && index !== question.correct ? 'incorrect' : ''}`} onClick={() => !submitted && setSelected(index)}><span className="option-letter">{String.fromCharCode(65 + index)}</span><span>{choice}</span>{submitted && index === question.correct && <Check size={17} />}{submitted && selected === index && index !== question.correct && <X size={17} />}</button>)}</div>{submitted && <div className={`feedback-box ${selected === question.correct ? 'correct-feedback' : 'incorrect-feedback'}`}><div className="feedback-icon">{selected === question.correct ? <Check size={18} /> : <Info size={18} />}</div><div><strong>{selected === question.correct ? 'เก่งมาก! คำตอบถูกต้อง' : 'ยังไม่เป็นไร ลองดูเหตุผลกัน'}</strong><p>{question.explanation}</p></div></div>}<div className="question-actions"><button className="hint-button"><Lightbulb size={17} /> ขอคำใบ้ <span>ยังไม่ใช้</span></button>{!submitted ? <button className="primary-button" disabled={selected === null} onClick={submit}>ตรวจคำตอบ <Check size={17} /></button> : <button className="primary-button" onClick={next}>ข้อต่อไป <ArrowRight size={17} /></button>}</div></div><div className="exercise-note"><Sparkles size={16} /><span>ระบบจะวิเคราะห์รูปแบบข้อผิดพลาดของคุณ เพื่อแนะนำบทเรียนที่ตรงจุดมากขึ้น</span></div><button className="related-lesson" onClick={onLesson}><div className="related-icon"><BookOpen size={17} /></div><div><span>ทบทวนเนื้อหาที่เกี่ยวข้อง</span><strong>{chapterTitle}</strong></div><ArrowRight size={17} /></button></section></div></>
}

function AssessmentPage({ progress, setProgress, onLessons }: { progress: ProgressState; setProgress: React.Dispatch<React.SetStateAction<ProgressState>>; onLessons: () => void }) {
  const [started, setStarted] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const assessmentQuestions = exerciseQuestions
  const score = assessmentQuestions.reduce((sum, q, i) => sum + (answers[i] === q.correct ? 1 : 0), 0)
  if (submitted) return <AssessmentResults score={score} total={assessmentQuestions.length} progress={progress} onLessons={onLessons} />
  if (!started) return <><PageIntro eyebrow="รู้จักจุดแข็งของตัวเอง" title="แบบประเมินพื้นฐาน" description="แบบประเมินสั้น ๆ เพื่อดูว่าคุณเข้าใจเรื่องใดแล้ว และเรื่องใดควรเสริมเพิ่มเติม" /><div className="assessment-intro-card"><div className="assessment-illustration"><div className="check-circle"><ListChecks size={36} /></div><div className="small-equation eq-1">x + 5 = 12</div><div className="small-equation eq-2">a² + b² = c²</div><div className="small-equation eq-3">P(A)</div></div><div className="assessment-intro-copy"><span className="chip chip-indigo">Diagnostic • ม.3</span><h2>สำรวจพื้นฐานคณิตศาสตร์ของคุณ</h2><p>ตอบตามความเข้าใจจริง ไม่ต้องกังวลเรื่องคะแนน ผลลัพธ์จะช่วยให้ CommuMathy แนะนำเส้นทางการเรียนที่เหมาะกับคุณ</p><div className="assessment-facts"><span><ListChecks size={17} /><strong>3 ข้อ</strong> คำถาม</span><span><Clock3 size={17} /><strong>ประมาณ 5 นาที</strong></span><span><Target size={17} /><strong>2 หัวข้อ</strong> สำคัญ</span></div><button className="primary-button large-button" onClick={() => setStarted(true)}>เริ่มทำแบบประเมิน <ArrowRight size={17} /></button><small className="privacy-note"><Info size={13} /> ผลการทำแบบประเมินจะบันทึกไว้ในอุปกรณ์นี้เท่านั้น</small></div></div></>
  return <><div className="assessment-top"><div><button className="back-button" onClick={() => setStarted(false)}><ArrowLeft size={16} /> กลับ</button><h1>แบบประเมินพื้นฐาน</h1></div><div className="assessment-timer"><Clock3 size={17} /><span>เวลาที่ใช้</span><strong>08:24</strong></div></div><div className="assessment-layout"><aside className="assessment-nav"><strong>คำถามทั้งหมด</strong><div className="question-grid">{assessmentQuestions.map((_, i) => <button key={i} className={answers[i] !== undefined ? 'answered' : ''}>{i + 1}</button>)}</div><div className="answer-legend"><span><i className="answered-dot" /> ตอบแล้ว</span><span><i className="empty-dot" /> ยังไม่ตอบ</span></div></aside><section className="assessment-question-list"><div className="assessment-progress-label"><span>ความคืบหน้า</span><strong>{Object.keys(answers).length}/{assessmentQuestions.length} ข้อ</strong></div><div className="progress-line"><span style={{ width: `${(Object.keys(answers).length / assessmentQuestions.length) * 100}%` }} /></div>{assessmentQuestions.map((q, i) => <div className="assessment-question" key={q.id}><div className="assessment-question-heading"><span>คำถามที่ {i + 1}</span><span className="chip">{q.topic}</span></div><h2>{q.prompt}</h2><div className="assessment-options">{q.choices.map((choice, choiceIndex) => <button key={choice} className={answers[i] === choiceIndex ? 'selected' : ''} onClick={() => setAnswers((a) => ({ ...a, [i]: choiceIndex }))}><span>{String.fromCharCode(65 + choiceIndex)}</span>{choice}</button>)}</div></div>)}<button className="primary-button submit-assessment" disabled={Object.keys(answers).length < assessmentQuestions.length} onClick={() => { setSubmitted(true); setProgress((p) => ({ ...p, assessmentScore: Math.round((score / assessmentQuestions.length) * 100), xp: p.xp + score * 20 })) }}>ส่งคำตอบและดูผลลัพธ์ <ArrowRight size={17} /></button></section></div></>
}
function AssessmentResults({ score, total, progress, onLessons }: { score: number; total: number; progress: ProgressState; onLessons: () => void }) { const percentage = Math.round((score / total) * 100); return <><PageIntro eyebrow="ผลการประเมินของคุณ" title="เห็นภาพชัดขึ้น แล้วไปต่อด้วยกัน" description="ผลลัพธ์นี้เป็นข้อมูลเบื้องต้นจากคำตอบชุดนี้ ใช้เป็นแนวทางวางแผนการเรียน ไม่ใช่การตัดสินความสามารถ" action={<button className="outline-button" onClick={onLessons}><BookOpen size={16} /> ดูบทเรียนแนะนำ</button>} /><div className="results-summary"><div className="result-score"><div className="score-circle"><strong>{percentage}%</strong><span>คะแนนรวม</span></div><div><span className="result-kicker">ทำได้ {score} จาก {total} ข้อ</span><h2>{percentage >= 70 ? 'พื้นฐานกำลังแข็งแรง!' : 'เรามาหาจุดที่ต้องเสริมกัน'}</h2><p>ทุกคำตอบช่วยให้เราเข้าใจเส้นทางของคุณมากขึ้น</p></div></div><div className="result-stats"><div><strong>{score}</strong><span>ตอบถูก</span></div><div><strong>{total - score}</strong><span>ควรทบทวน</span></div><div><strong>{progress.streak}</strong><span>วันต่อเนื่อง</span></div></div></div><div className="result-grid"><div className="result-panel"><div className="panel-heading"><h3>ภาพรวมรายหัวข้อ</h3><span>จากแบบประเมินครั้งนี้</span></div>{['สมการและพีชคณิต', 'การคิดเชิงเหตุผล', 'จำนวนและการคำนวณ'].map((topic, i) => <div className="topic-result" key={topic}><div><span>{topic}</span><strong>{i === 0 ? Math.min(100, percentage + 4) : i === 1 ? Math.max(25, percentage - 12) : Math.min(100, percentage + 14)}%</strong></div><div className="progress-line"><span style={{ width: `${i === 0 ? Math.min(100, percentage + 4) : i === 1 ? Math.max(25, percentage - 12) : Math.min(100, percentage + 14)}%` }} /></div></div>)}</div><div className="result-panel recommendation-panel"><div className="recommendation-icon"><Sparkles size={18} /></div><div><span className="result-kicker">แนะนำสำหรับคุณ</span><h3>เริ่มจากการทบทวนสมการ</h3><p>จากคำตอบของคุณ บทเรียนนี้น่าจะช่วยเสริมความมั่นใจก่อนเข้าสู่ฟังก์ชัน</p><button className="text-button" onClick={onLessons}>เปิดเส้นทางแนะนำ <ArrowRight size={15} /></button></div></div></div></> }

function TutorPage({ messages, setMessages }: { messages: TutorMessage[]; setMessages: React.Dispatch<React.SetStateAction<TutorMessage[]>> }) {
  const [input, setInput] = useState('')
  const [file, setFile] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const sendMessage = (text = input) => { if (!text.trim() && !file) return; const now = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }); setMessages((m) => [...m, { role: 'user', text: text || 'ช่วยดูโจทย์จากรูปนี้ให้หน่อยค่ะ', time: now }, { role: 'tutor', text: demoTutorReply(text), time: now }]); setInput(''); setFile(null) }
  return <><PageIntro eyebrow="ผู้ช่วยคิดไปด้วยกัน" title="ติวเตอร์คณิตศาสตร์ AI" description="ถามได้ทุกเรื่อง ค่อย ๆ คิดไปทีละขั้น และเลือกขอคำใบ้แทนคำตอบได้" action={<div className="demo-badge"><span className="status-dot" /> โหมดสาธิต • ยังไม่เชื่อมต่อโมเดลจริง</div>} /><div className="tutor-layout"><aside className="tutor-history"><button className="primary-button new-chat"><Plus size={17} /> เริ่มบทสนทนาใหม่</button><div className="history-label">ประวัติการคุย</div>{['ทำความเข้าใจเรื่องย้ายข้าง', 'โจทย์พีทาโกรัส', 'ทบทวนก่อนสอบ ม.3'].map((item, i) => <button className={`history-item ${i === 0 ? 'active' : ''}`} key={item}><MessageCircle size={16} /><span>{item}</span><MoreHorizontal size={15} /></button>)}<div className="tutor-history-footer"><Info size={15} /><span>คำตอบในโหมดสาธิตเป็นตัวอย่างเพื่อแสดงประสบการณ์ใช้งาน</span></div></aside><section className="chat-window"><div className="chat-header"><div className="tutor-avatar"><Bot size={21} /></div><div><strong>Mathy Tutor</strong><span><span className="status-dot" /> พร้อมช่วยอธิบาย</span></div><button className="icon-button"><MoreHorizontal size={18} /></button></div><div className="chat-messages">{messages.map((message, i) => <div className={`chat-row ${message.role}`} key={`${message.time}-${i}`}><div className={`chat-avatar ${message.role}`}>{message.role === 'tutor' ? <Sparkles size={16} /> : 'พช'}</div><div className="message-wrap"><div className="message-bubble">{message.text.split('\n').map((line, index) => <span key={index}>{line}{index < message.text.split('\n').length - 1 && <br />}</span>)}{message.role === 'tutor' && i > 0 && <div className="message-reaction"><button><ThumbsUp size={13} /></button><button><ThumbsUp size={13} className="downvote" /></button></div>}</div><small>{message.time}</small></div></div>)}{file && <div className="upload-preview"><ImagePlus size={16} /> แนบรูปแล้ว <button onClick={() => setFile(null)}><X size={14} /></button></div>}</div><div className="suggestion-row">{['ขอคำใบ้หน่อย', 'ช่วยตรวจวิธีทำ', 'อธิบายแบบง่าย ๆ'].map((suggestion) => <button key={suggestion} onClick={() => sendMessage(suggestion)}><Lightbulb size={14} /> {suggestion}</button>)}</div><div className="chat-composer"><button className="attach-button" onClick={() => fileRef.current?.click()} aria-label="แนบรูป"><Paperclip size={19} /></button><input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => setFile(e.target.files?.[0]?.name ?? null)} /><input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendMessage() }} placeholder="พิมพ์คำถามคณิตศาสตร์ของคุณ..." aria-label="คำถามถึงติวเตอร์" /><button className="send-button" onClick={() => sendMessage()} aria-label="ส่ง"><Send size={18} /></button></div></section></div></>
}
function GeminiTutorPage({ messages, setMessages }: { messages: TutorMessage[]; setMessages: React.Dispatch<React.SetStateAction<TutorMessage[]>> }) {
  const [input, setInput] = useState('')
  const [file, setFile] = useState<string | null>(null)
  const [status, setStatus] = useState<GeminiStatus | null>(null)
  const [isSending, setIsSending] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let active = true
    fetch('/api/gemini/status')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Status unavailable')))
      .then((nextStatus: GeminiStatus) => { if (active) setStatus(nextStatus) })
      .catch(() => { if (active) setStatus({ configured: false, model: 'gemini-3.8-flash' }) })
    return () => { active = false }
  }, [])

  const sendMessage = async (text = input) => {
    const prompt = text.trim() || (file ? 'ช่วยดูโจทย์จากรูปนี้ให้หน่อยค่ะ' : '')
    if (!prompt || isSending) return

    const now = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    const userMessage: TutorMessage = { role: 'user', text: prompt, time: now }
    const history = [...messages, userMessage]
    setMessages(history)
    setInput('')
    setFile(null)
    setIsSending(true)

    try {
      if (!status?.configured) {
        setMessages((current) => [...current, { role: 'tutor', text: demoTutorReply(prompt), time: now }])
        return
      }

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: history.map((message) => ({
            role: message.role === 'tutor' ? 'model' : 'user',
            parts: [{ text: message.text }],
          })),
        }),
      })
      const payload = await response.json().catch(() => ({})) as { text?: string; error?: string }
      if (!response.ok || !payload.text) throw new Error(payload.error || 'Gemini request failed')
      setMessages((current) => [...current, { role: 'tutor', text: payload.text ?? '', time: now }])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'เชื่อมต่อ Gemini ไม่สำเร็จ'
      setMessages((current) => [...current, { role: 'tutor', text: `ขออภัยค่ะ ตอนนี้เชื่อมต่อ Gemini ไม่สำเร็จ (${message}) จึงขอใช้คำตอบตัวอย่างแทน\n\n${demoTutorReply(prompt)}`, time: now }])
    } finally {
      setIsSending(false)
    }
  }

  const connected = Boolean(status?.configured)
  const modelLabel = connected ? `Gemini Flash • ${status?.model}` : 'โหมดสาธิต • ยังไม่เชื่อมต่อโมเดลจริง'

  return <><PageIntro eyebrow="ผู้ช่วยคิดไปด้วยกัน" title="ติวเตอร์คณิตศาสตร์ AI" description="ถามได้ทุกเรื่อง ค่อย ๆ คิดไปทีละขั้น และเลือกขอคำใบ้แทนคำตอบได้" action={<div className={`demo-badge ${connected ? 'model-badge' : ''}`}><span className="status-dot" /> {modelLabel}</div>} /><div className="tutor-layout"><aside className="tutor-history"><button className="primary-button new-chat" onClick={() => setMessages(defaultTutor)}><Plus size={17} /> เริ่มบทสนทนาใหม่</button><div className="history-label">ประวัติการคุย</div>{['ทำความเข้าใจเรื่องย้ายข้าง', 'โจทย์พีทาโกรัส', 'ทบทวนก่อนสอบ ม.3'].map((item, i) => <button className={`history-item ${i === 0 ? 'active' : ''}`} key={item}><MessageCircle size={16} /><span>{item}</span><MoreHorizontal size={15} /></button>)}<div className="tutor-history-footer"><Info size={15} /><span>{connected ? 'เชื่อมต่อ Gemini Flash ผ่านเซิร์ฟเวอร์ของแอปแล้ว' : 'คำตอบในโหมดสาธิตเป็นตัวอย่างเพื่อแสดงประสบการณ์ใช้งาน'}</span></div></aside><section className="chat-window"><div className="chat-header"><div className="tutor-avatar"><Bot size={21} /></div><div><strong>Mathy Tutor</strong><span><span className="status-dot" /> {connected ? `Gemini Flash • ${status?.model}` : 'พร้อมช่วยอธิบาย'}</span></div><button className="icon-button"><MoreHorizontal size={18} /></button></div><div className="chat-messages">{messages.map((message, i) => <div className={`chat-row ${message.role}`} key={`${message.time}-${i}`}><div className={`chat-avatar ${message.role}`}>{message.role === 'tutor' ? <Sparkles size={16} /> : 'พช'}</div><div className="message-wrap"><div className="message-bubble">{message.text.split('\n').map((line, index) => <span key={index}>{line}{index < message.text.split('\n').length - 1 && <br />}</span>)}{message.role === 'tutor' && i > 0 && <div className="message-reaction"><button><ThumbsUp size={13} /></button><button><ThumbsUp size={13} className="downvote" /></button></div>}</div><small>{message.time}</small></div></div>)}{isSending && <div className="chat-row tutor"><div className="chat-avatar tutor"><Sparkles size={16} /></div><div className="message-wrap"><div className="message-bubble">กำลังคิด…</div></div></div>}{file && <div className="upload-preview"><ImagePlus size={16} /> แนบรูปแล้ว <button onClick={() => setFile(null)}><X size={14} /></button></div>}</div><div className="suggestion-row">{['ขอคำใบ้หน่อย', 'ช่วยตรวจวิธีทำ', 'อธิบายแบบง่าย ๆ'].map((suggestion) => <button key={suggestion} disabled={isSending} onClick={() => sendMessage(suggestion)}><Lightbulb size={14} /> {suggestion}</button>)}</div><div className="chat-composer"><button className="attach-button" onClick={() => fileRef.current?.click()} aria-label="แนบรูป" disabled={isSending}><Paperclip size={19} /></button><input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => setFile(e.target.files?.[0]?.name ?? null)} /><input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendMessage() }} placeholder="พิมพ์คำถามคณิตศาสตร์ของคุณ..." aria-label="คำถามถึงติวเตอร์" disabled={isSending} /><button className="send-button" onClick={() => sendMessage()} aria-label={isSending ? 'กำลังส่ง' : 'ส่ง'} disabled={isSending}><Send size={18} /></button></div></section></div></>
}

function demoTutorReply(text: string) { if (text.includes('ใบ้')) return 'ได้เลยค่ะ ลองเริ่มจากเขียนสิ่งที่โจทย์ให้มาก่อน แล้วถามตัวเองว่า “เราต้องการหาค่าอะไร” จากนั้นเลือกสมบัติทางคณิตศาสตร์ที่ทำให้ตัวแปรอยู่เพียงข้างเดียว โดยทำเหมือนกันทั้งสองข้างนะคะ'; if (text.includes('ตรวจ')) return 'ส่งวิธีทำมาได้เลยค่ะ ในโหมดสาธิตนี้ฉันจะช่วยชี้จุดที่ควรตรวจ โดยจะแยกให้เห็นชัดว่าคำตอบสุดท้ายถูกหรือไม่ และเหตุผลแต่ละขั้นสมเหตุสมผลหรือเปล่า'; return 'คำถามนี้น่าสนใจมากค่ะ ลองแยกโจทย์เป็น “สิ่งที่รู้” กับ “สิ่งที่ต้องหา” ก่อนนะคะ จากนั้นฉันจะแนะนำคำถามเล็ก ๆ ให้คุณลองคิดต่อเองทีละขั้น (คำตอบนี้เป็นตัวอย่างในโหมดสาธิต)'; }

function CommunityPage({ posts, setPosts, user }: { posts: DiscussionPost[]; setPosts: React.Dispatch<React.SetStateAction<DiscussionPost[]>>; user: UserProfile | null }) {
  const [query, setQuery] = useState(''); const [sort, setSort] = useState<'recent' | 'popular'>('recent'); const [showCreate, setShowCreate] = useState(false); const [title, setTitle] = useState(''); const [body, setBody] = useState(''); const [selectedPost, setSelectedPost] = useState<DiscussionPost | null>(null); const [reply, setReply] = useState('')
  const visible = posts.filter((post) => `${post.title} ${post.body} ${post.tag}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === 'popular' ? b.likes - a.likes : b.id.localeCompare(a.id))
  const createPost = () => {
    if (!title.trim() || !body.trim()) return
    const authorName = user?.name ?? 'นักเรียน'
    setPosts((p) => [{ id: `post-${Date.now()}`, title, body, author: authorName, initials: getUserInitials(authorName), tag: 'คำถาม', time: 'เมื่อสักครู่', likes: 0, comments: 0, replies: [] }, ...p])
    setTitle('')
    setBody('')
    setShowCreate(false)
  }
  const addReply = () => {
    if (!selectedPost || !reply.trim()) return
    const replyAuthor = user?.name ?? 'นักเรียน'
    setPosts((all) => all.map((p) => p.id === selectedPost.id ? { ...p, comments: p.comments + 1, replies: [...p.replies, `${replyAuthor}: ${reply}`] } : p))
    setSelectedPost({ ...selectedPost, comments: selectedPost.comments + 1, replies: [...selectedPost.replies, `${replyAuthor}: ${reply}`] })
    setReply('')
  }
  return <><PageIntro eyebrow="เรียนรู้ไปด้วยกัน" title="ชุมชนการเรียนรู้" description="ถาม แบ่งปันวิธีคิด และช่วยกันทำให้คณิตศาสตร์เข้าใจง่ายขึ้น" action={<button className="primary-button" onClick={() => setShowCreate(true)}><Plus size={17} /> ตั้งคำถามใหม่</button>} /><div className="community-toolbar"><div className="community-search"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหาคำถามหรือหัวข้อ..." /></div><div className="sort-buttons"><button className={sort === 'recent' ? 'active' : ''} onClick={() => setSort('recent')}>ล่าสุด</button><button className={sort === 'popular' ? 'active' : ''} onClick={() => setSort('popular')}>ยอดนิยม</button></div></div><div className="community-layout"><section className="post-feed"><div className="feed-label"><strong>{visible.length} การสนทนา</strong><span>พื้นที่ปลอดภัยสำหรับการเรียนรู้</span></div>{visible.map((post) => <PostCard key={post.id} post={post} onOpen={() => setSelectedPost(post)} onLike={() => setPosts((all) => all.map((p) => p.id === post.id ? { ...p, likes: p.likes + (p.liked ? -1 : 1), liked: !p.liked } : p))} />)}{visible.length === 0 && <div className="empty-state"><Search size={24} /><h3>ยังไม่พบการสนทนา</h3><p>ลองใช้คำค้นอื่น หรือเป็นคนเริ่มถามคำถามแรกกันเลย</p></div>}</section><aside className="community-aside"><div className="side-card topic-card"><div className="side-card-heading"><h3>หัวข้อยอดนิยม</h3></div>{['พีชคณิต', 'เรขาคณิต', 'โจทย์ประยุกต์', 'เตรียมสอบ ม.3'].map((topic, i) => <button className="topic-row" key={topic}><span className={`topic-color color-${i}`} />{topic}<span>{[24, 18, 12, 9][i]}</span></button>)}</div><div className="community-guideline"><Users size={18} /><strong>ช่วยกันสร้างพื้นที่ที่ดี</strong><p>อธิบายด้วยเหตุผล ให้เกียรติกัน และจำไว้ว่าทุกคนกำลังเรียนรู้</p></div></aside></div>{showCreate && <div className="modal-backdrop"><div className="create-modal"><div className="modal-heading"><div><span className="eyebrow-dot" /> ตั้งคำถามใหม่</div><button onClick={() => setShowCreate(false)}><X size={19} /></button></div><label>หัวข้อคำถาม<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น มีวิธีคิดข้อนี้แบบอื่นไหม?" /></label><label>รายละเอียด<textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="เล่าโจทย์หรือสิ่งที่ลองทำมาแล้วได้เลย..." rows={5} /></label><div className="modal-actions"><button className="outline-button" onClick={() => setShowCreate(false)}>ยกเลิก</button><button className="primary-button" disabled={!title.trim() || !body.trim()} onClick={createPost}>เผยแพร่คำถาม <Send size={16} /></button></div></div></div>}{selectedPost && <div className="modal-backdrop" onClick={() => setSelectedPost(null)}><div className="post-detail-modal" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setSelectedPost(null)}><X size={18} /></button><PostCard post={selectedPost} onOpen={() => undefined} onLike={() => undefined} /><div className="reply-list">{selectedPost.replies.map((item, i) => <div className="reply-item" key={i}><div className="avatar avatar-lavender">{i === 0 ? 'คม' : 'พช'}</div><div><strong>{i === 0 ? 'ครูเมย์' : (user?.name ?? 'พิมพ์ชนก')}</strong><p>{item}</p></div></div>)}</div><div className="reply-composer"><input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="เขียนคำตอบที่ช่วยให้เพื่อนเข้าใจ..." /><button onClick={addReply}><Send size={16} /></button></div></div></div>}</>
}
function PostCard({ post, onOpen, onLike }: { post: DiscussionPost; onOpen: () => void; onLike: () => void }) { return <article className="post-card"><div className="post-author"><div className={`avatar ${post.initials === 'พพ' ? 'avatar-peach' : post.initials === 'ตน' ? 'avatar-teal' : 'avatar-lavender'}`}>{post.initials}</div><div><strong>{post.author}</strong><span>{post.time}</span></div><button className="more-button"><MoreHorizontal size={18} /></button></div><button className="post-content" onClick={onOpen}><div className="post-title-row"><h3>{post.title}</h3><span className="post-tag">{post.tag}</span></div><p>{post.body}</p></button><div className="post-actions"><button className={post.liked ? 'liked' : ''} onClick={onLike}><ThumbsUp size={15} /> มีประโยชน์ <span>{post.likes}</span></button><button onClick={onOpen}><MessageCircle size={15} /> ความคิดเห็น <span>{post.comments}</span></button><button className="share-button"><Upload size={15} /> แชร์</button></div></article> }

function LeaderboardPage({ progress, user }: { progress: ProgressState; user: UserProfile | null }) {
  const currentUserName = user?.name ?? 'คุณ'
  const currentUserInitials = getUserInitials(currentUserName)
  return <><PageIntro eyebrow="เติบโตไปด้วยกัน" title="กระดานคะแนน" description="คะแนนเป็นแรงจูงใจเล็ก ๆ ให้เราเรียนต่อเนื่อง ไม่ใช่ตัววัดคุณค่าหรือความเก่งของใคร" action={<div className="leaderboard-actions"><div className="demo-badge"><span className="status-dot" /> ข้อมูลตัวอย่างในโหมดเดโม</div><div className="period-select">สัปดาห์นี้ <ChevronDown size={15} /></div></div>} /><div className="leaderboard-layout"><section className="leaderboard-main"><div className="podium"><div className="podium-person second"><div className="podium-avatar silver-bg">ตน</div><strong>ต้นน้ำ</strong><span>1,080 XP</span><div className="podium-block block-two">2</div></div><div className="podium-person first"><div className="crown">✦</div><div className="podium-avatar gold-bg">ขห</div><strong>น้องข้าวหอม</strong><span>1,240 XP</span><div className="podium-block block-one">1</div></div><div className="podium-person third"><div className="podium-avatar bronze-bg">{currentUserInitials}</div><strong>{currentUserName}</strong><span>{progress.xp.toLocaleString()} XP</span><div className="podium-block block-three">3</div></div></div><div className="rank-list">{leaderboard.map((person) => <div className={`rank-row ${person.rank === 3 ? 'current-user' : ''}`} key={person.rank}><span className="rank-number">{person.rank}</span><div className={`avatar avatar-${person.color}`}>{person.rank === 3 ? currentUserInitials : person.initials}</div><div className="rank-name"><strong>{person.rank === 3 ? currentUserName : person.name} {person.rank === 3 && <span>(คุณ)</span>}</strong><small>{person.rank === 1 ? 'เรียน 4 วันติด' : person.rank === 2 ? 'ทำแบบฝึกหัดเก่ง' : 'กำลังไปได้ดี'}</small></div><strong className="rank-xp">{person.rank === 3 ? progress.xp.toLocaleString() : person.xp.replace(' XP', '')} XP</strong></div>)}</div></section><aside className="leaderboard-side"><div className="side-card your-rank"><div className="side-card-heading"><h3>อันดับของคุณ</h3><span>สัปดาห์นี้</span></div><div className="your-rank-number"><strong>#3</strong><span>จาก 24 คน</span></div><div className="rank-up"><ArrowUpSmall /> ขึ้นมา 2 อันดับจากสัปดาห์ก่อน</div><div className="xp-bar"><span style={{ width: '70%' }} /></div><small>อีก 240 XP จะถึงอันดับ #2</small></div><div className="side-card rewards-card"><div className="reward-icon"><Award size={20} /></div><h3>สะสมความสำเร็จ</h3><p>คุณปลดล็อกแล้ว 4 จาก 12 เหรียญ</p><div className="reward-dots"><i className="unlocked" /><i className="unlocked" /><i className="unlocked" /><i className="unlocked" /><i /><i /><i /><i /></div><button className="text-button">ดูความสำเร็จทั้งหมด <ArrowRight size={14} /></button></div></aside></div></>
}
function ArrowUpSmall() { return <span className="arrow-up-small">↑</span> }

function ProfilePage({ user, progress, onNavigate, onLesson, onOpenSave, onOpenAuth }: { user: UserProfile | null; progress: ProgressState; onNavigate: (p: Page) => void; onLesson: (l: Lesson) => void; onOpenSave: () => void; onOpenAuth: () => void }) {
  const displayName = user?.name ?? 'นักเรียน'
  const initials = getUserInitials(displayName)
  const gradeLabel = user ? `${user.grade} • ${user.level}` : 'ยังไม่ได้ลงชื่อเข้าใช้'

  return <><div className="profile-hero"><div className="profile-banner-shape" /><div className="profile-main"><div className="profile-avatar-large">{initials}</div><div><div className="profile-name-row"><h1>{displayName}</h1><span className="level-badge"><Sparkles size={13} /> {user?.grade ?? 'นักเรียน'}</span></div><p>นักเรียนชั้น {gradeLabel} • สมาชิก CommuMathy</p><div className="profile-stat-row"><span><Flame size={15} /> <strong>{progress.streak}</strong> วันต่อเนื่อง</span><span><Zap size={15} /> <strong>{progress.xp.toLocaleString()}</strong> XP</span><span><BookOpen size={15} /> <strong>{progress.completedLessons.length}</strong> บทเรียนจบแล้ว</span></div><div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}><button className="primary-button" onClick={onOpenSave} style={{ height: 36, fontSize: 12 }}><Save size={14} /> จัดการไฟล์ Save</button><button className="outline-button" onClick={onOpenAuth} style={{ height: 36, fontSize: 12 }}><UserRound size={14} /> สลับบัญชี / เข้าสู่ระบบ</button></div></div></div><button className="outline-button profile-edit" onClick={() => onNavigate('settings')}><PenLine size={15} /> แก้ไขโปรไฟล์</button></div><div className="profile-grid"><section><SectionHeading title="เส้นทางการเรียนรู้" /><div className="profile-progress-card"><div className="profile-progress-head"><div><span>ความก้าวหน้าโดยรวม</span><strong>{Math.round(progress.xp / 12)}%</strong></div><Target size={22} /></div><div className="progress-line"><span style={{ width: `${Math.min(100, progress.xp / 12)}%` }} /></div><div className="profile-progress-foot"><span>เริ่มต้นได้ดีมาก รักษาจังหวะนี้ไว้</span><span>เป้าหมาย: 1,000 XP</span></div></div><SectionHeading title="บทเรียนที่บันทึกไว้" link="ดูทั้งหมด" onLink={() => onNavigate('lessons')} />{progress.bookmarks.length > 0 ? progress.bookmarks.map((id) => { const l = lessons.find((x) => x.id === id); return l ? <LessonMiniCard key={id} lesson={l} onClick={() => onLesson(l)} /> : null }) : <div className="empty-state compact"><Bookmark size={22} /><p>ยังไม่มีบทเรียนที่บันทึกไว้</p></div>}</section><aside><div className="side-card achievement-card"><div className="side-card-heading"><h3>ความสำเร็จล่าสุด</h3><button>ดูทั้งหมด</button></div><div className="achievement"><div className="achievement-icon yellow-achievement"><Flame size={19} /></div><div><strong>ไฟแรงต่อเนื่อง</strong><span>เรียนติดต่อกันครบ 5 วัน</span></div><Check size={16} /></div><div className="achievement"><div className="achievement-icon purple-achievement"><Target size={19} /></div><div><strong>นักแก้โจทย์</strong><span>ตอบถูกครบ 5 ข้อ</span></div><Check size={16} /></div></div><div className="side-card activity-card"><div className="side-card-heading"><h3>กิจกรรมล่าสุด</h3></div><div className="activity-line"><span className="activity-dot green-dot" /><div><strong>ทำแบบฝึกหัด</strong><p>สมการเชิงเส้น • 3 ข้อ</p></div><small>วันนี้</small></div><div className="activity-line"><span className="activity-dot purple-dot" /><div><strong>เข้าเรียนบทเรียน</strong><p>สมการเชิงเส้นตัวแปรเดียว</p></div><small>เมื่อวาน</small></div></div></aside></div></>
}

function SettingsPage({ user, onUpdateUser, onThemeChange, onOpenSave, onOpenAuth }: { user: UserProfile | null; onUpdateUser: (u: UserProfile | null) => void; onThemeChange: (theme: SettingsState['theme']) => void; onOpenSave: () => void; onOpenAuth: () => void }) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [settings, setSettings] = useState<SettingsState>(() => readStorage('commumathy-settings', defaultSettings))
  const [saved, setSaved] = useState(true)

  const update = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((current) => ({ ...current, [key]: value }))
    if (key === 'theme') onThemeChange(value as SettingsState['theme'])
    setSaved(false)
  }

  const save = () => {
    localStorage.setItem('commumathy-settings', JSON.stringify(settings))
    if (user) {
      const updated: UserProfile = {
        ...user,
        name: settings.displayName.trim() || user.name,
        grade: settings.grade,
        level: determineLevel(settings.grade),
        lastActiveAt: new Date().toISOString(),
      }
      onUpdateUser(updated)
      saveStoredUser(updated)
    }
    setSaved(true)
  }

  const reset = () => {
    setSettings(defaultSettings)
    onThemeChange(defaultSettings.theme)
    setSaved(false)
  }

  const tabs: { id: SettingsTab; label: string; description: string; icon: typeof UserRound }[] = [
    { id: 'profile', label: 'บัญชีและโปรไฟล์', description: 'ข้อมูลที่แสดงกับเพื่อน', icon: UserRound },
    { id: 'notifications', label: 'การแจ้งเตือน', description: 'เลือกสิ่งที่อยากให้เตือน', icon: Bell },
    { id: 'appearance', label: 'การแสดงผล', description: 'ปรับหน้าตาให้อ่านง่าย', icon: Palette },
    { id: 'learning', label: 'การเรียนรู้', description: 'ตั้งจังหวะการฝึกของคุณ', icon: GraduationCap },
  ]
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0]
  return <><PageIntro eyebrow="ปรับให้เป็นแบบของคุณ" title="ตั้งค่า" description="จัดการข้อมูลส่วนตัว การแจ้งเตือน และรูปแบบการเรียนรู้ของคุณได้ในที่เดียว" /><div className="settings-layout"><aside className="settings-nav" aria-label="หมวดการตั้งค่า">{tabs.map(({ id, label, description, icon: Icon }) => <button key={id} className={activeTab === id ? 'active' : ''} onClick={() => setActiveTab(id)}><Icon size={17} /><span><strong>{label}</strong><small>{description}</small></span></button>)}</aside><section className="settings-panel"><div className="settings-panel-heading"><div><span className="eyebrow-dot" /> การตั้งค่าของฉัน<h2>{active.label}</h2><p>{active.description}</p></div><span className="settings-status"><span className={`status-dot ${saved ? 'saved' : 'unsaved'}`} /> {saved ? 'บันทึกแล้ว' : 'มีการเปลี่ยนแปลง'}</span></div>{activeTab === 'profile' && <><div className="settings-section profile-settings-section"><div className="settings-section-copy"><h2>ข้อมูลโปรไฟล์</h2><p>ข้อมูลนี้จะแสดงในระบบและช่วยปรับคำแนะนำระดับชั้นให้เหมาะกับคุณ (ไม่ต้องใช้อีเมล)</p></div><div className="profile-summary"><div className="profile-settings-avatar">{getUserInitials(settings.displayName)}</div><div><strong>{settings.displayName}</strong><span>นักเรียน {settings.grade} • สมาชิก CommuMathy</span></div><button className="outline-button" onClick={() => update('displayName', settings.displayName.trim() || 'นักเรียน')}>อัปเดตชื่อ</button></div><div className="profile-form"><label>ชื่อที่แสดง / ชื่อเล่น<input value={settings.displayName} onChange={(event) => update('displayName', event.target.value)} placeholder="เช่น พิมพ์ชนก" /></label><label>ระดับชั้นการศึกษา<select value={settings.grade} onChange={(event) => update('grade', event.target.value as GradeLevel)}><option value="ม.1">มัธยมศึกษาปีที่ 1 (ม.1)</option><option value="ม.2">มัธยมศึกษาปีที่ 2 (ม.2)</option><option value="ม.3">มัธยมศึกษาปีที่ 3 (ม.3)</option><option value="ม.4">มัธยมศึกษาปีที่ 4 (ม.4)</option><option value="ม.5">มัธยมศึกษาปีที่ 5 (ม.5)</option><option value="ม.6">มัธยมศึกษาปีที่ 6 (ม.6)</option></select></label><label>เกี่ยวกับฉัน<textarea value={settings.bio} onChange={(event) => update('bio', event.target.value)} placeholder="เล่าเกี่ยวกับเป้าหมายการเรียนของคุณ" rows={3} /></label></div></div><div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--cm-line)' }}><h3>ระบบสำรองข้อมูลและไฟล์ Save</h3><p style={{ fontSize: 11, color: 'var(--cm-muted)', margin: '4px 0 12px' }}>ส่งออกความคืบหน้าเป็นไฟล์ .cmmathy ป้องกันการแก้ไขสถิติ หรือกู้คืนข้อมูลเดิม</p><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><button type="button" className="outline-button" onClick={onOpenSave}><Save size={15} /> จัดการไฟล์ Save / ส่งออกไฟล์</button><button type="button" className="text-button" onClick={onOpenAuth}><UserRound size={15} /> สลับบัญชีผู้ใช้</button></div></div><div className="settings-info-strip" style={{ marginTop: 14 }}><Info size={16} /><span>ข้อมูลของคุณถูกบันทึกไว้ในเบราว์เซอร์ของอุปกรณ์นี้ สามารถดาวน์โหลดไฟล์ Save เพื่อสำรองข้อมูลได้ตลอดเวลา</span></div></>}{activeTab === 'notifications' && <SettingsContent title="เลือกการแจ้งเตือนที่มีประโยชน์กับคุณ" description="เปิดเฉพาะสิ่งที่ช่วยให้คุณเรียนต่อเนื่องโดยไม่รบกวนเกินไป"><div className="setting-toggles"><Toggle label="เตือนการเรียนต่อเนื่อง" description="เตือนเบา ๆ เมื่อใกล้หมดวันและยังไม่ได้เรียน" checked={settings.dailyReminder} onChange={(value) => update('dailyReminder', value)} /><Toggle label="แจ้งเตือนการตอบกลับในชุมชน" description="บอกเมื่อมีคนตอบหรือช่วยต่อยอดคำถามของคุณ" checked={settings.communityReplies} onChange={(value) => update('communityReplies', value)} /><Toggle label="สรุปความก้าวหน้ารายสัปดาห์" description="รับภาพรวมบทเรียน แบบฝึกหัด และเป้าหมายที่เหลือ" checked={settings.weeklySummary} onChange={(value) => update('weeklySummary', value)} /></div></SettingsContent>}{activeTab === 'appearance' && <SettingsContent title="ทำให้หน้าจออ่านง่ายขึ้น" description="ตัวเลือกเหล่านี้มีผลกับการแสดงผลบนอุปกรณ์นี้"><div className="settings-choice-grid"><ChoiceCard label="ธีมสี" description="เลือกโหมดที่สบายตา" value={settings.theme} options={['สว่าง', 'มืด', 'ตามระบบ'] as const} onChange={(value) => update('theme', value)} /><ChoiceCard label="ขนาดตัวอักษร" description="ปรับให้เหมาะกับการอ่าน" value={settings.fontSize} options={['มาตรฐาน', 'ใหญ่'] as const} onChange={(value) => update('fontSize', value)} /></div><div className="settings-preview"><div className="preview-window"><span className="preview-dot" /><span className="preview-dot" /><span className="preview-dot" /><div><strong>ตัวอย่างการอ่านบทเรียน</strong><p>ปรับขนาดตัวอักษรเพื่ออ่านคำอธิบายและสมการได้สบายขึ้น</p></div></div><span>ตัวอย่างการแสดงผล</span></div></SettingsContent>}{activeTab === 'learning' && <SettingsContent title="ตั้งค่าจังหวะการเรียน" description="ช่วยให้บทเรียนและแบบฝึกหัดตรงกับเป้าหมายของคุณ"><div className="learning-preferences"><label>ระดับความท้าทายที่แนะนำ<select value={settings.difficulty} onChange={(event) => update('difficulty', event.target.value as SettingsState['difficulty'])}><option>พื้นฐาน</option><option>กำลังดี</option><option>ท้าทาย</option></select></label><div className="setting-toggles"><Toggle label="แสดงคำใบ้ก่อนเฉลย" description="ช่วยให้ได้ลองคิดด้วยตัวเองมากขึ้น" checked={settings.showHints} onChange={(value) => update('showHints', value)} /><Toggle label="แสดงสมการแบบเต็มหน้าจอ" description="เหมาะกับการอ่านบนมือถือ" checked={settings.fullScreenMath} onChange={(value) => update('fullScreenMath', value)} /></div></div></SettingsContent>}<div className="settings-footer"><button className="reset-settings" onClick={reset}><RotateCcw size={14} /> คืนค่าเริ่มต้น</button><div><span>{saved ? <><Check size={15} /> บันทึกแล้ว</> : 'การเปลี่ยนแปลงยังไม่ได้บันทึก'}</span><button className="primary-button" onClick={save}><Save size={15} /> บันทึกการตั้งค่า</button></div></div></section></div></>
}

function SettingsContent({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <div className="settings-section"><div className="settings-section-copy"><h2>{title}</h2><p>{description}</p></div>{children}</div> }
function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) { return <button type="button" className="toggle-row" onClick={() => onChange(!checked)} aria-pressed={checked}><div><strong>{label}</strong><span>{description}</span></div><span className={`toggle ${checked ? 'on' : ''}`}><i /></span></button> }
function ChoiceCard<T extends string>({ label, description, value, options, onChange }: { label: string; description: string; value: T; options: readonly T[]; onChange: (value: T) => void }) { return <div className="choice-card"><div><strong>{label}</strong><span>{description}</span></div><div className="choice-buttons">{options.map((option) => <button type="button" key={option} className={value === option ? 'selected' : ''} onClick={() => onChange(option)}>{option}</button>)}</div></div> }

export default App
