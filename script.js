/**
 * APEX Performance Studio — script.js
 * Handles: loader, custom cursor, navbar, mobile menu,
 *          scroll reveal, animated counters, pricing toggle,
 *          testimonials carousel, gallery lightbox, back-to-top,
 *          contact form, and micro-interactions.
 */

"use strict";

/* ================================================================
   UTILITY HELPERS
================================================================ */

/** Shorthand querySelector */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/** Clamp a number between min and max */
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

/* ================================================================
   1. LOADING SCREEN
================================================================ */
(function initLoader() {
    const loader = $("#loader");
    if (!loader) return;

    // Hide loader after the progress bar animation (~1.9 s)
    window.addEventListener("load", () => {
        setTimeout(() => {
            loader.classList.add("hidden");
            document.body.style.overflow = "";
        }, 1900);
    });

    // Prevent scroll while loading
    document.body.style.overflow = "hidden";
})();

/* ================================================================
   2. CUSTOM CURSOR
================================================================ */
(function initCursor() {
    // Only on devices that support hover (non-touch primarily)
    if (!window.matchMedia("(hover: hover)").matches) return;

    const dot      = $("#cursor");
    const follower = $("#cursorFollower");
    if (!dot || !follower) return;

    let mouseX = 0, mouseY = 0;
    let followerX = 0, followerY = 0;
    let raf;

    document.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.left = mouseX + "px";
        dot.style.top  = mouseY + "px";
    });

    // Smooth follower with lerp
    function animateCursor() {
        followerX += (mouseX - followerX) * 0.12;
        followerY += (mouseY - followerY) * 0.12;
        follower.style.left = followerX + "px";
        follower.style.top  = followerY + "px";
        raf = requestAnimationFrame(animateCursor);
    }
    raf = requestAnimationFrame(animateCursor);

    // Hover state on interactive elements
    const hoverEls = $$("a, button, .gallery__item, .program-card, .trainer-card, .price-card");
    hoverEls.forEach(el => {
        el.addEventListener("mouseenter", () => { dot.classList.add("hovering"); follower.classList.add("hovering"); });
        el.addEventListener("mouseleave", () => { dot.classList.remove("hovering"); follower.classList.remove("hovering"); });
    });
})();

/* ================================================================
   3. STICKY NAVBAR — scroll effect
================================================================ */
(function initNavbar() {
    const navbar = $("#navbar");
    if (!navbar) return;

    const onScroll = () => {
        navbar.classList.toggle("scrolled", window.scrollY > 60);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // init state
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

    // Close on link click
    mobileLinks.forEach(link => {
        link.addEventListener("click", () => toggle(false));
    });

    // Close on escape
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && mobileMenu.classList.contains("open")) toggle(false);
    });
})();

/* ================================================================
   5. SMOOTH SCROLL for anchor links
================================================================ */
(function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener("click", (e) => {
            const target = document.querySelector(a.getAttribute("href"));
            if (!target) return;
            e.preventDefault();
            const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-h") || "76");
            const top  = target.getBoundingClientRect().top + window.scrollY - navH;
            window.scrollTo({ top, behavior: "smooth" });
        });
    });
})();

/* ================================================================
   6. SCROLL REVEAL — IntersectionObserver
================================================================ */
(function initScrollReveal() {
    const reveals = $$(".reveal");
    if (!reveals.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            });
        },
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
        const target   = parseInt(el.dataset.target, 10);
        const duration = 1800;
        const start    = performance.now();

        const tick = (now) => {
            const elapsed  = now - start;
            const progress = clamp(elapsed / duration, 0, 1);
            el.textContent = Math.round(easeOut(progress) * target).toLocaleString();
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    };

    // Trigger when stat section enters view
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.5 }
    );

    stats.forEach(el => observer.observe(el));
})();

/* ================================================================
   8. PRICING TOGGLE — monthly / yearly
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
                const val = el.dataset[period] || el.dataset.monthly;
                // Animate the number change
                el.style.transform = "scale(0.8)";
                el.style.opacity   = "0";
                setTimeout(() => {
                    el.textContent = val;
                    el.style.transform = "scale(1)";
                    el.style.opacity   = "1";
                    el.style.transition = "transform 0.3s, opacity 0.3s";
                }, 200);
            });
        });
    });
})();

/* ================================================================
   9. GALLERY LIGHTBOX
================================================================ */
(function initLightbox() {
    const items      = $$(".gallery__item");
    const lightbox   = $("#lightbox");
    const lb_img     = $("#lightboxImg");
    const lb_cap     = $("#lightboxCaption");
    const lb_close   = $("#lightboxClose");
    const lb_prev    = $("#lightboxPrev");
    const lb_next    = $("#lightboxNext");
    if (!lightbox || !items.length) return;

    let currentIndex = 0;

    // Collect gallery data
    const galleryData = items.map(item => ({
        src:     item.dataset.src || "",
        caption: item.dataset.caption || "",
    }));

    const open = (index) => {
        currentIndex = clamp(index, 0, galleryData.length - 1);
        const data = galleryData[currentIndex];
        lb_img.src = data.src;
        lb_img.alt = data.caption;
        lb_cap.textContent = data.caption;
        lightbox.classList.add("open");
        document.body.style.overflow = "hidden";
    };

    const close = () => {
        lightbox.classList.remove("open");
        document.body.style.overflow = "";
        setTimeout(() => { lb_img.src = ""; }, 400);
    };

    const navigate = (dir) => {
        open((currentIndex + dir + galleryData.length) % galleryData.length);
    };

    items.forEach((item, i) => {
        item.addEventListener("click", () => {
            // Only open lightbox if there's a real image source
            if (galleryData[i].src) open(i);
        });
    });

    lb_close.addEventListener("click", close);
    lb_prev.addEventListener("click", () => navigate(-1));
    lb_next.addEventListener("click", () => navigate(1));

    // Close on backdrop click
    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) close();
    });

    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
        if (!lightbox.classList.contains("open")) return;
        if (e.key === "Escape")     close();
        if (e.key === "ArrowLeft")  navigate(-1);
        if (e.key === "ArrowRight") navigate(1);
    });
})();

