export async function GET(req) {
  // Daftar skill berdasarkan jurusan/prodi di Polnep (manual, statis)
  // Sumber: https://polnep.ac.id/akademik/program-studi/
  // Skill disusun agar relevan untuk dropdown alumni
  const skills = [
    // Teknik Sipil
    "Manajemen Proyek Konstruksi",
    "Perancangan Struktur Bangunan",
    "Survey dan Pemetaan",
    "Teknik Jalan dan Jembatan",
    "Estimasi Biaya Konstruksi",
    "AutoCAD",
    "Teknik Gambar Bangunan",
    // Teknik Mesin
    "Perancangan Mesin",
    "Teknik Pemesinan",
    "CAD/CAM",
    "Pengelasan",
    "Teknik Otomotif",
    "Maintenance Mesin",
    // Teknik Elektro
    "Instalasi Listrik",
    "PLC (Programmable Logic Controller)",
    "Elektronika Industri",
    "Teknik Tenaga Listrik",
    "Perawatan Peralatan Listrik",
    // Teknik Informatika
    "Pemrograman Web",
    "Pemrograman Mobile",
    "Database (SQL/NoSQL)",
    "Jaringan Komputer",
    "UI/UX Design",
    "Cloud Computing",
    "Cyber Security",
    // Akuntansi
    "Akuntansi Keuangan",
    "Perpajakan",
    "Audit",
    "SAP/Accurate/Software Akuntansi",
    "Manajemen Keuangan",
    // Administrasi Bisnis
    "Manajemen Bisnis",
    "Administrasi Perkantoran",
    "Public Speaking",
    "Digital Marketing",
    "Korespondensi Bisnis",
    // Agribisnis
    "Manajemen Agribisnis",
    "Teknologi Pertanian",
    "Pengolahan Hasil Pertanian",
    "Pemasaran Hasil Pertanian",
    // Budidaya Tanaman Perkebunan
    "Budidaya Kelapa Sawit",
    "Teknik Perkebunan",
    "Manajemen Perkebunan",
    // Budidaya Perikanan
    "Budidaya Ikan Air Tawar",
    "Manajemen Kolam",
    "Teknologi Pakan Ikan",
    // Teknologi Hasil Perikanan
    "Pengolahan Hasil Perikanan",
    "Quality Control Perikanan",
    // Teknik Kimia
    "Analisis Laboratorium",
    "Teknologi Pengolahan Kimia",
    "Manajemen Limbah Industri",
    // Pariwisata/Perhotelan
    "Manajemen Perhotelan",
    "Tata Boga",
    "Tata Graha",
    "Front Office",
    "Event Organizer",
    // Bahasa Inggris
    "Penerjemahan",
    "Public Speaking (English)",
    "Teaching English",
    // Lainnya
    "Manajemen SDM",
    "Kewirausahaan",
    "Desain Grafis",
    "Fotografi",
    "Video Editing"
  ];

  return new Response(
    JSON.stringify({ skills }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
}
