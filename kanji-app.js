const rawLessons = window.N3_KANJI_LESSONS || [];
const rawKanji = window.N3_KANJI || [];
const readingData = window.N3_KANJI_READINGS || {};
const vocabularyData = window.N3_KANJI_VOCABULARY || {};
const gradeKey = "jlpt-n3-kanji-grades-v2";
const legacyKnownKey = "jlpt-n3-known-kanji";

const gradeLevels = [
  { label: "เริ่มเรียน", short: "เริ่มเรียน" },
  { label: "กำลังจำ", short: "กำลังจำ" },
  { label: "จำได้", short: "จำได้" },
  { label: "แม่นแล้ว", short: "แม่นแล้ว" }
];

const allKanji = rawKanji.map((item) => ({
  ...item,
  on: readingData[item.kanji]?.on || [],
  kun: readingData[item.kanji]?.kun || [],
  vocabulary: vocabularyData[item.kanji] || [{ word: item.word, reading: item.reading, meaning: item.meaning }]
}));
const itemById = new Map(allKanji.map((item) => [item.id, item]));
const lessons = rawLessons.map((lesson) => ({ ...lesson, items: lesson.items.map((item) => itemById.get(item.id)).filter(Boolean) }));
const allVocabulary = uniqueVocabulary(allKanji.flatMap((item) => item.vocabulary.map((entry, index) => ({ ...entry, kanji: item.kanji, cardId: item.id, id: `${item.id}-${index}` }))));

const state = {
  week: 1,
  lessonId: lessons[0]?.id,
  query: "",
  mode: "meaning",
  grades: loadGrades(),
  question: null,
  answered: false,
  match: null,
  openCardId: null,
  sessionCorrect: 0,
  sessionTotal: 0
};

const $ = (id) => document.getElementById(id);
const els = {
  search: $("kanjiSearch"), lessonSelect: $("lessonSelect"), weekTabs: $("weekTabs"), lessonList: $("lessonList"),
  topKnown: $("topKnown"), progressPercent: $("progressPercent"), progressFill: $("progressFill"), masteryCaption: $("masteryCaption"),
  lessonWeek: $("lessonWeek"), lessonDay: $("lessonDay"), lessonTitle: $("lessonTitle"), lessonTitleTh: $("lessonTitleTh"),
  lessonScene: $("lessonScene"), lessonKnown: $("lessonKnown"), lessonVocab: $("lessonVocab"), lessonGrade: $("lessonGrade"), scoreDots: $("scoreDots"),
  masteryRing: $("masteryRing"), masteryPercent: $("masteryPercent"), grid: $("kanjiGrid"), searchSummary: $("searchSummary"),
  practice: $("practiceCard"), practiceSession: $("practiceSession"), practiceAccuracy: $("practiceAccuracy"),
  startPractice: $("startPractice"), shuffleLesson: $("shuffleLesson"),
  detailPanel: $("detailPanel"), detailBackdrop: $("detailBackdrop"), detailContent: $("detailContent"), detailClose: $("detailClose")
};

init();

function init() {
  renderLessonSelect();
  renderAll();

  els.search.addEventListener("input", (event) => {
    state.query = event.target.value.trim();
    renderCards();
  });
  els.lessonSelect.addEventListener("change", () => selectLesson(els.lessonSelect.value));
  els.startPractice.addEventListener("click", () => {
    newQuestion();
    $("kanjiPractice").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  els.shuffleLesson.addEventListener("click", () => {
    const pool = lessons.filter((lesson) => lesson.id !== state.lessonId);
    selectLesson(pool[Math.floor(Math.random() * pool.length)].id);
  });
  document.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => {
    state.mode = button.dataset.mode;
    document.querySelectorAll("[data-mode]").forEach((item) => item.classList.toggle("active", item === button));
    newQuestion();
  }));
  els.detailClose.addEventListener("click", closeDetail);
  els.detailBackdrop.addEventListener("click", closeDetail);
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeDetail(); });
}

