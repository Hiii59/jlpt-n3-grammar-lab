const grammar = window.N3_GRAMMAR || [];
const translationChecks = window.N3_TRANSLATION_CHECKS || [];
const examples = window.N3_EXAMPLES || {};
const conjugationTypes = window.N3_CONJUGATION_TYPES || [];
const conjugationVerbs = window.N3_CONJUGATION_VERBS || [];
const conjugationGroups = window.N3_CONJUGATION_GROUPS || [];
const storageKey = "jlpt-n3-known-grammar";

const state = {
  activeDay: "all",
  query: "",
  mode: "cloze",
  known: new Set(readKnown()),
  currentEntry: null,
  currentMatchSet: [],
  selectedMatchId: null,
  matchedIds: new Set(),
  conjugationType: "te",
  conjugationVerb: null
};

const els = {
  dayList: document.getElementById("dayList"),
  grammarList: document.getElementById("grammarList"),
  searchInput: document.getElementById("searchInput"),
  totalCount: document.getElementById("totalCount"),
  knownCount: document.getElementById("knownCount"),
  progressBar: document.getElementById("progressBar"),
  progressLabel: document.getElementById("progressLabel"),
  sectionTitle: document.getElementById("sectionTitle"),
  activeScopeLabel: document.getElementById("activeScopeLabel"),
  cardsTitle: document.getElementById("cardsTitle"),
  resultCount: document.getElementById("resultCount"),
  practiceTitle: document.getElementById("practiceTitle"),
  exerciseArea: document.getElementById("exerciseArea"),
  auditList: document.getElementById("auditList"),
  shuffleButton: document.getElementById("shuffleButton"),
  practiceSelectedButton: document.getElementById("practiceSelectedButton"),
  practiceBand: document.getElementById("practiceBand"),
  conjugationPractice: document.getElementById("conjugationPractice"),
  conjugationRules: document.getElementById("conjugationRules"),
  conjugationMatrix: document.getElementById("conjugationMatrix"),
  nextConjugationButton: document.getElementById("nextConjugationButton")
};

init();

function init() {
  els.totalCount.textContent = grammar.length;
  renderDayList();
  renderCards();
  renderAudit();
  renderExercise();
  renderConjugation(true);
  updateStats();

  els.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim();
    renderCards();
  });

  document.querySelectorAll(".segment").forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      document.querySelectorAll(".segment").forEach((segment) => {
        segment.classList.toggle("active", segment === button);
      });
      renderExercise(true);
    });
  });

  els.shuffleButton.addEventListener("click", scrollToRandomCard);
  els.practiceSelectedButton.addEventListener("click", () => {
    renderExercise(true);
    els.practiceBand.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  els.nextConjugationButton.addEventListener("click", () => renderConjugation(true));
  initSectionNav();
}

function initSectionNav() {
  const links = [...document.querySelectorAll(".section-link")];
  const select = document.getElementById("sectionSelect");
  const sections = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (!sections.length || !("IntersectionObserver" in window)) return;

  select?.addEventListener("change", () => {
    const target = document.querySelector(select.value);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;

    links.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${visible.target.id}`);
    });
    if (select) select.value = `#${visible.target.id}`;
  }, { rootMargin: "-16% 0px -62% 0px", threshold: [0.05, 0.2, 0.5] });

  sections.forEach((section) => observer.observe(section));
}

function readKnown() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch {
    return [];
  }
}

function saveKnown() {
  localStorage.setItem(storageKey, JSON.stringify([...state.known]));
}

function updateStats() {
  els.knownCount.textContent = state.known.size;
  const progress = grammar.length ? Math.round((state.known.size / grammar.length) * 100) : 0;
  if (els.progressBar) els.progressBar.style.width = `${progress}%`;
  if (els.progressLabel) els.progressLabel.textContent = `${progress}%`;
}

