"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { getTokenFromSessionStorage } from "../../sessiontoken";

// Data jurusan dan program studi
const JURUSAN_PROGRAM_STUDI = [
  {
    jurusan: "Jurusan Teknik Sipil",
    prodi: [
      "D-3 Teknik Sipil",
      "D-4 Perencanaan Perumahan dan Pemukiman",
      "D-4 Teknologi Rekayasa Konstruksi Jalan dan Jembatan",
      "D-3 Teknik Sipil (Kampus Kabupaten Kapuas Hulu)",
    ],
  },
  {
    jurusan: "Jurusan Teknik Mesin",
    prodi: [
      "D-1 Operator dan Peralatan Alat Berat",
      "D-3 Teknik Mesin",
      "D-4 Teknik Mesin (Konversi Energi)",
      "D-3 Teknik Mesin (Kampus Kabupaten Sanggau)",
    ],
  },
  {
    jurusan: "Jurusan Teknik Elektro",
    prodi: [
      "D-3 Teknik Listrik",
      "D-3 Teknik Informatika",
      "D-4 Teknologi Rekayasa Sistem Elektronika",
    ],
  },
  {
    jurusan: "Jurusan Administrasi Bisnis",
    prodi: [
      "D-3 Administrasi Bisnis",
      "D-4 Administrasi Negara",
      "D-4 Administrasi Bisnis Otomotif",
      "D-4 Pengelolaan Usaha Rekreasi",
    ],
  },
  {
    jurusan: "Jurusan Akuntansi",
    prodi: [
      "D-3 Akuntansi",
      "D-4 Akuntansi",
      "D-4 Akuntansi Perpajakan",
      "D-4 Perbankan dan Keuangan Digital",
      "D-4 Akuntansi Sektor Publik (Kampus Kabupaten Sukamara)",
      "D-3 Akuntansi (Kampus Kabupaten Sanggau)",
    ],
  },
  {
    jurusan: "Jurusan Teknologi Pertanian",
    prodi: [
      "D-4 Pengolahan Hasil Perkebunan Terpadu",
      "D-4 Manajemen Perkebunan",
      "D-4 Budidaya Tanaman Perkebunan",
      "D-3 Teknologi Pengolahan Hasil Perkebunan (Kampus Kabupaten Kapuas Hulu)",
      "D-3 Pengelolaan Hasil Perkebunan (Kampus Kabupaten Sanggau)",
    ],
  },
  {
    jurusan: "Jurusan Ilmu Kelautan dan Perikanan",
    prodi: [
      "D-3 Budidaya Perikanan",
      "D-3 Teknologi Penangkapan Ikan",
      "D-4 Pengolahan dan Penyimpanan Hasil Perikanan",
      "D-3 Teknologi Budidaya Perikanan (Kampus Kabupaten Kapuas Hulu)",
      "D-3 Budidaya Ikan (Kampus Kabupaten Sukamara)",
    ],
  },
  {
    jurusan: "Jurusan Arsitektur",
    prodi: [
      "D-3 Arsitektur",
      "D-4 Arsitektur Bangunan Gedung",
      "D-4 Desain Kawasan Binaan",
    ],
  },
];

// Daftar field yang ingin dicek/lengkapi (tanpa skill, skill di step 2)
// Tambahkan field email
const PROFILE_FIELDS = [
  { label: "Email", field: "email", placeholder: "Masukkan email Anda", type: "email" },
  { label: "Alamat", field: "alamat", placeholder: "Masukkan alamat lengkap" },
  { label: "No HP", field: "nohp", placeholder: "Masukkan nomor HP" },
  { label: "Program Studi", field: "program_studi", placeholder: "Masukkan program studi" },
  { label: "Tahun Lulus", field: "tahun_lulus", placeholder: "Masukkan tahun lulus (misal: 2023)", type: "number" },
  { label: "Tanggal Lahir", field: "tanggal_lahir", placeholder: "Pilih tanggal lahir", type: "date" },
];

// Step 2: Skill
const SKILL_API_URL = "/api/skill"; // Pastikan endpoint ini benar dan environment sama

