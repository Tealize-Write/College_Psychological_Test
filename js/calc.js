// calc.js — 一題一題流程 + 分數計算 + Chart.js 長條圖（含數值標籤）+ GAS 提交
// GAS_URL 定義於 js/config.js

// ── 學院定義（index 對應 scores 陣列位置） ───────────────────────────────
const ACADEMIES = [
  { key: "red", color: "#ff5c5c" },
  { key: "green", color: "#a3ff00" },
  { key: "blue", color: "#00eaff" },
  { key: "black", color: "#ffffff" },
  { key: "white", color: "#e9c86c" },
];

// ── 狀態 ──────────────────────────────────────────────────────────────────
let scores = [0, 0, 0, 0, 0]; // [red, green, blue, black, white]
let qIndex = 0;
let phase = "quiz";
let answerHistory = []; // 每題記錄玩家選了哪一個 option index
window.quizStartTime = 0; // 記錄測驗開始時間（用於計算 timeSpent）

// ── DOM refs ──────────────────────────────────────────────────────────────
const progressArea = document.getElementById("progress-area");
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");
const sectionCard = document.getElementById("section-card");
const sectionBadge = document.getElementById("section-badge");
const sectionLabel = document.getElementById("section-label");
const sectionDesc = document.getElementById("section-desc");
const questionCard = document.getElementById("question-card");
const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");
const HAS_QUIZ_UI = !!questionText;

// ── 入口 ──────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  if (!HAS_QUIZ_UI) return;
  startQuiz();

  document.addEventListener("langChanged", onLangChanged);
});

function onLangChanged() {
  if (!HAS_QUIZ_UI) return;
  renderQuestion();
}

// ── 區塊顯示（第一大題 / 第二大題）──────────────────────────────────────
function updateSectionHeader() {
  const t = UI_TRANSLATIONS[currentLang];
  const isPart1 = qIndex < 20;
  sectionBadge.textContent = isPart1 ? t.part1Badge : t.part2Badge;
  sectionLabel.textContent = isPart1 ? t.part1Label : t.part2Label;
  sectionDesc.textContent = isPart1 ? t.part1Desc : t.part2Transition;
}

function startQuiz() {
  phase = "quiz";
  qIndex = 0;
  scores = [0, 0, 0, 0, 0];
  answerHistory = [];
  window.quizStartTime = Date.now();
  // GAS 暖機：趁玩家答題期間預先喚醒 GAS 實例，消除結果頁的冷啟動延遲
  if (typeof GAS_URL !== "undefined" && GAS_URL) {
    fetch(GAS_URL, { keepalive: true }).catch(() => {});
  }
  show(progressArea, sectionCard, questionCard);
  renderQuestion();
}

// ── 題目渲染 ──────────────────────────────────────────────────────────────
function renderQuestion() {
  const questions = QUIZ_QUESTIONS[currentLang];
  const q = questions[qIndex];
  if (!q) return;

  const total = questions.length;
  const cur = qIndex + 1;
  const pct = (cur / total) * 100;

  progressFill.style.width = pct + "%";
  progressText.textContent = UI_TRANSLATIONS[currentLang].progressText
    .replace("{cur}", cur)
    .replace("{total}", total);

  updateSectionHeader();
  questionText.textContent = q.text;

  optionsContainer.innerHTML = "";
  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "quiz-option-btn";
    btn.textContent = opt.label;
    btn.onclick = () => selectOption(opt.scores, btn, i);
    optionsContainer.appendChild(btn);
  });

  // 淡入動畫
  questionCard.classList.remove("fade-in");
  void questionCard.offsetWidth;
  questionCard.classList.add("fade-in");
}

function selectOption(optScores, btn, optIdx) {
  optionsContainer
    .querySelectorAll(".quiz-option-btn")
    .forEach((b) => (b.disabled = true));
  btn.classList.add("selected");

  answerHistory[qIndex] = optIdx; // 記錄答題歷史（平局解析用）
  optScores.forEach((v, i) => {
    scores[i] += v;
  });
  qIndex++;

  const questions = QUIZ_QUESTIONS[currentLang];
  setTimeout(() => {
    if (qIndex < questions.length) renderQuestion();
    else showResult();
  }, 280);
}

// ── 結果 ──────────────────────────────────────────────────────────────────

// 同分時從最後一題往前回溯，依答題歷史決定勝者（參考 TwistedTales breakCategoryTie）
function breakTie(candidates) {
  let current = [...candidates];
  const questions = QUIZ_QUESTIONS[currentLang];
  for (let i = answerHistory.length - 1; i >= 0; i--) {
    const optIdx = answerHistory[i];
    if (optIdx == null) continue;
    const optScores = questions[i]?.options[optIdx]?.scores;
    if (!optScores) continue;
    let best = -1;
    let winners = [];
    for (const idx of current) {
      const s = Number(optScores[idx] || 0);
      if (s > best) {
        best = s;
        winners = [idx];
      } else if (s === best) winners.push(idx);
    }
    if (best > 0) {
      if (winners.length === 1) return winners[0];
      current = winners;
    }
  }
  return current[0]; // 依 ACADEMIES 順序保底
}

function showResult() {
  const maxScore = Math.max(...scores);
  const topIndices = scores.reduce((acc, s, i) => {
    if (s === maxScore) acc.push(i);
    return acc;
  }, []);
  const winnerIdx =
    topIndices.length === 1 ? topIndices[0] : breakTie(topIndices);
  const primaryTop = ACADEMIES[winnerIdx].key;
  sessionStorage.setItem(
    "latestAcademyScores",
    JSON.stringify({ scores, savedAt: Date.now() }),
  );
  submitToGAS(scores, primaryTop);
  window.location.href = `index.html?page=result&academy=${primaryTop}`;
}

// ── GAS 提交 ──────────────────────────────────────────────────────────────
function submitToGAS(scoreArr, topKey) {
  if (!GAS_URL || GAS_URL === "YOUR_GAS_WEB_APP_URL_HERE") return;
  const timeSpent = window.quizStartTime
    ? Math.round((Date.now() - window.quizStartTime) / 1000)
    : 0;
  const location =
    typeof getLocationPayload === "function"
      ? getLocationPayload()
      : { country: "", city: "" };
  const payload = {
    timestamp: new Date().toISOString(),
    clientId: typeof getClientId === "function" ? getClientId() : "",
    keyword: topKey,
    action: "quiz_completed",
    source: typeof getTrafficSource === "function" ? getTrafficSource() : "",
    referrer: document.referrer || "",
    device: typeof getDeviceType === "function" ? getDeviceType() : "",
    country: location.country,
    city: location.city,
    timeSpent,
    top: topKey,
    red: scoreArr[0],
    green: scoreArr[1],
    blue: scoreArr[2],
    black: scoreArr[3],
    white: scoreArr[4],
  };
  fetch(GAS_URL, {
    method: "POST",
    keepalive: true,
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

// ── 重置 ──────────────────────────────────────────────────────────────────
function resetQuiz() {
  scores = [0, 0, 0, 0, 0];
  qIndex = 0;
  answerHistory = [];
  window.quizStartTime = 0;
  startQuiz();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ── 工具函數 ──────────────────────────────────────────────────────────────
function show(...els) {
  els.forEach((el) => el && (el.style.display = ""));
}
function hide(...els) {
  els.forEach((el) => el && (el.style.display = "none"));
}
