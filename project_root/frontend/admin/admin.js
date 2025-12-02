// FreshMart Admin Login Logic
// Mock credentials
const ADMIN_EMAIL = 'admin@freshmart.com'
const ADMIN_PASSWORD = 'Admin123!'
const STORAGE_KEY = 'freshmart_admin_auth'

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('admin-login-form')
  const emailInput = document.getElementById('admin-email')
  const passwordInput = document.getElementById('admin-password')
  const rememberCheckbox = document.getElementById('remember-admin')
  const errorBox = document.querySelector('.auth-error')
  const togglePasswordBtn = document.querySelector('.auth-toggle-password')

  preloadRememberedAdmin(emailInput, rememberCheckbox)
  attachPasswordToggle(passwordInput, togglePasswordBtn)

  if (!form) return

  form.addEventListener('submit', event => {
    event.preventDefault()
    hideError(errorBox)

    const email = emailInput.value.trim()
    const password = passwordInput.value.trim()

    if (!email || !password) {
      showError(errorBox, 'Please fill in both email and password')
      animateInvalidInputs([emailInput, passwordInput])
      return
    }

    const isValid =
      email.toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
      password === ADMIN_PASSWORD

    if (!isValid) {
      showError(errorBox, 'Invalid email or password')
      animateInvalidInputs([emailInput, passwordInput])
      return
    }

    if (rememberCheckbox && rememberCheckbox.checked) {
      rememberAdmin(email)
    } else {
      clearRememberedAdmin()
    }

    form.classList.add('auth-form-success')

    setTimeout(() => {
      window.location.href = 'admin-dashboard.html'
    }, 350)
  })
})

function showError(box, message) {
  if (!box) return
  box.textContent = message
  box.classList.add('visible')
}

function hideError(box) {
  if (!box) return
  box.textContent = ''
  box.classList.remove('visible')
}

function animateInvalidInputs(inputs) {
  inputs.forEach(input => {
    if (!input) return
    input.classList.remove('shake')
    void input.offsetWidth
    input.classList.add('shake')
  })
}

function rememberAdmin(email) {
  try {
    const data = {
      email,
      rememberedAt: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (err) {
    console.error('Failed to store admin auth', err)
  }
}

function clearRememberedAdmin() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    console.error('Failed to clear admin auth', err)
  }
}

function preloadRememberedAdmin(emailInput, rememberCheckbox) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return

    const data = JSON.parse(stored)
    if (!data || !data.email) return

    if (emailInput) {
      emailInput.value = data.email
    }
    if (rememberCheckbox) {
      rememberCheckbox.checked = true
    }
  } catch (err) {
    console.error('Failed to read admin auth', err)
  }
}

function attachPasswordToggle(passwordInput, toggleBtn) {
  if (!passwordInput || !toggleBtn) return

  toggleBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password'
    passwordInput.type = isPassword ? 'text' : 'password'
    toggleBtn.textContent = isPassword ? '🙈' : '👁'
  })
}
