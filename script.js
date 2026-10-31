const DATA_URL = "assets/quiz_questions_seed.json";
const $ = (id) => document.getElementById(id);
const screens = ["setupScreen", "quizScreen", "resultScreen"];
let questionBank = [], quizQuestions = [], answers = [], currentIndex = 0, timeLeft = 20, timer = null, secondsPerQuestion = 20, soundEnabled = true, audioCtx = null, locked = false;

const els = {
  category: $("categorySelect"), difficulty: $("difficultySelect"), count: $("countSelect"), time: $("timeSelect"),
  start: $("startBtn"), available: $("availableText"), progress: $("progressFill"), timerFill: $("timerFill"),
  timerText: $("timerText"), questionText: $("questionText"), options: $("optionsGrid"), next: $("nextBtn")
};

function showScreen(id) {
  screens.forEach(screen => $(screen).classList.toggle("active", screen === id));
  window.scrollTo({top: 0, behavior: "smooth"});
}
function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function filteredQuestions() {
  return questionBank.filter(q =>
    (els.category.value === "All" || q.category === els.category.value) &&
    (els.difficulty.value === "All" || q.difficulty === els.difficulty.value)
  );
}
function updateAvailable() {
  const count = filteredQuestions().length;
  els.available.textContent = `${count} questions available for this selection`;
  els.start.disabled = count === 0;
}
async function loadQuestions() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error("Could not load the question bank.");
    const data = await response.json();
    if (!Array.isArray(data) || !data.length) throw new Error("The question bank is empty.");
    questionBank = data.filter(q => q && Array.isArray(q.options) && q.options.length === 4 &&
      Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < q.options.length &&
      typeof q.question === "string");
    const categories = [...new Set(questionBank.map(q => q.category).filter(Boolean))].sort();
    categories.forEach(category => {
      const option = document.createElement("option");
      option.value = category; option.textContent = category;
      els.category.appendChild(option);
    });
    updateAvailable();
  } catch (error) {
    els.available.textContent = "Question bank could not load. Run this app using the local server instructions.";
    showToast(error.message);
  }
}
function startQuiz() {
  const pool = filteredQuestions();
  const count = Math.min(Number(els.count.value), pool.length);
  if (!count) return;
  quizQuestions = shuffle(pool).slice(0, count);
  answers = new Array(count).fill(null);
  currentIndex = 0;
  secondsPerQuestion = Number(els.time.value);
  showScreen("quizScreen");
  renderQuestion();
}
function renderQuestion() {
  clearInterval(timer);
  locked = false;
  const q = quizQuestions[currentIndex];
  $("quizCategory").textContent = (q.category || "GENERAL").toUpperCase();
  $("questionCount").textContent = `${String(currentIndex + 1).padStart(2,"0")} / ${String(quizQuestions.length).padStart(2,"0")}`;
  $("questionNumber").textContent = String(currentIndex + 1).padStart(2,"0");
  $("difficultyBadge").textContent = (q.difficulty || "general").toUpperCase();
  $("difficultyBadge").className = `difficulty-badge ${q.difficulty || ""}`;
  $("questionText").textContent = q.question;
  $("progressFill").style.width = `${(currentIndex / quizQuestions.length) * 100}%`;
  $("answeredText").textContent = `${answers.filter(a => a !== null).length} answered`;
  $("nextBtn").disabled = true;
  $("nextBtn").innerHTML = currentIndex === quizQuestions.length - 1 ? 'See results <span>↗</span>' : 'Next question <span>→</span>';
  $("optionsGrid").innerHTML = "";
  q.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.className = "option";
    button.type = "button";
    button.innerHTML = `<span class="option-key">${String.fromCharCode(65 + index)}</span><span>${escapeHTML(option)}</span>`;
    button.addEventListener("click", () => selectAnswer(index));
    $("optionsGrid").appendChild(button);
  });
  timeLeft = secondsPerQuestion;
  updateTimer();
  timer = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      clearInterval(timer);
      if (!locked) {
        locked = true;
        answers[currentIndex] = null;
        revealAnswer(null);
        $("answeredText").textContent = `${answers.filter(a => a !== null).length} answered`;
        $("nextBtn").disabled = false;
        showToast("Time is up! The correct answer is highlighted.");
        playTone("wrong");
      }
    }
  }, 1000);
}
function updateTimer() {
  $("timerText").textContent = `${timeLeft}s`;
  $("timerFill").style.width = `${Math.max(0, timeLeft / secondsPerQuestion * 100)}%`;
  $("timerFill").classList.toggle("urgent", timeLeft <= 5);
  $("timerText").style.color = timeLeft <= 5 ? "var(--red)" : "";
}
function selectAnswer(index) {
  if (locked) return;
  locked = true;
  clearInterval(timer);
  answers[currentIndex] = index;
  const correct = index === quizQuestions[currentIndex].correctIndex;
  revealAnswer(index);
  $("answeredText").textContent = `${answers.filter(a => a !== null).length} answered`;
  $("nextBtn").disabled = false;
  playTone(correct ? "correct" : "wrong");
}
function revealAnswer(selected) {
  const correctIndex = quizQuestions[currentIndex].correctIndex;
  [...$("optionsGrid").children].forEach((button, index) => {
    button.disabled = true;
    if (index === correctIndex) button.classList.add("correct");
    if (selected === index && selected !== correctIndex) button.classList.add("wrong");
    if (selected === index) button.classList.add("selected");
  });
}
function nextQuestion() {
  if (!locked) return;
  if (currentIndex < quizQuestions.length - 1) {
    currentIndex++;
    renderQuestion();
  } else {
    clearInterval(timer);
    showResults();
  }
}
function showResults() {
  const correct = answers.reduce((sum, answer, index) => sum + (answer === quizQuestions[index].correctIndex ? 1 : 0), 0);
  const total = quizQuestions.length;
  const percent = Math.round(correct / total * 100);
  $("scorePercent").textContent = `${percent}%`;
  $("correctCount").textContent = correct;
  $("wrongCount").textContent = total - correct;
  $("totalCount").textContent = total;
  $("scoreRing").style.background = `conic-gradient(var(--purple) ${percent * 3.6}deg, #ffffff12 0deg)`;
  $("resultTitle").textContent = percent === 100 ? "Perfect score!" : percent >= 70 ? "Nicely done!" : percent >= 40 ? "Good effort!" : "Keep exploring!";
  $("resultMessage").textContent = percent >= 70 ? "You showed great focus. Keep that momentum going." : "Every attempt helps you learn. Review the answers and try again.";
  $("reviewSummary").textContent = `${correct} of ${total} correct`;
  $("reviewList").innerHTML = "";
  quizQuestions.forEach((q, index) => {
    const selected = answers[index];
    const isCorrect = selected === q.correctIndex;
    const card = document.createElement("article");
    card.className = "review-item";
    const selectedText = selected === null ? "Not answered (time expired)" : q.options[selected];
    card.innerHTML = `<span class="review-tag" style="color:${isCorrect ? "var(--green)" : "var(--red)"}">${isCorrect ? "CORRECT" : "REVIEW"}</span>
      <h3>${index + 1}. ${escapeHTML(q.question)}</h3>
      <p class="review-line ${isCorrect ? "good" : "bad"}">Your answer: ${escapeHTML(selectedText)}</p>
      <p class="review-line good">Correct answer: ${escapeHTML(q.options[q.correctIndex])}</p>
      <p class="review-line">Category: ${escapeHTML(q.category || "General")} · ${escapeHTML(q.difficulty || "Unspecified")}</p>`;
    $("reviewList").appendChild(card);
  });
  $("reviewPanel").classList.add("hidden");
  $("reviewBtn").textContent = "Review answers ↓";
  showScreen("resultScreen");
}
function playTone(type) {
  if (!soundEnabled) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator(), gain = audioCtx.createGain();
    oscillator.connect(gain); gain.connect(audioCtx.destination);
    oscillator.type = "sine";
    oscillator.frequency.value = type === "correct" ? 660 : 220;
    gain.gain.setValueAtTime(.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.08, audioCtx.currentTime + .02);
    gain.gain.exponentialRampToValueAtTime(.0001, audioCtx.currentTime + .18);
    oscillator.start(); oscillator.stop(audioCtx.currentTime + .2);
  } catch (_) {}
}
let toastTimer;
function showToast(message) {
  const toast = $("toast");
  toast.textContent = message; toast.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}
