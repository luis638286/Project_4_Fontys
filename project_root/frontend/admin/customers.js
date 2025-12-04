let customers = []
let filtered = []
let selectedCustomer = null

const elements = {
  tableBody: document.getElementById('customers-table-body'),
  search: document.getElementById('customer-search-input'),
  segment: document.getElementById('customer-segment'),
  status: document.getElementById('customer-status'),
  minOrders: document.getElementById('customer-min-orders'),
  reset: document.getElementById('customer-reset'),
  quickFilters: document.querySelectorAll('.chip-toggle[data-quick]'),
  kpiTotal: document.getElementById('kpi-total-customers'),
  kpiNew: document.getElementById('kpi-new-customers'),
  kpiLoyalty: document.getElementById('kpi-loyalty'),
  kpiLoyaltyChange: document.getElementById('kpi-loyalty-change'),
  kpiAov: document.getElementById('kpi-aov'),
  kpiAovNote: document.getElementById('kpi-aov-note'),
  kpiAtRisk: document.getElementById('kpi-at-risk'),
  detailName: document.getElementById('customer-detail-name'),
  detailEmail: document.getElementById('customer-detail-email'),
  detailPhone: document.getElementById('customer-detail-phone'),
  detailAddress: document.getElementById('customer-detail-address'),
  detailSegment: document.getElementById('customer-detail-segment'),
  detailOrders: document.getElementById('customer-detail-orders'),
  detailSpend: document.getElementById('customer-detail-spend'),
  detailLastOrder: document.getElementById('customer-detail-last-order'),
  detailNote: document.getElementById('customer-detail-note'),
  emailButton: document.getElementById('email-customer'),
  viewOrdersButton: document.getElementById('view-orders'),
  exportButton: document.getElementById('export-customers'),
  addButton: document.getElementById('add-customer'),
  tableWrapper: document.querySelector('.orders-table'),
  errorBox: document.getElementById('customers-error')
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadCustomers()
  bindFilters()
  bindActions()
})

async function loadCustomers() {
  try {
    const users = await apiClient.listUsers('customer')
    customers = (users || []).map(enrichCustomer)
    filtered = [...customers]
    renderKPIs(filtered)
    renderTable(filtered)
  } catch (err) {
    console.error('Failed to load customers', err)
    showError(err.message || 'Unable to load customers right now')
    renderTable([])
  }
}

function enrichCustomer(user) {
  const createdAt = user.created_at ? new Date(user.created_at) : new Date()
  const daysAgo = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

  const segment = daysAgo < 7 ? 'New' : 'Active'
  const status = 'active'

  return {
    id: `U-${user.id}`,
    name: `${user.first_name} ${user.last_name}`.trim(),
    email: user.email,
    segment,
    status,
    orders: 0,
    totalSpend: 0,
    lastOrder: createdAt.toLocaleDateString(),
    createdAt,
    note: 'Registered customer from signup form.',
    phone: user.phone || 'N/A',
    address: user.address || '—'
  }
}

function renderTable(list) {
  const tbody = elements.tableBody
  if (!tbody) return

  tbody.innerHTML = ''

  if (!list.length) {
    const tr = document.createElement('tr')
    const td = document.createElement('td')
    td.colSpan = 7
    td.textContent = 'No customers yet. Ask shoppers to sign up from the store.'
    td.style.color = '#9ca3af'
    tr.appendChild(td)
    tbody.appendChild(tr)
    clearDetail()
    return
  }

  list.forEach((customer, index) => {
    const row = document.createElement('tr')
    row.classList.add('order-row')
    row.dataset.customerId = customer.id

    if (index === 0) {
      row.classList.add('order-row-active')
      selectedCustomer = customer
      setDetail(customer)
    }

    row.innerHTML = `
      <td>${customer.name}</td>
      <td>${customer.email}</td>
      <td><span class="status-pill status-pill-blue-soft">${customer.segment}</span></td>
      <td>${customer.orders}</td>
      <td>$${customer.totalSpend.toFixed(2)}</td>
      <td>${buildStatusPill(customer.status)}</td>
      <td>${customer.lastOrder}</td>
    `

    row.addEventListener('click', () => {
      document.querySelectorAll('.orders-table tbody tr').forEach(r => r.classList.remove('order-row-active'))
      row.classList.add('order-row-active')
      selectedCustomer = customer
      setDetail(customer)
    })

    tbody.appendChild(row)
  })
}

function buildStatusPill(status) {
  switch (status) {
    case 'active':
      return '<span class="status-pill status-pill-green">Active</span>'
    case 'at_risk':
      return '<span class="status-pill status-pill-yellow">At risk</span>'
    case 'inactive':
    default:
      return '<span class="status-pill status-pill-gray">Inactive</span>'
  }
}

