;(function () {
  let cart = []
  let currentUser = null

  const orderItemsEl = document.getElementById('order-items')
  const summaryCount = document.getElementById('summary-count')
  const summarySubtotal = document.getElementById('summary-subtotal')
  const summaryTotal = document.getElementById('summary-total')
  const errorBox = document.getElementById('checkout-error')
  const successBox = document.getElementById('checkout-success')
  const placeBtn = document.getElementById('place-order')

  document.addEventListener('DOMContentLoaded', () => {
    cart = cartStore.loadCart()
    if (!cart.length) {
      window.location.href = 'shop.html'
      return
    }

    currentUser = readUser()
    prefillForm()
    renderSummary()

    placeBtn?.addEventListener('click', submitOrder)
  })

  function readUser() {
    try {
      const raw = localStorage.getItem('freshmart_user')
      return raw ? JSON.parse(raw) : null
    } catch (err) {
      return null
    }
  }

  function prefillForm() {
    document.getElementById('full-name').value = `${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`.trim()
    document.getElementById('email').value = currentUser?.email || ''
  }

  function renderSummary() {
    if (!orderItemsEl || !summaryCount || !summarySubtotal || !summaryTotal) return

    orderItemsEl.innerHTML = ''
    cart.forEach((item) => {
      const div = document.createElement('div')
      div.className = 'order-item'
      div.innerHTML = `
        <span>${item.quantity} x ${item.name}</span>
        <span>€${(item.price * item.quantity).toFixed(2)}</span>
      `
      orderItemsEl.appendChild(div)
    })

    const totals = cartStore.totals(cart)
    summaryCount.textContent = totals.count
    summarySubtotal.textContent = `€${totals.subtotal.toFixed(2)}`
    summaryTotal.textContent = `€${totals.total.toFixed(2)}`
  }

  async function submitOrder() {
    clearMessages()

    const full_name = document.getElementById('full-name').value.trim()
    const email = document.getElementById('email').value.trim()
    const address = document.getElementById('address').value.trim()
    const city = document.getElementById('city').value.trim()
    const notes = document.getElementById('notes').value.trim()

    if (!full_name || !email) {
      return showError('Full name and email are required to place an order.')
    }

    if (!cart.length) {
      return showError('Your cart is empty.')
    }

    placeBtn.disabled = true
    placeBtn.textContent = 'Placing order...'

    try {
      const payload = {
        full_name,
        email,
        address,
        city,
        notes,
        user_id: currentUser?.id,
        items: cart.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      }

      const order = await apiClient.createOrder(payload)
      cartStore.clearCart()
      cart = []
      renderSummary()
      showSuccess(`Order #${order.id} placed! A confirmation has been saved.`)
    } catch (err) {
      showError(err.message || 'Unable to place order right now.')
    } finally {
      placeBtn.disabled = false
      placeBtn.textContent = 'Place order'
    }
  }

  function showError(message) {
    if (!errorBox) return
    errorBox.textContent = message
    errorBox.style.display = 'block'
  }

  function showSuccess(message) {
    if (!successBox) return
    successBox.textContent = message
    successBox.style.display = 'block'
  }

  function clearMessages() {
    if (errorBox) {
      errorBox.textContent = ''
      errorBox.style.display = 'none'
    }
    if (successBox) {
      successBox.textContent = ''
      successBox.style.display = 'none'
    }
  }
})()
