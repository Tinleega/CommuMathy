export type IconName = 'home' | 'book' | 'pen' | 'clipboard' | 'sparkles' | 'message' | 'trophy' | 'user' | 'settings'

export type Lesson = {
  id: string
  title: string
  subtitle: string
  grade: string
  subject: string
  level: 'พื้นฐาน' | 'กำลังดี' | 'ท้าทาย'
  duration: string
  progress: number
  color: string
  icon: string
  objectives: string[]
  prerequisite: string
  sections: string[]
  formula: string
  description: string
}

export type ExerciseQuestion = {
  id: string
  topic: string
  prompt: string
  choices: string[]
  correct: number
  explanation: string
  hint: string
}

export type DiscussionPost = {
  id: string
  title: string
  body: string
  author: string
  initials: string
  tag: string
  time: string
  likes: number
  comments: number
  liked?: boolean
  replies: string[]
}

export const lessons: Lesson[] = [
  {
    id: 'linear-equation',
    title: 'สมการเชิงเส้นตัวแปรเดียว',
    subtitle: 'แกะสมการทีละขั้น เข้าใจที่มาของคำตอบ',
    grade: 'ม.1',
    subject: 'พีชคณิต',
    level: 'พื้นฐาน',
    duration: '25 นาที',
    progress: 68,
    color: 'indigo',
    icon: 'x=',
    objectives: ['แก้สมการเชิงเส้นตัวแปรเดียวได้อย่างเป็นขั้นตอน', 'อธิบายเหตุผลของการย้ายข้างและตรวจคำตอบได้'],
    prerequisite: 'การคำนวณจำนวนเต็มและสมบัติการเท่ากัน',
    sections: ['รู้จักสมการ', 'หลักการรักษาสมดุล', 'ตัวอย่างการแก้สมการ', 'ข้อผิดพลาดที่พบบ่อย', 'ลองทำด้วยตัวเอง'],
    formula: '2x + 3 = 11 \\Rightarrow 2x = 8 \\Rightarrow x = 4',
    description: 'สมการคือประโยคสัญลักษณ์ที่บอกว่าปริมาณสองข้างเท่ากัน เราจะแก้สมการโดยรักษาความสมดุลของทั้งสองข้างไว้เสมอ',
  },
  {
    id: 'pythagorean',
    title: 'ทฤษฎีบทพีทาโกรัส',
    subtitle: 'มองเห็นความสัมพันธ์ของด้านในสามเหลี่ยมมุมฉาก',
    grade: 'ม.2',
    subject: 'เรขาคณิต',
    level: 'กำลังดี',
    duration: '32 นาที',
    progress: 0,
    color: 'teal',
    icon: '△',
    objectives: ['ใช้ทฤษฎีบทพีทาโกรัสหาความยาวด้านที่ไม่ทราบค่า', 'ตรวจสอบว่าสามเหลี่ยมเป็นสามเหลี่ยมมุมฉากได้'],
    prerequisite: 'การยกกำลังสองและการหารากที่สอง',
    sections: ['สามเหลี่ยมมุมฉาก', 'ที่มาของสูตร', 'การหาด้านที่ไม่รู้จัก', 'โจทย์ประยุกต์'],
    formula: 'a^2 + b^2 = c^2',
    description: 'ในสามเหลี่ยมมุมฉาก กำลังสองของด้านประกอบมุมฉากรวมกันเท่ากับกำลังสองของด้านตรงข้ามมุมฉาก',
  },
  {
    id: 'linear-function',
    title: 'ฟังก์ชันเชิงเส้นและกราฟ',
    subtitle: 'เปลี่ยนสมการให้เป็นภาพ และอ่านความหมายจากกราฟ',
    grade: 'ม.3',
    subject: 'ฟังก์ชัน',
    level: 'กำลังดี',
    duration: '40 นาที',
    progress: 0,
    color: 'amber',
    icon: '↗',
    objectives: ['อธิบายความหมายของความชันและจุดตัดแกน', 'เขียนกราฟจากสมการเชิงเส้นได้'],
    prerequisite: 'คู่อันดับและการอ่านกราฟบนระนาบพิกัด',
    sections: ['ความสัมพันธ์และฟังก์ชัน', 'ความชัน', 'จุดตัดแกน', 'การอ่านกราฟจากสถานการณ์'],
    formula: 'y = mx + b',
    description: 'ฟังก์ชันเชิงเส้นแสดงความสัมพันธ์ที่เปลี่ยนแปลงในอัตราคงที่ ความชันบอกว่า y เปลี่ยนไปมากน้อยเพียงใดเมื่อ x เพิ่มขึ้นหนึ่งหน่วย',
  },
  {
    id: 'probability',
    title: 'ความน่าจะเป็นเบื้องต้น',
    subtitle: 'คาดการณ์เหตุการณ์ด้วยพื้นที่ของผลลัพธ์',
    grade: 'ม.3',
    subject: 'สถิติและความน่าจะเป็น',
    level: 'พื้นฐาน',
    duration: '28 นาที',
    progress: 0,
    color: 'rose',
    icon: '½',
    objectives: ['ระบุแซมเปิลสเปซและเหตุการณ์ได้', 'คำนวณความน่าจะเป็นของเหตุการณ์อย่างง่าย'],
    prerequisite: 'การนับจำนวนและเศษส่วน',
    sections: ['ผลลัพธ์ที่เป็นไปได้', 'เหตุการณ์', 'สูตรความน่าจะเป็น', 'ฝึกคิดจากสถานการณ์จริง'],
    formula: 'P(A) = \\frac{n(A)}{n(S)}',
    description: 'ความน่าจะเป็นเป็นตัวเลขระหว่าง 0 ถึง 1 ที่บอกว่าเหตุการณ์หนึ่งมีโอกาสเกิดขึ้นมากน้อยเพียงใด',
  },
]

