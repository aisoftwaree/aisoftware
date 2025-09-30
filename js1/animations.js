
gsap.registerPlugin(ScrollTrigger);

class AnimationController {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupLoadingAnimation();
        this.setupHeroAnimations();
        this.setupScrollAnimations();
        this.setupSectionAnimations();
        this.setupMicroInteractions();
        this.setupSkillBars();
        this.setupProjectCards();
    }
    
    setupLoadingAnimation() {
        const tl = gsap.timeline();
        
        tl.to('.loading-progress', {
            width: '100%',
            duration: 2,
            ease: 'power2.inOut'
        })
        .to('.loading-text', {
            innerHTML: 'Nigga!',
            duration: 0.5
        }, '-=0.5')
        .to('#loading-screen', {
            opacity: 0,
            duration: 1,
            ease: 'power2.inOut',
            onComplete: () => {
                document.getElementById('loading-screen').style.display = 'none';
                this.startMainAnimations();
            }
        }, '+=0.5');
    }
    
    startMainAnimations() {
        anime({
            targets: '.hero-logo',
            scale: [0, 1],
            opacity: [0, 1],
            duration: 1500,
            delay: 200,
            easing: 'easeOutElastic(1, .6)'
        });
        anime({
            targets: '.title-word',
            translateY: [100, 0],
            opacity: [0, 1],
            duration: 1200,
            delay: anime.stagger(200, {start: 800}),
            easing: 'easeOutElastic(1, .8)'
        });
        
        anime({
            targets: '.subtitle-word',
            translateX: [-50, 0],
            opacity: [0, 1],
            duration: 1000,
            delay: anime.stagger(150, {start: 1400}),
            easing: 'easeOutQuart'
        });
        
        gsap.from('.hero-description', {
            y: 50,
            opacity: 0,
            duration: 1,
            delay: 2.2,
            ease: 'power2.out'
        });
        
        gsap.from('.cta-button', {
            scale: 0.8,
            opacity: 0,
            duration: 0.8,
            delay: 2.8,
            stagger: 0.2,
            ease: 'back.out(1.7)'
        });
        

        anime({
            targets: '.media-item',
            scale: [0.8, 1],
            opacity: [0, 1],
            translateY: [50, 0],
            duration: 1000,
            delay: anime.stagger(200, {start: 3500}),
            easing: 'easeOutElastic(1, .6)'
        });
        
        gsap.from('.scroll-indicator', {
            y: 30,
            opacity: 0,
            duration: 1,
            delay: 4.5,
            ease: 'power2.out'
        });
    }
    
    setupHeroAnimations() {
        gsap.to('.hero-content', {
            yPercent: -50,
            ease: 'none',
            scrollTrigger: {
                trigger: '.hero-section',
                start: 'top top',
                end: 'bottom top',
                scrub: true
            }
        });
        gsap.to('.hero-title', {
            scale: 0.8,
            opacity: 0.5,
            ease: 'none',
            scrollTrigger: {
                trigger: '.hero-section',
                start: 'top top',
                end: 'bottom top',
                scrub: true
            }
        });
    }
    
    setupScrollAnimations() {
        gsap.utils.toArray('section:not(.hero-section)').forEach(section => {
            gsap.from(section, {
                y: 100,
                opacity: 0,
                duration: 1.5,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: section,
                    start: 'top 80%',
                    end: 'top 50%',
                    toggleActions: 'play none none reverse'
                }
            });
        });
        

        gsap.utils.toArray('.section-title').forEach(title => {
            gsap.from(title, {
                y: 50,
                opacity: 0,
                duration: 1,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: title,
                    start: 'top 90%',
                    toggleActions: 'play none none reverse'
                }
            });
        });
        
        gsap.utils.toArray('.section-subtitle').forEach(subtitle => {
            gsap.from(subtitle, {
                x: -30,
                opacity: 0,
                duration: 0.8,
                delay: 0.3,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: subtitle,
                    start: 'top 90%',
                    toggleActions: 'play none none reverse'
                }
            });
        });
    }
    
    setupSectionAnimations() {
        ScrollTrigger.batch('.about-card', {
            onEnter: (elements) => {
                anime({
                    targets: elements,
                    translateY: [60, 0],
                    opacity: [0, 1],
                    duration: 1000,
                    delay: anime.stagger(200),
                    easing: 'easeOutElastic(1, .8)'
                });
            },
            start: 'top 85%'
        });
        ScrollTrigger.batch('.profile-image', {
            onEnter: (elements) => {
                anime({
                    targets: elements,
                    scale: [0.8, 1],
                    opacity: [0, 1],
                    duration: 1200,
                    easing: 'easeOutElastic(1, .6)'
                });
            },
            start: 'top 85%'
        });
        ScrollTrigger.batch('.stat-number', {
            onEnter: (elements) => {
                elements.forEach(element => {
                    const target = parseInt(element.getAttribute('data-target'));
                    let current = 0;
                    
                    const counter = () => {
                        const increment = target / 60; // 60 frames for smooth animation
                        current += increment;
                        
                        if (current < target) {
                            element.textContent = Math.floor(current);
                            requestAnimationFrame(counter);
                        } else {
                            element.textContent = target;
                        }
                    };
                    
                    setTimeout(counter, 500);
                });
            },
            start: 'top 85%'
        });
        
        ScrollTrigger.batch('.skills-category', {
            onEnter: (elements) => {
                gsap.from(elements, {
                    y: 50,
                    opacity: 0,
                    duration: 1,
                    stagger: 0.3,
                    ease: 'power2.out'
                });
            },
            start: 'top 80%'
        });
        
        ScrollTrigger.batch('.contact-item', {
            onEnter: (elements) => {
                anime({
                    targets: elements,
                    translateX: [-100, 0],
                    opacity: [0, 1],
                    duration: 800,
                    delay: anime.stagger(150),
                    easing: 'easeOutQuart'
                });
            },
            start: 'top 85%'
        });
    }
    
    setupMicroInteractions() {
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('mouseenter', () => {
                anime({
                    targets: link,
                    scale: 1.1,
                    duration: 300,
                    easing: 'easeOutQuart'
                });
            });
            
            link.addEventListener('mouseleave', () => {
                anime({
                    targets: link,
                    scale: 1,
                    duration: 300,
                    easing: 'easeOutQuart'
                });
            });
        });
        
        document.querySelectorAll('.cta-button, .project-btn, .submit-btn').forEach(button => {
            button.addEventListener('mouseenter', () => {
                anime({
                    targets: button,
                    scale: 1.05,
                    duration: 300,
                    easing: 'easeOutQuart'
                });
            });
            
            button.addEventListener('mouseleave', () => {
                anime({
                    targets: button,
                    scale: 1,
                    duration: 300,
                    easing: 'easeOutQuart'
                });
            });
        });
        
        document.querySelectorAll('.about-card, .project-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                anime({
                    targets: card,
                    translateY: -10,
                    scale: 1.02,
                    duration: 400,
                    easing: 'easeOutQuart'
                });
            });
            
            card.addEventListener('mouseleave', () => {
                anime({
                    targets: card,
                    translateY: 0,
                    scale: 1,
                    duration: 400,
                    easing: 'easeOutQuart'
                });
            });
        });
        
        document.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('focus', () => {
                anime({
                    targets: input,
                    scale: 1.02,
                    duration: 300,
                    easing: 'easeOutQuart'
                });
            });
            
            input.addEventListener('blur', () => {
                anime({
                    targets: input,
                    scale: 1,
                    duration: 300,
                    easing: 'easeOutQuart'
                });
            });
        });
    }
    
    setupSkillBars() {
        ScrollTrigger.batch('.skill-progress', {
            onEnter: (elements) => {
                elements.forEach(bar => {
                    const progress = bar.getAttribute('data-progress');
                    gsap.to(bar, {
                        width: `${progress}%`,
                        duration: 1.5,
                        delay: 0.5,
                        ease: 'power2.out'
                    });
                });
            },
            start: 'top 85%'
        });
    }
    
    setupProjectCards() {
        ScrollTrigger.batch('.project-card', {
            onEnter: (elements) => {
                anime({
                    targets: elements,
                    rotateY: [90, 0],
                    opacity: [0, 1],
                    duration: 1000,
                    delay: anime.stagger(200),
                    easing: 'easeOutElastic(1, .6)'
                });
            },
            start: 'top 85%'
        });
        
        document.querySelectorAll('.project-card').forEach(card => {
            const tags = card.querySelectorAll('.project-tags span');
            
            card.addEventListener('mouseenter', () => {
                anime({
                    targets: tags,
                    scale: [1, 1.1, 1],
                    duration: 600,
                    delay: anime.stagger(50),
                    easing: 'easeOutElastic(1, .6)'
                });
            });
        });
    }
    
    revealText(selector, delay = 0) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            const text = element.textContent;
            element.innerHTML = text.split('').map(char => 
                `<span style="display: inline-block; opacity: 0; transform: translateY(20px);">${char === ' ' ? '&nbsp;' : char}</span>`
            ).join('');
            
            anime({
                targets: `${selector} span`,
                opacity: [0, 1],
                translateY: [20, 0],
                duration: 800,
                delay: anime.stagger(30, {start: delay}),
                easing: 'easeOutQuart'
            });
        });
    }
    
    transitionTo(targetSection) {
        const currentY = window.scrollY;
        const targetElement = document.querySelector(targetSection);
        const targetY = targetElement.offsetTop;
        
        gsap.to(window, {
            scrollTo: targetY,
            duration: 1.5,
            ease: 'power2.inOut'
        });
        
        if (window.threeScene) {
            window.threeScene.updateForSection(targetSection.replace('#', ''));
        }
    }
}

