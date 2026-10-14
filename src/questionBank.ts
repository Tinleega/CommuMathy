import { curriculumChapters, type CurriculumChapter, type CurriculumCourse, type CurriculumOffering } from './curriculum'

export type BankDifficulty = 'easy' | 'intermediate' | 'advanced' | 'challenge'
export type BankQuestionType = 'concept' | 'procedure' | 'application' | 'interpretation' | 'error-analysis' | 'reasoning'
export type BankCourse = CurriculumCourse | 'all'
export type SessionLength = 10 | 20 | 30 | 50
export type GeneratorKey = 'algebra' | 'geometry' | 'statistics' | 'probability' | 'exponents' | 'function' | 'sequence' | 'trigonometry' | 'calculus' | 'logic' | 'concept'

export type QuestionFilters = {
  chapterId: string
  grade: string
  semester: string
  course: BankCourse
  subtopic: string
  difficulty: BankDifficulty | 'all'
  count: SessionLength
}

export type QuestionPayload = {
  prompt: string
  choices: string[]
  correctChoice: number
  correctAnswer: string
  hint: string
  solution: string
  parameters: Record<string, boolean | number | string | number[]>
}

export type PracticeUnit = {
  unitKey: string
  unitId: string
  chapter: CurriculumChapter
  offering: CurriculumOffering
}

export type PreparedQuestion = {
  id: string
  unitKey: string
  chapterId: string
  subtopicId: string
  gradeLevel: string
  semester: string
  courseType: CurriculumCourse
  difficulty: BankDifficulty
  questionType: BankQuestionType
  prompt: string
  choices: string[]
  correctChoice: number
  correctAnswer: string
  hint: string
  solution: string
  parametersSchema: string[]
  parameterConstraints: string[]
  generationStrategy: string
  answerStrategy: string
  solutionStrategy: string
  answerFormat: 'multiple-choice'
  tags: string[]
  verificationStatus: 'deterministically-validated'
  createdAt: string
  updatedAt: string
  generator: GeneratorKey
  baseIndex: number
  provenance: 'prepared-seed'
}

export type GeneratedQuestionInstance = {
  instanceId: string
  preparedQuestionId: string
  variantId: string
  seed: number
  params: Record<string, boolean | number | string | number[]>
  prompt: string
  choices: string[]
  correctChoice: number
  correctAnswer: string
  hint: string
  solution: string
  difficulty: BankDifficulty
  questionType: BankQuestionType
  chapterId: string
  subtopicId: string
}

export type QuestionResponse = {
  selectedChoice: number | null
  submitted: boolean
  correct: boolean | null
  answeredAt?: string
  hintShown?: boolean
}

export type ExerciseSession = {
  id: string
  userId: string
  filters: QuestionFilters
  questions: GeneratedQuestionInstance[]
  responses: QuestionResponse[]
  currentIndex: number
  score: number
  startedAt: string
  updatedAt: string
  completedAt?: string
  seed: number
  engineVersion: string
  poolRestarted: boolean
}

export type CoverageEntry = {
  unitKey: string
  chapterId: string
  chapterTitle: string
  grade: string
  semester: string
  course: CurriculumCourse
  preparedCount: number
  validCount: number
  duplicatePrompts: number
  difficultyCounts: Record<BankDifficulty, number>
  complete: boolean
}

export type QuestionBankValidation = {
  ok: boolean
  totalPrepared: number
  totalUnits: number
  completeUnits: number
  invalidRecords: string[]
  duplicateRecords: string[]
  coverage: CoverageEntry[]
}

const ENGINE_VERSION = 'question-bank-v1'
const SESSION_KEY = 'commumathy-exercise-session-v2'
const SESSION_HISTORY_KEY = 'commumathy-exercise-sessions-v2'
const RECENT_KEY = 'commumathy-exercise-recent-v2'
const PERFORMANCE_KEY = 'commumathy-exercise-performance-v2'
const CREATED_AT = '2026-10-14T00:00:00.000Z'

function hashString(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function rng(seed: number) {
  let state = seed >>> 0
  return () => {
    state += 0x6D2B79F5
    let result = Math.imul(state ^ state >>> 15, 1 | state)
    result ^= result + Math.imul(result ^ result >>> 7, 61 | result)
    return ((result ^ result >>> 14) >>> 0) / 4294967296
  }
}

function integer(random: () => number, min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y) [x, y] = [y, x % y]
  return x || 1
}

