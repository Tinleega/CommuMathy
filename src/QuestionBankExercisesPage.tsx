import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, Clock3, Lightbulb, RotateCcw, Shuffle, Sparkles, Target, X, Zap } from 'lucide-react'
import { curriculumChapters, type CurriculumChapter } from './curriculum'
import {
  createExerciseSession,
  eligibleQuestions,
  evaluateResponse,
  loadExerciseSession,
  performanceForChapter,
  recordPerformance,
  retryIncorrect,
  saveExerciseSession,
  questionBankValidation,
  type BankDifficulty,
  type ExerciseSession,
  type QuestionFilters,
  type SessionLength,
} from './questionBank'

type ProgressLike = { xp: number; exerciseCorrect: number; exerciseTotal: number }

const difficultyLabels: Record<BankDifficulty | 'all', string> = {
  all: 'ทุกระดับ',
  easy: 'พื้นฐาน',
  intermediate: 'กำลังดี',
  advanced: 'ท้าทาย',
  challenge: 'โจทย์คิดวิเคราะห์',
}

function firstFilters(activeChapter: CurriculumChapter | null): QuestionFilters {
  const chapter = activeChapter ?? curriculumChapters[0]
  const offering = chapter.offerings[0]
  return { chapterId: chapter.id, grade: offering?.grade ?? 'ทั้งหมด', semester: offering?.semester ?? 'ทั้งหมด', course: offering?.course ?? 'all', subtopic: 'all', difficulty: 'all', count: 10 }
}

function filterForChapter(chapter: CurriculumChapter): QuestionFilters {
  const offering = chapter.offerings[0]
  return { chapterId: chapter.id, grade: offering?.grade ?? 'ทั้งหมด', semester: offering?.semester ?? 'ทั้งหมด', course: offering?.course ?? 'all', subtopic: 'all', difficulty: 'all', count: 10 }
}

