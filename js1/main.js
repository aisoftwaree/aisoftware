if (window.location.href.startsWith('https://hntech.dev')) {
class PortfolioController {
    constructor() {
        this.currentSection = 'home';
        this.isMenuOpen = false;
        this.init();
    }
    
    init() {
        this.setupNavigation();
        this.setupMobileMenu();
        this.setupScrollSpy();
        this.setupContactForm();
        this.setupSmoothScrolling();
        this.setupKeyboardNavigation();
        this.setupProjectInteractions();
        this.setupThemeEffects();
    }
    
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-menu a[data-nav]');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSection = link.getAttribute('data-nav');
                this.navigateToSection(targetSection);
                this.closeMobileMenu();
            });
        });
        
        // Logo click to home
        document.querySelector('.nav-brand').addEventListener('click', () => {
            this.navigateToSection('home');
        });
    }
    
    navigateToSection(sectionName) {
        const targetElement = document.getElementById(sectionName);
        if (!targetElement) return;
        
        // Update active nav link
        this.updateActiveNavLink(sectionName);
        
        // Smooth scroll with GSAP
        gsap.to(window, {
            scrollTo: {
                y: targetElement,
                offsetY: 70 // Account for fixed navbar
            },
            duration: 1.5,
            ease: 'power2.inOut'
        });
        
        // Update Three.js scene
        if (window.threeScene) {
            window.threeScene.updateForSection(sectionName);
        }
        
        this.currentSection = sectionName;
    }
    
    updateActiveNavLink(activeSection) {
        const navLinks = document.querySelectorAll('.nav-menu a[data-nav]');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-nav') === activeSection) {
                link.classList.add('active');
            }
        });
    }
    
    setupMobileMenu() {
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        navToggle.addEventListener('click', () => {
            this.toggleMobileMenu();
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                this.closeMobileMenu();
            }
        });
    }
    
    toggleMobileMenu() {
        const navMenu = document.querySelector('.nav-menu');
        const navToggle = document.querySelector('.nav-toggle');
        
        this.isMenuOpen = !this.isMenuOpen;
        
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
        
        // Animate menu items
        if (this.isMenuOpen) {
            anime({
                targets: '.nav-menu a',
                translateX: [-30, 0],
                opacity: [0, 1],
                duration: 500,
                delay: anime.stagger(100),
                easing: 'easeOutQuart'
            });
        }
    }
    
    closeMobileMenu() {
        const navMenu = document.querySelector('.nav-menu');
        const navToggle = document.querySelector('.nav-toggle');
        
        this.isMenuOpen = false;
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
    }
    
    setupScrollSpy() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-menu a[data-nav]');
        
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -80% 0px',
            threshold: 0
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    this.updateActiveNavLink(sectionId);
                    this.currentSection = sectionId;
                    
                    // Update navbar style based on section
                    this.updateNavbarStyle(sectionId);
                }
            });
        }, observerOptions);
        
        sections.forEach(section => {
            observer.observe(section);
        });
    }
    
    updateNavbarStyle(sectionId) {
        const navbar = document.querySelector('.navbar');
        
        // Add different styles for different sections
        navbar.classList.remove('section-home', 'section-about', 'section-projects', 'section-skills', 'section-contact');
        navbar.classList.add(`section-${sectionId}`);
        
        // Change navbar opacity based on scroll
        const scrollY = window.scrollY;
        if (scrollY > 100) {
            navbar.style.background = 'rgba(10, 10, 10, 0.95)';
        } else {
            navbar.style.background = 'rgba(10, 10, 10, 0.7)';
        }
    }
    
    setupContactForm() {
        const form = document.getElementById('contact-form');
        const submitBtn = document.querySelector('.submit-btn');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(form);
            const data = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                message: document.getElementById('message').value
            };
            
            // Validate form
            if (!this.validateForm(data)) {
                this.showFormError('Vui lòng điền đầy đủ thông tin!');
                return;
            }
            
            // Show loading state
            this.setFormLoading(true);
            
            try {
                // Simulate form submission (replace with actual endpoint)
                await this.submitForm(data);
                this.showFormSuccess('Tin nhắn đã được gửi thành công!');
                form.reset();
            } catch (error) {
                this.showFormError('Có lỗi xảy ra. Vui lòng thử lại!');
            } finally {
                this.setFormLoading(false);
            }
        });
    }
    
    validateForm(data) {
        return data.name.trim() && data.email.trim() && data.message.trim() && 
               this.isValidEmail(data.email);
    }
    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    async submitForm(data) {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Form submitted:', data);
                resolve();
            }, 2000);
        });
    }
    
    setFormLoading(isLoading) {
        const submitBtn = document.querySelector('.submit-btn');
        
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Đang gửi...';
            
            anime({
                targets: submitBtn,
                backgroundColor: '#666',
                duration: 300
            });
        } else {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Message';
            
            anime({
                targets: submitBtn,
                backgroundColor: '#00ffff',
                duration: 300
            });
        }
    }
    
    showFormSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showFormError(message) {
        this.showNotification(message, 'error');
    }
    
    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 25px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            zIndex: '10001',
            transform: 'translateX(400px)',
            background: type === 'success' ? '#00ff88' : '#ff4444',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
        });
        
        document.body.appendChild(notification);
        
        // Animate in
        anime({
            targets: notification,
            translateX: [400, 0],
            duration: 500,
            easing: 'easeOutQuart'
        });
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            anime({
                targets: notification,
                translateX: [0, 400],
                opacity: [1, 0],
                duration: 400,
                easing: 'easeInQuart',
                complete: () => {
                    document.body.removeChild(notification);
                }
            });
        }, 4000);
    }
    
    setupSmoothScrolling() {
        // Prevent default scroll behavior for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = anchor.getAttribute('href').substring(1);
                if (targetId) {
                    this.navigateToSection(targetId);
                }
            });
        });
    }
    
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Navigation with arrow keys
            if (e.ctrlKey || e.metaKey) {
                const sections = ['home', 'about', 'projects', 'skills', 'contact'];
                const currentIndex = sections.indexOf(this.currentSection);
                
                if (e.key === 'ArrowDown' && currentIndex < sections.length - 1) {
                    e.preventDefault();
                    this.navigateToSection(sections[currentIndex + 1]);
                } else if (e.key === 'ArrowUp' && currentIndex > 0) {
                    e.preventDefault();
                    this.navigateToSection(sections[currentIndex - 1]);
                }
            }
            
            // Escape key to close mobile menu
            if (e.key === 'Escape' && this.isMenuOpen) {
                this.closeMobileMenu();
            }
        });
    }
    
    setupProjectInteractions() {
        const projectCards = document.querySelectorAll('.project-card');
        
        projectCards.forEach(card => {
            const btn = card.querySelector('.project-btn');
            
            btn.addEventListener('click', () => {
                const projectType = card.getAttribute('data-project');
                this.showProjectDetails(projectType);
            });
        });
    }
    
    showProjectDetails(projectType) {
        const projectData = {
            mmo: {
                title: 'MMO Game System',
                description: 'Advanced combat system với real-time multiplayer architecture. Bao gồm character progression, guild system, và PvP mechanics.',
                technologies: ['Unity', 'C#', 'Photon Networking', 'MySQL', 'Redis'],
                features: [
                    'Real-time combat system',
                    'Multiplayer synchronization',
                    'Character progression',
                    'Guild management',
                    'PvP arena system'
                ]
            },
            automation: {
                title: 'Automation Suite',
                description: 'Bộ tools automation comprehensive cho game development workflow và testing.',
                technologies: ['Python', 'Selenium', 'OpenCV', 'TensorFlow', 'Docker'],
                features: [
                    'Automated game testing',
                    'Performance monitoring',
                    'CI/CD pipeline integration',
                    'Resource optimization',
                    'Bug detection AI'
                ]
            },
            tools: {
                title: 'Developer Tools',
                description: 'Custom tools và plugins để tăng productivity cho developers và content creators.',
                technologies: ['JavaScript', 'Node.js', 'Electron', 'React', 'MongoDB'],
                features: [
                    'Code generation tools',
                    'Asset management system',
                    'Performance profiler',
                    'Version control integration',
                    'Cross-platform deployment'
                ]
            }
        };
        
        const project = projectData[projectType];
        if (!project) return;
        
        // Create modal
        this.createProjectModal(project);
    }
    
    createProjectModal(project) {
        // Remove existing modal
        const existingModal = document.querySelector('.project-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create modal HTML
        const modal = document.createElement('div');
        modal.className = 'project-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <button class="modal-close">&times;</button>
                <h2>${project.title}</h2>
                <p class="project-description">${project.description}</p>
                
                <div class="project-details">
                    <div class="project-tech">
                        <h3>Technologies</h3>
                        <div class="tech-tags">
                            ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                        </div>
                    </div>
                    
                    <div class="project-features">
                        <h3>Key Features</h3>
                        <ul>
                            ${project.features.map(feature => `<li>${feature}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="modal-btn primary">View Demo</button>
                    <button class="modal-btn secondary">Source Code</button>
                </div>
            </div>
        `;
        
        // Add modal styles
        const modalStyles = `
            .project-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
            }
            
            .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
            }
            
            .modal-content {
                position: relative;
                max-width: 600px;
                max-height: 80vh;
                margin: 20px;
                padding: 2rem;
                background: rgba(10, 10, 10, 0.95);
                border: 1px solid var(--primary-color);
                border-radius: 12px;
                color: white;
                overflow-y: auto;
                transform: scale(0.8);
            }
            
            .modal-close {
                position: absolute;
                top: 1rem;
                right: 1rem;
                width: 40px;
                height: 40px;
                background: none;
                border: none;
                color: var(--primary-color);
                font-size: 24px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.3s ease;
            }
            
            .modal-close:hover {
                background: var(--primary-color);
                color: var(--bg-dark);
            }
            
            .tech-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                margin-top: 1rem;
            }
            
            .tech-tag {
                padding: 0.3rem 0.8rem;
                background: rgba(0, 255, 255, 0.1);
                border: 1px solid var(--primary-color);
                border-radius: 20px;
                font-size: 0.8rem;
                color: var(--primary-color);
            }
            
            .modal-actions {
                display: flex;
                gap: 1rem;
                margin-top: 2rem;
                justify-content: center;
            }
            
            .modal-btn {
                padding: 0.8rem 1.5rem;
                border: none;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .modal-btn.primary {
                background: var(--gradient-primary);
                color: var(--bg-dark);
            }
            
            .modal-btn.secondary {
                background: transparent;
                color: var(--primary-color);
                border: 1px solid var(--primary-color);
            }
        `;
        
        // Add styles to head
        if (!document.querySelector('#modal-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'modal-styles';
            styleEl.textContent = modalStyles;
            document.head.appendChild(styleEl);
        }
        
        document.body.appendChild(modal);
        
        // Animate modal in
        gsap.to(modal, {
            opacity: 1,
            visibility: 'visible',
            duration: 0.3,
            ease: 'power2.out'
        });
        
        gsap.to(modal.querySelector('.modal-content'), {
            scale: 1,
            duration: 0.5,
            delay: 0.1,
            ease: 'back.out(1.7)'
        });
        
        // Close modal events
        const closeModal = () => {
            gsap.to(modal, {
                opacity: 0,
                visibility: 'hidden',
                duration: 0.3,
                ease: 'power2.in',
                onComplete: () => modal.remove()
            });
        };
        
        modal.querySelector('.modal-close').addEventListener('click', closeModal);
        modal.querySelector('.modal-overlay').addEventListener('click', closeModal);
        
        // Escape key to close
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }
    
    setupThemeEffects() {
        // Dynamic color effects based on time
        const updateThemeColors = () => {
            const hour = new Date().getHours();
            const root = document.documentElement;
            
            if (hour >= 6 && hour < 12) {
                // Morning theme
                root.style.setProperty('--primary-color', '#00ddff');
                root.style.setProperty('--secondary-color', '#ff6b6b');
            } else if (hour >= 12 && hour < 18) {
                // Afternoon theme
                root.style.setProperty('--primary-color', '#00ffaa');
                root.style.setProperty('--secondary-color', '#ff8c42');
            } else {
                // Evening/Night theme (default)
                root.style.setProperty('--primary-color', '#00ffff');
                root.style.setProperty('--secondary-color', '#ff0080');
            }
        };
        
        updateThemeColors();

        setInterval(updateThemeColors, 3600000);
    }
}

// Initialize when DOM is loaded
let portfolioController;

window.addEventListener('DOMContentLoaded', () => {
    portfolioController = new PortfolioController();
});

// Performance optimization
window.addEventListener('beforeunload', () => {
    // Cleanup animations and intervals
    gsap.killTweensOf('*');
});

// Export for global access
window.PortfolioController = PortfolioController;
}
