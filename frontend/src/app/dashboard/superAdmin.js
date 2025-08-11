"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

// Helper: Ambil token dari cookie (client-side)
function getTokenFromCookie() {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";").map((c) => c.trim());
  for (const c of cookies) {
    if (c.startsWith("token=")) {
      return decodeURIComponent(c.substring("token=".length));
    }
  }
  return null;
}

// Komponen Dashboard Super Admin (Ambil data dari endpoint superadmin/me)
export default function SuperAdminDashboard() {
  const [superAdminData, setSuperAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    let ignore = false;
    async function fetchSuperAdmin() {
      setLoading(true);
      setError("");
      try {
        const token = getTokenFromCookie();
        if (!token) {
          router.replace("/login");
          return;
        }
        const res = await axios.get("ttps://tugasakhir-production-6c6c.up.railway.app/superadmin/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });
        if (!ignore) {
          setSuperAdminData(res.data);
        }
      } catch (err) {
        if (!ignore) {
          if (
            err.response &&
            (err.response.status === 401 ||
              err.response.status === 403 ||
              err.response.status === 404)
          ) {
            router.replace("/login");
          } else if (err.response) {
            setError(
              err.response.data?.message ||
                err.response.data?.msg ||
                "Gagal mengambil data superadmin."
            );
          } else {
            setError("Terjadi kesalahan pada server.");
          }
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchSuperAdmin();
    return () => {
      ignore = true;
    };
  }, [router]);

  // Dummy fallback jika data tidak ada
  const stats = {
    totalPerusahaan: superAdminData?.totalPerusahaan ?? 0,
    totalUser: superAdminData?.totalUser ?? 0,
    totalAdmin: superAdminData?.totalAdmin ?? 0,
    perusahaanList: Array.isArray(superAdminData?.perusahaanList)
      ? superAdminData.perusahaanList
      : [],
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Memuat data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-600 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-blue-700">Dashboard Super Admin</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard
            title="Total Perusahaan"
            value={stats.totalPerusahaan}
            icon="🏢"
            color="bg-blue-100"
          />
          <StatCard
            title="Total User"
            value={stats.totalUser}
            icon="👤"
            color="bg-green-100"
          />
          <StatCard
            title="Total Admin"
            value={stats.totalAdmin}
            icon="🛡️"
            color="bg-yellow-100"
          />
        </div>

        {/* Daftar perusahaan */}
        <div className="bg-white rounded-xl shadow p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Daftar Perusahaan</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b text-left">Nama</th>
                  <th className="py-2 px-4 border-b text-left">Email</th>
                  <th className="py-2 px-4 border-b text-left">Jumlah Karyawan</th>
                  <th className="py-2 px-4 border-b text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.perusahaanList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-gray-500">
                      Tidak ada perusahaan.
                    </td>
                  </tr>
                ) : (
                  stats.perusahaanList.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b">{p.nama}</td>
                      <td className="py-2 px-4 border-b">{p.email}</td>
                      <td className="py-2 px-4 border-b">{p.jumlah_karyawan ?? "-"}</td>
                      <td className="py-2 px-4 border-b">
                        {p.status === "active" ? (
                          <span className="text-green-600 font-semibold">Aktif</span>
                        ) : (
                          <span className="text-red-600 font-semibold">Nonaktif</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Komponen kartu statistik
function StatCard({ title, value, icon, color }) {
  return (
    <div className={`rounded-xl shadow p-6 flex items-center ${color}`}>
      <div className="text-4xl mr-4">{icon}</div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-gray-700">{title}</div>
      </div>
    </div>
  );
}
