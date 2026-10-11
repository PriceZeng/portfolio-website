/* =========================================================
   Portfolio site script
   ---------------------------------------------------------
   All content comes from /content/site.json and
   /content/projects.json (edited through Pages CMS).
   This file only turns that content into the page —
   you shouldn't need to edit it to add or change work.
   ========================================================= */

(function () {
    'use strict';

    // -----------------------------------------------------
    // Helpers
    // -----------------------------------------------------
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    function esc(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // Lets you write **bold** and *italic* in the CMS text boxes.
    function fmt(str) {
        return esc(str)
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>');
    }

    function slugify(str) {
        return String(str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
    }

    const isVideoFile = (url) => /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url || '');

    // Accepts normal share links and turns them into embeddable players.
    function toEmbedUrl(url) {
        if (!url) return '';
        let m;
        if ((m = url.match(/youtu\.be\/([\w-]{6,})/))) return `https://www.youtube.com/embed/${m[1]}`;
        if ((m = url.match(/youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/)([\w-]{6,})/))) return `https://www.youtube.com/embed/${m[1]}`;
        if ((m = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/))) return `https://drive.google.com/file/d/${m[1]}/preview`;
        if ((m = url.match(/bilibili\.com\/video\/(BV\w+)/i))) return `https://player.bilibili.com/player.html?bvid=${m[1]}&autoplay=0`;
        if ((m = url.match(/vimeo\.com\/(\d+)/))) return `https://player.vimeo.com/video/${m[1]}`;
        return url;
    }

    const list = (x) => (Array.isArray(x) ? x.filter((v) => v !== null && v !== undefined && v !== '') : []);

    const ICONS = {
        controller: '<rect x="2" y="6" width="20" height="12" rx="2"></rect><path d="M6 12h4"></path><path d="M8 10v4"></path><circle cx="15" cy="13" r="1"></circle><circle cx="18" cy="11" r="1"></circle>',
        camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle>',
        lightbulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.3 1.5 1.5 2.5"></path><path d="M9 18h6"></path><path d="M10 22h4"></path>',
        dice: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><circle cx="15.5" cy="15.5" r="1.5"></circle>',
        cube: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>',
        film: '<rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line>',
        pen: '<path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>',
        music: '<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>',
        book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>',
        globe: '<circle cx="12" cy="12" r="10"></circle><path d="M2 12h20"></path><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>',
        code: '<polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline>',
        star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>'
    };

    // -----------------------------------------------------
    // Load content (no-cache = always check for your latest edits)
    // -----------------------------------------------------
    const getJSON = (path) => fetch(path, { cache: 'no-cache' }).then((r) => {
        if (!r.ok) throw new Error(`${path}: ${r.status}`);
        return r.json();
    });

    const contentReady = Promise.all([
        getJSON('content/site.json').catch((e) => { console.error(e); return {}; }),
        getJSON('content/projects.json').catch((e) => { console.error(e); return { projects: [] }; })
    ]);

    // -----------------------------------------------------
    // Vertical page navigation (hero → statement → menu)
    // -----------------------------------------------------
    const scrollContainer = $('#master-scroll');
    const pages = $$('.fullscreen-page');
    const nextButton = $('#next-button');
    const mainLogo = $('#main-logo');
    const EASE = 'transform 1.2s cubic-bezier(0.77, 0, 0.175, 1)';
    let currentPage = 0;

    // Uses the real pixel position of each page, so it lines up on phones
    // where the browser's address bar changes the screen height.
    function goToPage(index, animate = true) {
        currentPage = index;
        scrollContainer.style.transition = animate ? EASE : 'none';
        scrollContainer.style.transform = `translateY(${-pages[index].offsetTop}px)`;
        if (!animate) {
            scrollContainer.offsetHeight; // apply instantly
            scrollContainer.style.transition = EASE;
        }
    }

    window.addEventListener('resize', () => goToPage(currentPage, false));

    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    goToPage(0, false);
    mainLogo.classList.remove('watermark', 'menu-hidden');

    // -----------------------------------------------------
    // Intro sequence
    // -----------------------------------------------------
    const totalDelay = 1500 + 2000;
    const keywordElement = $('#keyword-shuffle');
    const statementContent = $('#statement-content');
    let introSkipped = false;

    setTimeout(() => {
        if (introSkipped) return;
        goToPage(1);
        mainLogo.classList.add('watermark');
    }, totalDelay);

    setTimeout(() => {
        if (introSkipped) return;
        contentReady.then(([site]) => {
            const kw = site.keywords || {};
            const slow = list(kw.slow).length ? list(kw.slow) : ['OBSERVER', 'DOCUMENTARIAN', 'ARCHIVIST', 'SIMULATOR'];
            const fast = list(kw.fast).length ? list(kw.fast) : slow;
            const finalWord = kw.final || 'REALIST';
            const fastCount = 25;
            let step = 0;

            (function doShuffle() {
                if (introSkipped) return;
                if (step < slow.length) {
                    keywordElement.textContent = slow[step++];
                    setTimeout(doShuffle, 400);
                } else if (step < slow.length + fastCount) {
                    keywordElement.textContent = fast[Math.floor(Math.random() * fast.length)];
                    step++;
                    setTimeout(doShuffle, 40);
                } else {
                    keywordElement.textContent = finalWord;
                    setTimeout(() => {
                        keywordElement.classList.add('fade-out');
                        setTimeout(() => {
                            keywordElement.style.display = 'none';
                            statementContent.classList.add('shown');
                            setTimeout(() => {
                                statementContent.classList.add('visible');
                                setTimeout(() => nextButton.classList.add('visible'), 3500);
                            }, 50);
                        }, 800);
                    }, 1800);
                }
            })();
        });
    }, totalDelay + 800);

    function showMenuInstantly() {
        introSkipped = true;
        keywordElement.style.display = 'none';
        statementContent.classList.add('shown', 'visible');
        nextButton.classList.add('visible');
        mainLogo.classList.add('watermark', 'menu-hidden');
        goToPage(2, false);
    }

    nextButton.addEventListener('click', () => {
        const shutter = $('#camera-shutter');
        shutter.classList.remove('open');
        shutter.classList.add('close');
        setTimeout(() => {
            goToPage(2, false);
            mainLogo.classList.add('menu-hidden');
            setTimeout(() => {
                shutter.classList.remove('close');
                shutter.classList.add('open');
            }, 50);
        }, 500);
    });

    // -----------------------------------------------------
    // Contact: copy email (falls back to opening the mail app)
    // -----------------------------------------------------
    let contactEmail = 'zlc765261623@gmail.com';
    const contactBtn = $('#contact-copy-btn');
    const contactText = $('#contact-text');
    contactBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const done = () => {
            contactText.textContent = 'COPIED!';
            contactBtn.classList.add('copied-flash');
            setTimeout(() => {
                contactText.textContent = 'CONTACT';
                contactBtn.classList.remove('copied-flash');
            }, 2000);
        };
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(contactEmail).then(done).catch(() => { location.href = `mailto:${contactEmail}`; });
        } else {
            location.href = `mailto:${contactEmail}`;
        }
    });

    // -----------------------------------------------------
    // Render home content
    // -----------------------------------------------------
    function renderSite(site) {
        if (site.name) $('#site-name').textContent = site.name;
        if (site.role) $('#site-role').textContent = site.role;
        if (site.menuPrompt) $('#menu-prompt').textContent = site.menuPrompt;
        if (site.learnMoreLabel) nextButton.textContent = site.learnMoreLabel;
        if (site.bilibili) $('#link-bilibili').href = site.bilibili;
        else $('#link-bilibili').hidden = true;
        if (site.youtube) $('#link-youtube').href = site.youtube;
        else $('#link-youtube').hidden = true;
        if (site.email) contactEmail = site.email;
        const paras = list(site.statement);
        if (paras.length) {
            statementContent.innerHTML = paras.map((p) => `<p class="artist-statement statement-para">${fmt(p)}</p>`).join('');
        }
    }

    // -----------------------------------------------------
    // Render projects (menu buttons + overlays)
    // -----------------------------------------------------
    function metaHTML(meta) {
        const items = list(meta).filter((m) => m && (m.label || m.value));
        if (!items.length) return '';
        return `<div class="project-meta"><div class="meta-row">${items.map((m) =>
            `<span>${m.label ? `<strong>${esc(m.label)}:</strong> ` : ''}${esc(m.value)}</span>`).join('')}</div></div>`;
    }

    function buttonsHTML(buttons, extraClass = '') {
        const items = list(buttons).filter((b) => b && b.url);
        if (!items.length) return '';
        return `<div class="button-group ${extraClass}">${items.map((b) =>
            `<a href="${esc(b.url)}" target="_blank" rel="noopener" class="action-button-centered inline-button${b.style === 'light' ? ' light' : ''}">${esc(b.label || 'Open >>')}</a>`).join('')}</div>`;
    }

    function videoHTML(url) {
        if (!url) return '';
        if (isVideoFile(url)) {
            return `<div class="video-container"><video controls playsinline preload="none" data-src="${esc(url)}"></video></div>`;
        }
        return `<div class="video-container"><iframe data-src="${esc(toEmbedUrl(url))}" title="Video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowfullscreen loading="lazy"></iframe></div>`;
    }

    function galleryHTML(items, title) {
        const slides = list(items).filter((s) => s && s.media);
        if (!slides.length) return '';
        const many = slides.length > 1;
        return `<div class="carousel-container" tabindex="0" aria-roledescription="carousel">
            ${slides.map((s, i) => {
                const n = String(i + 1).padStart(2, '0');
                const alt = esc(s.alt || s.caption || `${title} ${i + 1}`);
                const media = isVideoFile(s.media)
                    ? `<video muted loop playsinline preload="none" data-src="${esc(s.media)}"${s.poster ? ` poster="${esc(s.poster)}"` : ''} aria-label="${alt}"></video>`
                    : `<img data-src="${esc(s.media)}" alt="${alt}" decoding="async">`;
                return `<div class="carousel-slide${i === 0 ? ' active' : ''}">${media}${s.caption ? `<div class="carousel-caption"><p><strong>${n} //</strong> ${fmt(s.caption)}</p></div>` : ''}</div>`;
            }).join('')}
            ${many ? `<button class="carousel-btn left-btn" aria-label="Previous">&#10094;</button>
            <button class="carousel-btn right-btn" aria-label="Next">&#10095;</button>
            <div class="carousel-counter"><span class="cur">1</span> / ${slides.length}</div>` : ''}
        </div>`;
    }

    function collageHTML(items) {
        const imgs = list(items).filter((c) => c && c.image);
        if (!imgs.length) return '';
        return `<div class="project-collage count-${Math.min(imgs.length, 4)}">${imgs.map((c) =>
            `<figure class="collage-item"><img data-src="${esc(c.image)}" alt="${esc(c.caption || '')}" decoding="async">${c.caption ? `<figcaption class="hover-caption">${esc(c.caption)}</figcaption>` : ''}</figure>`).join('')}</div>`;
    }

    function gamesHTML(games) {
        const items = list(games).filter(Boolean);
        if (!items.length) return '';
        return `<div class="text-content playable-games-list">${items.map((g) => `
            <div class="game-entry">
                ${g.image ? `<img data-src="${esc(g.image)}" alt="${esc(g.title || '')}" class="game-screenshot" decoding="async">` : '<div></div>'}
                <div class="game-details">
                    ${g.title ? `<h3 class="game-title">${esc(g.title)}</h3>` : ''}
                    ${g.description ? `<p>${fmt(g.description)}</p>` : ''}
                    ${buttonsHTML(g.buttons)}
                </div>
            </div>`).join('')}</div>`;
    }

    function parasHTML(paras, cls = '') {
        const items = list(paras);
        if (!items.length) return '';
        return `<div class="text-content ${cls}">${items.map((p, i) => {
            let html = fmt(p);
            // Closing statements start with a large first word (e.g. "As")
            if (cls === 'closing-text' && i === 0) html = html.replace(/^(\S+)/, '<strong class="lead-word">$1</strong>');
            return `<p>${html}</p>`;
        }).join('')}</div>`;
    }

    function projectHTML(p, id) {
        const layout = ['poster', 'full', 'video'].includes(p.layout) ? p.layout : 'full';
        const usePoster = layout === 'poster' && p.poster;
        const close = `<button class="close-page-btn" aria-label="Close"><span class="return-icon">✕</span><span class="close-text">CLOSE</span></button>`;

        if (layout === 'video') {
            return `<div class="project-page layout-video" id="${id}" role="dialog" aria-label="${esc(p.title || p.menuLabel)}" aria-hidden="true">
                ${close}
                <div class="full-content-column">${videoHTML(p.video)}</div>
            </div>`;
        }

        const body = `
            ${p.title ? `<h2 class="project-title">${esc(p.title)}</h2>` : ''}
            ${metaHTML(p.meta)}
            ${parasHTML(p.intro)}
            ${buttonsHTML(p.buttons, 'project-buttons')}
            ${gamesHTML(p.games)}
            ${collageHTML(p.collage)}
            ${galleryHTML(p.gallery, p.title || p.menuLabel)}
            ${parasHTML(p.closing, 'closing-text')}
            ${videoHTML(p.video)}
            <div class="bottom-spacer"></div>`;

        return `<div class="project-page ${usePoster ? 'layout-poster' : 'layout-full'}" id="${id}" role="dialog" aria-label="${esc(p.title || p.menuLabel)}" aria-hidden="true">
            ${close}
            ${usePoster ? `<img data-src="${esc(p.poster)}" alt="${esc(p.posterAlt || p.title || '')}" class="hero-poster-anim" decoding="async">` : ''}
            <div class="${usePoster ? 'right-content-column' : 'full-content-column'}">${body}</div>
        </div>`;
    }

    const overlays = {}; // slug -> { el, poster }
    let openSlug = null;

    function renderProjects(projects) {
        const grid = $('#menu-grid');
        const root = $('#projects-root');
        const used = new Set();
        let menu = '';
        let html = '';

        list(projects).forEach((p) => {
            if (!p || p.hidden) return;
            let slug = slugify(p.menuLabel || p.title);
            while (used.has(slug)) slug += '-2';
            used.add(slug);
            const id = `project-${slug}`;
            const icon = ICONS[p.icon] || ICONS.star;
            menu += `<button class="game-option grid-item" data-project="${slug}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg>
                <span>${esc(p.menuLabel || p.title)}</span>
            </button>`;
            html += projectHTML(p, id);
            overlays[slug] = { id, poster: p.layout === 'poster' && !!p.poster };
        });

        grid.innerHTML = menu;
        root.innerHTML = html;

        Object.values(overlays).forEach((o) => {
            o.el = document.getElementById(o.id);
            $$('.carousel-container', o.el).forEach(setupCarousel);
            $('.close-page-btn', o.el).addEventListener('click', requestClose);
        });

        $$('[data-project]', grid).forEach((btn) => {
            btn.addEventListener('click', () => openProject(btn.dataset.project, true));
        });
    }

    // Images/videos only download when their project is opened.
    function hydrate(el) {
        if (el.dataset.src && !el.getAttribute('src')) el.src = el.dataset.src;
    }

    function openProject(slug, push) {
        const o = overlays[slug];
        if (!o) return;
        if (openSlug && openSlug !== slug) closeProject(true);
        openSlug = slug;
        const el = o.el;
        $$('img[data-src]', el).filter((img) => !img.closest('.carousel-slide')).forEach(hydrate);
        $$('.video-container [data-src]', el).forEach(hydrate);
        $$('.carousel-container', el).forEach((c) => c._show && c._show(c._index || 0));
        el.setAttribute('aria-hidden', 'false');
        el.classList.add('active');
        setTimeout(() => el.classList.add('stage-2'), o.poster ? 500 : 100);
        if (push) history.pushState({ project: slug }, '', `#${slug}`);
    }

    function closeProject(instant) {
        if (!openSlug) return;
        const o = overlays[openSlug];
        openSlug = null;
        const el = o.el;
        el.classList.remove('stage-2');
        el.setAttribute('aria-hidden', 'true');
        $$('video', el).forEach((v) => v.pause());
        const finish = () => {
            if (el.classList.contains('stage-2')) return; // reopened meanwhile
            el.classList.remove('active');
            // Unload embedded players so audio stops
            $$('.video-container iframe', el).forEach((f) => f.removeAttribute('src'));
        };
        if (instant) finish(); else setTimeout(finish, o.poster ? 800 : 600);
    }

    function requestClose() {
        if (history.state && history.state.project) history.back(); // popstate will close
        else { closeProject(); history.replaceState(null, '', location.pathname + location.search); }
    }

    // Phone "back" button/gesture closes the open project instead of leaving the site
    window.addEventListener('popstate', (e) => {
        const slug = e.state && e.state.project;
        if (slug && overlays[slug]) openProject(slug, false);
        else closeProject();
    });

    // -----------------------------------------------------
    // Carousels: buttons, swipe, arrow keys, lazy loading
    // -----------------------------------------------------
    function setupCarousel(container) {
        const slides = $$('.carousel-slide', container);
        const counter = $('.carousel-counter .cur', container);
        container._index = 0;

        function show(index) {
            const n = slides.length;
            const i = ((index % n) + n) % n;
            container._index = i;
            slides.forEach((s, k) => {
                const active = k === i;
                s.classList.toggle('active', active);
                $$('video', s).forEach((v) => { if (!active) v.pause(); });
            });
            // Load the current slide and its neighbours only
            [i, (i + 1) % n, (i - 1 + n) % n].forEach((k) => $$('img[data-src]', slides[k]).forEach(hydrate));
            $$('video[data-src]', slides[i]).forEach((v) => {
                hydrate(v);
                v.play().catch(() => {});
            });
            if (counter) counter.textContent = i + 1;
        }
        container._show = show;

        const prev = $('.left-btn', container);
        const next = $('.right-btn', container);
        if (prev) prev.addEventListener('click', () => show(container._index - 1));
        if (next) next.addEventListener('click', () => show(container._index + 1));

        let startX = 0, startY = 0;
        container.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX; startY = e.touches[0].clientY;
        }, { passive: true });
        container.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].clientX - startX;
            const dy = e.changedTouches[0].clientY - startY;
            if (slides.length > 1 && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(container._index + (dx < 0 ? 1 : -1));
        }, { passive: true });
    }

    document.addEventListener('keydown', (e) => {
        if (!openSlug) return;
        const el = overlays[openSlug].el;
        if (e.key === 'Escape') { requestClose(); return; }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            const c = $('.carousel-container', el);
            if (c && c._show) c._show(c._index + (e.key === 'ArrowRight' ? 1 : -1));
        }
    });

    // -----------------------------------------------------
    // Go
    // -----------------------------------------------------
    contentReady.then(([site, data]) => {
        renderSite(site);
        renderProjects(data.projects);

        // A link like zengdigital.com/#photography-showcase opens that project directly
        const slug = decodeURIComponent(location.hash.replace('#', ''));
        if (slug && overlays[slug]) {
            showMenuInstantly();
            // Put the menu "behind" the project so Back/Close returns to the menu
            history.replaceState(null, '', location.pathname + location.search);
            openProject(slug, true);
        }
    });
})();
