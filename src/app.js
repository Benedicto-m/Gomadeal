/* ============================================================
   🔵 SUPABASE CONFIG (via module import)
============================================================ */
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import QRCode from "https://cdn.jsdelivr.net/npm/qrcode@1.5.1/+esm";

const SUPABASE_URL = "https://hdtxbiemeitwuslgwfbl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkdHhiaWVtZWl0d3VzbGd3ZmJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNjU5MjAsImV4cCI6MjA3Nzg0MTkyMH0.obMpgyrxAobXfoNYW8qV0ApVFntnHvjmKsDvA0fN1Rw"; 
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ============================================================
   🔵 GÉNÉRATION DE QR CODE
============================================================ */
export async function generateQR(text) {
  try {
    return await QRCode.toDataURL(text, { width: 200, margin: 1 });
  } catch (err) {
    console.error("Erreur génération QR:", err);
    return null;
  }
}

/* ============================================================
   🔵 UPLOAD IMAGE DEVICE
============================================================ */
async function uploadDeviceImage(file) {
  if (!file) return null;
  const cleanName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
  const { error } = await supabase.storage
    .from("device-images")
    .upload(cleanName, file, { upsert: false });
  if (error) throw error;
  return `${SUPABASE_URL}/storage/v1/object/public/device-images/${cleanName}`;
}

/* ============================================================
   🔵 ANTI-BRUTEFORCE VERIFY
============================================================ */
let lastVerifyTime = 0;
function throttleVerify() {
  const now = Date.now();
  if (now - lastVerifyTime < 3000) return false;
  lastVerifyTime = now;
  return true;
}

/* ============================================================
   🔵 FONCTION : VERIFY DEVICE
============================================================ */
export async function handleVerify() {
  const query = document.getElementById("v_query").value.trim();
  const result = document.getElementById("verify_result");

  if (!throttleVerify()) {
    result.innerHTML = `<div class="bg-yellow-50 p-3 rounded border border-yellow-300">
      <p class="text-yellow-800">Patience  🙏</p>
      <p>Attends 3 secondes avant une nouvelle vérification.</p>
    </div>`;
    return;
  }

  if (!query) {
    result.innerHTML = `<p class="text-red-600 font-semibold">Veuillez entrer un IMEI ou un code.</p>`;
    return;
  }

  try {
    if (/[^A-Za-z0-9\-]/.test(query)) {
      result.innerHTML = `<div class="bg-red-50 p-3 border border-red-300 rounded">
        <p class="text-red-700 font-bold">Entrée non valide</p>
      </div>`;
      return;
    }

    const { data, error } = await supabase
      .from("devices")
      .select("*, lost_reports(description, reporter_contact, created_at)")
      .or(`imei.eq.${query},gomadeal_code.eq.${query}`)
      .single();

    if (error || !data) {
      result.innerHTML = `<div class="bg-red-50 border border-red-300 p-3 rounded">
        <p class="text-red-700 font-bold">Aucun appareil trouvé</p>
        <p class="text-sm text-slate-600">Le code n'existe pas dans le système.</p>
      </div>`;
      return;
    }

    const badge = {
      active: "bg-green-100 text-green-700 border-green-300",
      lost: "bg-red-100 text-red-700 border-red-300",
      suspect: "bg-yellow-100 text-yellow-700 border-yellow-300",
      found: "bg-blue-100 text-blue-700 border-blue-300"
    }[data.status] || "bg-slate-100 text-slate-700 border-slate-300";

    result.innerHTML = `<div class="border rounded-xl p-4 space-y-3">
      <div class="flex justify-between items-start">
        <p class="font-bold text-lg">📱 ${data.brand} ${data.model}</p>
        <span class="${badge} px-3 py-1 rounded-full text-xs border font-semibold">
          ${data.status.toUpperCase()}
        </span>
      </div>
      <p><strong>IMEI:</strong> ${data.imei}</p>
      <p><strong>Code GomaDeal:</strong> ${data.gomadeal_code}</p>
      <p><strong>Propriétaire:</strong> ${data.owner_contact}</p>
      ${data.image_path ? `<img src="${data.image_path}" class="w-40 rounded border mx-auto">` : ""}
      ${data.lost_reports?.length > 0 ? `
        <div class="bg-red-50 border border-red-300 p-3 rounded mt-3">
          <p class="font-bold text-red-700">⚠️ Signalé comme perdu</p>
          <p class="text-sm text-slate-800">${data.lost_reports[0].description}</p>
          <p class="text-xs text-slate-500 mt-1">Signalé par : ${data.lost_reports[0].reporter_contact}</p>
        </div>` : ""}
    </div>`;
  } catch (err) {
    result.innerHTML = `<div class="bg-red-50 border border-red-300 p-3 rounded">
      <p class="text-red-700 font-bold">Erreur système</p>
      <p>${err.message}</p>
    </div>`;
  }
}

/* ============================================================
   🔵 FONCTION : REGISTER DEVICE
============================================================ */
export async function handleRegisterSubmit(e) {
  e.preventDefault();

  const imei = document.getElementById("reg_imei").value.trim();
  const brand = document.getElementById("reg_brand").value.trim();
  const model = document.getElementById("reg_model").value.trim();
  const contact = document.getElementById("reg_contact").value.trim();
  const file = document.getElementById("reg_image").files[0];
  const resultBox = document.getElementById("register_result");

  if (!/^\d{15}$/.test(imei)) {
    resultBox.innerHTML = `<div class="bg-red-50 p-3 rounded border border-red-300">
      <p class="text-red-700 font-bold">IMEI invalide</p>
      <p>Le numéro IMEI doit contenir exactement 15 chiffres.</p>
    </div>`;
    return;
  }

  try {
    const { data: existing } = await supabase
      .from("devices")
      .select("imei")
      .eq("imei", imei)
      .single();

    if (existing) {
      resultBox.innerHTML = `<div class="bg-yellow-50 p-3 rounded border border-yellow-300">
        <p class="text-yellow-800 font-bold">Appareil déjà enregistré</p>
        <p>Cet IMEI existe déjà dans GomaDeal.</p>
      </div>`;
      return;
    }

    let image_url = null;
    if (file) image_url = await uploadDeviceImage(file);

    // ⚠️ Si tu as appliqué le SQL avec séquence + contrainte UNIQUE,
    // tu n’as PAS besoin de générer le code côté JS.
    const { data, error } = await supabase
      .from("devices")
      .insert({
        imei,
        brand,
        model,
        owner_contact: contact,
        image_path: image_url,
        status: "active"
        // gomadeal_code sera généré automatiquement par Postgres
      })
      .select()
      .single();

    if (error) throw error;

    const verifyUrl = `verify.html?code=${data.gomadeal_code}`;
    const qrData = await generateQR(verifyUrl);

    resultBox.innerHTML = `
      <div class="bg-green-50 p-4 rounded border border-green-200">
        <p class="text-green-700 font-semibold">Enregistrement réussi 🎉</p>
        <p><strong>Code GomaDeal:</strong> ${data.gomadeal_code}</p>
        <img src="${qrData}" class="mt-3 w-40 h-40 mx-auto border p-2 rounded bg-white" />
      </div>
    `;
  } catch (err) {
    resultBox.innerHTML = `
      <div class="bg-red-50 p-3 rounded border border-red-300">
        <p class="text-red-700 font-bold">Erreur</p>
        <p>${err.message}</p>
      </div>
    `;
  }
} // <-- fermeture de la fonction
