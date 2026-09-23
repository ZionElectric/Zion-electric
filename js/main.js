(function () {
  var nav = document.getElementById('header-nav');
  var header = document.getElementById('header');
  var toTop = document.querySelector('.scrollToTop');
  var toggle = document.querySelector('.menu-toggle');
  var menu = document.getElementById('menu-list');

  // Sticky menu: fixes to the top once the top bar scrolls out of view
  function onScroll() {
    var threshold = header.querySelector('.header-top').offsetHeight || 0;
    var fixed = window.scrollY > threshold + 40;
    nav.classList.toggle('is-fixed', fixed);
    toTop.classList.toggle('show', window.scrollY > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu
  toggle.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Highlight the active section in the menu
  var links = menu.querySelectorAll('a[href^="#"]:not(.btn)');
  var sections = Array.prototype.map.call(links, function (a) {
    return document.querySelector(a.getAttribute('href'));
  });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { if (s) spy.observe(s); });

    // Reveal on scroll
    var revealTargets = document.querySelectorAll('.section-title, .icon-box, .step, .about-text, .about-thumb, .contact-intro, .contact-form-wrap');
    var reveal = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          reveal.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealTargets.forEach(function (el) { el.classList.add('reveal'); reveal.observe(el); });
  }

  // Project carousel
  var track = document.getElementById('carousel-track');
  var slides = track.querySelectorAll('.carousel-slide');
  var dotsWrap = document.getElementById('carousel-dots');
  function step() { return slides[0].getBoundingClientRect().width + 16; }
  function perView() { return Math.max(1, Math.round(track.clientWidth / step())); }
  function pageCount() { return slides.length - perView() + 1; }
  function current() { return Math.round(track.scrollLeft / step()); }
  function goTo(i) {
    var n = pageCount();
    i = (i + n) % n;
    track.scrollTo({ left: i * step() });
  }
  function buildDots() {
    dotsWrap.innerHTML = '';
    for (var i = 0; i < pageCount(); i++) {
      var d = document.createElement('button');
      d.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      d.addEventListener('click', goTo.bind(null, i));
      dotsWrap.appendChild(d);
    }
    syncDots();
  }
  function syncDots() {
    var c = current();
    Array.prototype.forEach.call(dotsWrap.children, function (d, i) { d.classList.toggle('active', i === c); });
  }
  document.querySelector('.carousel-btn.prev').addEventListener('click', function () { goTo(current() - 1); });
  document.querySelector('.carousel-btn.next').addEventListener('click', function () { goTo(current() + 1); });
  track.addEventListener('scroll', syncDots, { passive: true });
  window.addEventListener('resize', buildDots);
  buildDots();

  // Autoplay, paused while the visitor is interacting
  var paused = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var carousel = track.parentNode;
  ['mouseenter', 'touchstart', 'focusin'].forEach(function (ev) { carousel.addEventListener(ev, function () { paused = true; }, { passive: true }); });
  ['mouseleave', 'focusout'].forEach(function (ev) { carousel.addEventListener(ev, function () { paused = false; }); });
  carousel.addEventListener('touchend', function () { setTimeout(function () { paused = false; }, 6000); }, { passive: true });
  if (!reduced) setInterval(function () { if (!paused && !document.hidden) goTo(current() + 1); }, 4000);

  // Contact form — sends through Web3Forms to info@zionelectricswfl.com
  var form = document.getElementById('contact_form');
  var result = form.querySelector('.form-result');
  var submitBtn = form.querySelector('button[type="submit"]');
  function showResult(msg, isError) {
    result.textContent = msg;
    result.classList.toggle('error', !!isError);
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    form.querySelectorAll('[required]').forEach(function (field) {
      var valid = field.value.trim() !== '' && (field.type !== 'email' || /\S+@\S+\.\S+/.test(field.value));
      field.classList.toggle('invalid', !valid);
      if (!valid) ok = false;
    });
    if (!ok) {
      showResult('Please add your name and a valid email.', true);
      return;
    }
    var btnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    showResult('');
    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(form)
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data.success) throw new Error(data.message);
        showResult('Thanks! We’ll be in touch shortly.');
        form.reset();
      })
      .catch(function () {
        showResult('Your message didn’t send. Please call us at (239) 944-9466.', true);
      })
      .then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = btnText;
      });
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
