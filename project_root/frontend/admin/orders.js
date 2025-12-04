let orders = []
let selectedOrder = null

const elements = {
  tableBody: document.getElementById('orders-table-body'),
  subtitle: document.getElementById('orders-subtitle'),
  search: document.getElementById('orders-search-input'),
  error: document.getElementById('orders-error'),
  detailsSubtitle: document.getElementById('details-subtitle'),
  detailsId: document.getElementById('details-id'),
  detailsCustomer: document.getElementById('details-customer'),
  detailsTime: document.getElementById('details-time'),
  detailsTotal: document.getElementById('details-total'),
  detailsAddress: document.getElementById('details-address'),
  detailsItems: document.getElementById('details-items'),
}

document.addEventListener('DOMContentLoaded', async () => {
  bindSearch()
  await loadOrders()
})

async function loadOrders() {
  try {
    setError('')
    const response = await apiClient.listOrders()
    orders = Array.isArray(response) ? response : []
    renderTable(orders)
    if (orders.length) {
      selectOrder(orders[0].id)
      updateSubtitle(`${orders.length} order${orders.length === 1 ? '' : 's'} loaded`)
    } else {
      updateSubtitle('No orders yet')
      clearDetails()
    }
  } catch (err) {
    renderTable([])
    clearDetails()
    updateSubtitle('Unable to load orders')
    setError(err.message || 'Unable to load orders from the server')
  }
}

function bindSearch() {
  if (!elements.search) return
  elements.search.addEventListener('input', () => {
    const term = elements.search.value.toLowerCase()
    const filtered = orders.filter((order) => {
      return (
        `${order.id}`.toLowerCase().includes(term) ||
        (order.full_name || '').toLowerCase().includes(term) ||
        (order.email || '').toLowerCase().includes(term)
      )
    })
    renderTable(filtered)
    if (filtered.length) {
      selectOrder(filtered[0].id)
      updateSubtitle(`${filtered.length} matching order${filtered.length === 1 ? '' : 's'}`)
    } else {
      clearDetails()
      updateSubtitle('No matching orders')
    }
  })
}

function renderTable(list) {
  if (!elements.tableBody) return
  elements.tableBody.innerHTML = ''

  if (!list.length) {
    const tr = document.createElement('tr')
    const td = document.createElement('td')
    td.colSpan = 6
    td.textContent = 'No orders found'
    td.style.color = '#9ca3af'
    tr.appendChild(td)
    elements.tableBody.appendChild(tr)
    return
  }

  list.forEach((order, index) => {
    const row = document.createElement('tr')
    row.classList.add('order-row')
    row.dataset.orderId = order.id
    if (index === 0) {
      row.classList.add('order-row-active')
    }

    row.innerHTML = `
      <td>#${order.id}</td>
      <td>${order.full_name || '—'}</td>
      <td>${order.email || '—'}</td>
      <td>${order.items?.length || 0}</td>
      <td>${formatCurrency(order.total)}</td>
      <td>${formatDate(order.created_at)}</td>
    `

    row.addEventListener('click', () => selectOrder(order.id))
    elements.tableBody.appendChild(row)
  })
}

function selectOrder(orderId) {
  selectedOrder = orders.find((o) => o.id === orderId) || null

  document.querySelectorAll('.orders-table tbody tr').forEach((r) => r.classList.remove('order-row-active'))
  const activeRow = document.querySelector(`.orders-table tbody tr[data-order-id="${orderId}"]`)
  activeRow?.classList.add('order-row-active')

  setDetails(selectedOrder)
}

function setDetails(order) {
  if (!order) return clearDetails()

  if (elements.detailsSubtitle)
    elements.detailsSubtitle.textContent = `Order #${order.id} · ${order.full_name || 'Customer'}`
  if (elements.detailsId) elements.detailsId.textContent = `#${order.id}`
  if (elements.detailsCustomer) elements.detailsCustomer.textContent = order.full_name || '—'
  if (elements.detailsTime) elements.detailsTime.textContent = formatDate(order.created_at)
  if (elements.detailsTotal) elements.detailsTotal.textContent = formatCurrency(order.total)
  if (elements.detailsAddress)
    elements.detailsAddress.textContent = `${order.address || '—'}${order.city ? ', ' + order.city : ''}`.trim()

  if (elements.detailsItems) {
    elements.detailsItems.innerHTML = ''
    if (!order.items || !order.items.length) {
      const li = document.createElement('li')
      li.className = 'details-item-row'
      li.textContent = 'No items recorded for this order.'
      elements.detailsItems.appendChild(li)
    } else {
      order.items.forEach((item) => {
        const li = document.createElement('li')
        li.className = 'details-item-row'
        li.innerHTML = `
          <div>
            <span class="item-name">${item.product_name}</span>
            <span class="item-meta">${item.quantity} × ${formatCurrency(item.price)}</span>
          </div>
          <span class="item-total">${formatCurrency(item.line_total)}</span>
        `
        elements.detailsItems.appendChild(li)
      })
    }
  }
}

function clearDetails() {
  if (elements.detailsSubtitle) elements.detailsSubtitle.textContent = 'Select an order to view details'
  if (elements.detailsId) elements.detailsId.textContent = '—'
  if (elements.detailsCustomer) elements.detailsCustomer.textContent = '—'
  if (elements.detailsTime) elements.detailsTime.textContent = '—'
  if (elements.detailsTotal) elements.detailsTotal.textContent = '—'
  if (elements.detailsAddress) elements.detailsAddress.textContent = '—'
  if (elements.detailsItems) elements.detailsItems.innerHTML = ''
}

function updateSubtitle(message) {
  if (elements.subtitle) elements.subtitle.textContent = message
}

function setError(message) {
  if (!elements.error) return
  elements.error.textContent = message
  elements.error.style.display = message ? 'block' : 'none'
}

function formatCurrency(value) {
  const amount = Number(value) || 0
  return `€${amount.toFixed(2)}`
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return isNaN(date.getTime()) ? '—' : date.toLocaleString()
}
