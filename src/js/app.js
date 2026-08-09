
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const navCloseBtn = document.getElementById('navCloseBtn');
const navGreeting = document.getElementById('navGreeting');
const clientAssetVersion = document.currentScript
    ? new URL(document.currentScript.src).searchParams.get('v')
    : null;

let navTypewriterTimeout;
let navTypewriterIndex = 0;

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function loadDeferredIconStyles() {
    const stylesheets = ['/vendor/fontawesome/css/all.min.css'];
    if (document.querySelector('[class*="devicon-"]')) {
        stylesheets.push('/vendor/devicon/devicon-subset.css');
    }

    stylesheets.forEach(href => {
        if (document.querySelector(`link[href^="${href}"]`)) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = clientAssetVersion ? `${href}?v=${encodeURIComponent(clientAssetVersion)}` : href;
        document.head.appendChild(link);
    });
}

window.addEventListener('load', () => {
    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(loadDeferredIconStyles, { timeout: 1500 });
    } else {
        setTimeout(loadDeferredIconStyles, 0);
    }
}, { once: true });

function scrollToTarget(target) {
    const offset = -80;
    const offsetTop = target.offsetTop + offset;
    window.scrollTo({
        top: offsetTop,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth'
    });
}

function typeWriterNav(text, element) {
    element.textContent = '';
    element.classList.add('typing');
    navTypewriterIndex = 0;

    function type() {
        if (navTypewriterIndex < text.length) {
            element.textContent = text.substring(0, navTypewriterIndex + 1);
            navTypewriterIndex++;
            navTypewriterTimeout = setTimeout(type, 50);
        } else {
            element.classList.remove('typing');
        }
    }

    type();
}

function closeNavMenu() {
    if (navMenu) {
        navMenu.classList.remove('active');
        if (hamburger) hamburger.classList.remove('active');
        if (navGreeting) {
            clearTimeout(navTypewriterTimeout);
            navGreeting.textContent = '';
            navGreeting.classList.remove('typing');
        }
    }
}

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');


        if (navMenu.classList.contains('active') && navGreeting) {
            setTimeout(() => {
                typeWriterNav('hey there', navGreeting);
            }, 300);
        } else if (navGreeting) {
            clearTimeout(navTypewriterTimeout);
            navGreeting.textContent = '';
            navGreeting.classList.remove('typing');
        }
    });
}

if (navCloseBtn) {
    navCloseBtn.addEventListener('click', closeNavMenu);
}


if (navMenu) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            closeNavMenu();
        });
    });
}


document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            scrollToTarget(target);
        }
    });
});


const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);


function calculateAge(birthdate) {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}


function updateAge() {
    const ageElement = document.getElementById('age');
    if (ageElement) {
        const birthdate = '2008-01-01';
        const age = calculateAge(birthdate);
        ageElement.textContent = age;
    }
}


