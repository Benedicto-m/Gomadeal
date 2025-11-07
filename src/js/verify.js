import { supabase, getDeviceByIMEI, getDeviceByCode } from '/src/js/api.js';

const form = document.getElementById('verifyForm');
const input = document.getElementById('search');
const result = document.getElementById('result');
const errorMsg = document.getElementById('error');

const r_code = document.getElementById('r_code');
const r_imei = document.getElementById('r_imei');
const r_brand = document.getElementById('r_brand');
const r_model = document.getElementById('r_model');
const r_owner = document.getElementById('r_owner');
const r_status = document.getElementById('r_status');
const r_image = document.getElementById('r_image');

// 🧭 Vérifie s'il y a un paramètre ?code= dans l'URL (depuis QR)
const urlParams = new URLSearchParams(window.location.search);
const codeFromURL = urlParams.get('code');
if (codeFromURL) {
  input.value = codeFromURL;
  verifyDevice(codeFromURL);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const value = input.value.trim();
  if (!value) return;
  await verifyDevice(value);
});

async function verifyDevice(value) {
  errorMsg.classList.add('hidden');
  result.classList.add('hidden');

  try {
    let device = null;
    if (value.startsWith('GD-')) {
      device = await getDeviceByCode(value);
    } else {
      device = await getDeviceByIMEI(value);
    }

    if (!device) {
      throw new Error("Aucun appareil trouvé pour ce code/IMEI.");
    }

    // ✅ Affichage
    r_code.textContent = device.gomadeal_code || '—';
    r_imei.textContent = device.imei || '—';
    r_brand.textContent = device.brand || '—';
    r_model.textContent = device.model || '—';
    r_owner.textContent = device.owner_contact || '—';
    r_status.textContent = device.status || 'Actif';
    r_status.className = device.status === 'lost' ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold';

    if (device.image_path) {
      r_image.src = device.image_path;
      r_image.classList.remove('hidden');
    } else {
      r_image.classList.add('hidden');
    }

    result.classList.remove('hidden');
  } catch (err) {
    console.error(err);
    errorMsg.textContent = err.message || 'Erreur inattendue.';
    errorMsg.classList.remove('hidden');
  }
}
