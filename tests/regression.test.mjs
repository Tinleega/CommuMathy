import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  patchBundle,
  qmmBuildTopicScores,
  qmmCompletionPercent,
  qmmComputeStreak,
  qmmExerciseAccuracy,
  qmmExerciseGeneratorType,
  qmmRenderExerciseDiagram,
  qmmRenderProject14Guide,
  qmmProject14Videos,
  qmmGenerateVariedExercise,
  qmmFormatElapsed,
  qmmFormatThaiDate,
  qmmMathInterestOptions,
  qmmNewProgress,
  qmmNormalizeProgress,
  qmmProfileImageAccepted,
  qmmRecordLearningActivity,
  qmmToggleMathInterest,
} from "../scripts/patch-legacy-bundle.mjs";

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readBundle = () => readFile(path.join(projectDir, "assets", "index-B25gbNMy.js"), "utf8");

const diagnostic = [
  { topic: "สมการเชิงเส้น", correct: 1 },
  { topic: "สมการเชิงเส้น", correct: 0 },
  { topic: "การคิดเชิงเหตุผล", correct: 2 },
];

test("topic scores are calculated from answers and only include assessed topics", () => {
  assert.deepEqual(qmmBuildTopicScores(diagnostic, { 0: 1, 1: 0, 2: 2 }), [
    { label: "สมการและพีชคณิต", total: 2, correct: 2, score: 100 },
    { label: "การคิดเชิงเหตุผล", total: 1, correct: 1, score: 100 },
  ]);
});

test("incorrect answers lower the matching topic and do not affect other topics", () => {
  assert.deepEqual(qmmBuildTopicScores(diagnostic, { 0: 1, 1: 2, 2: 0 }), [
    { label: "สมการและพีชคณิต", total: 2, correct: 1, score: 50 },
    { label: "การคิดเชิงเหตุผล", total: 1, correct: 0, score: 0 },
  ]);
});

test("elapsed time is formatted as a live mm:ss clock", () => {
  assert.equal(qmmFormatElapsed(0), "00:00");
  assert.equal(qmmFormatElapsed(84), "01:24");
  assert.equal(qmmFormatElapsed(3600), "60:00");
  assert.equal(qmmFormatElapsed(-3), "00:00");
});

test("profile images accept common web formats up to 5 MB only", () => {
  assert.equal(qmmProfileImageAccepted({ type: "image/jpeg", size: 5 * 1024 * 1024 }), true);
  assert.equal(qmmProfileImageAccepted({ type: "image/png", size: 128 }), true);
  assert.equal(qmmProfileImageAccepted({ type: "image/gif", size: 128 }), false);
  assert.equal(qmmProfileImageAccepted({ type: "image/png", size: 5 * 1024 * 1024 + 1 }), false);
  assert.equal(qmmProfileImageAccepted(null), false);
});

test("profile math-interest choices are unique and include core curriculum fields", () => {
  assert.equal(qmmMathInterestOptions.length, 8);
  assert.equal(new Set(qmmMathInterestOptions).size, qmmMathInterestOptions.length);
  assert.ok(qmmMathInterestOptions.includes("พีชคณิต"));
  assert.ok(qmmMathInterestOptions.includes("เรขาคณิต"));
  assert.ok(qmmMathInterestOptions.includes("ความน่าจะเป็น"));
  assert.ok(qmmMathInterestOptions.includes("แคลคูลัส"));
});

test("rapid math-interest toggles preserve previous selections and reject unknown values", () => {
  let selected = [];
  selected = qmmToggleMathInterest(selected, "เรขาคณิต");
  selected = qmmToggleMathInterest(selected, "สถิติ");
  assert.deepEqual(selected, ["เรขาคณิต", "สถิติ"]);
  selected = qmmToggleMathInterest(selected, "เรขาคณิต");
  assert.deepEqual(selected, ["สถิติ"]);
  assert.deepEqual(qmmToggleMathInterest(selected, "not-a-math-field"), ["สถิติ"]);
});

test("new progress starts empty instead of awarding seeded streak, XP, accuracy, or bookmarks", () => {
  assert.deepEqual(qmmNewProgress(), {
    completedLessons: [],
    bookmarks: [],
    xp: 0,
    streak: 0,
    exerciseCorrect: 0,
    exerciseTotal: 0,
    assessmentScore: null,
    activityDates: [],
    recentActivity: [],
  });
});

