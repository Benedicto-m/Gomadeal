export function renderNavbar(role = 'user') {
  const nav = document.createElement('nav');
  nav.className = 'fixed bottom-0 left-0 right-0 bg-white border-t shadow-md flex justify-around py-2 text-sm z-50';

  if (role === 'user') {
    nav.innerHTML = `
      <a href="/src/pages/user/dashboard.html" class="text-blue-600">🏠</a>
      <a href="/src/pages/user/verify.html">🔍</a>
      <a href="/src/pages/user/sell.html">💰</a>
      <a href="/src/pages/user/chat.html">💬</a>
      <a href="/src/pages/user/settings.html">⚙️</a>
    `;
  } else {
    nav.innerHTML = `
      <a href="/src/pages/admin/dashboard.html" class="text-blue-600">📊</a>
      <a href="/src/pages/admin/devices.html">📱</a>
      <a href="/src/pages/admin/users.html">👥</a>
      <a href="/src/pages/admin/reports.html">🚨</a>
      <a href="/src/pages/admin/stats.html">⚙️</a>
    `;
  }

  document.body.appendChild(nav);
}
