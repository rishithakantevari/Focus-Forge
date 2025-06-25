// Modal Controls
function openPomodoroInfo() {
  const modal = document.getElementById("pomodoro-info-popup");
  const box = modal.querySelector(".pomodoro-box");

  modal.classList.remove("hidden");
  box.style.animation = "none";        // restart animation
  void box.offsetWidth;                // force reflow
  box.style.animation = "slideFadeUp 0.4s ease forwards";
}

function closePomodoroInfo() {
  document.getElementById("pomodoro-info-popup").classList.add("hidden");
}

function goToPomodoro() {
  window.location.href = "pomodoro.html"; // adjust path if needed
}

// ⏺️ Intercept Pomodoro button click
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".feature-sub-btn").forEach(button => {
    const page = button.getAttribute("data-page");
    if (page === "pomodorotimer") {
      button.addEventListener("click", function (e) {
        e.preventDefault(); // stop default navigation
        openPomodoroInfo(); // open the popup
      });
    } else {
      button.addEventListener("click", function () {
        window.location.href = `${page}.html`;
      });
    }
  });
});
