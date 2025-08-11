// src/app/profile/alumni/alumniUpdate/ClientProfileForm.js (Client Component)
"use client";

import { useState, useEffect } from "react";

function getTokenFromCookie(name = "token") {
  if (typeof document === "undefined") return null;
  // kode sama seperti kamu
}

export default function ClientProfileForm() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getTokenFromCookie();
    if (!token) return; // redirect ke login atau handle error

    fetch("ttps://tugasakhir-production-6c6c.up.railway.app/alumni/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setLoading(false);
      });
  }, []);

  const handleUpdate = async (data) => {
    const token = getTokenFromCookie();
    await fetch("ttps://tugasakhir-production-6c6c.up.railway.app/alumni/me/profil", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    // update UI atau kasih feedback
  };

  if (loading) return <div>Loading...</div>;

  return (
    <form onSubmit={e => {
      e.preventDefault();
      const data = {/* ambil data dari input */};
      handleUpdate(data);
    }}>
      {/* form input sesuai profile */}
    </form>
  );
}
