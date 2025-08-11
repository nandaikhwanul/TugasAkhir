// Fungsi untuk mengambil token dari cookie
function getTokenFromCookie(name = "token") {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

// Fungsi GET data alumni
export async function getAlumniProfile() {
  const token = getTokenFromCookie("token");
  if (!token) throw new Error("Token not found");
  const res = await fetch("http://localhost:5000/alumni/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error("Gagal mengambil data alumni");
  }
  return await res.json();
}

// Fungsi PATCH update data alumni
export async function updateAlumniProfile(data) {
  const token = getTokenFromCookie("token");
  if (!token) throw new Error("Token not found");
  const res = await fetch("http://localhost:5000/alumni/me/profil", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Gagal update profil alumni");
  }
  return await res.json();
}
