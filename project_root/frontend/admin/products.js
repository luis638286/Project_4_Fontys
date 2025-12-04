// products.js
// Frontend logic for FreshMart admin products page

const API_BASE_URL = 'http://127.0.0.1:5000/api/products'

let products = []
let currentEditId = null

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('product-form')
  const resetBtn = document.getElementById('product-form-reset-btn')
  const cancelEditBtn = document.getElementById('product-cancel-edit-btn')
  const searchInput = document.getElementById('product-search-input')

  loadProducts()

  if (form) {
    form.addEventListener('submit', handleFormSubmit)
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resetForm()
    })
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', () => {
      resetForm()
    })
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const term = searchInput.value.trim().toLowerCase()
      const filtered = products.filter(p => {
        const name = (p.name || '').toLowerCase()
        const category = (p.category || '').toLowerCase()
        return name.includes(term) || category.includes(term)
      })
      renderProductsTable(filtered)
    })
  }
})

async function loadProducts() {
  try {
    const res = await fetch(API_BASE_URL)
    if (!res.ok) {
      console.error('Failed to load products', res.status)
      return
    }
    const data = await res.json()
    products = Array.isArray(data) ? data : []
    renderProductsTable(products)
  } catch (err) {
    console.error('Error loading products', err)
  }
}

function renderProductsTable(list) {
  const tbody = document.getElementById('products-table-body')
  if (!tbody) return

  tbody.innerHTML = ''

  if (!list || list.length === 0) {
    const tr = document.createElement('tr')
    const td = document.createElement('td')
    td.colSpan = 8
    td.textContent = 'No products found'
    td.style.color = '#9ca3af'
    tr.appendChild(td)
    tbody.appendChild(tr)
    return
  }

  list.forEach(product => {
    const tr = document.createElement('tr')
    tr.dataset.productId = product.id

    // ID
    const idTd = document.createElement('td')
    idTd.textContent = product.id
    tr.appendChild(idTd)

    // Image
    const imgTd = document.createElement('td')
    if (product.image_url || product.imageUrl) {
      const img = document.createElement('img')
      img.src = product.image_url || product.imageUrl
      img.alt = product.name || 'Product image'
      img.style.width = '36px'
      img.style.height = '36px'
      img.style.objectFit = 'cover'
      img.style.borderRadius = '999px'
      imgTd.appendChild(img)
    } else {
      imgTd.textContent = '—'
    }
    tr.appendChild(imgTd)

    // Name
    const nameTd = document.createElement('td')
    nameTd.textContent = product.name || ''
    tr.appendChild(nameTd)

    // Price
    const priceTd = document.createElement('td')
    const price = typeof product.price === 'number'
      ? product.price.toFixed(2)
      : product.price
    priceTd.textContent = price != null ? `€${price}` : ''
    tr.appendChild(priceTd)

    // Stock
    const stockTd = document.createElement('td')
    stockTd.textContent = product.stock != null ? product.stock : ''
    tr.appendChild(stockTd)

    // Category
    const categoryTd = document.createElement('td')
    categoryTd.textContent = product.category || ''
    tr.appendChild(categoryTd)

    // Featured
    const featuredTd = document.createElement('td')
    const isFeatured = product.is_featured === 1 || product.isFeatured === true
    if (isFeatured) {
      const pill = document.createElement('span')
      pill.className = 'status-pill status-pill-yellow-soft'
      pill.textContent = 'Featured'
      featuredTd.appendChild(pill)
    } else {
      featuredTd.textContent = ''
    }
    tr.appendChild(featuredTd)

    // Actions
    const actionsTd = document.createElement('td')
    actionsTd.style.whiteSpace = 'nowrap'

    const editBtn = document.createElement('button')
    editBtn.type = 'button'
    editBtn.textContent = 'Edit'
    editBtn.className = 'chip-toggle small'
    editBtn.style.marginRight = '4px'
    editBtn.addEventListener('click', () => handleEditClick(product.id))

    const deleteBtn = document.createElement('button')
    deleteBtn.type = 'button'
    deleteBtn.textContent = 'Delete'
    deleteBtn.className = 'chip-toggle small danger'
    deleteBtn.addEventListener('click', () => handleDeleteClick(product.id))

    actionsTd.appendChild(editBtn)
    actionsTd.appendChild(deleteBtn)

    tr.appendChild(actionsTd)

    tbody.appendChild(tr)
  })
}

function resetForm() {
  const form = document.getElementById('product-form')
  if (!form) return

  form.reset()
  const idInput = document.getElementById('product-id')
  if (idInput) {
    idInput.value = ''
  }

  currentEditId = null

  const title = document.getElementById('product-form-title')
  const subtitle = document.getElementById('product-form-subtitle')
  const saveBtn = document.getElementById('product-save-btn')
  const cancelEditBtn = document.getElementById('product-cancel-edit-btn')

  if (title) {
    title.textContent = 'Add product'
  }
  if (subtitle) {
    subtitle.textContent = 'Create new products or edit existing ones'
  }
  if (saveBtn) {
    saveBtn.textContent = 'Save product'
  }
  if (cancelEditBtn) {
    cancelEditBtn.style.display = 'none'
  }
}

