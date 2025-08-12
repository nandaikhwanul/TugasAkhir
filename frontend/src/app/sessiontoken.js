// Ambil token dari sessionStorage (bisa dipakai di file mana saja, client-side)
// Jika token kadaluarsa, redirect ke /login dan return null
export function getTokenFromSessionStorage() {
  if (typeof window === "undefined") return null;
  try {
    const token = window.sessionStorage.getItem("token");
    if (!token) return null;

    // Cek kadaluarsa JWT
    const parts = token.split(".");
    if (parts.length !== 3) {
      // Token tidak valid, hapus & redirect
      window.sessionStorage.removeItem("token");
      if (typeof window !== "undefined") window.location.href = "/login";
      return null;
    }
    try {
      const payload = JSON.parse(atob(parts[1]));
      if (payload && payload.exp) {
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
          // Token kadaluarsa, hapus & redirect
          window.sessionStorage.removeItem("token");
          if (typeof window !== "undefined") window.location.href = "/login";
          return null;
        }
      }
    } catch (e) {
      // Payload tidak bisa di-decode, hapus & redirect
      window.sessionStorage.removeItem("token");
      if (typeof window !== "undefined") window.location.href = "/login";
      return null;
    }
    return token;
  } catch (e) {
    return null;
  }
}
