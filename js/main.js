/* ============================================================
   IGNIS — main.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Nav: turns opaque after scrolling ---------- */
  const nav = document.querySelector('.nav');
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();


  /* ---------- Mobile menu ---------- */
  const burger  = document.querySelector('.nav__burger');
  const overlay = document.querySelector('.menu-overlay');
  const closeBtn = document.querySelector('.menu-overlay__close');

  const openMenu  = () => { overlay.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const closeMenu = () => { overlay.classList.remove('open'); document.body.style.overflow = ''; };

  burger.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', closeMenu);

  overlay.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });


  /* ---------- Scroll-reveal (Intersection Observer) ---------- */
  const revealEls = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  revealEls.forEach(el => revealObserver.observe(el));


  /* ---------- Cart counter ----------
     Читает количество из localStorage (через store.js, если он подключён)
     и обновляется по событию ignis:cart-changed. ---------- */
  const cartCount = document.querySelector('.nav__cart-count');

  function refreshCartCount() {
    if (!cartCount || typeof IGNIS_STORE === 'undefined') return;
    const n = IGNIS_STORE.count();
    cartCount.textContent = n;
    cartCount.classList.toggle('has-items', n > 0);
  }

  refreshCartCount();
  document.addEventListener('ignis:cart-changed', refreshCartCount);

  // Клик по иконке корзины ведёт в корзину
  const cartBtn = document.querySelector('.nav__cart');
  if (cartBtn) cartBtn.addEventListener('click', () => { window.location.href = 'cart.html'; });

});