test("legacy fabricated starter progress is cleared and later real gains are preserved", () => {
  const now = new Date(2026, 9, 15, 12);
  const starter = qmmNormalizeProgress({
    completedLessons: [],
    bookmarks: ["linear-equation"],
    xp: 840,
    streak: 5,
    exerciseCorrect: 7,
    exerciseTotal: 9,
  }, now);
  assert.deepEqual(starter, qmmNewProgress());

  const used = qmmNormalizeProgress({
    completedLessons: ["linear-equation"],
    bookmarks: [],
    xp: 895,
    streak: 5,
    exerciseCorrect: 8,
    exerciseTotal: 10,
  }, now);
  assert.equal(used.xp, 55);
  assert.equal(used.exerciseCorrect, 1);
  assert.equal(used.exerciseTotal, 1);
  assert.equal(used.streak, 0, "old versions did not store dates, so their streak cannot be verified");
  assert.deepEqual(used.completedLessons, ["linear-equation"]);
});

test("streak counts only consecutive dates with recorded learning activity", () => {
  const now = new Date(2026, 9, 15, 12);
  assert.equal(qmmComputeStreak(["2026-10-15", "2026-10-14", "2026-10-13"], now), 3);
  assert.equal(qmmComputeStreak(["2026-10-14", "2026-10-13"], now), 2);
  assert.equal(qmmComputeStreak(["2026-10-12"], now), 0);

  const recorded = qmmRecordLearningActivity(qmmNewProgress(), "lesson", "สมการเชิงเส้น", now);
  assert.equal(recorded.streak, 1);
  assert.deepEqual(recorded.activityDates, ["2026-10-15"]);
  assert.equal(recorded.recentActivity[0].label, "สมการเชิงเส้น");
});

test("accuracy and completion percentages do not imply learning before any activity", () => {
  assert.equal(qmmExerciseAccuracy(0, 0), null);
  assert.equal(qmmExerciseAccuracy(1, 2), 50);
  assert.equal(qmmCompletionPercent(0, 4), 0);
  assert.equal(qmmCompletionPercent(1, 4), 25);
  assert.equal(qmmCompletionPercent(8, 4), 100);
});

test("Thai dashboard date uses the actual weekday and Buddhist calendar year", () => {
  assert.equal(
    qmmFormatThaiDate(new Date(Date.UTC(2026, 9, 15, 12))),
    "วันพฤหัสบดีที่ 15 ตุลาคม 2569",
  );
});