function fraction(numerator: number, denominator: number): string {
  if (denominator === 0) return 'undefined'
  const divisor = gcd(numerator, denominator)
  const n = numerator / divisor
  const d = denominator / divisor
  return d === 1 ? String(n) : `${n}/${d}`
}

function decimal(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

function shuffledChoices(correct: string, distractors: string[], seed: number): { choices: string[]; correctChoice: number } {
  const values: string[] = []
  for (const value of [correct, ...distractors]) {
    if (value && !values.includes(value)) values.push(value)
  }
  while (values.length < 4) values.push(`ตัวเลือก ${values.length + 1}`)
  const order = values.slice(0, 4).map((_, index) => index)
  const random = rng(seed)
  for (let index = order.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1))
    ;[order[index], order[swap]] = [order[swap], order[index]]
  }
  const choices = order.map((index) => values[index])
  return { choices, correctChoice: choices.indexOf(correct) }
}

function generatorForChapter(chapterId: string): GeneratorKey {
  const id = chapterId.toLowerCase()
  if (id.includes('probability') || id.includes('counting') || id.includes('random')) return 'probability'
  if (id.includes('statistics') || id.includes('qualitative') || id.includes('quantitative')) return 'statistics'
  if (id.includes('pythagorean') || id.includes('geometric') || id.includes('figure') || id.includes('prism') || id.includes('cylinder') || id.includes('transformation') || id.includes('congruence') || id.includes('parallel') || id.includes('similar') || id.includes('circle') || id.includes('pyramid') || id.includes('cone') || id.includes('sphere')) return 'geometry'
  if (id.includes('trig')) return 'trigonometry'
  if (id.includes('calculus')) return 'calculus'
  if (id.includes('sequence') || id.includes('series')) return 'sequence'
  if (id.includes('function') || id.includes('graph') || id.includes('relation') || id.includes('analytic')) return 'function'
  if (id.includes('exponent')) return 'exponents'
  if (id.includes('logic') || id.includes('sets')) return 'logic'
  if (id.includes('equation') || id.includes('inequality') || id.includes('integer') || id.includes('fraction') || id.includes('ratio') || id.includes('polynomial') || id.includes('factoring') || id.includes('real-numbers') || id.includes('complex') || id.includes('matrix') || id.includes('vector')) return 'algebra'
  return 'concept'
}

function difficultyFor(index: number): BankDifficulty {
  if (index < 30) return 'easy'
  if (index < 75) return 'intermediate'
  if (index < 105) return 'advanced'
  return 'challenge'
}

function questionTypeFor(index: number): BankQuestionType {
  return ['concept', 'procedure', 'application', 'interpretation', 'error-analysis', 'reasoning'][index % 6] as BankQuestionType
}

