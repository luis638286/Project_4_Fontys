(function () {
  const form = document.getElementById('login-form')
  const errorBox = document.getElementById('login-error')

  if (!form) return

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    clearError()

    const email = document.getElementById('email')?.value.trim()
    const password = document.getElementById('password')?.value

    if (!email || !password) {
      return showError('Please enter your email and password')
    }

    try {
      const result = await apiClient.login({ email, password })
      rememberUser(result.user)
      form.reset()
      window.location.href = 'index.html'
    } catch (err) {
      showError(err.message || 'Unable to log in')
    }
  })

  function showError(message) {
    if (!errorBox) return
    errorBox.textContent = message
    errorBox.style.display = 'block'
  }

  function clearError() {
    if (!errorBox) return
    errorBox.textContent = ''
    errorBox.style.display = 'none'
  }

  function rememberUser(user) {
    try {
      localStorage.setItem('freshmart_user', JSON.stringify(user))
    } catch (err) {
      console.warn('Unable to persist user info', err)
    }
  }
})()