function bindFilters() {
  elements.search?.addEventListener('input', applyFilters)
  elements.segment?.addEventListener('change', applyFilters)
  elements.status?.addEventListener('change', applyFilters)
  elements.minOrders?.addEventListener('input', applyFilters)

  elements.reset?.addEventListener('click', () => {
    elements.search.value = ''
    elements.segment.value = 'all'
    elements.status.value = 'all'
    elements.minOrders.value = 0
    elements.quickFilters.forEach(btn => btn.classList.toggle('chip-active', btn.dataset.quick === 'all'))
    applyFilters()
  })

  elements.quickFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.quickFilters.forEach(b => b.classList.remove('chip-active'))
      btn.classList.add('chip-active')
      applyFilters()
    })
  })
}

function applyFilters() {
  const term = elements.search.value.toLowerCase()
  const segment = elements.segment.value
  const status = elements.status.value
  const minOrders = Number(elements.minOrders.value || 0)
  const quickFilter = Array.from(elements.quickFilters || []).find(btn => btn.classList.contains('chip-active'))?.dataset.quick || 'all'

  filtered = customers.filter(customer => {
    const matchesSearch =
      customer.name.toLowerCase().includes(term) ||
      customer.email.toLowerCase().includes(term)

    const matchesSegment = segment === 'all' || customer.segment.toLowerCase() === segment
    const matchesStatus = status === 'all' || customer.status === status
    const matchesOrders = customer.orders >= minOrders
    const matchesQuick =
      quickFilter === 'all' ||
      (customer.createdAt && (Date.now() - customer.createdAt.getTime()) / (1000 * 60 * 60 * 24) <= Number(quickFilter))

    return matchesSearch && matchesSegment && matchesStatus && matchesOrders && matchesQuick
  })

  renderTable(filtered)
  renderKPIs(filtered)
}

function renderKPIs(list) {
  const total = list.length
  const loyalty = list.filter(c => c.segment === 'Active').length
  const atRisk = list.filter(c => c.status === 'at_risk').length
  const avgOrderValue = (list.reduce((sum, c) => sum + c.totalSpend, 0) / Math.max(list.length, 1)).toFixed(2)

  elements.kpiTotal.textContent = total
  elements.kpiNew.textContent = `+${Math.max(0, total)} signups`
  elements.kpiLoyalty.textContent = `${loyalty}`
  elements.kpiLoyaltyChange.textContent = `+${loyalty}`
  elements.kpiAov.textContent = `$${avgOrderValue}`
  elements.kpiAovNote.textContent = 'Across all customers'
  elements.kpiAtRisk.textContent = atRisk
}

function setDetail(customer) {
  elements.detailName.textContent = `${customer.name} (${customer.id})`
  elements.detailEmail.textContent = customer.email
  elements.detailPhone.textContent = customer.phone || 'N/A'
  elements.detailAddress.textContent = customer.address || '—'
  elements.detailSegment.textContent = customer.segment
  elements.detailSegment.className = `customer-detail-pill segment-${customer.segment.toLowerCase()}`
  elements.detailOrders.textContent = `${customer.orders} orders`
  elements.detailSpend.textContent = `$${customer.totalSpend.toFixed(2)}`
  elements.detailLastOrder.textContent = customer.lastOrder
  elements.detailNote.textContent = customer.note

  if (elements.emailButton) {
    elements.emailButton.onclick = () => window.location.href = `mailto:${customer.email}`
  }

  if (elements.viewOrdersButton) {
    elements.viewOrdersButton.onclick = () => window.location.href = 'admin-orders.html'
  }
}

function clearDetail() {
  selectedCustomer = null
  elements.detailName.textContent = '—'
  elements.detailEmail.textContent = '—'
  elements.detailPhone.textContent = '—'
  elements.detailAddress.textContent = '—'
  elements.detailSegment.textContent = '—'
  elements.detailOrders.textContent = '—'
  elements.detailSpend.textContent = '—'
  elements.detailLastOrder.textContent = '—'
  elements.detailNote.textContent = 'Select a customer to see notes.'
}

function bindActions() {
  elements.exportButton?.addEventListener('click', () => {
    if (!filtered.length) return

    const csvHeader = 'id,name,email,segment,status,orders,total_spend,last_order\n'
    const csvRows = filtered.map(c => (
      [c.id, c.name, c.email, c.segment, c.status, c.orders, c.totalSpend, c.lastOrder]
        .map(value => `"${String(value).replace(/"/g, '""')}"`)
        .join(',')
    ))
    const csv = csvHeader + csvRows.join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'freshmart-customers.csv'
    link.click()
    URL.revokeObjectURL(url)
  })

  elements.addButton?.addEventListener('click', () => {
    const name = prompt('Enter customer name to quick-add to the list:')
    if (!name) return

    const quickCustomer = {
      id: `C-NEW-${Date.now()}`,
      name,
      email: 'pending@example.com',
      phone: 'N/A',
      address: 'Pending address',
      segment: 'New',
      status: 'active',
      orders: 0,
      totalSpend: 0,
      lastOrder: 'Not yet',
      note: 'Newly added record. Update details later.',
      createdAt: new Date()
    }

    customers.unshift(quickCustomer)
    applyFilters()
  })
}

function showError(message) {
  if (!elements.errorBox) return
  elements.errorBox.textContent = message
  elements.errorBox.style.display = 'block'
}