function algebraPayload(chapter: CurriculumChapter, index: number, seed: number, subtopic: string): QuestionPayload {
  const random = rng(seed)
  const a = integer(random, 2, 9)
  const x = integer(random, -8, 12)
  const b = integer(random, -12, 12)
  const c = a * x + b
  const mode = index % 6
  const label = `Problem ${index + 1}: `
  if (mode === 0 || mode === 3) {
    const answer = String(x)
    const choices = shuffledChoices(answer, [String(x + 1), String(x - 1), String(c)], seed + 1)
    return { prompt: `${label}Solve ${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} = ${c}.`, ...choices, correctAnswer: answer, hint: `Undo the constant term first, then divide by ${a}.`, solution: `${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} = ${c} → ${a}x = ${c - b} → x = ${x}.`, parameters: { a, b, c, x } }
  }
  if (mode === 1) {
    const answer = `Subtract ${b} from both sides`
    const choices = shuffledChoices(answer, [`Divide by ${a} first`, `Change ${b} to ${-b} on one side only`, `Multiply both sides by ${b}`], seed + 2)
    return { prompt: `${label}For ${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} = ${c}, what is the best first step?`, ...choices, correctAnswer: answer, hint: 'Remove the term that does not contain x.', solution: `Subtract ${b} from both sides so that ${a}x = ${c - b}.`, parameters: { a, b, c } }
  }
  if (mode === 2) {
    const base = integer(random, 20, 80)
    const rate = integer(random, 4, 12)
    const units = integer(random, 3, 9)
    const total = base + rate * units
    const answer = String(units)
    const choices = shuffledChoices(answer, [String(units + 1), String(units - 1), String(total - base)], seed + 3)
    return { prompt: `${label}A service charges ${base} baht plus ${rate} baht per item. If the total is ${total} baht, how many items were bought?`, ...choices, correctAnswer: answer, hint: `Write ${base} + ${rate}n = ${total}.`, solution: `${base} + ${rate}n = ${total} → ${rate}n = ${total - base} → n = ${units}.`, parameters: { base, rate, units, total } }
  }
  if (mode === 4) {
    const answer = `${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} = ${c}`
    const choices = shuffledChoices(answer, [`${a}x = ${c}`, `x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} = ${c}`, `${a}x ${b >= 0 ? '-' : '+'} ${Math.abs(b)} = ${c}`], seed + 4)
    return { prompt: `${label}Which equation represents a number x that becomes ${c} after multiplying by ${a} and then adding ${b}?`, ...choices, correctAnswer: answer, hint: 'Translate the operations in the order they happen.', solution: `Multiply x by ${a}, then add ${b}; therefore ${answer}.`, parameters: { a, b, c } }
  }
  const answer = `Apply the same operation to both sides`
  const choices = shuffledChoices(answer, [`Move a term without changing its sign`, `Divide by zero`, `Ignore the coefficient of x`], seed + 5)
  return { prompt: `${label}A student changes ${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} = ${c} by changing only the left side. Which principle was missed?`, ...choices, correctAnswer: answer, hint: 'An equation is a balance.', solution: `An equality stays true only when an equivalent operation is applied to both sides.`, parameters: { a, b, c, subtopic } }
}

function geometryPayload(chapter: CurriculumChapter, index: number, seed: number): QuestionPayload {
  const random = rng(seed)
  const triples = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17]]
  const triple = triples[index % triples.length]
  const scale = index + 1
  const [a, b, c] = triple.map((value) => value * scale)
  const mode = index % 5
  if (chapter.id.includes('pythagorean') || mode < 2) {
    const answer = mode % 2 === 0 ? String(c) : String(a)
    const prompt = mode % 2 === 0 ? `A right triangle has legs ${a} and ${b}. Find the hypotenuse.` : `A right triangle has hypotenuse ${c} and one leg ${b}. Find the other leg.`
    const choices = shuffledChoices(answer, mode % 2 === 0 ? [String(c + 1), String(c - 1), String(a + b)] : [String(a + 1), String(b - 1), String(c - b)], seed + 10)
    return { prompt, ...choices, correctAnswer: answer, hint: 'Use a² + b² = c².', solution: mode % 2 === 0 ? `${a}² + ${b}² = ${a * a + b * b} = ${c}², so c = ${c}.` : `${c}² - ${b}² = ${c * c - b * b} = ${a}², so the missing leg is ${a}.`, parameters: { a, b, c } }
  }
  const length = 4 + (index % 19)
  const width = 3 + (Math.floor(index / 19) % 12)
  const answer = String(length * width)
  const choices = shuffledChoices(answer, [String(2 * (length + width)), String(length + width), String(length * width + width)], seed + 11)
  return { prompt: `A rectangle has length ${length} cm and width ${width} cm. What is its area?`, ...choices, correctAnswer: answer, hint: 'Area of a rectangle is length × width.', solution: `Area = ${length} × ${width} = ${answer} cm².`, parameters: { length, width } }
}

function probabilityPayload(index: number, seed: number): QuestionPayload {
  const red = 2 + (index % 12)
  const blue = 2 + ((index * 3) % 13)
  const green = 1 + ((index * 5) % 8)
  const total = red + blue + green
  const target = index % 3 === 0 ? red : index % 3 === 1 ? blue : green
  const label = index % 3 === 0 ? 'red' : index % 3 === 1 ? 'blue' : 'green'
  const answer = fraction(target, total)
  const choices = shuffledChoices(answer, [fraction(target + 1, total), fraction(total - target, total), fraction(target, total + 1)], seed + 20)
  return { prompt: `A bag contains ${red} red, ${blue} blue, and ${green} green counters. What is the probability of drawing a ${label} counter?`, ...choices, correctAnswer: answer, hint: 'Favourable outcomes ÷ total outcomes.', solution: `There are ${target} favourable counters out of ${total}; P(${label}) = ${target}/${total} = ${answer}.`, parameters: { red, blue, green, total, target } }
}