document.addEventListener('DOMContentLoaded', () => {
    updateAge();

    const fadeElements = document.querySelectorAll('.timeline-item, .project-card, .skill-item, .language-item');
    fadeElements.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });


    initSkillsSelection();
    initIconDocks();
    initHeroTitleAnimate();
    initHeroLinesAnimate();
    initTextAnimateTitles();
    calculateWorkDurations();

    if (window.location.hash) {
        const target = document.querySelector(window.location.hash);
        if (target) scrollToTarget(target);
    }


    const resumeLink = document.getElementById('resumeLink');
    const toast = document.getElementById('toast');

    if (resumeLink && toast) {
        resumeLink.addEventListener('click', (e) => {

            setTimeout(() => {
                toast.classList.add('show');


                setTimeout(() => {
                    toast.classList.remove('show');
                }, 3000);
            }, 100);
        });
    }


    const logoLink = document.querySelector('.logo-link');
    const easterEgg = document.getElementById('easterEgg');
    const easterEggMessage = document.getElementById('easterEggMessage');

    const easterEggMessages = [

        "Hey, is life treating you well today?",
        "Money or passion?",
        "Do we work to live or live to work?",
        "If no one uses it, did you really build it?",
        "Is success measured or felt?",
        "Are you busy or just distracted?",


        "JS or PHP on the backend?",
        "ChatGPT or Gemini?",
        "Dark mode or light mode?",
        "Tabs or spaces?",
        "Ship fast or ship right?",
        "Frontend done, but backend ready?",


        "It worked yesterday, I swear.",
        "One last change, right?",
        "Deploy on Friday… what could go wrong?",
        "Did you try turning it off and on?",
        "Works on my machine.",
        "How did this even compile?"
    ];


    let easterEggTimeout;
    let typewriterTimeout;
    let currentTypewriterIndex = 0;

    function typeWriter(text, element, callback) {
        element.textContent = '';
        element.classList.add('typing');
        currentTypewriterIndex = 0;

        function type() {
            if (currentTypewriterIndex < text.length) {
                element.textContent = text.substring(0, currentTypewriterIndex + 1);
                currentTypewriterIndex++;
                typewriterTimeout = setTimeout(type, 50);
            } else {
                element.classList.remove('typing');
                if (callback) callback();
            }
        }

        type();
    }

    if (logoLink && easterEgg && easterEggMessage) {
        logoLink.addEventListener('mouseenter', () => {

            clearTimeout(easterEggTimeout);
            clearTimeout(typewriterTimeout);


            const randomMessage = easterEggMessages[Math.floor(Math.random() * easterEggMessages.length)];


            easterEggMessage.textContent = '';
            easterEggMessage.classList.remove('typing');


            easterEgg.classList.add('show');


            setTimeout(() => {
                typeWriter(randomMessage, easterEggMessage);
            }, 300);
        });

        logoLink.addEventListener('mouseleave', () => {

            clearTimeout(typewriterTimeout);
            clearTimeout(easterEggTimeout);
            easterEgg.classList.remove('show');
            easterEggMessage.textContent = '';
            easterEggMessage.classList.remove('typing');
        });


        easterEgg.addEventListener('mouseleave', () => {
            clearTimeout(typewriterTimeout);
            clearTimeout(easterEggTimeout);
            easterEgg.classList.remove('show');
            easterEggMessage.textContent = '';
            easterEggMessage.classList.remove('typing');
        });


        easterEgg.addEventListener('mouseenter', () => {
            clearTimeout(easterEggTimeout);
        });
    }
});


const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';
    const scrollPosition = window.scrollY + 200;
    const viewportHeight = window.innerHeight;


    let maxVisible = 0;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        const sectionBottom = sectionTop + sectionHeight;


        const visibleTop = Math.max(scrollPosition - 200, sectionTop);
        const visibleBottom = Math.min(scrollPosition + viewportHeight - 200, sectionBottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);


        if (visibleHeight > maxVisible && scrollPosition >= sectionTop - 100) {
            maxVisible = visibleHeight;
            current = section.getAttribute('id');
        }
    });


    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        const contactSection = document.getElementById('contact');
        if (contactSection) {
            current = 'contact';
        }
    }

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});


const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const html = document.documentElement;


function getTheme() {
    return localStorage.getItem('theme') || 'dark';
}


function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);


    if (theme === 'dark') {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    } else {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = getTheme();
    setTheme(savedTheme);
});


if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';


        themeToggle.classList.add('animating', 'clicked');


        requestAnimationFrame(() => {
            setTheme(newTheme);
        });


        setTimeout(() => {
            themeToggle.classList.remove('animating', 'clicked');
        }, 400);
    });
}


let skillItems = [];
let selectionOrder = [];
let selectionCounter = 0;

function updateSkillNumbers() {
    skillItems.forEach((item, index) => {
        const numberSpan = item.querySelector('.skill-number');
        const orderIndex = selectionOrder.indexOf(item);

        if (orderIndex !== -1) {
            numberSpan.textContent = orderIndex + 1;
        } else {
            numberSpan.textContent = '';
        }
    });
}

