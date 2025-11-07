import { supabase } from '/src/js/api.js';

// Vérifie le rôle et redirige
export async function checkAuthRole() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = '/src/pages/auth/login.html';
    return;
  }

  // Exemple de gestion basique (tu pourras améliorer avec une table roles plus tard)
  const adminEmails = ['admin@gomadeal.com', 'support@gomadeal.com'];
  if (adminEmails.includes(user.email)) {
    if (!window.location.href.includes('/admin/')) {
      window.location.href = '/src/pages/admin/dashboard.html';
    }
  } else {
    if (!window.location.href.includes('/user/')) {
      window.location.href = '/src/pages/user/dashboard.html';
    }
  }
}
