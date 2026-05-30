
// ================= GLOBAL STATE =================

let testId = null;
let questions = [];
let current = 0;

let answers = {};
let scores = {};
let locked = {};

let totalQuestions = 0;

// ================= LOAD TEST =================

async function loadTest(id) {

  testId = id;


  const res = await fetch(`data/${id}.json`);
  const data = await res.json();

  questions = data.questions;
  totalQuestions = questions.length;

  initScores(data.profiles);

  restore();

  document.getElementById("selector").style.display = "none";

  render();
}

// ================= INIT SCORES =================

function initScores(profiles) {

  profiles = profiles || {
    planner: {},
    analyst: {},
    executor: {},
    innovator: {}
  };

  scores = {};

  if (!profiles) {
    console.error("profiles is missing in JSON");
    return;
  }

  Object.keys(profiles).forEach(k => {
    scores[k] = 0;
  });


}

// ================= RENDER =================

function render() {

  const q = questions[current];

  document.getElementById("questionText").innerHTML = `
  <div class="question-box">
    <div style="opacity:0.6; font-size:13px;">
      Question ${current + 1} / ${totalQuestions}
    </div>

    <div style="margin-top:8px;">
      ${q.text}
    </div>
  </div>
`;

  const container = document.getElementById("answers");
  container.innerHTML = "";

  Object.entries(q.answers).forEach(([key, ans]) => {

    const div = document.createElement("div");
    div.className = "answer";

    div.innerText = `${key}. ${ans.text}`;

    if (answers[current] === key) {
      div.style.background = "#3b82f6";
    }

    if (locked[current]) {
      div.style.pointerEvents = "none";
    }

    div.onclick = () => select(key);

    container.appendChild(div);
  });

  updateProgress();
}

// ================= SELECT =================

function select(key) {

  const prev = answers[current];

  // retirer ancien score si existe
  if (prev) {
    updateScore(prev, -1);
  }

  // enregistrer nouveau choix
  answers[current] = key;

  updateScore(key, 1);

  save();

  render();
}

// ================= SCORE =================

function updateScore(key, multiplier) {

  const q = questions[current];
  const s = q.answers[key].scores;

  Object.entries(s).forEach(([k, v]) => {
    scores[k] += v * multiplier;
  });
}

// ================= NAV =================

document.getElementById("nextBtn").onclick = () => {

  if (current < totalQuestions - 1) {
    current++;
    render();
  } else {
    showResult();
  }
};

document.getElementById("prevBtn").onclick = () => {

  if (current > 0) {
    current--;
    render();
  }
};

// ================= PROGRESS =================

function updateProgress() {

  const answered = Object.keys(answers).length;

  document.getElementById("progressText").innerText =
    `${answered} / ${totalQuestions}`;

  document.getElementById("progressBar").style.width =
    (answered / totalQuestions) * 100 + "%";
}

// ================= SAVE =================

function save() {

  localStorage.setItem(`test_answers_${testId}`, JSON.stringify(answers));
  localStorage.setItem(`test_scores_${testId}`, JSON.stringify(scores));
  localStorage.setItem(`test_progress_${testId}`, current);
}

// ================= RESTORE =================

function restore() {

  const a = localStorage.getItem(`test_answers_${testId}`);
  const s = localStorage.getItem(`test_scores_${testId}`);
  const p = localStorage.getItem(`test_progress_${testId}`);

  if (a) answers = JSON.parse(a);
  if (s) scores = JSON.parse(s);
  if (p) current = parseInt(p);
}

// ================= RESULT =================

function showResult() {

  const total = Object.values(scores).reduce((a, b) => a + b, 0);

  const result = Object.entries(scores)
    .map(([k, v]) => ({
      key: k,
      percent: Math.round((v / total) * 100)
    }))
    .sort((a, b) => b.percent - a.percent);

  const top = result[0];

  document.getElementById("modalBody").innerHTML = `
    <h2>Résultat</h2>
    <h3>🏆 ${top.key}</h3>

    ${result.map(r => `
      <p>${r.key} : ${r.percent}%</p>
    `).join("")}
  `;

  document.getElementById("modal").style.display = "flex";

  localStorage.setItem(`test_result_${testId}`, JSON.stringify(result));
}



// ================= HOME =================

document.getElementById("btnHome").onclick = () => {
  location.reload();
};





const btnResults = document.getElementById("btnResults");
const resultsModal = document.getElementById("resultsModal");
const closeResults = document.getElementById("closeResults");

btnResults.addEventListener("click", () => {
  loadResults();
  resultsModal.classList.remove("hidden");
});

if(closeResults)
  closeResults.addEventListener("click", () => {
  resultsModal.classList.add("hidden");
});

resultsModal.addEventListener("click", (e) => {
  if (e.target === resultsModal) {
    resultsModal.classList.add("hidden");
  }
});

document.getElementById("goMasterMind").addEventListener("click", () => {
  window.location.href = window.location.origin + "/mind/";
});

function loadResults() {
  const container = document.getElementById("resultsContainer");
  container.innerHTML = "";

  const data = JSON.parse(localStorage.getItem("game_results") || "[]");

  if (data.length === 0) {
    container.innerHTML = "<p>Aucun résultat encore.</p>";
    return;
  }

  data.reverse().forEach((r, index) => {
    const div = document.createElement("div");
    div.className = "result-item";

    div.innerHTML = `
      <strong>Partie ${data.length - index}</strong><br/>
      🎯 Score : ${r.correct}/5<br/>
      ❌ Mal placés : ${r.wrong}/5<br/>
      🕒 Date : ${new Date(r.date).toLocaleString()}
    `;

    container.appendChild(div);
  });
}