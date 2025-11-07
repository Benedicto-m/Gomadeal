import { supabase } from '/src/js/api.js';

(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    // Si non connecté → retour à login
    window.location.href = './login.html';
    return;
  }
})();


const body = document.getElementById('deviceBody');
const searchInput = document.getElementById('search');
const filter = document.getElementById('filter');
const refreshBtn = document.getElementById('refresh');
const emptyMsg = document.getElementById('emptyMsg');

async function loadDevices() {
  body.innerHTML = '';
  emptyMsg.classList.add('hidden');

  let query = supabase.from('devices').select('*').order('created_at', { ascending: false });

  const filterValue = filter.value;
  if (filterValue === 'lost') query = query.eq('status', 'lost');
  else if (filterValue === 'active') query = query.neq('status', 'lost');

  const search = searchInput.value.trim();
  if (search) {
    query = query.or(`imei.ilike.%${search}%,gomadeal_code.ilike.%${search}%,owner_contact.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    alert("Erreur de chargement : " + error.message);
    return;
  }

  if (!data || data.length === 0) {
    emptyMsg.classList.remove('hidden');
    return;
  }

  data.forEach(d => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="border p-2 font-mono">${d.gomadeal_code}</td>
      <td class="border p-2">${d.imei}</td>
      <td class="border p-2">${d.brand ?? '—'}</td>
      <td class="border p-2">${d.model ?? '—'}</td>
      <td class="border p-2">${d.owner_contact ?? '—'}</td>
      <td class="border p-2 font-semibold ${d.status === 'lost' ? 'text-red-600' : 'text-green-600'}">
        ${d.status ?? 'Actif'}
      </td>
      <td class="border p-2">${new Date(d.created_at).toLocaleString()}</td>
    `;
    body.appendChild(tr);
  });
}

refreshBtn.addEventListener('click', loadDevices);
filter.addEventListener('change', loadDevices);
searchInput.addEventListener('input', () => {
  clearTimeout(window._searchTimeout);
  window._searchTimeout = setTimeout(loadDevices, 500);
});

loadDevices();

async function updateStats() {
  const { data, error } = await supabase.from('devices').select('status');
  if (error) return console.error(error);

  const total = data.length;
  const lost = data.filter(d => d.status === 'lost').length;
  const active = total - lost;

  document.getElementById('stats').innerHTML = `
    <div class="bg-blue-50 p-3 rounded">
      <p class="text-2xl font-bold">${total}</p>
      <p class="text-sm text-gray-600">Total</p>
    </div>
    <div class="bg-green-50 p-3 rounded">
      <p class="text-2xl font-bold">${active}</p>
      <p class="text-sm text-gray-600">Actifs</p>
    </div>
    <div class="bg-red-50 p-3 rounded">
      <p class="text-2xl font-bold">${lost}</p>
      <p class="text-sm text-gray-600">Perdus</p>
    </div>
    <div class="bg-yellow-50 p-3 rounded">
      <p class="text-2xl font-bold">${(lost / total * 100).toFixed(1)}%</p>
      <p class="text-sm text-gray-600">% Perdus</p>
    </div>
  `;
}

refreshBtn.addEventListener('click', () => {
  loadDevices();
  updateStats();
});

updateStats();


document.getElementById('exportCsv').addEventListener('click', async () => {
  const { data, error } = await supabase.from('devices').select('*');
  if (error) return alert('Erreur export : ' + error.message);

  const rows = data.map(d => [
    d.gomadeal_code, d.imei, d.brand, d.model, d.owner_contact, d.status, d.created_at
  ]);

  const csv = [
    ['Code', 'IMEI', 'Marque', 'Modèle', 'Contact', 'Statut', 'Créé le'],
    ...rows
  ].map(r => r.join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gomadeal_devices.csv';
  a.click();
});