export const exerciseQuestions: ExerciseQuestion[] = [
  {
    id: 'ex-1',
    topic: 'สมการเชิงเส้น',
    prompt: 'ถ้า 3x - 5 = 16 แล้ว x มีค่าเท่าใด?',
    choices: ['5', '7', '11', '63'],
    correct: 1,
    explanation: 'บวก 5 ทั้งสองข้างได้ 3x = 21 จากนั้นหารด้วย 3 จึงได้ x = 7',
    hint: 'ทำให้พจน์ที่ไม่มี x หายไปก่อน โดยบวก 5 ทั้งสองข้าง',
  },
  {
    id: 'ex-2',
    topic: 'สมการเชิงเส้น',
    prompt: 'ข้อใดอธิบายการเปลี่ยนจาก 2x + 4 = 14 เป็น 2x = 10 ได้ถูกต้องที่สุด?',
    choices: ['ย้าย 4 ไปอีกข้างแล้วเปลี่ยนเครื่องหมาย', 'ลบ 4 จากทั้งสองข้างของสมการ', 'หารทั้งสองข้างด้วย 4', 'ตัด 4 ออกจากสมการ'],
    correct: 1,
    explanation: 'การลบ 4 จากทั้งสองข้างรักษาความเท่ากันไว้ จึงได้ 2x = 10 อย่างถูกต้อง',
    hint: 'สมการเหมือนตาชั่ง ถ้าลบด้านหนึ่ง ต้องลบอีกด้านด้วย',
  },
  {
    id: 'ex-3',
    topic: 'การคิดเชิงเหตุผล',
    prompt: 'ถ้า a = 4 และ b = -2 ค่าของ a² + b คือเท่าใด?',
    choices: ['6', '10', '14', '18'],
    correct: 2,
    explanation: 'แทนค่าได้ 4² + (-2) = 16 - 2 = 14 ระวังว่า b เป็นจำนวนลบ',
    hint: 'คำนวณเลขยกกำลังก่อน แล้วจึงบวกจำนวนลบ',
  },
]

export const initialPosts: DiscussionPost[] = [
  {
    id: 'post-1', title: 'ทำไมเวลาย้ายข้างต้องเปลี่ยนเครื่องหมาย?',
    body: 'หนูจำได้ว่าต้องเปลี่ยนเครื่องหมาย แต่ยังไม่เข้าใจว่าจริง ๆ แล้วเกิดอะไรขึ้น ใครช่วยอธิบายแบบเห็นภาพได้บ้างคะ',
    author: 'น้องพิม', initials: 'พพ', tag: 'พีชคณิต', time: '12 นาทีที่แล้ว', likes: 18, comments: 6,
    replies: ['ลองคิดว่าการลบจำนวนเดียวกันออกจากทั้งสองข้าง เหมือนการย้ายข้างเลยครับ ที่เปลี่ยนคือรูปแบบการเขียน ไม่ใช่กฎใหม่', 'ชอบคำอธิบายเรื่องตาชั่งในบทเรียนมากค่ะ'],
  },
  {
    id: 'post-2', title: 'มีวิธีจำสูตรพีทาโกรัสให้ไม่สับสนไหม',
    body: 'เวลาโจทย์ให้ด้านมา 3 ด้าน หนูไม่แน่ใจว่าด้านไหนคือ c ใครมีวิธีสังเกตง่าย ๆ ช่วยแชร์หน่อยค่ะ',
    author: 'ต้นน้ำ', initials: 'ตน', tag: 'เรขาคณิต', time: '1 ชั่วโมงที่แล้ว', likes: 12, comments: 4,
    replies: ['ด้านตรงข้ามมุมฉากจะยาวที่สุดเสมอ และเป็นด้าน c ครับ'],
  },
  {
    id: 'post-3', title: 'แชร์วิธีอ่านกราฟเส้นตรงแบบไม่ต้องท่อง',
    body: 'ถ้าเราเห็น y = mx + b ให้มอง m เป็น “ความเร็วในการขึ้นลง” และ b เป็น “จุดเริ่มต้น” จะเชื่อมกับโจทย์ได้ง่ายขึ้นมาก',
    author: 'ครูเมย์', initials: 'คม', tag: 'ฟังก์ชัน', time: 'เมื่อวาน', likes: 31, comments: 9,
    replies: ['ขอบคุณสำหรับภาพจำดี ๆ ค่ะ'],
  },
]

export const leaderboard = [
  { rank: 1, name: 'น้องข้าวหอม', xp: '1,240 XP', initials: 'ขห', color: 'gold' },
  { rank: 2, name: 'ต้นน้ำ', xp: '1,080 XP', initials: 'ตน', color: 'silver' },
  { rank: 3, name: 'พิมพ์ชนก', xp: '840 XP', initials: 'พช', color: 'bronze' },
  { rank: 4, name: 'น้องฟ้า', xp: '760 XP', initials: 'นฟ', color: 'plain' },
]
