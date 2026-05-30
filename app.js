let secret;
let startTime;
let tries = 0;
let gameOver = false;

/* ================= COLORS ================= */

const digitColors = {
    "0": "#111111",
    "1": "#3b82f6",
    "2": "#10b981",
    "3": "#ef4444",
    "4": "#8b5cf6",
    "5": "#f97316",
    "6": "#06b6d4",
    "7": "#ec4899",
    "8": "#eab308",
    "9": "#6b7280"
};

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", init);

function init(){
    setupLogo();
    setupGame();
    setupTimer();
    setupMenu();
    setupAbout();
    setupTest();    
    setupScoresModal();
}

/* ================= LOGO ================= */

function setupLogo(){

    const text = "MASTER MIND";

    const colors = [
        "#ef4444","#f97316","#eab308",
        "#22c55e","#06b6d4","#3b82f6",
        "#8b5cf6","#ec4899","#10b981",
        "#60a5fa","#f43f5e"
    ];

    const el = document.getElementById("logoTitle");

    el.innerHTML = text.split("").map((c,i)=>{

        if(c===" ") return `<span style="width:12px;"></span>`;

        return `<span style="color:${colors[i % colors.length]}">${c}</span>`;
    }).join("");
}

/* ================= GAME ================= */

function setupGame(){

    secret = generate();
    startTime = Date.now();
    tries = 0;
    gameOver = false;

    document.getElementById("board").innerHTML = "";
    document.getElementById("tries").innerText = "0";

    createRow();
}

function generate(){

    let d = [];

    while(d.length < 5){
        let n = Math.floor(Math.random() * 10).toString();
        if(!d.includes(n)) d.push(n);
    }

    return d.join("");
}

/* ================= COLOR SYSTEM (FIXED) ================= */

function updateColor(input){

    const v = input.value;

    if(v === ""){
        input.style.background = "#111827";
        input.style.color = "white";
        return;
    }

    if(digitColors.hasOwnProperty(v)){
        input.style.background = digitColors[v];
        input.style.color = "white";
    } else {
        input.style.background = "#111827";
        input.style.color = "white";
    }
}

/* ================= ROW ================= */

function createRow(){

    if(gameOver) return;

    const board = document.getElementById("board");

    const row = document.createElement("div");
    row.className = "row";

    const inputsContainer = document.createElement("div");
    const cells = [];

    for(let i = 0; i < 5; i++){

        const input = document.createElement("input");
        input.className = "cell";
        input.maxLength = 1;

        input.oninput = () => {

            input.value = input.value.replace(/[^0-9]/g,'');
            updateColor(input);

            if(input.value && i < 4){
                cells[i+1].focus();
            }
        };

        cells.push(input);
        inputsContainer.appendChild(input);
    }

    const score = document.createElement("div");

    const btn = document.createElement("button");
    btn.innerHTML = "➜";

    btn.onclick = () => {

        if(gameOver) return;

        const g = cells.map(x => x.value).join("");
        if(g.length !== 5) return;

        btn.disabled = true;
        cells.forEach(c => c.disabled = true);

        const s = secret.split("");

        let w = 0;
        let m = 0;

        const used = Array(5).fill(false);

        for(let i = 0; i < 5; i++){
            if(g[i] === s[i]){
                w++;
                used[i] = true;
            }
        }

        for(let i = 0; i < 5; i++){
            if(g[i] === s[i]) continue;

            for(let j = 0; j < 5; j++){
                if(!used[j] && g[i] === s[j]){
                    m++;
                    used[j] = true;
                    break;
                }
            }
        }

        score.innerHTML = `✔${w} ↻${m}`;

        tries++;
        document.getElementById("tries").innerText = tries;

        /* ================= WIN ================= */

        if(w === 5 && m === 0){

            gameOver = true;

            const msg = document.createElement("div");
            msg.innerHTML = "🎉 Bien joué !";
            msg.style.textAlign = "center";
            msg.style.padding = "12px";
            msg.style.color = "#22c55e";
            msg.style.fontSize = "18px";

            board.appendChild(msg);

            saveGameResult();
            return;
        }

        createRow();
    };

    row.appendChild(btn);
    row.appendChild(inputsContainer);
    row.appendChild(score);

    board.appendChild(row);
}

/* ================= SAVE GAME ================= */

