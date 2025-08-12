"use client";

import React, { useEffect, useState } from "react";
import {
  FaPencilAlt,
  FaLinkedin,
  FaInstagram,
  FaGithub,
  FaTwitter,
  FaGlobe,
  FaLink,
  FaUser,
  FaBirthdayCake,
  FaGraduationCap,
  FaPhoneAlt,
  FaEnvelope,
  FaBook,
  FaStar,
  FaShareAlt,
  FaPlus,
  FaTrashAlt,
} from "react-icons/fa";
import { getTokenFromSessionStorage } from "../../../sessiontoken";

// Format date to "DD MMM, YYYY"
function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Mapping platform to icon
const socialIconMap = {
  linkedin: FaLinkedin,
  instagram: FaInstagram,
  github: FaGithub,
  twitter: FaTwitter,
  website: FaGlobe,
  globe: FaGlobe,
};

const socialIconColor = {
  linkedin: "#0A66C2",
  instagram: "#E4405F",
  github: "#181717",
  twitter: "#1DA1F2",
  website: "#10b981",
  globe: "#10b981",
};

function getSocialIcon(platform) {
  if (!platform) return FaLink;
  const key = platform.toLowerCase();
  if (socialIconMap[key]) return socialIconMap[key];
  // fallback for some common misspelling
  if (key.includes("linkedin")) return FaLinkedin;
  if (key.includes("instagram")) return FaInstagram;
  if (key.includes("github")) return FaGithub;
  if (key.includes("twitter")) return FaTwitter;
  if (key.includes("web")) return FaGlobe;
  return FaLink;
}

function getSocialIconColor(platform) {
  if (!platform) return "#6b7280"; // gray-400
  const key = platform.toLowerCase();
  if (socialIconColor[key]) return socialIconColor[key];
  if (key.includes("linkedin")) return "#0A66C2";
  if (key.includes("instagram")) return "#E4405F";
  if (key.includes("github")) return "#181717";
  if (key.includes("twitter")) return "#1DA1F2";
  if (key.includes("web")) return "#10b981";
  return "#6b7280";
}

// Default social platforms for new entry
const SOCIAL_PLATFORMS = [
  "LinkedIn",
  "Instagram",
  "Github",
  "Twitter",
  "Website",
];

