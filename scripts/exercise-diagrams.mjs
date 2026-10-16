export function qmmRenderExerciseDiagram(runtime, question) {
  if (!question || typeof question !== "object") return null;

  const jsx = runtime.jsx;
  const jsxs = runtime.jsxs;
  const element = (type, props = {}, children) =>
    children === undefined
      ? jsx(type, props)
      : jsxs(type, { ...props, children });
  const id = String(question.chapterId ?? question.id ?? "");
  const prompt = String(question.prompt ?? "");
  const p = question.parameters && typeof question.parameters === "object" ? question.parameters : {};
  const num = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const label = (x, y, value, className = "diagram-label", anchor = "middle") =>
    element("text", { x, y, className, textAnchor: anchor, dominantBaseline: "middle" }, String(value));
  const line = (x1, y1, x2, y2, className = "diagram-stroke") =>
    element("line", { x1, y1, x2, y2, className });
  const path = (d, className = "diagram-stroke") => element("path", { d, className });
  const circle = (cx, cy, r, className = "diagram-stroke") => element("circle", { cx, cy, r, className });
  const polygon = (points, className = "diagram-stroke") =>
    element("polygon", { points: points.map(([x, y]) => `${x},${y}`).join(" "), className });
  const figure = (ariaLabel, children) => element(
    "div",
    { className: "qb-exercise-figure", role: "img", "aria-label": ariaLabel },
    element("svg", { viewBox: "0 0 360 210", "aria-hidden": "true", focusable: "false" }, [
      element("defs", {}, element("marker", { id: "qmm-arrowhead", markerWidth: 8, markerHeight: 8, refX: 7, refY: 4, orient: "auto", markerUnits: "strokeWidth" }, element("path", { d: "M0 0 L8 4 L0 8 z", className: "diagram-arrow" }))),
      ...children,
    ]),
  );
  const coordinatePlane = (points, ariaLabel, extra = [], segments = []) => {
    const extent = Math.max(6, ...points.flatMap((point) => [Math.abs(num(point.x)), Math.abs(num(point.y))]));
    const scaleX = Math.min(12, 132 / extent), scaleY = Math.min(9, 76 / extent);
    const mapX = (x) => 180 + num(x) * scaleX;
    const mapY = (y) => 105 - num(y) * scaleY;
    const grid = [];
    for (let x = -10; x <= 10; x += 5) grid.push(line(mapX(x), 20, mapX(x), 190, x === 0 ? "diagram-axis" : "diagram-grid"));
    for (let y = -10; y <= 10; y += 5) grid.push(line(45, mapY(y), 315, mapY(y), y === 0 ? "diagram-axis" : "diagram-grid"));
    grid.push(label(322, mapY(0), "x", "diagram-axis-label", "start"));
    grid.push(label(mapX(0), 14, "y", "diagram-axis-label"));
    for (const point of points) {
      const x = mapX(point.x), y = mapY(point.y);
      grid.push(circle(x, y, 5, point.className ?? "diagram-point"));
      grid.push(label(x + (point.labelDx ?? 0), y + (point.labelDy ?? -14), `${point.name}(${point.x}, ${point.y})`, "diagram-point-label"));
    }
    for (const [x1, y1, x2, y2, className] of segments) grid.push(line(mapX(x1), mapY(y1), mapX(x2), mapY(y2), className));
    return figure(ariaLabel, [...grid, ...extra]);
  };

  if (id === "m1-geometric-construction") {
    if (p.construction === "equilateral-triangle") {
      return figure("รูปสามเหลี่ยมด้านเท่าสำหรับการสร้างมุม 60 องศา", [
        polygon([[180, 35], [75, 175], [285, 175]], "diagram-shape diagram-blue"),
        label(180, 68, "60°", "diagram-accent-label"),
        label(115, 164, "ด้านเท่ากัน", "diagram-small-label"),
        label(245, 164, "ด้านเท่ากัน", "diagram-small-label"),
      ]);
    }
    if (p.construction === "perpendicular-bisector") {
      return figure("เส้นแบ่งครึ่งตั้งฉากและจุดที่อยู่ห่างจากปลายทั้งสองเท่ากัน", [
        line(85, 145, 275, 145), line(180, 48, 180, 184, "diagram-blue"),
        line(180, 48, 230, 95, "diagram-dash"), circle(180, 95, 5, "diagram-point-accent"),
        circle(85, 145, 4, "diagram-point"), circle(275, 145, 4, "diagram-point"),
        label(85, 168, "A"), label(275, 168, "B"), label(180, 74, "P", "diagram-accent-label"),
        label(129, 124, "PA"), label(231, 124, "PB"),
      ]);
    }
    const angle = num(p.angle, 60);
    return figure(`มุม ${angle} องศาที่ถูกแบ่งครึ่ง`, [
      line(70, 165, 292, 165), line(90, 165, 215, 55), line(90, 165, 215, 110, "diagram-blue"),
      path("M128 165 A38 38 0 0 0 118 140", "diagram-accent"),
      label(146, 139, `${angle}°`, "diagram-accent-label"),
      label(193, 116, `${angle / 2}°`, "diagram-small-label"), label(193, 147, `${angle / 2}°`, "diagram-small-label"),
    ]);
  }

  if (id === "m1-2d-3d-figures") {
    if (p.figure === "square") return figure("รูปสี่เหลี่ยมจัตุรัสที่มีด้านเท่ากันและมุมฉาก", [
      element("rect", { x: 110, y: 35, width: 140, height: 140, className: "diagram-shape diagram-blue" }),
      label(180, 28, "ด้านเท่ากัน 4 ด้าน", "diagram-accent-label"), label(180, 190, "มุมทั้งสี่ = 90°", "diagram-small-label"),
    ]);
    if (p.solid === "cylinder") return figure("รูปทรงกระบอกที่มีฐานวงกลมสองฐานและผิวข้าง", [
      element("ellipse", { cx: 180, cy: 58, rx: 78, ry: 24, className: "diagram-shape diagram-blue" }),
      line(102, 58, 102, 151), line(258, 58, 258, 151),
      element("path", { d: "M102 151 A78 24 0 0 0 258 151", className: "diagram-stroke" }),
      element("path", { d: "M102 151 A78 24 0 0 1 258 151", className: "diagram-dash" }),
      label(180, 106, "ผิวข้าง 1 ผิว", "diagram-accent-label"),
      label(180, 34, "ฐานวงกลม", "diagram-small-label"), label(180, 184, "ฐานวงกลม", "diagram-small-label"),
    ]);
    if (p.solid === "triangular-prism") return figure("รูปปริซึมฐานสามเหลี่ยม", [
      polygon([[85, 150], [130, 65], [175, 150]], "diagram-shape diagram-blue"),
      polygon([[175, 150], [220, 65], [265, 150]], "diagram-shape diagram-muted"),
      line(85, 150, 175, 150, "diagram-blue"), line(130, 65, 220, 65, "diagram-blue"), line(175, 150, 265, 150, "diagram-blue"),
      label(180, 185, "ฐานสามเหลี่ยม 2 หน้า + ผิวข้าง 3 หน้า", "diagram-small-label"),
    ]);
    return figure("รูปทรงสี่เหลี่ยมมุมฉาก", [
      polygon([[80, 75], [220, 75], [220, 165], [80, 165]], "diagram-shape diagram-blue"),
      polygon([[125, 40], [265, 40], [265, 130], [220, 165], [220, 75]], "diagram-shape diagram-muted"),
      line(80, 75, 125, 40, "diagram-blue"), line(220, 165, 265, 130, "diagram-blue"), line(80, 165, 125, 130, "diagram-dash"),
      label(180, 190, "มีจุดยอด 8 จุด", "diagram-small-label"),
    ]);
  }

  if (id === "m2-pythagorean" || id === "m3-trig-ratios") {
    if (id === "m2-pythagorean" && prompt.includes("จุด A(")) {
      const dx = num(p.dx, 3), dy = num(p.dy, 4);
      return coordinatePlane([{ x: 0, y: 0, name: "A", labelDx: 32, labelDy: 14 }, { x: dx, y: dy, name: "B" }], "ระนาบพิกัดแสดงจุด A และ B พร้อมสามเหลี่ยมมุมฉากสำหรับหาระยะ", [
      ], [[0, 0, dx, 0, "diagram-dash"], [dx, 0, dx, dy, "diagram-dash"], [0, 0, dx, dy, "diagram-blue"]]);
    }
    const a = num(p.a ?? p.opposite ?? p.base, 3);
    const c = num(p.c ?? p.hypotenuse, Math.hypot(a, num(p.b ?? p.adjacent, 4)));
    const b = num(p.b ?? p.adjacent, Math.sqrt(Math.max(0, c * c - a * a)));
    const specialAngle = id === "m3-trig-ratios" ? num(p.angle) : 0;
    const specialSides = specialAngle === 30 ? ["1", "√3", "2"] : specialAngle === 45 ? ["1", "1", "√2"] : specialAngle === 60 ? ["√3", "1", "2"] : null;
    const opposite = num(p.opposite, a), adjacent = num(p.adjacent, b), hypotenuse = num(p.hypotenuse, c);
    const vertical = specialAngle ? 120 : 140 * a / Math.max(a, b);
    const horizontal = specialAngle ? 120 / Math.tan(specialAngle * Math.PI / 180) : 190 * b / Math.max(a, b);
    const sideLabels = specialSides ?? [String(opposite), String(adjacent), String(hypotenuse)];
    return figure("สามเหลี่ยมมุมฉากพร้อมป้ายกำกับความยาวด้าน", [
      polygon([[75, 165], [75, 165 - vertical], [75 + horizontal, 165]], "diagram-shape diagram-blue"),
      element("rect", { x: 75, y: 145, width: 20, height: 20, className: "diagram-right-angle" }),
      label(57, 105, id === "m3-trig-ratios" ? `ข้าม ${sideLabels[0]}` : `a = ${a}`, "diagram-accent-label", "end"),
      label(75 + horizontal / 2, 183, id === "m3-trig-ratios" ? `ชิด ${sideLabels[1]}` : `b = ${b}`, "diagram-accent-label"),
      label(75 + horizontal / 2 - 8, 165 - vertical / 2, id === "m3-trig-ratios" ? `ฉาก ${sideLabels[2]}` : `c = ${c}`, "diagram-accent-label"),
      label(97, 153, "90°", "diagram-small-label", "start"),
      ...(specialAngle ? [label(75 + horizontal - 12, 150, `θ=${specialAngle}°`, "diagram-accent-label", "end")] : []),
    ]);
  }

  if (id === "m1-geometry" || id === "m2-geometric-reasoning") {
    if (Number.isFinite(Number(p.length)) && Number.isFinite(Number(p.width))) {
      return figure("รูปสี่เหลี่ยมผืนผ้าพร้อมป้ายกำกับความยาวและความกว้าง", [
        element("rect", { x: 78, y: 48, width: 205, height: 110, className: "diagram-shape diagram-blue" }),
        label(180, 35, `ยาว ${p.length} ซม.`, "diagram-accent-label"), label(302, 103, `กว้าง ${p.width} ซม.`, "diagram-accent-label", "start"),
      ]);
    }
    const a = num(p.a, 55), b = num(p.b, 65);
    return figure("รูปสามเหลี่ยมแสดงมุมภายในและมุมภายนอก", [
      polygon([[75, 160], [180, 45], [285, 160]], "diagram-shape diagram-blue"),
      line(180, 45, 315, 160, "diagram-dash"),
      label(116, 145, `${a}°`, "diagram-accent-label"), label(244, 145, `${b}°`, "diagram-accent-label"),
      label(180, 78, "?", "diagram-accent-label"), label(318, 160, "มุมภายนอก", "diagram-small-label", "end"),
    ]);
  }

  if (id === "m2-prisms-cylinders" || id === "m3-pyramids-cones-spheres") {
    if (id === "m2-prisms-cylinders") {
      if (Number.isFinite(Number(p.base))) return figure("ปริซึมฐานสามเหลี่ยมพร้อมระบุความยาวฐานและความสูง", [
        polygon([[72, 150], [122, 60], [172, 150]], "diagram-shape diagram-blue"),
        polygon([[182, 150], [232, 60], [282, 150]], "diagram-shape diagram-muted"),
        line(72, 150, 182, 150, "diagram-blue"), line(122, 60, 232, 60, "diagram-blue"), line(172, 150, 282, 150, "diagram-blue"),
        label(122, 174, `ฐาน ${p.base}`, "diagram-small-label"), label(300, 106, `ยาว ${p.length}`, "diagram-small-label", "start"),
      ]);
      if (Number.isFinite(Number(p.l))) return figure("ปริซึมสี่เหลี่ยมมุมฉากพร้อมระบุความยาว ความกว้าง และความสูง", [
        polygon([[78, 78], [222, 78], [222, 162], [78, 162]], "diagram-shape diagram-blue"),
        polygon([[122, 42], [266, 42], [266, 126], [222, 162], [222, 78]], "diagram-shape diagram-muted"),
        line(78, 78, 122, 42, "diagram-blue"), line(78, 162, 122, 126, "diagram-dash"), line(122, 126, 266, 126, "diagram-dash"),
        label(150, 182, `ยาว ${p.l}`, "diagram-small-label"), label(68, 116, `กว้าง ${p.w}`, "diagram-small-label", "end"), label(240, 95, `สูง ${p.h}`, "diagram-small-label", "start"),
      ]);
      const r = num(p.r, 4), h = num(p.h, 5);
      return figure(`ทรงกระบอกรัศมี ${r} และสูง ${h}`, [
        element("ellipse", { cx: 180, cy: 55, rx: 78, ry: 24, className: "diagram-shape diagram-blue" }),
        line(102, 55, 102, 153), line(258, 55, 258, 153),
        element("path", { d: "M102 153 A78 24 0 0 0 258 153", className: "diagram-stroke" }),
        element("path", { d: "M102 153 A78 24 0 0 1 258 153", className: "diagram-dash" }),
        line(180, 55, 250, 55, "diagram-accent"), label(218, 43, `r=${r}`, "diagram-accent-label"),
        label(273, 105, `h=${h}`, "diagram-accent-label", "start"),
      ]);
    }
    if (Number.isFinite(Number(p.baseArea))) return figure(`พีระมิดมีพื้นที่ฐาน ${p.baseArea} และความสูง ${p.h}`, [
      polygon([[90, 145], [180, 178], [270, 145], [180, 115]], "diagram-shape diagram-blue"),
      line(180, 42, 90, 145), line(180, 42, 180, 178, "diagram-blue"), line(180, 42, 270, 145), line(180, 42, 180, 115, "diagram-dash"),
      line(180, 42, 180, 128, "diagram-accent"), label(198, 82, `สูง ${p.h}`, "diagram-accent-label", "start"),
      label(180, 164, `พื้นที่ฐาน ${p.baseArea}`, "diagram-small-label"),
    ]);
    if (p.relationship === "cone-to-cylinder") return figure("กรวยและทรงกระบอกที่มีพื้นที่ฐานและความสูงเท่ากัน", [
      element("ellipse", { cx: 105, cy: 65, rx: 50, ry: 16, className: "diagram-shape diagram-blue" }), line(55, 65, 55, 151), line(155, 65, 155, 151),
      element("path", { d: "M55 151 A50 16 0 0 0 155 151", className: "diagram-stroke" }),
      line(245, 42, 195, 151), line(245, 42, 295, 151), element("path", { d: "M195 151 A50 16 0 0 0 295 151", className: "diagram-stroke" }),
      label(105, 183, "ทรงกระบอก", "diagram-small-label"), label(245, 183, "กรวย = ⅓", "diagram-accent-label"),
    ]);
    if (prompt.includes("กรวย")) {
      const r = num(p.r, 3), h = num(p.h, 4);
      return figure(`กรวยรัศมี ${r} และสูง ${h}`, [
        line(180, 35, 99, 158), line(180, 35, 261, 158),
        element("path", { d: "M99 158 A81 24 0 0 0 261 158", className: "diagram-stroke" }),
        element("path", { d: "M99 158 A81 24 0 0 1 261 158", className: "diagram-dash" }),
        line(180, 35, 180, 158, "diagram-dash"), line(180, 158, 240, 158, "diagram-accent"),
        label(206, 146, `r=${r}`, "diagram-accent-label"), label(191, 98, `h=${h}`, "diagram-small-label", "start"),
      ]);
    }
    if (prompt.includes("ทรงกลม")) return figure(`ทรงกลมรัศมี ${p.r}`, [
      circle(180, 105, 68, "diagram-shape diagram-blue"),
      element("ellipse", { cx: 180, cy: 105, rx: 68, ry: 22, className: "diagram-dash" }),
      element("path", { d: "M180 105 L236 67", className: "diagram-accent" }),
      label(219, 73, `r=${p.r}`, "diagram-accent-label"),
    ]);
    return figure("กรวยและทรงกระบอกที่มีพื้นที่ฐานและความสูงเท่ากัน", [
      element("ellipse", { cx: 105, cy: 65, rx: 50, ry: 16, className: "diagram-shape diagram-blue" }), line(55, 65, 55, 151), line(155, 65, 155, 151),
      element("path", { d: "M55 151 A50 16 0 0 0 155 151", className: "diagram-stroke" }),
      line(245, 42, 195, 151), line(245, 42, 295, 151), element("path", { d: "M195 151 A50 16 0 0 0 295 151", className: "diagram-stroke" }),
      label(105, 183, "ทรงกระบอก", "diagram-small-label"), label(245, 183, "กรวย = ⅓", "diagram-accent-label"),
    ]);
  }

  if (id === "m2-transformations") {
    const x = num(p.x), y = num(p.y);
    let tx = x, ty = y;
    if (p.axis === "x") ty = -y;
    else if (p.axis === "y") tx = -x;
    else if (Number.isFinite(Number(p.dx))) { tx = x + num(p.dx); ty = y + num(p.dy); }
    else if (Number.isFinite(Number(p.angle))) { tx = -y; ty = x; }
    return coordinatePlane([
      { x, y, name: "P", className: "diagram-point" },
      { x: tx, y: ty, name: "P′", className: "diagram-point-accent", labelDy: 18 },
    ], "ระนาบพิกัดแสดงจุดเดิมและจุดหลังการแปลง", [], [[x, y, tx, ty, "diagram-accent diagram-dash"]]);
  }

  if (id === "m2-congruence" || id === "m3-similarity") {
    const scale = num(p.scale, 2);
    const congruent = id === "m2-congruence";
    const left = [[68, 150], [118, 55], [168, 150]];
    const factor = congruent ? 1 : Math.max(1, Math.min(1.5, scale / 3));
    const right = [[205, 150], [205 + 50 * factor, 150 - 95 * factor], [205 + 100 * factor, 150]];
    const labels = congruent ? `เกณฑ์ ${p.criterion ?? "SSS"}` : `อัตราส่วน ${scale}:1`;
    return figure(congruent ? "แผนภาพเปรียบเทียบสามเหลี่ยมสองรูปเพื่อพิจารณาความเท่ากันทุกประการ" : "แผนภาพสามเหลี่ยมคล้ายที่มีสเกลต่างกัน", [
      polygon(left, "diagram-shape diagram-blue"), polygon(right, "diagram-shape diagram-accent"),
      line(78, 128, 88, 128, "diagram-mark"), line(218, 128, 228, 128, "diagram-mark"),
      line(98, 91, 106, 96, "diagram-mark"), line(238, 90, 246, 95, "diagram-mark"),
      label(180, 185, labels, "diagram-accent-label"),
    ]);
  }

  if (id === "m2-parallel-lines") {
    const angle = num(p.angle, 60);
    return figure(`เส้นขนานถูกตัดด้วยเส้นตัด และมุมที่กำหนดคือ ${angle} องศา`, [
      line(54, 58, 306, 58), line(54, 152, 306, 152),
      line(105, 190, 255, 20, "diagram-blue"),
      path("M171 58 A22 22 0 0 1 188 74", "diagram-accent"),
      path("M204 152 A22 22 0 0 0 220 136", "diagram-accent"),
      label(206, 43, `${angle}°`, "diagram-accent-label"), label(243, 138, "?", "diagram-accent-label"),
      path("M76 58 l10 -6 l0 12 z", "diagram-arrow"), path("M76 152 l10 -6 l0 12 z", "diagram-arrow"),
      label(180, 190, "เส้นขนานสองเส้น + เส้นตัด", "diagram-small-label"),
    ]);
  }

  if (id === "m3-circles") {
    const r = num(p.r, 5);
    const angle = num(p.angle, 0);
    if (angle > 0) {
      const radians = -angle * Math.PI / 180;
      const x = 180 + 68 * Math.cos(radians), y = 105 + 68 * Math.sin(radians);
      const large = angle > 180 ? 1 : 0;
      return figure(`วงกลมแสดงภาควงกลมมุม ${angle} องศา`, [
        circle(180, 105, 68, "diagram-shape diagram-blue"),
        line(180, 105, 248, 105, "diagram-accent"), line(180, 105, x, y, "diagram-accent"),
        path(`M248 105 A68 68 0 ${large} 0 ${x} ${y} L180 105 Z`, "diagram-sector"), circle(180, 105, 4, "diagram-point"),
        label(218, 88, `${angle}°`, "diagram-accent-label"), label(212, 120, "r", "diagram-small-label"),
      ]);
    }
    const diameter = num(p.diameter, 0);
    return figure(diameter ? `วงกลมแสดงเส้นผ่านศูนย์กลาง ${diameter} เซนติเมตร` : `วงกลมแสดงรัศมี ${r} เซนติเมตร`, [
      circle(180, 105, 68, "diagram-shape diagram-blue"), circle(180, 105, 4, "diagram-point"),
      line(diameter ? 112 : 180, 105, 248, 105, "diagram-accent"),
      label(diameter ? 180 : 215, 91, diameter ? `d=${diameter}` : `r=${r}`, "diagram-accent-label"),
      label(180, 190, diameter ? "รัศมี = ครึ่งหนึ่งของเส้นผ่านศูนย์กลาง" : "เส้นรอบวงและพื้นที่ขึ้นกับรัศมี", "diagram-small-label"),
    ]);
  }

  if (id === "upper-analytic-geometry") {
    const x1 = num(p.x1), y1 = num(p.y1), x2 = num(p.x2, x1 + num(p.dx, 3)), y2 = num(p.y2, y1 + num(p.dy, 4));
    return coordinatePlane([
      { x: x1, y: y1, name: "A", className: "diagram-point" },
      { x: x2, y: y2, name: "B", className: "diagram-point-accent" },
    ], "ระนาบพิกัดแสดงจุด A และ B กับส่วนของเส้นตรงที่เชื่อมจุด", [
    ], [[x1, y1, x2, y2, "diagram-blue"], [x1, y1, x2, y1, "diagram-dash"], [x2, y1, x2, y2, "diagram-dash"]]);
  }

  if (id === "m1-graphs-linear" || id === "m3-quadratic-graphs") {
    let f;
    let domain = [-4, 4];
    if (id === "m1-graphs-linear") {
      let a = num(p.a, num(p.step, 1)), b = num(p.b, num(p.start, 0));
      if (Number.isFinite(Number(p.x1)) && Number.isFinite(Number(p.x2))) {
        const dx = num(p.x2) - num(p.x1), dy = num(p.y2) - num(p.y1);
        a = dx === 0 ? 0 : dy / dx;
        b = num(p.y1) - a * num(p.x1);
      }
      f = (x) => a * x + b;
    } else if (Number.isFinite(Number(p.r1)) && Number.isFinite(Number(p.r2))) {
      f = (x) => (x - num(p.r1)) * (x - num(p.r2));
      domain = [Math.min(num(p.r1), num(p.r2)) - 3, Math.max(num(p.r1), num(p.r2)) + 3];
    } else {
      const a = num(p.a ?? p.coefficient, 1), b = num(p.b), c = num(p.c);
      if (Number.isFinite(Number(p.h)) && !Number.isFinite(Number(p.c))) {
        domain = [num(p.h) - 4, num(p.h) + 4];
        f = (x) => a * (x - num(p.h)) ** 2;
      } else f = (x) => a * x * x + b * x + c;
    }
    const [minX, maxX] = domain;
    const points = Array.from({ length: 33 }, (_, index) => {
      const x = minX + (maxX - minX) * index / 32;
      return [x, f(x)];
    });
    const ys = points.map((point) => point[1]).filter(Number.isFinite);
    let minY = Math.min(0, ...ys), maxY = Math.max(0, ...ys);
    if (maxY - minY < 1) { minY -= 1; maxY += 1; }
    const padding = (maxY - minY) * 0.1;
    minY -= padding; maxY += padding;
    const mapX = (x) => 40 + (x - minX) / (maxX - minX) * 280;
    const mapY = (y) => 178 - (y - minY) / (maxY - minY) * 150;
    const graphPath = points.map(([x, y], index) => `${index ? "L" : "M"}${mapX(x).toFixed(1)} ${mapY(y).toFixed(1)}`).join(" ");
    const yAxis = minX <= 0 && maxX >= 0 ? mapX(0) : 40;
    const xAxis = minY <= 0 && maxY >= 0 ? mapY(0) : 178;
    return figure(id === "m1-graphs-linear" ? "กราฟเส้นตรงของฟังก์ชันเชิงเส้น" : "กราฟพาราโบลาของฟังก์ชันกำลังสอง", [
      line(40, 28, 40, 180, "diagram-grid"), line(320, 28, 320, 180, "diagram-grid"),
      line(yAxis, 28, yAxis, 180, "diagram-axis"), line(40, xAxis, 320, xAxis, "diagram-axis"),
      path(graphPath, "diagram-curve"), label(327, xAxis, "x", "diagram-axis-label", "start"), label(yAxis, 20, "y", "diagram-axis-label"),
      label(180, 198, id === "m1-graphs-linear" ? "กราฟเส้นตรง" : "กราฟพาราโบลา", "diagram-small-label"),
    ]);
  }

  if (id === "upper-vectors") {
    const vector = Array.isArray(p.vector) ? p.vector : Array.isArray(p.u) ? p.u : [3, 2];
    const x = num(vector[0]), y = num(vector[1]);
    return coordinatePlane([{ x: 0, y: 0, name: "O", labelDx: -14, labelDy: 16 }, { x, y, name: "v", className: "diagram-point-accent" }], "ระนาบพิกัดแสดงเวกเตอร์จากจุดกำเนิด", [], [
      [0, 0, x, y, "diagram-vector"],
      ...(Array.isArray(p.v) ? [[0, 0, num(p.v[0]), num(p.v[1]), "diagram-blue diagram-dash"]] : []),
    ]);
  }

  return null;
}
