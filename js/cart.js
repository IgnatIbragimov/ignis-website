/* ============================================================
   IGNIS — cart.js
   Рендер корзины из localStorage. Изменение количества, удаление.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  renderCart();
  // перерисовываем при любом изменении корзины
  document.addEventListener('ignis:cart-changed', renderCart);
});


async function renderCart() {
  const root = document.getElementById('cart-root');
  if (!root) return;

  const cart = IGNIS_STORE.getCart();

  if (!cart.length) {
    root.innerHTML = `
      <div class="cart__empty">
        <p>Корзина пуста.</p>
        <p style="margin-top:12px;"><a href="catalog.html">Перейти в каталог</a></p>
      </div>`;
    return;
  }

  // подтягиваем данные товаров, чтобы показать фото/название/цену
  const products = await IGNIS_STORE.fetchProducts();

  let total = 0;

  const itemsHTML = cart.map((item, index) => {
    const p = products.find(pr => pr.id === item.id);
    if (!p) return '';
    const cover = (p.images && p.images[0]) ? p.images[0].src : '';
    const lineTotal = p.price * item.qty;
    total += lineTotal;

    return `
      <div class="cart-item">
        <a class="cart-item__img" href="product.html?id=${encodeURIComponent(p.id)}">
          <img src="${cover}" alt="${p.name}" />
        </a>
        <div>
          <p class="cart-item__name">${p.name}</p>
          <p class="cart-item__meta">Размер: ${item.size}</p>
          <p class="cart-item__meta">${IGNIS_STORE.formatPrice(p.price, p.currency)}</p>
        </div>
        <div class="cart-item__right">
          <div class="qty">
            <button data-action="dec" data-index="${index}" aria-label="Меньше">&minus;</button>
            <span>${item.qty}</span>
            <button data-action="inc" data-index="${index}" aria-label="Больше">+</button>
          </div>
          <p class="cart-item__price">${IGNIS_STORE.formatPrice(lineTotal, p.currency)}</p>
          <button class="cart-item__remove" data-action="remove" data-index="${index}">Удалить</button>
        </div>
      </div>`;
  }).join('');

  const currency = products[0] ? products[0].currency : 'RUB';

  root.innerHTML = `
    ${itemsHTML}
    <div class="cart__summary">
      <p class="cart__total">Итого: <strong>${IGNIS_STORE.formatPrice(total, currency)}</strong></p>
      <a href="checkout.html" class="btn">Оформить предзаказ</a>
    </div>`;

  // обработчики количества/удаления
  root.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = Number(btn.dataset.index);
      const action = btn.dataset.action;
      const cart = IGNIS_STORE.getCart();
      if (action === 'inc') IGNIS_STORE.updateQty(index, cart[index].qty + 1);
      else if (action === 'dec') IGNIS_STORE.updateQty(index, cart[index].qty - 1);
      else if (action === 'remove') IGNIS_STORE.removeItem(index);
    });
  });
}
