import { supabase } from '/src/js/api.js';

const form = document.getElementById('reportForm');
const message = document.getElementById('message');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const idvalue = document.getElementById('idvalue').value.trim();
  const description = document.getElementById('description').value.trim();
  const contact = document.getElementById('contact').value.trim();

  if (!idvalue || !description || !contact) {
    alert("Remplis tous les champs obligatoires.");
    return;
  }

  try {
    form.querySelector('button[type=submit]').disabled = true;
    message.classList.add('hidden');

    // Appel RPC report_lost()
    const { data, error } = await supabase.rpc('report_lost', {
      p_imei: idvalue,
      p_description: description,
      p_reporter_contact: contact
    });

    if (error) throw error;

    message.textContent = "✅ Signalement enregistré. Merci pour votre contribution.";
    message.className = "text-green-600 font-semibold mt-4 text-center";
    message.classList.remove('hidden');
    form.reset();
  } catch (err) {
    console.error(err);
    message.textContent = "❌ " + (err.message || "Erreur de soumission.");
    message.className = "text-red-600 font-semibold mt-4 text-center";
    message.classList.remove('hidden');
  } finally {
    form.querySelector('button[type=submit]').disabled = false;
  }
});
