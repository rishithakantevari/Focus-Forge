let timer;
let timeLeft = 1500;
let isRunning = false;
let isBreak = false;
let completed = 0;
let totalPomodoros = 1;
let currentPomodoro = 0;

const timeDisplay = document.getElementById('time');
const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('pause');
const resetBtn = document.getElementById('reset');
const statusDisplay = document.getElementById('status');
const sessionCount = document.getElementById('sessionCount');
const progressCircle = document.getElementById('progressCircle');
const pomodoroCountInput = document.getElementById('pomodoroCount');

const updateTimeDisplay = () => {
  let minutes = Math.floor(timeLeft / 60);
  let seconds = timeLeft % 60;
  timeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  let percentage = (timeLeft / (isBreak ? (completed % 4 === 0 ? 900 : 300) : 1500));
  progressCircle.style.strokeDashoffset = 565.48 * (1 - percentage);
};

const switchMode = () => {
  if (isBreak) {
    timeLeft = (completed % 4 === 0) ? 900 : 300;
    statusDisplay.textContent = completed % 4 === 0 ? "Long Break" : "Short Break";
  } else {
    timeLeft = 1500;
    statusDisplay.textContent = "Focus";
    currentPomodoro++;
  }
  updateTimeDisplay();
};

const startTimer = () => {
  if (isRunning) return;
  isRunning = true;
  totalPomodoros = parseInt(pomodoroCountInput.value) || 1;
  timer = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateTimeDisplay();
    } else {
      clearInterval(timer);
      isRunning = false;
      if (!isBreak) {
        completed++;
        sessionCount.textContent = `Sessions Completed: ${completed}`;
      }
      isBreak = !isBreak;
      if (!isBreak && currentPomodoro >= totalPomodoros) {
        statusDisplay.textContent = "All Pomodoros Completed!";
        return;
      }
      switchMode();
      startTimer();
    }
  }, 1000);
};

const pauseTimer = () => {
  clearInterval(timer);
  isRunning = false;
};

const resetTimer = () => {
  clearInterval(timer);
  isRunning = false;
  isBreak = false;
  timeLeft = 1500;
  completed = 0;
  currentPomodoro = 0;
  statusDisplay.textContent = "Focus";
  sessionCount.textContent = "Sessions Completed: 0";
  updateTimeDisplay();
};

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

document.getElementById('darkModeToggle').addEventListener('change', () => {
  document.body.classList.toggle('dark-mode');
});

updateTimeDisplay();
