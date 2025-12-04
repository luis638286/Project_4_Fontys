const CUSTOMERS = [
  {
    id: 'C-1001',
    name: 'Sarah Lee',
    email: 'sarah.lee@example.com',
    phone: '+1 555-201-8842',
    address: '221B Greenway Rd, Portland',
    segment: 'Platinum',
    status: 'active',
    orders: 18,
    totalSpend: 1284.75,
    lastOrder: 'Today, 09:21',
    note: 'Prefers organic produce and weekly delivery windows.'
  },
  {
    id: 'C-1002',
    name: 'Daniel Carter',
    email: 'dan.carter@example.com',
    phone: '+1 555-442-1172',
    address: '88 River Ave, Austin',
    segment: 'Gold',
    status: 'active',
    orders: 12,
    totalSpend: 864.1,
    lastOrder: 'Today, 08:47',
    note: 'Usually shops bakery and dairy bundles.'
  },
  {
    id: 'C-1003',
    name: 'Aisha Malik',
    email: 'aisha.malik@example.com',
    phone: '+1 555-662-9011',
    address: '14 Market St, Seattle',
    segment: 'Gold',
    status: 'at_risk',
    orders: 9,
    totalSpend: 732.5,
    lastOrder: '9 days ago',
    note: 'Send reactivation offer for pantry essentials.'
  },
  {
    id: 'C-1004',
    name: 'Lucas Romero',
    email: 'lucas.romero@example.com',
    phone: '+1 555-998-2211',
    address: '310 Lakeview Blvd, Denver',
    segment: 'Silver',
    status: 'active',
    orders: 6,
    totalSpend: 402.35,
    lastOrder: 'Yesterday',
    note: 'Loves seasonal vegetables; keep notified about fresh stock.'
  },
  {
    id: 'C-1005',
    name: 'Emma Wilson',
    email: 'emma.wilson@example.com',
    phone: '+1 555-144-3344',
    address: '74 Sunset Dr, Phoenix',
    segment: 'Platinum',
    status: 'active',
    orders: 24,
    totalSpend: 1882.6,
    lastOrder: 'Today, 07:12',
    note: 'High-value customer; prioritize delivery time windows.'
  },
  {
    id: 'C-1006',
    name: 'Omar Ali',
    email: 'omar.ali@example.com',
    phone: '+1 555-773-4421',
    address: '12 Oak St, Chicago',
    segment: 'Silver',
    status: 'active',
    orders: 7,
    totalSpend: 518.8,
    lastOrder: 'Today, 06:58',
    note: 'Enjoys snacks and drinks bundles.'
  },
  {
    id: 'C-1007',
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    phone: '+1 555-882-7761',
    address: '44 Skyline Rd, San Diego',
    segment: 'New',
    status: 'inactive',
    orders: 1,
    totalSpend: 46.9,
    lastOrder: '62 days ago',
    note: 'Signed up via promo; send win-back coupon.'
  },
  {
    id: 'C-1008',
    name: 'Grace Chen',
    email: 'grace.chen@example.com',
    phone: '+1 555-118-9901',
    address: '9 Garden Way, New York',
    segment: 'Gold',
    status: 'at_risk',
    orders: 10,
    totalSpend: 704.25,
    lastOrder: '33 days ago',
    note: 'Add to newsletter about new Asian grocery arrivals.'
  }
]

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
  detailCard: document.getElementById('customer-detail-card'),
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
  addButton: document.getElementById('add-customer')
}

let selectedCustomer = null

document.addEventListener('DOMContentLoaded', () => {
  renderKPIs(CUSTOMERS)
  renderTable(CUSTOMERS)
  attachFilters()
  attachActions()
})

function renderKPIs(customers) {
  const total = customers.length
  const loyalty = customers.filter(c => c.segment === 'Platinum' || c.segment === 'Gold').length
  const atRisk = customers.filter(c => c.status === 'at_risk').length
  const avgOrderValue = (customers.reduce((sum, c) => sum + c.totalSpend, 0) / Math.max(customers.reduce((sum, c) => sum + c.orders, 0), 1)).toFixed(2)

  elements.kpiTotal.textContent = total
  elements.kpiNew.textContent = '+3 today'
  elements.kpiLoyalty.textContent = `${loyalty}`
  elements.kpiLoyaltyChange.textContent = `+${Math.max(1, loyalty - 3)}`
  elements.kpiAov.textContent = `$${avgOrderValue}`
  elements.kpiAovNote.textContent = 'Across last 30 days'
  elements.kpiAtRisk.textContent = atRisk
}

function renderTable(customers) {
  elements.tableBody.innerHTML = ''
  customers.forEach((customer, index) => {
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

    elements.tableBody.appendChild(row)
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

function attachFilters() {
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

  const filtered = CUSTOMERS.filter(customer => {
    const matchesSearch =
      customer.name.toLowerCase().includes(term) ||
      customer.email.toLowerCase().includes(term) ||
      customer.phone.toLowerCase().includes(term)

    const matchesSegment = segment === 'all' || customer.segment === segment
    const matchesStatus = status === 'all' || customer.status === status
    const matchesOrders = customer.orders >= minOrders

    return matchesSearch && matchesSegment && matchesStatus && matchesOrders
  })

  renderTable(filtered)
  renderKPIs(filtered)
}

function setDetail(customer) {
  elements.detailName.textContent = `${customer.name} (${customer.id})`
  elements.detailEmail.textContent = customer.email
  elements.detailPhone.textContent = customer.phone
  elements.detailAddress.textContent = customer.address
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

function attachActions() {
  elements.exportButton?.addEventListener('click', () => {
    const csvHeader = 'id,name,email,segment,status,orders,total_spend,last_order\n'
    const csvRows = CUSTOMERS.map(c => (
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
      note: 'Newly added record. Update details later.'
    }

    CUSTOMERS.unshift(quickCustomer)
    applyFilters()
  })
}
