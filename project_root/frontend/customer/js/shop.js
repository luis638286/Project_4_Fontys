(function () {
  let products = []

  document.addEventListener('DOMContentLoaded', () => {
    setupFilters()
    setupSearch()
    setupCartButtons()
    loadProducts()
  })

  function setupFilters() {
    const chips = document.querySelectorAll('.filter-chip')
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => c.classList.remove('active'))
        chip.classList.add('active')
        const category = chip.textContent.trim()
        renderProducts(filterByCategory(category))
      })
    })
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
      grid.innerHTML += `
        <article class="product-card">
          <div class="product-image-wrap">
            <img src="${p.image_url || ''}" alt="${p.name}">
          </div>

          <div class="product-body">
            <h3 class="product-name">${p.name}</h3>
            <p class="product-meta">${p.category || 'General'}</p>

            <p class="product-price">€${price}</p>

            <div class="product-footer">
              <input type="number" min="1" value="1" class="qty-input" />
              <button class="add-btn" type="button" data-product-id="${p.id}">Add to Cart</button>
            </div>
          </div>
        </article>
      `
    })
  }

  function setupCartButtons() {
    const grid = document.getElementById('product-grid')
    const errorBox = document.getElementById('shop-error')
    if (!grid) return

    grid.addEventListener('click', (event) => {
      const button = event.target.closest('.add-btn')
      if (!button) return

      const card = button.closest('.product-card')
      const qtyInput = card?.querySelector('.qty-input')
      const productId = Number(button.dataset.productId)
      const product = products.find((p) => p.id === productId)
      const qty = qtyInput ? Math.max(1, parseInt(qtyInput.value, 10) || 1) : 1

      if (!product) {
        if (errorBox) errorBox.textContent = 'Product not found in the catalog'
        return
      }

      cartStore.addItem(product, qty)
      button.textContent = 'Added!'
      setTimeout(() => {
        button.textContent = 'Add to Cart'
      }, 1200)
    })
  }

  function setupSearch() {
    const input = document.getElementById('product-search')
    if (!input) return

    input.addEventListener('input', () => {
      const term = input.value.trim().toLowerCase()
      const filtered = products.filter((p) => {
        const name = (p.name || '').toLowerCase()
        const category = (p.category || '').toLowerCase()
        return name.includes(term) || category.includes(term)
      })
      renderProducts(filtered)
    })
  }

  async function loadProducts() {
    const errorBox = document.getElementById('shop-error')
    if (errorBox) errorBox.textContent = ''

    try {
      products = await apiClient.listProducts()
      renderProducts(products)
    } catch (err) {
      if (errorBox) {
        errorBox.textContent = err.message || 'Failed to load products'
      }
      renderProducts([])
    }
  }
})()