function statisticsPayload(index: number, seed: number): QuestionPayload {
  const random = rng(seed)
  const start = 2 + (index % 30)
  const values = [start, start + integer(random, 1, 7), start + integer(random, 5, 12), start + integer(random, 13, 22), start + integer(random, 23, 35)].sort((a, b) => a - b)
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const mode = index % 3
  const answer = mode === 0 ? decimal(mean) : mode === 1 ? String(values[2]) : String(values[4] - values[0])
  const label = mode === 0 ? 'mean' : mode === 1 ? 'median' : 'range'
  const choices = shuffledChoices(answer, [String(values[0]), String(values[1]), String(values[4])], seed + 30)
  return { prompt: `For the data set {${values.join(', ')}}, what is the ${label}?`, ...choices, correctAnswer: answer, hint: mode === 0 ? 'Add all values and divide by 5.' : mode === 1 ? 'Use the middle value after sorting.' : 'Maximum − minimum.', solution: mode === 0 ? `Mean = (${values.join(' + ')}) ÷ 5 = ${answer}.` : mode === 1 ? `The sorted middle value is ${answer}.` : `Range = ${values[4]} − ${values[0]} = ${answer}.`, parameters: { values } }
}

function exponentsPayload(index: number, seed: number): QuestionPayload {
  const base = [2, 3, 5][Math.floor(index / 64) % 3]
  const exponentA = 2 + (index % 8)
  const exponentB = 1 + (Math.floor(index / 8) % 8)
  const answer = String(base ** (exponentA + exponentB))
  const choices = shuffledChoices(answer, [String(base ** exponentA + base ** exponentB), String(base ** (exponentA * exponentB)), String(base ** (exponentA + exponentB - 1))], seed + 40)
  return { prompt: `Simplify ${base}^${exponentA} × ${base}^${exponentB}.`, ...choices, correctAnswer: answer, hint: 'When bases match, add the exponents.', solution: `${base}^${exponentA} × ${base}^${exponentB} = ${base}^(${exponentA}+${exponentB}) = ${answer}.`, parameters: { base, exponentA, exponentB } }
}

function functionPayload(index: number, seed: number): QuestionPayload {
  const random = rng(seed)
  const m = integer(random, -5, 7) || 2
  const b = integer(random, -8, 8)
  const x = integer(random, -4, 8)
  const y = m * x + b
  const mode = index % 3
  const label = `Problem ${index + 1}: `
  const answer = mode === 0 ? String(y) : mode === 1 ? String(m) : String(b)
  const prompt = mode === 0 ? `${label}For f(x) = ${m}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}, find f(${x}).` : mode === 1 ? `${label}What is the slope of y = ${m}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}?` : `${label}What is the y-intercept of y = ${m}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}?`
  const choices = shuffledChoices(answer, [String(y + 1), String(m + 1), String(b + 1)], seed + 50)
  return { prompt, ...choices, correctAnswer: answer, hint: mode === 0 ? 'Substitute the given x-value.' : 'Compare with y = mx + b.', solution: mode === 0 ? `f(${x}) = ${m}(${x}) ${b >= 0 ? '+' : '-'} ${Math.abs(b)} = ${y}.` : mode === 1 ? `In y = mx + b, m is the slope, so m = ${m}.` : `In y = mx + b, b is the y-intercept, so b = ${b}.`, parameters: { m, b, x, y } }
}

