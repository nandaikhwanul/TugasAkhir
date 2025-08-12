// Ambil token hanya dari sessionStorage
export function getTokenFromSessionStorage() {
  if (typeof window === "undefined") return null;
  try {
    const token = window.sessionStorage.getItem("token");
    if (!token) return null;

    // Cek expired JWT
    const parts = token.split(".");
    if (parts.length !== 3) {
      window.sessionStorage.removeItem("token");
      return null;
    }
    try {
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp && typeof payload.exp === "number") {
        // exp dalam detik
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
          window.sessionStorage.removeItem("token");
          return null;
        }
      }
    } catch (e) {
      window.sessionStorage.removeItem("token");
      return null;
    }

    return token;
  } catch (e) {
    return null;
  }
}
