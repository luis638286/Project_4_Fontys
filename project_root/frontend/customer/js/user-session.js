;(function () {
  const authButton = document.querySelector('[data-auth-button]')
  const nameEl = document.querySelector('[data-user-name]')
  const statusEl = document.querySelector('[data-user-status]')
  const avatarEl = document.querySelector('[data-user-avatar]')

  const user = getStoredUser()
  paintUser(user)

  if (authButton) {
    authButton.addEventListener('click', () => {
      const activeUser = getStoredUser()
      if (activeUser) {
        localStorage.removeItem('freshmart_user')
        window.location.href = 'login.html'
      } else {
        window.location.href = 'login.html'
      }
    })
  }

  function paintUser(currentUser) {
    const hasUser = Boolean(currentUser)
    const displayName = hasUser ? buildName(currentUser) : 'Guest'
    const statusText = hasUser ? 'Signed in' : 'Not signed in'
    const avatarText = hasUser
      ? (currentUser.first_name?.[0] || currentUser.name?.[0] || currentUser.email?.[0] || '🙂').toUpperCase()
      : '👤'

    if (nameEl) nameEl.textContent = displayName
    if (statusEl) statusEl.textContent = statusText
    if (avatarEl) avatarEl.textContent = avatarText
    if (authButton) authButton.textContent = hasUser ? 'Log out' : 'Log in'
  }

  function buildName(currentUser) {
    const parts = [currentUser.first_name, currentUser.last_name].filter(Boolean)
    if (parts.length) return parts.join(' ')
    return currentUser.name || currentUser.email || 'Customer'
  }

  function getStoredUser() {
    try {
      const raw = localStorage.getItem('freshmart_user')
      if (!raw) return null
      return JSON.parse(raw)
    } catch (err) {
      console.warn('Unable to read stored user', err)
      return null
    }
  }
})()