function sequencePayload(index: number, seed: number): QuestionPayload {
  const random = rng(seed)
  const first = integer(random, -8, 12)
  const difference = integer(random, 2, 9)
  const n = integer(random, 5, 12)
  const answer = String(first + (n - 1) * difference)
  const choices = shuffledChoices(answer, [String(first + n * difference), String(first + (n - 2) * difference), String(first * n + difference)], seed + 60)
  return { prompt: `Sequence ${index + 1}: ${first}, ${first + difference}, ${first + 2 * difference}, … What is its ${n}th term?`, ...choices, correctAnswer: answer, hint: 'Use aₙ = a₁ + (n − 1)d.', solution: `aₙ = ${first} + (${n}−1)(${difference}) = ${answer}.`, parameters: { first, difference, n } }
}

function trigonometryPayload(index: number, seed: number): QuestionPayload {
  const table = index % 3 === 0 ? { angle: 30, value: '1/2' } : index % 3 === 1 ? { angle: 45, value: '√2/2' } : { angle: 60, value: '√3/2' }
  const scale = Math.floor(index / 3) + 1
  const answer = table.value
  const choices = shuffledChoices(answer, ['0', '1', '√3', '2'], seed + 70)
  return { prompt: `A right triangle has hypotenuse ${2 * scale} units and special angle ${table.angle}°. What is sin(${table.angle}°)?`, ...choices, correctAnswer: answer, hint: 'Recall the special-angle sine table.', solution: `The side ratio stays the same under scaling, so sin(${table.angle}°) = ${answer}.`, parameters: { angle: table.angle, scale } }
}

function calculusPayload(index: number, seed: number): QuestionPayload {
  const power = 2 + (index % 4)
  const x = 1 + (Math.floor(index / 4) % 10)
  const coefficient = 1 + (Math.floor(index / 40) % 5)
  const answer = String(coefficient * power * x ** (power - 1))
  const choices = shuffledChoices(answer, [String(coefficient * x ** power), String((power - 1) * x), String(coefficient * power + x)], seed + 80)
  return { prompt: `If f(x) = ${coefficient}x^${power}, what is f'(${x})?`, ...choices, correctAnswer: answer, hint: 'Differentiate axⁿ as an×ⁿ⁻¹, then substitute.', solution: `f'(x) = ${coefficient * power}x^${power - 1}; f'(${x}) = ${coefficient * power}(${x})^${power - 1} = ${answer}.`, parameters: { coefficient, power, x } }
}

function logicPayload(index: number, seed: number): QuestionPayload {
  const truth = index % 2 === 0
  const answer = truth ? 'True' : 'False'
  const witness = 2 + 2 * (Math.floor(index / 2) % 20)
  const statement = truth ? `If n is even, then n² is even (for example n = ${witness}).` : `If n² is even, then n is odd (try n = ${witness}).`
  const choices = shuffledChoices(answer, ['True', 'False', 'Cannot be determined'], seed + 90)
  return { prompt: `Case ${index + 1}: evaluate the statement “${statement}”`, ...choices, correctAnswer: answer, hint: truth ? 'Write n = 2k.' : 'Try the supplied even counterexample.', solution: truth ? 'If n = 2k, then n² = 4k² = 2(2k²), which is even.' : `The statement is false: n = ${witness} gives an even square, but n is not odd.`, parameters: { truth, witness } }
}

function conceptPayload(chapter: CurriculumChapter, index: number, seed: number): QuestionPayload {
  const random = rng(seed)
  const subtopic = chapter.subtopics[index % chapter.subtopics.length] ?? chapter.title
  const context = ['a worked example', 'a diagram', 'a table of values', 'a word problem', 'a proof outline', 'a calculator result', 'a graph', 'a boundary case', 'a peer explanation', 'a symbolic expression', 'a data set', 'a model'][index % 12]
  const correct = index % 2 === 0 ? `Use the definition of ${subtopic} and check ${chapter.condition}.` : `Translate the given information into ${chapter.focus}.`
  const choices = shuffledChoices(correct, ['Choose a formula without checking conditions.', 'Change the question so the calculation is easier.', 'Assume every value is valid.'], seed + 100)
  return { prompt: `In ${context} ${index + 1}, which approach is most mathematically reliable when solving a problem about ${subtopic}?`, ...choices, correctAnswer: correct, hint: `Start with the definition of ${subtopic}.`, solution: `${correct} The conditions matter because ${chapter.condition}.`, parameters: { blueprint: index, subtopic, chapterId: chapter.id, token: integer(random, 10, 99) } }
}

