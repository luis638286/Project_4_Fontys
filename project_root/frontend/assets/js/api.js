(function (global) {
  const base = (global.APP_CONFIG && global.APP_CONFIG.apiBaseUrl) || ''

  async function handleResponse(res) {
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const error = data.error || 'Request failed'
      throw new Error(error)
    }
    return data
  }

  async function listProducts() {
    const res = await fetch(`${base}/products/`)
    return handleResponse(res)
  }

  async function getProduct(id) {
    const res = await fetch(`${base}/products/${id}`)
    return handleResponse(res)
  }

  async function createProduct(body) {
    const res = await fetch(`${base}/products/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return handleResponse(res)
  }

  async function updateProduct(id, body) {
    const res = await fetch(`${base}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return handleResponse(res)
  }

  async function deleteProduct(id) {
    const res = await fetch(`${base}/products/${id}`, { method: 'DELETE' })
    return handleResponse(res)
  }

  async function listOrders(userId) {
    const url = new URL(`${base}/orders/`)
    if (userId) {
      url.searchParams.set('user_id', userId)
    }
    const res = await fetch(url)
    return handleResponse(res)
  }

  async function getOrder(id) {
    const res = await fetch(`${base}/orders/${id}`)
    return handleResponse(res)
  }

  async function createOrder(body) {
    const res = await fetch(`${base}/orders/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return handleResponse(res)
  }

  async function register(body) {
    const res = await fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return handleResponse(res)
  }

  async function login(body) {
    const res = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return handleResponse(res)
  }

  async function listUsers(role) {
    const url = new URL(`${base}/auth/users`)
    if (role) {
      url.searchParams.set('role', role)
    }
    const res = await fetch(url)
    return handleResponse(res)
  }

  global.apiClient = {
    listProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    register,
    login,
    listUsers,
    listOrders,
    getOrder,
    createOrder,
  }
})(window)
