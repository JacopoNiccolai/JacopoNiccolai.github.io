(function () {
    'use strict';

    document.documentElement.classList.add('js');

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ------------------------------------------------------------
       Particle constellation — monochrome, cyan near the cursor
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

    function Particle() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.vx = Math.random() * 0.5 - 0.25;
        this.vy = Math.random() * 0.5 - 0.25;
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
    Particle.prototype.draw = function () {
        ctx.fillStyle = this.nearMouse() ? 'rgba(0, 229, 255, 0.9)' : 'rgba(236, 236, 236, 0.55)';
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
                    var cyan = particles[a].nearMouse() && particles[b].nearMouse();
                    ctx.strokeStyle = cyan
                        ? 'rgba(0, 229, 255, ' + opacity + ')'
                        : 'rgba(236, 236, 236, ' + opacity * 0.5 + ')';
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
            ctx.fillStyle = 'rgba(0, 229, 255, ' + (p.life / p.maxLife) + ')';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function celebrate() {
        if (reducedMotion) return;
        var cx = canvas.width / 2;
        var cy = canvas.height / 2;
        for (var i = 0; i < 140; i++) {
            var angle = Math.random() * Math.PI * 2;
            var speed = Math.random() * 6 + 2;
            burstParticles.push({
                x: cx, y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                size: Math.random() * 2.5 + 1,
                life: 90 + Math.random() * 40,
                maxLife: 130
            });
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        connect();
        particles.forEach(function (p) { p.update(); p.draw(); });
        drawBurst();
        requestAnimationFrame(animate);
    }
    if (!reducedMotion) animate();

    /* ------------------------------------------------------------
       Discoveries — badges, eggs, HUD, toasts
       ------------------------------------------------------------ */
    var BADGES = [
        { id: 'experience', name: 'Career path traced', hint: 'Read through the experience section' },
        { id: 'education', name: 'Alma mater visited', hint: 'Read through the education section' },
        { id: 'projects', name: 'Side quests reviewed', hint: 'Read through the projects section' },
        { id: 'highlights', name: 'Trophy room entered', hint: 'Read through the highlights section' },
        { id: 'konami', name: 'Old-school gamer', hint: 'Try a classic cheat code (keyboard)' },
        { id: 'guitar', name: 'Campfire session', hint: 'Something acoustic hides in the footer' },
        { id: 'lego', name: 'Brick by brick', hint: 'A little brick made it back from St. Louis' }
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
    var toastTimer = null;

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
            showToast('★ Full explorer — you found everything. The particles salute you!');
            celebrate();
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

    /* section badges + scroll reveal */
    var revealTargets = document.querySelectorAll('.section, .footer');
    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('revealed');
                var badge = entry.target.getAttribute('data-badge');
                if (badge) unlock(badge);
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.25 });
        revealTargets.forEach(function (el) { observer.observe(el); });
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
