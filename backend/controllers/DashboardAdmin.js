import Alumni from "../models/Alumni.js";
import Perusahaan from "../models/Perusahaan.js";
import Lowongan from "../models/Lowongan.js";

// Card Statistik: Total Alumni, Total Perusahaan, Total Lowongan
export const getDashboardStats = async (req, res) => {
    try {
        const totalAlumni = await Alumni.countDocuments();
        const totalPerusahaan = await Perusahaan.countDocuments();
        const totalLowongan = await Lowongan.countDocuments();

        res.json({
            totalAlumni,
            totalPerusahaan,
            totalLowongan
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Grafik: Alumni per Tahun (Line chart)
export const getAlumniPerTahun = async (req, res) => {
    try {
        // Asumsi field tahun_lulus di Alumni
        const data = await Alumni.aggregate([
            {
                $group: {
                    _id: "$tahun_lulus",
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        // Format: [{ tahun: 2020, count: 10 }, ...]
        res.json(
            data.map(item => ({
                tahun: item._id,
                count: item.count
            }))
        );
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Grafik: Alumni per Program Studi (Pie chart)
export const getAlumniPerJurusan = async (req, res) => {
    try {
        // Gunakan field program_studi di Alumni, bukan jurusan
        const data = await Alumni.aggregate([
            {
                $group: {
                    _id: "$program_studi",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);
        // Format: [{ program_studi: "Teknik Informatika", count: 20 }, ...]
        res.json(
            data.map(item => ({
                program_studi: item._id,
                count: item.count
            }))
        );
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Grafik: Status Lowongan (Doughnut chart)
export const getLowonganStatus = async (req, res) => {
    try {
        // Status yang diharapkan: 'open', 'closed', 'pending_verification', 'rejected'
        const possibleStatuses = ['open', 'closed', 'pending_verification', 'rejected'];
        const data = await Lowongan.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);
        // Buat hasil agar semua status selalu muncul, meskipun count 0
        const statusCountMap = {};
        data.forEach(item => {
            statusCountMap[item._id] = item.count;
        });
        const result = possibleStatuses.map(status => ({
            status,
            count: statusCountMap[status] || 0
        }));
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Grafik: Perusahaan per Bidang (Bar chart)
export const getPerusahaanPerBidang = async (req, res) => {
    try {
        // Asumsi field bidang_perusahaan di Perusahaan
        const data = await Perusahaan.aggregate([
            {
                $group: {
                    _id: "$bidang_perusahaan",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);
        // Format: [{ bidang: "Teknologi", count: 5 }, ...]
        res.json(
            data.map(item => ({
                bidang: item._id,
                count: item.count
            }))
        );
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
