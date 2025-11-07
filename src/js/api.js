const SUPABASE_URL = "https://hdtxbiemeitwuslgwfbl.supabase.co"; // ton URL
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkdHhiaWVtZWl0d3VzbGd3ZmJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNjU5MjAsImV4cCI6MjA3Nzg0MTkyMH0.obMpgyrxAobXfoNYW8qV0ApVFntnHvjmKsDvA0fN1Rw"; // ta clé

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function registerDevice({ imei, brand, model, owner_contact, image_path }) {
  const { data, error } = await supabase.rpc('register_device', {
    p_imei: imei,
    p_brand: brand,
    p_model: model,
    p_owner_contact: owner_contact,
    p_image_path: image_path
  });
  if (error) throw error;
  return data[0];
}