function saveGameResult(){

    const data = {
        date: new Date().toISOString(),
        tries,
        time: Math.floor((Date.now() - startTime) / 1000),
        result: "win"
    };

    let history = JSON.parse(localStorage.getItem("mastermind_games") || "[]");

    history.push(data);

    localStorage.setItem("mastermind_games", JSON.stringify(history));
}

/* ================= TIMER ================= */

function setupTimer(){

    setInterval(() => {
        document.getElementById("timer").innerText =
            Math.floor((Date.now() - startTime) / 1000);
    }, 1000);
}

/* ================= MENU ================= */

function setupMenu(){

    fetch("links.json")
    .then(r => r.json())
    .then(data => {

        document.getElementById("menu").innerHTML =
            data.links.map(l =>
                `<a href="${l.url}" target="_blank">${l.name}</a>`
            ).join("");
    });
}

/* ================= ABOUT MODAL ================= */

function setupAbout(){

    const modal = document.createElement("div");
    modal.className = "modal";

    modal.innerHTML = `
        <div class="modal-content">
            <button id="closeAbout">✕</button>
            <div id="aboutContent"></div>
        </div>
    `;

    document.body.appendChild(modal);

    const content = modal.querySelector("#aboutContent");

    document.getElementById("aboutBtn").onclick = async () => {

        modal.style.display = "flex";

        try {
            const res = await fetch("about.md");
            const md = await res.text();

            // affichage propre (sans destruction du markdown)
           content.innerHTML = `<div class="md">${renderMarkdown(md)}</div>`;

        } catch (e) {
            content.innerHTML = "Erreur chargement about.md";
        }
    };

    modal.onclick = (e) => {
        if(e.target === modal){
            modal.style.display = "none";
        }
    };

    modal.querySelector("#closeAbout").onclick = () => {
        modal.style.display = "none";
    };
}

/* ================= TEST (READY FOR JSON 40 QUESTIONS) ================= */


function renderHistory(){

    const panel = document.getElementById("historyPanel");

    let history = JSON.parse(localStorage.getItem("mastermind_games") || "[]");

    if(history.length === 0){
        panel.innerHTML = "<p>No games yet</p>";
        return;
    }

    panel.innerHTML = history.slice().reverse().map(h => {

        const date = new Date(h.date).toLocaleString();

        return `
            <div class="history-item">
                📅 ${date}<br>
                🎯 Tries: ${h.tries}<br>
                ⏱ Time: ${h.time}s<br>
                🏆 ${h.result}
            </div>
        `;
    }).join("");
}
function renderMarkdown(md){

    return md
        // headers
        .replace(/^### (.*)$/gm, "<h3>$1</h3>")
        .replace(/^## (.*)$/gm, "<h2>$1</h2>")
        .replace(/^# (.*)$/gm, "<h1>$1</h1>")

        // bold
        .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")

        // list items
        .replace(/^\- (.*)$/gm, "<li>$1</li>")

        // wrap lists properly
        .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");
}
function setupScoresModal(){

    const modal = document.createElement("div");
    modal.className = "modal";

    modal.innerHTML = `
        <div class="modal-content">
            <button id="closeScores">✕</button>
            <h2>Mes Scores</h2>
            <div id="scoresContent"></div>
        </div>
    `;

    document.body.appendChild(modal);

    const content = modal.querySelector("#scoresContent");

    document.getElementById("scoresBtn").onclick = () => {

        modal.style.display = "flex";

        let history = JSON.parse(localStorage.getItem("mastermind_games") || "[]");

        if(history.length === 0){
            content.innerHTML = "<p>Aucun score pour le moment.</p>";
            return;
        }

        content.innerHTML = history.slice().reverse().map(h => {

            return `
                <div class="history-item">
                    📅 ${new Date(h.date).toLocaleString()}<br>
                    🎯 Essais: ${h.tries}<br>
                    ⏱ Temps: ${h.time}s<br>
                    🏆 ${h.result}
                </div>
            `;
        }).join("");
    };

    modal.onclick = (e) => {
        if(e.target === modal){
            modal.style.display = "none";
        }
    };

    modal.querySelector("#closeScores").onclick = () => {
        modal.style.display = "none";
    };
}

function setupTest(){
    // future: strategy-test.json (40 questions A/B/C/D + scoring + profile engine)
}