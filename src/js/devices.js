// /src/js/devices.js
import { uploadImage, registerDevice } from '/src/js/api.js';

const form = document.getElementById('registerForm');
const result = document.getElementById('result');
const gdcodeEl = document.getElementById('gdcode');
const qrEl = document.getElementById('qr');
const shareBtn = document.getElementById('shareWhatsapp');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const imei = document.getElementById('imei').value.trim();
  const brand = document.getElementById('brand').value.trim();
  const model = document.getElementById('model').value.trim();
  const owner_contact = document.getElementById('owner_contact').value.trim();
  const fileInput = document.getElementById('image');
  const file = fileInput.files[0];

  try {
    form.querySelector('button[type=submit]').disabled = true;
    // basic client imei validation (length)
    if (!imei || (imei.length !== 15 && imei.length !== 14 && imei.length !== 16)) {
      alert('IMEI invalide (vérifie la longueur).');
      form.querySelector('button[type=submit]').disabled = false;
      return;
    }

    let image_path = null;
    if (file) {
      image_path = await uploadImage(file);
    }

    const resp = await registerDevice({ imei, brand, model, owner_contact, image_path });

    // resp may be array or object depending on supabase rpc return
    const row = Array.isArray(resp) ? resp[0] : resp;

    gdcodeEl.textContent = row.gomadeal_code || row.gdcode || '—';
    qrEl.innerHTML = '';
    // generate QR (link to verify page)
    const verifyUrl = `${location.origin}/src/pages/verify.html?code=${encodeURIComponent(gdcodeEl.textContent)}`;
    QRCode.toCanvas(verifyUrl, { width: 160 }, function (err, canvas) {
      if (err) console.error(err);
      qrEl.appendChild(canvas);
    });

    result.classList.remove('hidden');
    form.reset();
  } catch (err) {
    console.error(err);
    alert('Erreur: ' + (err.message || JSON.stringify(err)));
  } finally {
    form.querySelector('button[type=submit]').disabled = false;
  }
});

shareBtn.addEventListener('click', () => {
  const code = gdcodeEl.textContent;
  if (!code) return;
  const text = `Mon téléphone est enregistré sur GomaDeal — code: ${code}. Vérifie ici: ${location.origin}/src/pages/verify.html?code=${encodeURIComponent(code)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(whatsappUrl, '_blank');
});
