< !DOCTYPE html >
    <html lang="es" data-theme="light">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>iOS Glass UI — Design System</title>
            <style>
    /* ── 1. TOKENS ─────────────────────────────────────────────── */
                :root {
                    --font - system: -apple-system, "Helvetica Neue", sans-serif;
                --radius-pill: 50px; --radius-card: 28px; --radius-img: 18px;
                --radius-badge: 50px; --radius-btn: 50px; --radius-divider: 1px;

                /* LIGHT */
                --pill-bg: rgba(255,255,255,0.82);
                --pill-border: rgba(0,0,0,0.08);
                --pill-shadow:
                0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.05),
                inset 0 1px 0 rgba(255,255,255,1);
                --text-active: #1c1c1e;
                --text-muted: rgba(60,60,67,0.30);
                --text-desc: rgba(60,60,67,0.60);
                --divider-color: rgba(0,0,0,0.08);
                --lang-wrap-bg: rgba(0,0,0,0.04);
                --lang-wrap-border: rgba(0,0,0,0.07);
                --lang-active-pill-bg: rgba(0,0,0,0.06);
                --lang-active-pill-shadow:
                inset 0 1px 0 rgba(255,255,255,1), 0 1px 4px rgba(0,0,0,0.08);
                --toggle-color: rgba(60,60,67,0.60);
                --card-shadow:
                0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06),
                inset 0 1px 0 rgba(255,255,255,0.90);
                --card-tint: linear-gradient(145deg,
                rgba(255,255,255,0.65) 0%, rgba(245,245,250,0.50) 40%,
                rgba(235,238,248,0.45) 100%);
                --card-rim-border: rgba(0,0,0,0.08);
                --card-rim-bg: linear-gradient(135deg,
                rgba(255,255,255,0.90) 0%, transparent 50%,
                rgba(255,255,255,0.30) 100%);
                --card-glow-bg: radial-gradient(ellipse 70% 50% at 30% 0%,
                rgba(255,255,255,0.70) 0%, transparent 100%);
                --badge-bg: rgba(0,0,0,0.05); --badge-border: rgba(0,0,0,0.08);
                --badge-color: rgba(0,0,0,0.50); --badge-dot-bg: rgba(0,0,0,0.40);
                --btn-color: rgba(0,0,0,0.70); --btn-bg: rgba(255,255,255,0.60);
                --btn-border: rgba(0,0,0,0.06);
                --btn-shadow: inset 0 1px 0 rgba(255,255,255,1), 0 2px 8px rgba(0,0,0,0.06);
                --hero-title-color: #1c1c1e;
                --hero-subtitle-color: rgba(60,60,67,0.60);
                --hero-btn-color: rgba(0,0,0,0.75); --hero-btn-bg: rgba(255,255,255,0.75);
                --hero-btn-border: rgba(0,0,0,0.08);
                --hero-btn-shadow: 0 4px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1);
                --page-bg: linear-gradient(135deg, #e8eaf6 0%, #fce4ec 50%, #e0f7fa 100%);
    }

                /* DARK */
                [data-theme="dark"] {
                    --pill - bg: rgba(44,44,46,0.88); --pill-border: rgba(255,255,255,0.10);
                --pill-shadow:
                0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35),
                inset 0 1px 0 rgba(255,255,255,0.06);
                --text-active: #ffffff;
                --text-muted: rgba(255,255,255,0.30); --text-desc: rgba(255,255,255,0.60);
                --divider-color: rgba(255,255,255,0.10);
                --lang-wrap-bg: rgba(255,255,255,0.08); --lang-wrap-border: rgba(255,255,255,0.10);
                --lang-active-pill-bg: rgba(255,255,255,0.14);
                --lang-active-pill-shadow: inset 0 1px 0 rgba(255,255,255,0.12);
                --toggle-color: rgba(255,255,255,0.70);
                --card-shadow:
                0 8px 32px rgba(0,0,0,0.50), 0 2px 8px rgba(0,0,0,0.30),
                inset 0 1px 0 rgba(255,255,255,0.08);
                --card-tint: linear-gradient(145deg,
                rgba(255,255,255,0.10) 0%, rgba(180,180,200,0.06) 40%,
                rgba(120,120,160,0.08) 100%);
                --card-rim-border: rgba(255,255,255,0.12);
                --card-rim-bg: linear-gradient(135deg,
                rgba(255,255,255,0.12) 0%, transparent 50%,
                rgba(255,255,255,0.04) 100%);
                --card-glow-bg: radial-gradient(ellipse 70% 50% at 30% 0%,
                rgba(255,255,255,0.08) 0%, transparent 100%);
                --badge-bg: rgba(255,255,255,0.10); --badge-border: rgba(255,255,255,0.15);
                --badge-color: rgba(255,255,255,0.70); --badge-dot-bg: rgba(255,255,255,0.60);
                --btn-color: rgba(255,255,255,0.85); --btn-bg: rgba(255,255,255,0.12);
                --btn-border: rgba(255,255,255,0.12);
                --btn-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
                --hero-title-color: #ffffff; --hero-subtitle-color: rgba(235,235,245,0.80);
                --hero-btn-color: rgba(255,255,255,0.92); --hero-btn-bg: rgba(255,255,255,0.15);
                --hero-btn-border: rgba(255,255,255,0.20);
                --hero-btn-shadow: 0 4px 20px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.20);
                --page-bg: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    }

                @media (prefers-color-scheme: dark) {
      :root:not([data-theme="light"]) {
                    --pill - bg: rgba(44,44,46,0.88); --pill-border: rgba(255,255,255,0.10);
                --pill-shadow:
                0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35),
                inset 0 1px 0 rgba(255,255,255,0.06);
                --text-active: #ffffff;
                --text-muted: rgba(255,255,255,0.30); --text-desc: rgba(255,255,255,0.60);
                --divider-color: rgba(255,255,255,0.10);
                --lang-wrap-bg: rgba(255,255,255,0.08); --lang-wrap-border: rgba(255,255,255,0.10);
                --lang-active-pill-bg: rgba(255,255,255,0.14);
                --lang-active-pill-shadow: inset 0 1px 0 rgba(255,255,255,0.12);
                --toggle-color: rgba(255,255,255,0.70);
                --card-shadow:
                0 8px 32px rgba(0,0,0,0.50), 0 2px 8px rgba(0,0,0,0.30),
                inset 0 1px 0 rgba(255,255,255,0.08);
                --card-tint: linear-gradient(145deg,
                rgba(255,255,255,0.10) 0%, rgba(180,180,200,0.06) 40%,
                rgba(120,120,160,0.08) 100%);
                --card-rim-border: rgba(255,255,255,0.12);
                --card-rim-bg: linear-gradient(135deg,
                rgba(255,255,255,0.12) 0%, transparent 50%,
                rgba(255,255,255,0.04) 100%);
                --card-glow-bg: radial-gradient(ellipse 70% 50% at 30% 0%,
                rgba(255,255,255,0.08) 0%, transparent 100%);
                --badge-bg: rgba(255,255,255,0.10); --badge-border: rgba(255,255,255,0.15);
                --badge-color: rgba(255,255,255,0.70); --badge-dot-bg: rgba(255,255,255,0.60);
                --btn-color: rgba(255,255,255,0.85); --btn-bg: rgba(255,255,255,0.12);
                --btn-border: rgba(255,255,255,0.12);
                --btn-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
                --hero-title-color: #ffffff; --hero-subtitle-color: rgba(235,235,245,0.80);
                --hero-btn-color: rgba(255,255,255,0.92); --hero-btn-bg: rgba(255,255,255,0.15);
                --hero-btn-border: rgba(255,255,255,0.20);
                --hero-btn-shadow: 0 4px 20px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.20);
                --page-bg: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      }
    }

                /* ── RESET ── */
                *, *::before, *::after {box - sizing: border-box; margin: 0; padding: 0; }
                button {cursor: pointer; }
                body {
                    font - family: var(--font-system);
                min-height: 100vh;
                background: var(--page-bg);
                transition: background 0.4s ease;
    }

                /* ── 2. PILL ── */
                .pill {
                    display: flex; align-items: center; gap: 1rem;
                padding: 0.75rem 1.25rem;
                border-radius: var(--radius-pill);
                background: var(--pill-bg);
                backdrop-filter: blur(28px) saturate(200%);
                -webkit-backdrop-filter: blur(28px) saturate(200%);
                border: 1px solid var(--pill-border);
                box-shadow: var(--pill-shadow);
                transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
    }
                .pill__divider {
                    width: 1px; height: 18px;
                background: var(--divider-color);
                border-radius: var(--radius-divider); flex-shrink: 0;
    }
                .pill__toggle-btn {
                    display: flex; align-items: center; justify-content: center;
                padding: 4px; border: none; border-radius: 50%;
                background: transparent; cursor: pointer;
                color: var(--toggle-color); transition: color 0.3s ease;
    }
                .pill__toggle-btn:hover  {transform: scale(1.15); }
                .pill__toggle-btn:active {transform: scale(0.85) rotate(20deg); }

                /* ── 3. SEGMENTED ── */
                .segmented {
                    display: flex; align-items: center; gap: 4px; padding: 4px;
                border-radius: var(--radius-pill);
                background: var(--lang-wrap-bg);
                border: 1px solid var(--lang-wrap-border);
    }
                .segmented__item {
                    position: relative; padding: 4px 12px;
                border-radius: var(--radius-pill); border: none;
                background: transparent; font-family: var(--font-system);
                font-size: 12px; font-weight: 600; letter-spacing: 0.2px;
                min-width: 32px; color: var(--text-muted);
                transition: color 0.2s ease;
    }
                .segmented__item:active      {transform: scale(0.92); }
                .segmented__item--active     {color: var(--text-active); }
                .segmented__active-bg {
                    position: absolute; inset: 0;
                border-radius: var(--radius-pill);
                background: var(--lang-active-pill-bg);
                box-shadow: var(--lang-active-pill-shadow); z-index: 0;
    }
                .segmented__label {position: relative; z-index: 1; }

                /* ── 4. GLASS CARD ── */
                .glass-card {
                    position: relative; width: 320px;
                border-radius: var(--radius-card); overflow: hidden;
                cursor: pointer; transform-style: preserve-3d;
                box-shadow: var(--card-shadow);
                transition: transform 0.6s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease;
    }
                .glass-card--small {width: 260px; }
                .glass-card__blur {
                    position: absolute; inset: 0;
                backdrop-filter: blur(40px) saturate(180%);
                -webkit-backdrop-filter: blur(40px) saturate(180%);
                border-radius: inherit;
    }
                .glass-card__tint {
                    position: absolute; inset: 0;
                border-radius: inherit; background: var(--card-tint);
    }
                .glass-card__rim {
                    position: absolute; inset: 0; border-radius: inherit;
                border: 1px solid var(--card-rim-border);
                background: var(--card-rim-bg);
                -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                -webkit-mask-composite: xor; mask-composite: exclude; padding: 1px;
    }
                .glass-card__glow {
                    position: absolute; top: 0; left: 0; right: 0; height: 55%;
                border-radius: var(--radius-card) var(--radius-card) 0 0;
                pointer-events: none; background: var(--card-glow-bg);
    }
                .glass-card__content {position: relative; z-index: 10; padding: 22px; }

                /* ── 5. BADGE ── */
                .badge {
                    display: inline-flex; align-items: center; gap: 5px;
                padding: 4px 10px; border-radius: var(--radius-badge);
                font-family: var(--font-system); font-size: 11px; font-weight: 600;
                letter-spacing: 0.3px; text-transform: uppercase;
                background: var(--badge-bg); border: 1px solid var(--badge-border);
                color: var(--badge-color); margin-bottom: 10px;
    }
                .badge__dot {
                    width: 6px; height: 6px; border-radius: 50%;
                background: var(--badge-dot-bg);
    }

                /* ── 6. CARD IMG ── */
                .card-img {
                    position: relative; border-radius: var(--radius-img);
                overflow: hidden; margin-bottom: 18px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.30);
    }
                .card-img img {width: 100%; height: 180px; object-fit: cover; display: block; }
                .card-img::after {
                    content: ""; position: absolute; inset: 0;
                background: linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 60%);
                border-radius: inherit;
    }

                /* ── 7. TIPOGRAFÍA ── */
                .card-title {
                    font - family: var(--font-system); font-size: 19px; font-weight: 600;
                letter-spacing: -0.4px; margin-bottom: 8px; color: var(--text-active);
    }
                .card-desc {
                    font - family: var(--font-system); font-size: 13.5px; line-height: 1.55;
                letter-spacing: -0.1px; margin-bottom: 18px; color: var(--text-desc);
    }
                .hero-title {
                    font - family: var(--font-system); font-size: clamp(2rem, 6vw, 3.75rem);
                font-weight: 700; letter-spacing: -1px; margin-bottom: 1rem;
                color: var(--hero-title-color); transition: color 0.3s ease;
    }
                .hero-subtitle {
                    font - family: var(--font-system); font-size: clamp(1.1rem, 2.5vw, 1.5rem);
                font-weight: 400; letter-spacing: -0.2px; max-width: 42rem;
                margin-bottom: 2.5rem; color: var(--hero-subtitle-color);
                transition: color 0.3s ease;
    }

                /* ── 8. BOTONES ── */
                .btn-glass {
                    width: 100%; padding: 11px 20px; border-radius: var(--radius-btn);
                border: 1px solid var(--btn-border); cursor: pointer;
                font-family: var(--font-system); font-size: 14px; font-weight: 600;
                letter-spacing: -0.2px; color: var(--btn-color); background: var(--btn-bg);
                box-shadow: var(--btn-shadow); backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                position: relative; overflow: hidden;
                transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1);
    }
                .btn-hero {
                    display: inline-block; padding: 13px 36px;
                border-radius: var(--radius-btn); border: 1px solid var(--hero-btn-border);
                cursor: pointer; font-family: var(--font-system); font-size: 15px;
                font-weight: 600; letter-spacing: -0.2px; color: var(--hero-btn-color);
                background: var(--hero-btn-bg); box-shadow: var(--hero-btn-shadow);
                backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                position: relative; overflow: hidden; transition: all 0.3s ease;
    }
                .btn-glass::before, .btn-hero::before {
                    content: ""; position: absolute; top: 0; left: -60%;
                width: 60%; height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.20), transparent);
                transform: skewX(-15deg); transition: left 0.5s ease;
    }
                .btn-glass:hover, .btn-hero:hover          {transform: scale(1.05); }
                .btn-glass:hover::before, .btn-hero:hover::before {left: 120%; }
                .btn-glass:active, .btn-hero:active        {transform: scale(0.96); }

                /* ── 9. HERO ── */
                .hero {
                    display: flex; flex-direction: column; align-items: center;
                justify-content: center; text-align: center; padding: 5rem 1rem;
    }

                /* ── 10. ANIMACIONES ── */
                @keyframes slide-up {
                    from {opacity: 0; transform: translateY(24px); }
                to   {opacity: 1; transform: translateY(0); }
    }
                .anim-slide-up        {animation: slide-up 0.7s cubic-bezier(0.25,0.46,0.45,0.94) both; }
                .anim-slide-up-delay1 {animation: slide-up 0.7s 0.2s cubic-bezier(0.25,0.46,0.45,0.94) both; }
                .anim-slide-up-delay2 {animation: slide-up 0.7s 0.4s cubic-bezier(0.25,0.46,0.45,0.94) both; }

                @keyframes pulse-scale {
                    0 %, 100 % { transform: scale(1); }
      50%       {transform: scale(1.2); }
    }
                .anim-pulse {animation: pulse-scale 2s ease-in-out infinite; }

                @keyframes icon-enter {
                    from {opacity: 0; transform: rotate(-30deg) scale(0.6); }
                to   {opacity: 1; transform: rotate(0deg) scale(1); }
    }
                .anim-icon-enter {animation: icon-enter 0.3s ease-out both; }

                /* ── 11. LAYOUT ── */
                .pill-fixed {
                    position: fixed; bottom: 1.5rem; left: 0; right: 0;
                z-index: 50; display: flex; justify-content: center;
                pointer-events: none;
    }
    .pill-fixed > * {pointer - events: auto; }

                .card-grid {
                    display: flex; flex-wrap: wrap; gap: 1.5rem;
                justify-content: center; align-items: flex-start;
                padding: 2rem 1rem 6rem;
    }
                @media (min-width: 768px) { .hero {padding: 5rem 2rem; } }
                @media (max-width: 360px) {
      .glass - card, .glass - card--small {width: 100%; }
    }
            </style>
        </head>
        <body>

            <section class="hero">
                <h1 class="hero-title anim-slide-up">iOS Glass UI</h1>
                <p class="hero-subtitle anim-slide-up-delay1">
                    Design system con tokens CSS, glass cards, pill navbar y segmented controls.
                </p>
                <button class="btn-hero anim-slide-up-delay2">Explorar componentes</button>
            </section>

            <div class="card-grid">
                <div class="glass-card">
                    <div class="glass-card__blur"></div>
                    <div class="glass-card__tint"></div>
                    <div class="glass-card__rim"></div>
                    <div class="glass-card__glow"></div>
                    <div class="glass-card__content">
                        <span class="badge">
                            <span class="badge__dot anim-pulse"></span> Nuevo
                        </span>
                        <div class="card-img">
                            <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=640&q=80" alt="Montaña" />
                        </div>
                        <h2 class="card-title">Naturaleza Viva</h2>
                        <p class="card-desc">Explora los paisajes más impresionantes del mundo con una interfaz diseñada para deslumbrar.</p>
                        <button class="btn-glass">Ver más</button>
                    </div>
                </div>

                <div class="glass-card glass-card--small">
                    <div class="glass-card__blur"></div>
                    <div class="glass-card__tint"></div>
                    <div class="glass-card__rim"></div>
                    <div class="glass-card__glow"></div>
                    <div class="glass-card__content">
                        <span class="badge">
                            <span class="badge__dot"></span> Featured
                        </span>
                        <div class="card-img">
                            <img src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=640&q=80" alt="Bosque" />
                        </div>
                        <h2 class="card-title">Bosque Eterno</h2>
                        <p class="card-desc">Un viaje a través de la densa vegetación tropical.</p>
                        <button class="btn-glass">Descubrir</button>
                    </div>
                </div>
            </div>

            <!-- NAVBAR PILL flotante -->
            <div class="pill-fixed">
                <nav class="pill">
                    <div class="segmented" id="segmented">
                        <button class="segmented__item segmented__item--active" data-value="es">
                            <span class="segmented__active-bg"></span>
                            <span class="segmented__label">ES</span>
                        </button>
                        <button class="segmented__item" data-value="en">
                            <span class="segmented__label">EN</span>
                        </button>
                        <button class="segmented__item" data-value="fr">
                            <span class="segmented__label">FR</span>
                        </button>
                    </div>

                    <div class="pill__divider"></div>

                    <button class="pill__toggle-btn" id="themeToggle" aria-label="Toggle theme">
                        <svg id="iconSun" width="20" height="20" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="5" />
                            <line x1="12" y1="1" x2="12" y2="3" />   <line x1="12" y1="21" x2="12" y2="23" />
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                            <line x1="1" y1="12" x2="3" y2="12" />    <line x1="21" y1="12" x2="23" y2="12" />
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                        </svg>
                        <svg id="iconMoon" width="20" height="20" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                            style="display:none">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                    </button>
                </nav>
            </div>

            <script>
    /* ── THEME TOGGLE ── */
                const html        = document.documentElement;
                const themeToggle = document.getElementById('themeToggle');
                const iconSun     = document.getElementById('iconSun');
                const iconMoon    = document.getElementById('iconMoon');

                function setTheme(theme) {
                    html.setAttribute('data-theme', theme);
                const isDark = theme === 'dark';
                iconSun.style.display  = isDark ? 'none' : '';
                iconMoon.style.display = isDark ? ''     : 'none';
                localStorage.setItem('theme', theme);
    }

                const saved = localStorage.getItem('theme');
                if (saved) {
                    setTheme(saved);
    } else {
                    setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }

    themeToggle.addEventListener('click', () => {
                    setTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });

                /* ── SEGMENTED CONTROL ── */
                const segmented = document.getElementById('segmented');

    segmented.addEventListener('click', (e) => {
      const btn = e.target.closest('.segmented__item');
                if (!btn) return;

      segmented.querySelectorAll('.segmented__item').forEach(item => {
                    item.classList.remove('segmented__item--active');
                item.querySelector('.segmented__active-bg')?.remove();
      });

                btn.classList.add('segmented__item--active');
                const bg = document.createElement('span');
                bg.className = 'segmented__active-bg';
                btn.prepend(bg);
    });
            </script>
        </body>
    </html>