export function qmmExerciseGeneratorType(chapterId) {
  const chapterRoutes = {
    "m1-integers": "integers",
    "m1-geometric-construction": "construction",
    "m1-exponents": "exponents",
    "m1-decimals-fractions": "fractions",
    "m1-2d-3d-figures": "geometry",
    "m1-linear-equation": "algebra",
    "m1-ratio-proportion-percent": "ratio",
    "m1-graphs-linear": "function",
    "m1-statistics-1": "statistics",
    "m2-pythagorean": "pythagorean",
    "m2-real-numbers-intro": "numbers",
    "m2-prisms-cylinders": "solids",
    "m2-transformations": "transformations",
    "m2-exponent-properties": "exponents",
    "m2-polynomials": "polynomial",
    "m2-statistics-2": "statistics",
    "m2-congruence": "congruence",
    "m2-parallel-lines": "parallel-lines",
    "m2-geometric-reasoning": "geometry-reasoning",
    "m2-quadratic-factoring": "factoring",
    "m3-linear-inequality": "inequality",
    "m3-higher-degree-factoring": "factoring",
    "m3-quadratic-equation": "quadratic",
    "m3-similarity": "similarity",
    "m3-quadratic-graphs": "quadratic-function",
    "m3-statistics-3": "statistics",
    "m3-linear-systems": "systems",
    "m3-circles": "circles",
    "m3-pyramids-cones-spheres": "solids",
    "m3-probability": "probability",
    "m3-trig-ratios": "trigonometry",
    "upper-sets": "sets",
    "upper-logic": "logic",
    "upper-real-numbers": "numbers",
    "upper-relations-functions": "function",
    "upper-exponential-log": "exponential-log",
    "upper-analytic-geometry": "analytic-geometry",
    "upper-trig-functions": "trig-functions",
    "upper-matrices": "matrices",
    "upper-vectors": "vectors",
    "upper-complex": "complex",
    "upper-counting": "counting",
    "upper-probability": "probability",
    "upper-sequences-series": "sequence",
    "upper-calculus": "calculus",
    "upper-statistics-meaning": "statistics",
    "upper-qualitative-data": "qualitative-data",
    "upper-quantitative-data": "quantitative-data",
    "upper-random-variables": "random-variable",
  };
  return chapterRoutes[String(chapterId ?? "").toLowerCase()] ?? "mixed-review";
}