function handleSkillClick(event) {
    event.stopPropagation();


    if (isDeselecting) {
        isDeselecting = false;
    }

    const skillItem = event.currentTarget;
    const icon = skillItem.querySelector('i, .skill-svg');
    const ejsIcon = skillItem.querySelector('.ejs-icon');

    if (skillItem.classList.contains('selected')) {

        skillItem.classList.remove('selected');
        if (icon) icon.classList.remove('show-true-color');
        if (ejsIcon) ejsIcon.classList.remove('show-true-color');
        const index = selectionOrder.indexOf(skillItem);
        if (index !== -1) {
            selectionOrder.splice(index, 1);
        }
        selectionCounter--;
    } else {

        skillItem.classList.add('selected');
        if (icon) icon.classList.add('show-true-color');
        if (ejsIcon) ejsIcon.classList.add('show-true-color');
        selectionOrder.push(skillItem);
        selectionCounter++;
    }

    updateSkillNumbers();
}

let isDeselecting = false;

function handleOutsideClick(event) {

    if (selectionOrder.length === skillItems.length && !isDeselecting) {
        isDeselecting = true;
        deselectAllInReverse();
    }
}

function deselectAllInReverse() {
    if (selectionOrder.length === 0) {
        isDeselecting = false;
        return;
    }


    const lastSelected = selectionOrder.pop();
    const icon = lastSelected.querySelector('i, .skill-svg');
    const ejsIcon = lastSelected.querySelector('.ejs-icon');

    lastSelected.classList.remove('selected');
    if (icon) icon.classList.remove('show-true-color');
    if (ejsIcon) ejsIcon.classList.remove('show-true-color');
    selectionCounter--;
    updateSkillNumbers();


    if (selectionOrder.length > 0) {
        setTimeout(() => {
            deselectAllInReverse();
        }, 150);
    } else {
        isDeselecting = false;
    }
}


function calculateOptimalColumns() {
    const skillsGrid = document.querySelector('.skills-grid');
    if (!skillsGrid) return;

    const skillItems = skillsGrid.querySelectorAll('.skill-item');
    const totalItems = skillItems.length;
    if (totalItems === 0) return;


    const container = skillsGrid.closest('.container');
    let availableWidth = window.innerWidth;

    if (container) {
        const containerRect = container.getBoundingClientRect();
        availableWidth = containerRect.width;
    }


    const containerPadding = availableWidth <= 400 ? 32 : 40;
    availableWidth = Math.max(0, availableWidth - containerPadding);


    const minItemWidth = availableWidth <= 320 ? 60 : 70;
    const preferredItemWidth = availableWidth <= 320 ? 70 : 85;
    const gap = availableWidth <= 400 ? 16 : 24;


    const maxColumns = Math.floor((availableWidth + gap) / (minItemWidth + gap));

    let bestColumns = 1;

    if (availableWidth <= 600) {
        bestColumns = 5;
    } else {
        // Cap at 5 columns (original layout). Divisor-only logic breaks for counts like 17 (prime),
        // which collapsed the grid to a single column.
        bestColumns = Math.min(5, maxColumns, totalItems);
    }

    let itemWidthWithBest = (availableWidth - (bestColumns - 1) * gap) / bestColumns;
    if (itemWidthWithBest < preferredItemWidth && bestColumns > 1) {
        while (bestColumns > 1) {
            bestColumns--;
            itemWidthWithBest = (availableWidth - (bestColumns - 1) * gap) / bestColumns;
            if (itemWidthWithBest >= preferredItemWidth) {
                break;
            }
        }
    }


    bestColumns = Math.max(1, Math.min(bestColumns, totalItems));


    skillsGrid.style.setProperty('--skills-columns', bestColumns);
}


function capitalizeWords(text) {
    return text.replace(/(^|\s)(\S)/g, (_, space, char) => space + char.toUpperCase());
}


