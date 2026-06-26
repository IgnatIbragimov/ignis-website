/* ============================================================
   IGNIS — checkout.js
   Сводка заказа + отправка предзаказа.
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('checkout-form');
  const summaryEl = document.getElementById('checkout-summary');
  if (!form || !summaryEl) return;

  const cart = IGNIS_STORE.getCart();

  // Пустая корзина — отправлять нечего
  if (!cart.length) {
    summaryEl.innerHTML = `<p style="color:var(--color-warm-gray);font-size:13px;">
      Корзина пуста. <a href="catalog.html" style="color:var(--color-chocolate)">В каталог</a></p>`;
    form.querySelector('#submit-order').disabled = true;
    return;
  }

  const products = await IGNIS_STORE.fetchProducts();

  // --- Сводка заказа ---
  let total = 0;
  const currency = products[0] ? products[0].currency : 'RUB';

  const linesHTML = cart.map(item => {
    const p = products.find(pr => pr.id === item.id);
    if (!p) return '';
    const lineTotal = p.price * item.qty;
    total += lineTotal;
    return `
      <div class="checkout__line">
        <span>${p.name} · ${item.size} · ${item.qty} шт.</span>
        <span>${IGNIS_STORE.formatPrice(lineTotal, p.currency)}</span>
      </div>`;
  }).join('');

  summaryEl.innerHTML = `
    ${linesHTML}
    <div class="checkout__line checkout__line--total">
      <span>Итого</span>
      <strong>${IGNIS_STORE.formatPrice(total, currency)}</strong>
    </div>`;

  // --- Отправка заказа ---
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // простая проверка обязательных полей
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const submitBtn = form.querySelector('#submit-order');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправляем…';

    // Обогащённые позиции для письма (название, цена, абсолютный URL фото)
    const emailItems = cart.map(item => {
      const p = products.find(pr => pr.id === item.id);
      if (!p) return null;
      const cover = (p.images && p.images[0]) ? p.images[0].src : '';
      return {
        name: p.name,
        size: item.size,
        qty: item.qty,
        priceFormatted: IGNIS_STORE.formatPrice(p.price * item.qty, p.currency),
        // абсолютный URL — почтовые клиенты не грузят относительные пути
        image: cover ? new URL(cover, location.origin).href : ''
      };
    }).filter(Boolean);

    const order = {
      customer: {
        name:    form.name.value.trim(),
        phone:   form.phone.value.trim(),
        email:   form.email.value.trim(),
        address: form.address.value.trim(),
        city:    form.city.value.trim(),
        delivery: form.delivery.value,
        comment: form.comment.value.trim()
      },
      items: cart,
      total: total,
      currency: currency,
      created_at: new Date().toISOString()
    };

    console.log('[IGNIS] Новый предзаказ:', order);

    // Отправляем письмо через серверless-функцию /api/send-order.
    // Ключ Resend хранится на сервере (env), не в браузере.
    try {
      const resp = await fetch('/api/send-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: order.customer.name,
          customerEmail: order.customer.email,
          items: emailItems,
          totalFormatted: IGNIS_STORE.formatPrice(total, currency)
        })
      });
      const result = await resp.json();
      if (!resp.ok) {
        console.error('[IGNIS] Письмо не отправлено:', result);
      } else {
        console.log('[IGNIS] Письмо отправлено, id:', result.id);
      }
    } catch (err) {
      // Сетевая ошибка не должна мешать пользователю — заказ всё равно принят.
      console.error('[IGNIS] Ошибка отправки письма:', err);
    }

    // очищаем корзину и показываем подтверждение
    IGNIS_STORE.clearCart();
    document.getElementById('checkout-view').classList.add('hidden');
    document.getElementById('confirm-view').classList.remove('hidden');
    window.scrollTo(0, 0);
  });
});
