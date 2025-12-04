const STORAGE_KEY = 'freshmart_admin_settings'

const defaults = {
  storeName: 'FreshMart',
  supportEmail: 'support@freshmart.com',
  supportPhone: '+1 555-010-2030',
  storeHours: 'Mon - Sat, 8:00 - 20:00',
  storeAddress: '123 Market Street, City',
  apiBase: 'http://localhost:5000/api',
  cdnUrl: 'http://localhost:5000/static',
  supportPortal: 'https://docs.freshmart.local',
  storeOnline: true,
  maintenance: false,
  alerts: true
}

const fields = {
  storeName: document.getElementById('store-name'),
  supportEmail: document.getElementById('support-email'),
  supportPhone: document.getElementById('support-phone'),
  storeHours: document.getElementById('store-hours'),
  storeAddress: document.getElementById('store-address'),
  apiBase: document.getElementById('api-base'),
  cdnUrl: document.getElementById('cdn-url'),
  supportPortal: document.getElementById('support-portal'),
  storeOnline: document.getElementById('toggle-store-online'),
  maintenance: document.getElementById('toggle-maintenance'),
  alerts: document.getElementById('toggle-alerts')
}

const references = {
  storeName: document.getElementById('ref-store-name'),
  supportEmail: document.getElementById('ref-support-email'),
  apiBase: document.getElementById('ref-api-base'),
  cdnUrl: document.getElementById('ref-cdn-url'),
  supportPortal: document.getElementById('ref-support-portal')
}

const toast = document.getElementById('settings-toast')

const saved = loadSettings()
applySettings(saved)
updateReference(saved)

attachEvents()

function loadSettings() {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (!value) return { ...defaults }
    return { ...defaults, ...JSON.parse(value) }
  } catch (err) {
    console.error('Unable to read saved settings', err)
    return { ...defaults }
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (err) {
    console.error('Unable to persist settings', err)
  }
}

function applySettings(settings) {
  Object.entries(fields).forEach(([key, input]) => {
    if (!input) return
    if (input.type === 'checkbox') {
      input.checked = !!settings[key]
    } else {
      input.value = settings[key] || ''
    }
  })
}

function collectSettings() {
  return {
    storeName: fields.storeName.value || defaults.storeName,
    supportEmail: fields.supportEmail.value || defaults.supportEmail,
    supportPhone: fields.supportPhone.value || defaults.supportPhone,
    storeHours: fields.storeHours.value || defaults.storeHours,
    storeAddress: fields.storeAddress.value || defaults.storeAddress,
    apiBase: fields.apiBase.value || defaults.apiBase,
    cdnUrl: fields.cdnUrl.value || defaults.cdnUrl,
    supportPortal: fields.supportPortal.value || defaults.supportPortal,
    storeOnline: fields.storeOnline.checked,
    maintenance: fields.maintenance.checked,
    alerts: fields.alerts.checked
  }
}

function updateReference(settings) {
  references.storeName.textContent = settings.storeName
  references.supportEmail.textContent = settings.supportEmail
  references.apiBase.textContent = settings.apiBase
  references.cdnUrl.textContent = settings.cdnUrl
  references.supportPortal.textContent = settings.supportPortal
}

function showToast(message) {
  if (!toast) return
  toast.textContent = message
  toast.classList.add('visible')
  setTimeout(() => toast.classList.remove('visible'), 2400)
}

function attachEvents() {
  document.getElementById('save-settings')?.addEventListener('click', () => {
    const settings = collectSettings()
    saveSettings(settings)
    updateReference(settings)
    showToast('Settings saved locally')
  })

  document.getElementById('reset-settings')?.addEventListener('click', () => {
    applySettings(defaults)
    updateReference(defaults)
    saveSettings(defaults)
    showToast('Reset to defaults')
  })

  Object.values(fields).forEach(input => {
    if (input?.type === 'checkbox') {
      input.addEventListener('change', () => {
        const settings = collectSettings()
        saveSettings(settings)
        updateReference(settings)
      })
    }
  })
}