export function qmmGenerateVariedExercise(chapter, index, seed, generatorType, selectedSubtopic) {
  const id = String(chapter?.id ?? "unknown-chapter");
  const type = generatorType || qmmExerciseGeneratorType(id);
  const subtopics = Array.isArray(chapter?.subtopics) ? chapter.subtopics : [];
  const topic = String(selectedSubtopic || subtopics[index % Math.max(1, subtopics.length)] || chapter?.title || id);
  const position = Math.max(0, Number(index) || 0);
  let state = 2166136261;
  for (const char of `${id}:${position}`) state = Math.imul(state ^ char.charCodeAt(0), 16777619) >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const int = (min, max) => Math.floor(random() * (max - min + 1)) + min;
  const choose = (items) => items[Math.floor(random() * items.length)];
  const gcd = (a, b) => {
    a = Math.abs(a); b = Math.abs(b);
    while (b) [a, b] = [b, a % b];
    return a || 1;
  };
  const fraction = (numerator, denominator) => {
    const sign = denominator < 0 ? -1 : 1;
    const d = Math.abs(denominator) || 1;
    const n = numerator * sign;
    const factor = gcd(n, d);
    const reducedN = n / factor;
    const reducedD = d / factor;
    return reducedD === 1 ? String(reducedN) : `${reducedN}/${reducedD}`;
  };
  const signed = (value) => value < 0 ? `− ${Math.abs(value)}` : `+ ${value}`;
  const answer = (prompt, correct, distractors, hint, working, parameters = {}) => {
    const correctText = String(correct);
    const options = [];
    for (const value of [correctText, ...distractors.map(String)]) {
      if (value && !options.includes(value)) options.push(value);
    }
    let fallback = 1;
    while (options.length < 4) {
      const fractionMatch = correctText.match(/^(-?\d+)\/(\d+)$/);
      const numericMatch = correctText.match(/-?\d+(?:\.\d+)?/);
      const candidate = fractionMatch
        ? `${Number(fractionMatch[1]) + fallback}/${fractionMatch[2]}`
        : numericMatch
          ? correctText.replace(numericMatch[0], String(Number(numericMatch[0]) + fallback))
          : `ข้อมูลไม่เพียงพอ (${fallback})`;
      if (!options.includes(candidate)) options.push(candidate);
      fallback += 1;
    }
    const choices = options.slice(0, 4);
    for (let i = choices.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    return {
      prompt,
      choices,
      correctChoice: choices.indexOf(correctText),
      correctAnswer: correctText,
      hint: String(hint),
      solution: `${working} ดังนั้นคำตอบคือ ${correctText}`,
      parameters,
    };
  };
  const variant = position % 4;

  switch (type) {
    case "integers": {
      const a = int(8, 32), b = int(3, 18), c = int(2, 9);
      if (variant === 0) {
        const value = a - b;
        return answer(`จงหาผลลัพธ์ของ ${a} + (−${b})`, value, [a + b, b - a, -(a + b)], "การบวกจำนวนลบเทียบได้กับการลบค่าสัมบูรณ์", `${a} + (−${b}) = ${value}`, { a, b });
      }
      if (variant === 1) {
        const value = -a * b;
        return answer(`จงหาผลคูณของ (−${a}) × ${b}`, value, [a * b, -(a + b), a - b], "จำนวนลบคูณจำนวนบวกได้ผลลัพธ์เป็นจำนวนลบ", `(−${a}) × ${b} = ${value}`, { a, b });
      }
      if (variant === 2) {
        const divisor = int(2, 8), quotient = int(3, 12), dividend = divisor * quotient;
        return answer(`จงหาค่า |−${dividend}| ÷ ${divisor}`, quotient, [dividend, -quotient, quotient + divisor], `ค่าสัมบูรณ์ของจำนวนลบเป็นจำนวนบวก`, `|−${dividend}| = ${dividend} และ ${dividend} ÷ ${divisor} = ${quotient}`, { dividend, divisor });
      }
      const value = b - a;
      return answer(`จงหาผลลัพธ์ของ ${b} − ${a}`, value, [a - b, a + b, -(a + b)], "เมื่อลบจำนวนที่มากกว่า ผลต่างจะติดลบ", `${b} − ${a} = ${value}`, { a, b });
    }
    case "fractions": {
      if (variant === 0) {
        const d = int(4, 12), a = int(1, d - 2), b = int(1, d - a);
        const value = fraction(a + b, d);
        return answer(`จงหาผลบวก ${a}/${d} + ${b}/${d} และตอบเป็นเศษส่วนอย่างต่ำ`, value, [fraction(a + b, d + 1), fraction(a + b + 1, d), fraction(Math.abs(a - b), d)], "ตัวส่วนเท่ากัน จึงบวกเฉพาะตัวเศษแล้วทอนเศษส่วน", `${a}/${d} + ${b}/${d} = ${a + b}/${d} = ${value}`, { a, b, denominator: d });
      }
      if (variant === 1) {
        const a = int(1, 5), b = int(a + 1, 9), c = int(1, 5), d = int(c + 1, 9);
        const value = fraction(a * c, b * d);
        return answer(`จงคำนวณ ${a}/${b} × ${c}/${d}`, value, [fraction(a + c, b + d), fraction(a * d, b * c), fraction(a * c + 1, b * d)], "คูณตัวเศษกับตัวเศษ และตัวส่วนกับตัวส่วน", `(${a} × ${c})/(${b} × ${d}) = ${a * c}/${b * d} = ${value}`, { a, b, c, d });
      }
      if (variant === 2) {
        const a = int(1, 5), b = int(a + 1, 8), c = int(1, 4), d = int(c + 2, 9);
        const value = fraction(a * d, b * c);
        return answer(`จงคำนวณ ${a}/${b} ÷ ${c}/${d}`, value, [fraction(a * c, b * d), fraction(a * b, c * d), fraction(a * d + 1, b * c)], "การหารเศษส่วนให้คูณด้วยส่วนกลับของเศษส่วนตัวหลัง", `${a}/${b} × ${d}/${c} = ${a * d}/${b * c} = ${value}`, { a, b, c, d });
      }
      const leftTenths = int(11, 69), rightHundredths = int(1, 99);
      const left = (leftTenths / 10).toFixed(1), right = (rightHundredths / 100).toFixed(2);
      const value = Number((leftTenths / 10 + rightHundredths / 100).toFixed(2));
      return answer(`จงหาผลบวก ${left} + ${right}`, value, [Number((value + 0.1).toFixed(2)), Number((value - 0.1).toFixed(2)), Number((leftTenths / 10 - rightHundredths / 100).toFixed(2))], "จัดตำแหน่งทศนิยมให้ตรงกัน แล้วบวกทีละหลัก", `${left} + ${right} = ${value}`, { left, right });
    }
    case "ratio": {
      if (variant === 0) {
        const a = int(2, 5), b = int(3, 7), scale = int(2, 6);
        return answer(`อัตราส่วนแป้งต่อน้ำเป็น ${a}:${b} ถ้าใช้แป้ง ${a * scale} ถ้วย ต้องใช้น้ำกี่ถ้วยเพื่อคงอัตราส่วนเดิม?`, b * scale, [b + scale, a * scale, b * (scale - 1)], `หาตัวคูณที่เปลี่ยนจาก ${a} เป็น ${a * scale} แล้วคูณทั้งสองส่วนด้วยตัวคูณเดียวกัน`, `${a * scale} ÷ ${a} = ${scale}; ดังนั้นน้ำ ${b} × ${scale} = ${b * scale} ถ้วย`, { a, b, scale });
      }
      if (variant === 1) {
        const percent = choose([10, 20, 25, 30, 40, 50]), base = int(4, 20) * 20;
        const value = base * percent / 100;
        return answer(`${percent}% ของ ${base} มีค่าเท่าใด?`, value, [base * percent, base / percent, base - value], `เปลี่ยน ${percent}% เป็น ${percent}/100 แล้วคูณด้วยจำนวนตั้งต้น`, `${percent}/100 × ${base} = ${value}`, { percent, base });
      }
      if (variant === 2) {
        const base = int(5, 18) * 10, percent = choose([10, 20, 25, 50]);
        const value = base + base * percent / 100;
        return answer(`สินค้าเดิมราคา ${base} บาท ปรับราคาเพิ่ม ${percent}% ราคาใหม่เป็นกี่บาท?`, value, [base * percent / 100, base - base * percent / 100, base + percent], `คำนวณส่วนที่เพิ่มก่อน แล้วบวกกับราคาเดิม`, `เพิ่ม ${percent}/100 × ${base} = ${base * percent / 100} บาท; ราคาใหม่ = ${base} + ${base * percent / 100} = ${value}`, { base, percent });
      }
      const units = int(2, 8), unitPrice = int(5, 20) * 5, total = units * unitPrice;
      return answer(`ส้ม ${units} ผล ราคา ${total} บาท ราคาเฉลี่ยต่อผลเป็นเท่าใด?`, unitPrice, [total + units, total - units, total / (units + 1)], "หารราคารวมด้วยจำนวนผลไม้", `${total} ÷ ${units} = ${unitPrice} บาทต่อผล`, { units, total });
    }
    case "algebra": {
      if (variant === 0) {
        const a = int(2, 9), x = int(-5, 12), b = int(-12, 15), c = a * x + b;
        return answer(`จงแก้สมการ ${a}x ${signed(b)} = ${c}`, x, [x + 1, x - 1, c - b], `ย้ายค่าคงที่ไปอีกข้าง แล้วหารด้วย ${a}`, `${a}x = ${c - b}; x = (${c - b}) ÷ ${a} = ${x}`, { a, b, c, x });
      }
      if (variant === 1) {
        const a = int(2, 7), x = int(1, 9), b = int(2, 8), c = a * (x + b);
        return answer(`จงหาค่า x จาก ${a}(x + ${b}) = ${c}`, x, [x + b, c / a, x - b], `หารทั้งสองข้างด้วย ${a} ก่อน แล้วจึงลบ ${b}`, `x + ${b} = ${c / a}; x = ${c / a} − ${b} = ${x}`, { a, b, c, x });
      }
      if (variant === 2) {
        const a = int(2, 8), b = int(1, 12), x = int(2, 9), c = a * x + b;
        const correct = `${a}x + ${b} = ${c}`;
        return answer(`จำนวนหนึ่งคูณด้วย ${a} แล้วบวก ${b} ได้ ${c} สมการใดแทนข้อความนี้?`, correct, [`${a}(x + ${b}) = ${c}`, `${a}x − ${b} = ${c}`, `x + ${a} + ${b} = ${c}`], "คำว่า ‘คูณด้วย’ หมายถึงคูณตัวแปรก่อน แล้วจึงบวกค่าคงที่", `แทนจำนวนที่ไม่ทราบด้วย x จะได้ ${correct}`, { a, b, x, c });
      }
      const a = int(2, 8), b = int(-10, 12), x = int(2, 9), c = a * x + b;
      const correct = b < 0 ? `บวก ${Math.abs(b)} ทั้งสองข้าง แล้วหารด้วย ${a}` : `ลบ ${b} ทั้งสองข้าง แล้วหารด้วย ${a}`;
      return answer(`เริ่มแก้สมการ ${a}x ${signed(b)} = ${c} ควรทำขั้นตอนใดก่อน?`, correct, [`หารด้วย ${a} ก่อนโดยไม่จัดการค่าคงที่`, `คูณค่าคงที่ ${b} กับ ${a}`, `เปลี่ยนเครื่องหมายเฉพาะข้างซ้าย`], "ย้อนการบวกหรือลบค่าคงที่โดยทำเหมือนกันทั้งสองข้าง", `${a}x ${signed(b)} = ${c}; ${correct} จะได้ x = ${x}`, { a, b, c, x });
    }
    case "polynomial": {
      if (variant === 0) {
        const a = int(1, 6), b = int(1, 8), c = int(1, 6), d = int(1, 8);
        const correct = `${a + c}x² + ${b + d}x`;
        return answer(`จงบวกพหุนาม (${a}x² + ${b}x) + (${c}x² + ${d}x)`, correct, [`${a + c}x⁴ + ${b + d}x²`, `${a + b + c + d}x`, `${a - c}x² + ${b - d}x`], "รวมเฉพาะพจน์ที่มีตัวแปรและเลขชี้กำลังเหมือนกัน", `${a}x² + ${c}x² = ${a + c}x² และ ${b}x + ${d}x = ${b + d}x`, { a, b, c, d });
      }
      if (variant === 1) {
        const a = int(2, 7), b = int(2, 8), c = int(1, 9), correct = `${a * b}x² + ${a * c}x`;
        return answer(`จงกระจายพจน์ ${a}x(${b}x + ${c})`, correct, [`${a + b}x² + ${c}x`, `${a * b}x + ${a * c}`, `${a * (b + c)}x²`], `คูณ ${a}x เข้าไปในแต่ละพจน์ในวงเล็บ`, `${a}x × ${b}x = ${a * b}x² และ ${a}x × ${c} = ${a * c}x`, { a, b, c });
      }
      if (variant === 2) {
        const a = int(1, 5), b = int(-5, 7), c = int(-8, 10), x = int(-3, 5), value = a * x * x + b * x + c;
        return answer(`กำหนด P(x) = ${a}x² ${signed(b)}x ${signed(c)} จงหา P(${x})`, value, [a * x + b + c, -value, value + x], `แทน x ด้วย ${x} โดยใส่วงเล็บ แล้วยกกำลังและคูณตามลำดับ`, `P(${x}) = ${a}(${x})² ${signed(b)}(${x}) ${signed(c)} = ${value}`, { a, b, c, x });
      }
      const a = int(2, 9), b = int(1, 8), c = int(2, 9), d = int(1, 8), correct = `${a + c}x ${signed(b + d)}`;
      return answer(`จงยุบพจน์ ${a}x ${signed(b)} + ${c}x ${signed(d)}`, correct, [`${a + c + b + d}x`, `${a - c}x ${signed(b - d)}`, `${a + c}x² ${signed(b + d)}`], "รวมสัมประสิทธิ์ของ x และรวมค่าคงที่แยกกัน", `(${a} + ${c})x ${signed(b + d)} = ${correct}`, { a, b, c, d });
    }
    case "factoring": {
      if (id === "m3-higher-degree-factoring") {
        const a = int(2, 8);
        if (variant === 0) return answer(`แยกตัวประกอบ x³ − ${a ** 3}`, `(x − ${a})(x² + ${a}x + ${a ** 2})`, [`(x − ${a})(x² − ${a}x + ${a ** 2})`, `(x − ${a})³`, `(x − ${a ** 2})(x + ${a})`], "ใช้ผลต่างกำลังสาม a³ − b³ = (a − b)(a² + ab + b²)", `x³ − ${a ** 3} = (x − ${a})(x² + ${a}x + ${a ** 2})`, { a, identity: "difference-of-cubes" });
        if (variant === 1) return answer(`แยกตัวประกอบ x³ + ${a ** 3}`, `(x + ${a})(x² − ${a}x + ${a ** 2})`, [`(x + ${a})(x² + ${a}x + ${a ** 2})`, `(x + ${a})³`, `(x − ${a})(x² + ${a}x + ${a ** 2})`], "ใช้ผลบวกกำลังสาม a³ + b³ = (a + b)(a² − ab + b²)", `x³ + ${a ** 3} = (x + ${a})(x² − ${a}x + ${a ** 2})`, { a, identity: "sum-of-cubes" });
        if (variant === 2) {
          const b = int(2, 8), coefficient = int(2, 7);
          return answer(`แยกตัวประกอบ ${coefficient}x³ + ${coefficient * b}x²`, `${coefficient}x²(x + ${b})`, [`${coefficient}x(x² + ${b})`, `${coefficient}x²(x − ${b})`, `x²(${coefficient}x + ${b})`], `ดึงตัวประกอบร่วมมาก ${coefficient}x² ออกก่อน`, `${coefficient}x³ + ${coefficient * b}x² = ${coefficient}x²(x + ${b})`, { b, coefficient });
        }
        const b = int(2, 8);
        return answer(`แยกตัวประกอบ x³ + ${a}x² + ${b}x + ${a * b}`, `(x + ${a})(x² + ${b})`, [`(x + ${a})(x² − ${b})`, `(x − ${a})(x² + ${b})`, `(x + ${b})(x² + ${a})`], "จัดกลุ่มเป็น x²(x + a) + b(x + a) แล้วดึงตัวประกอบร่วม", `x³ + ${a}x² + ${b}x + ${a * b} = x²(x + ${a}) + ${b}(x + ${a}) = (x + ${a})(x² + ${b})`, { a, b, method: "grouping" });
      }
      if (variant === 0) {
        const a = int(1, 6), b = int(2, 8), sum = a + b, product = a * b, correct = `(x + ${a})(x + ${b})`;
        return answer(`แยกตัวประกอบ x² + ${sum}x + ${product}`, correct, [`(x + ${sum})(x + ${product})`, `(x − ${a})(x − ${b})`, `(x + ${product})(x + 1)`], "หาจำนวนสองจำนวนที่บวกกันได้สัมประสิทธิ์ของ x และคูณกันได้พจน์คงที่", `(x + ${a})(x + ${b}) = x² + ${sum}x + ${product}`, { a, b, sum, product });
      }
      if (variant === 1) {
        const a = int(2, 5), b = int(1, 5), c = int(2, 5), d = int(1, 5);
        const first = a * c, middle = a * d + b * c, last = b * d, correct = `(${a}x + ${b})(${c}x + ${d})`;
        return answer(`แยกตัวประกอบ ${first}x² + ${middle}x + ${last}`, correct, [`(${a}x + ${d})(${c}x + ${b})`, `(${a}x + ${b + 1})(${c}x + ${d})`, `(${a}x − ${b})(${c}x − ${d})`], "หาคู่ตัวประกอบของพจน์ต้นและพจน์ท้าย แล้วตรวจว่าพจน์กลางรวมกันได้สัมประสิทธิ์ที่กำหนด", `(${a}x + ${b})(${c}x + ${d}) = ${first}x² + ${middle}x + ${last}`, { a, b, c, d });
      }
      if (variant === 2) {
        const a = int(2, 12), correct = `(x − ${a})(x + ${a})`;
        return answer(`แยกตัวประกอบ x² − ${a * a}`, correct, [`(x − ${a})²`, `(x + ${a})²`, `(x − ${a * a})(x + 1)`], "ใช้ผลต่างกำลังสอง A² − B² = (A − B)(A + B)", `x² − ${a}² = (x − ${a})(x + ${a})`, { a });
      }
      const a = int(2, 7), b = int(1, 6), sum = a + b, product = a * b, correct = `(x − ${a})(x − ${b})`;
      return answer(`จงแยกตัวประกอบ x² − ${sum}x + ${product}`, correct, [`(x + ${a})(x + ${b})`, `(x − ${sum})(x − ${product})`, `(x − ${a})(x + ${b})`], "หาจำนวนสองจำนวนที่คูณได้พจน์คงที่และบวกได้สัมประสิทธิ์ของ x", `(x − ${a})(x − ${b}) = x² − ${sum}x + ${product}`, { a, b, sum, product });
    }
    case "inequality": {
      if (variant === 0) {
        const a = int(2, 8), root = int(-6, 12), b = int(-10, 10), c = a * root + b;
        return answer(`แก้อสมการ ${a}x ${signed(b)} < ${c}`, `x < ${root}`, [`x > ${root}`, `x < ${c}`, `x ≤ ${root}`], "ทำเหมือนสมการ แต่คงเครื่องหมายอสมการไว้เมื่อหารด้วยจำนวนบวก", `${a}x < ${c - b}; หารด้วย ${a} ได้ x < ${root}`, { a, b, c, root });
      }
      if (variant === 1) {
        const a = int(2, 7), root = int(-4, 10), b = int(-8, 10), c = a * root + b;
        return answer(`แก้อสมการ ${a}x ${signed(b)} ≥ ${c}`, `x ≥ ${root}`, [`x ≤ ${root}`, `x ≥ ${c}`, `x > ${root}`], "ย้ายค่าคงที่และหารด้วยสัมประสิทธิ์บวก โดยไม่กลับเครื่องหมาย", `${a}x ≥ ${c - b}; x ≥ ${root}`, { a, b, c, root });
      }
      if (variant === 2) {
        const a = int(2, 8), root = int(-3, 9), b = int(-8, 10), c = -a * root + b;
        return answer(`แก้อสมการ −${a}x ${signed(b)} ≤ ${c}`, `x ≥ ${root}`, [`x ≤ ${root}`, `x ≥ ${-root}`, `x > ${root}`], "เมื่อหารอสมการด้วยจำนวนลบ ต้องกลับทิศเครื่องหมาย", `−${a}x ≤ ${c - b}; หารด้วย −${a} แล้วกลับเครื่องหมาย ได้ x ≥ ${root}`, { a, b, c, root });
      }
      const low = int(-5, 0), width = int(3, 8), high = low + width, offset = int(1, 6);
      return answer(`ถ้า ${low + offset} < x + ${offset} ≤ ${high + offset} ช่วงคำตอบของ x คือข้อใด?`, `${low} < x ≤ ${high}`, [`${low} ≤ x < ${high}`, `x ≤ ${low} หรือ x > ${high}`, `${low} < x < ${high}`], "ลบจำนวนเดียวกันจากทุกส่วนของอสมการ", `ลบ ${offset} ทุกส่วน จะได้ ${low} < x ≤ ${high}`, { low, high, offset });
    }
    case "quadratic": {
      const r1 = int(-7, 4), r2 = int(r1 + 1, 9), sum = r1 + r2, product = r1 * r2;
      const middle = sum >= 0 ? `− ${sum}` : `+ ${Math.abs(sum)}`;
      const correct = `{${r1}, ${r2}}`;
      return answer(`จงหาคำตอบของสมการ x² ${middle}x ${signed(product)} = 0`, correct, [`{${-r1}, ${-r2}}`, `{${r1 + 1}, ${r2 + 1}}`, `{${product}, ${sum}}`], "หาคู่จำนวนที่ผลบวกและผลคูณสอดคล้องกับสัมประสิทธิ์ แล้วตรวจราก", `(x − ${r1})(x − ${r2}) = 0 จึงได้ x = ${r1} หรือ x = ${r2}`, { r1, r2, sum, product });
    }
    case "function": {
      if (variant === 0) {
        const a = int(2, 8), b = int(-7, 10), x = int(-5, 7), y = a * x + b;
        return answer(`กำหนด f(x) = ${a}x ${signed(b)} จงหา f(${x})`, y, [a + x + b, a * (x + b), y + 1], "แทน x ด้วยค่าที่กำหนด แล้วคำนวณตามลำดับ", `f(${x}) = ${a}(${x}) ${signed(b)} = ${y}`, { a, b, x });
      }
      if (variant === 1) {
        const x1 = int(-4, 2), dx = int(2, 5), slope = int(-4, 6), y1 = int(-8, 8), x2 = x1 + dx, y2 = y1 + slope * dx;
        return answer(`เส้นตรงผ่านจุด (${x1}, ${y1}) และ (${x2}, ${y2}) มีความชันเท่าใด?`, slope, [y2 - y1, dx, -slope], "ความชัน = (ผลต่าง y) ÷ (ผลต่าง x)", `(${y2} − ${y1}) ÷ (${x2} − ${x1}) = ${slope}`, { x1, y1, x2, y2 });
      }
      if (variant === 2) {
        const a = int(1, 7), b = int(-9, 12);
        return answer(`กราฟเส้นตรง y = ${a}x ${signed(b)} ตัดแกน y ที่ค่าใด?`, b, [a, -b, a + b], "จุดตัดแกน y คือค่า y เมื่อ x = 0", `แทน x = 0 จะได้ y = ${b}`, { a, b });
      }
      const step = int(2, 5), start = int(-5, 7), x = int(2, 8), y = start + step * x;
      return answer(`ตารางของฟังก์ชันเชิงเส้นมี f(0) = ${start} และเพิ่มครั้งละ ${step} เมื่อ x เพิ่ม 1 จงหา f(${x})`, y, [start + step, start * x, y - step], "ฟังก์ชันเชิงเส้นเปลี่ยนแปลงด้วยผลต่างคงที่", `f(${x}) = ${start} + ${step}(${x}) = ${y}`, { start, step, x });
    }
    case "quadratic-function": {
      if (variant === 0) {
        const a = int(1, 4), b = int(-5, 5), c = int(-8, 8), x = int(-3, 4), value = a * x * x + b * x + c;
        return answer(`ถ้า f(x) = ${a}x² ${signed(b)}x ${signed(c)} จงหา f(${x})`, value, [a * x + b + c, value + x, -value], "แทนค่า x แล้วคำนวณเลขชี้กำลังสองก่อน", `f(${x}) = ${a}(${x})² ${signed(b)}(${x}) ${signed(c)} = ${value}`, { a, b, c, x });
      }
      if (variant === 1) {
        const a = int(1, 4), h = int(-5, 5), b = -2 * a * h;
        return answer(`พาราโบลา y = ${a}x² ${signed(b)}x + 1 มีแกนสมมาตรเป็นเส้นตรงใด?`, `x = ${h}`, [`x = ${-h}`, `y = ${h}`, `x = ${b}`], "แกนสมมาตรของ ax² + bx + c คือ x = −b/(2a)", `x = −(${b})/(2×${a}) = ${h}`, { a, b, h });
      }
      if (variant === 2) {
        const r1 = int(-5, 2), r2 = int(r1 + 1, 6), sum = r1 + r2, product = r1 * r2;
        return answer(`กราฟ y = (x − ${r1})(x − ${r2}) ตัดแกน x ที่จุดใด?`, `(${r1}, 0) และ (${r2}, 0)`, [`(0, ${product})`, `(${sum}, 0)`, `(−${r1}, 0) และ (−${r2}, 0)`], "จุดตัดแกน x เกิดเมื่อ y = 0 จึงให้แต่ละตัวประกอบเท่ากับศูนย์", `x − ${r1} = 0 หรือ x − ${r2} = 0 ได้ x = ${r1}, ${r2}`, { r1, r2, sum, product });
      }
      const a = int(1, 5), opensUp = random() > 0.5, coefficient = opensUp ? a : -a;
      return answer(`กราฟ y = ${coefficient}x² + 2x − 3 มีลักษณะหงายหรือคว่ำ?`, opensUp ? "หงาย" : "คว่ำ", [opensUp ? "คว่ำ" : "หงาย", "เป็นเส้นตรง", "เป็นวงกลม"], "พิจารณาเครื่องหมายของสัมประสิทธิ์หน้า x²", `สัมประสิทธิ์หน้า x² คือ ${coefficient} ${opensUp ? "เป็นบวก กราฟจึงหงาย" : "เป็นลบ กราฟจึงคว่ำ"}`, { coefficient });
    }
    case "statistics": {
      const base = int(8, 35), step = int(1, 5);
      if (variant === 0) {
        const values = [base - 2 * step, base - step, base, base + step, base + 2 * step];
        return answer(`ค่าเฉลี่ยของข้อมูล ${values.join(", ")} เท่ากับเท่าใด?`, base, [base - step, base + step, values.reduce((sum, value) => sum + value, 0)], "บวกข้อมูลทั้งหมดแล้วหารด้วยจำนวนข้อมูล", `ผลรวม = ${values.reduce((sum, value) => sum + value, 0)}; หาร 5 ได้ ${base}`, { values });
      }
      if (variant === 1) {
        const values = [base - 2 * step, base - step, base, base + step, base + 2 * step];
        return answer(`มัธยฐานของข้อมูลเรียงลำดับ ${values.join(", ")} คือเท่าใด?`, base, [values[1], values[3], values[0]], "เมื่อมีข้อมูล 5 ค่า มัธยฐานคือค่าลำดับที่ 3", `ค่าตรงกลางของข้อมูลที่เรียงแล้วคือ ${base}`, { values });
      }
      if (variant === 2) {
        const values = [base, base + step, base + 2 * step, base + 3 * step, base + 5 * step], range = 5 * step;
        return answer(`พิสัยของข้อมูล ${values.join(", ")} มีค่าเท่าใด?`, range, [values[4], values[0], values[4] + values[0]], `พิสัย = ค่าสูงสุด − ค่าต่ำสุด`, `${values[4]} − ${values[0]} = ${range}`, { values });
      }
      const mode = base, values = [base, base + step, base, base + 2 * step, base, base + 3 * step];
      return answer(`ฐานนิยมของข้อมูล ${values.join(", ")} คือเท่าใด?`, mode, [base + step, base + 2 * step, base + 3 * step], "ฐานนิยมคือค่าที่ปรากฏบ่อยที่สุด", `${mode} ปรากฏ 3 ครั้ง มากกว่าค่าอื่น`, { values });
    }
    case "probability": {
      if (variant === 0) {
        const total = int(8, 16), favorable = int(2, total - 2), value = fraction(favorable, total);
        return answer(`กล่องมีบัตร ${total} ใบ เป็นบัตรที่ต้องการ ${favorable} ใบ สุ่มหยิบ 1 ใบ โอกาสได้บัตรที่ต้องการเป็นเท่าใด?`, value, [fraction(total, favorable), fraction(total - favorable, total), fraction(favorable + 1, total)], "ความน่าจะเป็น = จำนวนผลลัพธ์ที่ต้องการ ÷ จำนวนผลลัพธ์ทั้งหมด", `P = ${favorable}/${total} = ${value}`, { favorable, total });
      }
      if (variant === 1) {
        const red = int(2, 8), blue = int(2, 9), total = red + blue, value = fraction(blue, total);
        return answer(`ถุงมีลูกบอลสีแดง ${red} ลูกและสีน้ำเงิน ${blue} ลูก ความน่าจะเป็นที่จะหยิบได้สีแดงคือเท่าใด?`, fraction(red, total), [value, fraction(red, blue), fraction(1, total)], "นับจำนวนลูกบอลสีแดงเป็นผลลัพธ์ที่ต้องการ", `P(สีแดง) = ${red}/${total} = ${fraction(red, total)}`, { red, blue, total });
      }
      if (variant === 2) {
        return answer("โยนเหรียญเที่ยงตรง 2 เหรียญพร้อมกัน ความน่าจะเป็นที่จะออกหัวพอดี 1 เหรียญเป็นเท่าใด?", "1/2", ["1/4", "3/4", "1"], "ผลลัพธ์ทั้งหมดคือ HH, HT, TH, TT", "ได้หัวพอดี 1 เหรียญใน HT และ TH รวม 2 จาก 4 ผลลัพธ์ จึงเป็น 2/4 = 1/2", { outcomes: 4, favorable: 2 });
      }
      const red = int(2, 5), blue = int(2, 6), total = red + blue, value = fraction(red * red, total * total);
      return answer(`ถุงมีลูกบอลสีแดง ${red} ลูกและสีน้ำเงิน ${blue} ลูก หยิบ 2 ครั้งโดยใส่คืนทุกครั้ง ความน่าจะเป็นที่ได้สีแดงทั้งสองครั้งคือเท่าใด?`, value, [fraction(red, total), fraction(blue * blue, total * total), fraction(red * blue, total * total)], `เมื่อใส่คืน โอกาสได้สีแดงแต่ละครั้งเท่ากับ ${red}/${total} และเป็นอิสระกัน`, `${red}/${total} × ${red}/${total} = ${value}`, { red, blue, total });
    }
    case "trigonometry":
    case "trig-functions": {
      if (variant === 0 || variant === 1 || variant === 2) {
        const angle = choose([30, 45, 60]);
        const table = variant === 0
          ? { 30: "1/2", 45: "√2/2", 60: "√3/2" }
          : variant === 1
            ? { 30: "√3/2", 45: "√2/2", 60: "1/2" }
            : { 30: "√3/3", 45: "1", 60: "√3" };
        const functionName = variant === 0 ? "sin" : variant === 1 ? "cos" : "tan";
        const value = table[angle];
        return answer(`จงหาค่า ${functionName}(${angle}°)`, value, ["0", "1/2", "√3/2", "1"].filter((option) => option !== value).slice(0, 3), "ใช้ตารางอัตราส่วนตรีโกณมิติของมุมพิเศษ", `${functionName}(${angle}°) = ${value}`, { functionName, angle });
      }
      if (type === "trig-functions") return answer("สำหรับมุม θ ใด ๆ ค่า sin²θ + cos²θ เท่ากับเท่าใด?", 1, [0, 2, "tan θ"], "ใช้เอกลักษณ์พื้นฐานของฟังก์ชันตรีโกณมิติ", "เอกลักษณ์ sin²θ + cos²θ = 1 เป็นจริงสำหรับทุกมุม θ", { identity: "pythagorean-trigonometric" });
      const triples = [[3, 4, 5], [5, 12, 13], [8, 15, 17]];
      const [opposite, adjacent, hypotenuse] = choose(triples);
      const value = fraction(opposite, hypotenuse);
      return answer(`สามเหลี่ยมมุมฉากมีด้านตรงข้ามมุม θ ยาว ${opposite} และด้านตรงข้ามมุมฉากยาว ${hypotenuse} จงหา sin θ`, value, [fraction(adjacent, hypotenuse), fraction(opposite, adjacent), fraction(hypotenuse, opposite)], "sin θ = ด้านตรงข้ามมุม ÷ ด้านตรงข้ามมุมฉาก", `sin θ = ${opposite}/${hypotenuse} = ${value}`, { opposite, adjacent, hypotenuse });
    }
    case "geometry": {
      if (id === "m1-2d-3d-figures") {
        if (variant === 0) return answer("ปริซึมฐานสามเหลี่ยมมีหน้าทั้งหมดกี่หน้า?", 5, [4, 6, 3], "ปริซึมฐาน n เหลี่ยมมีหน้า n ด้านและฐานอีก 2 หน้า", "ปริซึมฐานสามเหลี่ยมมี 3 + 2 = 5 หน้า", { solid: "triangular-prism" });
        if (variant === 1) return answer("ทรงสี่เหลี่ยมมุมฉากมีจุดยอดกี่จุด?", 8, [6, 10, 12], "นับมุมทั้ง 4 จุดของฐานบนและฐานล่าง", "มีฐานสี่เหลี่ยม 2 ฐาน แต่ละฐานมี 4 จุดยอด รวม 8 จุด", { solid: "rectangular-prism" });
        if (variant === 2) return answer("ข้อใดเป็นสมบัติของรูปสี่เหลี่ยมจัตุรัส?", "มีด้านเท่ากัน 4 ด้านและมุมฉาก 4 มุม", ["มีด้านเท่ากัน 2 ด้านเท่านั้น", "มีมุมฉากเพียง 2 มุม", "ไม่มีด้านขนานกัน"], "รูปสี่เหลี่ยมจัตุรัสมีทั้งด้านเท่ากันและมุมฉาก", "สี่เหลี่ยมจัตุรัสมีด้านทั้งสี่ยาวเท่ากันและมุมภายในทุกมุมเป็น 90°", { figure: "square" });
        return answer("ทรงกระบอกมีฐานวงกลมกี่ฐาน และมีผิวข้างกี่ผิว?", "ฐานวงกลม 2 ฐาน และผิวข้าง 1 ผิว", ["ฐานวงกลม 1 ฐาน และผิวข้าง 2 ผิว", "ฐานวงกลม 3 ฐาน และไม่มีผิวข้าง", "ฐานวงกลม 2 ฐาน และไม่มีผิวข้าง"], "พิจารณาหน้าตัดวงกลมด้านบนและด้านล่าง รวมทั้งผิวโค้งรอบด้าน", "ทรงกระบอกมีวงกลมเป็นฐาน 2 ฐานและมีผิวข้างโค้ง 1 ผิว", { solid: "cylinder" });
      }
      if (variant === 0) {
        const a = int(35, 75), b = int(25, 85), c = 180 - a - b;
        return answer(`สามเหลี่ยมมีมุม ${a}° และ ${b}° มุมที่สามมีขนาดเท่าใด?`, `${c}°`, [`${180 - a}°`, `${180 - b}°`, `${a + b}°`], "ผลรวมมุมภายในสามเหลี่ยมเท่ากับ 180°", `180° − ${a}° − ${b}° = ${c}°`, { a, b, c });
      }
      if (variant === 1) {
        const length = int(5, 18), width = int(3, 12), area = length * width;
        return answer(`รูปสี่เหลี่ยมผืนผ้ากว้าง ${width} ซม. ยาว ${length} ซม. มีพื้นที่เท่าใด?`, `${area} ตร.ซม.`, [`${2 * (length + width)} ตร.ซม.`, `${length + width} ตร.ซม.`, `${area + length} ตร.ซม.`], "พื้นที่สี่เหลี่ยมผืนผ้า = กว้าง × ยาว", `${width} × ${length} = ${area} ตร.ซม.`, { length, width });
      }
      if (variant === 2) {
        const side = int(4, 15), perimeter = 4 * side;
        return answer(`สี่เหลี่ยมจัตุรัสยาวด้านละ ${side} ซม. มีความยาวรอบรูปเท่าใด?`, `${perimeter} ซม.`, [`${side * side} ซม.`, `${2 * side} ซม.`, `${perimeter + side} ซม.`], "รอบรูปสี่เหลี่ยมจัตุรัส = 4 × ความยาวด้าน", `4 × ${side} = ${perimeter} ซม.`, { side });
      }
      const base = int(4, 14), height = int(3, 12), area = base * height / 2;
      return answer(`สามเหลี่ยมมีฐาน ${base} ซม. และสูง ${height} ซม. มีพื้นที่เท่าใด?`, `${area} ตร.ซม.`, [`${base * height} ตร.ซม.`, `${base + height} ตร.ซม.`, `${2 * area} ตร.ซม.`], "พื้นที่สามเหลี่ยม = ½ × ฐาน × สูง", `½ × ${base} × ${height} = ${area} ตร.ซม.`, { base, height });
    }
    case "pythagorean": {
      const triples = [[3, 4, 5], [5, 12, 13], [8, 15, 17]];
      const [a, b, c] = choose(triples), scale = int(1, 4);
      if (variant === 0) return answer(`สามเหลี่ยมมุมฉากมีด้านประกอบมุมฉากยาว ${a * scale} และ ${b * scale} หน่วย ด้านตรงข้ามมุมฉากยาวเท่าใด?`, c * scale, [a * scale + b * scale, c * scale - scale, c * scale + scale], "ใช้ทฤษฎีพีทาโกรัส c² = a² + b²", `c = √((${a * scale})² + (${b * scale})²) = ${c * scale}`, { a: a * scale, b: b * scale });
      if (variant === 1) return answer(`ด้านตรงข้ามมุมฉากยาว ${c * scale} หน่วย และอีกด้านยาว ${a * scale} หน่วย ด้านที่เหลือยาวเท่าใด?`, b * scale, [c * scale - a * scale, a * scale, b * scale + scale], "ใช้ a² = c² − b²", `√((${c * scale})² − (${a * scale})²) = ${b * scale}`, { a: a * scale, c: c * scale });
      if (variant === 2) return answer(`จุด A(0, 0) และ B(${a * scale}, ${b * scale}) อยู่บนระนาบพิกัด ระยะ AB เท่าใด?`, c * scale, [a * scale + b * scale, c * scale - scale, c * scale + scale], "ระยะระหว่างจุดหาได้ด้วยทฤษฎีพีทาโกรัส", `AB = √((${a * scale})² + (${b * scale})²) = ${c * scale}`, { dx: a * scale, dy: b * scale });
      return answer(`ถ้าด้านของสามเหลี่ยมมุมฉากเป็น ${a * scale}, ${b * scale}, ${c * scale} หน่วย ด้านใดเป็นด้านตรงข้ามมุมฉาก?`, c * scale, [a * scale, b * scale, a * scale + b * scale], "ด้านตรงข้ามมุมฉากเป็นด้านที่ยาวที่สุดและสอดคล้องกับ c² = a² + b²", `${a * a * scale * scale} + ${b * b * scale * scale} = ${c * c * scale * scale}; ด้านตรงข้ามมุมฉากยาว ${c * scale}`, { a: a * scale, b: b * scale, c: c * scale });
    }
    case "construction": {
      const angle = choose([60, 72, 84, 96, 120]);
      if (variant % 2 === 0) return answer(`เมื่อสร้างเส้นแบ่งครึ่งมุม ${angle}° มุมแต่ละส่วนมีขนาดเท่าใด?`, `${angle / 2}°`, [`${angle}°`, `${180 - angle}°`, `${angle / 3}°`], "เส้นแบ่งครึ่งมุมแบ่งมุมเดิมออกเป็นสองมุมที่เท่ากัน", `${angle}° ÷ 2 = ${angle / 2}°`, { angle });
      if (variant === 1) return answer("จุดทุกจุดบนเส้นแบ่งครึ่งตั้งฉากของส่วนของเส้นตรงมีสมบัติใด?", "อยู่ห่างจากปลายทั้งสองของส่วนของเส้นตรงเท่ากัน", ["อยู่บนส่วนของเส้นตรงเสมอ", "ทำมุม 45° กับเส้นตรงทุกเส้น", "อยู่ห่างจากปลายด้านหนึ่งเป็นสองเท่า"], "เส้นแบ่งครึ่งตั้งฉากเป็นตำแหน่งของจุดที่ห่างจากปลายทั้งสองเท่ากัน", "ตามนิยาม ระยะจากจุดบนเส้นแบ่งครึ่งตั้งฉากไปยังปลายทั้งสองเท่ากัน", { construction: "perpendicular-bisector" });
      return answer("การสร้างมุม 60° ด้วยวงเวียนและสันตรงอาศัยรูปใดเป็นหลัก?", "สามเหลี่ยมด้านเท่า", ["สามเหลี่ยมมุมฉาก", "สี่เหลี่ยมจัตุรัส", "วงกลมสองวงที่ไม่มีจุดตัด"], "รัศมีเท่ากันทำให้ได้ด้านทั้งสามยาวเท่ากัน", "สร้างสามเหลี่ยมด้านเท่าซึ่งแต่ละมุมภายในมีขนาด 60°", { construction: "equilateral-triangle" });
    }
    case "solids": {
      if (id === "m2-prisms-cylinders") {
        if (variant === 0) {
          const l = int(3, 10), w = int(2, 8), h = int(2, 9), volume = l * w * h;
          return answer(`ปริซึมสี่เหลี่ยมมุมฉากยาว ${l} ซม. กว้าง ${w} ซม. สูง ${h} ซม. มีปริมาตรเท่าใด?`, `${volume} ลบ.ซม.`, [`${l * w + h} ลบ.ซม.`, `${2 * (l * w + l * h + w * h)} ลบ.ซม.`, `${l + w + h} ลบ.ซม.`], "ปริมาตรปริซึม = พื้นที่ฐาน × สูง", `${l} × ${w} × ${h} = ${volume} ลบ.ซม.`, { l, w, h });
        }
        if (variant === 1) {
          const base = int(2, 8) * 2, triangleHeight = int(2, 8), length = int(2, 8);
          const baseArea = base * triangleHeight / 2, volume = baseArea * length;
          return answer(`ปริซึมฐานสามเหลี่ยมมีฐานสามเหลี่ยม ${base} ซม. สูง ${triangleHeight} ซม. และยาว ${length} ซม. มีปริมาตรเท่าใด?`, `${volume} ลบ.ซม.`, [`${baseArea + length} ลบ.ซม.`, `${base * triangleHeight * length} ลบ.ซม.`, `${volume / 2} ลบ.ซม.`], "หาพื้นที่สามเหลี่ยมฐานก่อน แล้วคูณด้วยความยาวปริซึม", `พื้นที่ฐาน = ½ × ${base} × ${triangleHeight} = ${baseArea}; ปริมาตร = ${baseArea} × ${length} = ${volume}`, { base, triangleHeight, length, baseArea });
        }
        if (variant === 2) {
          const r = int(2, 6), h = int(2, 9), coefficient = r * r * h;
          return answer(`ทรงกระบอกรัศมี ${r} ซม. สูง ${h} ซม. มีปริมาตรเท่าใดในรูปของ π?`, `${coefficient}π ลบ.ซม.`, [`${2 * r * h}π ลบ.ซม.`, `${r * h}π ลบ.ซม.`, `${r * r + h}π ลบ.ซม.`], "ปริมาตรทรงกระบอก = πr²h", `π × ${r}² × ${h} = ${coefficient}π ลบ.ซม.`, { r, h });
        }
        const r = int(2, 6), h = int(2, 9), coefficient = 2 * r * (r + h);
        return answer(`ทรงกระบอกรัศมี ${r} ซม. สูง ${h} ซม. มีพื้นที่ผิวทั้งหมดเท่าใดในรูปของ π?`, `${coefficient}π ตร.ซม.`, [`${r * (r + h)}π ตร.ซม.`, `${2 * r * h}π ตร.ซม.`, `${r * r + h}π ตร.ซม.`], "พื้นที่ผิวทั้งหมด = พื้นที่ผิวข้าง + พื้นที่ฐานวงกลมสองฐาน = 2πr(h + r)", `2π(${r})(${h} + ${r}) = ${coefficient}π ตร.ซม.`, { r, h });
      }
      if (id === "m3-pyramids-cones-spheres") {
        if (variant === 0) {
          const baseArea = int(2, 10) * 3, h = int(2, 9), volume = baseArea * h / 3;
          return answer(`พีระมิดมีพื้นที่ฐาน ${baseArea} ตร.ซม. และสูง ${h} ซม. มีปริมาตรเท่าใด?`, `${volume} ลบ.ซม.`, [`${baseArea * h} ลบ.ซม.`, `${baseArea + h} ลบ.ซม.`, `${baseArea * h / 2} ลบ.ซม.`], "ปริมาตรพีระมิด = ⅓ × พื้นที่ฐาน × สูง", `⅓ × ${baseArea} × ${h} = ${volume} ลบ.ซม.`, { baseArea, h });
        }
        if (variant === 1) {
          const r = int(1, 3) * 3, h = int(2, 9), coefficient = r * r * h / 3;
          return answer(`กรวยรัศมี ${r} ซม. สูง ${h} ซม. มีปริมาตรเท่าใดในรูปของ π?`, `${coefficient}π ลบ.ซม.`, [`${r * r * h}π ลบ.ซม.`, `${r * h}π ลบ.ซม.`, `${coefficient * 2}π ลบ.ซม.`], "ปริมาตรกรวย = ⅓πr²h", `⅓π × ${r}² × ${h} = ${coefficient}π ลบ.ซม.`, { r, h });
        }
        if (variant === 2) {
          const r = int(1, 3) * 3, coefficient = 4 * r * r * r / 3;
          return answer(`ทรงกลมรัศมี ${r} ซม. มีปริมาตรเท่าใดในรูปของ π?`, `${coefficient}π ลบ.ซม.`, [`${4 * r * r}π ลบ.ซม.`, `${r * r * r}π ลบ.ซม.`, `${coefficient / 2}π ลบ.ซม.`], "ปริมาตรทรงกลม = ⁴⁄₃πr³", `⁴⁄₃π(${r})³ = ${coefficient}π ลบ.ซม.`, { r });
        }
        return answer("กรวยและทรงกระบอกมีพื้นที่ฐานและความสูงเท่ากัน ปริมาตรกรวยเป็นกี่เท่าของทรงกระบอก?", "หนึ่งในสาม", ["หนึ่งในสอง", "เท่ากัน", "สามเท่า"], "สูตรปริมาตรกรวยคือ ⅓πr²h ส่วนทรงกระบอกคือ πr²h", "เมื่อฐานและสูงเท่ากัน ปริมาตรกรวย = ⅓ × ปริมาตรทรงกระบอก", { relationship: "cone-to-cylinder" });
      }
      if (variant === 0) {
        const l = int(3, 10), w = int(2, 8), h = int(2, 9), volume = l * w * h;
        return answer(`ปริซึมสี่เหลี่ยมมุมฉากยาว ${l} ซม. กว้าง ${w} ซม. สูง ${h} ซม. มีปริมาตรเท่าใด?`, `${volume} ลบ.ซม.`, [`${l * w + h} ลบ.ซม.`, `${2 * (l * w + l * h + w * h)} ลบ.ซม.`, `${l + w + h} ลบ.ซม.`], "ปริมาตรปริซึม = พื้นที่ฐาน × สูง", `${l} × ${w} × ${h} = ${volume} ลบ.ซม.`, { l, w, h });
      }
      if (variant === 1) {
        const r = int(2, 6), h = int(2, 9), coefficient = r * r * h;
        return answer(`ทรงกระบอกรัศมี ${r} ซม. สูง ${h} ซม. มีปริมาตรเท่าใดในรูปของ π?`, `${coefficient}π ลบ.ซม.`, [`${2 * r * h}π ลบ.ซม.`, `${r * h}π ลบ.ซม.`, `${r * r + h}π ลบ.ซม.`], "ปริมาตรทรงกระบอก = πr²h", `π × ${r}² × ${h} = ${coefficient}π ลบ.ซม.`, { r, h });
      }
      if (variant === 2) {
        const baseArea = int(2, 10) * 3, h = int(2, 9), volume = baseArea * h / 3;
        return answer(`พีระมิดมีพื้นที่ฐาน ${baseArea} ตร.ซม. และสูง ${h} ซม. มีปริมาตรเท่าใด?`, `${volume} ลบ.ซม.`, [`${baseArea * h} ลบ.ซม.`, `${baseArea + h} ลบ.ซม.`, `${baseArea * h / 2} ลบ.ซม.`], "ปริมาตรพีระมิด = ⅓ × พื้นที่ฐาน × สูง", `⅓ × ${baseArea} × ${h} = ${volume} ลบ.ซม.`, { baseArea, h });
      }
      const r = choose([3, 6, 9]), coefficient = 4 * r * r * r / 3;
      return answer(`ทรงกลมรัศมี ${r} ซม. มีปริมาตรเท่าใดในรูปของ π?`, `${coefficient}π ลบ.ซม.`, [`${4 * r * r}π ลบ.ซม.`, `${r * r * r}π ลบ.ซม.`, `${coefficient / 2}π ลบ.ซม.`], "ปริมาตรทรงกลม = ⁴⁄₃πr³", `⁴⁄₃π(${r})³ = ${coefficient}π ลบ.ซม.`, { r });
    }
    case "transformations": {
      const x = int(-8, 8) || 3, y = int(-8, 8) || 4;
      if (variant === 0) {
        const dx = int(-5, 5), dy = int(-5, 5), correct = `(${x + dx}, ${y + dy})`;
        return answer(`เลื่อนจุด P(${x}, ${y}) ด้วยเวกเตอร์ (${dx}, ${dy}) จะได้จุดใด?`, correct, [`(${x - dx}, ${y - dy})`, `(${-x + dx}, ${y + dy})`, `(${x + dy}, ${y + dx})`], "บวกพิกัดเวกเตอร์กับพิกัดจุดทีละแกน", `P' = (${x} + ${dx}, ${y} + ${dy}) = ${correct}`, { x, y, dx, dy });
      }
      if (variant === 1) return answer(`สะท้อนจุด P(${x}, ${y}) กับแกน x ได้พิกัดใด?`, `(${x}, ${-y})`, [`(${-x}, ${y})`, `(${-x}, ${-y})`, `(${y}, ${x})`], "การสะท้อนกับแกน x เปลี่ยนเครื่องหมายพิกัด y เท่านั้น", `P' = (${x}, −${y}) = (${x}, ${-y})`, { x, y, axis: "x" });
      if (variant === 2) return answer(`สะท้อนจุด P(${x}, ${y}) กับแกน y ได้พิกัดใด?`, `(${-x}, ${y})`, [`(${x}, ${-y})`, `(${-x}, ${-y})`, `(${y}, ${x})`], "การสะท้อนกับแกน y เปลี่ยนเครื่องหมายพิกัด x เท่านั้น", `P' = (−${x}, ${y}) = (${-x}, ${y})`, { x, y, axis: "y" });
      return answer(`หมุนจุด P(${x}, ${y}) รอบจุดกำเนิดทวนเข็มนาฬิกา 90° ได้พิกัดใด?`, `(${-y}, ${x})`, [`(${y}, ${-x})`, `(${-x}, ${-y})`, `(${x}, ${-y})`], "การหมุนทวนเข็ม 90° ใช้กฎ (x, y) → (−y, x)", `(${x}, ${y}) → (−${y}, ${x})`, { x, y, angle: 90 });
    }
    case "congruence": {
      if (variant === 0) return answer("สามเหลี่ยมสองรูปมีด้านคู่สมนัยเท่ากันทั้งสามคู่ ใช้เกณฑ์ใดสรุปว่าสามเหลี่ยมเท่ากันทุกประการ?", "ด้าน-ด้าน-ด้าน (SSS)", ["มุม-มุม-มุม (AAA)", "ด้าน-ด้าน-มุมที่มุมไม่อยู่ระหว่างด้าน (SSA)", "มุมเดียวเท่ากัน"], "เกณฑ์ SSS ใช้ด้านที่สมนัยกันทั้งสามคู่", "ด้านคู่สมนัยเท่ากัน 3 คู่ จึงใช้เกณฑ์ SSS", { criterion: "SSS" });
      if (variant === 1) return answer("มีด้านหนึ่งและมุมประกบสองมุมของสามเหลี่ยมคู่หนึ่งเท่ากับของอีกคู่ ใช้เกณฑ์ใด?", "มุม-ด้าน-มุม (ASA)", ["ด้าน-ด้าน-ด้าน (SSS)", "มุม-มุม-มุม (AAA)", "ด้าน-ด้าน-มุมที่มุมไม่อยู่ระหว่างด้าน (SSA)"], "ASA คือมุมสองมุมและด้านที่อยู่ระหว่างมุมทั้งสอง", "ข้อมูลตรงกับเกณฑ์ ASA", { criterion: "ASA" });
      if (variant === 2) return answer("เกณฑ์ใดใช้ด้านสองคู่และมุมที่อยู่ระหว่างด้านนั้นเพื่อพิสูจน์ความเท่ากันทุกประการ?", "ด้าน-มุม-ด้าน (SAS)", ["มุม-มุม-มุม (AAA)", "ด้าน-ด้าน-ด้าน (SSS)", "มุม-มุมเท่านั้น"], "SAS ต้องเป็นมุมที่อยู่ระหว่างด้านคู่ที่กำหนด", "ข้อมูลตรงกับเกณฑ์ SAS", { criterion: "SAS" });
      return answer("ข้อมูลด้าน-ด้าน-มุมที่มุมไม่อยู่ระหว่างด้าน (SSA) เพียงอย่างเดียวรับประกันว่าสามเหลี่ยมเท่ากันทุกประการหรือไม่?", "ไม่รับประกัน", ["รับประกันเสมอ", "รับประกันเฉพาะสามเหลี่ยมด้านเท่า", "รับประกันเมื่อมีมุมฉากเท่านั้น"], "กรณี SSA อาจสร้างสามเหลี่ยมได้มากกว่าหนึ่งรูป", "SSA ไม่ใช่เกณฑ์ความเท่ากันทุกประการทั่วไป เพราะอาจเกิดกรณีกำกวม", { criterion: "SSA" });
    }
    case "parallel-lines": {
      const angle = int(35, 75), supplement = 180 - angle;
      if (variant === 0) return answer(`เมื่อเส้นขนานสองเส้นถูกตัดด้วยเส้นตัด มุมสมนัยกับมุม ${angle}° มีขนาดเท่าใด?`, `${angle}°`, [`${supplement}°`, `${angle / 2}°`, `${180 - 2 * angle}°`], "มุมสมนัยของเส้นขนานมีขนาดเท่ากัน", `มุมสมนัย = ${angle}°`, { angle, relation: "corresponding" });
      if (variant === 1) return answer(`เส้นขนานสองเส้นถูกตัดด้วยเส้นตัด มุมแย้งภายในคู่หนึ่งมีมุม ${angle}° อีกมุมมีขนาดเท่าใด?`, `${angle}°`, [`${supplement}°`, `${angle + 90}°`, `${angle / 2}°`], "มุมแย้งภายในของเส้นขนานมีขนาดเท่ากัน", `มุมแย้งภายใน = ${angle}°`, { angle, relation: "alternate-interior" });
      if (variant === 2) return answer(`มุมภายในด้านเดียวกันของเส้นตัดมีมุมหนึ่ง ${angle}° อีกมุมมีขนาดเท่าใด?`, `${supplement}°`, [`${angle}°`, `${180 + angle}°`, `${90 - angle}°`], "มุมภายในด้านเดียวกันรวมกันได้ 180°", `180° − ${angle}° = ${supplement}°`, { angle, relation: "same-side-interior" });
      return answer(`ถ้ามุมหนึ่งมีขนาด ${angle}° มุมตรงข้ามกันที่จุดตัดมีขนาดเท่าใด?`, `${angle}°`, [`${supplement}°`, `${angle / 2}°`, `${2 * angle}°`], "มุมตรงข้ามกันมีขนาดเท่ากัน", `มุมตรงข้าม = ${angle}°`, { angle, relation: "vertical" });
    }
    case "geometry-reasoning": {
      const b = int(25, 60), a = b + int(10, 55);
      if (variant === 0) return answer(`สามเหลี่ยมมีมุม ${a}° และ ${b}° มุมภายในที่เหลือเป็นเท่าใด?`, `${180 - a - b}°`, [`${180 - a}°`, `${180 - b}°`, `${a + b}°`], "มุมภายในสามเหลี่ยมรวม 180°", `180° − ${a}° − ${b}° = ${180 - a - b}°`, { a, b });
      if (variant === 1) return answer(`รูปสี่เหลี่ยมมีมุมสามมุม ${a}°, ${b}° และ 90° มุมที่สี่มีขนาดเท่าใด?`, `${360 - a - b - 90}°`, [`${180 - a - b}°`, `${360 - a - b}°`, `${a + b + 90}°`], "มุมภายในรูปสี่เหลี่ยมรวม 360°", `360° − ${a}° − ${b}° − 90° = ${360 - a - b - 90}°`, { a, b });
      if (variant === 2) return answer(`มุมภายนอกของสามเหลี่ยมเท่ากับ ${a}° และมุมภายในที่ไม่ประชิดมุมหนึ่งเท่ากับ ${b}° อีกมุมหนึ่งมีขนาดเท่าใด?`, `${a - b}°`, [`${a + b}°`, `${180 - a}°`, `${180 - b}°`], "มุมภายนอกเท่ากับผลบวกของมุมภายในที่ไม่ประชิดสองมุม", `${a}° = ${b}° + มุมที่หา; มุมที่หา = ${a - b}°`, { exterior: a, interior: b });
      const angle = int(35, 80);
      return answer(`มุมประชิดบนเส้นตรงมุมหนึ่งมีขนาด ${angle}° อีกมุมมีขนาดเท่าใด?`, `${180 - angle}°`, [`${angle}°`, `${90 - angle}°`, `${180 + angle}°`], "มุมบนเส้นตรงรวมกัน 180°", `180° − ${angle}° = ${180 - angle}°`, { angle });
    }
    case "similarity": {
      if (variant === 0) {
        const small = int(2, 8), scale = int(2, 5);
        return answer(`รูปสามเหลี่ยมคล้ายกันมีอัตราส่วนด้านรูปใหญ่ต่อรูปเล็กเป็น ${scale}:1 ด้านยาว ${small} หน่วยในรูปเล็กจะเป็นเท่าใดในรูปใหญ่?`, small * scale, [small + scale, small * (scale + 1), scale], "คูณความยาวด้านด้วยอัตราส่วนการขยาย", `${small} × ${scale} = ${small * scale}`, { small, scale });
      }
      if (variant === 1) {
        const a = int(3, 8), b = int(2, 6), scale = int(2, 4);
        return answer(`รูปสามเหลี่ยมสองรูปคล้ายกัน มีด้านคู่สมนัย ${a} หน่วยและ ${a * scale} หน่วย อีกด้านของรูปเล็กยาว ${b} หน่วย ด้านคู่สมนัยของรูปใหญ่ยาวเท่าใด?`, b * scale, [b + scale, a * scale, b * scale + 1], "ด้านคู่สมนัยคูณด้วยตัวคูณสเกลเดียวกัน", `${a * scale} ÷ ${a} = ${scale}; ${b} × ${scale} = ${b * scale}`, { a, b, scale });
      }
      if (variant === 2) {
        const scale = int(2, 5), area = int(2, 12);
        return answer(`รูปคล้ายกันมีอัตราส่วนความยาวด้านของรูปใหญ่ต่อรูปเล็ก ${scale}:1 พื้นที่รูปเล็กเป็น ${area} ตร.หน่วย พื้นที่รูปใหญ่เท่าใด?`, area * scale * scale, [area * scale, area + scale, area * scale * 2], "อัตราส่วนพื้นที่เป็นกำลังสองของอัตราส่วนความยาว", `${area} × ${scale}² = ${area * scale * scale} ตร.หน่วย`, { scale, area });
      }
      const a = int(2, 8), b = int(2, 7), scale = int(2, 5);
      return answer(`รูปสามเหลี่ยมคล้ายกันมีด้าน ${a} หน่วยสมนัยกับด้าน ${a * scale} หน่วย อีกด้านของรูปเล็กยาว ${b} หน่วย ด้านสมนัยของรูปใหญ่ยาวเท่าใด?`, b * scale, [b + scale, a * scale, b * scale + 1], `หาอัตราส่วน ${a * scale}/${a} แล้วใช้กับอีกด้าน`, `ตัวคูณสเกล = ${a * scale}/${a} = ${scale}; ${b} × ${scale} = ${b * scale}`, { a, b, scale });
    }
    case "systems": {
      const y = int(1, 8), x = y + int(1, 7);
      if (variant === 0) {
        const sum = x + y, diff = x - y;
        return answer(`แก้ระบบสมการ x + y = ${sum} และ x − y = ${diff} ได้คู่ลำดับ (x, y) ใด?`, `(${x}, ${y})`, [`(${y}, ${x})`, `(${sum}, ${diff})`, `(${x + 1}, ${y - 1})`], "บวกสมการเพื่อกำจัด y แล้วแทนค่ากลับหา y", `บวกสมการได้ 2x = ${2 * x} จึง x = ${x}; ดังนั้น y = ${y}`, { x, y, sum, diff });
      }
      if (variant === 1) {
        const a = int(2, 5), b = int(1, 4), difference = x - y, total = a * x + b * y;
        return answer(`แก้ระบบ ${a}x + ${b}y = ${total} และ x − y = ${difference} ได้คู่ลำดับ (x, y) ใด?`, `(${x}, ${y})`, [`(${y}, ${x})`, `(${x + 1}, ${y - 1})`, `(${x - 1}, ${y + 1})`], `แทน x = y + ${difference} ในสมการแรก แล้วแก้หา y`, `แทนค่าได้ ${a}(y + ${difference}) + ${b}y = ${total}; แก้สมการจะได้ x = ${x}, y = ${y}`, { a, b, x, y, difference, total });
      }
      const sum = x + y, doubled = 2 * x + y;
      return answer(`ระบบ x + y = ${sum} และ 2x + y = ${doubled} มีคำตอบ (x, y) ใด?`, `(${x}, ${y})`, [`(${y}, ${x})`, `(${sum}, ${doubled})`, `(${x - 1}, ${y + 1})`], "ลบสมการแรกออกจากสมการที่สองเพื่อหา x", `สมการที่สองลบสมการแรกได้ x = ${doubled - sum} = ${x}; จึง y = ${sum} − ${x} = ${y}`, { x, y, sum, doubled });
    }
    case "circles": {
      const r = int(2, 12);
      if (variant === 0) return answer(`วงกลมรัศมี ${r} ซม. มีเส้นรอบวงเท่าใดในรูปของ π?`, `${2 * r}π ซม.`, [`${r}π ซม.`, `${r * r}π ซม.`, `${4 * r}π ซม.`], "เส้นรอบวง = 2πr", `2π × ${r} = ${2 * r}π ซม.`, { r });
      if (variant === 1) return answer(`วงกลมรัศมี ${r} ซม. มีพื้นที่เท่าใดในรูปของ π?`, `${r * r}π ตร.ซม.`, [`${2 * r}π ตร.ซม.`, `${r}π ตร.ซม.`, `${2 * r * r}π ตร.ซม.`], "พื้นที่วงกลม = πr²", `π × ${r}² = ${r * r}π ตร.ซม.`, { r });
      if (variant === 2) return answer(`วงกลมมีเส้นผ่านศูนย์กลาง ${2 * r} ซม. รัศมียาวเท่าใด?`, `${r} ซม.`, [`${2 * r} ซม.`, `${r * 2}π ซม.`, `${r + 1} ซม.`], "รัศมีมีความยาวครึ่งหนึ่งของเส้นผ่านศูนย์กลาง", `${2 * r} ÷ 2 = ${r} ซม.`, { diameter: 2 * r, r });
      const angle = choose([45, 60, 90, 120, 180]), arc = fraction(angle, 360);
      return answer(`มุมที่จุดศูนย์กลางของภาควงกลมเป็น ${angle}° คิดเป็นเศษส่วนเท่าใดของวงกลมเต็ม?`, arc, [fraction(angle, 180), fraction(360, angle), fraction(360 - angle, 360)], "สัดส่วนของภาควงกลม = มุมที่จุดศูนย์กลาง ÷ 360°", `${angle}/360 = ${arc}`, { angle });
    }
    case "sets": {
      const a = int(3, 6), b = a + int(2, 6), c = b + int(2, 6);
      if (variant === 0) return answer(`กำหนด A = {1, 2, ${a}, ${b}} และ B = {2, ${b}, ${c}} จงหา A ∩ B`, `{2, ${b}}`, [`{1, ${a}, ${c}}`, `{1, 2, ${a}, ${b}, ${c}}`, `{${a}, ${c}}`], "อินเตอร์เซกชันคือสมาชิกที่อยู่ในทั้งสองเซต", `สมาชิกที่ซ้ำกันใน A และ B คือ 2 และ ${b}`, { a, b, c });
      if (variant === 1) return answer(`กำหนด A = {1, 2, ${a}} และ B = {2, ${b}} จงหา A ∪ B`, `{1, 2, ${a}, ${b}}`, [`{2}`, `{1, ${a}}`, `{1, 2, ${a}, ${b}, ${b}}`], "ยูเนียนรวมสมาชิกของทั้งสองเซตโดยไม่นับซ้ำ", `รวมสมาชิกไม่ซ้ำได้ {1, 2, ${a}, ${b}}`, { a, b });
      if (variant === 2) {
        const sizeA = int(5, 12), sizeB = int(4, 10), overlap = int(1, Math.min(sizeA, sizeB) - 1);
        return answer(`ถ้า n(A) = ${sizeA}, n(B) = ${sizeB} และ n(A ∩ B) = ${overlap} แล้ว n(A ∪ B) เท่ากับเท่าใด?`, sizeA + sizeB - overlap, [sizeA + sizeB, sizeA + sizeB + overlap, sizeA * sizeB], "ใช้ n(A ∪ B) = n(A) + n(B) − n(A ∩ B)", `${sizeA} + ${sizeB} − ${overlap} = ${sizeA + sizeB - overlap}`, { sizeA, sizeB, overlap });
      }
      return answer(`กำหนดเอกภพสัมพัทธ์ U = {1, 2, 3, 4, 5, 6} และ A = {2, 4, 6} ส่วนเติมเต็มของ A คือข้อใด?`, "{1, 3, 5}", ["{2, 4, 6}", "{1, 2, 3}", "{4, 5, 6}"], "ส่วนเติมเต็มคือสมาชิกใน U ที่ไม่อยู่ใน A", "นำ 2, 4, 6 ออกจาก U เหลือ {1, 3, 5}", { universe: [1, 2, 3, 4, 5, 6], set: [2, 4, 6] });
    }
    case "logic": {
      const n = 2 * int(2, 9);
      if (variant === 0) return answer(`ข้อความ “ถ้า n หารด้วย 4 ลงตัว แล้ว n เป็นจำนวนคู่” เป็นจริงหรือเท็จ?`, "จริง", ["เท็จ", "จริงเฉพาะเมื่อ n = 0", "สรุปไม่ได้"], "จำนวนที่หารด้วย 4 ลงตัวเขียนเป็น 4k ได้ และ 4k = 2(2k)", `ถ้า n = 4k จะได้ n = 2(2k) จึงเป็นจำนวนคู่ ข้อความเป็นจริง`, { n, statement: "divisible by 4 implies even" });
      if (variant === 1) return answer("นิเสธของข้อความ ‘ทุกจำนวนจริงเป็นจำนวนบวก’ คือข้อใด?", "มีจำนวนจริงอย่างน้อยหนึ่งจำนวนที่ไม่เป็นจำนวนบวก", ["ทุกจำนวนจริงไม่เป็นจำนวนบวก", "ไม่มีจำนวนจริงที่เป็นจำนวนบวก", "ทุกจำนวนบวกเป็นจำนวนจริง"], "นิเสธของ ‘ทุก’ คือ ‘มีอย่างน้อยหนึ่งที่ไม่…’", "มีตัวอย่างเช่น 0 หรือ −1 ซึ่งไม่เป็นจำนวนบวก", { rule: "negation of universal" });
      if (variant === 2) return answer("นิเสธของ p ∧ q ตามกฎของเดอมอร์แกนคือข้อใด?", "¬p ∨ ¬q", ["¬p ∧ ¬q", "p ∨ q", "p ∧ ¬q"], "เดอมอร์แกน: นิเสธของ ‘และ’ เปลี่ยนเป็น ‘หรือ’ และนิเสธแต่ละข้อความ", "¬(p ∧ q) ≡ ¬p ∨ ¬q", { rule: "De Morgan" });
      return answer("ถ้า p เป็นเท็จ ประพจน์เงื่อนไข p → q มีค่าความจริงเป็นอย่างไร?", "จริง", ["เท็จ", "ขึ้นกับ q", "นิยามไม่ได้"], "ประพจน์ p → q เป็นเท็จเฉพาะกรณี p จริงและ q เท็จ", "เมื่อ p เป็นเท็จ เงื่อนไข p → q เป็นจริง", { p: false });
    }
    case "numbers": {
      if (variant === 0) {
        const square = int(2, 10) ** 2;
        return answer(`√${square} จัดเป็นจำนวนชนิดใด?`, "จำนวนตรรกยะ", ["จำนวนอตรรกยะ", "จำนวนจินตภาพ", "ไม่ใช่จำนวนจริง"], "หารากที่สองของจำนวนกำลังสองสมบูรณ์ได้เป็นจำนวนเต็ม", `√${square} = ${Math.sqrt(square)} ซึ่งเขียนเป็นเศษส่วนได้`, { radicand: square });
      }
      if (variant === 1) {
        const value = int(-30, 30) || -7;
        return answer(`ค่าสัมบูรณ์ของ ${value} เท่ากับเท่าใด?`, Math.abs(value), [value, -Math.abs(value), Math.abs(value) + 1], "ค่าสัมบูรณ์คือระยะห่างจากศูนย์ จึงไม่ติดลบ", `|${value}| = ${Math.abs(value)}`, { value });
      }
      if (variant === 2) {
        const value = int(2, 12);
        return answer(`√(${value}²) มีค่าเท่าใด?`, value, [-value, value * value, value + 1], "รากที่สองหลักเป็นค่าที่ไม่ติดลบ", `√(${value}²) = |${value}| = ${value}`, { value });
      }
      const value = choose([Math.sqrt(2), Math.sqrt(3), Math.PI]);
      const label = value === Math.PI ? "π" : value === Math.sqrt(2) ? "√2" : "√3";
      return answer(`จำนวน ${label} เป็นจำนวนตรรกยะหรืออตรรกยะ?`, "อตรรกยะ", ["ตรรกยะ", "จำนวนเต็ม", "จำนวนธรรมชาติ"], "จำนวนอตรรกยะเขียนเป็นเศษส่วนของจำนวนเต็มสองจำนวนไม่ได้", `${label} เป็นจำนวนอตรรกยะ`, { value: label });
    }
    case "exponents": {
      const base = choose([2, 3, 5]), m = int(2, 5), n = int(1, 4);
      if (variant === 0) return answer(`จงเขียน ${base}^${m} × ${base}^${n} ในรูปเลขยกกำลังอย่างง่าย`, `${base}^${m + n}`, [`${base}^${m * n}`, `${base}^${m - n}`, `${base * 2}^${m + n}`], "เมื่อคูณเลขยกกำลังฐานเดียวกัน ให้นำเลขชี้กำลังมาบวกกัน", `${base}^${m} × ${base}^${n} = ${base}^(${m} + ${n}) = ${base}^${m + n}`, { base, m, n });
      if (variant === 1) return answer(`จงเขียน (${base}^${m})^${n} ในรูปเลขยกกำลังอย่างง่าย`, `${base}^${m * n}`, [`${base}^${m + n}`, `${base + m}^${n}`, `${base}^${m - n}`], "เมื่อยกกำลังของเลขยกกำลัง ให้นำเลขชี้กำลังมาคูณกัน", `(${base}^${m})^${n} = ${base}^(${m}×${n}) = ${base}^${m * n}`, { base, m, n });
      if (variant === 2) return answer(`จงหาค่าของ ${base}^${m}`, base ** m, [base * m, base + m, base ** (m - 1)], "เลขชี้กำลังบอกจำนวนครั้งที่นำฐานมาคูณกัน", `${base}^${m} = ${Array(m).fill(base).join(" × ")} = ${base ** m}`, { base, m });
      return answer(`จงเขียน ${base}^0 ให้อยู่ในรูปจำนวน`, 1, [0, base, -1], "จำนวนที่ไม่เป็นศูนย์ยกกำลังศูนย์มีค่าเท่ากับ 1", `${base}^0 = 1`, { base, exponent: 0 });
    }
    case "exponential-log": {
      const base = choose([2, 3, 5]), exponent = int(2, 5), value = base ** exponent;
      if (variant === 0) return answer(`จงหาค่า x เมื่อ ${base}^x = ${value}`, exponent, [value, exponent + 1, exponent - 1], `เขียน ${value} ให้อยู่ในรูปกำลังของ ${base}`, `${value} = ${base}^${exponent} ดังนั้น x = ${exponent}`, { base, exponent, value });
      if (variant === 1) return answer(`จงหาค่า log_${base}(${value})`, exponent, [value, base + exponent, exponent - 1], "log_b(a) คือเลขชี้กำลังที่ทำให้ b ยกกำลังนั้นได้ a", `${base}^${exponent} = ${value} จึง log_${base}(${value}) = ${exponent}`, { base, exponent, value });
      if (variant === 2) return answer(`จงยุบ ${base}^${exponent} × ${base}^2 ให้อยู่ในรูปเลขยกกำลัง`, `${base}^${exponent + 2}`, [`${base}^${exponent * 2}`, `${base}^${exponent - 2}`, `${base * 2}^${exponent}`], "เมื่อนำเลขยกกำลังฐานเดียวกันมาคูณ ให้บวกเลขชี้กำลัง", `${base}^${exponent} × ${base}² = ${base}^${exponent + 2}`, { base, exponent });
      return answer(`ถ้า log_${base}(x) = ${exponent} แล้ว x มีค่าเท่าใด?`, value, [base * exponent, exponent, base ** (exponent - 1)], "เปลี่ยนรูปล็อกเป็นเลขยกกำลัง: x = ฐาน^ค่า log", `x = ${base}^${exponent} = ${value}`, { base, exponent, value });
    }
    case "analytic-geometry": {
      const x1 = int(-8, 2), y1 = int(-8, 2), [dx, dy, distance] = choose([[3, 4, 5], [5, 12, 13], [8, 15, 17]]), x2 = x1 + dx, y2 = y1 + dy;
      if (variant === 0) return answer(`จุดกึ่งกลางของ A(${x1}, ${y1}) และ B(${x2}, ${y2}) คือจุดใด?`, `(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`, [`(${x1 + x2}, ${y1 + y2})`, `(${dx}, ${dy})`, `(${(x2 - x1) / 2}, ${(y2 - y1) / 2})`], "หาค่าเฉลี่ยพิกัด x และค่าเฉลี่ยพิกัด y", `((${x1}+${x2})/2, (${y1}+${y2})/2) = (${(x1 + x2) / 2}, ${(y1 + y2) / 2})`, { x1, y1, x2, y2 });
      if (variant === 1) return answer(`ระยะระหว่าง A(${x1}, ${y1}) และ B(${x2}, ${y2}) เท่าใด?`, distance, [dx + dy, Math.abs(dx - dy), distance + 1], "ใช้สูตรระยะทาง √((x₂−x₁)²+(y₂−y₁)²)", `√(${dx}² + ${dy}²) = ${distance}`, { x1, y1, x2, y2, dx, dy, distance });
      if (variant === 2) return answer(`ความชันของเส้นตรงผ่าน A(${x1}, ${y1}) และ B(${x2}, ${y2}) เท่ากับเท่าใด?`, fraction(dy, dx), [fraction(dx, dy), String(dy), String(dx)], "ความชัน = (y₂−y₁)/(x₂−x₁)", `(${y2}−${y1})/(${x2}−${x1}) = ${dy}/${dx} = ${fraction(dy, dx)}`, { x1, y1, x2, y2 });
      return answer(`เส้นตรงผ่านจุด (${x1}, ${y1}) มีความชัน ${fraction(dy, dx)} จงหาค่า y-intercept เมื่อใช้รูป y = mx + b`, fraction(y1 * dx - dy * x1, dx), [String(y1), String(y2), fraction(y1 * dx + dy * x1, dx)], "แทนจุดลงใน y = mx + b แล้วแก้หา b", `b = ${y1} − (${fraction(dy, dx)})(${x1}) = ${fraction(y1 * dx - dy * x1, dx)}`, { x1, y1, slope: fraction(dy, dx) });
    }
    case "matrices": {
      const a = int(1, 5), b = int(1, 5), c = int(1, 5), d = int(1, 5), e = int(1, 5), f = int(1, 5), g = int(1, 5), h = int(1, 5);
      if (variant === 0) return answer(`จงหาผลบวก [[${a}, ${b}], [${c}, ${d}]] + [[${e}, ${f}], [${g}, ${h}]]`, `[[${a + e}, ${b + f}], [${c + g}, ${d + h}]]`, [`[[${a * e}, ${b * f}], [${c * g}, ${d * h}]]`, `[[${a + f}, ${b + e}], [${c + h}, ${d + g}]]`, `[[${a + e}, ${b + f}]]`], "บวกสมาชิกตำแหน่งเดียวกันของเมทริกซ์", `บวกแต่ละตำแหน่ง ได้ [[${a + e}, ${b + f}], [${c + g}, ${d + h}]]`, { A: [[a, b], [c, d]], B: [[e, f], [g, h]] });
      if (variant === 1) {
        const det = a * d - b * c;
        return answer(`ดีเทอร์มิแนนต์ของ [[${a}, ${b}], [${c}, ${d}]] มีค่าเท่าใด?`, det, [a * d + b * c, a + d - b - c, a * c - b * d], "สำหรับ 2×2 ใช้ ad − bc", `${a}×${d} − ${b}×${c} = ${det}`, { A: [[a, b], [c, d]] });
      }
      if (variant === 2) {
        const k = int(2, 5);
        return answer(`จงหา ${k} × [[${a}, ${b}], [${c}, ${d}]]`, `[[${k * a}, ${k * b}], [${k * c}, ${k * d}]]`, [`[[${a + k}, ${b + k}], [${c + k}, ${d + k}]]`, `[[${a * k}, ${b}, ${c * k}, ${d}]]`, `[[${a}, ${b}], [${c}, ${d}]]`], "คูณสเกลาร์กับสมาชิกทุกตำแหน่ง", `คูณทุกช่องด้วย ${k} ได้ [[${k * a}, ${k * b}], [${k * c}, ${k * d}]]`, { k, A: [[a, b], [c, d]] });
      }
      const sum = a * e + b * g;
      return answer(`สมาชิกแถว 1 คอลัมน์ 1 ของ [[${a}, ${b}], [${c}, ${d}]] × [[${e}, ${f}], [${g}, ${h}]] เท่ากับเท่าใด?`, sum, [a * e + b * f, a + e, a * g + b * h], "คูณสมาชิกแถวที่ 1 ของเมทริกซ์แรกกับสมาชิกคอลัมน์ที่ 1 ของเมทริกซ์ที่สองแล้วบวก", `${a}×${e} + ${b}×${g} = ${sum}`, { A: [[a, b], [c, d]], B: [[e, f], [g, h]] });
    }
    case "vectors": {
      const x = int(1, 8), y = int(1, 8), a = int(1, 7), b = int(1, 7);
      if (variant === 0) return answer(`กำหนด u = (${x}, ${y}) และ v = (${a}, ${b}) จงหา u + v`, `(${x + a}, ${y + b})`, [`(${x + b}, ${y + a})`, `(${x - a}, ${y - b})`, `(${x * a}, ${y * b})`], "บวกองค์ประกอบพิกัดที่อยู่ตำแหน่งเดียวกัน", `u + v = (${x}+${a}, ${y}+${b}) = (${x + a}, ${y + b})`, { u: [x, y], v: [a, b] });
      if (variant === 1) {
        const p = choose([[3, 4], [5, 12], [8, 15]]), magnitude = Math.sqrt(p[0] ** 2 + p[1] ** 2);
        return answer(`เวกเตอร์ v = (${p[0]}, ${p[1]}) มีขนาดเท่าใด?`, magnitude, [p[0] + p[1], Math.abs(p[1] - p[0]), magnitude + 1], "ขนาดเวกเตอร์ (a,b) = √(a²+b²)", `|v| = √(${p[0]}² + ${p[1]}²) = ${magnitude}`, { vector: p });
      }
      if (variant === 2) return answer(`ผลคูณจุดของ u = (${x}, ${y}) และ v = (${a}, ${b}) เท่ากับเท่าใด?`, x * a + y * b, [x * a - y * b, (x + y) * (a + b), x + a + y + b], "คูณองค์ประกอบที่ตรงกันแล้วบวกผลคูณ", `${x}×${a} + ${y}×${b} = ${x * a + y * b}`, { u: [x, y], v: [a, b] });
      const k = int(2, 5);
      return answer(`ถ้า v = (${x}, ${y}) แล้ว ${k}v เท่ากับเวกเตอร์ใด?`, `(${k * x}, ${k * y})`, [`(${x + k}, ${y + k})`, `(${x}, ${k * y})`, `(${k + x}, ${k + y})`], "คูณสเกลาร์กับทุกองค์ประกอบของเวกเตอร์", `${k}(${x}, ${y}) = (${k * x}, ${k * y})`, { vector: [x, y], scalar: k });
    }
    case "complex": {
      const a = int(1, 7), b = int(1, 7), c = int(1, 7), d = int(1, 7);
      if (variant === 0) return answer(`จงบวก (${a} + ${b}i) + (${c} + ${d}i)`, `${a + c} + ${b + d}i`, [`${a + b} + ${c + d}i`, `${a - c} + ${b - d}i`, `${a * c} + ${b * d}i`], "บวกส่วนจริงกับส่วนจริง และส่วนจินตภาพกับส่วนจินตภาพ", `(${a}+${c}) + (${b}+${d})i = ${a + c} + ${b + d}i`, { a, b, c, d });
      if (variant === 1) return answer(`จงคูณ (${a} + ${b}i)(${c} + ${d}i)`, `${a * c - b * d} + ${a * d + b * c}i`, [`${a * c + b * d} + ${a * d - b * c}i`, `${a + c} + ${b + d}i`, `${a * c} + ${b * d}i`], "กระจายพจน์และใช้ i² = −1", `ได้ ${a * c} + ${a * d}i + ${b * c}i + ${b * d}i² = ${a * c - b * d} + ${a * d + b * c}i`, { a, b, c, d });
      if (variant === 2) {
        const p = choose([[3, 4], [5, 12], [8, 15]]);
        return answer(`มอดูลัสของจำนวนเชิงซ้อน ${p[0]} + ${p[1]}i เท่ากับเท่าใด?`, Math.sqrt(p[0] ** 2 + p[1] ** 2), [p[0] + p[1], p[1] - p[0], p[0] * p[1]], "|a+bi| = √(a²+b²)", `√(${p[0]}² + ${p[1]}²) = ${Math.sqrt(p[0] ** 2 + p[1] ** 2)}`, { a: p[0], b: p[1] });
      }
      return answer(`สังยุคของ ${a} + ${b}i คือข้อใด?`, `${a} − ${b}i`, [`−${a} + ${b}i`, `${b} + ${a}i`, `${a} + ${b}i`], "สังยุคเปลี่ยนเครื่องหมายของส่วนจินตภาพ", `สังยุคของ ${a} + ${b}i คือ ${a} − ${b}i`, { a, b });
    }
    case "counting": {
      if (variant === 0) {
        const shirts = int(3, 8), pants = int(2, 6);
        return answer(`มีเสื้อ ${shirts} แบบและกางเกง ${pants} แบบ จัดชุดเสื้อกับกางเกงได้กี่แบบ?`, shirts * pants, [shirts + pants, shirts * pants - 1, shirts ** pants], "หลักการคูณ: จำนวนทางเลือกแต่ละขั้นนำมาคูณกัน", `${shirts} × ${pants} = ${shirts * pants} แบบ`, { shirts, pants });
      }
      if (variant === 1) {
        const n = int(4, 7), value = [1, 1, 2, 6, 24, 120, 720, 5040][n];
        return answer(`จัดเรียงหนังสือที่แตกต่างกัน ${n} เล่มบนชั้นได้กี่วิธี?`, value, [n * n, n * (n - 1), value / n], "การเรียงสิ่งของต่างกัน n ชิ้นมี n! วิธี", `${n}! = ${value}`, { n });
      }
      if (variant === 2) {
        const n = int(5, 9), k = int(2, Math.min(4, n - 1));
        let value = 1;
        for (let i = 1; i <= k; i += 1) value = value * (n - k + i) / i;
        return answer(`เลือกตัวแทน ${k} คนจากนักเรียน ${n} คนโดยไม่สนลำดับ ได้กี่วิธี?`, value, [n ** k, n * k, value * k], "ใช้จำนวนวิธีเลือก C(n,k) เพราะไม่สนลำดับ", `C(${n},${k}) = ${value}`, { n, k });
      }
      const n = int(5, 9), k = 3, value = n * (n - 1) * (n - 2);
      return answer(`เลือกประธาน รองประธาน และเลขานุการจากคน ${n} คน ได้กี่วิธี?`, value, [n ** 3, n * (n - 1) / 2, n + (n - 1) + (n - 2)], "ตำแหน่งต่างกันจึงสนลำดับ: n × (n−1) × (n−2)", `${n} × ${n - 1} × ${n - 2} = ${value}`, { n, positions: k });
    }
    case "sequence": {
      if (variant === 0) {
        const first = int(1, 10), difference = int(2, 7), n = int(5, 12), value = first + (n - 1) * difference;
        return answer(`ลำดับเลขคณิตมีพจน์แรก ${first} และผลต่างร่วม ${difference} พจน์ที่ ${n} เท่ากับเท่าใด?`, value, [first + n * difference, first * n, value - difference], "ใช้ aₙ = a₁ + (n−1)d", `${first} + (${n}−1)×${difference} = ${value}`, { first, difference, n });
      }
      if (variant === 1) {
        const first = int(1, 5), ratio = int(2, 4), n = int(4, 7), value = first * ratio ** (n - 1);
        return answer(`ลำดับเรขาคณิตมีพจน์แรก ${first} และอัตราส่วนร่วม ${ratio} พจน์ที่ ${n} มีค่าเท่าใด?`, value, [first * ratio * n, first + ratio ** n, value / ratio], "ใช้ aₙ = a₁rⁿ⁻¹", `${first} × ${ratio}^${n - 1} = ${value}`, { first, ratio, n });
      }
      if (variant === 2) {
        const first = int(1, 8), difference = int(1, 5), n = int(4, 10), last = first + (n - 1) * difference, sum = n * (first + last) / 2;
        return answer(`ผลบวก n พจน์แรกของลำดับเลขคณิตที่มี a₁=${first}, d=${difference}, n=${n} เท่ากับเท่าใด?`, sum, [n * last, n * first, first + last], "ใช้ Sₙ = n(a₁+aₙ)/2", `aₙ = ${last}; Sₙ = ${n}(${first}+${last})/2 = ${sum}`, { first, difference, n, last });
      }
      const first = int(1, 14), difference = int(2, 8), value = first + 3 * difference;
      return answer(`ลำดับเลขคณิตเริ่ม ${first}, ${first + difference}, ${first + 2 * difference}, … พจน์ถัดไปคือเท่าใด?`, value, [first + 2 * difference, value + difference, first * difference], "ผลต่างระหว่างพจน์ติดกันคงที่", `ผลต่างร่วม = ${difference}; พจน์ถัดไป = ${first + 2 * difference} + ${difference} = ${value}`, { first, difference });
    }
    case "calculus": {
      if (variant === 0) {
        const a = int(2, 7), power = int(2, 5), x = int(1, 5), value = a * power * x ** (power - 1);
        return answer(`ถ้า f(x) = ${a}x^${power} จงหา f'(${x})`, value, [a * x ** power, a * (power - 1) * x, a * power * x ** power], "ใช้กฎกำลัง: d/dx(axⁿ) = anxⁿ⁻¹", `f'(x) = ${a * power}x^${power - 1}; f'(${x}) = ${value}`, { a, power, x });
      }
      if (variant === 1) {
        const a = int(2, 7), b = int(-6, 8), x = int(1, 6), value = 2 * a * x + b;
        return answer(`อนุพันธ์ของ f(x) = ${a}x² ${signed(b)}x ที่ x=${x} มีค่าเท่าใด?`, value, [a * x * x + b * x, 2 * a + b, 2 * a * x - b], "หาอนุพันธ์ทีละพจน์ก่อน แล้วแทน x", `f'(x) = ${2 * a}x ${signed(b)}; f'(${x}) = ${value}`, { a, b, x });
      }
      if (variant === 2) {
        const a = int(2, 6), b = int(1, 8), c = int(-7, 9), x = int(-2, 5), value = a * x * x + b * x + c;
        return answer(`จงหา lim(x→${x}) [${a}x² + ${b}x ${signed(c)}]`, value, [a * x + b + c, value + x, -value], "พหุนามต่อเนื่อง จึงแทนค่า x ได้โดยตรง", `แทน x=${x}: ${a}(${x})² + ${b}(${x}) ${signed(c)} = ${value}`, { a, b, c, x });
      }
      const a = int(2, 8), value = fraction(a, 3);
      return answer(`∫ ${a}x² dx เท่ากับข้อใด?`, `${value}x³ + C`, [`${a}x³ + C`, `${2 * a}x + C`, `${value}x² + C`], "ใช้กฎปริพันธ์กำลัง: ∫xⁿdx = xⁿ⁺¹/(n+1) + C", `${a} × x³/3 = ${value}x³ + C`, { coefficient: a, power: 2 });
    }
    case "qualitative-data": {
      if (variant === 0) return answer("ข้อมูล ‘สีที่ชอบ’ เป็นข้อมูลเชิงคุณภาพระดับใด?", "นามบัญญัติ", ["อันดับ", "อันตรภาค", "อัตราส่วน"], "สีเป็นกลุ่มประเภทที่ไม่มีลำดับมากน้อย", "หมวดสีไม่มีลำดับ จึงเป็นข้อมูลนามบัญญัติ", { variable: "สีที่ชอบ" });
      if (variant === 1) return answer("ระดับความพึงพอใจ ‘น้อย ปานกลาง มาก’ เป็นข้อมูลเชิงคุณภาพระดับใด?", "อันดับ", ["นามบัญญัติ", "อัตราส่วน", "ข้อมูลต่อเนื่อง"], "คำตอบมีลำดับจากน้อยไปมาก", "ระดับความพึงพอใจเรียงลำดับได้ จึงเป็นข้อมูลอันดับ", { variable: "ความพึงพอใจ" });
      if (variant === 2) return answer("กราฟชนิดใดเหมาะสำหรับเปรียบเทียบจำนวนผู้ชอบหมวดหมู่สีต่าง ๆ?", "แผนภูมิแท่ง", ["ฮิสโตแกรม", "แผนภาพกล่อง", "กราฟเส้นต่อเนื่อง"], "ข้อมูลเป็นหมวดหมู่แยกจากกัน จึงเปรียบเทียบด้วยแท่ง", "แผนภูมิแท่งแสดงความถี่ของแต่ละหมวดหมู่ได้ชัดเจน", { variable: "หมวดหมู่" });
      return answer("ข้อใดเป็นตัวแปรเชิงคุณภาพ?", "ประเภทวิชาที่นักเรียนชอบ", ["ส่วนสูงของนักเรียน", "เวลาที่ใช้ทำข้อสอบ", "จำนวนหนังสือที่อ่าน"], "ตัวแปรเชิงคุณภาพบอกประเภทหรือหมวดหมู่", "ประเภทวิชาที่ชอบเป็นหมวดหมู่ ไม่ใช่ค่าที่วัดเป็นจำนวน", { category: "qualitative" });
    }
    case "quantitative-data": {
      if (variant === 0) return answer("จำนวนพี่น้องของนักเรียนเป็นข้อมูลเชิงปริมาณชนิดใด?", "ไม่ต่อเนื่อง", ["ต่อเนื่อง", "นามบัญญัติ", "อันดับ"], "จำนวนพี่น้องนับเป็นจำนวนเต็มแยกค่าได้", "จำนวนพี่น้องเป็นข้อมูลเชิงปริมาณไม่ต่อเนื่อง", { variable: "จำนวนพี่น้อง" });
      if (variant === 1) {
        const values = [int(5, 15), int(16, 25), int(26, 35), int(36, 45)], mean = values.reduce((s, x) => s + x, 0) / values.length;
        return answer(`ค่าเฉลี่ยของข้อมูล ${values.join(", ")} เท่ากับเท่าใด?`, mean, [values[0], values[3], mean + 2], "รวมค่าตัวเลขแล้วหารด้วยจำนวนข้อมูล", `(${values.join("+")}) ÷ 4 = ${mean}`, { values });
      }
      if (variant === 2) return answer("ข้อมูลส่วนสูงของนักเรียนจัดเป็นข้อมูลเชิงปริมาณชนิดใด?", "ต่อเนื่อง", ["ไม่ต่อเนื่อง", "นามบัญญัติ", "อันดับ"], "ส่วนสูงวัดได้ละเอียดต่อเนื่องในช่วงหนึ่ง", "ส่วนสูงสามารถมีค่าได้ต่อเนื่อง เช่น 160.2 ซม.", { variable: "ส่วนสูง" });
      const low = int(8, 20), high = low + int(10, 30);
      return answer(`ชุดข้อมูลมีค่าน้อยสุด ${low} และค่ามากสุด ${high} พิสัยเป็นเท่าใด?`, high - low, [high + low, high, low], "พิสัย = ค่าสูงสุด − ค่าต่ำสุด", `${high} − ${low} = ${high - low}`, { low, high });
    }
    case "random-variable": {
      if (variant === 0) return answer("ตัวแปรสุ่ม X มีค่า 0 ด้วยความน่าจะเป็น 1/4 และค่า 4 ด้วยความน่าจะเป็น 3/4 ค่า E(X) เท่าใด?", 3, [1, 2, 4], "คาดหมาย = Σ[x·P(x)]", `E(X) = 0(1/4) + 4(3/4) = 3`, { values: [0, 4], probabilities: [0.25, 0.75] });
      if (variant === 1) return answer("ทอดลูกเต๋าเที่ยงตรง 1 ลูก ให้ X เป็นแต้มที่ได้ ค่า E(X) เท่าใด?", "3.5", ["3", "4", "6"], "ค่าเฉลี่ยของแต้ม 1 ถึง 6 คือผลรวม ÷ 6", `E(X) = (1+2+3+4+5+6)/6 = 21/6 = 3.5`, { outcomes: [1, 2, 3, 4, 5, 6] });
      if (variant === 2) {
        const p = choose([0.2, 0.25, 0.4, 0.6]), reward = int(10, 50) * 10, expected = Number((p * reward).toFixed(2));
        return answer(`เกมให้รางวัล ${reward} คะแนนด้วยโอกาส ${p} และ 0 คะแนนในกรณีอื่น ค่าคาดหมายของคะแนนเป็นเท่าใด?`, expected, [reward, Number((reward * (1 - p)).toFixed(2)), expected + 10], "คูณแต่ละผลลัพธ์ด้วยความน่าจะเป็นแล้วบวกกัน", `E(X) = ${reward}×${p} + 0×${1 - p} = ${expected}`, { p, reward });
      }
      return answer("ตัวแปรสุ่ม X มี P(X=0)=0.2 และ P(X=1)=0.3 ความน่าจะเป็นที่เหลือสำหรับ X=2 เท่ากับเท่าใด?", 0.5, [0.2, 0.3, 0.8], "ผลรวมความน่าจะเป็นทั้งหมดต้องเท่ากับ 1", `P(X=2) = 1 − 0.2 − 0.3 = 0.5`, { probabilities: [0.2, 0.3] });
    }
    case "mixed-review":
    default: {
      const a = int(3, 20), b = int(2, 12), value = a * b;
      return answer(`ทบทวนเรื่อง ${topic}: ถ้ามี ${a} กลุ่ม กลุ่มละ ${b} หน่วย จะมีทั้งหมดกี่หน่วย?`, value, [a + b, value - b, a * (b + 1)], "จำนวนกลุ่ม × จำนวนหน่วยต่อกลุ่ม", `${a} × ${b} = ${value}`, { topic, a, b });
    }
  }
}
