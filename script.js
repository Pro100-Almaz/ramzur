// Mobile nav toggle
  document.getElementById('navToggle').addEventListener('click', function(){
    document.getElementById('mobileMenu').classList.toggle('open');
  });
  document.querySelectorAll('.mobile-menu a').forEach(function(a){
    a.addEventListener('click', function(){
      document.getElementById('mobileMenu').classList.remove('open');
    });
  });

  // ---------------------------------------------------------
  // Scroll-reveal: fade + rise elements into view once, the
  // first time each crosses into the viewport.
  // ---------------------------------------------------------
  (function(){
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var items = document.querySelectorAll('.reveal');
    if(reduceMotion || !('IntersectionObserver' in window)){
      items.forEach(function(el){ el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    items.forEach(function(el){ io.observe(el); });
  })();

  // ---------------------------------------------------------
  // Scroll progress bar + sticky nav elevation, throttled to
  // one update per animation frame.
  // ---------------------------------------------------------
  (function(){
    var nav = document.querySelector('.nav');
    var bar = document.getElementById('scrollProgress');
    var ticking = false;

    function update(){
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? (scrollTop / max) * 100 : 0;
      bar.style.width = pct + '%';
      nav.classList.toggle('scrolled', scrollTop > 12);
      ticking = false;
    }
    window.addEventListener('scroll', function(){
      if(!ticking){ requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  })();

  // ---------------------------------------------------------
  // Active nav-link tracking: highlights the section currently
  // in view, mirroring the "one continuous flow" motif.
  // ---------------------------------------------------------
  (function(){
    var sectionIds = ['hero','about','services','guarantees','checklist','contact'];
    var sections = sectionIds.map(function(id){ return document.getElementById(id); }).filter(Boolean);
    var navLinks = document.querySelectorAll('.nav-links a, .mobile-menu a');

    function setActive(id){
      navLinks.forEach(function(a){
        a.classList.toggle('active', a.getAttribute('href') === '#' + id);
      });
    }
    if('IntersectionObserver' in window){
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting){ setActive(entry.target.id); }
        });
      }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
      sections.forEach(function(s){ io.observe(s); });
    }
  })();

  // ---------------------------------------------------------
  // Shared validation: marks empty required fields with a
  // shake + red outline, focuses the first one, returns
  // whether the pair (name, phone) was valid.
  // ---------------------------------------------------------
  function validateLead(nameField, phoneField){
    var invalidFields = [];
    if(!nameField.value.trim()) invalidFields.push(nameField);
    if(!phoneField.value.trim()) invalidFields.push(phoneField);
    if(invalidFields.length){
      invalidFields.forEach(function(field){
        var wrapper = field.closest('.form-field');
        wrapper.classList.add('error', 'shake');
        setTimeout(function(){ wrapper.classList.remove('shake'); }, 500);
      });
      invalidFields[0].focus();
      return false;
    }
    return true;
  }
  function clearErrorOnInput(nameField, phoneField){
    [nameField, phoneField].forEach(function(field){
      field.addEventListener('input', function(){
        this.closest('.form-field').classList.remove('error');
      });
    });
  }

  // ---------------------------------------------------------
  // TODO-BACKEND:
  // Обе формы ниже (основная и модальная) пока не отправляют
  // данные никуда — только показывают сообщение об успехе
  // локально в браузере. Перед запуском нужно подключить
  // реальную отправку, например:
  //   - Telegram Bot API (webhook на бота компании)
  //   - e-mail сервис (напр. через простой backend-эндпоинт)
  //   - CRM webhook (amoCRM, Bitrix24 и т.п.)
  // ---------------------------------------------------------

  // Main contact-section form
  (function(){
    var form = document.getElementById('leadForm');
    var nameField = document.getElementById('name');
    var phoneField = document.getElementById('phone');
    clearErrorOnInput(nameField, phoneField);
    form.addEventListener('submit', function(e){
      e.preventDefault();
      if(!validateLead(nameField, phoneField)) return;

      // Пример точки интеграции:
      // fetch('/api/lead', { method:'POST', body: JSON.stringify({
      //   name: nameField.value, phone: phoneField.value,
      //   task: document.getElementById('task').value
      // }) })

      form.classList.add('hidden');
      document.getElementById('formSuccess').classList.add('show');
    });
  })();

  // ---------------------------------------------------------
  // Lead modal: opened by any button with class "js-open-modal".
  // Title / subtitle / textarea placeholder are read from the
  // button's data-title / data-sub / data-placeholder attributes,
  // so each CTA can open the same modal with context that matches
  // what the person just clicked.
  // ---------------------------------------------------------
  (function(){
    var overlay = document.getElementById('modalOverlay');
    var modal = overlay.querySelector('.modal');
    var titleEl = document.getElementById('modalTitle');
    var subEl = document.getElementById('modalSub');
    var form = document.getElementById('modalForm');
    var success = document.getElementById('modalSuccess');
    var nameField = document.getElementById('modalName');
    var phoneField = document.getElementById('modalPhone');
    var taskField = document.getElementById('modalTask');
    var lastFocused = null;

    clearErrorOnInput(nameField, phoneField);

    function openModal(trigger){
      titleEl.textContent = trigger.dataset.title || 'Оставьте заявку';
      subEl.textContent = trigger.dataset.sub || 'Заполните два поля — свяжемся с вами в течение 24 часов.';
      taskField.placeholder = trigger.dataset.placeholder || '';
      taskField.value = '';
      form.classList.remove('hidden');
      success.classList.remove('show');
      [nameField, phoneField].forEach(function(f){ f.closest('.form-field').classList.remove('error'); });

      lastFocused = document.activeElement;
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      setTimeout(function(){ nameField.focus(); }, 250);
    }

    function closeModal(){
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      if(lastFocused) lastFocused.focus();
    }

    document.querySelectorAll('.js-open-modal').forEach(function(btn){
      btn.addEventListener('click', function(){ openModal(btn); });
    });
    document.getElementById('modalClose').addEventListener('click', closeModal);
    overlay.addEventListener('click', function(e){
      if(e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
    });
    modal.addEventListener('click', function(e){ e.stopPropagation(); });

    form.addEventListener('submit', function(e){
      e.preventDefault();
      if(!validateLead(nameField, phoneField)) return;

      // Пример точки интеграции:
      // fetch('/api/lead', { method:'POST', body: JSON.stringify({
      //   name: nameField.value, phone: phoneField.value, task: taskField.value
      // }) })

      form.classList.add('hidden');
      success.classList.add('show');
    });
  })();


  // Respect reduced motion: nothing extra needed, CSS media query handles it.
