(function () {
  const form = document.getElementById('signup-form')
  const errorBox = document.getElementById('signup-error')

  if (!form) return

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    clearError()

    const firstName = document.getElementById('first-name')?.value.trim()
    const lastName = document.getElementById('last-name')?.value.trim()
    const email = document.getElementById('email')?.value.trim()
    const password = document.getElementById('password')?.value
    const confirm = document.getElementById('confirm-password')?.value

    if (!firstName || !lastName || !email || !password || !confirm) {
      return showError('Please fill out all fields')
    }

    if (password !== confirm) {
      return showError('Passwords do not match')
    }

    try {
      const user = await apiClient.register({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        role: 'customer'
      })

      rememberUser(user)
      form.reset()
      window.location.href = 'login.html'
    } catch (err) {
      showError(err.message || 'Unable to sign up right now')
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