/* ================================================================
   10. TESTIMONIALS CAROUSEL
================================================================ */
(function initTestimonials() {
    const track  = $("#testimonialTrack");
    const slides = $$(".testimonial-slide", track);
    const dotsEl = $("#tDots");
    const btnPrev = $("#tPrev");
    const btnNext = $("#tNext");
    if (!track || !slides.length) return;

    let current   = 0;
    let autoTimer = null;
    const total   = slides.length;

    // Build dots
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

    // Auto-advance
    const startAuto = () => {
        autoTimer = setInterval(next, 5500);
    };
    const stopAuto = () => clearInterval(autoTimer);

    startAuto();

    // Pause on hover
    track.parentElement.addEventListener("mouseenter", stopAuto);
    track.parentElement.addEventListener("mouseleave", startAuto);

    // Touch / swipe support
    let touchStartX = 0;
    track.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener("touchend", (e) => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 50) dx < 0 ? next() : prev();
    });
})();

/* ================================================================
   11. CONTACT FORM
================================================================ */
(function initContactForm() {
    const form   = $("#contactForm");
    const status = $("#formStatus");
    if (!form) return;

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        // Basic client-side validation
        const required = $$("[required]", form);
        let valid = true;
        required.forEach(field => {
            if (!field.value.trim()) {
                field.style.borderColor = "#d9534f";
                valid = false;
            } else {
                field.style.borderColor = "";
            }
        });

        if (!valid) {
            status.textContent = "Please fill in all required fields.";
            status.className   = "form-status error";
            return;
        }

        // Simulate async submission (replace with real fetch/API call)
        const btn = form.querySelector('[type="submit"]');
        btn.textContent = "Sending…";
        btn.disabled    = true;

        setTimeout(() => {
            status.textContent = "✓ Message sent! We'll be in touch within 24 hours.";
            status.className   = "form-status success";
            form.reset();
            btn.textContent = "Send Message";
            btn.disabled    = false;

            // Clear status after 6 s
            setTimeout(() => { status.textContent = ""; status.className = "form-status"; }, 6000);
        }, 1600);
    });

    // Live border reset on input
    $$("input, textarea, select", form).forEach(field => {
        field.addEventListener("input", () => { field.style.borderColor = ""; });
    });
})();

/* ================================================================
   12. BACK TO TOP BUTTON
================================================================ */
(function initBackToTop() {
    const btn = $("#backToTop");
    if (!btn) return;

    window.addEventListener("scroll", () => {
        btn.classList.toggle("visible", window.scrollY > 500);
    }, { passive: true });

    btn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
})();

/* ================================================================
   13. PARALLAX — subtle hero background shift on scroll
================================================================ */
(function initParallax() {
    const heroBg = $(".hero__bg-img");
    if (!heroBg) return;

    let ticking = false;

    window.addEventListener("scroll", () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrollY = window.scrollY;
                // Move bg slightly slower than scroll for parallax feel
                heroBg.style.transform = `scale(1) translateY(${scrollY * 0.25}px)`;
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
})();

/* ================================================================
   14. NAVBAR ACTIVE LINK — highlight current section
================================================================ */
(function initActiveNav() {
    const sections = $$("section[id]");
    const navLinks = $$(".nav-link");
    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    navLinks.forEach(link => {
                        link.classList.toggle(
                            "active-link",
                            link.getAttribute("href") === "#" + entry.target.id
                        );
                    });
                }
            });
        },
        { threshold: 0.4 }
    );

    sections.forEach(s => observer.observe(s));
})();

/* ================================================================
   15. PROGRAM CARD — subtle tilt on mouse move
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

        card.addEventListener("mouseleave", () => {
            card.style.transform = "";
        });
    });
})();

/* ================================================================
   16. FOOTER: Year auto-update
================================================================ */
(function initFooterYear() {
    const el = document.querySelector(".footer__bottom span");
    if (el) {
        el.textContent = el.textContent.replace(/\d{4}/, new Date().getFullYear());
    }
})();

/* ================================================================
   17. ACTIVE NAV LINK CSS (inline injection)
================================================================ */
(function injectActiveStyle() {
    const style = document.createElement("style");
    style.textContent = `.nav-link.active-link { color: var(--color-accent); }
  .nav-link.active-link::after { width: 100%; }`;
    document.head.appendChild(style);
})();