function days() {
  return [...new Set(grammar.map((item) => item.day))].sort((a, b) => {
    const [am, ad] = a.split("-").map(Number);
    const [bm, bd] = b.split("-").map(Number);
    return am - bm || ad - bd;
  });
}

function dayLabel(day) {
  if (day === "all") return "ทั้งหมด";
  return `${day} 日目`;
}

function renderDayList() {
  const counts = grammar.reduce((map, item) => {
    map[item.day] = (map[item.day] || 0) + 1;
    return map;
  }, {});

  const allButton = dayButton("all", grammar.length);
  const dayButtons = days().map((day) => dayButton(day, counts[day] || 0)).join("");
  els.dayList.innerHTML = allButton + dayButtons;

  els.dayList.querySelectorAll(".day-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeDay = button.dataset.day;
      renderDayList();
      renderCards();
      renderExercise(true);
    });
  });
}

function dayButton(day, count) {
  const active = state.activeDay === day ? " active" : "";
  return `
    <button class="day-button${active}" data-day="${day}" type="button">
      <span>${dayLabel(day)}</span>
      <span>${count} รายการ</span>
    </button>
  `;
}

function filteredEntries() {
  const q = normalizeSearch(state.query);
  return grammar.filter((item) => {
    const inDay = state.activeDay === "all" || item.day === state.activeDay;
    if (!inDay) return false;
    if (!q) return true;
    const haystack = normalizeSearch([
      item.day,
      item.pattern,
      item.meaning,
      item.form,
      item.note,
      ...(item.aliases || [])
    ].join(" "));
    return haystack.includes(q);
  });
}

function scopeEntries() {
  const visible = filteredEntries();
  if (visible.length) return visible;
  const activeDayEntries = grammar.filter((item) => state.activeDay === "all" || item.day === state.activeDay);
  return activeDayEntries.length ? activeDayEntries : grammar;
}

function renderCards() {
  const entries = filteredEntries();
  const scope = dayLabel(state.activeDay);
  els.activeScopeLabel.textContent = scope;
  els.sectionTitle.textContent = state.activeDay === "all" ? "สรุปไวยกรณ์ทั้งหมด" : `สรุป ${scope}`;
  els.cardsTitle.textContent = state.query ? "ผลการค้นหา" : "รายการไวยกรณ์";
  els.resultCount.textContent = `${entries.length} รายการ`;
  els.practiceTitle.textContent = state.activeDay === "all" ? "ทบทวนจากทั้งหมด" : `ทบทวน ${scope}`;

  if (!entries.length) {
    els.grammarList.innerHTML = `<div class="empty-state">ไม่พบไวยกรณ์ที่ตรงกับคำค้น</div>`;
    return;
  }

  els.grammarList.innerHTML = entries.map((item) => grammarCard(item)).join("");
  els.grammarList.querySelectorAll("[data-known-toggle]").forEach((button) => {
    button.addEventListener("click", () => toggleKnown(button.dataset.knownToggle));
  });
}

function grammarCard(item) {
  const known = state.known.has(item.id);
  const tagText = item.day.includes("-7") ? "敬語" : "ไวยกรณ์";
  const itemExamples = examples[item.id] || [];
  const aliases = item.aliases?.length
    ? `<div class="tag-row">${item.aliases.slice(0, 3).map((alias) => `<span class="tag">${escapeHtml(alias)}</span>`).join("")}</div>`
    : "";
  const exampleBlock = itemExamples.length
    ? `<details class="example-block" open>
        <summary>ตัวอย่างประโยค</summary>
        <div class="example-list">
          ${itemExamples.map((example) => `
            <div class="example-item">
              <div class="example-source">${escapeHtml(example.source || "เสริม")}</div>
              <p class="example-jp">${escapeHtml(example.jp)}</p>
              <p class="example-th">${escapeHtml(example.th)}</p>
            </div>
          `).join("")}
        </div>
      </details>`
    : "";
  return `
    <article class="grammar-card${known ? " known" : ""}" id="card-${item.id}">
      <div class="card-top">
        <div class="tag-row">
          <span class="tag">${item.day} 日目</span>
          <span class="tag">${tagText}</span>
        </div>
        <button class="small-button${known ? " known" : ""}" data-known-toggle="${item.id}" type="button" aria-pressed="${known}" title="${known ? "สถานะ: จำแล้ว กดเพื่อเปลี่ยนเป็นยังไม่จำ" : "สถานะ: ยังไม่จำ กดเมื่อจำได้แล้ว"}">${known ? "จำแล้ว" : "ยังไม่จำ"}</button>
      </div>
      <p class="pattern">${escapeHtml(item.pattern)}</p>
      <p class="meaning">${escapeHtml(item.meaning)}</p>
      <p class="form">${escapeHtml(item.form)}</p>
      ${item.note ? `<p class="note">${escapeHtml(item.note)}</p>` : ""}
      ${exampleBlock}
      ${aliases}
    </article>
  `;
}

