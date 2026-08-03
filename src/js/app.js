
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const navCloseBtn = document.getElementById('navCloseBtn');
const navGreeting = document.getElementById('navGreeting');

let navTypewriterTimeout;
let navTypewriterIndex = 0;
let lenis;

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function initLenis() {
    if (prefersReducedMotion() || typeof window.Lenis !== 'function') return null;

    lenis = new window.Lenis({
        duration: 1.15,
        easing: (t) => 1 - Math.pow(1 - t, 4),
        smoothWheel: true,
        syncTouch: false
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
    return lenis;
}

function scrollToTarget(target) {
    const offset = -80;

    if (lenis) {
        lenis.scrollTo(target, { offset });
        return;
    }

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

    initLenis();
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


    // Load all dynamic content first, then handle initial hash scrolling
    Promise.all([
        loadWorkExperience(),
        loadFeaturedProjects(),
        loadEducation(),
        loadLanguages()
    ]).then(() => {
        // Handle hash scrolling after content is loaded
        if (window.location.hash) {
            setTimeout(() => {
                const target = document.querySelector(window.location.hash);
                if (target) {
                    scrollToTarget(target);
                }
            }, 150);
        }
    });


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
            for (const char of text) {
                const span = document.createElement('span');
                span.className = 'text-char';
                span.setAttribute('aria-hidden', 'true');
                span.textContent = char;
                fragment.appendChild(span);
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

    const title = document.querySelector('.hero-title');
    const charCount = title ? title.querySelectorAll('.text-char').length : 0;
    const titleDurationMs = prefersReducedMotion()
        ? 0
        : Math.max(400, charCount * 35 + 350);
    const lineStaggerMs = 220;

    lines.forEach((line, index) => {
        line.style.setProperty(
            '--hero-line-delay',
            `${(titleDurationMs + index * lineStaggerMs) / 1000}s`
        );
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
        let padExtra = 0;
        let gapExtra = 0;
        const state = icons.map(() => ({ x: 0, y: 0, scale: 1 }));

        const lerp = (current, target, amount) => current + (target - current) * amount;

        const apply = () => {
            dock.style.setProperty('--dock-pad-extra', `${padExtra.toFixed(2)}px`);
            dock.style.setProperty('--dock-gap-extra', `${gapExtra.toFixed(2)}px`);
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
                padExtra = 0;
                gapExtra = 0;
                state.forEach((item) => {
                    item.x = 0;
                    item.y = 0;
                    item.scale = 1;
                });
                apply();
                return;
            }

            const targetPad = hovered >= 0 ? 8 : 0;
            const targetGap = hovered >= 0 ? 6 : 0;
            let animating = false;

            padExtra = lerp(padExtra, targetPad, 0.16);
            gapExtra = lerp(gapExtra, targetGap, 0.16);
            if (Math.abs(padExtra - targetPad) > 0.08) animating = true;
            else padExtra = targetPad;
            if (Math.abs(gapExtra - targetGap) > 0.08) animating = true;
            else gapExtra = targetGap;

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


async function loadWorkExperience() {
    try {

        const workJsonPath = '/api/work';
        const response = await fetch(workJsonPath);
        const workData = await response.json();


        workData.sort((a, b) => {
            const dateA = new Date(a.startDate + '-01');
            const dateB = new Date(b.startDate + '-01');
            return dateB - dateA;
        });

        const timeline = document.getElementById('workTimeline');
        if (!timeline) return;

        timeline.innerHTML = '';

        workData.forEach(job => {
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';
            timelineItem.setAttribute('data-start', job.startDate);
            timelineItem.setAttribute('data-end', job.endDate);

            const isCurrent = job.endDate === 'present';
            const startDate = formatDate(job.startDate);
            const endDate = isCurrent ? 'Present' : formatDate(job.endDate);

            timelineItem.innerHTML = `
                <div class="timeline-marker">
                    <img src="${job.logo}" alt="${job.company}" class="timeline-logo">
                </div>
                <div class="timeline-content">
                    <div class="timeline-date">
                        <span class="timeline-date-text">${startDate} - ${endDate}</span>
                        <span class="timeline-duration" data-duration="${job.startDate}-${job.endDate}"></span>
                        ${isCurrent ? '<span class="timeline-current-badge">Current</span>' : ''}
                    </div>
                    <h3 class="timeline-company">${job.company}</h3>
                    <div class="timeline-role">${job.role}</div>
                    <ul class="timeline-description">
                        ${job.description.map(desc => `<li>${desc}</li>`).join('')}
                    </ul>
                </div>
            `;

            timeline.appendChild(timelineItem);
        });


        calculateWorkDurations();


        const newItems = timeline.querySelectorAll('.timeline-item');
        newItems.forEach(item => {
            item.classList.add('fade-in');
            observer.observe(item);
        });
    } catch (error) {
        console.error('Error loading work experience:', error);
    }
}


function formatDate(dateString) {
    if (dateString === 'present') return 'Present';

    const date = new Date(dateString + '-01');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
}


window.techIconMap = {
    'Next.js': { type: 'devicon', class: 'devicon-nextjs-plain colored' },
    'React': { type: 'devicon', class: 'devicon-react-original colored' },
    'TypeScript': { type: 'devicon', class: 'devicon-typescript-plain colored' },
    'Nginx': { type: 'devicon', class: 'devicon-nginx-original colored' },
    'Ubuntu': { type: 'fa', class: 'fa-brands fa-ubuntu colored' },
    'Google Cloud': { type: 'devicon', class: 'devicon-googlecloud-plain colored' },
    'Google Cloud Platform': { type: 'devicon', class: 'devicon-googlecloud-plain colored' },
    'GCP': { type: 'devicon', class: 'devicon-googlecloud-plain colored' },
    'Node.js': { type: 'fa', class: 'fa-brands fa-node-js colored' },
    'Node': { type: 'fa', class: 'fa-brands fa-node-js colored' },
    'Express.js': { type: 'devicon', class: 'devicon-express-original colored' },
    'Express': { type: 'devicon', class: 'devicon-express-original colored' },
    'EJS': { type: 'ejs', class: 'ejs-icon' },
    'jQuery': { type: 'devicon', class: 'devicon-jquery-plain colored' },
    'HTML': { type: 'devicon', class: 'devicon-html5-plain colored' },
    'CSS': { type: 'devicon', class: 'devicon-css3-plain colored' },
    'JavaScript': { type: 'devicon', class: 'devicon-javascript-plain colored' },
    'MySQL': { type: 'devicon', class: 'devicon-mysql-plain colored' },
    'Bootstrap': { type: 'devicon', class: 'devicon-bootstrap-plain colored' },
    'Tailwind CSS': { type: 'devicon', class: 'devicon-tailwindcss-plain colored' },
    'Python': { type: 'devicon', class: 'devicon-python-plain colored' },
    'SQL': { type: 'devicon', class: 'devicon-mysql-plain colored' },
    'MySQL Workbench': { type: 'devicon', class: 'devicon-mysql-plain colored' },
    'Google Apps Script': { type: 'devicon', class: 'devicon-google-plain colored' },
    'Google Drive API': { type: 'fa', class: 'fa-brands fa-google-drive' },
    'Google Sheets API': { type: 'fa', class: 'fa-regular fa-file-excel' },
    'Google Sheets': { type: 'fa', class: 'fa-regular fa-file-excel' }
};


function getSmallTechIcon(tech) {
    const iconData = window.techIconMap[tech] || null;
    const label = String(tech).replace(/"/g, '&quot;');
    if (!iconData) {
        return `<span class="project-tech-icon-fallback" data-tooltip="${label}">${tech}</span>`;
    }

    if (iconData.type === 'ejs') {
        return `<span class="project-tech-icon ejs-icon-small" data-tooltip="${label}">EJS</span>`;
    }

    return `<i class="project-tech-icon ${iconData.class}" data-tooltip="${label}"></i>`;
}

window.getSmallTechIcon = getSmallTechIcon;


async function loadFeaturedProjects() {
    try {

        const projectsJsonPath = '/api/projects';
        const response = await fetch(projectsJsonPath);
        const projects = await response.json();

        const projectsGrid = document.getElementById('projectsGrid');
        if (!projectsGrid) return;


        const featuredProjects = projects.slice(0, 3);

        projectsGrid.innerHTML = '';

        featuredProjects.forEach(project => {
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card';


            const displayImages = project.images ? project.images.slice(0, 3) : [];
            const hasMoreImages = project.images && project.images.length > 3;

            const detailLink = `/projects/${project.slug}`;

            projectCard.innerHTML = `
                <a href="${detailLink}" class="project-card-main-link">View ${project.projectName} details</a>
                ${displayImages.length > 0 ? `
                <div class="project-card-images">
                    ${displayImages.map(img => `<img src="/${img}" alt="${project.projectName}" class="project-card-image">`).join('')}
                    ${hasMoreImages ? `<div class="project-card-image-more">+${project.images.length - 3}</div>` : ''}
                </div>
                ` : ''}
                <h3 class="project-title">${project.projectName}</h3>
                <p class="project-description">${project.description}</p>
                <div class="project-tags">
                    ${project.techUsed.map(tech => getSmallTechIcon(tech)).join('')}
                </div>
                <div class="project-links">
                    ${project.deployedLink ? `<a href="${project.deployedLink}" target="_blank" rel="noopener noreferrer" class="project-link" aria-label="View ${project.projectName} website">Website</a>` : ''}
                    ${project.githubLink ? `<a href="${project.githubLink}" target="_blank" rel="noopener noreferrer" class="project-link" aria-label="View ${project.projectName} source code">Source</a>` : ''}
                    <a href="${detailLink}" class="project-link" aria-label="View ${project.projectName} details">Details</a>
                </div>
            `;

            projectsGrid.appendChild(projectCard);
        });


        const newItems = projectsGrid.querySelectorAll('.project-card');
        newItems.forEach(item => {
            item.classList.add('fade-in');
            observer.observe(item);
        });
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}


const institutionLogoMap = {
    'International Modern Arabic School': 'education-institutions/Imas.webp',
    'Malaysia University of Science and Technology': 'education-institutions/MUST.webp',
    'IMAS': 'education-institutions/Imas.webp',
    'MUST': 'education-institutions/MUST.webp'
};


function getInstitutionLogo(institutionName) {
    return institutionLogoMap[institutionName] || null;
}


async function loadEducation() {
    try {

        const educationJsonPath = '/api/education';
        const response = await fetch(educationJsonPath);
        const data = await response.json();
        const educationData = data.education || [];


        educationData.sort((a, b) => {
            const dateA = new Date(a.duration.start);
            const dateB = new Date(b.duration.start);
            return dateB - dateA;
        });

        const timeline = document.getElementById('educationTimeline');
        if (!timeline) return;

        timeline.innerHTML = '';

        educationData.forEach(edu => {
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';
            timelineItem.setAttribute('data-start', edu.duration.start);
            timelineItem.setAttribute('data-end', edu.duration.end);

            const startDate = formatEducationDate(edu.duration.start);
            const endDate = formatEducationDate(edu.duration.end);


            const logoPath = getInstitutionLogo(edu.institution);
            const logoHTML = logoPath
                ? `<img src="/${logoPath}" alt="${edu.institution}" class="timeline-logo">`
                : `<i class="fas fa-graduation-cap"></i>`;

            let resultsHTML = '';
            if (edu.results) {
                if (edu.results.grades) {
                    const grades = edu.results.grades;
                    const gradeEntries = Object.entries(grades).map(([grade, count]) =>
                        `${count} ${grade}${count > 1 ? 's' : ''}`
                    ).join(', ');
                    resultsHTML = `
                    <div class="timeline-results">
                        <span class="timeline-results-text">${edu.results.total_subjects} subjects: ${gradeEntries}</span>
                    </div>
                `;
                } else if (edu.results.semester != null || edu.results.gpa != null) {
                    const parts = [];
                    if (edu.results.semester != null) {
                        parts.push(`Semester ${edu.results.semester}`);
                    }
                    if (edu.results.gpa != null) {
                        const g = edu.results.gpa;
                        const gpaLabel = typeof g === 'number' ? g.toFixed(1) : String(g);
                        parts.push(`${gpaLabel} GPA`);
                    }
                    resultsHTML = `
                    <div class="timeline-results">
                        <span class="timeline-results-text">${parts.join(' · ')}</span>
                    </div>
                `;
                }
            }

            timelineItem.innerHTML = `
                <div class="timeline-marker">
                    ${logoHTML}
                </div>
                <div class="timeline-content">
                    <div class="timeline-date">
                        <span class="timeline-date-text">${startDate} - ${endDate}</span>
                    </div>
                    <h3 class="timeline-company">${edu.qualification}</h3>
                    <div class="timeline-role">${edu.institution}</div>
                    <div class="timeline-field">${edu.field}</div>
                    ${resultsHTML}
                    <p class="timeline-description-text">${edu.description}</p>
                </div>
            `;

            timeline.appendChild(timelineItem);
        });


        const newItems = timeline.querySelectorAll('.timeline-item');
        newItems.forEach(item => {
            item.classList.add('fade-in');
            observer.observe(item);
        });
    } catch (error) {
        console.error('Error loading education:', error);
    }
}


function formatEducationDate(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {

        return dateString;
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
}


async function loadLanguages() {
    try {

        const languagesJsonPath = '/api/languages';
        const response = await fetch(languagesJsonPath);
        const data = await response.json();
        const languagesData = data.languages || [];

        const languagesGrid = document.getElementById('languagesGrid');
        if (!languagesGrid) return;

        languagesGrid.innerHTML = '';

        languagesData.forEach(lang => {
            const languageItem = document.createElement('div');
            languageItem.className = 'language-item';


            const levelClass = lang.level.toLowerCase().replace(' ', '-');

            languageItem.innerHTML = `
                <div class="language-name">${lang.name}</div>
                <div class="language-level ${levelClass}">${lang.level}</div>
            `;

            languagesGrid.appendChild(languageItem);
        });


        const newItems = languagesGrid.querySelectorAll('.language-item');
        newItems.forEach(item => {
            item.classList.add('fade-in');
            observer.observe(item);
        });
    } catch (error) {
        console.error('Error loading languages:', error);
    }
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

    setTimeout(() => {
        initCursorTrail();
    }, 100);


    updateCopyrightYear();
});


function updateCopyrightYear() {
    const yearElements = document.querySelectorAll('.footer-year');
    const currentYear = new Date().getFullYear();
    yearElements.forEach(element => {
        element.textContent = currentYear;
    });
}


