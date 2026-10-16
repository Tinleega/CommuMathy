import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, "..");
const bundlePath = path.join(projectDir, "assets", "index-B25gbNMy.js");

export function qmmBuildTopicScores(questions = [], answers = {}) {
  const groups = new Map();

  questions.forEach((question, index) => {
    const label = question.topic === "สมการเชิงเส้น"
      ? "สมการและพีชคณิต"
      : question.topic || "อื่น ๆ";
    const group = groups.get(label) ?? { label, total: 0, correct: 0 };
    group.total += 1;
    if (answers[index] === question.correct) group.correct += 1;
    groups.set(label, group);
  });

  return [...groups.values()].map((group) => ({
    ...group,
    score: Math.round((group.correct / group.total) * 100),
  }));
}

export function qmmFormatThaiDate(date = new Date()) {
  return new Intl.DateTimeFormat("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function qmmFormatElapsed(totalSeconds) {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const minutesPart = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secondsPart = String(seconds % 60).padStart(2, "0");
  return `${minutesPart}:${secondsPart}`;
}

export const qmmMathInterestOptions = [
  "พีชคณิต",
  "เรขาคณิต",
  "จำนวนและทฤษฎีจำนวน",
  "ฟังก์ชันและกราฟ",
  "สถิติ",
  "ความน่าจะเป็น",
  "ตรีโกณมิติ",
  "แคลคูลัส",
];

export function qmmProfileImageAccepted(file) {
  const size = Number(file?.size);
  return Boolean(
    file
      && ["image/jpeg", "image/png", "image/webp"].includes(file.type)
      && Number.isFinite(size)
      && size >= 0
      && size <= 5 * 1024 * 1024,
  );
}

export function qmmToggleMathInterest(selected, interest) {
  const current = Array.isArray(selected)
    ? selected.filter((item) => qmmMathInterestOptions.includes(item))
    : [];
  if (!qmmMathInterestOptions.includes(interest)) return current;
  return current.includes(interest)
    ? current.filter((item) => item !== interest)
    : [...current, interest];
}

export function qmmNewProgress() {
  return {
    completedLessons: [],
    bookmarks: [],
    xp: 0,
    streak: 0,
    exerciseCorrect: 0,
    exerciseTotal: 0,
    assessmentScore: null,
    activityDates: [],
    recentActivity: [],
  };
}

export function qmmLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function qmmComputeStreak(activityDates = [], now = new Date()) {
  const dates = new Set(
    Array.isArray(activityDates)
      ? activityDates.filter((date) => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date))
      : [],
  );
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!dates.has(qmmLocalDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (dates.has(qmmLocalDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function qmmNormalizeProgress(progress, now = new Date()) {
  const source = progress && typeof progress === "object" && !Array.isArray(progress) ? progress : {};
  const uniqueStrings = (value) => Array.isArray(value)
    ? [...new Set(value.filter((item) => typeof item === "string" && item.trim()))]
    : [];
  const completedLessons = uniqueStrings(source.completedLessons);
  const bookmarks = uniqueStrings(source.bookmarks);
  const activityDates = [...new Set(
    Array.isArray(source.activityDates)
      ? source.activityDates.filter((date) => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date))
      : [],
  )].sort();
  const recentActivity = Array.isArray(source.recentActivity)
    ? source.recentActivity.filter((item) => item && ["lesson", "exercise"].includes(item.type)
      && typeof item.label === "string" && typeof item.timestamp === "string"
      && Number.isFinite(new Date(item.timestamp).getTime())).slice(0, 20)
    : [];

  let xp = Math.max(0, Math.floor(Number(source.xp) || 0));
  let exerciseCorrect = Math.max(0, Math.floor(Number(source.exerciseCorrect) || 0));
  let exerciseTotal = Math.max(0, Math.floor(Number(source.exerciseTotal) || 0));
  const hasActivityHistory = activityDates.length > 0 || recentActivity.length > 0;
  const hasLegacySeed = !hasActivityHistory
    && Number(source.streak) === 5
    && xp >= 840
    && exerciseCorrect >= 7
    && exerciseTotal >= 9;

  if (hasLegacySeed) {
    const exactStarterSeed = xp === 840
      && exerciseCorrect === 7
      && exerciseTotal === 9
      && completedLessons.length === 0
      && bookmarks.length === 1
      && bookmarks[0] === "linear-equation";
    if (exactStarterSeed) return qmmNewProgress();
    xp = Math.max(0, xp - 840);
    exerciseCorrect = Math.max(0, exerciseCorrect - 7);
    exerciseTotal = Math.max(0, exerciseTotal - 9);
  }

  exerciseTotal = Math.max(exerciseTotal, exerciseCorrect);
  const assessmentScore = source.assessmentScore == null ? null : Number(source.assessmentScore);
  return {
    ...source,
    completedLessons,
    bookmarks,
    xp,
    streak: qmmComputeStreak(activityDates, now),
    exerciseCorrect,
    exerciseTotal,
    assessmentScore: Number.isFinite(assessmentScore) ? assessmentScore : null,
    activityDates,
    recentActivity,
  };
}

export function qmmRecordLearningActivity(progress, type, label, now = new Date()) {
  const normalized = qmmNormalizeProgress(progress, now);
  const activityType = type === "lesson" ? "lesson" : "exercise";
  const timestamp = now.toISOString();
  const activity = {
    id: `${activityType}-${timestamp}`,
    type: activityType,
    label: String(label || (activityType === "lesson" ? "บทเรียน" : "แบบฝึกหัด")),
    timestamp,
  };
  const dateKey = qmmLocalDateKey(now);
  const activityDates = [...new Set([...normalized.activityDates, dateKey])].slice(-400);
  return {
    ...normalized,
    activityDates,
    recentActivity: [activity, ...normalized.recentActivity].slice(0, 20),
    streak: qmmComputeStreak(activityDates, now),
  };
}

export function qmmExerciseAccuracy(correct, total) {
  const attempts = Math.floor(Number(total) || 0);
  if (attempts <= 0) return null;
  return Math.round(Math.max(0, Number(correct) || 0) / attempts * 100);
}

export function qmmCompletionPercent(completed, total) {
  const available = Math.floor(Number(total) || 0);
  if (available <= 0) return 0;
  const count = Math.min(available, Math.max(0, Math.floor(Number(completed) || 0)));
  return Math.round(count / available * 100);
}

function qmmReadLocalUsers() {
  const stored = al("commumathy-local-users", null);
  if (!Array.isArray(stored)) return [];
  const grades = ["ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6"];
  return stored
    .filter((user) => user && typeof user.id === "string" && user.id.trim())
    .map((user) => {
      const rawSettings = user.settings && typeof user.settings === "object" ? user.settings : {};
      const displayName = String(user.displayName || rawSettings.displayName || "ผู้เรียน").trim().slice(0, 40) || "ผู้เรียน";
      const requestedGrade = user.grade || rawSettings.grade;
      const grade = grades.includes(requestedGrade) ? requestedGrade : "ม.1";
      return {
        ...user,
        displayName,
        grade,
        settings: { ...el, ...rawSettings, displayName, grade },
        progress: qmmNormalizeProgress(user.progress ?? qmmNewProgress()),
      };
    });
}

function qmmEnsureLocalUsers() {
  const users = qmmReadLocalUsers();
  if (users.length) return users;
  const rawSettings = al("commumathy-settings", el);
  const settings = { ...el, ...(rawSettings && typeof rawSettings === "object" ? rawSettings : {}) };
  const progress = qmmNormalizeProgress(al("commumathy-progress", tl));
  const profile = {
    id: "local-default",
    displayName: String(settings.displayName || "พิมพ์ชนก").trim() || "พิมพ์ชนก",
    grade: settings.grade || "ม.3",
    settings,
    progress,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem("commumathy-local-users", JSON.stringify([profile]));
  localStorage.setItem("commumathy-active-local-user", profile.id);
  localStorage.setItem("commumathy-settings", JSON.stringify(settings));
  localStorage.setItem("commumathy-progress", JSON.stringify(progress));
  return [profile];
}

function qmmGetActiveLocalUser() {
  const users = qmmEnsureLocalUsers();
  const activeId = localStorage.getItem("commumathy-active-local-user");
  return users.find((user) => user.id === activeId) || null;
}

function qmmLocalUserInitials() {
  const name = qmmGetActiveLocalUser()?.displayName || "ผู้เรียน";
  return Array.from(name).slice(0, 2).join("");
}

function qmmLoadActiveUserSettings(fallback = el) {
  const user = qmmGetActiveLocalUser();
  if (!user) return fallback;
  const settings = { ...fallback, ...user.settings };
  localStorage.setItem("commumathy-settings", JSON.stringify(settings));
  return settings;
}

function qmmLoadActiveUserProgress(fallback = tl) {
  const user = qmmGetActiveLocalUser();
  if (!user) return qmmNewProgress();
  const progress = qmmNormalizeProgress(user.progress ?? al("commumathy-progress", fallback));
  localStorage.setItem("commumathy-progress", JSON.stringify(progress));
  return progress;
}

function qmmSaveActiveUserSettings(value) {
  const active = qmmGetActiveLocalUser();
  if (!active) return false;
  const settings = { ...el, ...(value && typeof value === "object" ? value : {}) };
  const users = qmmReadLocalUsers().map((user) => user.id === active.id
    ? { ...user, displayName: settings.displayName || "ผู้เรียน", grade: settings.grade || "ม.1", settings }
    : user);
  localStorage.setItem("commumathy-local-users", JSON.stringify(users));
  localStorage.setItem("commumathy-settings", JSON.stringify(settings));
  return true;
}

function qmmSaveActiveUserProgress(value) {
  const active = qmmGetActiveLocalUser();
  if (!active) return false;
  const progress = qmmNormalizeProgress(value);
  const users = qmmReadLocalUsers().map((user) => user.id === active.id ? { ...user, progress } : user);
  localStorage.setItem("commumathy-local-users", JSON.stringify(users));
  localStorage.setItem("commumathy-progress", JSON.stringify(progress));
  return true;
}

function qmmSwitchLocalUser(id) {
  const user = qmmReadLocalUsers().find((item) => item.id === id);
  if (!user) return false;
  localStorage.setItem("commumathy-active-local-user", user.id);
  localStorage.setItem("commumathy-settings", JSON.stringify(user.settings));
  localStorage.setItem("commumathy-progress", JSON.stringify(user.progress));
  localStorage.setItem("commumathy-page", JSON.stringify("home"));
  return true;
}

function qmmCreateLocalUser(name, grade) {
  const displayName = String(name || "").trim().slice(0, 40);
  if (!displayName) return false;
  const users = qmmEnsureLocalUsers();
  const grades = ["ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6"];
  const selectedGrade = grades.includes(grade) ? grade : "ม.1";
  const id = `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const settings = {
    ...el,
    displayName,
    grade: selectedGrade,
    profilePicture: "",
    mathInterests: [],
    email: "",
    theme: "ตามระบบ",
  };
  const profile = {
    id,
    displayName,
    grade: selectedGrade,
    settings,
    progress: qmmNewProgress(),
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem("commumathy-local-users", JSON.stringify([...users, profile]));
  return qmmSwitchLocalUser(id);
}

function qmmSignOutLocalUser() {
  const active = qmmGetActiveLocalUser();
  if (active) {
    qmmSaveActiveUserSettings(active.settings);
    qmmSaveActiveUserProgress(active.progress);
  }
  localStorage.removeItem("commumathy-active-local-user");
  localStorage.setItem("commumathy-page", JSON.stringify("home"));
  window.location.reload();
}

function QmmLocalAccountCard() {
  const active = qmmGetActiveLocalUser();
  return (0, X.jsxs)("section", {
    className: "settings-local-account-card",
    children: [
      (0, X.jsxs)("div", {
        className: "settings-local-account-copy",
        children: [
          (0, X.jsx)("strong", { children: "โปรไฟล์บนอุปกรณ์นี้" }),
          (0, X.jsx)("p", { children: `กำลังใช้โปรไฟล์ ${active?.displayName || "ผู้เรียน"} ข้อมูลไม่ซิงก์ไปยังอุปกรณ์อื่น` }),
        ],
      }),
      (0, X.jsx)("button", {
        type: "button",
        className: "outline-button local-signout-button",
        onClick: qmmSignOutLocalUser,
        children: "ออกจากระบบ / เปลี่ยนผู้ใช้",
      }),
    ],
  });
}

function QmmLocalUserGate() {
  const [displayName, setDisplayName] = (0, l.useState)("");
  const [grade, setGrade] = (0, l.useState)("ม.1");
  const [error, setError] = (0, l.useState)("");
  const users = qmmReadLocalUsers();
  const grades = ["ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6"];
  const createProfile = (event) => {
    event.preventDefault();
    if (!qmmCreateLocalUser(displayName, grade)) {
      setError("กรุณากรอกชื่อเพื่อสร้างโปรไฟล์");
      return;
    }
    window.location.reload();
  };
  return (0, X.jsx)("main", {
    className: "local-user-gate",
    children: (0, X.jsxs)("section", {
      className: "local-user-gate-card",
      children: [
        (0, X.jsx)("span", { className: "local-user-kicker", children: "โปรไฟล์ในอุปกรณ์นี้" }),
        (0, X.jsx)("h1", { children: "เลือกโปรไฟล์เพื่อเริ่มเรียน" }),
        (0, X.jsx)("p", { className: "local-user-disclaimer", children: "โปรไฟล์และความก้าวหน้าเก็บอยู่ในเบราว์เซอร์นี้เท่านั้น ไม่มีรหัสผ่านหรือการซิงก์บัญชีออนไลน์ ผู้ที่ใช้อุปกรณ์นี้อาจเลือกโปรไฟล์ใดก็ได้" }),
        users.length > 0 && (0, X.jsxs)("div", {
          className: "local-user-list",
          children: [
            (0, X.jsx)("h2", { children: "โปรไฟล์ที่บันทึกไว้" }),
            users.map((user) => (0, X.jsxs)("button", {
              type: "button",
              className: "local-user-option",
              onClick: () => { if (qmmSwitchLocalUser(user.id)) window.location.reload(); },
              children: [
                (0, X.jsx)("span", { className: "local-user-avatar", children: Array.from(user.displayName).slice(0, 2).join("") }),
                (0, X.jsxs)("span", {
                  className: "local-user-option-copy",
                  children: [
                    (0, X.jsx)("strong", { children: user.displayName }),
                    (0, X.jsx)("small", { children: `${user.grade} • ${user.progress.completedLessons.length} บทเรียนที่จบ` }),
                  ],
                }),
                (0, X.jsx)("span", { className: "local-user-arrow", children: "→" }),
              ],
            }, user.id)),
          ],
        }),
        (0, X.jsxs)("form", {
          className: "local-user-create-form",
          onSubmit: createProfile,
          children: [
            (0, X.jsx)("h2", { children: "สร้างโปรไฟล์ใหม่บนอุปกรณ์นี้" }),
            (0, X.jsxs)("label", {
              children: ["ชื่อที่แสดง", (0, X.jsx)("input", {
                type: "text",
                maxLength: 40,
                value: displayName,
                onChange: (event) => { setDisplayName(event.target.value); setError(""); },
                placeholder: "เช่น พิมพ์ชนก",
                required: true,
              })],
            }),
            (0, X.jsxs)("label", {
              children: ["ระดับชั้น", (0, X.jsx)("select", {
                value: grade,
                onChange: (event) => setGrade(event.target.value),
                children: grades.map((option) => (0, X.jsx)("option", { value: option, children: option }, option)),
              })],
            }),
            error && (0, X.jsx)("p", { className: "local-user-error", role: "alert", children: error }),
            (0, X.jsx)("button", { type: "submit", className: "primary-button", children: "สร้างและเข้าใช้โปรไฟล์" }),
          ],
        }),
      ],
    }),
  });
}

function QmmProfileAchievements({ items = [] }) {
  if (!Array.isArray(items) || items.length === 0) {
    return (0, X.jsx)("div", {
      className: "empty-state compact",
      children: (0, X.jsx)("p", { children: "ยังไม่มีความสำเร็จที่ปลดล็อก" }),
    });
  }
  return (0, X.jsxs)(X.Fragment, {
    children: items.map((item) => (0, X.jsxs)("div", {
      className: "achievement",
      children: [
        (0, X.jsx)("div", {
          className: `achievement-icon ${item.kind === "streak" ? "yellow-achievement" : "purple-achievement"}`,
          children: (0, X.jsx)(item.kind === "streak" ? Oo : ps, { size: 19 }),
        }),
        (0, X.jsxs)("div", {
          children: [
            (0, X.jsx)("strong", { children: item.title }),
            (0, X.jsx)("span", { children: item.description }),
          ],
        }),
        (0, X.jsx)(go, { size: 16 }),
      ],
    }, item.id)),
  });
}

function QmmProfileActivity({ items = [] }) {
  if (!Array.isArray(items) || items.length === 0) {
    return (0, X.jsx)("div", {
      className: "empty-state compact",
      children: (0, X.jsx)("p", { children: "ยังไม่มีกิจกรรมที่บันทึกไว้ เริ่มเรียนหรือทำแบบฝึกหัดเพื่อดูประวัติที่นี่" }),
    });
  }
  return (0, X.jsxs)(X.Fragment, {
    children: items.slice(0, 3).map((item, index) => {
      const date = new Date(item.timestamp);
      const dateLabel = Number.isNaN(date.getTime())
        ? ""
        : new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short" }).format(date);
      return (0, X.jsxs)("div", {
        className: "activity-line",
        children: [
          (0, X.jsx)("span", { className: `activity-dot ${index === 0 ? "green-dot" : "purple-dot"}` }),
          (0, X.jsxs)("div", {
            children: [
              (0, X.jsx)("strong", { children: item.type === "lesson" ? "เรียนจบบทเรียน" : "ทำแบบฝึกหัด" }),
              (0, X.jsx)("p", { children: item.label }),
            ],
          }),
          (0, X.jsx)("small", { children: dateLabel }),
        ],
      }, item.id || `${item.type}-${item.timestamp}`);
    }),
  });
}

export function qmmCompressProfileImage(file) {
  if (!qmmProfileImageAccepted(file)) {
    return Promise.reject(new Error("เลือกรูป JPG, PNG หรือ WebP ขนาดไม่เกิน 5 MB"));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์รูปได้"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("ไฟล์นี้ไม่ใช่รูปภาพที่รองรับ"));
      image.onload = () => {
        const originalWidth = image.naturalWidth || image.width;
        const originalHeight = image.naturalHeight || image.height;
        const scale = Math.min(1, 320 / Math.max(originalWidth, originalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(originalWidth * scale));
        canvas.height = Math.max(1, Math.round(originalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("ไม่สามารถปรับขนาดรูปภาพได้"));
          return;
        }
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        try {
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        } catch {
          reject(new Error("ไม่สามารถบันทึกรูปภาพนี้ได้"));
        }
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

function QmmProfilePhotoEditor({ settings, onUpload, onRemove, error }) {
  return (0, X.jsxs)("div", {
    className: "profile-photo-editor",
    children: [
      (0, X.jsxs)("div", {
        className: "profile-photo-copy",
        children: [
          (0, X.jsx)("strong", { children: "รูปโปรไฟล์" }),
          (0, X.jsx)("span", { children: "JPG, PNG หรือ WebP ไม่เกิน 5 MB • ระบบย่อรูปและเก็บไว้บนอุปกรณ์นี้" }),
        ],
      }),
      (0, X.jsxs)("div", {
        className: "profile-photo-controls",
        children: [
          (0, X.jsxs)("label", {
            className: "profile-photo-upload",
            children: [
              (0, X.jsx)("span", { children: settings.profilePicture ? "เปลี่ยนรูป" : "อัปโหลดรูป" }),
              (0, X.jsx)("input", {
                type: "file",
                accept: "image/jpeg,image/png,image/webp",
                className: "profile-photo-input",
                "aria-label": "อัปโหลดรูปโปรไฟล์",
                onChange: onUpload,
              }),
            ],
          }),
          settings.profilePicture && (0, X.jsx)("button", {
            type: "button",
            className: "outline-button profile-photo-remove",
            onClick: onRemove,
            children: "ลบรูป",
          }),
        ],
      }),
      error && (0, X.jsx)("p", { className: "profile-photo-error", role: "alert", children: error }),
    ],
  });
}

function QmmMathInterestSelector({ selected = [], onToggle }) {
  return (0, X.jsxs)("div", {
    className: "settings-section math-interest-section",
    children: [
      (0, X.jsxs)("div", {
        className: "settings-section-copy",
        children: [
          (0, X.jsx)("h2", { children: "สาขาคณิตศาสตร์ที่สนใจ" }),
          (0, X.jsx)("p", { children: "เลือกได้หลายข้อ เพื่อให้เส้นทางเรียนรู้ตรงกับสิ่งที่คุณชอบ" }),
        ],
      }),
      (0, X.jsx)("div", {
        className: "math-interest-grid",
        children: qmmMathInterestOptions.map((interest) => {
          const active = selected.includes(interest);
          return (0, X.jsx)("button", {
            type: "button",
            className: `math-interest-chip ${active ? "selected" : ""}`,
            "aria-pressed": active,
            onClick: () => onToggle(interest),
            children: interest,
          }, interest);
        }),
      }),
      (0, X.jsx)("p", { className: "math-interest-help", children: `แตะหัวข้อเพื่อเลือกหรือยกเลิกได้ทุกเมื่อ` }),
    ],
  });
}

function QmmAssessmentTimer() {
  const [elapsed, setElapsed] = (0, l.useState)(0);

  (0, l.useEffect)(() => {
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return qmmFormatElapsed(elapsed);
}

function wl({ score, total, progress, onLessons, questions = [], answers = {} }) {
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const topicScores = qmmBuildTopicScores(questions, answers);
  const weakestTopic = topicScores
    .filter((topic) => topic.score < 100)
    .sort((left, right) => left.score - right.score)[0];
  const recommendationTitle = weakestTopic
    ? `ทบทวน${weakestTopic.label}`
    : "ต่อยอดด้วยโจทย์ที่ท้าทายขึ้น";
  const recommendationCopy = weakestTopic
    ? `ทำได้ ${weakestTopic.correct} จาก ${weakestTopic.total} ข้อในหัวข้อนี้ ลองทบทวนบทเรียนที่เกี่ยวข้องก่อนทำโจทย์ถัดไป`
    : "คุณตอบถูกทุกข้อในแบบประเมินนี้ ลองต่อยอดด้วยโจทย์ที่ท้าทายขึ้น";

  return (0, X.jsxs)(X.Fragment, {
    children: [
      (0, X.jsx)(bl, {
        eyebrow: "ผลการประเมินของคุณ",
        title: "เห็นภาพชัดขึ้น แล้วไปต่อด้วยกัน",
        description: "ผลลัพธ์นี้เป็นข้อมูลเบื้องต้นจากคำตอบชุดนี้ ใช้เป็นแนวทางวางแผนการเรียน ไม่ใช่การตัดสินความสามารถ",
        action: (0, X.jsxs)("button", {
          className: "outline-button",
          onClick: onLessons,
          children: [(0, X.jsx)(so, { size: 16 }), " ดูบทเรียนแนะนำ"],
        }),
      }),
      (0, X.jsxs)("div", {
        className: "results-summary",
        children: [
          (0, X.jsxs)("div", {
            className: "result-score",
            children: [
              (0, X.jsxs)("div", {
                className: "score-circle",
                children: [
                  (0, X.jsxs)("strong", { children: [percentage, "%"] }),
                  (0, X.jsx)("span", { children: "คะแนนรวม" }),
                ],
              }),
              (0, X.jsxs)("div", {
                children: [
                  (0, X.jsxs)("span", {
                    className: "result-kicker",
                    children: ["ทำได้ ", score, " จาก ", total, " ข้อ"],
                  }),
                  (0, X.jsx)("h2", {
                    children: percentage >= 70
                      ? "พื้นฐานกำลังแข็งแรง!"
                      : "เรามาหาจุดที่ต้องเสริมกัน",
                  }),
                  (0, X.jsx)("p", {
                    children: "ทุกคำตอบช่วยให้เราเข้าใจเส้นทางของคุณมากขึ้น",
                  }),
                ],
              }),
            ],
          }),
          (0, X.jsxs)("div", {
            className: "result-stats",
            children: [
              (0, X.jsxs)("div", {
                children: [
                  (0, X.jsx)("strong", { children: score }),
                  (0, X.jsx)("span", { children: "ตอบถูก" }),
                ],
              }),
              (0, X.jsxs)("div", {
                children: [
                  (0, X.jsx)("strong", { children: total - score }),
                  (0, X.jsx)("span", { children: "ควรทบทวน" }),
                ],
              }),
              (0, X.jsxs)("div", {
                children: [
                  (0, X.jsx)("strong", { children: progress.streak }),
                  (0, X.jsx)("span", { children: "วันต่อเนื่อง" }),
                ],
              }),
            ],
          }),
        ],
      }),
      (0, X.jsxs)("div", {
        className: "result-grid",
        children: [
          (0, X.jsxs)("div", {
            className: "result-panel",
            children: [
              (0, X.jsxs)("div", {
                className: "panel-heading",
                children: [
                  (0, X.jsx)("h3", { children: "ภาพรวมรายหัวข้อ" }),
                  (0, X.jsx)("span", { children: "จากแบบประเมินครั้งนี้" }),
                ],
              }),
              topicScores.map((topic) => (0, X.jsxs)("div", {
                className: "topic-result",
                children: [
                  (0, X.jsxs)("div", {
                    children: [
                      (0, X.jsx)("span", { children: topic.label }),
                      (0, X.jsxs)("strong", { children: [topic.score, "%"] }),
                    ],
                  }),
                  (0, X.jsx)("div", {
                    className: "progress-line",
                    children: (0, X.jsx)("span", {
                      style: { width: `${topic.score}%` },
                    }),
                  }),
                ],
              }, topic.label)),
            ],
          }),
          (0, X.jsxs)("div", {
            className: "result-panel recommendation-panel",
            children: [
              (0, X.jsx)("div", {
                className: "recommendation-icon",
                children: (0, X.jsx)(ds, { size: 18 }),
              }),
              (0, X.jsxs)("div", {
                children: [
                  (0, X.jsx)("span", {
                    className: "result-kicker",
                    children: "แนะนำสำหรับคุณ",
                  }),
                  (0, X.jsx)("h3", { children: recommendationTitle }),
                  (0, X.jsx)("p", { children: recommendationCopy }),
                  (0, X.jsxs)("button", {
                    className: "text-button",
                    onClick: onLessons,
                    children: ["เปิดเส้นทางแนะนำ ", (0, X.jsx)(to, { size: 15 })],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function xl({ lesson, progress, onBack, onComplete, onBookmark, onPractice }) {
  const completed = progress.completedLessons.includes(lesson.id);
  const saved = progress.bookmarks.includes(lesson.id);
  const sections = Array.isArray(lesson.sections) ? lesson.sections : [];
  const objectives = Array.isArray(lesson.objectives) ? lesson.objectives : [];

  return (0, X.jsxs)(X.Fragment, {
    children: [
      (0, X.jsxs)("button", {
        className: "back-button",
        onClick: onBack,
        children: [(0, X.jsx)($a, { size: 16 }), " กลับไปยังบทเรียนทั้งหมด"],
      }),
      (0, X.jsxs)("div", {
        className: "lesson-detail-header",
        children: [
          (0, X.jsxs)("div", {
            children: [
              (0, X.jsxs)("div", {
                className: "chip-row",
                children: [
                  (0, X.jsx)("span", { className: "chip chip-indigo", children: lesson.grade }),
                  (0, X.jsx)("span", { className: "chip", children: lesson.subject }),
                  (0, X.jsx)("span", { className: "chip chip-yellow", children: lesson.level }),
                ],
              }),
              (0, X.jsx)("h1", { children: lesson.title }),
              (0, X.jsx)("p", { className: "page-intro", children: lesson.subtitle }),
            ],
          }),
          (0, X.jsxs)("div", {
            className: "detail-actions",
            children: [
              (0, X.jsx)("button", {
                className: "icon-button",
                onClick: () => onBookmark(lesson.id),
                "aria-label": "บันทึกบทเรียน",
                children: saved
                  ? (0, X.jsx)(lo, { size: 20, fill: "currentColor" })
                  : (0, X.jsx)(fo, { size: 20 }),
              }),
              (0, X.jsx)("button", {
                className: `primary-button ${completed ? "success-button" : ""}`,
                onClick: onComplete,
                children: completed
                  ? (0, X.jsxs)(X.Fragment, { children: [(0, X.jsx)(go, { size: 17 }), " เรียนจบแล้ว"] })
                  : (0, X.jsxs)(X.Fragment, { children: ["ทำเครื่องหมายว่าเรียนจบ ", (0, X.jsx)(go, { size: 17 })] }),
              }),
            ],
          }),
        ],
      }),
      (0, X.jsxs)("div", {
        className: "lesson-detail-layout",
        children: [
          (0, X.jsxs)("article", {
            className: "lesson-article",
            children: [
              (0, X.jsxs)("div", {
                className: "lesson-hero-banner",
                children: [
                  (0, X.jsxs)("div", {
                    children: [
                      (0, X.jsx)("span", { className: "banner-overline", children: "ทำความเข้าใจ ไม่ใช่แค่จำ" }),
                      (0, X.jsxs)("h2", {
                        children: ["แนวคิดสำคัญ", (0, X.jsx)("br", {}), (0, X.jsx)("em", { children: lesson.title })],
                      }),
                      (0, X.jsx)("p", { children: lesson.subtitle }),
                    ],
                  }),
                  (0, X.jsx)("div", {
                    className: "lesson-formula-preview",
                    children: (0, X.jsx)(ol, { formula: lesson.formula, display: true }),
                  }),
                ],
              }),
              (0, X.jsxs)("div", {
                className: "article-section",
                children: [
                  (0, X.jsx)("h2", { children: "ภาพรวม" }),
                  (0, X.jsx)("p", { children: lesson.description }),
                  (0, X.jsx)("div", {
                    className: "formula-panel",
                    children: (0, X.jsx)(ol, { formula: lesson.formula, display: true }),
                  }),
                  (0, X.jsxs)("div", {
                    className: "why-callout",
                    children: [
                      (0, X.jsx)("div", { className: "callout-icon", children: (0, X.jsx)(Lo, { size: 19 }) }),
                      (0, X.jsxs)("div", {
                        children: [
                          (0, X.jsx)("strong", { children: "เป้าหมายของบทนี้" }),
                          (0, X.jsx)("ul", {
                            className: "lesson-objectives",
                            children: objectives.map((objective) => (0, X.jsx)("li", { children: objective }, objective)),
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              (0, X.jsxs)("div", {
                className: "article-section",
                children: [
                  (0, X.jsx)("div", { className: "section-number", children: "01" }),
                  (0, X.jsxs)("div", {
                    children: [
                      (0, X.jsx)("h2", { children: sections[0] || "แนวคิดหลัก" }),
                      (0, X.jsx)("p", { children: lesson.description }),
                      (0, X.jsx)("div", {
                        className: "steps-row",
                        children: sections.slice(0, 3).map((section, index) => (0, X.jsxs)("div", {
                          className: "step-card",
                          children: [
                            (0, X.jsx)("span", { className: "step-number", children: index + 1 }),
                            (0, X.jsx)("strong", { children: section }),
                            (0, X.jsx)("p", {
                              className: "lesson-step-copy",
                              children: objectives[index] || lesson.subtitle,
                            }),
                          ],
                        }, section)),
                      }),
                    ],
                  }),
                ],
              }),
              (0, X.jsxs)("div", {
                className: "mistake-panel",
                children: [
                  (0, X.jsx)("div", { className: "mistake-icon", children: (0, X.jsx)(So, { size: 20 }) }),
                  (0, X.jsxs)("div", {
                    children: [
                      (0, X.jsx)("strong", { children: "ตรวจความเข้าใจ" }),
                      (0, X.jsx)("p", {
                        children: "ลองตรวจว่าขั้นตอนและคำตอบสอดคล้องกับข้อมูลและแนวคิดของบทนี้หรือไม่",
                      }),
                    ],
                  }),
                ],
              }),
              (0, X.jsxs)("div", {
                className: "article-footer-cta",
                children: [
                  (0, X.jsxs)("div", {
                    children: [
                      (0, X.jsx)("h3", { children: "พร้อมลองทำด้วยตัวเองแล้วหรือยัง?" }),
                      (0, X.jsx)("p", { children: `ฝึกเรื่อง ${lesson.title} กับโจทย์สั้น ๆ 3 ข้อ` }),
                    ],
                  }),
                  (0, X.jsxs)("button", {
                    className: "primary-button",
                    onClick: onPractice,
                    children: ["ไปทำแบบฝึกหัด ", (0, X.jsx)(to, { size: 17 })],
                  }),
                ],
              }),
            ],
          }),
          (0, X.jsx)("aside", {
            className: "lesson-outline",
            children: (0, X.jsxs)("div", {
              className: "outline-sticky",
              children: [
                (0, X.jsxs)("div", {
                  className: "outline-heading",
                  children: [
                    (0, X.jsx)("strong", { children: "เนื้อหาในบทเรียน" }),
                    (0, X.jsxs)("span", { children: [lesson.progress, "%"] }),
                  ],
                }),
                (0, X.jsx)("div", {
                  className: "outline-progress",
                  children: (0, X.jsx)("span", { style: { width: `${completed ? 100 : lesson.progress}%` } }),
                }),
                (0, X.jsx)("div", {
                  className: "outline-list",
                  children: sections.map((section, index) => (0, X.jsxs)("button", {
                    className: index === 0 ? "current" : "",
                    children: [
                      (0, X.jsx)("span", { children: index === 0 ? (0, X.jsx)(go, { size: 13 }) : index + 1 }),
                      section,
                      (0, X.jsx)(bo, { size: 14 }),
                    ],
                  }, section)),
                }),
                (0, X.jsxs)("div", {
                  className: "prerequisite",
                  children: [
                    (0, X.jsxs)("span", { children: [(0, X.jsx)(Fo, { size: 14 }), " พื้นฐานที่ควรรู้"] }),
                    (0, X.jsx)("p", { children: lesson.prerequisite }),
                  ],
                }),
              ],
            }),
          }),
        ],
      }),
    ],
  });
}

export function qmmExerciseGeneratorType(chapterId) {
  const chapterRoutes = {
    "m1-linear-equation": "algebra",
    "m2-pythagorean": "geometry",
    "m1-graphs-linear": "function",
    "m1-exponents": "exponents",
    "m2-exponent-properties": "exponents",
    "m1-statistics-1": "statistics",
    "m2-statistics-2": "statistics",
    "m3-statistics-3": "statistics",
    "m3-probability": "probability",
    "m3-trig-ratios": "trigonometry",
    "upper-logic": "logic",
    "upper-probability": "probability",
    "upper-trig-functions": "trigonometry",
    "upper-sequences-series": "sequence",
    "upper-calculus": "calculus",
    "upper-quantitative-data": "statistics",
  };
  return chapterRoutes[String(chapterId).toLowerCase()] ?? "concept";
}

function replaceExactlyOnce(source, oldText, newText, description) {
  const first = source.indexOf(oldText);
  if (first < 0 || source.indexOf(oldText, first + oldText.length) >= 0) {
    throw new Error(`Expected exactly one source anchor for ${description}.`);
  }
  return `${source.slice(0, first)}${newText}${source.slice(first + oldText.length)}`;
}

function replaceFunctionRegion(source, startMarker, endMarker, replacement, description) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0 || source.indexOf(startMarker, start + startMarker.length) >= 0) {
    throw new Error(`Could not safely locate ${description} in the legacy bundle.`);
  }
  return `${source.slice(0, start)}${replacement}\n${source.slice(end)}`;
}

function injectBefore(source, marker, addition, description, alreadyPresentMarker) {
  if (source.includes(alreadyPresentMarker)) return source;
  return replaceExactlyOnce(source, marker, `${addition}\n${marker}`, description);
}

function replaceOrVerify(source, oldText, newText, marker, description) {
  if (source.includes(marker)) return source;
  return replaceExactlyOnce(source, oldText, newText, description);
}

function replaceEveryOrVerify(source, oldText, newText, marker, description) {
  if (source.includes(oldText)) return source.replaceAll(oldText, newText);
  if (source.includes(marker)) return source;
  throw new Error(`Could not safely locate ${description} in the legacy bundle.`);
}

export function patchBundle(input) {
  let output = input;

  if (!output.includes("function qmmExerciseGeneratorType(")) {
    output = replaceFunctionRegion(
      output,
      "function uc(e){",
      "function dc(e){",
      `${qmmExerciseGeneratorType.toString()}\nfunction uc(e){return qmmExerciseGeneratorType(e)}`,
      "chapter-specific exercise routing",
    );
  }

  output = replaceOrVerify(
    output,
    "function Cc(e,t,n){let r=ic(n),i=e.subtopics[t%e.subtopics.length]??e.title,",
    "function Cc(e,t,n,selectedSubtopic){let r=ic(n),i=selectedSubtopic??e.subtopics[t%e.subtopics.length]??e.title,",
    "function Cc(e,t,n,selectedSubtopic){",
    "fallback question subtopic handling",
  );
  output = replaceOrVerify(
    output,
    "default:return Cc(e,t,n)}}",
    "default:return Cc(e,t,n,i)}}",
    "default:return Cc(e,t,n,i)}}",
    "fallback generator subtopic propagation",
  );

  if (!output.includes("lesson-formula-preview")) {
    output = replaceFunctionRegion(
      output,
      "function xl({lesson:e,progress:t,onBack:n,onComplete:r,onBookmark:i,onPractice:a}){",
      "function Sl({number:e,title:t,formula:n}){",
      xl.toString(),
      "lesson detail renderer",
    );
  }

  if (!output.includes("function qmmBuildTopicScores(")) {
    output = replaceFunctionRegion(
      output,
      "function wl({score:e,total:t,progress:n,onLessons:r}){",
      "function Tl({messages:e,setMessages:t}){",
      `${qmmBuildTopicScores.toString()}\n${wl.toString()}`,
      "assessment result renderer",
    );
  }

  output = replaceOrVerify(
    output,
    "wl,{score:d,total:u.length,progress:e,onLessons:n}",
    "wl,{score:d,total:u.length,progress:e,onLessons:n,questions:u,answers:s}",
    "questions:u,answers:s",
    "assessment question/answer props",
  );

  output = injectBefore(
    output,
    "function Cl({progress:e,setProgress:t,onLessons:n}){",
    `${qmmFormatElapsed.toString()}\n${QmmAssessmentTimer.toString()}`,
    "assessment timer component",
    "function QmmAssessmentTimer(",
  );
  output = replaceOrVerify(
    output,
    "children:`08:24`",
    "children:(0,X.jsx)(QmmAssessmentTimer,{})",
    "QmmAssessmentTimer,{})",
    "assessment timer display",
  );

  output = injectBefore(
    output,
    "function ll({progress:e,onNavigate:t,onLesson:n}){",
    qmmFormatThaiDate.toString(),
    "Thai date formatter",
    "function qmmFormatThaiDate(",
  );
  output = replaceOrVerify(
    output,
    "` วันจันทร์ที่ 13 ตุลาคม 2569`",
    "qmmFormatThaiDate(new Date())",
    "qmmFormatThaiDate(new Date())",
    "dashboard date",
  );
  output = replaceOrVerify(
    output,
    "duration:`25 นาที`,progress:68",
    "duration:`25 นาที`,progress:0",
    "duration:`25 นาที`,progress:0",
    "remove seeded lesson-catalog completion",
  );
  output = replaceOrVerify(
    output,
    'children: [lesson.progress, "%"]',
    'children: [completed ? 100 : 0, "%"]',
    'children: [completed ? 100 : 0, "%"]',
    "show only real lesson completion in the detail outline",
  );
  output = replaceOrVerify(
    output,
    'width: `${completed ? 100 : lesson.progress}%`',
    'width: `${completed ? 100 : 0}%`',
    'width: `${completed ? 100 : 0}%`',
    "show only real completion in the lesson outline progress bar",
  );

  const qmmProgressHelpers = [
    qmmNewProgress.toString(),
    qmmLocalDateKey.toString(),
    qmmComputeStreak.toString(),
    qmmNormalizeProgress.toString(),
    qmmRecordLearningActivity.toString(),
    qmmExerciseAccuracy.toString(),
    qmmCompletionPercent.toString(),
    'function qmmLoadProgress(){return qmmLoadActiveUserProgress()}',
    'function qmmLoadNotifications(){const notifications=al(`commumathy-notifications`,rl);return Array.isArray(notifications)?notifications.filter(item=>item&&item.id!==`streak-1`):[]}',
  ].join("\n");
  output = injectBefore(
    output,
    "function sl(){",
    qmmProgressHelpers,
    "real progress and activity tracking helpers",
    "function qmmLoadProgress(",
  );
  output = replaceOrVerify(
    output,
    'function qmmLoadProgress(){return qmmNormalizeProgress(al(`commumathy-progress`,null))}',
    'function qmmLoadProgress(){return qmmLoadActiveUserProgress()}',
    'function qmmLoadProgress(){return qmmLoadActiveUserProgress()}',
    "load progress from the active local profile",
  );
  const qmmLocalUserRuntime = [
    qmmReadLocalUsers.toString(),
    qmmEnsureLocalUsers.toString(),
    qmmGetActiveLocalUser.toString(),
    qmmLocalUserInitials.toString(),
    qmmLoadActiveUserSettings.toString(),
    qmmLoadActiveUserProgress.toString(),
    qmmSaveActiveUserSettings.toString(),
    qmmSaveActiveUserProgress.toString(),
    qmmSwitchLocalUser.toString(),
    qmmCreateLocalUser.toString(),
    qmmSignOutLocalUser.toString(),
    QmmLocalAccountCard.toString(),
    QmmLocalUserGate.toString(),
  ].join("\n");
  output = injectBefore(
    output,
    "function sl(){",
    qmmLocalUserRuntime,
    "local-only profile storage, switching, and sign-out UI",
    "function qmmReadLocalUsers(",
  );

  output = replaceOrVerify(
    output,
    "var el={displayName:`พิมพ์ชนก`,grade:`ม.3`,bio:`กำลังฝึกทำความเข้าใจคณิตศาสตร์ให้มากขึ้น`,email:`pimchanok@example.com`,",
    "var el={displayName:`พิมพ์ชนก`,grade:`ม.3`,bio:`กำลังฝึกทำความเข้าใจคณิตศาสตร์ให้มากขึ้น`,profilePicture:``,mathInterests:[],email:`pimchanok@example.com`,",
    "profilePicture:``,mathInterests:[]",
    "default profile photo and interests",
  );
  output = replaceOrVerify(
    output,
    "tl={completedLessons:[],bookmarks:[`linear-equation`],xp:840,streak:5,exerciseCorrect:7,exerciseTotal:9}",
    "tl={completedLessons:[],bookmarks:[],xp:0,streak:0,exerciseCorrect:0,exerciseTotal:0,assessmentScore:null,activityDates:[],recentActivity:[]}",
    "tl={completedLessons:[],bookmarks:[],xp:0,streak:0,exerciseCorrect:0,exerciseTotal:0",
    "empty default progress state",
  );
  const fakeStreakNotification = "{id:`streak-1`,kind:`streak`,title:`รักษาสตรีคไว้ได้อีกวัน`,body:`คุณเรียนต่อเนื่องมาแล้ว 5 วัน เก่งมาก!`,time:`วันนี้ 09:00`,read:!1},";
  if (output.includes(fakeStreakNotification)) {
    output = replaceExactlyOnce(output, fakeStreakNotification, "", "remove fabricated streak notification");
  }
  output = replaceOrVerify(
    output,
    "(0,l.useState)(()=>al(`commumathy-progress`,tl))",
    "(0,l.useState)(()=>qmmLoadProgress())",
    "(0,l.useState)(()=>qmmLoadProgress())",
    "load and migrate real progress history",
  );
  output = replaceOrVerify(
    output,
    "(0,l.useState)(()=>al(`commumathy-settings`,null)?.theme??`ตามระบบ`)",
    "(0,l.useState)(()=>qmmLoadActiveUserSettings(el).theme??`ตามระบบ`)",
    "(0,l.useState)(()=>qmmLoadActiveUserSettings(el).theme??`ตามระบบ`)",
    "load the current profile theme",
  );
  output = replaceOrVerify(
    output,
    "(0,l.useEffect)(()=>{localStorage.setItem(`commumathy-progress`,JSON.stringify(p))},[p])",
    "(0,l.useEffect)(()=>{qmmSaveActiveUserProgress(p)},[p])",
    "(0,l.useEffect)(()=>{qmmSaveActiveUserProgress(p)},[p])",
    "persist progress only to the active local profile",
  );
  output = replaceOrVerify(
    output,
    "(0,l.useState)(()=>al(`commumathy-notifications`,rl))",
    "(0,l.useState)(()=>qmmLoadNotifications())",
    "(0,l.useState)(()=>qmmLoadNotifications())",
    "filter fabricated legacy streak notification",
  );
  output = replaceOrVerify(
    output,
    "te=e=>{r(e);let t=al(`commumathy-settings`,el);localStorage.setItem(`commumathy-settings`,JSON.stringify({...t,theme:e}))}",
    "te=e=>{r(e);let t=qmmLoadActiveUserSettings(el);qmmSaveActiveUserSettings({...t,theme:e})}",
    "qmmSaveActiveUserSettings({...t,theme:e})",
    "persist theme changes to the active local profile",
  );
  output = replaceOrVerify(
    output,
    "t(t=>({...t,exerciseCorrect:t.exerciseCorrect+ +!!e,exerciseTotal:t.exerciseTotal+1,xp:t.xp+(e?15:5)}))",
    't(t=>qmmRecordLearningActivity({...t,exerciseCorrect:t.exerciseCorrect+ +!!e,exerciseTotal:t.exerciseTotal+1,xp:t.xp+(e?15:5)},"exercise",p.title))',
    "qmmRecordLearningActivity({...t,exerciseCorrect:t.exerciseCorrect+ +!!e",
    "record exercise answers, XP, and active date",
  );
  output = replaceOrVerify(
    output,
    "ce=()=>m(e=>({...e,completedLessons:e.completedLessons.includes(i.id)?e.completedLessons:[...e.completedLessons,i.id],xp:e.xp+(e.completedLessons.includes(i.id)?0:40)}))",
    'ce=()=>m(e=>e.completedLessons.includes(i.id)?e:qmmRecordLearningActivity({...e,completedLessons:[...e.completedLessons,i.id],xp:e.xp+40},"lesson",i.title))',
    "qmmRecordLearningActivity({...e,completedLessons:[...e.completedLessons,i.id]",
    "record a completed lesson once",
  );
  output = replaceOrVerify(
    output,
    "le=e=>m(t=>({...t,completedLessons:t.completedLessons.includes(e)?t.completedLessons:[...t.completedLessons,e],xp:t.xp+(t.completedLessons.includes(e)?0:40)}))",
    'le=e=>m(t=>t.completedLessons.includes(e)?t:qmmRecordLearningActivity({...t,completedLessons:[...t.completedLessons,e],xp:t.xp+40},"lesson",Os.find(n=>n.id===e)?.title||`บทเรียน`))',
    "qmmRecordLearningActivity({...t,completedLessons:[...t.completedLessons,e]",
    "record completed curriculum lessons once",
  );

  output = replaceOrVerify(
    output,
    "function ll({progress:e,onNavigate:t,onLesson:n}){let r=Math.round(e.exerciseCorrect/e.exerciseTotal*100);return",
    "function ll({progress:e,onNavigate:t,onLesson:n}){let r=qmmExerciseAccuracy(e.exerciseCorrect,e.exerciseTotal);return",
    "let r=qmmExerciseAccuracy(e.exerciseCorrect,e.exerciseTotal)",
    "guard dashboard accuracy before the first answer",
  );
  output = replaceOrVerify(
    output,
    "label:`เรียนต่อเนื่อง`,value:`${e.streak} วัน`,note:`เพิ่มขึ้น 2 วันจากสัปดาห์ก่อน`,tone:`orange`",
    "label:`เรียนต่อเนื่อง`,value:`${e.streak} วัน`,note:e.streak?`คำนวณจากวันที่เรียนจริง`:`เริ่มเรียนเพื่อบันทึกสถิติ`,tone:`orange`",
    "คำนวณจากวันที่เรียนจริง",
    "remove unsupported streak comparison",
  );
  output = replaceOrVerify(
    output,
    "label:`ความแม่นยำแบบฝึกหัด`,value:`${r}%`,note:`ดีขึ้น 8% จากครั้งก่อน`,tone:`green`",
    "label:`ความแม่นยำแบบฝึกหัด`,value:r===null?`—`:`${r}%`,note:e.exerciseTotal?`คำนวณจาก ${e.exerciseTotal} ข้อ`:`ยังไม่มีคำตอบที่บันทึก`,tone:`green`",
    "ยังไม่มีคำตอบที่บันทึก",
    "show no-data accuracy until answers are recorded",
  );
  output = replaceOrVerify(
    output,
    "label:`คะแนนสะสม`,value:`${e.xp.toLocaleString()} XP`,note:`อีก 160 XP ถึงระดับถัดไป`,tone:`yellow`",
    "label:`คะแนนสะสม`,value:`${e.xp.toLocaleString()} XP`,note:`สะสมจากบทเรียนและแบบฝึกหัดที่ทำเสร็จ`,tone:`yellow`",
    "สะสมจากบทเรียนและแบบฝึกหัดที่ทำเสร็จ",
    "remove unsupported XP level comparison",
  );

  output = replaceEveryOrVerify(
    output,
    "e.xp/12",
    "qmmCompletionPercent(e.completedLessons.length,Os.length)",
    "qmmCompletionPercent(e.completedLessons.length,Os.length)",
    "replace XP-derived overall progress with completed lessons",
  );
  output = replaceOrVerify(
    output,
    "children:`68%`",
    "children:`${qmmCompletionPercent(e.completedLessons.length,Os.length)}%`",
    "children:`${qmmCompletionPercent(e.completedLessons.length,Os.length)}%`",
    "replace seeded lesson progress in the dashboard summary",
  );
  output = replaceEveryOrVerify(
    output,
    "Os[0].progress",
    "qmmCompletionPercent(e.completedLessons.includes(Os[0].id)?1:0,1)",
    "qmmCompletionPercent(e.completedLessons.includes(Os[0].id)?1:0,1)",
    "replace the mock continue-card progress value",
  );
  output = replaceOrVerify(
    output,
    "title:`เรียนต่อจากครั้งล่าสุด`",
    "title:`บทเรียนที่แนะนำให้เริ่ม`",
    "title:`บทเรียนที่แนะนำให้เริ่ม`",
    "remove false last-session heading",
  );
  output = replaceOrVerify(
    output,
    "className:`card-kicker`,children:`บทเรียนที่กำลังเรียน`",
    "className:`card-kicker`,children:`บทเรียนแนะนำ`",
    "className:`card-kicker`,children:`บทเรียนแนะนำ`",
    "remove false current-lesson label",
  );
  output = replaceOrVerify(
    output,
    "Os[0].duration,` ที่เหลือ`",
    "Os[0].duration,` โดยประมาณ`",
    "Os[0].duration,` โดยประมาณ`",
    "remove false remaining-time claim",
  );
  output = replaceOrVerify(
    output,
    "`กลับไปเรียนต่อ `",
    "e.completedLessons.includes(Os[0].id)?`ทบทวนบทเรียน `:`เริ่มบทเรียน `",
    "e.completedLessons.includes(Os[0].id)?`ทบทวนบทเรียน `:`เริ่มบทเรียน `",
    "label dashboard lesson action according to real completion",
  );

  output = replaceOrVerify(
    output,
    "children:[Math.round(e.exerciseCorrect/e.exerciseTotal*100),`%`]",
    "children:[qmmExerciseAccuracy(e.exerciseCorrect,e.exerciseTotal)??`—`,qmmExerciseAccuracy(e.exerciseCorrect,e.exerciseTotal)===null?``:`%`]",
    "qmmExerciseAccuracy(e.exerciseCorrect,e.exerciseTotal)??`—`",
    "show no-data accuracy in the progress overview",
  );
  output = replaceOrVerify(
    output,
    "children:[e.assessmentScore??0,`%`]",
    "children:[e.assessmentScore==null?`—`:e.assessmentScore,e.assessmentScore==null?``:`%`]",
    "e.assessmentScore==null?`—`:e.assessmentScore",
    "show no-data assessment score until an assessment exists",
  );
  output = replaceOrVerify(
    output,
    "children:[`คุณกำลังเรียนต่อเนื่อง `,(0,X.jsxs)(`strong`,{children:[e.streak,` วัน`]})]",
    "children:[e.streak?`คุณกำลังเรียนต่อเนื่อง `:`เริ่มเรียนเพื่อบันทึกสตรีค `,(0,X.jsxs)(`strong`,{children:[e.streak,` วัน`]})]",
    "เริ่มเรียนเพื่อบันทึกสตรีค",
    "make streak strip honest before the first activity",
  );
  output = replaceOrVerify(
    output,
    ";return(0,X.jsxs)(`div`,{className:`app-shell`",
    ";if(!qmmGetActiveLocalUser())return(0,X.jsx)(QmmLocalUserGate,{});return(0,X.jsxs)(`div`,{className:`app-shell`",
    "if(!qmmGetActiveLocalUser())return(0,X.jsx)(QmmLocalUserGate,{})",
    "show the local profile chooser after sign-out",
  );
  output = replaceOrVerify(
    output,
    "children:[`สวัสดี, พิมพ์ชนก `,",
    "children:[`สวัสดี, ${qmmGetActiveLocalUser()?.displayName||`ผู้เรียน`} `,",
    "${qmmGetActiveLocalUser()?.displayName||`ผู้เรียน`}",
    "greet the active local profile by name",
  );
  output = replaceOrVerify(
    output,
    "className:`top-avatar`,onClick:()=>D(`profile`),children:`พช`",
    "className:`top-avatar`,onClick:()=>D(`profile`),children:qmmLocalUserInitials()",
    "children:qmmLocalUserInitials()",
    "show the active local profile in the top avatar",
  );
  output = replaceOrVerify(
    output,
    "(0,X.jsxs)(`div`,{className:`mini-profile`,children:[(0,X.jsx)(`div`,{className:`avatar avatar-indigo`,children:`พช`}),(0,X.jsxs)(`div`,{children:[(0,X.jsx)(`strong`,{children:`พิมพ์ชนก`}),(0,X.jsx)(`small`,{children:`ม.3 • นักสำรวจ`})]}),(0,X.jsx)(Eo,{size:17})]})",
    "(0,X.jsxs)(`div`,{className:`mini-profile`,children:[(0,X.jsx)(`div`,{className:`avatar avatar-indigo`,children:qmmLocalUserInitials()}),(0,X.jsxs)(`div`,{children:[(0,X.jsx)(`strong`,{children:qmmGetActiveLocalUser()?.displayName||`ผู้เรียน`}),(0,X.jsx)(`small`,{children:`${qmmGetActiveLocalUser()?.grade||`—`} • โปรไฟล์ในอุปกรณ์นี้`})]}),(0,X.jsx)(Eo,{size:17})]})",
    "className:`mini-profile`,children:[(0,X.jsx)(`div`,{className:`avatar avatar-indigo`,children:qmmLocalUserInitials()})",
    "show the active local profile in the sidebar identity card",
  );

  const profileHelpers = [
    `const qmmMathInterestOptions=${JSON.stringify(qmmMathInterestOptions)};`,
    qmmProfileImageAccepted.toString(),
    qmmCompressProfileImage.toString(),
    QmmProfilePhotoEditor.toString(),
    QmmMathInterestSelector.toString(),
  ].join("\n");
  output = injectBefore(
    output,
    "function Ml({onThemeChange:e}){",
    profileHelpers,
    "profile photo and math-interest controls",
    "function qmmProfileImageAccepted(",
  );
  output = injectBefore(
    output,
    "function Ml({onThemeChange:e}){",
    qmmToggleMathInterest.toString(),
    "functional math-interest update helper",
    "function qmmToggleMathInterest(",
  );
  const profileProgressDisplayHelpers = [
    QmmProfileAchievements.toString(),
    QmmProfileActivity.toString(),
  ].join("\n");
  output = injectBefore(
    output,
    "function Ml({onThemeChange:e}){",
    profileProgressDisplayHelpers,
    "earned achievement and recorded activity profile renderers",
    "function QmmProfileAchievements(",
  );

  const oldSharedProfileSettings = "profileSettings=al(`commumathy-settings`,el)||el";
  if (output.includes(oldSharedProfileSettings)) {
    output = replaceExactlyOnce(
      output,
      oldSharedProfileSettings,
      "profileSettings=qmmLoadActiveUserSettings(el)||el",
      "migrate the profile screen to active-user settings",
    );
  }
  output = replaceOrVerify(
    output,
    "function jl({progress:e,onNavigate:t,onLesson:n}){return",
    "function jl({progress:e,onNavigate:t,onLesson:n}){const profileSettings=qmmLoadActiveUserSettings(el)||el,profileName=String(profileSettings.displayName||`พิมพ์ชนก`).trim()||`พิมพ์ชนก`,profileGrade=profileSettings.grade||`ม.3`,profileInterests=Array.isArray(profileSettings.mathInterests)?profileSettings.mathInterests:[];return",
    "profileSettings=qmmLoadActiveUserSettings(el)||el",
    "profile screen reads saved profile fields",
  );
  output = replaceOrVerify(
    output,
    "profileInterests=Array.isArray(profileSettings.mathInterests)?profileSettings.mathInterests:[];return",
    "profileInterests=Array.isArray(profileSettings.mathInterests)?profileSettings.mathInterests:[];const profileAchievements=[];if(e.streak>=5)profileAchievements.push({id:`streak`,kind:`streak`,title:`ไฟแรงต่อเนื่อง`,description:`เรียนต่อเนื่องครบ 5 วัน`});if(e.exerciseCorrect>=5)profileAchievements.push({id:`practice`,kind:`practice`,title:`นักแก้โจทย์`,description:`ตอบถูกครบ 5 ข้อ`});return",
    "const profileAchievements=[]",
    "derive profile achievements from actual progress",
  );
  output = replaceOrVerify(
    output,
    "(0,X.jsx)(`div`,{className:`profile-avatar-large`,children:`พช`})",
    "(0,X.jsx)(`div`,{className:`profile-avatar-large`,children:profileSettings.profilePicture?(0,X.jsx)(`img`,{src:profileSettings.profilePicture,alt:`รูปโปรไฟล์ของ ${profileName}`}):profileName.slice(0,2)})",
    "profileSettings.profilePicture?(0,X.jsx)(`img`",
    "profile screen avatar",
  );
  output = replaceOrVerify(
    output,
    "(0,X.jsx)(`h1`,{children:`พิมพ์ชนก`})",
    "(0,X.jsx)(`h1`,{children:profileName})",
    "(0,X.jsx)(`h1`,{children:profileName})",
    "profile screen display name",
  );
  output = replaceOrVerify(
    output,
    "(0,X.jsx)(`p`,{children:`นักเรียนชั้น ม.3 • เริ่มเรียนกับ CommuMathy เมื่อ 3 ต.ค. 2569`})",
    "(0,X.jsxs)(X.Fragment,{children:[(0,X.jsx)(`p`,{children:`นักเรียนชั้น ${profileGrade} • เริ่มเรียนกับ CommuMathy เมื่อ 3 ต.ค. 2569`}),(0,X.jsxs)(`div`,{className:`profile-interest-row`,children:[(0,X.jsx)(`span`,{className:`profile-interest-label`,children:`สนใจ`}),(profileInterests.length?profileInterests.map(interest=>(0,X.jsx)(`span`,{className:`profile-interest-pill`,children:interest},interest)):(0,X.jsx)(`button`,{type:`button`,className:`profile-interest-add`,onClick:()=>t(`settings`),children:`+ เพิ่มความสนใจ`}))]})]})",
    "className:`profile-interest-row`",
    "profile screen interest summary",
  );
  output = replaceOrVerify(
    output,
    "นักเรียนชั้น ${profileGrade} • เริ่มเรียนกับ CommuMathy เมื่อ 3 ต.ค. 2569",
    "นักเรียนชั้น ${profileGrade} • สถิติแสดงจากกิจกรรมที่บันทึกไว้",
    "สถิติแสดงจากกิจกรรมที่บันทึกไว้",
    "remove fabricated profile join date",
  );
  output = replaceOrVerify(
    output,
    "เริ่มต้นได้ดีมาก รักษาจังหวะนี้ไว้",
    "เรียนจบแล้ว ${e.completedLessons.length} บท",
    "เรียนจบแล้ว ${e.completedLessons.length} บท",
    "replace unsupported profile progress praise",
  );
  output = replaceOrVerify(
    output,
    "children:`เป้าหมาย: 1,000 XP`",
    "children:`จากทั้งหมด ${Os.length} บท`",
    "children:`จากทั้งหมด ${Os.length} บท`",
    "align profile progress target with lesson-completion measure",
  );

  if (!output.includes("QmmProfileAchievements,{items:profileAchievements}")) {
    output = replaceFunctionRegion(
      output,
      "className:`side-card achievement-card`,children:[",
      "className:`side-card activity-card`",
      "className:`side-card achievement-card`,children:[(0,X.jsxs)(`div`,{className:`side-card-heading`,children:[(0,X.jsx)(`h3`,{children:`ความสำเร็จล่าสุด`}),(0,X.jsx)(`button`,{children:`ดูทั้งหมด`})]}),(0,X.jsx)(QmmProfileAchievements,{items:profileAchievements})]}),(0,X.jsxs)(`div`,{",
      "profile achievements use earned milestones only",
    );
  }
  if (!output.includes("QmmProfileActivity,{items:e.recentActivity}")) {
    output = replaceFunctionRegion(
      output,
      "className:`side-card activity-card`,children:[",
      "const qmmMathInterestOptions=",
      "className:`side-card activity-card`,children:[(0,X.jsx)(`div`,{className:`side-card-heading`,children:(0,X.jsx)(`h3`,{children:`กิจกรรมล่าสุด`})}),(0,X.jsx)(QmmProfileActivity,{items:e.recentActivity})]})]})]})]})}",
      "profile activity uses recorded events only",
    );
  }

  const settingsRenderAnchor = "f=d.find(e=>e.id===t)??d[0];return(0,X.jsxs)(X.Fragment";
  output = replaceOrVerify(
    output,
    "(0,l.useState)(()=>al(`commumathy-settings`,el))",
    "(0,l.useState)(()=>qmmLoadActiveUserSettings(el))",
    "(0,l.useState)(()=>qmmLoadActiveUserSettings(el))",
    "load settings from the active local profile",
  );
  output = replaceOrVerify(
    output,
    "c=()=>{localStorage.setItem(`commumathy-settings`,JSON.stringify(r)),o(!0)}",
    "c=()=>{qmmSaveActiveUserSettings(r),o(!0)}",
    "c=()=>{qmmSaveActiveUserSettings(r),o(!0)}",
    "save profile settings to that user’s local profile",
  );
  const profileHandlers = [
    'const [profileImageError,setProfileImageError]=(0,l.useState)("");',
    'const handleProfileImageUpload=async event=>{const input=event.currentTarget,file=input.files&&input.files[0];if(!file)return;setProfileImageError("");try{const dataUrl=await qmmCompressProfileImage(file);s("profilePicture",dataUrl)}catch(error){setProfileImageError(error instanceof Error?error.message:"รูปภาพไม่รองรับ กรุณาเลือก JPG, PNG หรือ WebP ไม่เกิน 5 MB")}finally{input.value=""}};',
    'const clearProfileImage=()=>{s("profilePicture","");setProfileImageError("")};',
  ].join("");
  output = replaceOrVerify(
    output,
    settingsRenderAnchor,
    settingsRenderAnchor.replace("return(", `${profileHandlers}return(`),
    "const handleProfileImageUpload=async event=>",
    "profile image upload handlers",
  );
  const profileInterestToggleHandler = 'const handleMathInterestToggle=interest=>{i(current=>({...current,mathInterests:qmmToggleMathInterest(current.mathInterests,interest)}));o(false)};';
  const clearProfileImageReturn = 'const clearProfileImage=()=>{s("profilePicture","");setProfileImageError("")};return(0,X.jsxs)(X.Fragment';
  output = replaceOrVerify(
    output,
    clearProfileImageReturn,
    clearProfileImageReturn.replace("return(", `${profileInterestToggleHandler}return(`),
    "const handleMathInterestToggle=interest=>",
    "functional multi-select state update",
  );
  output = replaceOrVerify(
    output,
    "(0,X.jsx)(`div`,{className:`profile-settings-avatar`,children:r.displayName.slice(0,2)})",
    "(0,X.jsx)(`div`,{className:`profile-settings-avatar`,children:r.profilePicture?(0,X.jsx)(`img`,{src:r.profilePicture,alt:`รูปโปรไฟล์`}):(r.displayName||``).slice(0,2)})",
    "className:`profile-settings-avatar`,children:r.profilePicture?",
    "settings profile avatar preview",
  );
  output = replaceOrVerify(
    output,
    "(0,X.jsxs)(`div`,{className:`profile-form`,children:[",
    "(0,X.jsx)(QmmProfilePhotoEditor,{settings:r,onUpload:handleProfileImageUpload,onRemove:clearProfileImage,error:profileImageError}),(0,X.jsxs)(`div`,{className:`profile-form`,children:[",
    "QmmProfilePhotoEditor,{settings:r",
    "profile photo editor control",
  );

  const previousInterestSelector = '(0,X.jsx)(QmmMathInterestSelector,{selected:Array.isArray(r.mathInterests)?r.mathInterests:[],onToggle:interest=>{const current=Array.isArray(r.mathInterests)?r.mathInterests:[];s("mathInterests",current.includes(interest)?current.filter(item=>item!==interest):[...current,interest])}}),';
  const interestSelector = '(0,X.jsx)(QmmMathInterestSelector,{selected:Array.isArray(r.mathInterests)?r.mathInterests:[],onToggle:handleMathInterestToggle}),';
  if (output.includes(previousInterestSelector)) {
    output = replaceExactlyOnce(
      output,
      previousInterestSelector,
      interestSelector,
      "functional math-interest selector callback",
    );
  }
  const settingsInfoStrip = "(0,X.jsxs)(`div`,{className:`settings-info-strip`";
  output = replaceOrVerify(
    output,
    settingsInfoStrip,
    `${interestSelector}${settingsInfoStrip}`,
    "QmmMathInterestSelector,{selected:Array.isArray(r.mathInterests)?r.mathInterests:[],onToggle:handleMathInterestToggle",
    "math-interest profile selector",
  );
  const unseparatedLocalAccountCard = `(0,X.jsx)(QmmLocalAccountCard,{})${settingsInfoStrip}`;
  if (output.includes(unseparatedLocalAccountCard)) {
    output = replaceExactlyOnce(
      output,
      unseparatedLocalAccountCard,
      `(0,X.jsx)(QmmLocalAccountCard,{}),${settingsInfoStrip}`,
      "repair local account card JSX child separator",
    );
  }
  output = replaceOrVerify(
    output,
    settingsInfoStrip,
    `(0,X.jsx)(QmmLocalAccountCard,{}),${settingsInfoStrip}`,
    "QmmLocalAccountCard,{})",
    "add local sign-out and profile-switch entry in settings",
  );

  return output;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const source = await readFile(bundlePath, "utf8");
  const patched = patchBundle(source);

  if (process.argv.includes("--write")) {
    if (patched !== source) {
      await writeFile(bundlePath, patched, "utf8");
    }
    console.log(`Legacy bundle patched and verified: ${path.relative(projectDir, bundlePath)}`);
  } else if (patched !== source) {
    console.error("Bundle fixes are available but not yet applied. Run with --write.");
    process.exitCode = 1;
  } else {
    console.log("Legacy bundle fixes are present and verified.");
  }
}