function animateTextByCharacter(element) {
    if (!element || element.dataset.textAnimated === 'true') return false;

    const accessibleText = (element.textContent || '').replace(/\s+/g, ' ').trim();
    if (!accessibleText) return false;

    element.classList.remove('text-animate-pending');
    element.setAttribute('aria-label', accessibleText);
    element.dataset.textAnimated = 'true';

    if (prefersReducedMotion()) {
        return false;
    }

    // Bake capitalize into the text before wrapping — CSS capitalize
    // treats each inline-block character as its own word (ALL CAPS).
    const shouldCapitalize = getComputedStyle(element).textTransform === 'capitalize';

    const wrapCharacters = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const fragment = document.createDocumentFragment();
            const text = shouldCapitalize
                ? capitalizeWords(node.textContent || '')
                : (node.textContent || '');
            // Group letters into words so line breaks happen between words,
            // not mid-character (inline-block chars otherwise wrap anywhere).
            let wordSpan = null;
            for (const char of text) {
                const span = document.createElement('span');
                span.className = 'text-char';
                span.setAttribute('aria-hidden', 'true');
                span.textContent = char;

                if (/\s/.test(char)) {
                    wordSpan = null;
                    fragment.appendChild(span);
                    continue;
                }

                if (!wordSpan) {
                    wordSpan = document.createElement('span');
                    wordSpan.className = 'text-word';
                    wordSpan.setAttribute('aria-hidden', 'true');
                    fragment.appendChild(wordSpan);
                }
                wordSpan.appendChild(span);
            }
            return fragment;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const clone = node.cloneNode(false);
            Array.from(node.childNodes).forEach((child) => {
                clone.appendChild(wrapCharacters(child));
            });
            return clone;
        }

        return node.cloneNode(true);
    };

    const fragment = document.createDocumentFragment();
    Array.from(element.childNodes).forEach((child) => {
        fragment.appendChild(wrapCharacters(child));
    });

    element.replaceChildren(fragment);
    element.querySelectorAll('.text-char').forEach((char, index) => {
        char.style.setProperty('--char-index', String(index));
    });
    element.classList.add('text-animate');
    return true;
}

window.animateTextByCharacter = animateTextByCharacter;


function initHeroTitleAnimate() {
    const title = document.querySelector('.hero-title');
    if (!title) return;
    animateTextByCharacter(title);
}


function initTextAnimateTitles() {
    const titles = Array.from(document.querySelectorAll(
        '.section-title, .project-detail-title, .privacy-title'
    ));
    if (!titles.length) return;

    const titleObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            animateTextByCharacter(entry.target);
            titleObserver.unobserve(entry.target);
        });
    }, {
        threshold: 0.35,
        rootMargin: '0px 0px -8% 0px'
    });

    titles.forEach((title) => {
        if (title.dataset.textAnimated === 'true') return;
        if (!(title.textContent || '').trim()) return;
        title.classList.add('text-animate-pending');
        titleObserver.observe(title);
    });
}


function initHeroLinesAnimate() {
    const lines = Array.from(document.querySelectorAll('.hero-text .hero-line'));
    if (!lines.length) return;

    // Rise with the name roll ("Mohamed Aiman."), both lines together.
    const CHAR_STAGGER_MS = 35;
    const title = document.querySelector('.hero-title');
    const nameFirstChar = title?.querySelector('.name-highlight .text-char');
    const nameStartIndex = nameFirstChar
        ? Number.parseInt(nameFirstChar.style.getPropertyValue('--char-index'), 10) || 0
        : Math.floor((title?.querySelectorAll('.text-char').length || 0) * 0.45);
    const linesDelayMs = prefersReducedMotion() ? 0 : nameStartIndex * CHAR_STAGGER_MS;

    lines.forEach((line) => {
        line.style.setProperty('--hero-line-delay', `${linesDelayMs / 1000}s`);
    });

    const heroText = document.querySelector('.hero-text');
    if (heroText) {
        heroText.classList.add('hero-lines-animate');
    }
}