export default function AlumniProfileForm() {
  // Step state
  const [step, setStep] = useState(1);

  // fields: seluruh data alumni (hasil GET)
  const [fields, setFields] = useState({});
  // inputFields: hanya field yang kosong (atau sedang diisi user)
  const [inputFields, setInputFields] = useState({});
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // State untuk double dropdown program studi
  const [selectedJurusan, setSelectedJurusan] = useState("");
  const [selectedProdi, setSelectedProdi] = useState("");

  // Skill state
  const [skillOptions, setSkillOptions] = useState([]);
  const [skillInput, setSkillInput] = useState(""); // input value for search/autocomplete
  const [filteredSkillOptions, setFilteredSkillOptions] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]); // array of selected skills
  const [skillError, setSkillError] = useState("");
  const [skillSuccess, setSkillSuccess] = useState("");
  const [skillLoading, setSkillLoading] = useState(false);
  const skillInputRef = useRef(null);
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);

  // Fetch alumni data on mount
  useEffect(() => {
    const fetchAlumni = async () => {
      setFetching(true);
      const token = getTokenFromSessionStorage();
      if (!token) {
        setFetching(false);
        return;
      }
      try {
        const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/alumni/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          setFetching(false);
          return;
        }
        const data = await res.json();
        setFields(data || {});
        // Siapkan inputFields hanya untuk field yang kosong/null/"" saja
        const emptyFields = {};
        PROFILE_FIELDS.forEach(({ field }) => {
          if (
            !data ||
            data[field] === undefined ||
            data[field] === null ||
            (typeof data[field] === "string" && data[field].trim() === "")
          ) {
            emptyFields[field] = "";
          }
        });
        setInputFields(emptyFields);

        // Step: jika semua field sudah terisi, langsung ke step 2 (skill)
        const allFilled = PROFILE_FIELDS.every(
          ({ field }) =>
            data &&
            data[field] !== undefined &&
            data[field] !== null &&
            (typeof data[field] !== "string" || data[field].trim() !== "")
        );
        if (allFilled) setStep(2);

        // Skill: set selectedSkills jika sudah ada di profil (array atau string)
        if (data && data.skill) {
          if (Array.isArray(data.skill)) {
            setSelectedSkills(data.skill);
          } else if (typeof data.skill === "string" && data.skill.trim() !== "") {
            setSelectedSkills([data.skill]);
          }
        }

        // Set initial jurusan/prodi jika sudah ada di data
        if (data && data.program_studi) {
          // Cari jurusan yang memuat program studi ini
          let foundJurusan = "";
          for (const jur of JURUSAN_PROGRAM_STUDI) {
            if (jur.prodi.includes(data.program_studi)) {
              foundJurusan = jur.jurusan;
              break;
            }
          }
          setSelectedJurusan(foundJurusan);
          setSelectedProdi(data.program_studi);
        }
      } catch (e) {
        // ignore
      } finally {
        setFetching(false);
      }
    };
    fetchAlumni();
  }, []);

  // Fetch skill options (dropdown) on step 2
  useEffect(() => {
    if (step !== 2) return;
    const fetchSkills = async () => {
      try {
        // Pastikan endpoint ini benar, tidak typo, dan environment sama (Next.js API route)
        const res = await fetch(SKILL_API_URL);
        if (!res.ok) {
          setSkillOptions([]);
          return;
        }
        const data = await res.json();
        // data bisa array of string, atau {skills: [...]}
        let skills = Array.isArray(data) ? data : data.skills || [];
        setSkillOptions(skills);
        setFilteredSkillOptions(skills);
      } catch (e) {
        setSkillOptions([]);
        setFilteredSkillOptions([]);
      }
    };
    fetchSkills();
  }, [step]);

  // Filter skill options as user types
  useEffect(() => {
    if (!skillInput) {
      setFilteredSkillOptions(skillOptions.filter(
        (opt) => !selectedSkills.includes(opt)
      ));
      return;
    }
    const lower = skillInput.toLowerCase();
    setFilteredSkillOptions(
      skillOptions.filter(
        (opt) =>
          opt.toLowerCase().includes(lower) &&
          !selectedSkills.includes(opt)
      )
    );
  }, [skillInput, skillOptions, selectedSkills]);

  // Progress calculation: berapa field yang sudah terisi (dari PROFILE_FIELDS)
  const progressPercent = useMemo(() => {
    if (!fields) return 0;
    let filled = 0;
    PROFILE_FIELDS.forEach(({ field }) => {
      if (
        fields[field] !== undefined &&
        fields[field] !== null &&
        (typeof fields[field] !== "string" || fields[field].trim() !== "")
      ) {
        filled += 1;
      }
    });
    return Math.round((filled / PROFILE_FIELDS.length) * 100);
  }, [fields]);

  // Validasi per field
  const validate = () => {
    let valid = true;
    const newErrors = {};
    PROFILE_FIELDS.forEach(({ field, label, type }) => {
      if (inputFields.hasOwnProperty(field)) {
        let value = inputFields[field];
        // Untuk program_studi, gunakan selectedProdi
        if (field === "program_studi") {
          value = selectedProdi;
        }
        if (!value || value.toString().trim() === "") {
          newErrors[field] = `${label} wajib diisi.`;
          valid = false;
        } else if (
          field === "email" &&
          !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value)
        ) {
          newErrors[field] = "Format email tidak valid.";
          valid = false;
        } else if (
          field === "nohp" &&
          !/^[0-9+\- ]{8,20}$/.test(value)
        ) {
          newErrors[field] = "Format nomor HP tidak valid.";
          valid = false;
        } else if (
          field === "tahun_lulus" &&
          (isNaN(Number(value)) || value.toString().length !== 4)
        ) {
          newErrors[field] = "Tahun lulus harus 4 digit angka.";
          valid = false;
        }
      }
    });
    // Validasi double dropdown
    if (inputFields.hasOwnProperty("program_studi")) {
      if (!selectedJurusan) {
        newErrors["program_studi"] = "Pilih jurusan terlebih dahulu.";
        valid = false;
      } else if (!selectedProdi) {
        newErrors["program_studi"] = "Pilih program studi.";
        valid = false;
      }
    }
    setErrors(newErrors);
    return valid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputFields((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // Handler untuk jurusan/prodi dropdown
  const handleJurusanChange = (e) => {
    const jurusan = e.target.value;
    setSelectedJurusan(jurusan);
    setSelectedProdi(""); // reset prodi
    setErrors((prev) => ({
      ...prev,
      program_studi: "",
    }));
    // Set inputFields.program_studi ke "" agar validasi jalan
    setInputFields((prev) => ({
      ...prev,
      program_studi: "",
    }));
  };

  const handleProdiChange = (e) => {
    const prodi = e.target.value;
    setSelectedProdi(prodi);
    setErrors((prev) => ({
      ...prev,
      program_studi: "",
    }));
    // Set inputFields.program_studi ke prodi terpilih
    setInputFields((prev) => ({
      ...prev,
      program_studi: prodi,
    }));
  };

  // PATCH alumni/me/profil hanya field yang diinput user
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setSuccess("");
    setErrors({});
    const token = getTokenFromSessionStorage();
    if (!token) {
      setErrors({ global: "Token tidak ditemukan. Silakan login ulang." });
      setLoading(false);
      return;
    }

    // Kirim hanya field yang diinput user (inputFields)
    let payload = { ...inputFields };
    // Untuk program_studi, pastikan ambil dari selectedProdi
    if (payload.hasOwnProperty("program_studi")) {
      payload.program_studi = selectedProdi;
    }
    // Remove _id, __v, createdAt, updatedAt, dsb jika ada
    ["_id", "__v", "createdAt", "updatedAt"].forEach((k) => delete payload[k]);

    try {
      const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/alumni/me/profil", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setErrors(data.errors || { global: data.message || "Gagal menyimpan data." });
      } else {
        setSuccess("Data alumni berhasil diperbarui!");
        // Update fields state supaya progress bar update
        setFields((prev) => ({
          ...prev,
          ...inputFields,
          program_studi: selectedProdi,
        }));
        // Kosongkan inputFields (karena sudah submit)
        setInputFields({});
        // Lanjut ke step 2 (skill)
        setStep(2);
      }
    } catch (err) {
      setErrors({ global: "Terjadi kesalahan pada server." });
    } finally {
      setLoading(false);
    }
  };

  // PATCH skill (staged, submit manual, array of skills)
  const handleSkillSubmit = async (e) => {
    e.preventDefault();
    setSkillError("");
    setSkillSuccess("");
    if (!selectedSkills || selectedSkills.length === 0) {
      setSkillError("Pilih minimal satu skill terlebih dahulu.");
      return;
    }
    setSkillLoading(true);
    const token = getTokenFromSessionStorage();
    if (!token) {
      setSkillError("Token tidak ditemukan. Silakan login ulang.");
      setSkillLoading(false);
      return;
    }
    try {
      // PATCH skill (array)
      const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/alumni/me/profil", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ skill: selectedSkills }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSkillError(data.message || "Gagal menyimpan skill.");
      } else {
        setSkillSuccess("Skill berhasil disimpan!");
        setFields((prev) => ({
          ...prev,
          skill: selectedSkills,
        }));
        // REFRESH PAGE setelah skill berhasil disimpan
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      }
    } catch (err) {
      setSkillError("Terjadi kesalahan pada server.");
    } finally {
      setSkillLoading(false);
    }
  };

  // Jika semua field sudah terisi, tidak perlu tampilkan form step 1
  const allFilled = useMemo(() => {
    return PROFILE_FIELDS.every(({ field }) =>
      fields[field] !== undefined &&
      fields[field] !== null &&
      (typeof fields[field] !== "string" || fields[field].trim() !== "")
    );
  }, [fields]);

  // Skill sudah diisi?
  const skillFilled = Array.isArray(fields.skill)
    ? fields.skill.length > 0
    : !!fields.skill;

  // Remove skill dari selectedSkills
  const handleRemoveSkill = (skill) => {
    setSelectedSkills((prev) => prev.filter((s) => s !== skill));
    setSkillError("");
    setSkillSuccess("");
  };

  // Add skill dari dropdown/autocomplete
  const handleSelectSkill = (skill) => {
    if (!selectedSkills.includes(skill)) {
      setSelectedSkills((prev) => [...prev, skill]);
      setSkillInput("");
      setShowSkillDropdown(false);
      setSkillError("");
      setSkillSuccess("");
      // Focus input lagi
      if (skillInputRef.current) skillInputRef.current.focus();
    }
  };

  // Add skill jika tekan Enter di input dan ada match
  const handleSkillInputKeyDown = (e) => {
    if (e.key === "Enter" && filteredSkillOptions.length > 0) {
      e.preventDefault();
      handleSelectSkill(filteredSkillOptions[0]);
    }
    if (e.key === "ArrowDown") {
      setShowSkillDropdown(true);
    }
  };

  // Hide dropdown jika klik di luar
  useEffect(() => {
    if (!showSkillDropdown) return;
    const handler = (e) => {
      if (
        skillInputRef.current &&
        !skillInputRef.current.parentNode.contains(e.target)
      ) {
        setShowSkillDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSkillDropdown]);

  // Helper: render input atau double dropdown untuk field
  const renderFieldInput = ({ label, field, placeholder, type }) => {
    if (field === "program_studi") {
      // Double dropdown jurusan & prodi
      return (
        <div className="mb-4" key={field}>
          <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="jurusan">
            Jurusan
          </label>
          {errors[field] && (
            <div className="mb-1 text-xs text-red-600">{errors[field]}</div>
          )}
          <select
            id="jurusan"
            name="jurusan"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition mb-2"
            value={selectedJurusan}
            onChange={handleJurusanChange}
            required
          >
            <option value="">Pilih Jurusan</option>
            {JURUSAN_PROGRAM_STUDI.map((j) => (
              <option key={j.jurusan} value={j.jurusan}>
                {j.jurusan}
              </option>
            ))}
          </select>
          <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor={field}>
            Program Studi
          </label>
          <select
            id={field}
            name={field}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
            value={selectedProdi}
            onChange={handleProdiChange}
            required
            disabled={!selectedJurusan}
          >
            <option value="">Pilih Program Studi</option>
            {selectedJurusan &&
              JURUSAN_PROGRAM_STUDI.find((j) => j.jurusan === selectedJurusan)?.prodi.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
          </select>
        </div>
      );
    }
    // Default: input biasa
    return (
      <div className="mb-4" key={field}>
        <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor={field}>
          {label}
        </label>
        {errors[field] && (
          <div className="mb-1 text-xs text-red-600">{errors[field]}</div>
        )}
        <input
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
          placeholder={placeholder}
          name={field}
          id={field}
          type={type || "text"}
          value={inputFields[field] || ""}
          onChange={handleChange}
          required
        />
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow space-y-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-700 font-medium">Lengkapi Profil</span>
          <span className="text-xs text-gray-500">{progressPercent}% lengkap</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {fetching ? (
        <div className="text-center text-gray-500 py-8">Memuat data...</div>
      ) : (
        <>
          {/* Step 1: Lengkapi profil */}
          {step === 1 && !allFilled ? (
            <form onSubmit={handleSubmit} autoComplete="off">
              {PROFILE_FIELDS.filter(({ field }) => inputFields.hasOwnProperty(field)).map(
                (fieldObj) => renderFieldInput(fieldObj)
              )}

              {errors.global && (
                <div className="mb-2 text-center text-sm font-medium rounded py-2 px-3 bg-red-50 text-red-600 border border-red-200">
                  {errors.global}
                </div>
              )}
              {success && (
                <div className="mb-2 text-center text-sm font-medium rounded py-2 px-3 bg-green-50 text-green-700 border border-green-200">
                  {success}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Menyimpan..." : "Simpan & Lanjut Skill"}
              </button>
            </form>
          ) : step === 2 ? (
            // Step 2: Pilih skill (autocomplete, multi, staged input)
            <form onSubmit={handleSkillSubmit} autoComplete="off">
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="skill">
                  Pilih Skill (bisa lebih dari satu)
                </label>
                {skillError && (
                  <div className="mb-1 text-xs text-red-600">{skillError}</div>
                )}
                <div className="relative">
                  <div className="flex flex-wrap gap-2 mb-1">
                    {selectedSkills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full"
                      >
                        {skill}
                        <button
                          type="button"
                          className="ml-1 text-blue-500 hover:text-red-500 focus:outline-none"
                          aria-label={`Hapus ${skill}`}
                          onClick={() => handleRemoveSkill(skill)}
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    ref={skillInputRef}
                    id="skill"
                    name="skill"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                    placeholder="Cari dan pilih skill, tekan Enter untuk memilih"
                    value={skillInput}
                    onChange={e => {
                      setSkillInput(e.target.value);
                      setShowSkillDropdown(true);
                      setSkillError("");
                      setSkillSuccess("");
                    }}
                    onFocus={() => setShowSkillDropdown(true)}
                    onKeyDown={handleSkillInputKeyDown}
                    autoComplete="off"
                  />
                  {showSkillDropdown && filteredSkillOptions.length > 0 && (
                    <ul className="absolute z-10 left-0 right-0 bg-white border border-gray-200 rounded shadow mt-1 max-h-40 overflow-auto">
                      {filteredSkillOptions.map((skill, idx) => (
                        <li
                          key={skill}
                          className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-black"
                          onMouseDown={e => {
                            e.preventDefault();
                            handleSelectSkill(skill);
                          }}
                        >
                          {skill}
                        </li>
                      ))}
                    </ul>
                  )}
                  {showSkillDropdown && filteredSkillOptions.length === 0 && skillInput.trim() !== "" && (
                    <div className="absolute z-10 left-0 right-0 bg-white border border-gray-200 rounded shadow mt-1 px-3 py-2 text-xs text-gray-500">
                      Tidak ada skill yang cocok.
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Pilih satu atau lebih skill utama Anda. Anda dapat mengubahnya nanti di profil.
                </div>
                {skillOptions.length === 0 && (
                  <div className="text-xs text-red-500 mt-2">
                    Tidak ada data skill. Pastikan API <code>/api/skill</code> sudah berjalan di environment yang sama dan tidak ada typo pada URL. Cek network tab untuk error detail.
                  </div>
                )}
              </div>
              {skillSuccess && (
                <div className="mb-2 text-center text-sm font-medium rounded py-2 px-3 bg-green-50 text-green-700 border border-green-200">
                  {skillSuccess}
                </div>
              )}
              <button
                type="submit"
                className="w-full py-2 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-60"
                disabled={skillLoading}
              >
                {skillLoading ? "Menyimpan..." : "Simpan Skill"}
              </button>
            </form>
          ) : (
            // Sudah lengkap semua
            <div className="text-center text-green-700 font-semibold py-8">
              Semua data profil sudah lengkap! 🎉
            </div>
          )}
        </>
      )}
    </div>
  );
}
