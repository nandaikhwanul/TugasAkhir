"use client";
import React, { useState } from "react";

export default function KirimPesan() {
  const [pesan, setPesan] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Lakukan sesuatu dengan pesan, misal kirim ke backend
    alert(`Pesan terkirim: ${pesan}`);
    setPesan("");
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-semibold mb-6 text-center">Kirim Pesan</h2>
        <div className="mb-4">
          <label
            htmlFor="pesan"
            className="block text-gray-700 font-medium mb-2"
          >
            Pesan
          </label>
          <input
            type="text"
            id="pesan"
            name="pesan"
            value={pesan}
            onChange={(e) => setPesan(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Tulis pesan Anda di sini..."
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition"
        >
          Kirim
        </button>
      </form>
    </main>
  );
}