export function QuestionBankExercisesPage({ progress, setProgress, onLesson, activeChapter }: { progress: ProgressLike; setProgress: React.Dispatch<React.SetStateAction<any>>; onLesson: () => void; activeChapter: CurriculumChapter | null }) {
  const [filters, setFilters] = useState<QuestionFilters>(() => firstFilters(activeChapter))
  const [session, setSession] = useState<ExerciseSession | null>(() => {
    const saved = loadExerciseSession()
    return saved && (!activeChapter || saved.filters.chapterId === activeChapter.id) ? saved : null
  })
  const [hintVisible, setHintVisible] = useState(false)
  const [solutionVisible, setSolutionVisible] = useState(false)

  useEffect(() => {
    if (!activeChapter) return
    setFilters((current) => current.chapterId === activeChapter.id ? current : filterForChapter(activeChapter))
    setSession((current) => current?.filters.chapterId === activeChapter.id ? current : null)
  }, [activeChapter])

  const selectedChapter = curriculumChapters.find((chapter) => chapter.id === filters.chapterId) ?? curriculumChapters[0]
  const gradeOptions = useMemo(() => Array.from(new Set(selectedChapter.offerings.map((offering) => offering.grade))), [selectedChapter])
  const semesterOptions = useMemo(() => Array.from(new Set(selectedChapter.offerings.filter((offering) => filters.grade === 'ทั้งหมด' || offering.grade === filters.grade).map((offering) => offering.semester))), [selectedChapter, filters.grade])
  const courseOptions = useMemo(() => Array.from(new Set(selectedChapter.offerings.filter((offering) => (filters.grade === 'ทั้งหมด' || offering.grade === filters.grade) && (filters.semester === 'ทั้งหมด' || offering.semester === filters.semester)).map((offering) => offering.course))), [selectedChapter, filters.grade, filters.semester])
  const availableCount = useMemo(() => eligibleQuestions(filters).length, [filters])
  const currentQuestion = session?.questions[session.currentIndex]
  const currentResponse = session?.responses[session.currentIndex]
  const currentPerformance = performanceForChapter(filters.chapterId)
  const answeredCount = session?.responses.filter((response) => response.submitted).length ?? 0
  const incorrectCount = session?.responses.filter((response) => response.submitted && !response.correct).length ?? 0

  const updateFilters = (patch: Partial<QuestionFilters>) => {
    setFilters((current) => ({ ...current, ...patch }))
    setSession(null)
    setHintVisible(false)
    setSolutionVisible(false)
  }

  const startPractice = () => {
    const next = createExerciseSession(filters)
    setSession(next)
    setHintVisible(false)
    setSolutionVisible(false)
  }

  const submitAnswer = () => {
    if (!session || !currentQuestion || !currentResponse || currentResponse.selectedChoice === null || currentResponse.submitted) return
    const correct = evaluateResponse(currentQuestion, currentResponse.selectedChoice)
    const responses = session.responses.slice()
    responses[session.currentIndex] = { ...currentResponse, submitted: true, correct, answeredAt: new Date().toISOString() }
    const next = { ...session, responses, score: session.score + (correct ? 1 : 0), updatedAt: new Date().toISOString() }
    saveExerciseSession(next)
    setSession(next)
    recordPerformance({ userId: next.userId, sessionId: next.id, questionId: currentQuestion.preparedQuestionId, chapterId: currentQuestion.chapterId, subtopicId: currentQuestion.subtopicId, difficulty: currentQuestion.difficulty, questionType: currentQuestion.questionType, correct, answeredAt: new Date().toISOString() })
    setProgress((current: ProgressLike) => ({ ...current, exerciseCorrect: current.exerciseCorrect + (correct ? 1 : 0), exerciseTotal: current.exerciseTotal + 1, xp: current.xp + (correct ? 15 : 5) }))
  }

  const chooseAnswer = (choice: number) => {
    if (!session || !currentResponse || currentResponse.submitted) return
    const responses = session.responses.slice()
    responses[session.currentIndex] = { ...currentResponse, selectedChoice: choice }
    const next = { ...session, responses, updatedAt: new Date().toISOString() }
    saveExerciseSession(next)
    setSession(next)
  }

  const goTo = (index: number) => {
    if (!session || index < 0 || index >= session.questions.length) return
    const next = { ...session, currentIndex: index, updatedAt: new Date().toISOString() }
    saveExerciseSession(next)
    setSession(next)
    setHintVisible(Boolean(next.responses[index]?.hintShown))
    setSolutionVisible(false)
  }

  const showHint = () => {
    if (!session || !currentResponse) return
    setHintVisible(true)
    const responses = session.responses.slice()
    responses[session.currentIndex] = { ...currentResponse, hintShown: true }
    const next = { ...session, responses, updatedAt: new Date().toISOString() }
    saveExerciseSession(next)
    setSession(next)
  }

  const nextQuestion = () => {
    if (!session) return
    if (session.currentIndex === session.questions.length - 1) {
      const next = { ...session, completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      saveExerciseSession(next)
      setSession(next)
      return
    }
    goTo(session.currentIndex + 1)
  }

  const retryPractice = (mode: 'same' | 'new') => {
    if (!session) return
    const next = retryIncorrect(session, mode)
    if (next) {
      setSession(next)
      setHintVisible(false)
      setSolutionVisible(false)
    }
  }

  if (session?.completedAt) {
    const accuracy = session.questions.length ? Math.round((session.score / session.questions.length) * 100) : 0
    return <div className="question-bank-page"><div className="qb-page-heading"><div><span className="qb-eyebrow"><Sparkles size={13} /> สรุปการฝึก</span><h1>ทำได้ดีมาก คุณฝึกครบแล้ว</h1><p>คำถามและคำตอบของเซสชันนี้ถูกบันทึกไว้แล้ว สามารถทบทวนหรือสร้างชุดใหม่ได้ทันที</p></div><button className="outline-button" onClick={() => setSession(null)}><ArrowLeft size={16} /> กลับไปตั้งค่า</button></div><div className="qb-summary-card"><div className="qb-summary-score"><div className="qb-score-ring"><strong>{accuracy}%</strong><span>ความถูกต้อง</span></div><div><span className="qb-kicker">{selectedChapter.title}</span><h2>{session.score} / {session.questions.length} ข้อถูก</h2><p>{session.poolRestarted ? 'ชุดนี้ใช้คำถามจากพูลซ้ำหลังจากคำถามที่เข้าเงื่อนไขหมดแล้ว' : 'ระบบหลีกเลี่ยงคำถามฐานที่เพิ่งทำไปแล้วให้เรียบร้อย'}</p></div></div><div className="qb-summary-stats"><div><strong>{answeredCount}</strong><span>ตอบแล้ว</span></div><div><strong>{incorrectCount}</strong><span>ควรทบทวน</span></div><div><strong>+{session.score * 15 + (session.questions.length - session.score) * 5}</strong><span>XP ที่ได้</span></div></div></div><div className="qb-summary-actions"><button className="primary-button" onClick={startPractice}><Shuffle size={16} /> สร้างชุดใหม่</button>{incorrectCount > 0 && <><button className="outline-button" onClick={() => retryPractice('same')}><RotateCcw size={16} /> ทำข้อที่ผิดซ้ำ</button><button className="outline-button" onClick={() => retryPractice('new')}><Sparkles size={16} /> สุ่มโจทย์ใหม่จากทักษะเดิม</button></>}</div></div>
  }

  return <div className="question-bank-page"><div className="qb-page-heading"><div><span className="qb-eyebrow"><Sparkles size={13} /> คลังโจทย์คณิตศาสตร์</span><h1>{activeChapter ? `แบบฝึกหัด: ${selectedChapter.title}` : 'แบบฝึกหัดแบบสุ่มและคงที่'}</h1><p>เลือกบท ระดับ และจำนวนข้อ ระบบจะสุ่มโจทย์จากคลังที่ตรวจสอบคำตอบแล้ว และบันทึกเซสชันไว้เมื่อรีเฟรชหน้า</p></div><div className="qb-heading-actions"><span className="qb-engine-badge"><span className="status-dot" /> Engine v1</span>{session && <button className="outline-button" onClick={() => setSession(null)}><Shuffle size={15} /> ตั้งค่าใหม่</button>}</div></div><div className="qb-layout"><aside className="qb-sidebar"><div className="qb-filter-card"><div className="qb-card-title"><Target size={17} /><strong>ตั้งค่าการฝึก</strong></div><label>บทเรียน</label><div className="qb-select-wrap"><select value={filters.chapterId} onChange={(event) => updateFilters(filterForChapter(curriculumChapters.find((chapter) => chapter.id === event.target.value) ?? curriculumChapters[0]))}><option value="">เลือกบท</option>{curriculumChapters.map((chapter) => <option value={chapter.id} key={chapter.id}>{chapter.title}</option>)}</select><ChevronDown size={15} /></div><label>ระดับชั้น</label><div className="qb-pill-row">{gradeOptions.map((grade) => <button key={grade} className={filters.grade === grade ? 'active' : ''} onClick={() => updateFilters({ grade, semester: 'ทั้งหมด', course: 'all' })}>{grade}</button>)}</div><label>ภาคเรียน</label><div className="qb-pill-row">{['ทั้งหมด', ...semesterOptions].filter((value, index, all) => all.indexOf(value) === index).map((semester) => <button key={semester} className={filters.semester === semester ? 'active' : ''} onClick={() => updateFilters({ semester })}>{semester.replace('ภาคเรียนที่ ', 'ภาค ')}</button>)}</div>{courseOptions.length > 1 && <><label>ประเภทวิชา</label><div className="qb-pill-row"><button className={filters.course === 'all' ? 'active' : ''} onClick={() => updateFilters({ course: 'all' })}>ทั้งหมด</button>{courseOptions.map((course) => <button key={course} className={filters.course === course ? 'active' : ''} onClick={() => updateFilters({ course })}>{course.replace('คณิตศาสตร์', '')}</button>)}</div></>}<label>หัวข้อย่อย</label><div className="qb-select-wrap"><select value={filters.subtopic} onChange={(event) => updateFilters({ subtopic: event.target.value })}><option value="all">ทุกหัวข้อย่อย</option>{selectedChapter.subtopics.map((subtopic) => <option value={subtopic} key={subtopic}>{subtopic}</option>)}</select><ChevronDown size={15} /></div><label>ระดับความยาก</label><div className="qb-difficulty-grid">{(['all', 'easy', 'intermediate', 'advanced', 'challenge'] as const).map((difficulty) => <button key={difficulty} className={filters.difficulty === difficulty ? 'active' : ''} onClick={() => updateFilters({ difficulty })}>{difficultyLabels[difficulty]}</button>)}</div><label>จำนวนข้อ</label><div className="qb-count-row">{([10, 20, 30, 50] as SessionLength[]).map((count) => <button key={count} className={filters.count === count ? 'active' : ''} onClick={() => updateFilters({ count })}>{count}</button>)}</div><div className="qb-availability"><strong>{availableCount}</strong><span>ข้อพร้อมใช้ตามตัวกรอง</span></div><button className="primary-button qb-start-button" onClick={startPractice}><Sparkles size={16} /> เริ่มฝึกแบบสุ่ม</button></div><div className="qb-session-note"><Clock3 size={17} /><div><strong>เซสชันคงที่</strong><p>คำถามที่สร้างแล้วจะไม่เปลี่ยนเมื่อรีเฟรช และตอบต่อได้จากอุปกรณ์นี้</p></div></div><div className="qb-progress-note"><Zap size={16} /><span>บทนี้: {currentPerformance.attempts ? `${currentPerformance.accuracy}% จาก ${currentPerformance.attempts} ครั้ง` : 'ยังไม่มีประวัติการตอบ'}</span></div></aside>{session ? <section className="qb-workspace"><div className="qb-workspace-top"><div><span>ข้อที่ {session.currentIndex + 1} จาก {session.questions.length}</span><div className="workspace-progress"><span style={{ width: `${(answeredCount / session.questions.length) * 100}%` }} /></div></div><span className="score-pill"><Zap size={14} /> {session.score} ถูก</span></div>{session.poolRestarted && <div className="qb-restart-notice"><RotateCcw size={15} /> ตัวกรองนี้มีคำถามพร้อมใช้น้อยกว่าจำนวนที่เลือก ระบบจึงอนุญาตให้คำถามฐานกลับมาได้หลังพูลหมด</div>}{currentQuestion && currentResponse && <div className="qb-question-card"><div className="qb-question-meta"><span className="chip chip-indigo">{currentQuestion.subtopicId}</span><span className={`qb-difficulty difficulty-${currentQuestion.difficulty}`}>{difficultyLabels[currentQuestion.difficulty]}</span><span className="qb-question-type">{currentQuestion.questionType}</span></div><h2>{currentQuestion.prompt}</h2><div className="qb-answer-options">{currentQuestion.choices.map((choice, index) => <button key={`${choice}-${index}`} className={`qb-answer-option ${currentResponse.selectedChoice === index ? 'selected' : ''} ${currentResponse.submitted && index === currentQuestion.correctChoice ? 'correct' : ''} ${currentResponse.submitted && currentResponse.selectedChoice === index && index !== currentQuestion.correctChoice ? 'incorrect' : ''}`} onClick={() => chooseAnswer(index)}><span>{String.fromCharCode(65 + index)}</span><strong>{choice}</strong>{currentResponse.submitted && index === currentQuestion.correctChoice && <Check size={17} />}{currentResponse.submitted && currentResponse.selectedChoice === index && index !== currentQuestion.correctChoice && <X size={17} />}</button>)}</div>{currentResponse.submitted && <div className={`qb-feedback ${currentResponse.correct ? 'correct' : 'incorrect'}`}><div className="qb-feedback-icon">{currentResponse.correct ? <Check size={18} /> : <X size={18} />}</div><div><strong>{currentResponse.correct ? 'คำตอบถูกต้อง' : `คำตอบที่ถูกคือ ${currentQuestion.correctAnswer}`}</strong><p>{currentQuestion.solution}</p></div></div>}<div className="qb-question-controls"><button className="outline-button" onClick={showHint}><Lightbulb size={16} /> {hintVisible ? currentQuestion.hint : 'ดูคำใบ้'}</button>{currentResponse.submitted && <button className="outline-button" onClick={() => setSolutionVisible((visible) => !visible)}><BookOpen size={16} /> {solutionVisible ? 'ซ่อนวิธีทำ' : 'ดูวิธีทำเต็ม'}</button>}<div className="qb-control-spacer" />{session.currentIndex > 0 && <button className="outline-button" onClick={() => goTo(session.currentIndex - 1)}><ArrowLeft size={16} /> ก่อนหน้า</button>}{!currentResponse.submitted ? <button className="primary-button" disabled={currentResponse.selectedChoice === null} onClick={submitAnswer}>ตรวจคำตอบ <Check size={16} /></button> : <button className="primary-button" onClick={nextQuestion}>{session.currentIndex === session.questions.length - 1 ? 'ดูสรุป' : 'ข้อถัดไป'} <ArrowRight size={16} /></button>}</div>{solutionVisible && <div className="qb-solution-panel"><strong>คำอธิบาย</strong><p>{currentQuestion.solution}</p></div>}</div>}<div className="qb-questions-nav"><div className="qb-nav-heading"><strong>ทบทวนข้อในเซสชัน</strong><span>{answeredCount}/{session.questions.length} ตอบแล้ว</span></div><div>{session.responses.map((response, index) => <button key={index} className={`${index === session.currentIndex ? 'current' : ''} ${response.submitted ? response.correct ? 'correct' : 'incorrect' : ''}`} onClick={() => goTo(index)}>{index + 1}</button>)}</div></div><button className="related-lesson" onClick={onLesson}><div className="related-icon"><BookOpen size={17} /></div><div><span>ทบทวนเนื้อหาที่เกี่ยวข้อง</span><strong>{selectedChapter.title}</strong></div><ArrowRight size={17} /></button></section> : <section className="qb-empty-workspace"><div className="qb-empty-icon"><Sparkles size={27} /></div><h2>พร้อมเริ่มชุดฝึกของคุณแล้ว</h2><p>ระบบจะแยกคำถามฐานออกจากตัวแปรสุ่ม และเก็บคำตอบ/วิธีทำของชุดนี้ไว้ให้กลับมาทบทวนได้</p><div className="qb-empty-facts"><span><strong>{questionBankValidation.completeUnits}</strong> / {questionBankValidation.totalUnits} หน่วยครบ 120 ข้อ</span><span><strong>4</strong> ระดับความยาก</span><span><strong>{questionBankValidation.ok ? 'ผ่าน' : 'ตรวจสอบ'}</strong> QA คำตอบ</span></div><button className="primary-button large-button" onClick={startPractice}>เริ่มฝึก {filters.count} ข้อ <ArrowRight size={17} /></button></section>}</div></div>
}