function readStored(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function loadGrades() {
  const stored = readStored(gradeKey, null);
  if (stored && typeof stored === "object") return stored;
  const migrated = {};
  readStored(legacyKnownKey, []).forEach((id) => { migrated[id] = 2; });
  return migrated;
}

function gradeOf(id) {
  return Math.max(0, Math.min(3, Number(state.grades[id]) || 0));
}

function currentLesson() {
  return lessons.find((lesson) => lesson.id === state.lessonId) || lessons[0];
}

function renderAll() {
  renderWeekTabs();
  renderLessonList();
  renderHero();
  renderCards();
  renderStats();
  newQuestion();
}

function renderWeekTabs() {
  els.weekTabs.innerHTML = Array.from({ length: 6 }, (_, index) => {
    const week = index + 1;
    return `<button class="${week === state.week ? "active" : ""}" data-week="${week}" type="button">W${week}</button>`;
  }).join("");
  els.weekTabs.querySelectorAll("[data-week]").forEach((button) => button.addEventListener("click", () => {
    state.week = Number(button.dataset.week);
    state.lessonId = lessons.find((lesson) => lesson.week === state.week)?.id;
    state.query = "";
    els.search.value = "";
    renderAll();
    renderLessonSelect();
  }));
}

function renderLessonSelect() {
  els.lessonSelect.innerHTML = lessons.map((lesson) => `<option value="${lesson.id}">สัปดาห์ ${lesson.week} · วันที่ ${lesson.day} — ${lesson.titleTh}</option>`).join("");
  els.lessonSelect.value = state.lessonId;
}

function renderLessonList() {
  const weekLessons = lessons.filter((lesson) => lesson.week === state.week);
  els.lessonList.innerHTML = weekLessons.map((lesson) => {
    const learned = lesson.items.filter((item) => gradeOf(item.id) >= 2).length;
    const active = lesson.id === state.lessonId;
    return `<button class="lesson-button ${active ? "active" : ""}" data-lesson="${lesson.id}" type="button">
      <span class="day-number">D${String(lesson.day).padStart(2, "0")}</span>
      <span class="lesson-button-copy"><b>${lesson.title}</b><small>${lesson.titleTh}</small></span>
      <span class="lesson-count">${learned}/${lesson.items.length}</span>
    </button>`;
  }).join("");
  els.lessonList.querySelectorAll("[data-lesson]").forEach((button) => button.addEventListener("click", () => selectLesson(button.dataset.lesson)));
}

function selectLesson(id) {
  const lesson = lessons.find((item) => item.id === id);
  if (!lesson) return;
  closeDetail();
  state.lessonId = id;
  state.week = lesson.week;
  state.query = "";
  els.search.value = "";
  renderLessonSelect();
  renderAll();
  $("lessonTop").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderHero() {
  const lesson = currentLesson();
  const grades = lesson.items.map((item) => gradeOf(item.id));
  const learned = grades.filter((grade) => grade >= 2).length;
  const average = grades.reduce((sum, grade) => sum + grade, 0) / Math.max(grades.length, 1);
  els.lessonWeek.textContent = `สัปดาห์ ${lesson.week}`;
  els.lessonDay.textContent = `วันที่ ${lesson.day}`;
  els.lessonTitle.textContent = lesson.title;
  els.lessonTitleTh.textContent = lesson.titleTh;
  els.lessonScene.textContent = lesson.scene;
  els.lessonKnown.textContent = `${learned} / ${lesson.items.length}`;
  els.lessonVocab.textContent = lessonVocabularyPool().length;
  els.lessonGrade.textContent = gradeLevels[Math.min(3, Math.round(average))].label;
  els.lessonGrade.dataset.level = String(Math.min(3, Math.round(average)));
  els.scoreDots.innerHTML = lesson.items.map((item) => `<i class="level-${gradeOf(item.id)}" title="${item.kanji}: ${gradeLevels[gradeOf(item.id)].label}"></i>`).join("");
}

function searchResults() {
  const query = state.query.toLocaleLowerCase("th");
  if (!query) return currentLesson().items;
  return allKanji.filter((item) => {
    const vocabularyText = item.vocabulary.flatMap((entry) => [entry.word, entry.reading, entry.meaning]);
    return [item.kanji, item.word, item.reading, item.meaning, item.lessonTitle, item.lessonTitleTh, ...item.on, ...item.kun, ...vocabularyText]
      .join(" ").toLocaleLowerCase("th").includes(query);
  });
}

function renderCards() {
  const items = searchResults();
  els.searchSummary.hidden = !state.query;
  if (state.query) els.searchSummary.innerHTML = `<span>SEARCH RESULT</span><b>${escapeHtml(state.query)}</b><strong>${items.length} ตัว</strong>`;
  els.grid.innerHTML = items.length
    ? items.map((item, index) => kanjiCard(item, index)).join("")
    : `<div class="empty-result"><b>ไม่พบคำที่ค้นหา</b><span>ลองค้นด้วยคันจิ ฮิรางานะ เสียงอง/คุน หรือคำแปลไทย</span></div>`;
  bindCardEvents();
}

function kanjiCard(item, index) {
  const grade = gradeOf(item.id);
  const known = grade >= 2;
  const previews = item.vocabulary.slice(0, 2);
  return `<article class="kanji-card level-${grade}" data-card="${item.id}" style="--delay:${Math.min(index, 12) * 42}ms">
    <header class="card-top">
      <span class="book-index">W${item.week} / D${item.day}</span>
      <button class="known-button ${known ? "active" : ""}" data-known="${item.id}" type="button" aria-pressed="${known}"><i></i>${known ? "จำแล้ว" : "ยังไม่จำ"}</button>
    </header>
    <div class="card-core">
      <div class="glyph-wrap"><span class="glyph">${item.kanji}</span><span class="stroke-grid" aria-hidden="true"></span></div>
      <div class="reading-stack">
        ${readingRow("ON", item.on)}
        ${readingRow("KUN", item.kun)}
      </div>
    </div>
    <div class="vocab-preview">
      ${previews.map((entry) => `<div><span><b>${entry.word}</b><small>${entry.reading}</small></span><p>${entry.meaning}</p></div>`).join("")}
    </div>
    <div class="card-footer">
      <span class="grade-signal"><i style="--level:${grade}"></i>${gradeLevels[grade].short}</span>
      <button class="vault-button" data-detail="${item.id}" type="button">คลังคำทั้งหมด <b>${item.vocabulary.length}</b><span aria-hidden="true">→</span></button>
    </div>
  </article>`;
}

function readingRow(label, readings) {
  return `<div><span>${label}</span><b>${readings.length ? readings.map(escapeHtml).join(" · ") : "—"}</b></div>`;
}

function bindCardEvents() {
  els.grid.querySelectorAll("[data-known]").forEach((button) => button.addEventListener("click", () => toggleKnown(button.dataset.known)));
  els.grid.querySelectorAll("[data-detail]").forEach((button) => button.addEventListener("click", () => openDetail(button.dataset.detail)));
  if (!window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  els.grid.querySelectorAll("[data-card]").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const bounds = card.getBoundingClientRect();
      const rotateX = ((event.clientY - bounds.top) / bounds.height - 0.5) * -4;
      const rotateY = ((event.clientX - bounds.left) / bounds.width - 0.5) * 5;
      card.style.setProperty("--rx", `${rotateX}deg`);
      card.style.setProperty("--ry", `${rotateY}deg`);
      card.style.setProperty("--mx", `${event.clientX - bounds.left}px`);
      card.style.setProperty("--my", `${event.clientY - bounds.top}px`);
    });
    card.addEventListener("pointerleave", () => { card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg"); });
  });
}

function toggleKnown(id) {
  setGrade(id, gradeOf(id) >= 2 ? 0 : 2);
}

function setGrade(id, grade) {
  state.grades[id] = Number(grade);
  localStorage.setItem(gradeKey, JSON.stringify(state.grades));
  renderLessonList();
  renderHero();
  renderCards();
  renderStats();
  if (state.openCardId === id) renderDetail(id);
}

function renderStats() {
  const known = allKanji.filter((item) => gradeOf(item.id) >= 2).length;
  const points = allKanji.reduce((sum, item) => sum + gradeOf(item.id), 0);
  const percent = Math.round((points / (allKanji.length * 3)) * 100);
  els.topKnown.textContent = `${known} / ${allKanji.length}`;
  els.progressPercent.textContent = `${percent}%`;
  els.progressFill.style.width = `${percent}%`;
  els.masteryPercent.textContent = `${percent}%`;
  els.masteryRing.style.setProperty("--progress", percent);
  els.masteryCaption.textContent = percent < 20 ? "เริ่มสร้างฐานความจำทีละบท" : percent < 60 ? "ความจำกำลังก่อตัว รักษาจังหวะไว้" : percent < 90 ? "เข้าเขตแม่นยำแล้ว ทบทวนจุดอ่อนต่อ" : "ระดับพร้อมสอบ รักษาความแม่นไว้";
}

function openDetail(id) {
  state.openCardId = id;
  renderDetail(id);
  els.detailBackdrop.hidden = false;
  requestAnimationFrame(() => {
    document.body.classList.add("panel-open");
    els.detailPanel.setAttribute("aria-hidden", "false");
  });
}

function closeDetail() {
  if (!state.openCardId) return;
  state.openCardId = null;
  document.body.classList.remove("panel-open");
  els.detailPanel.setAttribute("aria-hidden", "true");
  window.setTimeout(() => { if (!state.openCardId) els.detailBackdrop.hidden = true; }, 280);
}

function renderDetail(id) {
  const item = itemById.get(id);
  if (!item) return;
  const grade = gradeOf(id);
  els.detailContent.innerHTML = `<div class="detail-heading">
      <div class="detail-code">KANJI ${String(allKanji.indexOf(item) + 1).padStart(3, "0")} / 336</div>
      <div class="detail-glyph">${item.kanji}</div>
      <div><h2>${item.word}</h2><p>${item.meaning}</p></div>
    </div>
    <div class="detail-readings">
      ${readingRow("音読み / ON", item.on)}
      ${readingRow("訓読み / KUN", item.kun)}
    </div>
    <section class="grade-control">
      <header><span>MEMORY GRADE</span><strong>${gradeLevels[grade].label}</strong></header>
      <div>${gradeLevels.map((level, index) => `<button class="${index === grade ? "active" : ""}" data-grade="${index}" type="button"><i></i><span>${level.label}</span></button>`).join("")}</div>
    </section>
    <section class="vocabulary-vault">
      <header><div><span>VOCABULARY VAULT</span><h3>คำศัพท์ทั้งหมดของ ${item.kanji}</h3></div><strong>${item.vocabulary.length}</strong></header>
      <div class="vocabulary-list">${item.vocabulary.map((entry, index) => `<article><span>${String(index + 1).padStart(2, "0")}</span><div><b>${entry.word}</b><small>${entry.reading}</small></div><p>${entry.meaning}</p></article>`).join("")}</div>
    </section>`;
  els.detailContent.querySelectorAll("[data-grade]").forEach((button) => button.addEventListener("click", () => setGrade(id, button.dataset.grade)));
}

function lessonVocabularyPool() {
  return uniqueVocabulary(currentLesson().items.flatMap((item) => item.vocabulary.map((entry, index) => ({ ...entry, kanji: item.kanji, cardId: item.id, id: `${item.id}-${index}` }))));
}

function uniqueVocabulary(entries) {
  const seen = new Set();
  return entries.filter((entry) => {
    const key = `${entry.word}|${entry.reading}|${entry.meaning}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function newQuestion() {
  state.answered = false;
  if (state.mode === "match") {
    state.match = createMatchSet();
    renderMatch();
    return;
  }
  const pool = lessonVocabularyPool();
  state.question = pool[Math.floor(Math.random() * pool.length)];
  renderQuestion();
}

function renderQuestion() {
  const item = state.question;
  if (!item) return;
  if (state.mode === "recall") {
    els.practice.innerHTML = `<div class="recall-prompt"><span>RECALL PROMPT</span><h3>${item.meaning}</h3><p>นึกคำศัพท์ คันจิ และคำอ่านก่อนเปิดเฉลย</p></div>
      <div class="practice-actions"><button class="reveal-button" id="revealAnswer" type="button">เปิดเฉลย</button><button class="next-button" id="nextQuestion" type="button">ข้อต่อไป</button></div>`;
    $("revealAnswer").addEventListener("click", () => revealRecall(item));
    $("nextQuestion").addEventListener("click", newQuestion);
    return;
  }
  const askReading = state.mode === "reading";
  const correct = askReading ? item.reading : item.meaning;
  const source = allVocabulary.filter((candidate) => candidate.id !== item.id).map((candidate) => askReading ? candidate.reading : candidate.meaning);
  const distractors = shuffled([...new Set(source.filter((value) => value && value !== correct))]).slice(0, 3);
  const options = shuffled([correct, ...distractors]);
  els.practice.innerHTML = `<div class="question-layout"><div class="question-number">問</div><div class="question-copy"><p>${askReading ? "คำอ่านของคำศัพท์นี้คือข้อใด" : "คำศัพท์นี้มีความหมายตรงกับข้อใด"}</p><h3>${item.word}</h3><small>คันจิหลัก ${item.kanji}</small></div></div>
    <div class="answer-grid">${options.map((option, index) => `<button data-answer="${escapeAttr(option)}" type="button"><span>${String.fromCharCode(65 + index)}</span><b>${option}</b></button>`).join("")}</div>
    <div class="feedback" id="questionFeedback" aria-live="polite"></div><div class="practice-actions"><button class="next-button" id="nextQuestion" type="button">สุ่มข้อถัดไป</button></div>`;
  els.practice.querySelectorAll("[data-answer]").forEach((button) => button.addEventListener("click", () => checkAnswer(button, correct, item)));
  $("nextQuestion").addEventListener("click", newQuestion);
}

function checkAnswer(button, correct, item) {
  if (state.answered) return;
  state.answered = true;
  els.practice.querySelectorAll("[data-answer]").forEach((choice) => {
    choice.disabled = true;
    if (choice.dataset.answer === correct) choice.classList.add("correct");
  });
  const right = button.dataset.answer === correct;
  if (!right) button.classList.add("wrong");
  recordResult(right);
  $("questionFeedback").innerHTML = `<b>${right ? "ถูกต้อง" : "ยังไม่ถูก"}</b><span>${item.word}（${item.reading}）= ${item.meaning}</span>`;
  $("questionFeedback").className = `feedback show ${right ? "good" : "bad"}`;
}

function revealRecall(item) {
  const prompt = els.practice.querySelector(".recall-prompt");
  prompt.classList.add("revealed");
  prompt.innerHTML = `<span>ANSWER REVEALED</span><h3>${item.word}</h3><b>${item.reading}</b><p>${item.meaning}</p><div class="recall-grade"><button data-recall="0" type="button">ยังนึกไม่ออก</button><button data-recall="1" type="button">นึกได้แล้ว</button></div>`;
  prompt.querySelectorAll("[data-recall]").forEach((button) => button.addEventListener("click", () => {
    const recalled = button.dataset.recall === "1";
    recordResult(recalled);
    if (recalled && gradeOf(item.cardId) < 2) setGrade(item.cardId, 2);
    if (!recalled && gradeOf(item.cardId) > 1) setGrade(item.cardId, 1);
    prompt.querySelectorAll("[data-recall]").forEach((choice) => { choice.disabled = true; choice.classList.toggle("selected", choice === button); });
  }));
}

function recordResult(right) {
  state.sessionTotal += 1;
  if (right) state.sessionCorrect += 1;
  els.practiceSession.textContent = `SESSION ${state.sessionCorrect} / ${state.sessionTotal}`;
  els.practiceAccuracy.textContent = `${Math.round((state.sessionCorrect / state.sessionTotal) * 100)}%`;
}

function createMatchSet() {
  const picks = shuffled(lessonVocabularyPool()).slice(0, 4);
  return { items: picks, meanings: shuffled(picks.map((item) => ({ id: item.id, text: item.meaning }))), selected: null, solved: new Set(), mistakes: new Set() };
}

function renderMatch() {
  const match = state.match;
  els.practice.innerHTML = `<div class="match-instruction"><b>จับคู่คำศัพท์กับความหมาย</b><span>เลือกคำศัพท์ แล้วเลือกคำแปลที่สัมพันธ์กัน</span></div>
    <div class="match-board"><div>${match.items.map((item) => `<button class="match-kanji ${match.selected === item.id ? "selected" : ""} ${match.solved.has(item.id) ? "solved" : ""}" data-match-kanji="${item.id}" type="button"><b>${item.word}</b><small>${item.reading}</small></button>`).join("")}</div>
    <div>${match.meanings.map((item) => `<button class="match-meaning ${match.solved.has(item.id) ? "solved" : ""} ${match.mistakes.has(item.id) ? "shake" : ""}" data-match-meaning="${item.id}" type="button">${item.text}</button>`).join("")}</div></div>
    <div class="feedback ${match.solved.size === match.items.length ? "show good" : ""}">${match.solved.size === match.items.length ? "จับคู่ครบแล้ว ความแม่นกำลังก่อตัว" : `จับคู่แล้ว ${match.solved.size} / ${match.items.length}`}</div>
    <div class="practice-actions"><button class="next-button" id="nextQuestion" type="button">ชุดใหม่</button></div>`;
  els.practice.querySelectorAll("[data-match-kanji]").forEach((button) => button.addEventListener("click", () => {
    if (!match.solved.has(button.dataset.matchKanji)) match.selected = button.dataset.matchKanji;
    renderMatch();
  }));
  els.practice.querySelectorAll("[data-match-meaning]").forEach((button) => button.addEventListener("click", () => {
    if (!match.selected || match.solved.has(button.dataset.matchMeaning)) return;
    if (match.selected === button.dataset.matchMeaning) {
      match.solved.add(match.selected); match.selected = null; match.mistakes.clear(); recordResult(true);
    } else {
      match.mistakes = new Set([button.dataset.matchMeaning]); recordResult(false);
      window.setTimeout(() => { match.mistakes.clear(); renderMatch(); }, 420);
    }
    renderMatch();
  }));
  $("nextQuestion").addEventListener("click", newQuestion);
}

function shuffled(values) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character]);
}

function escapeAttr(value) { return escapeHtml(value); }
