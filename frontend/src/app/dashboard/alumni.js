"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Navbar from "../navbar/page";
import AlumniStepper from "../stepperRegister/alumniStepper/page";
import AlumniDashbord from "./alumni/page";
import { getTokenFromSessionStorage } from "../sessiontoken"; // gunakan ini untuk dapat tokenya

// Fungsi untuk menghapus cookie token (jaga-jaga, walau token sudah di sessionStorage)
function removeTokenCookie() {
  if (typeof document === "undefined") return;
  document.cookie =
    "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
}

// Field yang harus dicek
const REQUIRED_FIELDS = [
  "name",
  "nim",
  "email",
  "alamat",
  "nohp",
  "program_studi",
  "tahun_lulus",
  "tanggal_lahir",
];

export default function AlumniDashboard() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let ignore = false;
    const fetchUser = async () => {
      setLoading(true);
      setError("");
      try {
        const token = getTokenFromSessionStorage();

        if (!token) {
          router.replace("/login");
          return;
        }

        // Fetch alumni data
        try {
          const resAlumni = await axios.get("https://tugasakhir-production-6c6c.up.railway.app/alumni/me", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            withCredentials: true,
          });
          if (!ignore) {
            setUserData(resAlumni.data);

            // Cek field yang wajib, jika ada yang null, tampilkan modal
            const isAnyRequiredNull = REQUIRED_FIELDS.some(
              (field) =>
                resAlumni.data[field] === null ||
                resAlumni.data[field] === undefined ||
                resAlumni.data[field] === ""
            );

            // Cek tipe dan isi skill
            let isSkillEmpty = false;
            const skill = resAlumni.data.skill;

            if (skill === undefined || skill === null) {
              isSkillEmpty = true;
            } else if (Array.isArray(skill)) {
              isSkillEmpty = skill.length === 0;
            } else {
              // Jika skill ada tapi bukan array, anggap kosong (wajib isi ulang)
              isSkillEmpty = true;
            }

            setShowModal(isAnyRequiredNull || isSkillEmpty);
          }
        } catch (errAlumni) {
          if (
            errAlumni.response &&
            (errAlumni.response.status === 401 ||
              errAlumni.response.status === 403 ||
              errAlumni.response.status === 404)
          ) {
            router.replace("/login");
            return;
          } else if (errAlumni.response) {
            setError(
              errAlumni.response.data?.message ||
                errAlumni.response.data?.msg ||
                "Gagal mengambil data alumni."
            );
          } else {
            setError("Terjadi kesalahan pada server.");
          }
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchUser();
    return () => {
      ignore = true;
    };
  }, [router]);

  // Handler untuk logout
  const handleLogout = async () => {
    setLogoutLoading(true);
    setError("");
    try {
      // Ambil token dari sessionStorage
      const token = getTokenFromSessionStorage();
      await axios.post(
        "https://tugasakhir-production-6c6c.up.railway.app/logout",
        {},
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
    } catch (err) {
      // Abaikan error logout, tetap hapus token
    } finally {
      removeTokenCookie();
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("token");
      }
      setLogoutLoading(false);
      router.replace("/login");
    }
  };

  // Handler untuk menutup modal stepper
  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <div>
      <Navbar />
      <AlumniDashbord/>
      {/* AlumniStepper as modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full relative">
            {/* Tombol Lewati step ini */}
            <button
              className="absolute top-3 right-3 text-blue-600 hover:underline bg-transparent border-none p-0 m-0 font-semibold"
              style={{ background: "none", border: "none" }}
              onClick={handleCloseModal}
              type="button"
            >
              Lewati step ini
            </button>
            <AlumniStepper />
          </div>
        </div>
      )}
    </div>
  );
}