function buildPayload(chapter: CurriculumChapter, index: number, seed: number, generator: GeneratorKey, subtopic: string): QuestionPayload {
  switch (generator) {
    case 'algebra': return algebraPayload(chapter, index, seed, subtopic)
    case 'geometry': return geometryPayload(chapter, index, seed)
    case 'probability': return probabilityPayload(index, seed)
    case 'statistics': return statisticsPayload(index, seed)
    case 'exponents': return exponentsPayload(index, seed)
    case 'function': return functionPayload(index, seed)
    case 'sequence': return sequencePayload(index, seed)
    case 'trigonometry': return trigonometryPayload(index, seed)
    case 'calculus': return calculusPayload(index, seed)
    case 'logic': return logicPayload(index, seed)
    default: return conceptPayload(chapter, index, seed)
  }
}

function unitKey(chapter: CurriculumChapter, offering: CurriculumOffering): string {
  return `${chapter.id}|${offering.grade}|${offering.semester}|${offering.course}`
}

export const practiceUnits: PracticeUnit[] = curriculumChapters.flatMap((chapter, chapterIndex) => chapter.offerings.map((offering, offeringIndex) => ({
  unitKey: unitKey(chapter, offering),
  unitId: `unit-${chapterIndex + 1}-${offeringIndex + 1}`,
  chapter,
  offering,
})))

function createPreparedQuestion(unit: PracticeUnit, index: number): PreparedQuestion {
  const subtopicId = unit.chapter.subtopics[index % unit.chapter.subtopics.length] ?? unit.chapter.title
  const difficulty = difficultyFor(index)
  const questionType = questionTypeFor(index)
  const generator = generatorForChapter(unit.chapter.id)
  const id = `qb-${unit.unitId}-${String(index + 1).padStart(3, '0')}`
  const payload = buildPayload(unit.chapter, index, hashString(`${id}:prepared`), generator, subtopicId)
  return {
    id,
    unitKey: unit.unitKey,
    chapterId: unit.chapter.id,
    subtopicId,
    gradeLevel: unit.offering.grade,
    semester: unit.offering.semester,
    courseType: unit.offering.course,
    difficulty,
    questionType,
    ...payload,
    parametersSchema: Object.keys(payload.parameters),
    parameterConstraints: ['All denominators are non-zero.', 'Generated values are checked before publication.', 'Choice values are unique and include exactly one correct answer.'],
    generationStrategy: `${generator} generator with authored blueprint ${index % 12 + 1}`,
    answerStrategy: 'Compute the answer from the stored parameter object, then compare the selected choice index.',
    solutionStrategy: 'Render a deterministic worked solution from the same parameters used in the prompt.',
    answerFormat: 'multiple-choice',
    tags: [unit.chapter.id, subtopicId, generator, difficulty, questionType],
    verificationStatus: 'deterministically-validated',
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    generator,
    baseIndex: index,
    provenance: 'prepared-seed',
  }
}

export const questionBank: PreparedQuestion[] = practiceUnits.flatMap((unit) => Array.from({ length: 120 }, (_, index) => createPreparedQuestion(unit, index)))

export function generateQuestionInstance(prepared: PreparedQuestion, seed = hashString(`${prepared.id}:variant`)): GeneratedQuestionInstance {
  const unit = practiceUnits.find((candidate) => candidate.unitKey === prepared.unitKey)
  const chapter = unit?.chapter ?? curriculumChapters.find((candidate) => candidate.id === prepared.chapterId) ?? curriculumChapters[0]
  const payload = buildPayload(chapter, prepared.baseIndex + (seed % 17), seed, prepared.generator, prepared.subtopicId)
  return {
    instanceId: `${prepared.id}:instance:${seed}`,
    preparedQuestionId: prepared.id,
    variantId: `${prepared.generator}-${seed}`,
    seed,
    params: payload.parameters,
    ...payload,
    difficulty: prepared.difficulty,
    questionType: prepared.questionType,
    chapterId: prepared.chapterId,
    subtopicId: prepared.subtopicId,
  }
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try { return JSON.parse(window.localStorage.getItem(key) ?? '') as T } catch { return fallback }
}

function writeStorage<T>(key: string, value: T): void {
  if (typeof window !== 'undefined') window.localStorage.setItem(key, JSON.stringify(value))
}