function initIconDocks() {
    const docks = document.querySelectorAll('.icon-dock');
    if (!docks.length) return;

    docks.forEach((dock) => {
        const icons = Array.from(dock.querySelectorAll('.dock-icon'));
        if (!icons.length) return;

        let hovered = -1;
        let frameId = 0;
        const state = icons.map(() => ({ x: 0, y: 0, scale: 1 }));

        const lerp = (current, target, amount) => current + (target - current) * amount;

        // Magnify with transforms only — never change padding/gap (those
        // reflow siblings like contact text and can bounce the dock under the cursor).
        const apply = () => {
            icons.forEach((icon, index) => {
                const item = state[index];
                icon.style.setProperty('--dock-x', `${item.x.toFixed(2)}px`);
                icon.style.setProperty('--dock-y', `${item.y.toFixed(2)}px`);
                icon.style.setProperty('--dock-scale', item.scale.toFixed(3));
                icon.classList.toggle('is-active', index === hovered);
            });
        };

        const tick = () => {
            frameId = 0;

            if (prefersReducedMotion()) {
                state.forEach((item) => {
                    item.x = 0;
                    item.y = 0;
                    item.scale = 1;
                });
                apply();
                return;
            }

            let animating = false;

            state.forEach((item, index) => {
                const active = index === hovered;
                const targetScale = active ? 1.14 : 1;
                const targetY = active ? -3 : 0;
                let targetX = 0;
                if (hovered >= 0 && !active) {
                    targetX = index < hovered ? -7 : 7;
                }

                item.scale = lerp(item.scale, targetScale, 0.18);
                item.y = lerp(item.y, targetY, 0.18);
                item.x = lerp(item.x, targetX, 0.18);

                if (
                    Math.abs(item.scale - targetScale) > 0.004 ||
                    Math.abs(item.y - targetY) > 0.08 ||
                    Math.abs(item.x - targetX) > 0.08
                ) {
                    animating = true;
                } else {
                    item.scale = targetScale;
                    item.y = targetY;
                    item.x = targetX;
                }
            });

            apply();
            if (animating) frameId = requestAnimationFrame(tick);
        };

        const queueTick = () => {
            if (!frameId) frameId = requestAnimationFrame(tick);
        };

        icons.forEach((icon, index) => {
            icon.addEventListener('pointerenter', () => {
                hovered = index;
                queueTick();
            });
            icon.addEventListener('focus', () => {
                hovered = index;
                queueTick();
            });
        });

        dock.addEventListener('pointerleave', () => {
            hovered = -1;
            queueTick();
        });

        dock.addEventListener('focusout', (event) => {
            if (!dock.contains(event.relatedTarget)) {
                hovered = -1;
                queueTick();
            }
        });
    });
}


function initSkillsSelection() {
    skillItems = document.querySelectorAll('.skill-item');
    selectionOrder = [];
    selectionCounter = 0;


    const calculateLayout = () => {
        requestAnimationFrame(() => {
            calculateOptimalColumns();
        });
    };


    calculateLayout();
    setTimeout(calculateLayout, 50);
    setTimeout(calculateLayout, 200);
    setTimeout(calculateLayout, 500);


    let resizeTimeout;
    const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            calculateLayout();
        }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
        setTimeout(calculateLayout, 200);
    });


    skillItems.forEach(item => {
        item.addEventListener('click', handleSkillClick);


        const icon = item.querySelector('i, .skill-svg');
        const ejsIcon = item.querySelector('.ejs-icon');
        item.addEventListener('mouseenter', () => {
            if (icon) icon.classList.add('show-true-color');
            if (ejsIcon) ejsIcon.classList.add('show-true-color');
        });
        item.addEventListener('mouseleave', () => {
            if (!item.classList.contains('selected')) {
                if (icon) icon.classList.remove('show-true-color');
                if (ejsIcon) ejsIcon.classList.remove('show-true-color');
            }
        });
    });


    document.addEventListener('click', (event) => {
        const clickedSkill = event.target.closest('.skill-item');
        if (!clickedSkill && selectionOrder.length === skillItems.length) {
            handleOutsideClick(event);
        }
    });
}


