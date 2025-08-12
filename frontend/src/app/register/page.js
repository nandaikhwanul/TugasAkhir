"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import RegisterAlumni from "../register/alumni";
import RegisterPerusahaan from "../register/perusahaan";

export default function RegisterPage() {
  const [mode, setMode] = useState("alumni"); // "alumni" or "perusahaan"
  const [loading, setLoading] = useState(false);
  // Pastikan error dan success hanya string
  const [error, setErrorRaw] = useState("");
  const [success, setSuccessRaw] = useState("");
  const [agree, setAgree] = useState(false);
  const router = useRouter();

  // Setter yang memastikan hanya string yang di-set
  const setError = (val) => {
    if (typeof val === "string") {
      setErrorRaw(val);
    } else if (val && typeof val === "object") {
      // Coba ambil pesan error dari msg atau message
      if (typeof val.msg === "string") {
        setErrorRaw(val.msg);
      } else if (typeof val.message === "string") {
        setErrorRaw(val.message);
      } else {
        setErrorRaw("Terjadi kesalahan.");
      }
    } else {
      setErrorRaw("");
    }
  };

  const setSuccess = (val) => {
    if (typeof val === "string") {
      setSuccessRaw(val);
    } else if (val && typeof val === "object") {
      if (typeof val.msg === "string") {
        setSuccessRaw(val.msg);
      } else if (typeof val.message === "string") {
        setSuccessRaw(val.message);
      } else {
        setSuccessRaw("Berhasil.");
      }
    } else {
      setSuccessRaw("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFD] p-4">
      <div className="max-w-6xl w-full flex gap-8">
        <div className="flex-1 flex items-center justify-center">
          <Image
            src="/08.svg"
            alt="Register illustration"
            width={500}
            height={500}
            priority
          />
        </div>
        <div className="flex-1 max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Sign up
            </h2>
            <p className="text-gray-600">
              Buat akunmu disini untuk mengakses dan menemukan segala jenis
              lowongan !
            </p>
          </div>
          <div className="flex gap-4 mb-6">
            <button
              className={`flex-1 py-2 px-4 rounded-md font-semibold text-sm transition ${
                mode === "alumni"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              type="button"
              onClick={() => {
                setMode("alumni");
                setError("");
                setSuccess("");
              }}
              disabled={loading}
            >
              Alumni
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-md font-semibold text-sm transition ${
                mode === "perusahaan"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              type="button"
              onClick={() => {
                setMode("perusahaan");
                setError("");
                setSuccess("");
              }}
              disabled={loading}
            >
              Perusahaan
            </button>
          </div>
          {error && (
            <div className="text-red-500 mb-4 text-sm text-center">
              {typeof error === 'string' ? error : 'Terjadi kesalahan'}
            </div>
          )}
          {success && (
            <div className="text-green-600 mb-4 text-sm text-center">
              {typeof success === 'string' ? success : 'Berhasil'}
            </div>
          )}
          {mode === "alumni" ? (
            <RegisterAlumni
              loading={loading}
              setLoading={setLoading}
              error={error}
              setError={setError}
              success={success}
              setSuccess={setSuccess}
              agree={agree}
              setAgree={setAgree}
              router={router}
            />
          ) : (
            <RegisterPerusahaan
              loading={loading}
              setLoading={setLoading}
              error={error}
              setError={setError}
              success={success}
              setSuccess={setSuccess}
              agree={agree}
              setAgree={setAgree}
              router={router}
            />
          )}
          <p className="text-center text-sm text-gray-600 mt-4">
            Sudah punya akun?{" "}
            <a href="/login" className="text-blue-600">
              Login di sini
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