function renderAudit() {
  els.auditList.innerHTML = translationChecks.map((text) => `<div class="audit-item">${escapeHtml(text)}</div>`).join("");
}

function toggleKnown(id) {
  if (state.known.has(id)) {
    state.known.delete(id);
  } else {
    state.known.add(id);
  }
  saveKnown();
  updateStats();
  renderCards();
}

function renderExercise(forceNew = false) {
  if (state.mode === "match") {
    renderMatch(forceNew);
    return;
  }

  const pool = scopeEntries();
  if (!state.currentEntry || forceNew || !pool.some((item) => item.id === state.currentEntry.id)) {
    state.currentEntry = randomItem(pool);
  }

  if (state.mode === "choice") {
    renderChoice(state.currentEntry, pool);
  } else {
    renderCloze(state.currentEntry);
  }
}

function renderCloze(entry) {
  els.exerciseArea.innerHTML = `
    <div class="exercise-card">
      <p class="exercise-question">เติมรูปไวยกรณ์หลักให้ตรงกับคำใบ้: <strong>${escapeHtml(entry.meaning)}</strong></p>
      <div class="answer-row">
        <input id="clozeInput" type="text" placeholder="พิมพ์ เช่น ${escapeHtml(shortAnswer(entry))}" autocomplete="off" />
        <button class="primary-button" id="checkCloze" type="button">ตรวจ</button>
        <button class="ghost-button" id="showAnswer" type="button">เฉลย</button>
        <button class="ghost-button" id="nextExercise" type="button">ข้อต่อไป</button>
      </div>
      <p class="feedback" id="exerciseFeedback"></p>
      <p class="note">บท ${entry.day} 日目 - ${escapeHtml(entry.form)}</p>
    </div>
  `;

  const input = document.getElementById("clozeInput");
  const feedback = document.getElementById("exerciseFeedback");
  document.getElementById("checkCloze").addEventListener("click", () => {
    const ok = isAcceptedAnswer(input.value, entry);
    feedback.textContent = ok ? `ถูก: ${entry.pattern}` : `ยังไม่ใช่ เฉลยคือ ${entry.pattern}`;
    feedback.className = `feedback ${ok ? "good" : "bad"}`;
    if (ok) markKnown(entry.id);
  });
  document.getElementById("showAnswer").addEventListener("click", () => {
    feedback.textContent = `${entry.pattern} - ${entry.meaning}`;
    feedback.className = "feedback good";
  });
  document.getElementById("nextExercise").addEventListener("click", () => renderExercise(true));
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") document.getElementById("checkCloze").click();
  });
}

