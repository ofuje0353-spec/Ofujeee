// ACCESS CODES
const accessCodes = ["AI123", "QUIZ999", "OFUJE77"];

// GLOBALS
let questions = [];
let index = 0;
let answers = [];
let score = 0;
let timerInterval;

// ACCESS PAGE
function checkAccess() {
  if (accessCodes.includes(accessCode.value)) {
    msg.textContent = "✅ Access Granted";
    setTimeout(() => location.href = "quiz.html", 1000);
  } else {
    msg.textContent = "❌ Invalid Code";
    msg.style.color = "red";
  }
}

// TIMER
function toggleTimer() {
  timerMinutes.style.display =
    timerToggle.value === "yes" ? "block" : "none";
}

function startTimer(min) {
  let time = min * 60;
  timerInterval = setInterval(() => {
    timer.textContent = `⏱ ${time}s`;
    if (--time < 0) finishQuiz();
  }, 1000);
}

// GENERATE QUIZ (OPENAI)
async function generateQuiz() {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) return alert("Enter OpenAI API Key");

  const file = pdfFile.files[0];
  if (!file) return alert("Upload a PDF");

  if (timerToggle.value === "yes") startTimer(timerMinutes.value);

  quizArea.innerHTML = "📄 Reading PDF...";

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    content.items.forEach(item => text += item.str + " ");
  }

  text = text.slice(0, 4000);

  const diffLabel =
    difficulty.value == 1 ? "easy" :
    difficulty.value == 2 ? "medium" : "hard";

  quizArea.innerHTML = "🤖 Generating questions...";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{
        role: "user",
        content: `
Generate ${qCount.value} ${qType.value} questions.
Difficulty: ${diffLabel}

Format:
Q: question
A) option
B) option
C) option
D) option
Answer: B

TEXT:
${text}
`
      }]
    })
  });

  const data = await response.json();
  questions = data.choices[0].message.content.split("\n\n");
  index = 0;
  showQuestion();
}

// SHOW QUESTION
function showQuestion() {
  if (index >= questions.length) return finishQuiz();

  quizArea.innerHTML = `
    <div class="card">
      <pre>${questions[index]}</pre>
      <input id="userAns" placeholder="Your answer (A/B/C/D)">
      <button onclick="next()">Next</button>
    </div>
  `;
}

// NEXT QUESTION
function next() {
  const ans = userAns.value.toUpperCase();
  answers.push(ans);

  const correct = questions[index].match(/Answer:\s*(\w)/);
  if (correct && ans === correct[1]) score++;

  index++;
  showQuestion();
}

// FINISH QUIZ
function finishQuiz() {
  clearInterval(timerInterval);
  localStorage.setItem("questions", JSON.stringify(questions));
  localStorage.setItem("answers", JSON.stringify(answers));
  localStorage.setItem("score", score);
  location.href = "review.html";
}

// REVIEW PAGE
if (location.pathname.includes("review.html")) {
  const qs = JSON.parse(localStorage.getItem("questions"));
  const ans = JSON.parse(localStorage.getItem("answers"));
  const sc = localStorage.getItem("score");

  score.textContent = `Score: ${sc} / ${qs.length}`;

  reviewArea.innerHTML = qs.map((q,i)=>{
    const correct = q.match(/Answer:\s*(\w)/)[1];
    return `
      <div class="card">
        <pre>${q}</pre>
        <p class="${ans[i]==correct?'correct':'wrong'}">
          Your Answer: ${ans[i] || "None"} | Correct: ${correct}
        </p>
      </div>
    `;
  }).join("");
}