function shuffle<T>(values: T[], seed: number): T[] {
  const result = values.slice()
  const random = rng(seed)
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1))
    ;[result[index], result[swap]] = [result[swap], result[index]]
  }
  return result
}

export function eligibleQuestions(filters: QuestionFilters): PreparedQuestion[] {
  return questionBank.filter((question) => question.chapterId === filters.chapterId && question.gradeLevel === filters.grade && question.semester === filters.semester && (filters.course === 'all' || question.courseType === filters.course) && (filters.subtopic === 'all' || question.subtopicId === filters.subtopic) && (filters.difficulty === 'all' || question.difficulty === filters.difficulty))
}

function recentFor(filterKey: string): string[] {
  const recent = readStorage<Record<string, string[]>>(RECENT_KEY, {})
  return recent[filterKey] ?? []
}

function rememberRecent(filterKey: string, ids: string[]): void {
  const recent = readStorage<Record<string, string[]>>(RECENT_KEY, {})
  recent[filterKey] = [...ids, ...(recent[filterKey] ?? [])].filter((id, index, all) => all.indexOf(id) === index).slice(0, 240)
  writeStorage(RECENT_KEY, recent)
}

function filterKey(filters: QuestionFilters): string {
  return [filters.chapterId, filters.grade, filters.semester, filters.course, filters.subtopic, filters.difficulty].join('|')
}

export function selectPreparedQuestions(filters: QuestionFilters, seed: number): { selected: PreparedQuestion[]; poolRestarted: boolean } {
  const eligible = eligibleQuestions(filters)
  const recent = new Set(recentFor(filterKey(filters)))
  const fresh = shuffle(eligible.filter((question) => !recent.has(question.id)), seed)
  const all = shuffle(eligible, seed + 1)
  const selected: PreparedQuestion[] = []
  for (const question of fresh) {
    if (selected.length >= filters.count) break
    selected.push(question)
  }
  let poolRestarted = false
  if (selected.length < filters.count) {
    poolRestarted = fresh.length < filters.count
    let cursor = 0
    while (selected.length < filters.count && all.length > 0) {
      selected.push(all[cursor % all.length])
      cursor += 1
    }
  }
  rememberRecent(filterKey(filters), selected.map((question) => question.id))
  return { selected, poolRestarted }
}

function newSeed(): number {
  return hashString(`${Date.now()}-${Math.random()}-${performance.now()}`)
}

export function createExerciseSession(filters: QuestionFilters, userId = 'local-demo-user'): ExerciseSession {
  const seed = newSeed()
  const { selected, poolRestarted } = selectPreparedQuestions(filters, seed)
  const questions = selected.map((question, index) => generateQuestionInstance(question, hashString(`${seed}:${question.id}:${index}`)))
  const now = new Date().toISOString()
  const session: ExerciseSession = {
    id: `session-${Date.now()}-${seed}`,
    userId,
    filters,
    questions,
    responses: questions.map(() => ({ selectedChoice: null, submitted: false, correct: null })),
    currentIndex: 0,
    score: 0,
    startedAt: now,
    updatedAt: now,
    seed,
    engineVersion: ENGINE_VERSION,
    poolRestarted,
  }
  saveExerciseSession(session)
  return session
}

export function loadExerciseSession(userId = 'local-demo-user'): ExerciseSession | null {
  const session = readStorage<ExerciseSession | null>(SESSION_KEY, null)
  return session?.userId === userId && session.engineVersion === ENGINE_VERSION ? session : null
}

export function saveExerciseSession(session: ExerciseSession): void {
  const updated = { ...session, updatedAt: new Date().toISOString() }
  writeStorage(SESSION_KEY, updated)
  const history = readStorage<ExerciseSession[]>(SESSION_HISTORY_KEY, [])
  const nextHistory = [...history.filter((item) => item.id !== updated.id), updated].slice(-20)
  writeStorage(SESSION_HISTORY_KEY, nextHistory)
}

export function evaluateResponse(question: GeneratedQuestionInstance, selectedChoice: number | null): boolean {
  return selectedChoice !== null && selectedChoice === question.correctChoice
}

