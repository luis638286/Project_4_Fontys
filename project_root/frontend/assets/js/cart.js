;(function (global) {
  const CART_KEY = 'freshmart_cart'

  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch (err) {
      console.warn('Unable to read cart', err)
      return []
    }
  }

  function saveCart(items) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items))
    } catch (err) {
      console.warn('Unable to save cart', err)
    }
  }

  function addItem(product, quantity) {
    if (!product || !product.id) return
    const qty = Math.max(1, parseInt(quantity, 10) || 1)
    const cart = loadCart()
    const existing = cart.find((item) => item.product_id === product.id)

    if (existing) {
      existing.quantity += qty
    } else {
      cart.push({
        product_id: product.id,
        name: product.name,
        price: Number(product.price) || 0,
        quantity: qty,
        image_url: product.image_url,
        category: product.category,
      })
    }

    saveCart(cart)
    return cart
  }

  function updateQuantity(productId, quantity) {
    const cart = loadCart()
    const item = cart.find((c) => c.product_id === productId)
    if (!item) return cart
    const qty = Math.max(1, parseInt(quantity, 10) || 1)
    item.quantity = qty
    saveCart(cart)
    return cart
  }

  function removeItem(productId) {
    const cart = loadCart().filter((c) => c.product_id !== productId)
    saveCart(cart)
    return cart
  }

  function clearCart() {
    saveCart([])
  }

  function totals(items) {
    const list = items || loadCart()
    const subtotal = list.reduce((sum, item) => sum + item.price * item.quantity, 0)
    return {
      count: list.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      total: subtotal,
    }
  }

  global.cartStore = {
    loadCart,
    saveCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    totals,
  }
})(window)