function fillFormForEdit(product) {
  const idInput = document.getElementById('product-id')
  const nameInput = document.getElementById('product-name')
  const categoryInput = document.getElementById('product-category')
  const priceInput = document.getElementById('product-price')
  const stockInput = document.getElementById('product-stock')
  const discountInput = document.getElementById('product-discount')
  const imageUrlInput = document.getElementById('product-image-url')
  const descriptionInput = document.getElementById('product-description')
  const featuredInput = document.getElementById('product-featured')

  if (idInput) idInput.value = product.id
  if (nameInput) nameInput.value = product.name || ''
  if (categoryInput) categoryInput.value = product.category || ''
  if (priceInput) priceInput.value = product.price != null ? product.price : ''
  if (stockInput) stockInput.value = product.stock != null ? product.stock : ''
  if (discountInput) discountInput.value = product.discount != null ? product.discount : ''
  if (imageUrlInput) imageUrlInput.value = product.image_url || product.imageUrl || ''
  if (descriptionInput) descriptionInput.value = product.description || ''
  if (featuredInput) {
    const isFeatured = product.is_featured === 1 || product.isFeatured === true
    featuredInput.checked = isFeatured
  }

  const title = document.getElementById('product-form-title')
  const subtitle = document.getElementById('product-form-subtitle')
  const saveBtn = document.getElementById('product-save-btn')
  const cancelEditBtn = document.getElementById('product-cancel-edit-btn')

  if (title) {
    title.textContent = `Edit product #${product.id}`
  }
  if (subtitle) {
    subtitle.textContent = 'Update product details and save changes'
  }
  if (saveBtn) {
    saveBtn.textContent = 'Update product'
  }
  if (cancelEditBtn) {
    cancelEditBtn.style.display = 'inline-flex'
  }
}

function handleEditClick(productId) {
  const product = products.find(p => p.id === productId)
  if (!product) return

  currentEditId = productId
  fillFormForEdit(product)
}

async function handleDeleteClick(productId) {
  const confirmDelete = window.confirm('Delete this product from the catalog?')
  if (!confirmDelete) return

  try {
    const res = await fetch(`${API_BASE_URL}/${productId}`, {
      method: 'DELETE'
    })
    if (!res.ok) {
      alert('Failed to delete product')
      return
    }

    products = products.filter(p => p.id !== productId)
    renderProductsTable(products)

    if (currentEditId === productId) {
      resetForm()
    }
  } catch (err) {
    console.error('Error deleting product', err)
    alert('Error deleting product')
  }
}

async function handleFormSubmit(event) {
  event.preventDefault()

  const idInput = document.getElementById('product-id')
  const nameInput = document.getElementById('product-name')
  const categoryInput = document.getElementById('product-category')
  const priceInput = document.getElementById('product-price')
  const stockInput = document.getElementById('product-stock')
  const discountInput = document.getElementById('product-discount')
  const imageUrlInput = document.getElementById('product-image-url')
  const descriptionInput = document.getElementById('product-description')
  const featuredInput = document.getElementById('product-featured')

  const idValue = idInput && idInput.value ? parseInt(idInput.value, 10) : null

  const payload = {
    name: nameInput ? nameInput.value.trim() : '',
    category: categoryInput ? categoryInput.value.trim() : '',
    price: priceInput && priceInput.value !== '' ? parseFloat(priceInput.value) : 0,
    stock: stockInput && stockInput.value !== '' ? parseInt(stockInput.value, 10) : 0,
    discount: discountInput && discountInput.value !== '' ? parseInt(discountInput.value, 10) : 0,
    image_url: imageUrlInput ? imageUrlInput.value.trim() : '',
    description: descriptionInput ? descriptionInput.value.trim() : '',
    is_featured: featuredInput && featuredInput.checked ? 1 : 0
  }

  if (!payload.name) {
    alert('Please enter a product name')
    return
  }

  let url = API_BASE_URL
  let method = 'POST'

  if (idValue) {
    url = `${API_BASE_URL}/${idValue}`
    method = 'PUT'
  }

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      alert('Failed to save product')
      return
    }

    const savedProduct = await res.json()

    if (idValue) {
      const index = products.findIndex(p => p.id === idValue)
      if (index !== -1) {
        products[index] = savedProduct
      }
    } else {
      products.push(savedProduct)
    }

    renderProductsTable(products)
    resetForm()
  } catch (err) {
    console.error('Error saving product', err)
    alert('Error saving product')
  }
}