function renderChoice(entry, pool) {
  const distractorPool = pool.length >= 4 ? pool : grammar;
  const choices = shuffle([
    entry,
    ...shuffle(distractorPool.filter((item) => item.id !== entry.id)).slice(0, 3)
  ]).map((item) => ({
    id: item.id,
    text: item.meaning
  }));

  els.exerciseArea.innerHTML = `
    <div class="exercise-card">
      <p class="exercise-question">「<span class="pattern-large">${escapeHtml(entry.pattern)}</span>」 แปลว่าอะไร?</p>
      <div class="choice-grid">
        ${choices.map((choice) => `<button class="choice-button" data-choice="${choice.id}" type="button">${escapeHtml(choice.text)}</button>`).join("")}
      </div>
      <p class="feedback" id="exerciseFeedback"></p>
      <div class="answer-row">
        <button class="ghost-button" id="nextExercise" type="button">ข้อต่อไป</button>
      </div>
    </div>
  `;

  const feedback = document.getElementById("exerciseFeedback");
  els.exerciseArea.querySelectorAll("[data-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      const ok = button.dataset.choice === entry.id;
      button.classList.add(ok ? "correct" : "wrong");
      const correctButton = els.exerciseArea.querySelector(`[data-choice="${entry.id}"]`);
      correctButton?.classList.add("correct");
      feedback.textContent = ok ? "ถูกต้อง" : `ยังไม่ใช่: ${entry.meaning}`;
      feedback.className = `feedback ${ok ? "good" : "bad"}`;
      if (ok) markKnown(entry.id);
    });
  });
  document.getElementById("nextExercise").addEventListener("click", () => renderExercise(true));
}

function renderConjugation(forceNew = false) {
  if (!conjugationTypes.length || !conjugationVerbs.length) return;
  const type = conjugationTypes.find((item) => item.key === state.conjugationType) || conjugationTypes[0];
  state.conjugationType = type.key;
  if (!state.conjugationVerb || forceNew) {
    state.conjugationVerb = randomItem(conjugationVerbs);
  }
  const verb = state.conjugationVerb;
  const answer = verb[type.key];

  els.conjugationPractice.innerHTML = `
    <div class="conj-question">
      <div class="conj-meta">
        <span>${escapeHtml(verb.groupLabel || verb.group)}</span>
        <span>${escapeHtml(verb.meaning)}</span>
        ${verb.note ? `<span>${escapeHtml(verb.note)}</span>` : ""}
      </div>
      <p class="conj-base">${escapeHtml(verb.base)} <small>${escapeHtml(verb.reading)}</small></p>
      <p class="exercise-question">ผันเป็น <strong>${escapeHtml(type.label)}</strong> - ${escapeHtml(type.th)}</p>
      <div class="answer-row">
        <input id="conjugationInput" type="text" placeholder="พิมพ์คำตอบ เช่น ${escapeHtml(answer)}" autocomplete="off" />
        <button class="primary-button" id="checkConjugation" type="button">ตรวจ</button>
        <button class="ghost-button" id="showConjugation" type="button">เฉลย</button>
      </div>
      <p class="feedback" id="conjugationFeedback"></p>
    </div>
  `;

  els.conjugationRules.innerHTML = `
    <div class="conj-tabs">
      ${conjugationTypes.map((item) => `
        <button class="conj-tab${item.key === type.key ? " active" : ""}" data-conj-type="${item.key}" type="button">
          ${escapeHtml(item.label)}
          <span>${escapeHtml(item.th)}</span>
        </button>
      `).join("")}
    </div>
    <div class="group-guide">
      ${conjugationGroups.map((item) => `
        <div class="group-guide-item">
          <strong>${escapeHtml(item.label)}</strong>
          <span>${escapeHtml(item.hint)}</span>
          <p>${escapeHtml(item.detail)}</p>
        </div>
      `).join("")}
    </div>
    <div class="rule-card">
      <p class="eyebrow">กฎจำเร็ว</p>
      <h3>${escapeHtml(type.label)} <span>${escapeHtml(type.th)}</span></h3>
      <p>${escapeHtml(type.rule)}</p>
      <p>${escapeHtml(type.usage)}</p>
    </div>
    <div class="mini-table">
      ${conjugationVerbs.slice(0, 8).map((item) => `
        <div><strong>${escapeHtml(item.base)}</strong><span>${escapeHtml(item[type.key])}</span></div>
      `).join("")}
    </div>
  `;

  els.conjugationRules.querySelectorAll("[data-conj-type]").forEach((button) => {
    button.addEventListener("click", () => {
      state.conjugationType = button.dataset.conjType;
      renderConjugation(true);
    });
  });

  const input = document.getElementById("conjugationInput");
  const feedback = document.getElementById("conjugationFeedback");
  document.getElementById("checkConjugation").addEventListener("click", () => {
    const ok = isConjugationAnswer(input.value, answer);
    feedback.textContent = ok ? `ถูก: ${answer}` : `ยังไม่ใช่ เฉลยคือ ${answer}`;
    feedback.className = `feedback ${ok ? "good" : "bad"}`;
  });
  document.getElementById("showConjugation").addEventListener("click", () => {
    feedback.textContent = `${verb.base} -> ${answer}`;
    feedback.className = "feedback good";
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") document.getElementById("checkConjugation").click();
  });

  renderConjugationMatrix(type);
}

