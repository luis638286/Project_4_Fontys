// Admin dashboard data loader using public APIs

document.addEventListener('DOMContentLoaded', () => {
  hydrateDatePill()
  hydrateDashboard()
})

function hydrateDatePill() {
  const datePill = document.getElementById('topbar-date-text')
  if (!datePill) return

  const now = new Date()
  const formatted = now.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  datePill.textContent = formatted
}

async function hydrateDashboard() {
  if (!window.apiClient) return

  try {
    const [products, orders, customers] = await Promise.all([
      apiClient.listProducts(),
      apiClient.listOrders(),
      apiClient.listUsers('customer'),
    ])

    updateKpis({ products, orders, customers })
    renderWeeklySalesChart(orders)
    renderLiveOrderStats(orders)
    renderRecentOrders(orders)
    renderPopularCategories(orders, products)
  } catch (error) {
    console.error('Failed to hydrate dashboard', error)
  }
}

function updateKpis({ products, orders, customers }) {
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)
  const averageOrder = orders.length ? totalRevenue / orders.length : 0
  const ordersToday = orders.filter(isPlacedToday).length
  const lowStock = products.filter(product => Number(product.stock || 0) <= 5).length
  const newCustomers = customers.filter(isCreatedLast24Hours).length

  setText('kpi-total-revenue', formatCurrency(totalRevenue))
  setText('kpi-average-order', averageOrder ? `Avg ${formatCurrency(averageOrder)}` : 'No orders yet')
  setText('kpi-total-orders', orders.length.toString())
  setText('kpi-orders-today', `${ordersToday} today`)
  setText('kpi-new-customers', newCustomers.toString())
  setText('kpi-new-customers-note', 'Joined in last 24h')
  setText('kpi-low-stock', lowStock.toString())
  setText('kpi-low-stock-note', lowStock ? 'Review inventory' : 'All healthy')
}

function renderWeeklySalesChart(orders) {
  const container = document.getElementById('chart-bars')
  if (!container) return

  const today = new Date()
  const totalsByDay = new Map()
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(today)
    day.setDate(today.getDate() - i)
    const key = day.toISOString().split('T')[0]
    totalsByDay.set(key, 0)
  }

  orders.forEach(order => {
    const created = new Date(order.created_at)
    const key = created.toISOString().split('T')[0]
    if (totalsByDay.has(key)) {
      totalsByDay.set(key, totalsByDay.get(key) + (order.total || 0))
    }
  })

  const maxTotal = Math.max(...totalsByDay.values(), 1)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  container.innerHTML = ''
  Array.from(totalsByDay.entries()).forEach(([dateKey, total]) => {
    const dateObj = new Date(dateKey)
    const heightPercent = Math.round((total / maxTotal) * 100)
    const bar = document.createElement('div')
    bar.className = 'chart-bar'

    const fill = document.createElement('div')
    fill.className = 'chart-bar-fill'
    fill.style.height = `${heightPercent}%`

    const tooltip = document.createElement('span')
    tooltip.className = 'chart-bar-tooltip'
    tooltip.textContent = formatCurrency(total)
    fill.appendChild(tooltip)

    const label = document.createElement('span')
    label.className = 'chart-bar-label'
    label.textContent = dayNames[dateObj.getDay()]

    bar.appendChild(fill)
    bar.appendChild(label)
    container.appendChild(bar)
  })
}

function renderLiveOrderStats(orders) {
  const list = document.getElementById('live-order-stats')
  if (!list) return

  const ordersToday = orders.filter(isPlacedToday).length
  const ordersWeek = orders.filter(isCreatedLast7Days).length
  const averageOrder = orders.length
    ? formatCurrency(
        orders.reduce((sum, order) => sum + (order.total || 0), 0) / orders.length,
      )
    : '$0.00'

  const stats = [
    {
      label: 'Orders today',
      value: ordersToday,
      className: 'status-dot-green',
    },
    {
      label: 'Orders last 7 days',
      value: ordersWeek,
      className: 'status-dot-blue',
    },
    {
      label: 'Average order value',
      value: averageOrder,
      className: 'status-dot-yellow',
    },
  ]

  list.innerHTML = ''
  stats.forEach(stat => {
    const li = document.createElement('li')
    li.className = 'status-item'

    const lead = document.createElement('div')
    lead.className = 'status-item-lead'

    const dot = document.createElement('span')
    dot.className = `status-dot small ${stat.className}`

    const label = document.createElement('span')
    label.className = 'status-label'
    label.textContent = stat.label

    const metric = document.createElement('div')
    metric.className = 'status-metric'
    metric.textContent = stat.value

    lead.appendChild(dot)
    lead.appendChild(label)
    li.appendChild(lead)
    li.appendChild(metric)
    list.appendChild(li)
  })
}

