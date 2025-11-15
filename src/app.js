/* ============================================================
   🔵 SUPABASE CONFIG (via module import)
============================================================ */
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://hdtxbiemeitwuslgwfbl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkdHhiaWVtZWl0d3VzbGd3ZmJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNjU5MjAsImV4cCI6MjA3Nzg0MTkyMH0.obMpgyrxAobXfoNYW8qV0ApVFntnHvjmKsDvA0fN1Rw"; 
// Client Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ============================================================
   🔵 GÉNÉRATION DE QR CODE
============================================================ */
export function generateQR(text) {
  const canvas = document.createElement("canvas");
  QRCode.toCanvas(canvas, text, { width: 160 });
  return canvas.toDataURL("image/png");
}

/* ============================================================
   🔵 UPLOAD IMAGE DEVICE
============================================================ */
async function uploadDeviceImage(file) {
  if (!file) return null;

  const cleanName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;

  const { error } = await supabase.storage
    .from("device-images")
    .upload(cleanName, file);

  if (error) throw error;

  return `${SUPABASE_URL}/storage/v1/object/public/device-images/${cleanName}`;
}

/* ============================================================
   🔵 FONCTION : SUBMIT REGISTER FORM
============================================================ */
export async function handleRegisterSubmit(e) {
  e.preventDefault();

  const imei = document.getElementById("reg_imei").value.trim();
  const brand = document.getElementById("reg_brand").value.trim();
  const model = document.getElementById("reg_model").value.trim();
  const contact = document.getElementById("reg_contact").value.trim();
  const file = document.getElementById("reg_image").files[0];

  const resultBox = document.getElementById("register_result");

  try {
    let image_url = null;
    if (file) {
      image_url = await uploadDeviceImage(file);
    }

    const { data, error } = await supabase
      .from("devices")
      .insert({
        imei,
        brand,
        model,
        owner_contact: contact,
        image_path: image_url,
        status: "active"
      })
      .select()
      .single();

    if (error) throw error;

    const qrData = generateQR(data.gomadeal_code);

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
}
