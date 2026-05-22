/**
 * APEX Performance Studio — script.js
 */

"use strict";

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

/* ================================================================
   1. LOADING SCREEN
================================================================ */
(function initLoader() {
    const loader = $("#loader");
    if (!loader) return;
    window.addEventListener("load", () => {
        setTimeout(() => {
            loader.classList.add("hidden");
            document.body.style.overflow = "";
        }, 1900);
    });
    document.body.style.overflow = "hidden";
})();

/* ================================================================
   2. CUSTOM CURSOR — desktop / hover-capable devices ONLY
================================================================ */
(function initCursor() {
    const dot      = $("#cursor");
    const follower = $("#cursorFollower");
    if (!dot || !follower) return;

    // Immediately hide cursor elements on touch/non-hover devices
    const isHoverDevice = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!isHoverDevice) {
        dot.style.display      = "none";
        follower.style.display = "none";
        return;
    }

    let mouseX = 0, mouseY = 0;
    let followerX = 0, followerY = 0;

    document.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.left = mouseX + "px";
        dot.style.top  = mouseY + "px";
    });

    function animateCursor() {
        followerX += (mouseX - followerX) * 0.12;
        followerY += (mouseY - followerY) * 0.12;
        follower.style.left = followerX + "px";
        follower.style.top  = followerY + "px";
        requestAnimationFrame(animateCursor);
    }
    requestAnimationFrame(animateCursor);

    const hoverEls = $$("a, button, .program-card, .trainer-card, .price-card");
    hoverEls.forEach(el => {
        el.addEventListener("mouseenter", () => { dot.classList.add("hovering"); follower.classList.add("hovering"); });
        el.addEventListener("mouseleave", () => { dot.classList.remove("hovering"); follower.classList.remove("hovering"); });
    });
})();

/* ================================================================
   3. STICKY NAVBAR
================================================================ */
(function initNavbar() {
    const navbar = $("#navbar");
    if (!navbar) return;
    const onScroll = () => navbar.classList.toggle("scrolled", window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
})();

/* ================================================================
   4. MOBILE HAMBURGER MENU
================================================================ */
(function initMobileMenu() {
    const hamburger  = $("#hamburger");
    const mobileMenu = $("#mobileMenu");
    const mobileLinks = $$(".mobile-link");
    if (!hamburger || !mobileMenu) return;

    const toggle = (force) => {
        const isOpen = force !== undefined ? force : !hamburger.classList.contains("open");
        hamburger.classList.toggle("open", isOpen);
        mobileMenu.classList.toggle("open", isOpen);
        document.body.style.overflow = isOpen ? "hidden" : "";
    };

    hamburger.addEventListener("click", () => toggle());
    mobileLinks.forEach(link => link.addEventListener("click", () => toggle(false)));
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && mobileMenu.classList.contains("open")) toggle(false);
    });
})();

/* ================================================================
   5. SMOOTH SCROLL
================================================================ */
(function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener("click", (e) => {
            const target = document.querySelector(a.getAttribute("href"));
            if (!target) return;
            e.preventDefault();
            const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-h") || "76");
            window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navH, behavior: "smooth" });
        });
    });
})();

/* ================================================================
   6. SCROLL REVEAL
================================================================ */
(function initScrollReveal() {
    const reveals = $$(".reveal");
    if (!reveals.length) return;
    const observer = new IntersectionObserver(
        (entries) => entries.forEach(entry => {
            if (entry.isIntersecting) { entry.target.classList.add("visible"); observer.unobserve(entry.target); }
        }),
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach(el => observer.observe(el));
})();

/* ================================================================
   7. ANIMATED COUNTERS
================================================================ */
(function initCounters() {
    const stats = $$(".stat-num[data-target]");
    if (!stats.length) return;
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const animateCounter = (el) => {
        const target = parseInt(el.dataset.target, 10);
        const start  = performance.now();
        const tick   = (now) => {
            const progress = clamp((now - start) / 1800, 0, 1);
            el.textContent = Math.round(easeOut(progress) * target).toLocaleString();
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(
        (entries) => entries.forEach(entry => {
            if (entry.isIntersecting) { animateCounter(entry.target); observer.unobserve(entry.target); }
        }),
        { threshold: 0.5 }
    );
    stats.forEach(el => observer.observe(el));
})();

/* ================================================================
   8. PRICING TOGGLE
================================================================ */
(function initPricingToggle() {
    const toggleWrap = $("#pricingToggle");
    if (!toggleWrap) return;
    const btns    = $$(".toggle-btn", toggleWrap);
    const amounts = $$(".price-amount");
    btns.forEach(btn => {
        btn.addEventListener("click", () => {
            btns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const period = btn.dataset.period;
            amounts.forEach(el => {
                el.style.transform = "scale(0.8)";
                el.style.opacity   = "0";
                setTimeout(() => {
                    el.textContent     = el.dataset[period] || el.dataset.monthly;
                    el.style.transform = "scale(1)";
                    el.style.opacity   = "1";
                    el.style.transition = "transform 0.3s, opacity 0.3s";
                }, 200);
            });
        });
    });
})();

/* ================================================================
   9. TESTIMONIALS CAROUSEL
================================================================ */
(function initTestimonials() {
    const track   = $("#testimonialTrack");
    const slides  = $$(".testimonial-slide", track);
    const dotsEl  = $("#tDots");
    const btnPrev = $("#tPrev");
    const btnNext = $("#tNext");
    if (!track || !slides.length) return;

    let current = 0;
    const total = slides.length;

    slides.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.className = "t-dot" + (i === 0 ? " active" : "");
        dot.setAttribute("aria-label", `Testimonial ${i + 1}`);
        dot.addEventListener("click", () => goTo(i));
        dotsEl.appendChild(dot);
    });

    const dots = $$(".t-dot", dotsEl);

    const goTo = (index) => {
        current = (index + total) % total;
        track.style.transform = `translateX(-${current * 100}%)`;
        dots.forEach((d, i) => d.classList.toggle("active", i === current));
    };

    const next = () => goTo(current + 1);
    const prev = () => goTo(current - 1);

    btnNext.addEventListener("click", next);
    btnPrev.addEventListener("click", prev);

    let autoTimer = setInterval(next, 5500);
    track.parentElement.addEventListener("mouseenter", () => clearInterval(autoTimer));
    track.parentElement.addEventListener("mouseleave", () => { autoTimer = setInterval(next, 5500); });

    let touchStartX = 0;
    track.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener("touchend", (e) => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 50) dx < 0 ? next() : prev();
    });
})();