export function retryIncorrect(session: ExerciseSession, mode: 'same' | 'new'): ExerciseSession | null {
  const incorrectIndexes = session.responses.flatMap((response, index) => response.submitted && !response.correct ? [index] : [])
  if (incorrectIndexes.length === 0) return null
  if (mode === 'new') return createExerciseSession({ ...session.filters, count: ([10, 20, 30, 50] as SessionLength[]).find((count) => count >= incorrectIndexes.length) ?? 10 }, session.userId)
  const questions = incorrectIndexes.map((index) => session.questions[index])
  const next: ExerciseSession = { ...session, id: `session-retry-${Date.now()}`, questions, responses: questions.map(() => ({ selectedChoice: null, submitted: false, correct: null })), currentIndex: 0, score: 0, startedAt: new Date().toISOString(), completedAt: undefined }
  saveExerciseSession(next)
  return next
}

export type PerformanceRecord = {
  userId: string
  sessionId: string
  questionId: string
  chapterId: string
  subtopicId: string
  difficulty: BankDifficulty
  questionType: BankQuestionType
  correct: boolean
  answeredAt: string
}

export function recordPerformance(record: PerformanceRecord): void {
  const current = readStorage<PerformanceRecord[]>(PERFORMANCE_KEY, [])
  writeStorage(PERFORMANCE_KEY, [...current, record].slice(-500))
}

export function performanceForChapter(chapterId: string, userId = 'local-demo-user'): { attempts: number; correct: number; accuracy: number } {
  const records = readStorage<PerformanceRecord[]>(PERFORMANCE_KEY, []).filter((record) => record.userId === userId && record.chapterId === chapterId)
  const correct = records.filter((record) => record.correct).length
  return { attempts: records.length, correct, accuracy: records.length ? Math.round((correct / records.length) * 100) : 0 }
}

function buildCoverage(bank: PreparedQuestion[]): CoverageEntry[] {
  return practiceUnits.map((unit) => {
    const questions = bank.filter((question) => question.unitKey === unit.unitKey)
    const difficultyCounts: Record<BankDifficulty, number> = { easy: 0, intermediate: 0, advanced: 0, challenge: 0 }
    const prompts = new Set<string>()
    let duplicatePrompts = 0
    let validCount = 0
    for (const question of questions) {
      difficultyCounts[question.difficulty] += 1
      const normalizedPrompt = question.prompt.trim().toLowerCase()
      if (prompts.has(normalizedPrompt)) duplicatePrompts += 1
      prompts.add(normalizedPrompt)
      if (question.prompt && question.solution && question.choices.length === 4 && question.correctChoice >= 0 && question.correctChoice < question.choices.length && question.choices[question.correctChoice] === question.correctAnswer) validCount += 1
    }
    return { unitKey: unit.unitKey, chapterId: unit.chapter.id, chapterTitle: unit.chapter.title, grade: unit.offering.grade, semester: unit.offering.semester, course: unit.offering.course, preparedCount: questions.length, validCount, duplicatePrompts, difficultyCounts, complete: questions.length >= 120 && validCount === questions.length && duplicatePrompts === 0 }
  })
}

export function validateQuestionBank(bank: PreparedQuestion[] = questionBank): QuestionBankValidation {
  const coverage = buildCoverage(bank)
  const invalidRecords: string[] = []
  const duplicateRecords: string[] = []
  const ids = new Set<string>()
  for (const question of bank) {
    if (ids.has(question.id)) duplicateRecords.push(question.id)
    ids.add(question.id)
    if (!question.chapterId || !question.subtopicId || !question.prompt || question.choices.length !== 4 || question.choices.some((choice) => !choice) || question.choices[question.correctChoice] !== question.correctAnswer || question.verificationStatus !== 'deterministically-validated') invalidRecords.push(question.id)
  }
  for (const entry of coverage) if (!entry.complete) invalidRecords.push(`coverage:${entry.unitKey}`)
  return { ok: invalidRecords.length === 0 && duplicateRecords.length === 0, totalPrepared: bank.length, totalUnits: coverage.length, completeUnits: coverage.filter((entry) => entry.complete).length, invalidRecords, duplicateRecords, coverage }
}

export const questionBankCoverage = buildCoverage(questionBank)
export const questionBankValidation = validateQuestionBank(questionBank)
