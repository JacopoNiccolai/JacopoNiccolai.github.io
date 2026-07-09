(function () {
    'use strict';

    document.documentElement.classList.add('js');

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ------------------------------------------------------------
       Particle constellation: monochrome, cyan near the cursor
       ------------------------------------------------------------ */
    var canvas = document.getElementById('particle-canvas');
    var ctx = canvas.getContext('2d');
    var particles = [];
    var NUM = window.innerWidth < 760 ? 55 : 100;
    var LINK_DIST = 120;
    var mouse = { x: null, y: null, radius: 150 };
    var burstParticles = [];

    function setCanvasSize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    var aliveMode = false;
    var frame = 0;

    function Particle() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.vx = Math.random() * 0.5 - 0.25;
        this.vy = Math.random() * 0.5 - 0.25;
        this.hue = Math.random() * 360;
    }
    Particle.prototype.update = function () {
        // gentle repulsion from the cursor
        if (mouse.x !== null) {
            var dx = this.x - mouse.x;
            var dy = this.y - mouse.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < mouse.radius && dist > 0.01) {
                var force = (mouse.radius - dist) / mouse.radius;
                this.x += (dx / dist) * force * 2.2;
                this.y += (dy / dist) * force * 2.2;
            }
        }
        this.x += this.vx;
        this.y += this.vy;
        if (this.x > canvas.width || this.x < 0) this.vx = -this.vx;
        if (this.y > canvas.height || this.y < 0) this.vy = -this.vy;
    };
    Particle.prototype.nearMouse = function () {
        if (mouse.x === null) return false;
        var dx = this.x - mouse.x;
        var dy = this.y - mouse.y;
        return dx * dx + dy * dy < mouse.radius * mouse.radius;
    };
    Particle.prototype.color = function (alpha) {
        if (aliveMode) {
            return 'hsla(' + ((this.hue + frame * 0.25) % 360) + ', 85%, 65%, ' + alpha + ')';
        }
        return this.nearMouse()
            ? 'rgba(0, 229, 255, ' + alpha + ')'
            : 'rgba(236, 236, 236, ' + alpha * 0.6 + ')';
    };
    Particle.prototype.draw = function () {
        ctx.fillStyle = this.color(0.9);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    };

    for (var i = 0; i < NUM; i++) particles.push(new Particle());

    window.addEventListener('mousemove', function (e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    window.addEventListener('mouseout', function () {
        mouse.x = null;
        mouse.y = null;
    });
    window.addEventListener('touchmove', function (e) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
    }, { passive: true });
    window.addEventListener('touchend', function () {
        mouse.x = null;
        mouse.y = null;
    });

    function connect() {
        for (var a = 0; a < particles.length; a++) {
            for (var b = a + 1; b < particles.length; b++) {
                var dx = particles[a].x - particles[b].x;
                var dy = particles[a].y - particles[b].y;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < LINK_DIST) {
                    var opacity = (1 - dist / LINK_DIST) * 0.5;
                    if (aliveMode) {
                        ctx.strokeStyle = particles[a].color(opacity * 0.8);
                    } else {
                        var cyan = particles[a].nearMouse() && particles[b].nearMouse();
                        ctx.strokeStyle = cyan
                            ? 'rgba(0, 229, 255, ' + opacity + ')'
                            : 'rgba(236, 236, 236, ' + opacity * 0.5 + ')';
                    }
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    function drawBurst() {
        for (var i = burstParticles.length - 1; i >= 0; i--) {
            var p = burstParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.06;
            p.life -= 1;
            if (p.life <= 0) {
                burstParticles.splice(i, 1);
                continue;
            }
            ctx.fillStyle = aliveMode
                ? 'hsla(' + ((p.hue || 0) + frame) % 360 + ', 85%, 65%, ' + (p.life / p.maxLife) + ')'
                : 'rgba(0, 229, 255, ' + (p.life / p.maxLife) + ')';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function celebrate(originX, originY) {
        if (reducedMotion) return;
        var cx = typeof originX === 'number' ? originX : canvas.width / 2;
        var cy = typeof originY === 'number' ? originY : canvas.height / 2;
        for (var i = 0; i < 140; i++) {
            var angle = Math.random() * Math.PI * 2;
            var speed = Math.random() * 6 + 2;
            burstParticles.push({
                x: cx, y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                size: Math.random() * 2.5 + 1,
                hue: Math.random() * 360,
                life: 90 + Math.random() * 40,
                maxLife: 130
            });
        }
    }

    function animate() {
        frame++;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        connect();
        particles.forEach(function (p) { p.update(); p.draw(); });
        drawBurst();
        requestAnimationFrame(animate);
    }
    if (!reducedMotion) animate();

    /* ------------------------------------------------------------
       Discoveries: badges, eggs, HUD, toasts
       ------------------------------------------------------------ */
    var BADGES = [
        { id: 'experience', name: 'Career path traced', hint: 'Read through the experience section' },
        { id: 'education', name: 'Alma mater visited', hint: 'Read through the education section' },
        { id: 'projects', name: 'Side quests reviewed', hint: 'Read through the projects section' },
        { id: 'highlights', name: 'Trophy room entered', hint: 'Read through the highlights section' },
        { id: 'konami', name: 'Old-school gamer', hint: 'Try a classic cheat code (keyboard)' },
        { id: 'guitar', name: 'Campfire session', hint: 'Something acoustic hides in the footer' },
        { id: 'lego', name: 'Brick by brick', hint: 'A little brick made it back from St. Louis' },
        { id: 'photo', name: 'Say cheese', hint: 'The portrait likes attention' },
        { id: 'defect', name: 'Defect detected', hint: 'Quality control: one pixel in the tuboolar card is off' },
        { id: 'laude', name: 'Cum laude', hint: 'Honors deserve a click' },
        { id: 'slfun', name: 'Playful scientist', hint: 'Playfulness is clickable' },
        { id: 'deep', name: 'Deep diver', hint: 'Touch the very bottom of the page' },
        { id: 'lucky13', name: 'Lucky thirteen', hint: 'A special number hides in the fine print' }
    ];
    var STORE_KEY = 'jn-discoveries';
    var unlocked;
    try {
        unlocked = JSON.parse(localStorage.getItem(STORE_KEY)) || {};
    } catch (e) {
        unlocked = {};
    }

    var hud = document.getElementById('hud');
    var hudCount = document.getElementById('hud-count');
    var hudPanel = document.getElementById('hud-panel');
    var badgeList = document.getElementById('badge-list');
    var toast = document.getElementById('toast');
    var themeToggle = document.getElementById('theme-toggle');
    var toastTimer = null;

    /* "alive" mode: unlocked at 13/13, breaks the monochrome rule */
    var heroPhoto = document.querySelector('.hero-photo');
    function setAlive(on) {
        aliveMode = on;
        document.documentElement.classList.toggle('alive', on);
        heroPhoto.src = on ? 'images/me0.jpg' : 'images/me.jpg';
        heroPhoto.classList.toggle('photo-alive', on);
        themeToggle.textContent = on ? 'back to ink' : 'come alive';
        try {
            localStorage.setItem('jn-alive', on ? '1' : '0');
        } catch (e) { /* private mode */ }
    }
    themeToggle.addEventListener('click', function () {
        setAlive(!aliveMode);
    });

    /* 13/13 finale: scroll home, spin the portrait, morph to alive */
    function playFinale() {
        themeToggle.hidden = false;
        if (reducedMotion) {
            setAlive(true);
            return;
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(function () {
            heroPhoto.classList.add('finale-spin');
        }, 1000);
        setTimeout(function () {
            /* photo swaps at the blur peak, mid-spin */
            heroPhoto.src = 'images/me0.jpg';
            heroPhoto.classList.add('photo-alive');
        }, 1900);
        setTimeout(function () {
            /* spin settles: the constellation colors first */
            aliveMode = true;
        }, 2800);
        setTimeout(function () {
            /* then the name gradient sweeps in */
            document.documentElement.classList.add('alive-name');
        }, 3200);
        setTimeout(function () {
            /* ticks, HUD and cursor follow: full alive */
            setAlive(true);
            document.documentElement.classList.remove('alive-name');
            heroPhoto.classList.remove('finale-spin');
        }, 3600);
        setTimeout(function () {
            /* burst erupts from the portrait */
            var r = heroPhoto.getBoundingClientRect();
            celebrate(r.left + r.width / 2, r.top + r.height / 2);
        }, 4000);
    }

    function count() {
        return BADGES.filter(function (b) { return unlocked[b.id]; }).length;
    }

    function renderHud() {
        hudCount.textContent = count() + '/' + BADGES.length;
        badgeList.innerHTML = '';
        BADGES.forEach(function (b) {
            var li = document.createElement('li');
            if (unlocked[b.id]) {
                li.className = 'unlocked';
                li.textContent = b.name;
            } else {
                li.textContent = '???';
                var small = document.createElement('small');
                small.textContent = b.hint;
                li.appendChild(small);
            }
            badgeList.appendChild(li);
        });
    }

    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toast.classList.remove('show');
        }, 3200);
    }

    function unlock(id) {
        if (unlocked[id]) return;
        unlocked[id] = true;
        try {
            localStorage.setItem(STORE_KEY, JSON.stringify(unlocked));
        } catch (e) { /* private mode: session-only progress */ }
        var badge = BADGES.filter(function (b) { return b.id === id; })[0];
        renderHud();
        hud.classList.remove('pulse');
        void hud.offsetWidth; /* restart animation */
        hud.classList.add('pulse');
        if (count() === BADGES.length) {
            showToast('★ 13/13: the page comes alive!');
            playFinale();
        } else {
            showToast('★ Discovery: ' + badge.name + ' (' + count() + '/' + BADGES.length + ')');
        }
    }

    hud.addEventListener('click', function () {
        var open = hudPanel.hidden;
        hudPanel.hidden = !open;
        hud.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function (e) {
        if (!hudPanel.hidden && !hudPanel.contains(e.target) && e.target !== hud && !hud.contains(e.target)) {
            hudPanel.hidden = true;
            hud.setAttribute('aria-expanded', 'false');
        }
    });

    renderHud();

    /* restore alive mode from a previous full run */
    if (count() === BADGES.length) {
        themeToggle.hidden = false;
        var alivePref;
        try {
            alivePref = localStorage.getItem('jn-alive');
        } catch (e) {
            alivePref = null;
        }
        setAlive(alivePref !== '0');
    }

    /* staggered scroll reveal: each card/entry slides in as it enters the viewport */
    var revealTargets = document.querySelectorAll(
        '.section .eyebrow, .section .tick, .brand-card, .timeline li, ' +
        '.edu-card, .project-card, .highlight-list li, .footer > *'
    );
    revealTargets.forEach(function (el) {
        el.classList.add('rv');
        // stagger siblings that enter together (cards in a grid, list items)
        var siblings = el.parentElement ? el.parentElement.children : [];
        var idx = Array.prototype.indexOf.call(siblings, el);
        el.style.transitionDelay = (idx % 4) * 90 + 'ms';
    });

    if ('IntersectionObserver' in window) {
        /* reveals replay: elements animate in again on every scroll pass */
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                entry.target.classList.toggle('revealed', entry.isIntersecting);
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
        revealTargets.forEach(function (el) { revealObserver.observe(el); });

        /* section badges */
        var badgeObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                unlock(entry.target.getAttribute('data-badge'));
                badgeObserver.unobserve(entry.target);
            });
        }, { threshold: 0.25 });
        document.querySelectorAll('[data-badge]').forEach(function (el) {
            badgeObserver.observe(el);
        });
    } else {
        revealTargets.forEach(function (el) { el.classList.add('revealed'); });
    }

    /* easter eggs */
    document.getElementById('egg-guitar').addEventListener('click', function () {
        unlock('guitar');
    });
    document.getElementById('egg-lego').addEventListener('click', function () {
        unlock('lego');
    });
    document.getElementById('egg-photo').addEventListener('click', function () {
        var photo = document.querySelector('.hero-photo');
        photo.classList.remove('cheese');
        void photo.offsetWidth;
        photo.classList.add('cheese');
        unlock('photo');
    });
    document.getElementById('egg-defect').addEventListener('click', function () {
        unlock('defect');
    });
    document.getElementById('egg-laude').addEventListener('click', function () {
        unlock('laude');
    });
    document.getElementById('egg-sl').addEventListener('click', function () {
        unlock('slfun');
    });
    document.getElementById('egg-13').addEventListener('click', function () {
        unlock('lucky13');
    });
    window.addEventListener('scroll', function () {
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
            unlock('deep');
        }
    }, { passive: true });

    /* ------------------------------------------------------------
       Detection-crosshair cursor (desktop fine pointers only)
       ------------------------------------------------------------ */
    var cursorEl = document.getElementById('cursor');
    if (window.matchMedia('(pointer: fine)').matches && !reducedMotion) {
        document.documentElement.classList.add('fine-cursor');
        cursorEl.hidden = false;
        cursorEl.classList.add('hidden');

        var cursorLabel = cursorEl.querySelector('.c-label');
        var hoverTarget = null;
        var FREE_SIZE = 26;
        var PAD = 6;

        function labelFor(el) {
            var kind;
            if (el.id && el.id.indexOf('egg-') === 0) kind = 'anomaly';
            else if (el.id === 'hud' || el.id === 'theme-toggle' || hudPanel.contains(el)) kind = 'ui';
            else if (el.href && el.href.indexOf('mailto:') === 0) kind = 'mail';
            else if (el.tagName === 'A') kind = 'link';
            else kind = 'ui';
            /* stable pseudo-confidence per element */
            var s = (el.id || el.href || el.textContent || '').slice(0, 24);
            var h = 0;
            for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997;
            return kind + ' 0.' + (90 + (h % 10));
        }

        document.addEventListener('mousemove', function (e) {
            cursorEl.classList.remove('hidden');
            var t = e.target.closest ? e.target.closest('a, button') : null;
            if (t !== hoverTarget) {
                hoverTarget = t;
                cursorEl.classList.toggle('locked', !!t);
                if (t) cursorLabel.textContent = labelFor(t);
            }
            if (hoverTarget) {
                var r = hoverTarget.getBoundingClientRect();
                cursorEl.style.left = (r.left - PAD) + 'px';
                cursorEl.style.top = (r.top - PAD) + 'px';
                cursorEl.style.width = (r.width + PAD * 2) + 'px';
                cursorEl.style.height = (r.height + PAD * 2) + 'px';
            } else {
                cursorEl.style.left = (e.clientX - FREE_SIZE / 2) + 'px';
                cursorEl.style.top = (e.clientY - FREE_SIZE / 2) + 'px';
                cursorEl.style.width = FREE_SIZE + 'px';
                cursorEl.style.height = FREE_SIZE + 'px';
            }
        });
        document.addEventListener('mouseleave', function () {
            cursorEl.classList.add('hidden');
        });
    }

    var KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    var konamiPos = 0;
    document.addEventListener('keydown', function (e) {
        var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        if (key === KONAMI[konamiPos]) {
            konamiPos++;
            if (konamiPos === KONAMI.length) {
                konamiPos = 0;
                unlock('konami');
            }
        } else {
            konamiPos = key === KONAMI[0] ? 1 : 0;
        }
    });
})();