test("relative app assets resolve under a GitHub Pages project prefix", async () => {
  const html = await readFile(path.join(projectDir, "index.html"), "utf8");
  assert.match(html, /src="\.\/assets\//);
  assert.match(html, /href="\.\/assets\//);
  assert.match(html, /href="\.\/assets\/project14-video-guide\.css"/);
  assert.equal(
    new URL("./assets/app.js", "https://tinleega.github.io/CommuMathy/").pathname,
    "/CommuMathy/assets/app.js",
  );

  const css = await readFile(path.join(projectDir, "assets", "index-cl9-rDJC.css"), "utf8");
  assert.doesNotMatch(css, /url\([\"']?\/assets\//);
  assert.match(css, /url\(\.\/KaTeX_/);
});

test("every curriculum chapter receives topic-matched, varied exercise templates", async () => {
  const bundle = await readBundle();
  const chapterIds = [
    ...bundle.matchAll(/zs\(`([^`]+)`\s*,/g),
    ...bundle.matchAll(/Bs\(`(upper-[^`]+)`\s*,/g),
  ].map(([, id]) => id);
  assert.equal(chapterIds.length, 49, "all current curriculum chapters should be checked");
  for (const chapterId of chapterIds) {
    assert.notEqual(qmmExerciseGeneratorType(chapterId), "mixed-review", `chapter needs an explicit topic route: ${chapterId}`);
  }

  for (const chapterId of [
    "m1-integers",
    "m1-decimals-fractions",
    "m1-ratio-proportion-percent",
    "m2-real-numbers-intro",
    "m2-polynomials",
    "m2-quadratic-factoring",
    "m3-linear-inequality",
    "m3-higher-degree-factoring",
    "m3-quadratic-equation",
    "m1-geometric-construction",
    "m1-2d-3d-figures",
    "m2-prisms-cylinders",
    "m2-transformations",
    "m2-congruence",
    "m2-parallel-lines",
    "m2-geometric-reasoning",
    "m3-similarity",
    "m3-quadratic-graphs",
    "m3-circles",
    "m3-pyramids-cones-spheres",
    "m3-linear-systems",
    "upper-sets",
    "upper-real-numbers",
    "upper-relations-functions",
    "upper-exponential-log",
    "upper-analytic-geometry",
    "upper-matrices",
    "upper-vectors",
    "upper-complex",
    "upper-counting",
    "upper-statistics-meaning",
    "upper-qualitative-data",
    "upper-random-variables",
  ]) {
    assert.notEqual(qmmExerciseGeneratorType(chapterId), "mixed-review", `formerly generic chapter needs a topic-specific route: ${chapterId}`);
  }

  for (const chapterId of chapterIds) {
    const generatorType = qmmExerciseGeneratorType(chapterId);
    const chapter = { id: chapterId, title: chapterId, subtopics: [chapterId] };
    const exercises = Array.from({ length: 120 }, (_, index) =>
      qmmGenerateVariedExercise(chapter, index, 0, generatorType, chapterId),
    );
    assert.ok(new Set(exercises.slice(0, 8).map((item) => item.prompt)).size >= 4, `${chapterId} should have several question formats`);
    for (const [index, exercise] of exercises.entries()) {
      assert.equal(exercise.choices.length, 4, `${chapterId} question ${index} should have four choices`);
      assert.equal(new Set(exercise.choices).size, 4, `${chapterId} question ${index} should have unique choices`);
      assert.equal(exercise.choices[exercise.correctChoice], exercise.correctAnswer, `${chapterId} question ${index} answer key should match its choices`);
      assert.ok(exercise.solution.includes(exercise.correctAnswer), `${chapterId} question ${index} solution should explain the answer`);
      assert.doesNotMatch(JSON.stringify(exercise), /\$\{|NaN|undefined|ตัวเลือก \d+/, `${chapterId} question ${index} should contain no template artifacts`);
      assert.deepEqual(
        exercise,
        qmmGenerateVariedExercise(chapter, index, 0, generatorType, chapterId),
        `${chapterId} question ${index} should be deterministic for stable review and scoring`,
      );
    }
  }

  const sample = (chapterId, index) => qmmGenerateVariedExercise(
    { id: chapterId, title: chapterId, subtopics: [chapterId] },
    index,
    0,
    qmmExerciseGeneratorType(chapterId),
    chapterId,
  );
  assert.ok(sample("m1-decimals-fractions", 3).prompt.includes("."), "fraction chapter should also include decimal arithmetic");
  assert.ok([0, 1, 2, 3].every((index) => sample("m3-higher-degree-factoring", index).prompt.includes("x³")), "higher-degree factoring should generate cubic problems");
  assert.ok([0, 1, 2, 3].every((index) => /ปริซึม|ทรงกระบอก/.test(sample("m2-prisms-cylinders", index).prompt) && !/พีระมิด|กรวย|ทรงกลม/.test(sample("m2-prisms-cylinders", index).prompt)), "prisms/cylinders chapter should not receive pyramid or sphere questions");
  assert.ok([0, 1, 2, 3].every((index) => /พีระมิด|กรวย|ทรงกลม/.test(sample("m3-pyramids-cones-spheres", index).prompt)), "pyramid/cone/sphere chapter should cover those solids");
  assert.ok([0, 1, 2, 3].every((index) => sample("m3-linear-systems", index).prompt.includes("ระบบ")), "linear-systems chapter should always ask about systems");
  assert.doesNotMatch(JSON.stringify([0, 1, 2, 3].map((index) => sample("m2-congruence", index))), /夹/, "congruence copy should remain Thai, without a stray Chinese character");

  const mockRuntime = {
    jsx: (type, props) => ({ type, props }),
    jsxs: (type, props) => ({ type, props }),
  };
  const hasSvg = (element) => {
    if (!element || typeof element !== "object") return false;
    if (element.type === "svg") return true;
    const children = element.props?.children;
    return Array.isArray(children) ? children.some(hasSvg) : hasSvg(children);
  };
  const diagramChapterIds = [
    "m1-geometric-construction", "m1-2d-3d-figures", "m1-graphs-linear", "m2-pythagorean",
    "m2-prisms-cylinders", "m2-transformations", "m2-congruence", "m2-parallel-lines",
    "m2-geometric-reasoning", "m3-similarity", "m3-circles", "m3-pyramids-cones-spheres",
    "m3-quadratic-graphs", "m3-trig-ratios", "upper-analytic-geometry", "upper-vectors",
  ];
  for (const chapterId of diagramChapterIds) {
    for (let index = 0; index < 4; index += 1) {
      const question = { ...sample(chapterId, index), chapterId };
      const figure = qmmRenderExerciseDiagram(mockRuntime, question);
      assert.equal(figure?.type, "div", `${chapterId} question ${index} should render a figure container`);
      assert.equal(figure.props.role, "img", `${chapterId} question ${index} should expose image semantics`);
      assert.ok(figure.props["aria-label"], `${chapterId} question ${index} should have an accessible description`);
      assert.ok(hasSvg(figure), `${chapterId} question ${index} should contain an inline SVG`);
    }
  }
  assert.equal(qmmRenderExerciseDiagram(mockRuntime, { ...sample("m1-integers", 0), chapterId: "m1-integers" }), null, "nonvisual arithmetic questions should not gain an unrelated figure");

  const patchedBundle = patchBundle(bundle);
  assert.match(patchedBundle, /function uc\(e\)\{return qmmExerciseGeneratorType\(e\)\}/);
  assert.ok(patchedBundle.includes("function qmmGenerateVariedExercise("));
  assert.ok(patchedBundle.includes("function qmmRenderExerciseDiagram("));
  assert.ok(patchedBundle.includes("function QmmExerciseDiagram({question})"));
  assert.ok(patchedBundle.includes("(0,X.jsx)(QmmExerciseDiagram,{question:v})"), "question card should display the matching inline diagram");
  assert.ok(patchedBundle.includes("function wc(e,t,n,r,i){return qmmGenerateVariedExercise(e,t,n,r,i)}"));
  assert.ok(patchedBundle.includes("var Ec=Gs.flatMap("), "the unit/offering collection must remain available to the prepared exercise pool");
});

test("Pythagorean lesson metadata and the lesson renderer stay topic-consistent", async () => {
  const bundle = await readBundle();
  const recordStart = bundle.indexOf("id:`pythagorean`,title:`ทฤษฎีบทพีทาโกรัส`");
  assert.notEqual(recordStart, -1, "Pythagorean lesson record should exist");
  const recordEnd = bundle.indexOf("},{id:", recordStart + 1);
  const record = bundle.slice(recordStart, recordEnd === -1 ? undefined : recordEnd);
  assert.match(record, /formula:`a\^2 \+ b\^2 = c\^2`/);
  assert.match(record, /ใช้ทฤษฎีบทพีทาโกรัส/);
  assert.match(record, /สามเหลี่ยมมุมฉาก/);

  const patched = patchBundle(bundle);
  const rendererStart = patched.indexOf("function xl(");
  const rendererEnd = patched.indexOf("function Sl({number:e,title:t,formula:n}){", rendererStart);
  const renderer = patched.slice(rendererStart, rendererEnd);
  assert.notEqual(rendererStart, -1);
  assert.notEqual(rendererEnd, -1);
  assert.match(renderer, /lesson\.formula/);
  assert.match(renderer, /lesson\.objectives/);
  assert.match(renderer, /lesson\.sections/);
  assert.doesNotMatch(renderer, /2x\+3=11/);
  assert.doesNotMatch(renderer, /สมการเชิงเส้นตัวแปรเดียวคืออะไร/);
});

test("Project14 video guide renders an accessible player and official-source links", () => {
  const runtime = {
    jsx: (type, props) => ({ type, props }),
    jsxs: (type, props) => ({ type, props }),
  };
  const video = {
    chapterTitle: "ทฤษฎีบทพีทาโกรัส",
    title: "บทเรียน Project14: ทฤษฎีบทพีทาโกรัส",
    watchUrl: "https://www.youtube.com/watch?v=abc123xyz89",
    embedUrl: "https://www.youtube-nocookie.com/embed/abc123xyz89",
    sourceUrl: "https://project14.ipst.ac.th/m2-math/",
    matchType: "exact",
  };
  const guide = qmmRenderProject14Guide(runtime, "m2-pythagorean", { "m2-pythagorean": video });
  const collect = (node, predicate, found = []) => {
    if (!node || typeof node !== "object") return found;
    if (predicate(node)) found.push(node);
    const children = node.props?.children;
    (Array.isArray(children) ? children : [children]).forEach((child) => collect(child, predicate, found));
    return found;
  };
  assert.equal(guide.type, "section");
  assert.match(guide.props["aria-label"], /ทฤษฎีบทพีทาโกรัส/);
  const iframe = collect(guide, (node) => node.type === "iframe")[0];
  assert.equal(iframe.props.src, video.embedUrl);
  assert.equal(iframe.props.loading, "lazy");
  const links = collect(guide, (node) => node.type === "a");
  assert.equal(links.length, 2);
  assert.ok(links.every((link) => link.props.target === "_blank" && link.props.rel === "noopener noreferrer"));
  assert.equal(links[0].props.href, video.watchUrl);
  assert.equal(links[1].props.href, video.sourceUrl);
  assert.equal(qmmRenderProject14Guide(runtime, "missing-chapter", {}), null);
});

test("every curriculum chapter has a verified Project14 source and its own video mapping", async () => {
  const bundle = await readBundle();
  const chapterIds = [
    ...bundle.matchAll(/zs\(`([^`]+)`\s*,/g),
    ...bundle.matchAll(/Bs\(`(upper-[^`]+)`\s*,/g),
  ].map(([, id]) => id);
  const videoChapterIds = Object.keys(qmmProject14Videos);
  assert.equal(chapterIds.length, 49);
  assert.equal(videoChapterIds.length, 49);
  assert.deepEqual([...videoChapterIds].sort(), [...chapterIds].sort());

  for (const [chapterId, video] of Object.entries(qmmProject14Videos)) {
    assert.ok(video.title, `${chapterId} should have a readable video title`);
    assert.ok(video.chapterTitle, `${chapterId} should identify its curriculum topic`);
    assert.ok(video.videoId, `${chapterId} should have a Project14 video ID`);
    const source = new URL(video.sourceUrl);
    const watch = new URL(video.watchUrl);
    assert.equal(source.protocol, "https:");
    assert.equal(source.hostname, "proj14.ipst.ac.th", `${chapterId} source should be the official IPST site`);
    assert.equal(watch.hostname, "www.youtube.com");
    assert.equal(watch.searchParams.get("v"), video.videoId);
    if (video.embedUrl) {
      const embed = new URL(video.embedUrl);
      assert.ok(["www.youtube-nocookie.com", "www.youtube.com"].includes(embed.hostname));
      assert.equal(embed.pathname, `/embed/${video.videoId}`);
    }
  }
  assert.notEqual(
    qmmProject14Videos["m3-probability"].videoId,
    qmmProject14Videos["upper-probability"].videoId,
    "upper-level probability must not reuse the unrelated M.3 video",
  );
});

test("legacy bundle patches are complete, content-aware, and idempotent", async () => {
  const patched = patchBundle(await readBundle());

  assert.equal(patchBundle(patched), patched);
  assert.match(patched, /profilePicture:``,mathInterests:\[\]/);
  assert.match(patched, /function qmmCompressProfileImage\(/);
  assert.match(patched, /function qmmToggleMathInterest\(/);
  assert.match(patched, /i\(current=>\(\{\.\.\.current,mathInterests:qmmToggleMathInterest\(current\.mathInterests,interest\)\}\)\)/);
  assert.match(patched, /className:\s*"profile-photo-editor"/);
  assert.match(patched, /function QmmMathInterestSelector\(/);
  assert.match(patched, /className:`profile-interest-row`/);
  assert.match(patched, /function qmmBuildTopicScores\(/);
  assert.match(patched, /lesson-formula-preview/);
  assert.match(patched, /function qmmRenderProject14Guide\(/);
  assert.match(patched, /const qmmProject14Videos=\{/);
  assert.match(patched, /QmmProject14GuideCard,\{chapterId:i\.chapterId\}/);
  assert.match(patched, /QmmProject14GuideCard,\{chapterId:e\.id\}/);
  const chapterGrid = patched.indexOf("className:`chapter-content-layout`,children:[");
  const chapterVideoCard = patched.indexOf("QmmProject14GuideCard,{chapterId:e.id}");
  assert.ok(chapterVideoCard > chapterGrid && chapterVideoCard - chapterGrid < 180, "chapter video should span the full curriculum content row");
  assert.match(patched, /QmmAssessmentTimer/);
  assert.match(patched, /qmmFormatThaiDate\(new Date\(\)\)/);
  assert.match(patched, /function qmmNormalizeProgress\(/);
  assert.match(patched, /function qmmRecordLearningActivity\(/);
  assert.match(patched, /qmmLoadProgress\(\)/);
  assert.match(patched, /qmmLoadProgress\(\)\)/);
  assert.match(patched, /qmmLoadNotifications\(\)\)/);
  assert.match(patched, /qmmCompletionPercent\(e\.completedLessons\.length,Os\.length\)/);
  assert.match(patched, /QmmProfileAchievements,\{items:profileAchievements\}/);
  assert.match(patched, /QmmProfileActivity,\{items:e\.recentActivity\}/);
  assert.match(patched, /qmmRecordLearningActivity\(\{\.\.\.t,exerciseCorrect:/);
  assert.match(patched, /qmmRecordLearningActivity\(\{\.\.\.e,completedLessons:/);
  assert.match(patched, /le=e=>m\(t=>t\.completedLessons\.includes\(e\)\?t:qmmRecordLearningActivity/);
  assert.doesNotMatch(patched, /xp:840,streak:5,exerciseCorrect:7,exerciseTotal:9/);
  assert.doesNotMatch(patched, /คุณเรียนต่อเนื่องมาแล้ว 5 วัน/);
  assert.doesNotMatch(patched, /เรียนติดต่อกันครบ 5 วัน/);
  assert.doesNotMatch(patched, /children:`68%`/);
  assert.doesNotMatch(patched, /progress:68/);
  assert.match(patched, /children: \[completed \? 100 : 0, "%"\]/);
  assert.doesNotMatch(patched, /เริ่มเรียนกับ CommuMathy เมื่อ 3 ต\.ค\. 2569/);
  assert.doesNotMatch(patched, /children:`08:24`/);
  assert.doesNotMatch(patched, /` วันจันทร์ที่ 13 ตุลาคม 2569`/);
  assert.doesNotMatch(patched, /children:`สมการเชิงเส้นตัวแปรเดียวคืออะไร\?`/);
});

test("local profile switching keeps progress/settings separate and signs out without deleting profiles", async () => {
  const patched = patchBundle(await readBundle());
  for (const marker of [
    "commumathy-local-users",
    "commumathy-active-local-user",
    "function qmmGetActiveLocalUser(",
    "function qmmSaveActiveUserSettings(",
    "function qmmSaveActiveUserProgress(",
    "function qmmSwitchLocalUser(",
    "function qmmCreateLocalUser(",
    "function qmmSignOutLocalUser(",
    "function QmmLocalUserGate(",
    "QmmLocalAccountCard,{})",
    "qmmSaveActiveUserProgress(p)",
    "qmmSaveActiveUserSettings(r)",
    "if(!qmmGetActiveLocalUser())return(0,X.jsx)(QmmLocalUserGate,{})",
  ]) {
    assert.ok(patched.includes(marker), `missing local-profile feature marker: ${marker}`);
  }
  const accountCardIndex = patched.indexOf("(0,X.jsx)(QmmLocalAccountCard,{})");
  const photoEditorIndex = patched.indexOf("(0,X.jsx)(QmmProfilePhotoEditor,{settings:r");
  assert.ok(accountCardIndex >= 0 && accountCardIndex < photoEditorIndex,
    "the switch-user card must appear before the photo editor and profile form");
  assert.ok(patched.includes("Switch user"), "the action must be explicitly labeled for users seeking a switch option");
  assert.doesNotMatch(patched, /localStorage\.clear\(/, "sign-out must not erase other local profiles");

  const html = await readFile(path.join(projectDir, "index.html"), "utf8");
  const switchStyles = await readFile(path.join(projectDir, "assets", "settings-switch-user.css"), "utf8");
  assert.ok(html.includes('href="./assets/settings-switch-user.css"'), "the prominent switch-user stylesheet must load");
  assert.match(switchStyles, /settings-local-account-card--prominent/);
  assert.match(switchStyles, /background: #bf3545 !important/);
  assert.match(switchStyles, /@media \(max-width: 640px\)/);
});
