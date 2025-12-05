;(function () {
  const itemsContainer = document.getElementById('cart-items')
  const emptyText = document.getElementById('cart-empty-text')
  const subtotalEl = document.getElementById('summary-subtotal')
  const totalEl = document.getElementById('summary-total')
  const itemsCountEl = document.getElementById('summary-items-count')
  const checkoutBtn = document.querySelector('.checkout-btn')
  const LOGIN_PAGE = 'login.html'

  document.addEventListener('DOMContentLoaded', () => {
    itemsContainer?.addEventListener('click', handleButtonClick)
    itemsContainer?.addEventListener('change', handleInputChange)
    renderCart()
  })

  function getStoredUser() {
    try {
      const raw = localStorage.getItem('freshmart_user')
      return raw ? JSON.parse(raw) : null
    } catch (err) {
      console.warn('Unable to read stored user', err)
      return null
    }
  }

  function renderCart() {
    if (!itemsContainer || !emptyText || !subtotalEl || !totalEl || !itemsCountEl || !checkoutBtn) return

    const cart = cartStore.loadCart()
    itemsContainer.innerHTML = ''

    if (!cart.length) {
      emptyText.style.display = 'block'
      checkoutBtn.disabled = true
      checkoutBtn.classList.add('disabled')
      itemsCountEl.textContent = '0'
      subtotalEl.textContent = '€0.00'
      totalEl.textContent = '€0.00'
      return
    }

    emptyText.style.display = 'none'
    checkoutBtn.disabled = false
    checkoutBtn.classList.remove('disabled')

    checkoutBtn.textContent = getStoredUser() ? 'Proceed to Checkout' : 'Log in to Checkout'
    checkoutBtn.onclick = () => {
      const user = getStoredUser()
      if (!user) {
        window.location.href = LOGIN_PAGE
        return
      }
      window.location.href = 'checkout.html'
    }

    cart.forEach((item) => {
      const row = document.createElement('article')
      row.className = 'cart-row'
      row.dataset.productId = item.product_id
      row.innerHTML = `
        <div class="cart-row-product">
          <p class="cart-item-name">${item.name}</p>
          <p class="cart-item-meta">${item.category || 'General'}</p>
        </div>

        <div class="cart-row-qty">
          <button class="qty-btn" data-action="decrement">-</button>
          <input type="number" min="1" value="${item.quantity}" class="qty-input" aria-label="Quantity" />
          <button class="qty-btn" data-action="increment">+</button>
        </div>

        <div class="cart-row-price">
          <span>€${item.price.toFixed(2)}</span>
        </div>

        <div class="cart-row-total">
          <span class="line-total">€${(item.price * item.quantity).toFixed(2)}</span>
          <button class="remove-btn" type="button">Remove</button>
        </div>
      `
      itemsContainer.appendChild(row)
    })

    updateSummary()
  }

  function handleButtonClick(event) {
    const target = event.target
    const row = target.closest('.cart-row')
    if (!row) return
    const productId = Number(row.dataset.productId)

    if (target.classList.contains('remove-btn')) {
      cartStore.removeItem(productId)
      renderCart()
      return
    }

    if (!target.dataset.action) return
    const input = row.querySelector('.qty-input')
    const current = Math.max(1, parseInt(input.value, 10) || 1)
    const newQty = target.dataset.action === 'increment' ? current + 1 : Math.max(1, current - 1)
    cartStore.updateQuantity(productId, newQty)
    input.value = newQty
    updateLineTotal(row, productId)
    updateSummary()
  }

  function handleInputChange(event) {
    const input = event.target
    if (!input.classList.contains('qty-input')) return
    const row = input.closest('.cart-row')
    const productId = Number(row?.dataset.productId)
    const newQty = Math.max(1, parseInt(input.value, 10) || 1)
    cartStore.updateQuantity(productId, newQty)
    input.value = newQty
    updateLineTotal(row, productId)
    updateSummary()
  }

  function updateLineTotal(row, productId) {
    const cart = cartStore.loadCart()
    const item = cart.find((c) => c.product_id === productId)
    if (!item) return
    const line = row.querySelector('.line-total')
    if (line) line.textContent = `€${(item.price * item.quantity).toFixed(2)}`
  }

  function updateSummary() {
    const cart = cartStore.loadCart()
    const totals = cartStore.totals(cart)
    itemsCountEl.textContent = totals.count
    subtotalEl.textContent = `€${totals.subtotal.toFixed(2)}`
    totalEl.textContent = `€${totals.total.toFixed(2)}`
  }
})()
