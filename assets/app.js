(function () {
  'use strict';

  const state = {
    navOpen: false,
    modalOpen: false,
    activeTrap: null,
    lastFocused: null
  };

  const selectors = {
    focusable: 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
  };

  const body = document.body;
  const langWraps = Array.from(document.querySelectorAll('[data-lang-wrap]'));
  const burger = document.querySelector('[data-burger]');
  const drawer = document.querySelector('[data-drawer]');
  const drawerBackdrop = document.querySelector('[data-drawer-backdrop]');
  const drawerClose = document.querySelector('[data-drawer-close]');
  const privacyLinks = Array.from(document.querySelectorAll('[data-privacy-open]'));
  const modalBackdrop = document.querySelector('[data-modal-backdrop]');
  const modal = document.querySelector('[data-modal]');
  const modalCloseButtons = Array.from(document.querySelectorAll('[data-modal-close]'));
  const faqItems = Array.from(document.querySelectorAll('.faq-item'));
  const revealEls = Array.from(document.querySelectorAll('.reveal'));
  const bars = Array.from(document.querySelectorAll('.bar span[data-width]'));
  const forms = Array.from(document.querySelectorAll('form.lead-form'));

  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
  const qs = (scope, selector) => scope.querySelector(selector);
  const qsa = (scope, selector) => Array.from(scope.querySelectorAll(selector));

  function setScrollLock(locked) {
    body.classList.toggle('no-scroll', locked);
  }

  function openTrap(container) {
    if (!container) return;
    state.activeTrap = container;
    const focusables = qsa(container, selectors.focusable);
    if (focusables.length) {
      focusables[0].focus();
    }
  }

  function closeTrap() {
    state.activeTrap = null;
    if (state.lastFocused && typeof state.lastFocused.focus === 'function') {
      state.lastFocused.focus();
    }
  }

  function handleTabTrap(event) {
    if (!state.activeTrap || event.key !== 'Tab') return;
    const focusables = qsa(state.activeTrap, selectors.focusable);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function closeAllLangMenus(except = null) {
    langWraps.forEach((wrap) => {
      if (wrap !== except) wrap.classList.remove('open');
    });
  }

  function initLanguageMenus() {
    langWraps.forEach((wrap) => {
      const trigger = qs(wrap, '[data-lang-trigger]');
      if (!trigger) return;
      trigger.addEventListener('click', (event) => {
        event.stopPropagation();
        const isOpen = wrap.classList.contains('open');
        closeAllLangMenus(wrap);
        wrap.classList.toggle('open', !isOpen);
      });
    });

    document.addEventListener('click', () => closeAllLangMenus());
  }

  function openDrawer() {
    if (!drawer || !drawerBackdrop) return;
    state.navOpen = true;
    state.lastFocused = document.activeElement;
    body.classList.add('nav-open');
    setScrollLock(true);
    openTrap(drawer);
  }

  function closeDrawer() {
    if (!state.navOpen) return;
    state.navOpen = false;
    body.classList.remove('nav-open');
    if (!state.modalOpen) setScrollLock(false);
    closeTrap();
  }

  function initDrawer() {
    if (!burger || !drawer || !drawerBackdrop) return;

    burger.addEventListener('click', openDrawer);
    drawerClose?.addEventListener('click', closeDrawer);
    drawerBackdrop.addEventListener('click', closeDrawer);

    const drawerLinks = qsa(drawer, 'a[href^="#"]');
    drawerLinks.forEach((link) => link.addEventListener('click', closeDrawer));
  }

  function openModal() {
    if (!modal || !modalBackdrop) return;
    state.modalOpen = true;
    state.lastFocused = document.activeElement;
    modalBackdrop.classList.add('open');
    setScrollLock(true);
    openTrap(modal);
  }

  function closeModal() {
    if (!state.modalOpen) return;
    state.modalOpen = false;
    modalBackdrop?.classList.remove('open');
    if (!state.navOpen) setScrollLock(false);
    closeTrap();
  }

  function initModal() {
    if (!modal || !modalBackdrop) return;

    privacyLinks.forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        openModal();
      });
    });

    modalCloseButtons.forEach((button) => {
      button.addEventListener('click', closeModal);
    });

    modalBackdrop.addEventListener('click', (event) => {
      if (event.target === modalBackdrop) closeModal();
    });
  }

  function initFAQ() {
    faqItems.forEach((item, index) => {
      const trigger = qs(item, '.faq-trigger');
      if (!trigger) return;

      trigger.setAttribute('aria-expanded', index === 0 ? 'true' : 'false');

      trigger.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        faqItems.forEach((entry) => {
          entry.classList.remove('active');
          const btn = qs(entry, '.faq-trigger');
          btn?.setAttribute('aria-expanded', 'false');
        });

        if (!isActive) {
          item.classList.add('active');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  function initReveals() {
    if (!revealEls.length) return;

    if (!('IntersectionObserver' in window)) {
      revealEls.forEach((el) => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -30px 0px' });

    revealEls.forEach((el) => observer.observe(el));
  }

  function animateBars() {
    bars.forEach((bar) => {
      const width = bar.getAttribute('data-width') || '0%';
      const numeric = clamp(parseInt(width, 10) || 0, 0, 100);
      bar.style.width = `${numeric}%`;
    });
  }

  function animateCounters() {
    const counters = qsa(document, '.counter[data-target]');
    counters.forEach((counter) => {
      const target = Number(counter.getAttribute('data-target') || 0);
      const duration = 1200;
      const start = performance.now();

      function tick(now) {
        const progress = clamp((now - start) / duration, 0, 1);
        const value = Math.floor(progress * target);
        counter.textContent = value.toLocaleString();
        if (progress < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    });
  }

  function validateField(input) {
    const value = input.value.trim();
    let valid = true;

    if (input.type === 'email') {
      valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    } else if (input.type === 'tel') {
      valid = value.length >= 7;
    } else {
      valid = value.length >= 2;
    }

    input.setAttribute('aria-invalid', String(!valid));
    input.style.borderColor = valid ? 'rgba(16, 33, 61, 0.12)' : 'rgba(201, 52, 52, 0.65)';
    return valid;
  }

  function initForms() {
    forms.forEach((form) => {
      const inputs = qsa(form, 'input');

      inputs.forEach((input) => {
        input.addEventListener('blur', () => validateField(input));
      });

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const allValid = inputs.every((input) => validateField(input));
        if (!allValid) return;

        const submit = qs(form, 'button[type="submit"]');
        const original = submit?.textContent || '';
        if (submit) {
          submit.textContent = 'Submitted';
          submit.disabled = true;
        }

        setTimeout(() => {
          form.reset();
          inputs.forEach((input) => {
            input.style.borderColor = 'rgba(16, 33, 61, 0.12)';
            input.setAttribute('aria-invalid', 'false');
          });
          if (submit) {
            submit.textContent = original;
            submit.disabled = false;
          }
        }, 1100);
      });
    });
  }

  function bindGlobalKeys() {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeAllLangMenus();
        closeModal();
        closeDrawer();
      }
      handleTabTrap(event);
    });
  }

  function init() {
    initLanguageMenus();
    initDrawer();
    initModal();
    initFAQ();
    initReveals();
    initForms();
    bindGlobalKeys();

    window.addEventListener('load', () => {
      animateBars();
      animateCounters();
    }, { once: true });
  }

  init();
})();
