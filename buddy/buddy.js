const buddyImages = {
  normal: "src/assets/characters/senpai-happy.png",
  strict: "src/assets/characters/senpai-strict.png"
};

function showStudyBuddyMessage(message, mood = "normal") {
  const buddyImg = document.getElementById("study-buddy-img");
  const bubble = document.getElementById("buddy-bubble");

  if (!buddyImg || !bubble) return;

  bubble.innerText = message;
  bubble.style.display = "block";

  if (mood === "strict") {
    buddyImg.src = buddyImages.strict;
    buddyImg.classList.remove("float");
    buddyImg.classList.add("bounce");
  } else {
    buddyImg.src = buddyImages.normal;
    buddyImg.classList.remove("bounce");
    buddyImg.classList.add("float");
  }

  // Voice synthesis
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.rate = 1;
  utterance.pitch = 1.2;
  utterance.lang = 'en-US';
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);

  // Hide bubble after 5 seconds
  setTimeout(() => {
    bubble.style.display = "none";
  }, 5000);
}

function onBuddyClick() {
  const messages = [
    "You're doing great today! 🌟",
    "Keep it up! Let's finish one more task 💼",
    "I'm proud of your effort. 💖"
  ];
  const message = messages[Math.floor(Math.random() * messages.length)];
  showStudyBuddyMessage(message, "normal");
}

// Make the click function globally available
window.onBuddyClick = onBuddyClick;

// 😠 Strict reminder after idle
let inactivityTimer;

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);

  // 👉 If user returns after strict mode, reset to happy mood
  const buddyImg = document.getElementById("study-buddy-img");
  if (buddyImg && buddyImg.src.includes("senpai-strict.png")) {
    showStudyBuddyMessage("Welcome back! Let’s stay focused!", "normal");
  }

  inactivityTimer = setTimeout(() => {
    showStudyBuddyMessage("Enough idle time! Refocus now.", "strict");
  }, 10000); // 5 minutes = 300000 (change to 20000 for testing)
}

// Reset timer on user activity
["click", "mousemove", "keydown"].forEach(evt =>
  window.addEventListener(evt, resetInactivityTimer)
);
resetInactivityTimer();

// ✅ Called after script is injected
function initStudyBuddy() {
  const path = window.location.pathname;

  setTimeout(() => {
    if (path.includes("index") || path === "/" || path === "/index.html") {
      showStudyBuddyMessage("Welcome to FocusFlow! Ready to crush your goals today? Rock it!", "normal");
    } else {
      const messages = [
        "You're doing great today! 🌟",
        "Keep it up! Let's finish one more task",
        "I'm proud of your effort. 💖 for you!"
      ];
      const message = messages[Math.floor(Math.random() * messages.length)];
      showStudyBuddyMessage(message, "normal");
    }
  }, 300);
}

// Make init globally callable after script loads
window.initStudyBuddy = initStudyBuddy;