function renderRecentOrders(orders) {
  const tbody = document.getElementById('recent-orders-body')
  if (!tbody) return

  tbody.innerHTML = ''
  const recent = [...orders]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6)

  if (!recent.length) {
    const row = document.createElement('tr')
    const cell = document.createElement('td')
    cell.colSpan = 6
    cell.style.textAlign = 'center'
    cell.style.color = '#9ca3af'
    cell.textContent = 'No orders yet'
    row.appendChild(cell)
    tbody.appendChild(row)
    return
  }

  recent.forEach(order => {
    const row = document.createElement('tr')

    const idCell = document.createElement('td')
    idCell.textContent = `#${order.id}`

    const customerCell = document.createElement('td')
    customerCell.textContent = order.full_name || order.email

    const itemsCell = document.createElement('td')
    itemsCell.textContent = (order.items || [])
      .map(item => `${item.product_name} ×${item.quantity}`)
      .join(', ')

    const totalCell = document.createElement('td')
    totalCell.textContent = formatCurrency(order.total || 0)

    const statusCell = document.createElement('td')
    const status = document.createElement('span')
    status.className = 'status-pill status-pill-blue'
    status.textContent = isPlacedToday(order) ? 'New' : 'Processing'
    statusCell.appendChild(status)

    const placedCell = document.createElement('td')
    placedCell.textContent = formatDateTime(order.created_at)

    row.append(idCell, customerCell, itemsCell, totalCell, statusCell, placedCell)
    tbody.appendChild(row)
  })
}

function renderPopularCategories(orders, products) {
  const list = document.getElementById('popular-categories')
  if (!list) return

  const productCategory = new Map(products.map(product => [product.id, product.category || 'Other']))
  const categoryTotals = new Map()

  orders.forEach(order => {
    ;(order.items || []).forEach(item => {
      const category = productCategory.get(item.product_id) || 'Other'
      const totals = categoryTotals.get(category) || { orders: 0, revenue: 0 }
      totals.orders += 1
      totals.revenue += (item.price || 0) * (item.quantity || 0)
      categoryTotals.set(category, totals)
    })
  })

  const sorted = Array.from(categoryTotals.entries())
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 4)

  list.innerHTML = ''

  if (!sorted.length) {
    const li = document.createElement('li')
    li.className = 'category-metric-item'
    li.style.color = '#9ca3af'
    li.textContent = 'No category data yet'
    list.appendChild(li)
    return
  }

  const dotClasses = ['category-dot-green', 'category-dot-yellow', 'category-dot-blue', 'category-dot-pink']

  sorted.forEach(([category, totals], index) => {
    const li = document.createElement('li')
    li.className = 'category-metric-item'

    const main = document.createElement('div')
    main.className = 'category-metric-main'

    const dot = document.createElement('span')
    dot.className = `category-dot ${dotClasses[index % dotClasses.length]}`

    const name = document.createElement('span')
    name.className = 'category-name'
    name.textContent = category

    const stats = document.createElement('div')
    stats.className = 'category-metric-stats'

    const ordersSpan = document.createElement('span')
    ordersSpan.className = 'category-orders'
    ordersSpan.textContent = `${totals.orders} orders`

    const revenueSpan = document.createElement('span')
    revenueSpan.className = 'category-revenue'
    revenueSpan.textContent = formatCurrency(totals.revenue)

    main.append(dot, name)
    stats.append(ordersSpan, revenueSpan)
    li.append(main, stats)
    list.appendChild(li)
  })
}

function setText(id, value) {
  const el = document.getElementById(id)
  if (el) {
    el.textContent = value
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

function formatDateTime(value) {
  const date = new Date(value)
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

function isPlacedToday(order) {
  const created = new Date(order.created_at)
  const now = new Date()
  return (
    created.getFullYear() === now.getFullYear() &&
    created.getMonth() === now.getMonth() &&
    created.getDate() === now.getDate()
  )
}

function isCreatedLast7Days(order) {
  const created = new Date(order.created_at)
  const now = new Date()
  const diffMs = now - created
  return diffMs >= 0 && diffMs <= 7 * 24 * 60 * 60 * 1000
}

function isCreatedLast24Hours(user) {
  const created = new Date(user.created_at)
  const now = new Date()
  const diffMs = now - created
  return diffMs >= 0 && diffMs <= 24 * 60 * 60 * 1000
}