export default function PersonalInfoCard() {
  const [alumni, setAlumni] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  // Skill search/autocomplete state
  const [allSkills, setAllSkills] = useState([]);
  const [skillInput, setSkillInput] = useState(""); // for controlled input
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);

  // Media sosial input state
  const [mediaSosialInput, setMediaSosialInput] = useState([]);

  // Fetch alumni data
  useEffect(() => {
    async function fetchAlumni() {
      setLoading(true);
      const token = getTokenFromSessionStorage();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/alumni/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch alumni data");
        const data = await res.json();

        // --- PATCH: If media_sosial missing, fetch separately ---
        let mediaSosial = [];
        if (!("media_sosial" in data) || !Array.isArray(data.media_sosial)) {
          try {
            const resMedsos = await fetch("https://tugasakhir-production-6c6c.up.railway.app/alumni/me/medsos", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (resMedsos.ok) {
              const medsosData = await resMedsos.json();
              if (Array.isArray(medsosData.media_sosial)) {
                mediaSosial = medsosData.media_sosial;
              }
            }
          } catch {}
        } else {
          mediaSosial = data.media_sosial;
        }

        const alumniObj = {
          ...data,
          media_sosial: Array.isArray(mediaSosial) ? mediaSosial : [],
        };

        setAlumni(alumniObj);
        setForm({
          nim: alumniObj.nim || "",
          nohp: alumniObj.nohp || "",
          program_studi: alumniObj.program_studi || "",
          tahun_lulus: alumniObj.tahun_lulus || "",
          email: alumniObj.email || "",
          tanggal_lahir: alumniObj.tanggal_lahir || "",
          skill: Array.isArray(alumniObj.skill) ? alumniObj.skill : [],
          media_sosial: Array.isArray(alumniObj.media_sosial) ? alumniObj.media_sosial : [],
        });
        setSkillInput(Array.isArray(alumniObj.skill) ? alumniObj.skill.join(", ") : "");
        setMediaSosialInput(Array.isArray(alumniObj.media_sosial) ? alumniObj.media_sosial : []);
      } catch (err) {
        setAlumni(null);
      }
      setLoading(false);
    }
    fetchAlumni();
  }, []);

  // Fetch all skills from API
  useEffect(() => {
    async function fetchSkills() {
      try {
        const res = await fetch("/api/skill");
        if (!res.ok) throw new Error("Failed to fetch skills");
        const data = await res.json();
        setAllSkills(Array.isArray(data.skills) ? data.skills : []);
      } catch (err) {
        setAllSkills([]);
      }
    }
    fetchSkills();
  }, []);

  // Handle input change for form
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    if (name === "skill") {
      setSkillInput(value);

      // Split input, trim, filter empty, update form.skill
      const skillsArr = value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      setForm((prev) => ({
        ...prev,
        skill: skillsArr,
      }));

      // Show suggestions if input is not empty
      if (value.trim().length > 0) {
        const lastSkill = value.split(",").pop().trim().toLowerCase();
        if (lastSkill.length > 0) {
          setSkillSuggestions(
            allSkills
              .filter(
                (s) =>
                  s.toLowerCase().includes(lastSkill) &&
                  !skillsArr.map((sk) => sk.toLowerCase()).includes(s.toLowerCase())
              )
              .slice(0, 8)
          );
          setShowSkillDropdown(true);
        } else {
          setSkillSuggestions([]);
          setShowSkillDropdown(false);
        }
      } else {
        setSkillSuggestions([]);
        setShowSkillDropdown(false);
      }
    } else if (type === "number") {
      setForm((prev) => ({
        ...prev,
        [name]: value ? Number(value) : "",
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Add skill from suggestion dropdown
  const handleSkillSuggestionClick = (skill) => {
    // Get current input, split, replace last with selected skill
    let current = skillInput;
    let arr = current.split(",");
    arr[arr.length - 1] = skill;
    // Remove duplicates
    const uniqueArr = Array.from(
      new Set(arr.map((s) => s.trim()).filter(Boolean))
    );
    setSkillInput(uniqueArr.join(", ") + ", ");
    setForm((prev) => ({
      ...prev,
      skill: uniqueArr,
    }));
    setSkillSuggestions([]);
    setShowSkillDropdown(false);
  };

  // Add new skill (not in suggestion) when pressing Enter or comma
  const handleSkillInputKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      let value = skillInput;
      let arr = value.split(",").map((s) => s.trim()).filter(Boolean);
      // Remove duplicates
      arr = Array.from(new Set(arr));
      setSkillInput(arr.join(", ") + ", ");
      setForm((prev) => ({
        ...prev,
        skill: arr,
      }));
      setSkillSuggestions([]);
      setShowSkillDropdown(false);
    } else if (e.key === "ArrowDown" && skillSuggestions.length > 0) {
      // Optionally: focus first suggestion
      e.preventDefault();
      const el = document.getElementById("skill-suggestion-0");
      if (el) el.focus();
    }
  };

  // Handle blur for skill input (hide dropdown after short delay)
  const handleSkillInputBlur = () => {
    setTimeout(() => {
      setShowSkillDropdown(false);
    }, 120);
  };

  // Handle media sosial input change
  const handleMediaSosialChange = (idx, field, value) => {
    setMediaSosialInput((prev) => {
      const updated = prev.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item
      );
      setForm((f) => ({
        ...f,
        media_sosial: updated,
      }));
      return updated;
    });
  };

  // Add new media sosial row
  const handleAddMediaSosial = () => {
    setMediaSosialInput((prev) => {
      const updated = [
        ...prev,
        { platform: "", url: "" },
      ];
      setForm((f) => ({
        ...f,
        media_sosial: updated,
      }));
      return updated;
    });
  };

  // Remove media sosial row
  const handleRemoveMediaSosial = (idx) => {
    setMediaSosialInput((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      setForm((f) => ({
        ...f,
        media_sosial: updated,
      }));
      return updated;
    });
  };

  // Handle edit button for Personal Info
  const handleEdit = () => {
    setEditMode(true);
    setFormError("");
    setFormSuccess("");
  };

  // Handle cancel edit
  const handleCancel = () => {
    setEditMode(false);
    setFormError("");
    setFormSuccess("");
    // Reset form to alumni data
    if (alumni) {
      setForm({
        nim: alumni.nim || "",
        nohp: alumni.nohp || "",
        program_studi: alumni.program_studi || "",
        tahun_lulus: alumni.tahun_lulus || "",
        email: alumni.email || "",
        tanggal_lahir: alumni.tanggal_lahir || "",
        skill: Array.isArray(alumni.skill) ? alumni.skill : [],
        media_sosial: Array.isArray(alumni.media_sosial) ? alumni.media_sosial : [],
      });
      setSkillInput(Array.isArray(alumni.skill) ? alumni.skill.join(", ") : "");
      setMediaSosialInput(Array.isArray(alumni.media_sosial) ? alumni.media_sosial : []);
    }
  };

  // Handle form submit (for Personal Info)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setSaving(true);

    // Validation
    if (
      !form.nim ||
      !form.nohp ||
      !form.program_studi ||
      !form.tahun_lulus ||
      !form.email
    ) {
      setFormError("Semua field wajib diisi.");
      setSaving(false);
      return;
    }

    const token = getTokenFromSessionStorage();
    if (!token) {
      setFormError("Token tidak ditemukan.");
      setSaving(false);
      return;
    }

    // Prepare payload
    let payload = {
      nim: form.nim,
      nohp: form.nohp,
      program_studi: form.program_studi,
      tahun_lulus: form.tahun_lulus,
      email: form.email,
      skill: form.skill,
      media_sosial: Array.isArray(form.media_sosial)
        ? form.media_sosial.filter((item) => item.platform && item.url)
        : [],
    };

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
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal update profil.");
      }
      // Refresh page after save
      window.location.reload();
      return;
    } catch (err) {
      setFormError(err.message || "Gagal update profil.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="h-full bg-gray-100 p-8 flex items-center justify-center">
        <span className="text-gray-500 flex items-center gap-2">
          <FaUser className="inline-block text-blue-500" /> Loading...
        </span>
      </div>
    );
  }

  if (!alumni) {
    return (
      <div className="h-full bg-gray-100 p-8 flex items-center justify-center">
        <span className="text-red-500 flex items-center gap-2">
          <FaUser className="inline-block text-red-500" /> Failed to load alumni data.
        </span>
      </div>
    );
  }

  // --- SOCIALS RENDERING ---
  const mediaSosial = Array.isArray(alumni.media_sosial) ? alumni.media_sosial : [];

  // Helper: break word utility for long text
  const breakWordClass = "break-words whitespace-pre-line";

  // Helper: icon for each field
  const fieldIcons = {
    nim: <FaUser className="text-blue-500 mr-2" />,
    tanggal_lahir: <FaBirthdayCake className="text-pink-400 mr-2" />,
    tahun_lulus: <FaGraduationCap className="text-green-500 mr-2" />,
    nohp: <FaPhoneAlt className="text-emerald-500 mr-2" />,
    email: <FaEnvelope className="text-orange-500 mr-2" />,
    program_studi: <FaBook className="text-indigo-500 mr-2" />,
    skill: <FaStar className="text-yellow-400 mr-2" />,
    media_sosial: <FaShareAlt className="text-blue-400 mr-2" />,
  };

  return (
    <div className="h-full p-0 flex items-start justify-center w-full">
      <div className="w-full max-w-none bg-white rounded-b-lg shadow-lg p-8 relative border border-gray-100">
        <div className="absolute top-5 right-5 z-10">
          {!editMode && (
            <button
              className="p-2 rounded-full bg-gray-50 hover:bg-gray-200 border border-gray-200 text-gray-400 hover:text-gray-600 transition"
              title="Edit Personal Info"
              onClick={handleEdit}
              disabled={editMode}
              tabIndex={-1}
              type="button"
            >
              <FaPencilAlt className="h-4 w-4 text-blue-500" />
            </button>
          )}
        </div>
        <h4 className="text-2xl text-gray-800 font-semibold mb-6 text-center flex items-center justify-center gap-2">
          <FaUser className="text-blue-300" /> Personal Info
        </h4>
        {formError && (
          <div className="bg-red-50 text-red-600 px-3 py-2 rounded mb-2 text-sm flex items-center gap-2 border border-red-100">
            <FaExclamationTriangle className="text-red-500" /> {formError}
          </div>
        )}
        {formSuccess && (
          <div className="bg-green-50 text-green-600 px-3 py-2 rounded mb-2 text-sm flex items-center gap-2 border border-green-100">
            <FaCheckCircle className="text-green-500" /> {formSuccess}
          </div>
        )}
        {!editMode ? (
          <ul className="mt-2 text-gray-700 space-y-2">
            <li className="flex items-center gap-2 py-1">
              {fieldIcons.nim}
              <span className="font-medium w-36">NIM</span>
              <span className={`flex-1 text-gray-700 ${breakWordClass}`}>{alumni.nim}</span>
            </li>
            <li className="flex items-center gap-2 py-1">
              {fieldIcons.tanggal_lahir}
              <span className="font-medium w-36">Birthday</span>
              <span className={`flex-1 text-gray-700 ${breakWordClass}`}>{formatDate(alumni.tanggal_lahir)}</span>
            </li>
            <li className="flex items-center gap-2 py-1">
              {fieldIcons.tahun_lulus}
              <span className="font-medium w-36">Graduation Year</span>
              <span className={`flex-1 text-gray-700 ${breakWordClass}`}>{alumni.tahun_lulus}</span>
            </li>
            <li className="flex items-center gap-2 py-1">
              {fieldIcons.nohp}
              <span className="font-medium w-36">Mobile</span>
              <span className={`flex-1 text-gray-700 ${breakWordClass}`}>{alumni.nohp}</span>
            </li>
            <li className="flex items-center gap-2 py-1">
              {fieldIcons.email}
              <span className="font-medium w-36">Email</span>
              <span className={`flex-1 text-gray-700 ${breakWordClass}`}>{alumni.email}</span>
            </li>
            <li className="flex items-center gap-2 py-1">
              {fieldIcons.program_studi}
              <span className="font-medium w-36">Program Studi</span>
              <span className={`flex-1 text-gray-700 ${breakWordClass}`}>{alumni.program_studi}</span>
            </li>
            <li className="flex items-start gap-2 py-1">
              {fieldIcons.skill}
              <span className="font-medium w-36 pt-1">Skills</span>
              <span className="flex-1 text-gray-700">
                <span className="flex flex-wrap gap-2">
                  {Array.isArray(alumni.skill) && alumni.skill.length > 0 ? (
                    alumni.skill.map((s, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                        style={{ maxWidth: "110px" }}
                      >
                        <FaStar className="text-yellow-400" />
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-300 text-sm">-</span>
                  )}
                </span>
              </span>
            </li>
            {/* Media Sosial */}
            <li className="flex items-center gap-2 py-1">
              {fieldIcons.media_sosial}
              <span className="font-medium w-36">Media Sosial</span>
              <span className="flex-1 flex items-center gap-2">
                {mediaSosial.length > 0 ? (
                  mediaSosial.map((item, idx) => {
                    const Icon = getSocialIcon(item.platform);
                    const color = getSocialIconColor(item.platform);
                    return (
                      <a
                        key={idx}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={item.platform}
                        className="hover:scale-110 transition"
                        style={{ color }}
                      >
                        <Icon className="w-5 h-5" />
                      </a>
                    );
                  })
                ) : (
                  <span className="text-gray-300 text-sm">-</span>
                )}
              </span>
            </li>
          </ul>
        ) : (
          <form className="mt-2 text-gray-700 space-y-3" onSubmit={handleSubmit} autoComplete="off">
            <div className="flex items-center gap-2 py-1">
              {fieldIcons.nim}
              <label className="font-medium w-36" htmlFor="nim">NIM</label>
              <input
                className={`flex-1 border border-gray-200 rounded px-2 py-1 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-200 ${breakWordClass}`}
                id="nim"
                name="nim"
                value={form.nim}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="flex items-center gap-2 py-1">
              {fieldIcons.nohp}
              <label className="font-medium w-36" htmlFor="nohp">Mobile</label>
              <input
                className={`flex-1 border border-gray-200 rounded px-2 py-1 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-200 ${breakWordClass}`}
                id="nohp"
                name="nohp"
                value={form.nohp}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="flex items-center gap-2 py-1">
              {fieldIcons.program_studi}
              <label className="font-medium w-36" htmlFor="program_studi">Program Studi</label>
              <input
                className={`flex-1 border border-gray-200 rounded px-2 py-1 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-200 ${breakWordClass}`}
                id="program_studi"
                name="program_studi"
                value={form.program_studi}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="flex items-center gap-2 py-1">
              {fieldIcons.tahun_lulus}
              <label className="font-medium w-36" htmlFor="tahun_lulus">Graduation Year</label>
              <input
                className={`flex-1 border border-gray-200 rounded px-2 py-1 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-200 ${breakWordClass}`}
                id="tahun_lulus"
                name="tahun_lulus"
                type="number"
                value={form.tahun_lulus}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="flex items-center gap-2 py-1">
              {fieldIcons.email}
              <label className="font-medium w-36" htmlFor="email">Email</label>
              <input
                className={`flex-1 border border-gray-100 rounded px-2 py-1 bg-gray-100 cursor-not-allowed text-gray-400 ${breakWordClass}`}
                id="email"
                name="email"
                type="email"
                value={form.email}
                readOnly
                disabled
              />
            </div>
            <div className="flex items-center gap-2 py-1 relative">
              {fieldIcons.skill}
              <label className="font-medium w-36" htmlFor="skill">Skills</label>
              <div className="flex-1 relative">
                <input
                  className={`w-full border border-gray-200 rounded px-2 py-1 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-200 ${breakWordClass}`}
                  id="skill"
                  name="skill"
                  value={skillInput}
                  onChange={handleInputChange}
                  onKeyDown={handleSkillInputKeyDown}
                  onBlur={handleSkillInputBlur}
                  placeholder="Cari skill, ketik lalu pilih, atau buat baru (pisahkan dengan koma)"
                  autoComplete="off"
                />
                {/* Dropdown suggestion */}
                {showSkillDropdown && skillSuggestions.length > 0 && (
                  <ul className="absolute z-20 left-0 right-0 bg-white border border-gray-100 rounded shadow mt-1 max-h-48 overflow-auto">
                    {skillSuggestions.map((s, idx) => (
                      <li
                        key={s}
                        id={`skill-suggestion-${idx}`}
                        tabIndex={0}
                        className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSkillSuggestionClick(s);
                        }}
                      >
                        <FaStar className="inline-block text-yellow-400 mr-2" />
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            {/* Media Sosial Edit */}
            <div className="flex items-start gap-2 py-1">
              {fieldIcons.media_sosial}
              <label className="font-medium w-36 pt-1">Media Sosial</label>
              <div className="flex-1 flex flex-col gap-2">
                {mediaSosialInput.length === 0 && (
                  <button
                    type="button"
                    className="flex items-center gap-1 text-gray-500 text-sm hover:underline"
                    onClick={handleAddMediaSosial}
                    tabIndex={0}
                  >
                    <FaPlus className="text-green-500" /> Tambah Media Sosial
                  </button>
                )}
                {mediaSosialInput.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      className="border border-gray-200 rounded px-2 py-1 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-200"
                      value={item.platform || ""}
                      onChange={e =>
                        handleMediaSosialChange(idx, "platform", e.target.value)
                      }
                      required
                    >
                      <option value="">Pilih Platform</option>
                      {SOCIAL_PLATFORMS.map((p) => (
                        <option key={p.toLowerCase()} value={p.toLowerCase()}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <input
                      className="border border-gray-200 rounded px-2 py-1 flex-1 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-200"
                      type="url"
                      placeholder="URL"
                      value={item.url || ""}
                      onChange={e =>
                        handleMediaSosialChange(idx, "url", e.target.value)
                      }
                      required
                    />
                    <button
                      type="button"
                      className="text-gray-400 hover:text-red-400 px-2 py-1"
                      onClick={() => handleRemoveMediaSosial(idx)}
                      tabIndex={0}
                      title="Hapus"
                    >
                      <FaTrashAlt className="text-red-500" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="flex items-center gap-1 text-gray-500 text-sm hover:underline mt-1"
                  onClick={handleAddMediaSosial}
                  tabIndex={0}
                >
                  <FaPlus className="text-green-500" /> Tambah Media Sosial
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-4 justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded text-sm transition"
                disabled={saving}
              >
                <FaPencilAlt className="text-white" />
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm transition"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// Helper icons for alert
function FaExclamationTriangle(props) {
  return (
    <svg
      className={props.className}
      width="1em"
      height="1em"
      viewBox="0 0 20 20"
      fill="currentColor"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l6.518 11.591c.75 1.334-.213 2.985-1.742 2.985H3.48c-1.53 0-2.492-1.651-1.742-2.985L8.257 3.1zm1.743.858L3.482 15.548c-.246.437.07.952.57.952h12.896c.5 0 .816-.515.57-.952L9.999 3.957zm-.002 7.043a1 1 0 112 0v2a1 1 0 11-2 0v-2zm1 5a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}
function FaCheckCircle(props) {
  return (
    <svg
      className={props.className}
      width="1em"
      height="1em"
      viewBox="0 0 20 20"
      fill="currentColor"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}
