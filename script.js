/* ==========================================================================
   Ramzur — landing behaviour

   Contents
     0. Shared helpers
     1. Mobile nav
     2. Scroll-reveal
     3. Scroll progress + nav elevation
     4. Active-section tracking
     5. Auto-growing textareas
     6. Stat count-up
     7. Form validation (shared by both forms)
     8. Main contact form            <- TODO-BACKEND
     9. Lead modal                   <- TODO-BACKEND

   Every animated behaviour checks prefersReducedMotion and resolves to its
   end state instead of animating.
   ========================================================================== */

(function(){
  'use strict';

  /* ============================ 0. HELPERS =============================== */

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  function reducedMotion(){ return motionQuery.matches; }

  var FOCUSABLE = [
    'a[href]', 'button:not([disabled])', 'input:not([disabled])',
    'textarea:not([disabled])', 'select:not([disabled])', '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  function $(id){ return document.getElementById(id); }

  /* ============================ 1. MOBILE NAV ============================ */

  (function(){
    var toggle = $('navToggle');
    var menu = $('mobileMenu');
    if(!toggle || !menu) return;

    var links = Array.prototype.slice.call(menu.querySelectorAll('a'));
    // index drives the staggered entrance of the links in CSS
    links.forEach(function(a, i){ a.style.setProperty('--i', i); });

    function setOpen(open){
      menu.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    toggle.addEventListener('click', function(){
      setOpen(!menu.classList.contains('open'));
    });

    links.forEach(function(a){
      a.addEventListener('click', function(){ setOpen(false); });
    });

    // Escape closes it, and focus returns to the control that opened it
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && menu.classList.contains('open')){
        setOpen(false);
        toggle.focus();
      }
    });

    // a tap outside the panel closes it
    document.addEventListener('click', function(e){
      if(!menu.classList.contains('open')) return;
      if(menu.contains(e.target) || toggle.contains(e.target)) return;
      setOpen(false);
    });

    // widening past the breakpoint hides the burger; make sure the panel
    // does not stay open in a state where it can no longer be closed
    window.addEventListener('resize', function(){
      if(window.innerWidth > 940 && menu.classList.contains('open')) setOpen(false);
    });
  })();

  /* ============================ 2. SCROLL-REVEAL =========================
     Elements start hidden only because html.js is set (see the inline script
     in <head>), so this is strictly an enhancement: if anything here fails,
     the failsafe below still shows every section. */

  (function(){
    var items = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    if(!items.length) return;

    function showAll(){
      items.forEach(function(el){ el.classList.add('is-visible'); });
    }

    if(reducedMotion() || !('IntersectionObserver' in window)){
      showAll();
      return;
    }

    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    items.forEach(function(el){ io.observe(el); });

    // Failsafe: transitions are throttled or skipped entirely in background
    // tabs and headless renderers, which would leave sections blank. After
    // 2.5s, anything still hidden is simply shown.
    setTimeout(showAll, 2500);

    // If the user turns reduced motion on mid-session, stop animating.
    if(typeof motionQuery.addEventListener === 'function'){
      motionQuery.addEventListener('change', function(){
        if(motionQuery.matches) showAll();
      });
    }
  })();

  /* ==================== 3. SCROLL PROGRESS + NAV ELEVATION ===============
     One update per animation frame, and the bar is driven by transform so
     the scroll handler never triggers layout. */

  (function(){
    var nav = document.querySelector('.nav');
    var bar = $('scrollProgressBar');
    var ticking = false;

    function update(){
      ticking = false;
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(scrollTop / max, 1) : 0;
      if(bar) bar.style.transform = 'scaleX(' + ratio + ')';
      if(nav) nav.classList.toggle('scrolled', scrollTop > 12);
    }
    function request(){
      if(!ticking){ ticking = true; requestAnimationFrame(update); }
    }

    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request, { passive: true });
    update();
  })();

  /* ==================== 4. ACTIVE-SECTION TRACKING ======================= */

  (function(){
    var ids = ['hero','about','services','guarantees','checklist','contact'];
    var sections = ids.map($).filter(Boolean);
    var links = Array.prototype.slice.call(
      document.querySelectorAll('.nav-links a, .mobile-menu a')
    );
    if(!sections.length || !links.length || !('IntersectionObserver' in window)) return;

    function setActive(id){
      links.forEach(function(a){
        var on = a.getAttribute('href') === '#' + id;
        a.classList.toggle('active', on);
        // the underline is decorative; this is what a screen reader reports
        if(on) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }

    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function(s){ io.observe(s); });
  })();

  /* ==================== 5. AUTO-GROWING TEXTAREAS ========================
     The task field takes anything from one line to a paragraph. It grows
     with its content up to the max-height set in CSS, then scrolls — so the
     field never hides what was typed and never leaves a large empty box. */

  function autogrow(el){
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  var growers = Array.prototype.slice.call(document.querySelectorAll('textarea[data-autogrow]'));
  growers.forEach(function(el){
    // Remember the CSS resting height so the field can shrink back to it.
    // The modal's textarea is inside a hidden dialog at load time and
    // measures 0, so an unmeasurable field records nothing and falls back to
    // its stylesheet height instead of collapsing.
    var base = el.offsetHeight;
    if(base > 0) el.dataset.baseHeight = base;
    el.addEventListener('input', function(){ autogrow(el); });
  });

  function resetGrow(el){
    if(!el) return;
    el.style.height = '';   // back to the min-height in the stylesheet
  }

  /* ==================== 6. STAT COUNT-UP =================================
     Runs only once a .stat-num actually holds a number, so it stays dormant
     while the values are XX placeholders. Any trailing characters ("+", "%")
     are preserved.

     Small values are deliberately excluded. Counting 0 -> 2 gives three
     frames over a second and reads as a rendering glitch rather than motion;
     the effect only earns its place once there are enough intermediate
     values to look like counting. Numbers below the threshold are simply
     shown, which is also the honest presentation for a young company. */

  var COUNT_UP_MIN = 10;

  (function(){
    var nums = Array.prototype.slice.call(document.querySelectorAll('.stat-num'));
    if(!nums.length || !('IntersectionObserver' in window)) return;

    var targets = nums.filter(function(el){
      var raw = el.textContent.trim();
      if(!/^\d+\D{0,2}$/.test(raw)) return false;
      return parseInt(raw, 10) >= COUNT_UP_MIN;
    });
    if(!targets.length || reducedMotion()) return;

    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting) return;
        io.unobserve(entry.target);
        count(entry.target);
      });
    }, { threshold: 0.6 });

    targets.forEach(function(el){ io.observe(el); });

    function count(el){
      var raw = el.textContent.trim();
      var target = parseInt(raw, 10);
      var suffix = raw.replace(/^\d+/, '');
      var duration = 1100;
      var start = null;

      // reserve the final width so the row cannot reflow while counting
      el.style.minWidth = el.offsetWidth + 'px';

      function frame(now){
        if(start === null) start = now;
        var t = Math.min((now - start) / duration, 1);
        // ease-out-quart, matching the page's motion tokens
        var eased = 1 - Math.pow(1 - t, 4);
        el.textContent = Math.round(target * eased) + suffix;
        if(t < 1) requestAnimationFrame(frame);
      }
      el.textContent = '0' + suffix;
      requestAnimationFrame(frame);
    }
  })();

  /* ==================== 7. SHARED FORM VALIDATION ========================
     Validated on submit. Empty required fields get a red outline, a named
     message tied to the input via aria-describedby, and a shake; focus moves
     to the first offender. */

  function fieldWrap(input){ return input.closest('.form-field'); }

  function markInvalid(input, on){
    var wrap = fieldWrap(input);
    var msg = wrap ? wrap.querySelector('.field-error') : null;

    if(wrap) wrap.classList.toggle('error', on);
    input.setAttribute('aria-invalid', on ? 'true' : 'false');

    if(msg){
      msg.hidden = !on;
      if(on) input.setAttribute('aria-describedby', msg.id);
      else input.removeAttribute('aria-describedby');
    }
    if(on && wrap && !reducedMotion()){
      wrap.classList.add('shake');
      setTimeout(function(){ wrap.classList.remove('shake'); }, 500);
    }
  }

  function validateLead(fields){
    var invalid = fields.filter(function(f){ return !f.value.trim(); });
    fields.forEach(function(f){ markInvalid(f, invalid.indexOf(f) !== -1); });
    if(invalid.length){
      invalid[0].focus();
      return false;
    }
    return true;
  }

  function clearErrorOnInput(fields){
    fields.forEach(function(f){
      f.addEventListener('input', function(){
        if(f.value.trim()) markInvalid(f, false);
      });
    });
  }

  // Announces the result and puts the caret on it, so the confirmation is
  // not something only sighted users receive.
  function showSuccess(form, success){
    form.classList.add('hidden');
    success.classList.add('show');
    success.focus();
  }

  /* ---------------------------------------------------------------
     TODO-BACKEND:
     Обе формы ниже (основная и модальная) пока не отправляют данные
     никуда — только показывают сообщение об успехе локально в
     браузере. Перед запуском нужно подключить реальную отправку,
     например:
       - Telegram Bot API (webhook на бота компании)
       - e-mail сервис (напр. через простой backend-эндпоинт)
       - CRM webhook (amoCRM, Bitrix24 и т.п.)
     --------------------------------------------------------------- */

  /* ==================== 8. MAIN CONTACT FORM ============================= */

  (function(){
    var form = $('leadForm');
    var success = $('formSuccess');
    if(!form || !success) return;

    var fields = [$('name'), $('phone')].filter(Boolean);
    clearErrorOnInput(fields);

    form.addEventListener('submit', function(e){
      e.preventDefault();
      if(!validateLead(fields)) return;

      // Пример точки интеграции:
      // fetch('/api/lead', { method:'POST', body: JSON.stringify({
      //   name: $('name').value, phone: $('phone').value,
      //   task: $('task').value
      // }) })

      showSuccess(form, success);
    });
  })();

  /* ==================== 9. LEAD MODAL ====================================
     Opened by any .js-open-modal button. Title, subtitle and the task
     placeholder come from the button's data-title / data-sub /
     data-placeholder, so each CTA opens the same dialog with wording that
     matches what was just clicked. */

  (function(){
    var overlay = $('modalOverlay');
    if(!overlay) return;

    var modal = overlay.querySelector('.modal');
    var titleEl = $('modalTitle');
    var subEl = $('modalSub');
    var form = $('modalForm');
    var success = $('modalSuccess');
    var closeBtn = $('modalClose');
    var nameField = $('modalName');
    var phoneField = $('modalPhone');
    var taskField = $('modalTask');

    var fields = [nameField, phoneField].filter(Boolean);
    var lastFocused = null;
    var lastTrigger = null;
    var closeTimer = null;

    var DEFAULT_TITLE = 'Оставьте заявку';
    var DEFAULT_SUB = 'Заполните два поля — свяжемся с вами в течение 24 часов.';

    clearErrorOnInput(fields);

    function isOpen(){ return overlay.classList.contains('open'); }

    function openModal(trigger){
      clearTimeout(closeTimer);

      titleEl.textContent = trigger.dataset.title || DEFAULT_TITLE;
      subEl.textContent = trigger.dataset.sub || DEFAULT_SUB;
      taskField.placeholder = trigger.dataset.placeholder || 'Пара предложений о задаче';

      // reset to a clean state — the dialog is reused by every CTA
      form.classList.remove('hidden');
      success.classList.remove('show');
      taskField.value = '';
      resetGrow(taskField);
      fields.forEach(function(f){ f.value = ''; markInvalid(f, false); });

      // Both are recorded: activeElement is the more accurate return point
      // for keyboard users, but Safari does not focus a button when it is
      // clicked, so the trigger itself is the fallback. Without it, closing
      // would drop focus onto <body> and lose the reader's place.
      lastTrigger = trigger;
      lastFocused = document.activeElement;
      document.body.classList.add('modal-open');

      overlay.hidden = false;
      // one forced reflow so the entrance transition has a start value
      void overlay.offsetWidth;
      overlay.classList.add('open');

      // focus lands on the first field once the dialog has arrived
      var delay = reducedMotion() ? 0 : 260;
      setTimeout(function(){ nameField.focus(); }, delay);
    }

    function closeModal(){
      if(!isOpen()) return;
      overlay.classList.remove('open');
      document.body.classList.remove('modal-open');

      // The dialog is only hidden once the exit finishes: `hidden` keeps its
      // inputs out of the tab order, which is why it cannot simply stay in
      // the DOM behind an opacity-0 overlay.
      var wait = reducedMotion() ? 0 : 280;
      closeTimer = setTimeout(function(){ overlay.hidden = true; }, wait);

      var target = lastFocused;
      if(!target || target === document.body || typeof target.focus !== 'function'){
        target = lastTrigger;
      }
      if(target && typeof target.focus === 'function') target.focus();
    }

    document.querySelectorAll('.js-open-modal').forEach(function(btn){
      btn.addEventListener('click', function(){ openModal(btn); });
    });
    if(closeBtn) closeBtn.addEventListener('click', closeModal);

    // click the backdrop, not the dialog
    overlay.addEventListener('mousedown', function(e){
      if(e.target === overlay) closeModal();
    });

    document.addEventListener('keydown', function(e){
      if(!isOpen()) return;

      if(e.key === 'Escape'){
        closeModal();
        return;
      }

      // Focus trap: Tab cycles within the dialog rather than escaping to the
      // page behind it.
      if(e.key !== 'Tab') return;
      var nodes = Array.prototype.slice.call(modal.querySelectorAll(FOCUSABLE))
        .filter(function(el){ return el.offsetParent !== null; });
      if(!nodes.length) return;

      var first = nodes[0];
      var last = nodes[nodes.length - 1];

      if(e.shiftKey && document.activeElement === first){
        e.preventDefault();
        last.focus();
      } else if(!e.shiftKey && document.activeElement === last){
        e.preventDefault();
        first.focus();
      }
    });

    form.addEventListener('submit', function(e){
      e.preventDefault();
      if(!validateLead(fields)) return;

      // Пример точки интеграции:
      // fetch('/api/lead', { method:'POST', body: JSON.stringify({
      //   name: nameField.value, phone: phoneField.value, task: taskField.value
      // }) })

      showSuccess(form, success);
    });
  })();

})();