function calculateWorkDurations() {
    const timelineItems = document.querySelectorAll('.timeline-item[data-start]');

    timelineItems.forEach(item => {
        const startDate = item.getAttribute('data-start');
        const endDate = item.getAttribute('data-end');
        const durationElement = item.querySelector('.timeline-duration');

        if (!durationElement) return;

        const start = new Date(startDate + '-01');
        const end = endDate === 'present' ? new Date() : new Date(endDate + '-01');

        const years = end.getFullYear() - start.getFullYear();
        const months = end.getMonth() - start.getMonth();

        let totalMonths = years * 12 + months;
        if (end.getDate() < start.getDate()) {
            totalMonths--;
        }


        if (totalMonths < 0) totalMonths = 0;

        let durationText = '';
        if (totalMonths < 12) {
            durationText = `${totalMonths} ${totalMonths === 1 ? 'mo' : 'mos'}`;
        } else {
            const yearsOnly = Math.floor(totalMonths / 12);
            const remainingMonths = totalMonths % 12;
            if (remainingMonths === 0) {
                durationText = `${yearsOnly} ${yearsOnly === 1 ? 'yr' : 'yrs'}`;
            } else {
                durationText = `${yearsOnly} ${yearsOnly === 1 ? 'yr' : 'yrs'} ${remainingMonths} ${remainingMonths === 1 ? 'mo' : 'mos'}`;
            }
        }

        durationElement.textContent = `· ${durationText}`;
    });
}


function initCursorTrail() {
    const skillsGrid = document.querySelector('.skills-grid');
    if (!skillsGrid) return;

    const trail = [];
    const trailLength = 8;
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    const trailColor = isDarkMode ? '#e63946' : '#c51d34';


    for (let i = 0; i < trailLength; i++) {
        const dot = document.createElement('div');
        dot.className = 'cursor-trail-dot';
        dot.style.cssText = `
            position: fixed;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: ${trailColor};
            pointer-events: none;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s ease, transform 0.3s ease;
            transform: translate(-50%, -50%) scale(0);
        `;
        document.body.appendChild(dot);
        trail.push({
            element: dot,
            x: 0,
            y: 0,
            opacity: 0
        });
    }

    let mouseX = 0;
    let mouseY = 0;
    let isInside = false;


    function updateTrail() {
        if (!isInside) return;

        trail.forEach((dot, index) => {
            const delay = index * 0.05;
            const targetX = mouseX;
            const targetY = mouseY;


            dot.x += (targetX - dot.x) * (0.15 + index * 0.05);
            dot.y += (targetY - dot.y) * (0.15 + index * 0.05);

            const opacity = Math.max(0, 0.6 - (index / trailLength) * 0.6);
            const scale = Math.max(0.3, 1 - (index / trailLength) * 0.7);

            dot.element.style.left = dot.x + 'px';
            dot.element.style.top = dot.y + 'px';
            dot.element.style.opacity = opacity;
            dot.element.style.transform = `translate(-50%, -50%) scale(${scale})`;
        });

        requestAnimationFrame(updateTrail);
    }


    skillsGrid.addEventListener('mouseenter', (e) => {
        isInside = true;
        mouseX = e.clientX;
        mouseY = e.clientY;
        updateTrail();
    });


    skillsGrid.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });


    skillsGrid.addEventListener('mouseleave', () => {
        isInside = false;
        trail.forEach(dot => {
            dot.element.style.opacity = '0';
            dot.element.style.transform = 'translate(-50%, -50%) scale(0)';
        });
    });


    const observer = new MutationObserver(() => {
        const newIsDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        const newColor = newIsDarkMode ? '#e63946' : '#c51d34';
        trail.forEach(dot => {
            dot.element.style.background = newColor;
        });
    });

    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });
}


document.addEventListener('DOMContentLoaded', () => {
    const canUsePointerEffects = window.matchMedia('(pointer: fine)').matches && !prefersReducedMotion();
    if (canUsePointerEffects) {
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(initCursorTrail, { timeout: 1000 });
        } else {
            setTimeout(initCursorTrail, 100);
        }
    }


    updateCopyrightYear();
});


function updateCopyrightYear() {
    const yearElements = document.querySelectorAll('.footer-year');
    const currentYear = new Date().getFullYear();
    yearElements.forEach(element => {
        element.textContent = currentYear;
    });
}