class CursorTrail {
    constructor() {
        this.cursor = document.querySelector('.cursor');
        this.follower = document.querySelector('.cursor-follower');
        this.pos = { x: 0, y: 0 };
        this.mouse = { x: 0, y: 0 };
        
        this.init();
    }
    
    init() {
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        
        this.updateCursor();
        document.querySelectorAll('a, button, .project-card, .about-card').forEach(el => {
            el.addEventListener('mouseenter', () => {
                this.cursor.style.transform = 'scale(1.5)';
                this.follower.style.transform = 'scale(1.5)';
            });
            
            el.addEventListener('mouseleave', () => {
                this.cursor.style.transform = 'scale(1)';
                this.follower.style.transform = 'scale(1)';
            });
        });
    }
    
    updateCursor() {
        const speed = 0.15;
        
        this.pos.x += (this.mouse.x - this.pos.x) * speed;
        this.pos.y += (this.mouse.y - this.pos.y) * speed;
        
        this.cursor.style.left = this.mouse.x + 'px';
        this.cursor.style.top = this.mouse.y + 'px';
        
        this.follower.style.left = this.pos.x + 'px';
        this.follower.style.top = this.pos.y + 'px';
        
        requestAnimationFrame(() => this.updateCursor());
    }
}
let animationController, cursorTrail;

window.addEventListener('DOMContentLoaded', () => {
    animationController = new AnimationController();
    cursorTrail = new CursorTrail();
});

// Export for use in other files
window.AnimationController = AnimationController;
