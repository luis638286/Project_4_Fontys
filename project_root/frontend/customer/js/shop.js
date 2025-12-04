(function () {
  let products = []

  document.addEventListener('DOMContentLoaded', () => {
    setupFilters()
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
              <button class="add-btn" type="button">Add to Cart</button>
            </div>
          </div>
        </article>
      `
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
