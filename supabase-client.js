// supabase-client.js
// Shared Supabase connection for all pages.
// Loaded via <script type="module" src="/supabase-client.js"></script>

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://hoqfjjzkrzosbnlujrks.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Mpn4rQyYl2OHf9ESDT4W6Q_YipDMeV-";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper: get the current logged-in user, or null
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

// Helper: redirect to login if not authenticated
export async function requireAuth(redirectTo = "/login.html") {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = redirectTo;
    return null;
  }
  return user;
}

// Helper: redirect away if already authenticated (for login/signup pages)
export async function redirectIfAuth(redirectTo = "/welcome.html") {
  const user = await getCurrentUser();
  if (user) {
    window.location.href = redirectTo;
  }
}

// Helper: sign out
export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = "/";
}