function renderConjugationMatrix(activeType) {
  if (!els.conjugationMatrix) return;
  els.conjugationMatrix.innerHTML = `
    <div class="matrix-head">
      <div>
        <p class="eyebrow">ตารางอ้างอิง</p>
        <h3>ผันครบทุกคำตัวอย่าง</h3>
      </div>
      <p>เลื่อนแนวนอนเพื่อดูครบทุก 24 รูป คอลัมน์ที่เลือกอยู่จะถูกไฮไลต์ไว้ให้เทียบแพตเทิร์นง่ายขึ้น</p>
    </div>
    <div class="matrix-scroll">
      <table class="verb-matrix">
        <thead>
          <tr>
            <th>กริยา</th>
            <th>กลุ่ม</th>
            ${conjugationTypes.map((type) => `
              <th class="${type.key === activeType.key ? "active-form" : ""}">
                ${escapeHtml(type.label)}
                <span>${escapeHtml(type.th)}</span>
              </th>
            `).join("")}
          </tr>
        </thead>
        <tbody>
          ${conjugationVerbs.map((verb) => `
            <tr>
              <th>
                <strong>${escapeHtml(verb.base)}</strong>
                <span>${escapeHtml(verb.reading)}・${escapeHtml(verb.meaning)}</span>
              </th>
              <td>${escapeHtml(verb.groupLabel || verb.group)}</td>
              ${conjugationTypes.map((type) => `
                <td class="${type.key === activeType.key ? "active-form" : ""}">${escapeHtml(verb[type.key])}</td>
              `).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderMatch(forceNew = false) {
  const pool = scopeEntries();
  if (!state.currentMatchSet.length || forceNew || state.currentMatchSet.some((item) => !pool.find((p) => p.id === item.id))) {
    state.currentMatchSet = shuffle(pool).slice(0, Math.min(6, pool.length));
    state.selectedMatchId = null;
    state.matchedIds = new Set();
  }

  const left = state.currentMatchSet;
  const right = shuffle([...state.currentMatchSet]);
  els.exerciseArea.innerHTML = `
    <div class="exercise-card">
      <p class="exercise-question">จับคู่รูปไวยกรณ์กับความหมาย</p>
      <div class="match-grid">
        <div class="match-column">
          ${left.map((item) => matchButton(item, "pattern")).join("")}
        </div>
        <div class="match-column">
          ${right.map((item) => matchButton(item, "meaning")).join("")}
        </div>
      </div>
      <p class="feedback" id="exerciseFeedback"></p>
      <div class="answer-row">
        <button class="ghost-button" id="nextExercise" type="button">ชุดใหม่</button>
      </div>
    </div>
  `;

  els.exerciseArea.querySelectorAll("[data-match-kind='pattern']").forEach((button) => {
    button.addEventListener("click", () => selectMatch(button.dataset.matchId));
  });
  els.exerciseArea.querySelectorAll("[data-match-kind='meaning']").forEach((button) => {
    button.addEventListener("click", () => resolveMatch(button.dataset.matchId));
  });
  document.getElementById("nextExercise").addEventListener("click", () => renderMatch(true));
  paintMatchState();
}

function matchButton(item, kind) {
  const text = kind === "pattern" ? item.pattern : item.meaning;
  return `<button class="match-item" data-match-kind="${kind}" data-match-id="${item.id}" type="button">${escapeHtml(text)}</button>`;
}

function selectMatch(id) {
  if (state.matchedIds.has(id)) return;
  state.selectedMatchId = id;
  paintMatchState();
}

function resolveMatch(id) {
  const feedback = document.getElementById("exerciseFeedback");
  if (!state.selectedMatchId || state.matchedIds.has(id)) return;

  if (state.selectedMatchId === id) {
    state.matchedIds.add(id);
    markKnown(id);
    state.selectedMatchId = null;
    feedback.textContent = state.matchedIds.size === state.currentMatchSet.length ? "ครบชุดแล้ว" : "ถูกต้อง";
    feedback.className = "feedback good";
  } else {
    feedback.textContent = "ยังไม่ตรงคู่ ลองดูความหมายอีกที";
    feedback.className = "feedback bad";
  }
  paintMatchState();
}

function paintMatchState() {
  els.exerciseArea.querySelectorAll(".match-item").forEach((button) => {
    const id = button.dataset.matchId;
    button.classList.toggle("selected", button.dataset.matchKind === "pattern" && state.selectedMatchId === id);
    button.classList.toggle("done", state.matchedIds.has(id));
  });
}

function markKnown(id) {
  if (!state.known.has(id)) {
    state.known.add(id);
    saveKnown();
    updateStats();
    renderCards();
  }
}

function isAcceptedAnswer(value, entry) {
  const answer = normalizeAnswer(value);
  if (!answer) return false;
  const accepted = [entry.pattern, ...(entry.aliases || []), shortAnswer(entry)].map(normalizeAnswer).filter(Boolean);
  return accepted.some((item) => item === answer || item.includes(answer) || answer.includes(item));
}

function shortAnswer(entry) {
  const alias = entry.aliases?.[0];
  if (alias && alias.length <= 18) return alias;
  return entry.pattern.split("/")[0].trim();
}

function normalizeAnswer(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[ \t\r\n。、，,./／・|｜()（）\[\]［］{}「」『』"'`~〜\-ー]/g, "")
    .replace(/v/g, "")
    .trim();
}

function isConjugationAnswer(value, answer) {
  const normalized = normalizeJapanese(value);
  if (!normalized) return false;
  return conjugationAnswerVariants(answer).some((item) => item === normalized);
}

function conjugationAnswerVariants(answer) {
  const raw = String(answer || "");
  const variants = new Set([raw, raw.replace(/[（(].*?[）)]/g, "")]);
  for (const match of raw.matchAll(/[（(]([^）)]+)[）)]/g)) {
    variants.add(match[1]);
  }
  return [...variants]
    .flatMap((item) => String(item).split(/[、,／/・;]/))
    .map(normalizeJapanese)
    .filter(Boolean);
}

function normalizeJapanese(value) {
  return String(value || "")
    .replace(/[ \t\r\n。、，,./／・|｜()（）\[\]［］{}「」『』"'`~〜\-ー]/g, "")
    .trim();
}

function normalizeSearch(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, "");
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function scrollToRandomCard() {
  const entries = filteredEntries();
  if (!entries.length) return;
  const item = randomItem(entries);
  const card = document.getElementById(`card-${item.id}`);
  card?.scrollIntoView({ behavior: "smooth", block: "center" });
  card?.animate(
    [
      { boxShadow: "0 0 0 0 rgba(67, 56, 202, 0)" },
      { boxShadow: "0 0 0 5px rgba(67, 56, 202, 0.24)" },
      { boxShadow: "0 14px 40px rgba(23, 32, 42, 0.08)" }
    ],
    { duration: 900, easing: "ease-out" }
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