/* ================================================================
   10. BACK TO TOP
================================================================ */
(function initBackToTop() {
    const btn = $("#backToTop");
    if (!btn) return;
    window.addEventListener("scroll", () => btn.classList.toggle("visible", window.scrollY > 500), { passive: true });
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
})();

/* ================================================================
   11. PARALLAX — hero background
================================================================ */
(function initParallax() {
    const heroBg = $(".hero__bg-img");
    if (!heroBg) return;
    let ticking = false;
    window.addEventListener("scroll", () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                heroBg.style.transform = `scale(1) translateY(${window.scrollY * 0.25}px)`;
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
})();

/* ================================================================
   12. ACTIVE NAV LINK
================================================================ */
(function initActiveNav() {
    const sections = $$("section[id]");
    const navLinks = $$(".nav-link");
    if (!sections.length || !navLinks.length) return;
    const observer = new IntersectionObserver(
        (entries) => entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(link => {
                    link.classList.toggle("active-link", link.getAttribute("href") === "#" + entry.target.id);
                });
            }
        }),
        { threshold: 0.4 }
    );
    sections.forEach(s => observer.observe(s));
})();

/* ================================================================
   13. CARD TILT
================================================================ */
(function initCardTilt() {
    if (!window.matchMedia("(hover: hover)").matches) return;
    $$(".program-card, .price-card").forEach(card => {
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width  - 0.5;
            const y = (e.clientY - rect.top)  / rect.height - 0.5;
            card.style.transform = `perspective(600px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg) translateZ(8px)`;
        });
        card.addEventListener("mouseleave", () => { card.style.transform = ""; });
    });
})();

/* ================================================================
   14. FOOTER YEAR
================================================================ */
(function initFooterYear() {
    const el = document.querySelector(".footer__bottom span");
    if (el) el.textContent = el.textContent.replace(/\d{4}/, new Date().getFullYear());
})();

/* ================================================================
   15. ACTIVE NAV LINK CSS INJECTION
================================================================ */
(function injectActiveStyle() {
    const style = document.createElement("style");
    style.textContent = `.nav-link.active-link { color: var(--color-accent); } .nav-link.active-link::after { width: 100%; }`;
    document.head.appendChild(style);
})();

/* ================================================================
   16. LANGUAGE TOGGLE — MK / EN
================================================================ */
(function initLangToggle() {
    const btn      = $("#langToggle");
    const label    = $("#langLabel");
    if (!btn || !label) return;

    // Determine initial language — default to MK
    let currentLang = localStorage.getItem("apex-lang") || "mk";

    const applyLang = (lang) => {
        currentLang = lang;
        label.textContent = lang.toUpperCase() === "MK" ? "EN" : "MK";
        localStorage.setItem("apex-lang", lang);

        // Update every element that has data-mk and data-en
        document.querySelectorAll("[data-mk][data-en]").forEach(el => {
            const text = lang === "mk" ? el.dataset.mk : el.dataset.en;
            if (text === undefined) return;
            // Preserve child elements (e.g. <strong>, <em>, <br>)
            if (el.children.length === 0) {
                el.innerHTML = text;
            } else {
                // Only swap if it's a leaf-like node (spans, divs with only text)
                el.innerHTML = text;
            }
        });

        // Update lang attribute on <html>
        document.documentElement.lang = lang === "mk" ? "mk" : "en";
    };

    btn.addEventListener("click", () => {
        applyLang(currentLang === "mk" ? "en" : "mk");
    });

    // Apply on load
    applyLang(currentLang);
})();