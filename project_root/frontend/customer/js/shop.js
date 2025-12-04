(function () {
  let products = []
  let cartItems = []

  document.addEventListener('DOMContentLoaded', () => {
    setupFilters()
    setupSearch()
    hydrateCart()
    loadProducts()
  })

  function setupFilters() {
    const chips = document.querySelectorAll('.filter-chip')
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => c.classList.remove('active'))
        chip.classList.add('active')
        applyFilters()
      })
    })
  }

  function setupSearch() {
    const input = document.querySelector('.search-row input')
    if (!input) return
    input.addEventListener('input', applyFilters)
  }

  function hydrateCart() {
    cartItems = cartStore.loadCart()
    renderCart()
  }

  function applyFilters() {
    const activeChip = document.querySelector('.filter-chip.active')
    const category = activeChip ? activeChip.textContent.trim() : 'All'
    const searchTerm = document.querySelector('.search-row input')?.value.trim().toLowerCase()

    let filtered = filterByCategory(category)

    if (searchTerm) {
      filtered = filtered.filter((p) =>
        [p.name, p.category, p.description]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(searchTerm))
      )
    }

    renderProducts(filtered)
  }

  function filterByCategory(category) {
    if (!category || category === 'All') return products
    return products.filter((p) => (p.category || '').toLowerCase() === category.toLowerCase())
  }

  function renderProducts(list) {
    const grid = document.getElementById('product-grid')
    const empty = document.getElementById('empty-state')
    if (!grid || !empty) return

    grid.innerHTML = ''

    if (!list || !list.length) {
      empty.style.display = 'block'
      return
    }

    empty.style.display = 'none'

    list.forEach((p) => {
      const price = typeof p.price === 'number' ? p.price.toFixed(2) : p.price
      const category = p.category || 'General'
      grid.innerHTML += `
        <article class="product-card" data-product-id="${p.id}">
          <div class="product-image-wrap">
            <img src="${p.image_url || ''}" alt="${p.name}">
          </div>

          <div class="product-body">
            <h3 class="product-name">${p.name}</h3>
            <p class="product-meta">${category}</p>

            <p class="product-price">€${price}</p>

            <div class="product-footer">
              <input type="number" min="1" value="1" class="qty-input" />
              <button class="add-btn" type="button">Add to Cart</button>
            </div>
          </div>
        </article>
      `
    })

    grid.querySelectorAll('.add-btn').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        const card = event.target.closest('.product-card')
        const id = Number(card?.dataset.productId)
        const product = products.find((prod) => prod.id === id)
        const qty = card?.querySelector('.qty-input')?.value || 1
        if (!product) return
        cartItems = cartStore.addItem(product, qty) || cartStore.loadCart()
        renderCart()
      })
    })
  }

  function renderCart() {
    const cartBox = document.querySelector('.cart-items')
    const empty = document.querySelector('.cart-empty')
    const subtotalEl = document.querySelector('.cart-value')
    const checkoutBtn = document.querySelector('.checkout-btn')

    if (!cartBox || !empty || !subtotalEl || !checkoutBtn) return

    cartItems = cartStore.loadCart()
    cartBox.innerHTML = ''

    if (!cartItems.length) {
      empty.style.display = 'block'
      subtotalEl.textContent = '€0.00'
      checkoutBtn.disabled = true
      checkoutBtn.classList.add('disabled')
      return
    }

    empty.style.display = 'none'
    checkoutBtn.disabled = false
    checkoutBtn.classList.remove('disabled')
    checkoutBtn.onclick = () => (window.location.href = 'checkout.html')

    cartItems.forEach((item) => {
      const lineTotal = (item.price * item.quantity).toFixed(2)
      const div = document.createElement('div')
      div.className = 'cart-item'
      div.innerHTML = `
        <div>
          <p class="cart-item-name">${item.name}</p>
          <p class="cart-item-meta">${item.quantity} x €${item.price.toFixed(2)}</p>
        </div>
        <div class="cart-item-right">
          <span class="cart-item-total">€${lineTotal}</span>
        </div>
      `
      cartBox.appendChild(div)
    })

    const summary = cartStore.totals(cartItems)
    subtotalEl.textContent = `€${summary.subtotal.toFixed(2)}`
  }

  async function loadProducts() {
    const errorBox = document.getElementById('shop-error')
    if (errorBox) errorBox.textContent = ''

    try {
      products = await apiClient.listProducts()
      applyFilters()
    } catch (err) {
      if (errorBox) {
        errorBox.textContent = err.message || 'Failed to load products'
      }
      renderProducts([])
    }
  }
})()