els.category.addEventListener("change", updateAvailable);
els.difficulty.addEventListener("change", updateAvailable);
els.start.addEventListener("click", startQuiz);
els.next.addEventListener("click", nextQuestion);
$("quitBtn").addEventListener("click", () => {
  clearInterval(timer);
  if (confirm("Exit this quiz? Your current progress will be lost.")) showScreen("setupScreen");
  else if ($("quizScreen").classList.contains("active") && !locked) timer = setInterval(() => {
    timeLeft--; updateTimer();
    if (timeLeft <= 0) { clearInterval(timer); locked = true; answers[currentIndex] = null; revealAnswer(null); els.next.disabled = false; }
  }, 1000);
});
$("reviewBtn").addEventListener("click", () => {
  const panel = $("reviewPanel");
  panel.classList.toggle("hidden");
  $("reviewBtn").textContent = panel.classList.contains("hidden") ? "Review answers ↓" : "Hide review ↑";
});
$("playAgainBtn").addEventListener("click", () => showScreen("setupScreen"));
$("soundToggle").addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  $("soundToggle").textContent = soundEnabled ? "♫" : "♪";
  $("soundToggle").style.opacity = soundEnabled ? "1" : ".5";
  showToast(soundEnabled ? "Sound effects on" : "Sound effects off");
});
loadQuestions();
