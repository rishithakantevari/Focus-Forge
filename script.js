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

const FocusFlow = {
    currentPage: 'home',
    userData: JSON.parse(localStorage.getItem('focusflow-user')) || {},
    
    init() {
        this.initEventListeners();
        this.initAnimations();
        this.initScrollAnimations();
        this.checkUserData();
    },

    initEventListeners() {
        // Get Started button
        const getStartedBtn = document.getElementById('getStartedBtn');
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', this.showWelcomeModal.bind(this));
        }

        // Learn More button
        const learnMoreBtn = document.getElementById('learnMoreBtn');
        if (learnMoreBtn) {
            learnMoreBtn.addEventListener('click', () => {
                document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
            });
        }

        //Feature buttons
        // const featureBtns = document.querySelectorAll('.feature-btn, .feature-sub-btn');
        // featureBtns.forEach(btn => {
        //     btn.addEventListener('click', (e) => {
        //         if (btn.classList.contains('has-dropdown')) {
        //             const dropdown = btn.nextElementSibling;
        //             if (dropdown && dropdown.classList.contains("timer-options")) {
        //                 dropdown.classList.toggle("hidden");
        //             }
        //         } else {
        //             const page = e.target.getAttribute('data-page');
        //             this.navigateToPage(page);
        //         }
        //     });
        // });

        const featureBtns = document.querySelectorAll('.feature-btn, .feature-sub-btn');

        featureBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (btn.classList.contains('has-dropdown')) {
                    const dropdown = btn.nextElementSibling;
                    if (dropdown && dropdown.classList.contains("timer-options")) {
                        dropdown.classList.toggle("hidden");
                    }
                } else {
                    const page = e.target.getAttribute('data-page');

                    // Intercept Pomodoro only — show intro popup instead of navigating
                    if (page === "pomodorotimer") {
                        e.preventDefault();
                        if (typeof openPomodoroInfo === "function") {
                            openPomodoroInfo();
                        }
                    } else {
                        // For all other pages, continue normal navigation
                        this.navigateToPage(page);
                    }
                }
            });
        });

        // ✅ If `navigateToPage` was inside a class or module, define it globally here if needed:
        // function navigateToPage(page) {
        //     window.location.href = `${page}.html`;
        // }

        // Modal functionality
        const modal = document.getElementById('welcomeModal');
        const closeModal = document.querySelector('.modal-close');
        
        if (closeModal) {
            closeModal.addEventListener('click', this.hideWelcomeModal);
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideWelcomeModal();
                }
            });
        }

        // Setup buttons
        const setupBtns = document.querySelectorAll('.setup-btn');
        setupBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const setup = e.target.closest('.setup-btn').getAttribute('data-setup');
                this.handleSetup(setup);
            });
        });

        // Button ripple effect
        const primaryBtns = document.querySelectorAll('.btn-primary');
        primaryBtns.forEach(btn => {
            btn.addEventListener('click', this.createRipple);
        });

        // Smooth navigation
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    },

    initAnimations() {
        // Typing animation for hero title
        this.initTypingAnimation();
        
        // Counter animation for stats
        this.animateCounters();
        
        // Floating shapes
        this.initFloatingShapes();
    },

    initTypingAnimation() {
        const typingText = document.querySelector('.typing-text');
        if (!typingText) return;

        const text = typingText.getAttribute('data-text') || 'Focus';
        typingText.innerHTML = '';
        
        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                typingText.innerHTML += text.charAt(i);
                i++;
                setTimeout(typeWriter, 150);
            } else {
                // Remove cursor after typing is complete
                setTimeout(() => {
                    typingText.style.borderRight = 'none';
                }, 1000);
            }
        };
        
        setTimeout(typeWriter, 1000);
    },

    initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    // Animate counters when they come into view
                    if (entry.target.querySelector('.stat-number')) {
                        this.animateCounters();
                    }
                }
            });
        }, observerOptions);

        const animatedElements = document.querySelectorAll('.animate-on-scroll');
        animatedElements.forEach(el => observer.observe(el));

        // Navbar background on scroll
        window.addEventListener('scroll', () => {
            const navbar = document.querySelector('.navbar');
            if (window.scrollY > 100) {
                navbar.style.background = 'rgba(0, 0, 0, 0.3)';
            } else {
                navbar.style.background = 'rgba(0, 0, 0, 0.1)';
            }
        });
    },

    animateCounters() {
        const counters = document.querySelectorAll('.stat-number');
        
        counters.forEach(counter => {
            if (counter.classList.contains('animated')) return;
            
            const target = parseInt(counter.getAttribute('data-target'));
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;
            
            const updateCounter = () => {
                if (current < target) {
                    current += step;
                    counter.textContent = Math.floor(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target;
                    counter.classList.add('animated');
                }
            };
            
            updateCounter();
        });
    },

    initFloatingShapes() {
        const shapes = document.querySelectorAll('.floating-shape');
        
        shapes.forEach((shape, index) => {
            // Random animation duration
            const duration = 15 + Math.random() * 10;
            shape.style.animationDuration = `${duration}s`;
            
            // Random starting position
            const randomX = Math.random() * 100;
            const randomY = Math.random() * 100;
            shape.style.left = `${randomX}%`;
            shape.style.top = `${randomY}%`;
        });
    },

    createRipple(e) {
        const button = e.currentTarget;
        const ripple = button.querySelector('.btn-ripple');
        
        if (!ripple) return;
        
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('active');
        
        setTimeout(() => {
            ripple.classList.remove('active');
        }, 600);
    },

    showWelcomeModal() {
        const modal = document.getElementById('welcomeModal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    },

    hideWelcomeModal() {
        const modal = document.getElementById('welcomeModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    },

    handleSetup(setupType) {
        this.hideWelcomeModal();
        
        switch(setupType) {
            case 'identity':
                this.showIdentitySetup();
                break;
            case 'dashboard':
                this.navigateToPage('dashboard');
                break;
            case 'pdfparser':
                this.navigateToPage('pdfparser');
                break;
            case 'notes':
                this.navigateToPage('notes');
                break;
            default:
                console.log('Unknown setup type:', setupType);
        }
    },

    showIdentitySetup() {
        // Create identity setup modal
        const identityModal = this.createIdentityModal();
        document.body.appendChild(identityModal);
        identityModal.style.display = 'block';
    },

    createIdentityModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'identityModal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Set Up Your Identity</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="identityForm">
                        <div class="form-group">
                            <label for="userName">What's your name?</label>
                            <input type="text" id="userName" placeholder="Enter your name" required>
                        </div>
                        <div class="form-group">
                            <label for="userGoals">What are your main goals?</label>
                            <textarea id="userGoals" placeholder="e.g., Complete assignments, Study effectively, Stay organized" rows="3"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="currentMood">How are you feeling today?</label>
                            <select id="currentMood">
                                <option value="focused">Focused & Ready</option>
                                <option value="okay">Okay</option>
                                <option value="tired">Tired</option>
                                <option value="stressed">Stressed</option>
                                <option value="motivated">Highly Motivated</option>
                            </select>
                        </div>
                        <button type="submit" class="btn-primary">Save & Continue</button>
                    </form>
                </div>
            </div>
        `;

        // Add event listeners
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });

        const form = modal.querySelector('#identityForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveUserIdentity(form);
            modal.remove();
        });

        return modal;
    },

    saveUserIdentity(form) {
        const formData = new FormData(form);
        const userData = {
            name: form.querySelector('#userName').value,
            goals: form.querySelector('#userGoals').value,
            mood: form.querySelector('#currentMood').value,
            setupDate: new Date().toISOString(),
            lastActive: new Date().toISOString()
        };

        this.userData = userData;
        localStorage.setItem('focusflow-user', JSON.stringify(userData));
        
        this.showWelcomeMessage(userData);
    },

    showWelcomeMessage(userData) {
        const motivationalQuotes = {
            focused: "Great! You're in the zone. Let's make today productive!",
            okay: "Every journey starts with a single step. You've got this!",
            tired: "Rest when you need to, but don't give up. Small steps count too!",
            stressed: "Take a deep breath. We'll help you organize and reduce that stress.",
            motivated: "Your energy is contagious! Let's channel it into amazing results!"
        };

        const quote = motivationalQuotes[userData.mood] || "Welcome to your productivity journey!";
        
        this.showNotification(`Welcome ${userData.name}! ${quote}`, 'success', 5000);
        
        // Navigate to dashboard after a short delay
        setTimeout(() => {
            this.navigateToPage('dashboard');
        }, 2000);
    },

    navigateToPage(page) {
        // Navigate to actual page files
        const pageUrls = {
            dashboard: 'dashboard.html',
            pdfparser: 'pdf-parser.html',
            notes: 'sticky-board.html',
            normaltimer: 'normal-timer.html',
            pomodorotimer: 'pomodoro.html'
        };
        
        if (pageUrls[page]) {
            window.location.href = pageUrls[page];
        } else {
            this.showNotification(`${page.charAt(0).toUpperCase() + page.slice(1)} page coming soon!`, 'info', 3000);
        }
        
        this.currentPage = page;
    },

    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Add notification styles
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    z-index: 3000;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 1rem;
                    border-radius: 10px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    animation: slideInRight 0.3s ease;
                    max-width: 400px;
                    backdrop-filter: blur(10px);
                }
                
                .notification-success {
                    background: linear-gradient(135deg, #48dbfb 0%, #0abde3 100%);
                }
                
                .notification-error {
                    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                }
                
                .notification-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 1rem;
                }
                
                .notification-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.2rem;
                    cursor: pointer;
                    opacity: 0.7;
                    transition: opacity 0.3s ease;
                }
                
                .notification-close:hover {
                    opacity: 1;
                }
                
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
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
    },

    removeNotification(notification) {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    },

    checkUserData() {
        // Check if user has existing data and show appropriate welcome
        if (this.userData.name) {
            const lastActive = new Date(this.userData.lastActive);
            const now = new Date();
            const hoursSinceActive = (now - lastActive) / (1000 * 60 * 60);
            
            if (hoursSinceActive > 24) {
                setTimeout(() => {
                    this.showNotification(`Welcome back, ${this.userData.name}! Ready to be productive?`, 'info', 4000);
                }, 2000);
            }
            
            // Update last active
            this.userData.lastActive = now.toISOString();
            localStorage.setItem('focusflow-user', JSON.stringify(this.userData));
        }
    }
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    FocusFlow.init();
});

// Handle page visibility changes for focus tracking
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('User left the page - tracking distraction');
    } else {
        console.log('User returned to the page');
        if (FocusFlow.userData.name) {
            FocusFlow.showNotification('Welcome back! Let\'s refocus.', 'info', 2000);
        }
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to open quick navigation
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        FocusFlow.showWelcomeModal();
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display === 'block') {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }
});

// Performance optimization - lazy load heavy components
const lazyLoadComponents = () => {
    // This would load dashboard, pdf-summarizer, notes components only when needed
    console.log('Lazy loading components...');
};

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FocusFlow;
}
