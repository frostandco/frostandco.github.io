// ================================================
// FROST & CO. — Lógica del carrito de compras
// ================================================

  // Formato de número local por código de país: cantidad de dígitos y agrupación
  const PHONE_FORMATS = {
    '+503': { digits: 8,  groups: [4, 4],    placeholder: '7777-7777' },      // El Salvador
    '+502': { digits: 8,  groups: [4, 4],    placeholder: '7777-7777' },      // Guatemala
    '+504': { digits: 8,  groups: [4, 4],    placeholder: '7777-7777' },      // Honduras
    '+505': { digits: 8,  groups: [4, 4],    placeholder: '7777-7777' },      // Nicaragua
    '+506': { digits: 8,  groups: [4, 4],    placeholder: '7777-7777' },      // Costa Rica
    '+507': { digits: 8,  groups: [4, 4],    placeholder: '7777-7777' },      // Panamá
    '+1':   { digits: 10, groups: [3, 3, 4], placeholder: '777-777-7777' },   // Estados Unidos
    '+52':  { digits: 10, groups: [3, 3, 4], placeholder: '777-777-7777' },   // México
  };

  let cart = [];
  const MAX_QTY = 2; // límite por producto (hay pocas unidades disponibles)

  function addToCart(name, price) {
    // Imagen de la paleta: se toma de la tarjeta donde se hizo clic
    let img = '';
    try {
      const card = event.target.closest('.pastry-card, .card, .cold-card');
      const el = card && card.querySelector('img');
      if (el) img = el.getAttribute('src');
    } catch (e) {}
    const btn = event.target;
    const existing = cart.find(i => i.name === name);
    let atLimit = false;
    if (existing) {
      if (existing.qty >= MAX_QTY) {
        atLimit = true;
      } else {
        existing.qty++;
        if (!existing.img && img) existing.img = img;
      }
    } else {
      cart.push({ name, price, qty: 1, img });
    }
    updateCartUI();

    if (btn && btn.classList.contains('btn-add')) {
      if (!btn.dataset.orig) btn.dataset.orig = btn.textContent;
      clearTimeout(btn._t);
      btn.textContent = atLimit ? 'Máximo ' + MAX_QTY : '✓ Agregado';
      btn.style.background = atLimit ? '#FF8A3D' : '#21B6A8';
      btn._t = setTimeout(() => {
        btn.textContent = btn.dataset.orig;
        btn.style.background = '';
      }, 1400);
    }
  }

  function changeQty(name, delta) {
    const item = cart.find(i => i.name === name);
    if (!item) return;
    if (delta > 0 && item.qty >= MAX_QTY) return;
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter(i => i.name !== name);
    }
    updateCartUI();
    openCart(); // re-render el contenido del carrito abierto
  }

  function removeItem(name) {
    cart = cart.filter(i => i.name !== name);
    updateCartUI();
    openCart();
  }

  function updateCartUI() {
    const total = cart.reduce((s, i) => s + i.qty, 0);
    document.getElementById('cartCount').textContent = total;
  }

  function resetModalHeader() {
    const title = document.getElementById('modalTitle');
    const backBtn = document.getElementById('modalBackBtn');
    if (title) title.textContent = 'Mi Pedido';
    if (backBtn) backBtn.style.display = 'none';
  }

  function openCart() {
    resetModalHeader();
    const body = document.getElementById('cartBody');
    if (cart.length === 0) {
      body.innerHTML = '<p class="cart-empty">Tu pedido está vacío.<br>¡Elige algo delicioso! 🍧</p>';
    } else {
      const totalUSD = cart.reduce((s, i) => s + i.price * i.qty, 0);
      body.innerHTML = cart.map(i => `
        <div class="cart-item">
          <div class="cart-item-thumb">${i.img ? `<img src="${i.img}" alt="${i.name}">` : '🍧'}</div>
          <div class="cart-item-info">
            <div class="cart-item-name">${i.name}</div>
            <div class="cart-item-unit">$${i.price.toFixed(2)} c/u</div>
            <div class="cart-item-qty">
              <button class="qty-btn" onclick="changeQty('${i.name}', -1)" aria-label="Restar uno">−</button>
              <span class="qty-value">${i.qty}</span>
              <button class="qty-btn" onclick="changeQty('${i.name}', 1)" aria-label="Sumar uno" ${i.qty >= MAX_QTY ? 'disabled' : ''}>+</button>
            </div>
            ${i.qty >= MAX_QTY ? `<div class="cart-item-limit">Máximo ${MAX_QTY} por persona</div>` : ''}
          </div>
          <div class="cart-item-right">
            <span class="cart-item-price">$${(i.price * i.qty).toFixed(2)}</span>
            <button class="remove-btn" onclick="removeItem('${i.name}')" aria-label="Eliminar producto">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h10l1-13"/></svg>
            </button>
          </div>
        </div>`
      ).join('') +
      `<div class="cart-total"><span>Total</span><span>$${totalUSD.toFixed(2)}</span></div>
       <button class="btn-checkout" onclick="goToPayment()">Continuar al Pago ↗</button>`;
    }
    document.getElementById('cartModal').classList.add('active');
  }

  function closeCart() {
    document.getElementById('cartModal').classList.remove('active');
  }

  // ------------------------------------------------
  // Paso de pago: métodos de pago + datos del cliente
  // ------------------------------------------------
  function goToPayment() {
    if (cart.length === 0) return;

    const title = document.getElementById('modalTitle');
    const backBtn = document.getElementById('modalBackBtn');
    if (title) title.textContent = 'Pago';
    if (backBtn) backBtn.style.display = 'inline-flex';

    const totalUSD = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const body = document.getElementById('cartBody');

    body.innerHTML = `
      <form class="payment-form" id="paymentForm" onsubmit="return false;">
        <div>
          <label for="payName">Nombre completo</label>
          <input type="text" id="payName" placeholder="Ej. María Pérez" autocomplete="name" oninput="clearFieldError(this)">
        </div>
        <div>
          <label for="payPhone">Teléfono</label>
          <div class="phone-input-group">
            <select id="payPhoneCode" class="phone-code-select" aria-label="Código de país" onchange="onPhoneCodeChange()">
              <option value="+503" selected>🇸🇻 +503</option>
              <option value="+502">🇬🇹 +502</option>
              <option value="+504">🇭🇳 +504</option>
              <option value="+505">🇳🇮 +505</option>
              <option value="+506">🇨🇷 +506</option>
              <option value="+507">🇵🇦 +507</option>
              <option value="+1">🇺🇸 +1</option>
              <option value="+52">🇲🇽 +52</option>
            </select>
            <input type="tel" id="payPhone" inputmode="numeric" maxlength="9" placeholder="7777-7777" autocomplete="tel" oninput="formatPhoneNumber(this)" onkeypress="return onlyDigitsKeypress(event)">
          </div>
        </div>
        <div>
          <label for="payAddress">Dirección de entrega</label>
          <input type="text" id="payAddress" placeholder="Colonia, calle, referencia" autocomplete="street-address" oninput="clearFieldError(this)">
        </div>

        <div class="payment-method-block">
          <label>Método de pago</label>
          <div class="payment-method-list">
            <label class="payment-method-option">
              <input type="radio" name="payMethod" value="efectivo" checked onchange="onPaymentMethodChange()">
              <span>💵 Efectivo contra entrega</span>
            </label>
            <label class="payment-method-option">
              <input type="radio" name="payMethod" value="tarjeta" onchange="onPaymentMethodChange()">
              <span>💳 Tarjeta de crédito / débito</span>
            </label>
            <label class="payment-method-option">
              <input type="radio" name="payMethod" value="transferencia" onchange="onPaymentMethodChange()">
              <span>🏦 Transferencia bancaria</span>
            </label>
          </div>
        </div>

        <div id="cardFields" class="payment-card-fields" style="display:none;">
          <div>
            <label for="cardNumber">Número de tarjeta</label>
            <input type="text" id="cardNumber" inputmode="numeric" maxlength="19" placeholder="0000-0000-0000-0000" autocomplete="cc-number" oninput="formatCardNumber(this)" onkeypress="return onlyDigitsKeypress(event)">
          </div>
          <div class="payment-row">
            <div>
              <label for="cardExpiry">Vencimiento</label>
              <input type="text" id="cardExpiry" inputmode="numeric" maxlength="5" placeholder="MM/AA" autocomplete="cc-exp" oninput="formatCardExpiry(this)" onkeypress="return onlyDigitsKeypress(event)">
            </div>
            <div>
              <label for="cardCvv">CVV</label>
              <input type="text" id="cardCvv" inputmode="numeric" maxlength="4" placeholder="123" autocomplete="cc-csc" oninput="formatDigitsOnly(this)" onkeypress="return onlyDigitsKeypress(event)">
            </div>
          </div>
          <div>
            <label for="cardName">Nombre en la tarjeta</label>
            <input type="text" id="cardName" placeholder="Como aparece en la tarjeta" autocomplete="cc-name" oninput="clearFieldError(this)">
          </div>
        </div>

        <p class="contact-form-note" id="transferNote" style="display:none;">Te enviaremos los datos bancarios por WhatsApp para completar la transferencia al confirmar el pedido.</p>

        <div class="cart-total"><span>Total a pagar</span><span>$${totalUSD.toFixed(2)}</span></div>

        <p class="payment-error" id="paymentError" style="display:none;"></p>

        <button type="button" class="btn-checkout" onclick="submitPayment()">Confirmar y Pagar ↗</button>
      </form>
    `;
  }

  function backToCart() {
    openCart();
  }

  function onPaymentMethodChange() {
    const method = document.querySelector('input[name="payMethod"]:checked').value;
    const cardFields = document.getElementById('cardFields');
    const transferNote = document.getElementById('transferNote');
    if (cardFields) cardFields.style.display = (method === 'tarjeta') ? 'grid' : 'none';
    if (transferNote) transferNote.style.display = (method === 'transferencia') ? 'block' : 'none';
  }

  // Bloquea que se escriban letras u otros caracteres no numéricos
  function onlyDigitsKeypress(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return true;
    return /[0-9]/.test(e.key);
  }

  // Formatea el número de tarjeta en grupos de 4: 0000-0000-0000-0000
  function formatCardNumber(input) {
    let digits = input.value.replace(/\D/g, '').slice(0, 16);
    let groups = digits.match(/.{1,4}/g) || [];
    input.value = groups.join('-');
    clearFieldError(input);
  }

  // Formatea el vencimiento como MM/AA
  function formatCardExpiry(input) {
    let digits = input.value.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) {
      input.value = digits.slice(0, 2) + '/' + digits.slice(2);
    } else {
      input.value = digits;
    }
    clearFieldError(input);
  }

  // Solo dígitos, sin separadores (para el CVV)
  function formatDigitsOnly(input) {
    input.value = input.value.replace(/\D/g, '');
    clearFieldError(input);
  }

  // Formatea el teléfono local según el formato del país elegido (8 o 10 dígitos)
  function formatPhoneNumber(input) {
    const code = document.getElementById('payPhoneCode').value;
    const fmt = PHONE_FORMATS[code] || PHONE_FORMATS['+503'];
    let digits = input.value.replace(/\D/g, '').slice(0, fmt.digits);

    let parts = [];
    let pos = 0;
    fmt.groups.forEach(len => {
      if (pos < digits.length) {
        parts.push(digits.slice(pos, pos + len));
        pos += len;
      }
    });
    input.value = parts.join('-');
    clearFieldError(input);
  }

  // Cuando cambia el código de país, ajusta formato, largo máximo y placeholder,
  // y reformatea lo que el usuario ya haya escrito
  function onPhoneCodeChange() {
    const code = document.getElementById('payPhoneCode').value;
    const fmt = PHONE_FORMATS[code] || PHONE_FORMATS['+503'];
    const phoneInput = document.getElementById('payPhone');
    if (!phoneInput) return;

    phoneInput.maxLength = fmt.digits + fmt.groups.length - 1; // dígitos + guiones
    phoneInput.placeholder = fmt.placeholder;
    formatPhoneNumber(phoneInput);
  }

  // Quita el resaltado de error apenas el usuario empieza a corregir el campo
  function clearFieldError(input) {
    input.classList.remove('input-error');
  }

  function markFieldError(input) {
    if (input) input.classList.add('input-error');
  }

  function submitPayment() {
    const errorEl = document.getElementById('paymentError');
    const nameEl = document.getElementById('payName');
    const phoneEl = document.getElementById('payPhone');
    const addressEl = document.getElementById('payAddress');
    const phoneCode = document.getElementById('payPhoneCode').value;

    const name = nameEl.value.trim();
    const phoneDigits = phoneEl.value.replace(/\D/g, '');
    const phoneFmt = PHONE_FORMATS[phoneCode] || PHONE_FORMATS['+503'];
    const address = addressEl.value.trim();
    const method = document.querySelector('input[name="payMethod"]:checked').value;

    // Limpia marcas de error previas
    [nameEl, phoneEl, addressEl].forEach(clearFieldError);

    let firstInvalid = null;
    if (!name) firstInvalid = firstInvalid || nameEl;
    if (phoneDigits.length !== phoneFmt.digits) firstInvalid = firstInvalid || phoneEl;
    if (!address) firstInvalid = firstInvalid || addressEl;

    if (firstInvalid) {
      if (!name) markFieldError(nameEl);
      if (phoneDigits.length !== phoneFmt.digits) markFieldError(phoneEl);
      if (!address) markFieldError(addressEl);
      errorEl.textContent = '⚠ Completa tu nombre, teléfono y dirección de entrega para continuar.';
      errorEl.style.display = 'block';
      firstInvalid.focus();
      return;
    }

    const phone = `${phoneCode} ${phoneEl.value.trim()}`;

    if (method === 'tarjeta') {
      const cardNumberEl = document.getElementById('cardNumber');
      const cardExpiryEl = document.getElementById('cardExpiry');
      const cardCvvEl = document.getElementById('cardCvv');
      const cardNameEl = document.getElementById('cardName');
      const cardNumber = cardNumberEl.value.trim();
      const cardExpiry = cardExpiryEl.value.trim();
      const cardCvv = cardCvvEl.value.trim();
      const cardName = cardNameEl.value.trim();

      [cardNumberEl, cardExpiryEl, cardCvvEl, cardNameEl].forEach(clearFieldError);

      if (!cardNumber || !cardExpiry || !cardCvv || !cardName) {
        if (!cardNumber) markFieldError(cardNumberEl);
        if (!cardExpiry) markFieldError(cardExpiryEl);
        if (!cardCvv) markFieldError(cardCvvEl);
        if (!cardName) markFieldError(cardNameEl);
        errorEl.textContent = '⚠ Completa los datos de tu tarjeta para continuar.';
        errorEl.style.display = 'block';
        return;
      }
      if (cardNumber.replace(/-/g, '').length !== 16) {
        markFieldError(cardNumberEl);
        errorEl.textContent = '⚠ El número de tarjeta debe tener 16 dígitos.';
        errorEl.style.display = 'block';
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        markFieldError(cardExpiryEl);
        errorEl.textContent = '⚠ Ingresa el vencimiento en formato MM/AA.';
        errorEl.style.display = 'block';
        return;
      }
      if (cardCvv.length < 3) {
        markFieldError(cardCvvEl);
        errorEl.textContent = '⚠ El CVV debe tener 3 o 4 dígitos.';
        errorEl.style.display = 'block';
        return;
      }
    }

    errorEl.style.display = 'none';

    const methodLabel = method === 'efectivo' ? 'Efectivo contra entrega'
      : method === 'tarjeta' ? 'Tarjeta de crédito/débito'
      : 'Transferencia bancaria';

    // Arma el mensaje profesional y listo para enviar, con el detalle del pedido
    const totalUSD = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const itemsText = cart.map(i => `• ${i.qty}x ${i.name} — $${(i.price * i.qty).toFixed(2)}`).join('\n');

    let message = `Buen día, Frost & Co. 🍧\n\n`;
    message += `Quisiera confirmar el siguiente pedido:\n\n`;
    message += `${itemsText}\n\n`;
    message += `Total: $${totalUSD.toFixed(2)}\n`;
    message += `Método de pago: ${methodLabel}\n\n`;
    message += `Datos de entrega:\n`;
    message += `Nombre: ${name}\n`;
    message += `Teléfono: ${phone}\n`;
    message += `Dirección: ${address}\n\n`;
    message += `Quedo atento/a a la confirmación. ¡Gracias!`;

    const whatsappNumber = '50361830519';
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    window.open(whatsappURL, '_blank');

    cart = [];
    updateCartUI();
    closeCart();
  }

  document.getElementById('cartModal').addEventListener('click', function(e) {
    if (e.target === this) closeCart();
  });

  // ------------------------------------------------
  // Buscador de productos
  // ------------------------------------------------
  const SEARCH_SECTION_IDS = ['frutaletas', 'chocolate', 'geletas', 'especiales'];

  function filterProducts(rawQuery) {
    const q = rawQuery.trim().toLowerCase();

    const clearBtn = document.getElementById('searchClear');
    if (clearBtn) clearBtn.style.display = q ? 'flex' : 'none';

    let totalVisible = 0;

    SEARCH_SECTION_IDS.forEach(id => {
      const section = document.getElementById(id);
      if (!section) return;
      const cards = section.querySelectorAll('.pastry-card, .card, .cold-card');
      let visibleInSection = 0;

      cards.forEach(card => {
        const nameEl = card.querySelector('.pastry-name, .card-name, .cold-card-name');
        const name = nameEl ? nameEl.textContent.toLowerCase() : '';
        // Solo se compara contra el nombre del producto, para que al buscar
        // aparezca únicamente ese producto y no otros con palabras parecidas
        // en la descripción.
        const matches = !q || name.includes(q);
        card.style.display = matches ? '' : 'none';
        if (matches) visibleInSection++;
      });

      totalVisible += visibleInSection;
      section.style.display = visibleInSection > 0 ? '' : 'none';
    });

    const countEl = document.getElementById('searchResultsCount');
    const noResultsEl = document.getElementById('noResultsMsg');

    if (countEl) {
      if (q) {
        countEl.textContent = totalVisible === 1
          ? '1 producto encontrado'
          : `${totalVisible} productos encontrados`;
        countEl.style.display = 'block';
      } else {
        countEl.style.display = 'none';
      }
    }

    if (noResultsEl) {
      noResultsEl.style.display = (q && totalVisible === 0) ? 'block' : 'none';
    }
  }

  function clearSearch() {
    const input = document.getElementById('productSearch');
    if (!input) return;
    input.value = '';
    filterProducts('');
    input.focus();
  }

  // ================================================
  // Lightbox de imágenes de paletas (click para agrandar)
  // ================================================
  function openImgLightbox(src, caption) {
    const overlay = document.getElementById('imgLightbox');
    const img = document.getElementById('imgLightboxImg');
    const captionEl = document.getElementById('imgLightboxCaption');
    if (!overlay || !img) return;
    img.src = src;
    img.alt = caption || '';
    if (captionEl) captionEl.textContent = caption || '';
    overlay.classList.add('active');
  }

  function closeImgLightbox(event) {
    const overlay = document.getElementById('imgLightbox');
    if (!overlay) return;
    // Evita cerrar si el click fue dentro de la imagen (excepto el botón cerrar / fondo)
    if (event && event.target && event.target.id === 'imgLightboxImg') return;
    overlay.classList.remove('active');
  }

  document.addEventListener('DOMContentLoaded', function () {
    const clickableSelectors = '.pastry-img, .cup-img, .cold-card-img';
    document.querySelectorAll(clickableSelectors).forEach(function (img) {
      img.addEventListener('click', function (e) {
        e.stopPropagation();
        openImgLightbox(img.getAttribute('src'), img.getAttribute('alt'));
      });
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      const overlay = document.getElementById('imgLightbox');
      if (overlay) overlay.classList.remove('active');
    }
  });
