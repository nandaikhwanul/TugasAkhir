"use client";
import { useRouter, usePathname } from "next/navigation";

const NeuButtonBar = ({ onPreview, jobId }) => {
  const router = useRouter();
  const pathname = usePathname();

  // Tombol aktif ditentukan dari URL, bukan state lokal
  const isEdit = pathname === "/lowonganPerusahaanList/jobPosting";
  const isPreview = pathname === "/lowonganPerusahaanList";

  const handleEdit = () => {
    if (!isEdit) {
      router.push("/lowonganPerusahaanList/jobPosting");
    }
  };

  const handlePreview = () => {
    if (!isPreview) {
      router.push("/lowonganPerusahaanList");
    }
  };

  return (
    <div className="min-h-[100px] flex items-center justify-center gap-4">
      <button
        className={`px-6 py-2 font-medium w-fit transition-all shadow-[3px_3px_0px_black] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] ${
          isPreview
            ? "bg-indigo-700 text-white ring-2 ring-indigo-400"
            : "bg-indigo-500 text-white"
        }`}
        onClick={handlePreview}
        type="button"
      >
        Preview Lowongan
      </button>
      <button
        className={`px-6 py-2 font-medium w-fit transition-all shadow-[3px_3px_0px_black] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] ${
          isEdit
            ? "bg-green-700 text-white ring-2 ring-green-400"
            : "bg-green-500 text-white"
        }`}
        onClick={handleEdit}
        type="button"
      >
        Edit Lowongan
      </button>
    </div>
  );
};

export default NeuButtonBar;
