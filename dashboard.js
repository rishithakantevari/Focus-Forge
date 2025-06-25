const toggle = document.getElementById("theme-toggle");
const body = document.body;

// Toggle theme
toggle.addEventListener("change", () => {
  body.classList.toggle("dark");
  localStorage.setItem("theme", body.classList.contains("dark") ? "dark" : "light");
});

// Load saved theme
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    body.classList.add("dark");
    toggle.checked = true;
  }
});

// Dashboard functionality
class DashboardManager {
    constructor() {
        this.tasks= JSON.parse(localStorage.getItem('focusflow-tasks')) || [];
        this.userData = JSON.parse(localStorage.getItem('focusflow-user')) || {};
        this.timerState = {
            isRunning: false,
            isPaused: false,
            timeLeft: 25 * 60, // 25 minutes in seconds
            totalTime: 25 * 60,
            interval: null
        };
        this.focusMode = false;
        this.distractionCount = 0;
        this.focusSessions = parseInt(localStorage.getItem('focusflow-sessions')) || 0;
        
        this.init();
    }

    init() {
        this.loadUserData();
        this.initEventListeners();
        this.renderTasks();
        this.updateStats();
        this.initDragAndDrop();
        this.initVisibilityTracking();
        this.updateTimer();
    }

    loadUserData() {
        const userName = document.getElementById('userName');
        const moodIndicator = document.getElementById('moodIndicator');
        const motivationalMessage = document.getElementById('motivationalMessage');

        if (this.userData.name) {
            userName.textContent = this.userData.name;
        }

        if (this.userData.mood) {
            const moodEmojis = {
                focused: '🎯',
                okay: '😊',
                tired: '😴',
                stressed: '😰',
                motivated: '🚀'
            };
            moodIndicator.textContent = moodEmojis[this.userData.mood] || '😊';
        }

        const motivationalMessages = {
            focused: "You're in the zone! Let's crush those goals! 🎯",
            okay: "Every step forward counts. You've got this! 💪",
            tired: "Take it easy, but keep moving forward. Rest when needed! 😴",
            stressed: "Breathe deep. One task at a time. You're stronger than you think! 🧘",
            motivated: "Your energy is amazing! Channel it into great results! 🚀"
        };

        motivationalMessage.textContent = motivationalMessages[this.userData.mood] || "Ready to conquer your goals today! 💪";
    }

