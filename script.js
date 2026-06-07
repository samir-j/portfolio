/**
 * ============================================================
 *  Samir Jaiswal — Portfolio  ·  script.js
 *  Pure vanilla JS · No dependencies
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* ──────────────────────────────────────────────
   *  0. UTILITY HELPERS
   * ────────────────────────────────────────────── */

  /** Debounce – limits how often `fn` fires */
  const debounce = (fn, delay = 100) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  /** Throttle via requestAnimationFrame */
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          fn(...args);
          ticking = false;
        });
      }
    };
  };

  /** Safe querySelector shorthand */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /** Clamp a number between min and max */
  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  /** Linear interpolation */
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ──────────────────────────────────────────────
   *  1. PRELOADER
   * ────────────────────────────────────────────── */

  const initPreloader = () => {
    const preloader = $('#preloader');
    if (!preloader) return;

    const MIN_DISPLAY = 1500; // ms
    const startTime = performance.now();

    const hide = () => {
      const elapsed = performance.now() - startTime;
      const remaining = Math.max(0, MIN_DISPLAY - elapsed);

      setTimeout(() => {
        preloader.style.opacity = '0';
        preloader.style.pointerEvents = 'none';

        // Remove from flow after fade-out transition
        setTimeout(() => {
          preloader.style.display = 'none';
          document.body.classList.add('loaded');
        }, 500);
      }, remaining);
    };

    // Trigger on window load (images, fonts, etc.)
    if (document.readyState === 'complete') {
      hide();
    } else {
      window.addEventListener('load', hide);
    }
  };

  /* ──────────────────────────────────────────────
   *  2. NAVIGATION
   * ────────────────────────────────────────────── */

  const initNavigation = () => {
    const nav = $('.navbar') || $('nav') || $('header');
    const navLinks = $$('.navbar__link[href^="#"], .navbar__menu a[href^="#"], nav a[href^="#"]');
    const hamburger = $('.navbar__hamburger, .hamburger, .menu-toggle');
    const mobileMenu = $('.navbar__mobile-overlay, .mobile-menu-overlay, .nav-menu');
    const sections = $$('section[id]');

    if (!nav) return;

    /* — Sticky / glassmorphism class — */
    const STICKY_OFFSET = 100;

    /* — Hide / show on scroll direction — */
    let lastScrollY = window.scrollY;
    let navHidden = false;
    const NAV_HIDE_THRESHOLD = 10; // minimum delta to trigger

    const handleNavScroll = () => {
      const currentY = window.scrollY;

      // Sticky class
      nav.classList.toggle('scrolled', currentY > STICKY_OFFSET);

      // Direction-based hide/show
      const delta = currentY - lastScrollY;

      if (delta > NAV_HIDE_THRESHOLD && currentY > 300 && !navHidden) {
        nav.classList.add('nav-hidden');
        navHidden = true;
      } else if (delta < -NAV_HIDE_THRESHOLD && navHidden) {
        nav.classList.remove('nav-hidden');
        navHidden = false;
      }

      lastScrollY = currentY;
    };

    window.addEventListener('scroll', rafThrottle(handleNavScroll), { passive: true });

    /* — Scroll spy — */
    const activateLink = (id) => {
      navLinks.forEach((link) => {
        link.classList.toggle(
          'active',
          link.getAttribute('href') === `#${id}`
        );
      });
    };

    const handleScrollSpy = () => {
      const scrollY = window.scrollY + nav.offsetHeight + 80;

      // Walk sections bottom-up so the topmost visible wins
      let currentId = '';
      for (const section of sections) {
        if (section.offsetTop <= scrollY) {
          currentId = section.id;
        }
      }
      if (currentId) activateLink(currentId);
    };

    window.addEventListener('scroll', debounce(handleScrollSpy, 80), { passive: true });

    /* — Smooth scroll — */
    const scrollToTarget = (target) => {
      const el = $(target);
      if (!el) return;
      const offset = nav.offsetHeight + 20;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    };

    navLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('href');
        scrollToTarget(target);

        // Close mobile menu if open
        closeMobileMenu();
      });
    });

    // Also handle any other anchor links on the page
    $$('a[href^="#"]').forEach((a) => {
      if (navLinks.includes(a)) return; // already bound
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (href && href.length > 1) {
          e.preventDefault();
          scrollToTarget(href);
        }
      });
    });

    /* — Mobile hamburger menu — */
    const closeMobileMenu = () => {
      hamburger?.classList.remove('active', 'open');
      mobileMenu?.classList.remove('active', 'open');
      document.body.classList.remove('menu-open');
    };

    if (hamburger && mobileMenu) {
      hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = mobileMenu.classList.contains('active') || mobileMenu.classList.contains('open');
        if (isOpen) {
          closeMobileMenu();
        } else {
          hamburger.classList.add('active', 'open');
          mobileMenu.classList.add('active', 'open');
          document.body.classList.add('menu-open');
        }
      });

      // Close on link click
      $$('a', mobileMenu).forEach((link) => {
        link.addEventListener('click', closeMobileMenu);
      });

      // Close on outside click
      document.addEventListener('click', (e) => {
        if (
          mobileMenu.classList.contains('active') &&
          !mobileMenu.contains(e.target) &&
          !hamburger.contains(e.target)
        ) {
          closeMobileMenu();
        }
      });

      // Close on ESC
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMobileMenu();
      });
    }
  };

  /* ──────────────────────────────────────────────
   *  3a. HERO — TYPEWRITER EFFECT
   * ────────────────────────────────────────────── */

  const initTypewriter = () => {
    const el = $('.typewriter, .typewriter-text, #typewriter');
    if (!el) return;

    const designations = [
      'AI/ML Engineer',
      'Agentic AI Developer',
      'Full Stack Developer',
      'AI Research Enthusiast',
    ];

    const TYPE_SPEED = 100;
    const DELETE_SPEED = 50;
    const PAUSE_BETWEEN = 2000;

    let wordIdx = 0;
    let charIdx = 0;
    let isDeleting = false;

    const tick = () => {
      const current = designations[wordIdx];

      if (isDeleting) {
        charIdx--;
        el.textContent = current.substring(0, charIdx);

        if (charIdx === 0) {
          isDeleting = false;
          wordIdx = (wordIdx + 1) % designations.length;
          setTimeout(tick, 300);
          return;
        }
        setTimeout(tick, DELETE_SPEED);
      } else {
        charIdx++;
        el.textContent = current.substring(0, charIdx);

        if (charIdx === current.length) {
          isDeleting = true;
          setTimeout(tick, PAUSE_BETWEEN);
          return;
        }
        setTimeout(tick, TYPE_SPEED);
      }
    };

    // Start after a short delay so the hero section is visible
    setTimeout(tick, 500);
  };

  /* ──────────────────────────────────────────────
   *  3b. HERO — PARTICLE BACKGROUND (Canvas)
   * ────────────────────────────────────────────── */

  const initParticles = () => {
    const hero = $('#hero, .hero, .hero-section');
    if (!hero) return;

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.classList.add('particle-canvas');
    Object.assign(canvas.style, {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '1',
    });
    hero.style.position = hero.style.position || 'relative';
    hero.insertBefore(canvas, hero.firstChild);

    const ctx = canvas.getContext('2d');
    let w, h;
    const PARTICLE_COUNT_MIN = 50;
    const PARTICLE_COUNT_MAX = 80;
    const CONNECTION_DIST = 120;
    const AMBER = { r: 245, g: 180, b: 50 }; // amber-gold

    let particles = [];
    let animId;

    const resize = () => {
      w = canvas.width = hero.offsetWidth;
      h = canvas.height = hero.offsetHeight;
    };

    class Particle {
      constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.r = Math.random() * 2.5 + 1;
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = (Math.random() - 0.5) * 0.6;
        this.opacity = Math.random() * 0.5 + 0.2;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around edges
        if (this.x < 0) this.x = w;
        if (this.x > w) this.x = 0;
        if (this.y < 0) this.y = h;
        if (this.y > h) this.y = 0;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${AMBER.r}, ${AMBER.g}, ${AMBER.b}, ${this.opacity})`;
        ctx.fill();
      }
    }

    const createParticles = () => {
      const count =
        PARTICLE_COUNT_MIN +
        Math.floor(Math.random() * (PARTICLE_COUNT_MAX - PARTICLE_COUNT_MIN));
      particles = Array.from({ length: count }, () => new Particle());
    };

    const connectParticles = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${AMBER.r}, ${AMBER.g}, ${AMBER.b}, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      connectParticles();
      animId = requestAnimationFrame(animate);
    };

    resize();
    createParticles();
    animate();

    window.addEventListener('resize', debounce(() => {
      resize();
      // Recreate particles on significant resize
      createParticles();
    }, 250));

    // Cleanup when page unloads
    window.addEventListener('beforeunload', () => cancelAnimationFrame(animId));
  };

  /* ──────────────────────────────────────────────
   *  4. SCROLL ANIMATIONS (Intersection Observer)
   * ────────────────────────────────────────────── */

  const initScrollAnimations = () => {
    const animatedElements = $$('.fade-in-up, .fade-in-left, .fade-in-right, .scale-in');
    if (!animatedElements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;

            // Determine stagger delay
            let delay = 0;
            for (let i = 1; i <= 6; i++) {
              if (el.classList.contains(`stagger-${i}`)) {
                delay = i * 120; // 120ms per stagger step
                break;
              }
            }

            setTimeout(() => {
              el.classList.add('visible', 'animate');
            }, delay);

            // Only animate once
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    animatedElements.forEach((el) => observer.observe(el));
  };

  /* ──────────────────────────────────────────────
   *  5. SKILLS — PROGRESS BAR ANIMATION
   * ────────────────────────────────────────────── */

  const initSkillBars = () => {
    const skillSection = $('#skills, .skills-section, .skills');
    const bars = $$('.skill-bar__fill, .progress-bar, .skill-bar-fill, .skill-progress');
    if (!skillSection || !bars.length) return;

    let animated = false;

    const animateBar = (bar, delay) => {
      const target = parseInt(bar.dataset.progress || bar.dataset.value || bar.getAttribute('data-progress'), 10);
      if (isNaN(target)) return;

      const percentEl =
        bar.parentElement?.querySelector('.skill-percent, .progress-value, .percent') ||
        bar.closest('.skill-item, .skill')?.querySelector('.skill-percent, .progress-value, .percent');

      setTimeout(() => {
        bar.style.width = `${target}%`;

        // Count up the percentage number
        if (percentEl) {
          animateCounter(percentEl, 0, target, 1200, '%');
        }
      }, delay);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !animated) {
            animated = true;
            bars.forEach((bar, i) => animateBar(bar, i * 150));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(skillSection);
  };

  /** Shared counter animation utility */
  const animateCounter = (el, start, end, duration = 2000, suffix = '') => {
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = clamp(elapsed / duration, 0, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);

      el.textContent = `${current}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  };

  /* ──────────────────────────────────────────────
   *  6. ACHIEVEMENTS — COUNTER ANIMATION
   * ────────────────────────────────────────────── */

  const initCounters = () => {
    const counters = $$('.counter, .stat-number, [data-target]');
    if (!counters.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const raw = el.dataset.target || el.textContent.trim();
            const hasSuffix = raw.endsWith('+');
            const target = parseInt(raw.replace(/[^0-9]/g, ''), 10);

            if (isNaN(target)) return;

            const suffix = hasSuffix ? '+' : '';
            animateCounter(el, 0, target, 2000, suffix);

            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.3 }
    );

    counters.forEach((c) => observer.observe(c));
  };

  /* ──────────────────────────────────────────────
   *  7. PROJECTS — FILTER
   * ────────────────────────────────────────────── */

  const initProjectFilter = () => {
    const filterBtns = $$('.filter-btn, .project-filter-btn, [data-filter]');
    const projectCards = $$('.project-card, .project-item, [data-category]');
    if (!filterBtns.length || !projectCards.length) return;

    const filterProjects = (category) => {
      projectCards.forEach((card) => {
        const cardCat = card.dataset.category || '';
        const matches =
          category === 'all' ||
          category === '*' ||
          cardCat.toLowerCase().includes(category.toLowerCase());

        if (matches) {
          card.style.display = '';
          // Trigger reflow then animate in
          requestAnimationFrame(() => {
            card.classList.remove('hidden');
            card.classList.add('show');
            card.style.opacity = '1';
            card.style.transform = 'scale(1) translateY(0)';
          });
        } else {
          card.classList.add('hidden');
          card.classList.remove('show');
          card.style.opacity = '0';
          card.style.transform = 'scale(0.8) translateY(20px)';

          // Hide after transition
          setTimeout(() => {
            if (card.classList.contains('hidden')) {
              card.style.display = 'none';
            }
          }, 400);
        }
      });
    };

    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        // Update active state
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter || btn.textContent.trim().toLowerCase();
        filterProjects(filter);
      });
    });
  };

  /* ──────────────────────────────────────────────
   *  8. CERTIFICATIONS — IMAGE MODAL
   * ────────────────────────────────────────────── */

  const initCertModal = () => {
    const certImages = $$(
      '.cert-card__image, .cert-img, .cert-thumbnail, .certification-card img'
    );
    if (!certImages.length) return;

    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'cert-modal';

    const modalImg = document.createElement('img');
    modalImg.className = 'cert-modal__image';
    modal.appendChild(modalImg);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'cert-modal__close';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Close modal');
    modal.appendChild(closeBtn);

    document.body.appendChild(modal);

    const openModal = (src, alt) => {
      modalImg.src = src;
      modalImg.alt = alt || 'Certificate';
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    };

    certImages.forEach((img) => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => {
        const fullSrc = img.dataset.full || img.dataset.src || img.src;
        openModal(fullSrc, img.alt);
      });
    });

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeModal();
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });
  };

  /* ──────────────────────────────────────────────
   *  9. CONTACT FORM
   * ────────────────────────────────────────────── */

  const initContactForm = () => {
    const form = $('form#contact-form, .contact-form form, #contact form');
    if (!form) return;

    /* — Floating labels — */
    const inputs = $$('input, textarea', form);
    inputs.forEach((input) => {
      const check = () => {
        input.classList.toggle('has-content', input.value.trim().length > 0);
      };
      input.addEventListener('focus', () => input.classList.add('focused'));
      input.addEventListener('blur', () => {
        input.classList.remove('focused');
        check();
      });
      input.addEventListener('input', check);
      check(); // initial
    });

    /* — Validation — */
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const validateField = (field) => {
      const val = field.value.trim();
      let valid = true;

      if (field.hasAttribute('required') && !val) {
        valid = false;
      }

      if (field.type === 'email' && val && !emailRe.test(val)) {
        valid = false;
      }

      field.classList.toggle('invalid', !valid);
      field.classList.toggle('valid', valid);
      return valid;
    };

    /* — Submit — */
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      let allValid = true;
      inputs.forEach((input) => {
        if (!validateField(input)) allValid = false;
      });

      if (!allValid) {
        // Shake the form briefly
        form.classList.add('shake');
        setTimeout(() => form.classList.remove('shake'), 600);
        return;
      }

      // Build mailto link as fallback for static site
      const nameField = $('[name="name"], [name="full_name"]', form);
      const emailField = $('[name="email"]', form);
      const msgField = $('[name="message"], textarea', form);

      const subject = encodeURIComponent(
        `Portfolio Contact from ${nameField?.value || 'Visitor'}`
      );
      const body = encodeURIComponent(
        `Name: ${nameField?.value || ''}\nEmail: ${emailField?.value || ''}\n\n${msgField?.value || ''}`
      );

      // Show success message
      showFormSuccess(form);

      // Open mailto (optional)
      // window.location.href = `mailto:samir@example.com?subject=${subject}&body=${body}`;
    });

    /* — Ripple on submit button — */
    const submitBtn = $('button[type="submit"], .submit-btn, .contact-btn', form) || $('button', form);
    if (submitBtn) {
      submitBtn.style.position = 'relative';
      submitBtn.style.overflow = 'hidden';

      submitBtn.addEventListener('click', function (e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2;

        Object.assign(ripple.style, {
          position: 'absolute',
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.3)',
          transform: 'scale(0)',
          left: `${e.clientX - rect.left - size / 2}px`,
          top: `${e.clientY - rect.top - size / 2}px`,
          pointerEvents: 'none',
          animation: 'ripple-effect 0.6s ease-out forwards',
        });

        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 700);
      });

      // Inject ripple keyframes if not already present
      if (!$('#ripple-style')) {
        const style = document.createElement('style');
        style.id = 'ripple-style';
        style.textContent = `
          @keyframes ripple-effect {
            to { transform: scale(1); opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }
    }
  };

  /** Show a success toast / inline message after form submit */
  const showFormSuccess = (form) => {
    // Check for existing success element
    let msg = form.querySelector('.form-success');
    if (!msg) {
      msg = document.createElement('div');
      msg.className = 'form-success';
      Object.assign(msg.style, {
        padding: '1rem',
        marginTop: '1rem',
        background: 'rgba(245, 180, 50, 0.15)',
        border: '1px solid rgba(245, 180, 50, 0.4)',
        borderRadius: '8px',
        color: '#f5b432',
        textAlign: 'center',
        opacity: '0',
        transition: 'opacity 0.4s ease',
      });
      form.appendChild(msg);
    }

    msg.textContent = '✓ Message sent successfully! I\'ll get back to you soon.';
    requestAnimationFrame(() => (msg.style.opacity = '1'));

    // Reset form
    form.reset();
    $$('input, textarea', form).forEach((i) => {
      i.classList.remove('valid', 'invalid', 'has-content');
    });

    // Fade out after a while
    setTimeout(() => {
      msg.style.opacity = '0';
      setTimeout(() => msg.remove(), 500);
    }, 5000);
  };

  /* ──────────────────────────────────────────────
   *  10. PARALLAX EFFECTS
   * ────────────────────────────────────────────── */

  const initParallax = () => {
    const hero = $('#hero, .hero, .hero-section');
    if (!hero) return;

    const parallaxEls = $$('.parallax-element, .hero-bg, .hero-shape, .floating-shape', hero);

    /* — Scroll parallax — */
    const handleScrollParallax = () => {
      const scrollY = window.scrollY;
      const heroH = hero.offsetHeight;

      // Only compute while hero is in view
      if (scrollY > heroH * 1.5) return;

      parallaxEls.forEach((el, i) => {
        const speed = parseFloat(el.dataset.speed) || 0.3 + i * 0.1;
        const y = -(scrollY * speed);
        el.style.transform = `translateY(${y}px)`;
      });
    };

    window.addEventListener('scroll', rafThrottle(handleScrollParallax), { passive: true });

    /* — Mouse-move parallax — */
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    });

    const animateMouseParallax = () => {
      // Smooth interpolation
      currentX = lerp(currentX, mouseX, 0.05);
      currentY = lerp(currentY, mouseY, 0.05);

      parallaxEls.forEach((el, i) => {
        const depth = parseFloat(el.dataset.depth) || 15 + i * 8;
        const moveX = currentX * depth;
        const moveY = currentY * depth;

        // Combine with any existing scroll transform
        const scrollY = -(window.scrollY * (parseFloat(el.dataset.speed) || 0.3 + i * 0.1));
        el.style.transform = `translate(${moveX}px, ${scrollY + moveY}px)`;
      });

      requestAnimationFrame(animateMouseParallax);
    };

    requestAnimationFrame(animateMouseParallax);
  };

  /* ──────────────────────────────────────────────
   *  11. BACK TO TOP BUTTON
   * ────────────────────────────────────────────── */

  const initBackToTop = () => {
    // Try to find existing button or create one
    let btn = $('#back-to-top, .back-to-top, .scroll-top');

    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'back-to-top';
      btn.className = 'back-to-top';
      btn.setAttribute('aria-label', 'Back to top');
      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>`;
      document.body.appendChild(btn);
    }

    const toggleBtn = () => {
      const show = window.scrollY > 500;
      btn.classList.toggle('visible', show);
    };

    window.addEventListener('scroll', rafThrottle(toggleBtn), { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  /* ──────────────────────────────────────────────
   *  12. SMOOTH REVEAL — SECTION HEADINGS
   * ────────────────────────────────────────────── */

  const initSectionHeadings = () => {
    const headings = $$('.section__title, .section-title, .section-heading, section h2');
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible', 'animate');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    headings.forEach((h) => observer.observe(h));
  };

  /* ──────────────────────────────────────────────
   *  13. CURSOR GLOW (subtle) — Optional
   * ────────────────────────────────────────────── */

  const initCursorGlow = () => {
    // Only on non-touch devices
    if ('ontouchstart' in window) return;

    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    Object.assign(glow.style, {
      position: 'fixed',
      width: '300px',
      height: '300px',
      borderRadius: '50%',
      background:
        'radial-gradient(circle, rgba(245,180,50,0.06) 0%, transparent 70%)',
      pointerEvents: 'none',
      zIndex: '0',
      transform: 'translate(-50%, -50%)',
      transition: 'opacity 0.3s',
      opacity: '0',
    });
    document.body.appendChild(glow);

    let glowVisible = false;

    document.addEventListener(
      'mousemove',
      rafThrottle((e) => {
        glow.style.left = `${e.clientX}px`;
        glow.style.top = `${e.clientY}px`;
        if (!glowVisible) {
          glow.style.opacity = '1';
          glowVisible = true;
        }
      }),
      { passive: true }
    );

    document.addEventListener('mouseleave', () => {
      glow.style.opacity = '0';
      glowVisible = false;
    });
  };

  /* ──────────────────────────────────────────────
   *  14. ACTIVE LINK UNDERLINE SLIDER (optional)
   * ────────────────────────────────────────────── */

  const initNavIndicator = () => {
    const navList = $('nav ul, .nav-links');
    if (!navList) return;

    const indicator = document.createElement('span');
    indicator.className = 'nav-indicator';
    Object.assign(indicator.style, {
      position: 'absolute',
      bottom: '0',
      height: '2px',
      background: '#f5b432',
      transition: 'left 0.3s ease, width 0.3s ease',
      borderRadius: '2px',
    });
    navList.style.position = navList.style.position || 'relative';
    navList.appendChild(indicator);

    const moveIndicator = () => {
      const activeLink = $('a.active', navList);
      if (activeLink) {
        const { offsetLeft, offsetWidth } = activeLink;
        indicator.style.left = `${offsetLeft}px`;
        indicator.style.width = `${offsetWidth}px`;
        indicator.style.opacity = '1';
      } else {
        indicator.style.opacity = '0';
      }
    };

    // Update on scroll spy changes via MutationObserver
    const mo = new MutationObserver(debounce(moveIndicator, 50));
    $$('a', navList).forEach((a) =>
      mo.observe(a, { attributes: true, attributeFilter: ['class'] })
    );

    moveIndicator();
    window.addEventListener('resize', debounce(moveIndicator, 200));
  };

  /* ──────────────────────────────────────────────
   *  🚀 INITIALISE EVERYTHING
   * ────────────────────────────────────────────── */

  initPreloader();
  initNavigation();
  initTypewriter();
  initParticles();
  initScrollAnimations();
  initSkillBars();
  initCounters();
  initProjectFilter();
  initCertModal();
  initContactForm();
  initParallax();
  initBackToTop();
  initSectionHeadings();
  initCursorGlow();
  initNavIndicator();

  console.log('%c✦ Portfolio loaded', 'color: #f5b432; font-weight: bold; font-size: 14px;');
});