    initEventListeners() {
        // Timer controls
        document.getElementById('startTimer').addEventListener('click', () => this.startTimer());
        document.getElementById('pauseTimer').addEventListener('click', () => this.pauseTimer());
        document.getElementById('resetTimer').addEventListener('click', () => this.resetTimer());

        // Timer presets
        document.querySelectorAll('.timer-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const minutes = parseInt(e.target.getAttribute('data-time'));
                this.setTimer(minutes);
                
                // Update active preset
                document.querySelectorAll('.timer-preset').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
 
        // Task management
        document.getElementById('addTaskBtn').addEventListener('click', () => this.showTaskModal());
        document.getElementById('taskForm').addEventListener('submit', (e) => this.handleTaskSubmit(e));
        document.getElementById('cancelTask').addEventListener('click', () => this.hideTaskModal());

        // Modal controls
        document.querySelector('.modal-close').addEventListener('click', () => this.hideTaskModal());
        document.getElementById('taskModal').addEventListener('click', (e) => {
            if (e.target.id === 'taskModal') {
                this.hideTaskModal();
            }
        });

        // Quick actions
        const focusModeBtn = document.getElementById('focusModeBtn');

        focusModeBtn.addEventListener('click', () => {
        const actionGroup = focusModeBtn.closest('.action-group');
        const dropdown = actionGroup.querySelector('.timer-options');
        
        if (dropdown.classList.contains('hidden')) {
            dropdown.classList.remove('hidden');

            // 👇 Re-trigger animation by resetting the class
            dropdown.style.animation = 'none';
            void dropdown.offsetWidth; // trigger reflow
            dropdown.style.animation = 'slideFadeIn 0.3s ease';
        } else {
            dropdown.classList.add('hidden');
        }
        });

        function navigateToPage(page) {
        const pageUrls = {
            dashboard: 'dashboard.html',
            planner: 'planner.html',
            notes: 'notes.html',
            normaltimer: 'normal-timer.html',
            pomodorotimer: 'pomodoro.html'
        };

        if (pageUrls[page]) {
            window.location.href = pageUrls[page];
        } else {
            alert(`${page} page coming soon!`);
        }
        }

        // Add click events to Pomodoro & Normal buttons
        const subBtns = document.querySelectorAll('.feature-sub-btn');

        subBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.target.getAttribute('data-page');

                if (!page) return;

                if (page === "pomodorotimer") {
                // Show popup instead of direct navigation
                e.preventDefault();
                if (typeof openPomodoroInfo === "function") {
                    openPomodoroInfo();
                }
                } else {
                    navigateToPage(page);
                }
            });
        });
        
        document.getElementById('breakTimeBtn').addEventListener('click', () => this.takeBreak());
        document.getElementById('reviewDayBtn').addEventListener('click', () => this.reviewDay());
        document.getElementById('motivationBtn').addEventListener('click', () => this.showMotivation());

        // Focus mode
        // document.getElementById('exitFocusBtn').addEventListener('click', () => this.exitFocusMode());

        // Distraction alert
        document.getElementById('closeDistraction').addEventListener('click', () => this.closeDistractionAlert());
    }

    // Timer functionality
    setTimer(minutes) {
        if (this.timerState.isRunning) return;
        
        this.timerState.timeLeft = minutes * 60;
        this.timerState.totalTime = minutes * 60;
        this.updateTimer();
    }

    startTimer() {
        if (this.timerState.isRunning) return;

        this.timerState.isRunning = true;
        this.timerState.isPaused = false;
        
        document.getElementById('startTimer').disabled = true;
        document.getElementById('pauseTimer').disabled = false;
        document.getElementById('timerLabel').textContent = 'Focus Time';

        this.timerState.interval = setInterval(() => {
            this.timerState.timeLeft--;
            this.updateTimer();

            if (this.timerState.timeLeft <= 0) {
                this.completeTimer();
            }
        }, 1000);

        this.showNotification('Focus session started! 🎯', 'success');
    }

    pauseTimer() {
        if (!this.timerState.isRunning) return;

        this.timerState.isRunning = false;
        this.timerState.isPaused = true;
        
        clearInterval(this.timerState.interval);
        
        document.getElementById('startTimer').disabled = false;
        document.getElementById('pauseTimer').disabled = true;
        document.getElementById('timerLabel').textContent = 'Paused';

        this.showNotification('Timer paused', 'info');
    }

    resetTimer() {
        this.timerState.isRunning = false;
        this.timerState.isPaused = false;
        
        clearInterval(this.timerState.interval);
        
        this.timerState.timeLeft = this.timerState.totalTime;
        this.updateTimer();
        
        document.getElementById('startTimer').disabled = false;
        document.getElementById('pauseTimer').disabled = true;
        document.getElementById('timerLabel').textContent = 'Focus Time';
    }

    completeTimer() {
        this.timerState.isRunning = false;
        clearInterval(this.timerState.interval);
        
        document.getElementById('startTimer').disabled = false;
        document.getElementById('pauseTimer').disabled = true;
        document.getElementById('timerLabel').textContent = 'Complete!';

        // Update focus sessions
        this.focusSessions++;
        localStorage.setItem('focusflow-sessions', this.focusSessions.toString());
        
        this.updateStats();
        this.showNotification('🎉 Focus session completed! Great work!', 'success', 5000);
        
        // Play completion sound (if supported)
        this.playCompletionSound();
        
        // Reset timer after a delay
        setTimeout(() => {
            this.resetTimer();
        }, 3000);
    }

    updateTimer() {
        const minutes = Math.floor(this.timerState.timeLeft / 60);
        const seconds = this.timerState.timeLeft % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('timerDisplay').textContent = timeString;
        
        // Update progress circle
        const progress = ((this.timerState.totalTime - this.timerState.timeLeft) / this.timerState.totalTime) * 283;
        document.getElementById('timerProgress').style.strokeDashoffset = 283 - progress;
        
        // Update focus mode timer if active
        if (this.focusMode) {
            document.getElementById('focusTimer').textContent = timeString;
        }
    }

    playCompletionSound() {
        // Create a simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Audio not supported');
        }
    }

    // Task management
    showTaskModal() {
        document.getElementById('taskModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
        document.getElementById('taskTitle').focus();
    }

    hideTaskModal() {
        document.getElementById('taskModal').style.display = 'none';
        document.body.style.overflow = 'auto';
        document.getElementById('taskForm').reset();
    }

    handleTaskSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const task = {
            id: Date.now().toString(),
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            priority: document.getElementById('taskPriority').value,
            dueDate: document.getElementById('taskDueDate').value,
            status: 'todo',
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.hideTaskModal();
        
        this.showNotification(`Task "${task.title}" added successfully! 📝`, 'success');
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.showNotification('Task deleted', 'info');
    }

    updateTaskStatus(taskId, newStatus) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.status = newStatus;
            if (newStatus === 'done') {
                task.completedAt = new Date().toISOString();
            } else {
                task.completedAt = null;
            }
            this.saveTasks();
            this.updateStats();
        }
    }

    renderTasks() {
        const todoList = document.getElementById('todoList');
        const doingList = document.getElementById('doingList');
        const doneList = document.getElementById('doneList');

        // Clear existing tasks
        todoList.innerHTML = '';
        doingList.innerHTML = '';
        doneList.innerHTML = '';

        // Group tasks by status
        const tasksByStatus = {
            todo: this.tasks.filter(task => task.status === 'todo'),
            doing: this.tasks.filter(task => task.status === 'doing'),
            done: this.tasks.filter(task => task.status === 'done')
        };

        // Render tasks in each column
        Object.keys(tasksByStatus).forEach(status => {
            const list = document.getElementById(`${status}List`);
            const tasks = tasksByStatus[status];

            tasks.forEach(task => {
                const taskElement = this.createTaskElement(task);
                list.appendChild(taskElement);
            });
        });

        // Update task counts
        document.getElementById('todoCount').textContent = tasksByStatus.todo.length;
        document.getElementById('doingCount').textContent = tasksByStatus.doing.length;
        document.getElementById('doneCount').textContent = tasksByStatus.done.length;

        this.initDragAndDrop();
    }

    // createTaskElement(task) {
    //     const taskDiv = document.createElement('div');
    //     taskDiv.className = 'task-item';
    //     taskDiv.draggable = true;
    //     taskDiv.dataset.taskId = task.id;

    //     const dueDateText = task.dueDate ? 
    //         `Due: ${new Date(task.dueDate).toLocaleDateString()}` : 
    //         'No due date';

    //     taskDiv.innerHTML = `
    //         <div class="task-priority ${task.priority}"></div>
    //         <div class="task-title">${task.title}</div>
    //         ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
    //         <div class="task-due-date">${dueDateText}</div>
    //         <button class="task-delete" onclick="dashboard.deleteTask('${task.id}')" style="
    //             position: absolute;
    //             top: 0.5rem;
    //             left: 0.5rem;
    //             background: rgba(239, 68, 68, 0.2);
    //             border: none;
    //             color: #ef4444;
    //             width: 20px;
    //             height: 20px;
    //             border-radius: 50%;
    //             font-size: 12px;
    //             cursor: pointer;
    //             display: flex;
    //             align-items: center;
    //             justify-content: center;
    //         ">&times;</button>
    //     `;

    //     return taskDiv;
    // }

    createTaskElement(task) {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task-item';
        taskDiv.draggable = true;
        taskDiv.dataset.taskId = task.id;

        const dueDateText = task.dueDate ? 
            `Due: ${new Date(task.dueDate).toLocaleDateString()}` : 
            'No due date';

        taskDiv.innerHTML = `
            <div class="task-priority ${task.priority}"></div>
            <div class="task-title">${task.title}</div>
            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
            <div class="task-due-date">${dueDateText}</div>
            <button class="task-delete" data-id="${task.id}" style="
                position: absolute;
                top: 0.5rem;
                left: 0.5rem;
                background: rgba(239, 68, 68, 0.2);
                border: none;
                color: #ef4444;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                font-size: 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            ">&times;</button>
        `;

        const deleteBtn = taskDiv.querySelector('.task-delete');
        deleteBtn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            this.deleteTask(id);
        });

        return taskDiv;
    }


    initDragAndDrop() {
        let draggedTask = null;

        // Add drag event listeners to task lists
        document.querySelectorAll('.task-list').forEach(list => {
            list.addEventListener('dragover', (e) => {
                e.preventDefault();
                list.style.background = 'rgba(139, 92, 246, 0.1)';
            });

            list.addEventListener('dragleave', (e) => {
                if (!list.contains(e.relatedTarget)) {
                    list.style.background = '';
                }
            });

            list.addEventListener('drop', (e) => {
                e.preventDefault();
                list.style.background = '';
                
                if (draggedTask) {
                    const newStatus = list.dataset.status;
                    this.updateTaskStatus(draggedTask, newStatus);
                    this.renderTasks();
                    
                    if (newStatus === 'done') {
                        this.showNotification('🎉 Task completed! Great job!', 'success');
                    }
                }
            });
        });

        // Add drag event listeners to tasks (delegated)
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-item')) {
                draggedTask = e.target.dataset.taskId;
                e.target.classList.add('dragging');
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task-item')) {
                e.target.classList.remove('dragging');
                draggedTask = null;
            }
        });
    }

    saveTasks() {
        localStorage.setItem('focusflow-tasks', JSON.stringify(this.tasks));
    }

    updateStats() {
        const completedTasks = this.tasks.filter(task => task.status === 'done').length;
        const totalTasks = this.tasks.length;
        const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Update stat cards
        document.getElementById('tasksCompleted').textContent = completedTasks;
        document.getElementById('focusTime').textContent = `${this.focusSessions * 25}m`;
        
        // Update progress card
        document.getElementById('progressPercentage').textContent = `${progressPercentage}%`;
        document.getElementById('progressFill').style.width = `${progressPercentage}%`;
        document.getElementById('progressTasks').textContent = `${completedTasks}/${totalTasks}`;
        document.getElementById('progressSessions').textContent = this.focusSessions;
        
        // Calculate productivity score
        const productivityScore = Math.min(100, (completedTasks * 10) + (this.focusSessions * 5));
        document.getElementById('productivityScore').textContent = productivityScore;
    }

    // Quick actions
    takeBreak() {
        if (this.timerState.isRunning) {
            this.pauseTimer();
        }
        
        this.showNotification('Break time! 🌟 Remember to stretch and hydrate!', 'info', 5000);
        
        // Set a 5-minute break timer
        this.setTimer(5);
        document.getElementById('timerLabel').textContent = 'Break Time';
    }

    reviewDay() {
        const completedTasks = this.tasks.filter(task => task.status === 'done').length;
        const totalTasks = this.tasks.length;
        const focusHours = Math.round((this.focusSessions * 25) / 60 * 10) / 10;
        
        const reviewMessage = `
            📊 Daily Review:
            ✅ Completed ${completedTasks} out of ${totalTasks} tasks
            ⏰ Focused for ${focusHours} hours
            🎯 ${this.focusSessions} focus sessions
            
            ${completedTasks > 0 ? 'Great progress today! 🌟' : 'Tomorrow is a new opportunity! 💪'}
        `;
        
        this.showNotification(reviewMessage, 'info', 8000);
    }

    showMotivation() {
        const motivations = [
            "💪 Push yourself, because no one else is going to do it for you!",
            "🔥 Don’t watch the clock; do what it does. Keep going.",
            "🎯 Success is the sum of small efforts, repeated daily.",
            "🚀 You don’t have to be great to start, but you have to start to be great.",
            "🌱 It’s not about having time. It’s about making time.",
            "📘 Discipline is choosing between what you want now and what you want most."
        ];

        const randomQuote = motivations[Math.floor(Math.random() * motivations.length)];
        this.showNotification(randomQuote, 'info', 5000);
    }

    // Distraction tracking
    initVisibilityTracking() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.distractionCount++;
                console.log('User left the page - distraction detected');
            } else {
                if (this.distractionCount > 0) {
                    this.showDistractionAlert();
                }
            }
        });
    }

    showDistractionAlert() {
        const alert = document.getElementById('distractionAlert');
        alert.style.display = 'block';
        
        setTimeout(() => {
            this.closeDistractionAlert();
        }, 5000);
    }

    closeDistractionAlert() {
        document.getElementById('distractionAlert').style.display = 'none';
    }

    // Notification system
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Add notification styles if not already present
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    z-index: 3000;
                    background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
                    color: white;
                    padding: 1rem;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
                    animation: slideInRight 0.3s ease;
                    max-width: 400px;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                
                .notification-success {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
                }
                
                .notification-error {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    box-shadow: 0 10px 30px rgba(239, 68, 68, 0.3);
                }
                
                .notification-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 1rem;
                }
                
                .notification-message {
                    white-space: pre-line;
                    line-height: 1.4;
                }
                
                .notification-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.2rem;
                    cursor: pointer;
                    opacity: 0.7;
                    transition: opacity 0.3s ease;
                    flex-shrink: 0;
                }
                
                .notification-close:hover {
                    opacity: 1;
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.removeNotification(notification);
        });

        // Auto remove after duration
        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);
    }

    removeNotification(notification) {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }
}

// Initialize dashboard when DOM is loaded
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new DashboardManager();
});

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Space to start/pause timer
    if (e.code === 'Space' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        if (dashboard.timerState.isRunning) {
            dashboard.pauseTimer();
        } else {
            dashboard.startTimer();
        }
    }
    
    // Escape to exit focus mode
    if (e.key === 'Escape' && dashboard.focusMode) {
        dashboard.exitFocusMode();
    }
    
    // Ctrl/Cmd + N to add new task
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        dashboard.showTaskModal();
    }
    
    // F to enter focus mode
    if (e.key === 'f' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        dashboard.toggleFocusMode();
    }
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardManager;
}