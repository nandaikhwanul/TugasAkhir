"use client";
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Navbar from "../navbar/page";
import { useRouter } from "next/navigation";
import { getTokenFromSessionStorage } from "../sessiontoken";

// Helper: get userId and role from token (assume JWT, decode base64 payload)
function getUserFromToken() {
  const token = getTokenFromSessionStorage();
  if (!token) return { id: null, role: null, name: null, avatar: null, username: null };
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.userId || payload.id || payload._id || null,
      role: payload.role || null,
      name: payload.name || payload.nama || null,
      avatar: payload.avatar || null,
      username: payload.username || null,
    };
  } catch (e) {
    return { id: null, role: null, name: null, avatar: null, username: null };
  }
}
function getUserIdFromToken() {
  return getUserFromToken().id;
}
function getUserRoleFromToken() {
  return getUserFromToken().role;
}

// Badge color by role
const ROLE_BADGE = {
  alumni: { color: "bg-blue-100 text-blue-700 border-blue-400", label: "Alumni" },
  perusahaan: { color: "bg-green-100 text-green-700 border-green-400", label: "Perusahaan" },
  admin: { color: "bg-red-100 text-red-700 border-red-400", label: "Admin" },
};

function timeAgo(date) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = Math.floor((now - d) / 1000); // in seconds
  if (diff < 60) return "Baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} hari lalu`;
  return d.toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" });
}

// Dummy sidebar data (not from API)
const DUMMY_TRENDING = [
  { id: 1, title: "Tips Lolos Interview di Startup", comments: 12 },
  { id: 3, title: "Polling: Setuju Tidak WFH Permanen?", comments: 25 },
];
const DUMMY_EVENTS = [
  { id: 1, name: "Job Fair 2024", date: "2024-07-10" },
  { id: 2, name: "Webinar: Karir di IT", date: "2024-07-15" },
];
const DUMMY_CONTRIBUTORS = [
  { id: 1, name: "Siti Rahmawati", avatar: "/avatar2.png", points: 120 },
  { id: 2, name: "Andi Pratama", avatar: "/avatar1.png", points: 90 },
];
const DUMMY_JOBS = [
  { id: 1, title: "Backend Developer", company: "PT Sukses Makmur" },
  { id: 2, title: "UI/UX Designer", company: "PT Kreatif Digital" },
];

function ForumSidebar() {
  return (
    <aside className="w-full md:w-80 flex-shrink-0 px-0 md:px-4 mb-8 md:mb-0">
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <h3 className="font-semibold text-lg mb-2">🔥 Trending Topics</h3>
        <ul>
          {DUMMY_TRENDING.map((topic) => (
            <li key={topic.id} className="mb-2 flex items-center">
              <span className="truncate flex-1 text-black">{topic.title}</span>
              <span className="ml-2 text-xs text-black">{topic.comments} komentar</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <h3 className="font-semibold text-lg mb-2">📅 Event Terdekat</h3>
        <ul>
          {DUMMY_EVENTS.map((event) => (
            <li key={event.id} className="mb-2 flex items-center">
              <span className="flex-1 text-black">{event.name}</span>
              <span className="ml-2 text-xs text-black">{event.date}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <h3 className="font-semibold text-lg mb-2">🏆 Top Contributor</h3>
        <ul>
          {DUMMY_CONTRIBUTORS.map((c) => (
            <li key={c.id} className="mb-2 flex items-center">
              <img src={c.avatar} alt={c.name} className="w-7 h-7 rounded-full mr-2" />
              <span className="flex-1 text-black">{c.name}</span>
              <span className="ml-2 text-xs text-blue-600 font-bold">{c.points} pts</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="font-semibold text-lg mb-2">💼 Lowongan Rekomendasi</h3>
        <ul>
          {DUMMY_JOBS.map((job) => (
            <li key={job.id} className="mb-2">
              <span className="font-medium text-black">{job.title}</span>
              <span className="ml-1 text-xs text-black">({job.company})</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

// Custom hook to generate unique keys for tags
function useTagKeys(tags) {
  return useMemo(() => {
    const tagCount = {};
    return (tags || []).map((tag, idx) => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
      return `${tag}-${idx}`;
    });
  }, [tags]);
}

// Like post API helper
async function likeForumPost(postId) {
  const token = getTokenFromSessionStorage();
  if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");
  const res = await fetch(`https://tugasakhir-production-6c6c.up.railway.app/forum/posts/${postId}/like`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (data?.message === "You have already liked this post") {
      throw new Error("Anda sudah melakukan like pada post ini");
    }
    throw new Error(data?.message || "Gagal melakukan like");
  }
  return await res.json();
}

// Unlike post API helper
async function unlikeForumPost(postId) {
  const token = getTokenFromSessionStorage();
  if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");
  const res = await fetch(`https://tugasakhir-production-6c6c.up.railway.app/forum/posts/${postId}/unlike`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (data?.message === "You have not liked this post") {
      throw new Error("Anda belum melakukan like pada post ini");
    }
    throw new Error(data?.message || "Gagal melakukan unlike");
  }
  return await res.json();
}

// Save post API helper
async function saveForumPost(postId) {
  const token = getTokenFromSessionStorage();
  if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");
  const res = await fetch(`https://tugasakhir-production-6c6c.up.railway.app/forum/posts/${postId}/save`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (data?.message === "You have already saved this post") {
      throw new Error("Anda sudah menyimpan post ini");
    }
    throw new Error(data?.message || "Gagal menyimpan post");
  }
  return await res.json();
}

// Unsave post API helper
async function unsaveForumPost(postId) {
  const token = getTokenFromSessionStorage();
  if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");
  const res = await fetch(`https://tugasakhir-production-6c6c.up.railway.app/forum/posts/${postId}/unsave`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (data?.message === "You have not saved this post") {
      throw new Error("Anda belum menyimpan post ini");
    }
    throw new Error(data?.message || "Gagal batal simpan post");
  }
  return await res.json();
}

// Pin/Unpin/Highlight/Unhighlight API helpers
async function pinForumPost(postId) {
  const token = getTokenFromSessionStorage();
  if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");
  const res = await fetch(`https://tugasakhir-production-6c6c.up.railway.app/forum/posts/${postId}/pin`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message || "Gagal melakukan pin");
  }
  return await res.json();
}
async function unpinForumPost(postId) {
  const token = getTokenFromSessionStorage();
  if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");
  const res = await fetch(`https://tugasakhir-production-6c6c.up.railway.app/forum/posts/${postId}/unpin`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message || "Gagal melakukan unpin");
  }
  return await res.json();
}
async function highlightForumPost(postId) {
  const token = getTokenFromSessionStorage();
  if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");
  const res = await fetch(`https://tugasakhir-production-6c6c.up.railway.app/forum/posts/${postId}/highlight`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message || "Gagal melakukan highlight");
  }
  return await res.json();
}
async function unhighlightForumPost(postId) {
  const token = getTokenFromSessionStorage();
  if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");
  const res = await fetch(`https://tugasakhir-production-6c6c.up.railway.app/forum/posts/${postId}/unhighlight`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message || "Gagal melakukan unhighlight");
  }
  return await res.json();
}

// API helper: create forum comment
async function createForumComment({ postId, content }) {
  const token = getTokenFromSessionStorage();
  if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");
  const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/forum/comments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      postId,
      content,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message || "Gagal mengirim komentar");
  }
  return await res.json();
}

// API helper: get comments by postId (new endpoint)
// Only return: _id, alumni, content, parent, createdAt, updatedAt, replies (if any)
async function getCommentsByPostId(postId) {
  const token = getTokenFromSessionStorage();
  if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");
  const res = await fetch(`https://tugasakhir-production-6c6c.up.railway.app/forum/comments/post/${postId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message || "Gagal mengambil komentar");
  }
  // Only return the required fields for each comment
  const data = await res.json();
  function mapCommentFields(comment) {
    return {
      _id: comment._id,
      alumni: comment.alumni,
      content: comment.content,
      parent: comment.parent,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      replies: Array.isArray(comment.replies)
        ? comment.replies.map(mapCommentFields)
        : [],
    };
  }
  return {
    ...data,
    data: Array.isArray(data.data)
      ? data.data.map(mapCommentFields)
      : [],
  };
}

// PostCard with like button (update like without refresh)
function PostCard({ post, onClick, onLikeToggle, likeLoading, onPinToggle, pinLoading, userRole }) {
  const author = post.alumni || {};
  const badge = ROLE_BADGE[author.role] || ROLE_BADGE["alumni"];
  const categoryName = typeof post.category === "object" && post.category !== null
    ? post.category.name
    : post.category;
  const tagKeys = useTagKeys(post.tags);
  const [localLikeLoading, setLocalLikeLoading] = useState(false);
  const isLikeLoading = typeof likeLoading === "boolean" ? likeLoading : localLikeLoading;
  const [localPinLoading, setLocalPinLoading] = useState(false);
  const isPinLoading = typeof pinLoading === "boolean" ? pinLoading : localPinLoading;

  const handleLikeClick = async (e) => {
    e.stopPropagation();
    if (isLikeLoading) return;
    setLocalLikeLoading(true);
    if (onLikeToggle) {
      await onLikeToggle(post._id || post.id, post.liked);
    }
    setLocalLikeLoading(false);
  };

  const handlePinClick = async (e) => {
    e.stopPropagation();
    if (isPinLoading) return;
    setLocalPinLoading(true);
    if (onPinToggle) {
      await onPinToggle(post._id || post.id, post.pinned);
    }
    setLocalPinLoading(false);
  };

  return (
    <div
      className={`relative bg-white rounded-xl shadow p-5 mb-5 cursor-pointer hover:shadow-lg transition border ${post.pinned ? "border-yellow-400" : "border-transparent"}`}
      onClick={onClick}
    >
      {post.pinned && (
        <span className="absolute top-3 right-3 bg-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded font-semibold z-10">
          📌 Pinned
        </span>
      )}
      {post.highlighted && (
        <span className="absolute top-3 left-3 bg-pink-100 text-pink-700 text-xs px-2 py-1 rounded font-semibold z-10">
          Highlight
        </span>
      )}
      {userRole === "admin" && (
        <button
          className={`absolute top-3 right-20 flex items-center gap-1 text-xs px-2 py-1 rounded border border-yellow-400 bg-yellow-50 text-yellow-700 font-semibold z-20 ${isPinLoading ? "opacity-60 cursor-not-allowed" : "hover:bg-yellow-100"}`}
          onClick={handlePinClick}
          disabled={isPinLoading}
          style={{ minWidth: 60 }}
        >
          {post.pinned ? "Unpin" : "Pin"}
        </button>
      )}
      <div className="flex items-center mb-2">
        <img src={author.avatar || "/avatar1.png"} alt={author.name || "Alumni"} className="w-10 h-10 rounded-full mr-3" />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{author.name || "Alumni"}</span>
            <span className={`border px-2 py-0.5 rounded text-xs font-medium ${badge.color}`}>
              {badge.label}
            </span>
          </div>
          <span className="text-xs text-black">@{author.username || ""}</span>
        </div>
      </div>
      <div className="font-bold text-lg mb-1 text-black">{post.title}</div>
      <div className="text-black text-sm mb-2 line-clamp-2">{post.summary}</div>
      <div className="flex flex-wrap gap-2 mb-2">
        {(post.tags || []).map((tag, idx) => (
          <span key={tagKeys[idx]} className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded">{tag}</span>
        ))}
      </div>
      <div className="flex items-center text-xs text-black gap-4">
        <span>💬 {post.comments} komentar</span>
        <button
          className={`flex items-center gap-1 text-xs ${post.liked ? "text-blue-600 font-bold" : "text-black"} ${isLikeLoading ? "opacity-60 cursor-not-allowed" : ""}`}
          onClick={handleLikeClick}
          disabled={isLikeLoading}
          style={{ background: "none", border: "none", padding: 0, margin: 0 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill={post.liked ? "#2563eb" : "none"} viewBox="0 0 24 24" stroke={post.liked ? "#2563eb" : "currentColor"}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 9V5a3 3 0 00-6 0v4m-2 0a2 2 0 00-2 2v7a2 2 0 002 2h8a2 2 0 002-2v-7a2 2 0 00-2-2H6z" /></svg>
          {post.liked ? "Unlike" : "Like"}
          <span className="ml-1">({post.likes})</span>
        </button>
        <span>🕒 {timeAgo(post.createdAt)}</span>
      </div>
      {categoryName && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded font-medium">
          {categoryName}
        </div>
      )}
    </div>
  );
}

function PostDetail({
  post,
  onBack,
  onLikeToggle,
  likeLoading,
  onSaveToggle,
  saveLoading,
  onPinToggle,
  pinLoading,
  onHighlightToggle,
  highlightLoading,
  userRole,
}) {
  const author = post.alumni || {};
  const badge = ROLE_BADGE[author.role] || ROLE_BADGE["alumni"];

  // State for comments, loading, error, and input
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState(null);
  const [commentInput, setCommentInput] = useState("");
  const [commentSending, setCommentSending] = useState(false);
  const [commentSendError, setCommentSendError] = useState(null);

  // Get user info for posting comment
  const user = getUserFromToken();

  // Fetch comments for this post (NEW: use /forum/comments/post/:id)
  useEffect(() => {
    let ignore = false;
    async function fetchComments() {
      setCommentsLoading(true);
      setCommentsError(null);
      try {
        const postId = post._id || post.id;
        const res = await getCommentsByPostId(postId);
        if (!ignore) {
          setComments(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        if (!ignore) setCommentsError(err.message || "Gagal mengambil komentar");
      } finally {
        if (!ignore) setCommentsLoading(false);
      }
    }
    fetchComments();
    return () => { ignore = true; };
  }, [post._id, post.id]);

  const categoryName = typeof post.category === "object" && post.category !== null
    ? post.category.name
    : post.category;

  const tagKeys = useTagKeys(post.tags);

  const userId = getUserIdFromToken();
  const isSaved = Array.isArray(post.savedBy) && userId ? post.savedBy.includes(userId) : false;

  const handleSaveClick = async () => {
    if (saveLoading) return;
    if (onSaveToggle) {
      await onSaveToggle(post._id || post.id, isSaved, true);
    }
  };

  const handleLikeClick = async () => {
    if (likeLoading) return;
    if (onLikeToggle) {
      await onLikeToggle(post._id || post.id, post.liked, true);
    }
  };

  const [localPinLoading, setLocalPinLoading] = useState(false);
  const isPinLoading = typeof pinLoading === "boolean" ? pinLoading : localPinLoading;
  const handlePinClick = async () => {
    if (isPinLoading) return;
    setLocalPinLoading(true);
    if (onPinToggle) {
      await onPinToggle(post._id || post.id, post.pinned, true);
    }
    setLocalPinLoading(false);
  };

  const [localHighlightLoading, setLocalHighlightLoading] = useState(false);
  const isHighlightLoading = typeof highlightLoading === "boolean" ? highlightLoading : localHighlightLoading;
  const handleHighlightClick = async () => {
    if (isHighlightLoading) return;
    setLocalHighlightLoading(true);
    if (onHighlightToggle) {
      await onHighlightToggle(post._id || post.id, post.highlighted, true);
    }
    setLocalHighlightLoading(false);
  };

  // Handle comment form submit
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentInput.trim() || commentSending) return;
    setCommentSending(true);
    setCommentSendError(null);
    try {
      const res = await createForumComment({
        postId: post._id || post.id,
        content: commentInput.trim(),
      });
      if (res && res.data) {
        setComments((prev) => [
          {
            _id: res.data._id,
            alumni: res.data.alumni,
            content: res.data.content,
            parent: res.data.parent,
            createdAt: res.data.createdAt || new Date(),
            updatedAt: res.data.updatedAt || res.data.createdAt || new Date(),
            replies: res.data.replies || [],
          },
          ...prev,
        ]);
        setCommentInput("");
      } else {
        setCommentInput("");
      }
    } catch (err) {
      setCommentSendError(err.message || "Gagal mengirim komentar");
    } finally {
      setCommentSending(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <button onClick={onBack} className="mb-4 text-blue-600 hover:underline text-sm">&larr; Kembali ke daftar topik</button>
      <div className="flex items-center mb-3">
        <img src={author.avatar || "/avatar1.png"} alt={author.name || "Alumni"} className="w-12 h-12 rounded-full mr-4" />
        <div>
          <div className="flex items-center gap-2">
            <a href={author.profileUrl || "#"} className="font-semibold hover:underline">{author.name || "Alumni"}</a>
            <span className={`border px-2 py-0.5 rounded text-xs font-medium ${badge.color}`}>
              {badge.label}
            </span>
          </div>
          <span className="text-xs text-black">@{author.username || ""}</span>
        </div>
      </div>
      <div className="font-bold text-2xl mb-2 text-black">{post.title}</div>
      <div className="text-black mb-3">{post.content}</div>
      <div className="flex flex-wrap gap-2 mb-3">
        {(post.tags || []).map((tag, idx) => (
          <span key={tagKeys[idx]} className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded">{tag}</span>
        ))}
      </div>
      <div className="flex items-center gap-4 mb-4">
        <button
          className={`flex items-center gap-1 text-sm ${post.liked ? "text-blue-600 font-bold" : "text-black"} ${likeLoading ? "opacity-60 cursor-not-allowed" : ""}`}
          onClick={handleLikeClick}
          disabled={likeLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill={post.liked ? "#2563eb" : "none"} viewBox="0 0 24 24" stroke={post.liked ? "#2563eb" : "currentColor"}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 9V5a3 3 0 00-6 0v4m-2 0a2 2 0 00-2 2v7a2 2 0 002 2h8a2 2 0 002-2v-7a2 2 0 00-2-2H6z" /></svg>
          {post.liked ? "Unlike" : "Like"}
          <span className="ml-1">({post.likes})</span>
        </button>
        <button
          className={`flex items-center gap-1 text-sm ${isSaved ? "text-yellow-600 font-bold" : "text-black"} ${saveLoading ? "opacity-60 cursor-not-allowed" : ""}`}
          onClick={handleSaveClick}
          disabled={saveLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill={isSaved ? "#eab308" : "none"} viewBox="0 0 24 24" stroke={isSaved ? "#eab308" : "currentColor"}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5v14l7-7 7 7V5a2 2 0 00-2-2H7a2 2 0 00-2 2z" /></svg>
          {isSaved ? "Disimpan" : "Save"}
        </button>
        <button className="flex items-center gap-1 text-sm text-black">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 8a3 3 0 11-6 0 3 3 0 016 0zm-3 5a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          Share
        </button>
        {userRole === "admin" && (
          <>
            <button
              className={`flex items-center gap-1 text-sm px-2 py-1 rounded border border-yellow-400 bg-yellow-50 text-yellow-700 font-semibold ${isPinLoading ? "opacity-60 cursor-not-allowed" : "hover:bg-yellow-100"}`}
              onClick={handlePinClick}
              disabled={isPinLoading}
              style={{ minWidth: 60 }}
            >
              {post.pinned ? "Unpin" : "Pin"}
            </button>
            <button
              className={`flex items-center gap-1 text-sm px-2 py-1 rounded border border-pink-400 bg-pink-50 text-pink-700 font-semibold ${isHighlightLoading ? "opacity-60 cursor-not-allowed" : "hover:bg-pink-100"}`}
              onClick={handleHighlightClick}
              disabled={isHighlightLoading}
              style={{ minWidth: 80 }}
            >
              {post.highlighted ? "Unhighlight" : "Highlight"}
            </button>
          </>
        )}
        {post.pinned && (
          <span className="flex items-center gap-1 text-yellow-600 text-sm font-semibold">
            📌 Pinned
          </span>
        )}
        {post.highlighted && (
          <span className="flex items-center gap-1 text-pink-600 text-sm font-semibold">
            🌟 Highlight
          </span>
        )}
      </div>
      {post.likeError && (
        <div className="text-red-600 text-sm mb-2">{post.likeError}</div>
      )}
      {post.saveError && (
        <div className="text-red-600 text-sm mb-2">{post.saveError}</div>
      )}
      {categoryName === "Polling" && (
        <div className="mb-4">
          <div className="font-semibold mb-2 text-black">Polling: Apakah kalian setuju dengan WFH permanen?</div>
          <div className="flex gap-4">
            <button className="bg-blue-100 text-blue-700 px-3 py-1 rounded">Setuju</button>
            <button className="bg-gray-100 text-black px-3 py-1 rounded">Tidak Setuju</button>
          </div>
        </div>
      )}
      {categoryName === "Lowongan" && (
        <div className="mb-4">
          <a href="#" className="text-blue-600 underline text-sm">Lihat detail lowongan (PDF)</a>
        </div>
      )}
      <div className="mt-6">
        <div className="font-semibold mb-2 text-black">Komentar</div>
        {commentsLoading ? (
          <div className="text-black text-sm mb-2">Memuat komentar...</div>
        ) : commentsError ? (
          <div className="text-red-600 text-sm mb-2">{commentsError}</div>
        ) : (
          <CommentList comments={comments} />
        )}
        <form className="mt-3 flex gap-2" onSubmit={handleCommentSubmit}>
          <input
            type="text"
            className="flex-1 border rounded px-3 py-2 text-sm"
            placeholder="Tulis komentar... (bisa @mention)"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            disabled={commentSending}
          />
          <button
            type="submit"
            className={`bg-blue-600 text-white px-4 py-2 rounded text-sm ${commentSending ? "opacity-60 cursor-not-allowed" : ""}`}
            disabled={commentSending || !commentInput.trim()}
          >
            {commentSending ? "Mengirim..." : "Kirim"}
          </button>
        </form>
        {commentSendError && (
          <div className="text-red-600 text-sm mt-2">{commentSendError}</div>
        )}
      </div>
    </div>
  );
}

// CommentList expects: _id, alumni, content, parent, createdAt, updatedAt, replies
function CommentList({ comments }) {
  return (
    <div>
      {comments.map((c) => (
        <div key={c._id || c.id} className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <img src={c.alumni?.avatar || "/avatar1.png"} alt={c.alumni?.name || "User"} className="w-7 h-7 rounded-full" />
            <span className="font-semibold text-sm text-black">{c.alumni?.name || "User"}</span>
            <span className={`border px-2 py-0.5 rounded text-xs font-medium ${ROLE_BADGE[c.alumni?.role]?.color || ""}`}>
              {ROLE_BADGE[c.alumni?.role]?.label}
            </span>
            <span className="text-xs text-black">{timeAgo(c.createdAt)}</span>
          </div>
          <div className="ml-9 text-sm text-black">{c.content}</div>
          {c.replies && c.replies.length > 0 && (
            <div className="ml-9 mt-2 border-l-2 border-gray-100 pl-3">
              <CommentList comments={c.replies} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const CATEGORY_OPTIONS = [
  { value: "", label: "Semua Kategori", icon: <svg className="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg> },
  { value: "Karir", label: "Karir", icon: <svg className="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0-1.104.896-2 2-2s2 .896 2 2-.896 2-2 2-2-.896-2-2zm0 0V7m0 4v4m0 0H8m4 0h4" /></svg> },
  { value: "Lowongan", label: "Lowongan", icon: <svg className="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v4a1 1 0 001 1h3v2a1 1 0 001 1h4a1 1 0 001-1v-2h3a1 1 0 001-1V7a1 1 0 00-1-1H4a1 1 0 00-1 1z" /></svg> },
  { value: "Polling", label: "Polling", icon: <svg className="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6a2 2 0 114 0v6m-4 0h4" /></svg> },
];

function ForumMain() {
  const [sort, setSort] = useState("terbaru");
  const [selectedPost, setSelectedPost] = useState(null);
  const [category, setCategory] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [likeLoading, setLikeLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [highlightLoading, setHighlightLoading] = useState(false);
  const router = useRouter();

  const { id: userId, role: userRole } = getUserFromToken();

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      setFetchError(null);
      try {
        const token = getTokenFromSessionStorage();
        if (!token) {
          setFetchError("Token tidak ditemukan. Silakan login ulang.");
          setPosts([]);
          setLoading(false);
          return;
        }
        const params = [];
        if (category) params.push(`category=${encodeURIComponent(category)}`);
        const url = `https://tugasakhir-production-6c6c.up.railway.app/forum/posts${params.length ? "?" + params.join("&") : ""}`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error("Gagal mengambil data forum");
        }
        const data = await res.json();
        if (data && Array.isArray(data.data)) {
          setPosts(
            data.data.map((p) => {
              const likedByArr = Array.isArray(p.likedBy) ? p.likedBy : [];
              const liked = userId ? likedByArr.includes(userId) : false;
              const savedByArr = Array.isArray(p.savedBy) ? p.savedBy : [];
              return {
                ...p,
                liked,
                likeError: null,
                likedBy: likedByArr,
                savedBy: savedByArr,
                saveError: null,
                pinError: null,
                highlightError: null,
              };
            })
          );
        } else {
          setPosts([]);
        }
      } catch (err) {
        setFetchError(err.message || "Gagal mengambil data forum");
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
    // eslint-disable-next-line
  }, [category, userId]);

  const sortedPosts = useMemo(() => {
    let arr = [...posts];
    if (sort === "terbaru") {
      arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === "populer") {
      arr.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    } else if (sort === "banyak-dibalas") {
      arr.sort((a, b) => (b.replies || 0) - (a.replies || 0));
    }
    arr.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    return arr;
  }, [posts, sort]);

  const handleCreatePost = () => {
    router.push("/forumAlumni/buatPost");
  };

  const handleLikeToggle = useCallback(
    async (postId, isLiked, fromDetail = false) => {
      setLikeLoading(true);
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          (p._id || p.id) === postId
            ? {
                ...p,
                likeError: null,
              }
            : p
        )
      );
      try {
        if (!isLiked) {
          await likeForumPost(postId);
          setPosts((prevPosts) =>
            prevPosts.map((p) => {
              if ((p._id || p.id) === postId) {
                let likedByArr = Array.isArray(p.likedBy) ? [...p.likedBy] : [];
                if (userId && !likedByArr.includes(userId)) likedByArr.push(userId);
                return {
                  ...p,
                  liked: true,
                  likes: (p.likes || 0) + 1,
                  likeError: null,
                  likedBy: likedByArr,
                };
              }
              return p;
            })
          );
        } else {
          await unlikeForumPost(postId);
          setPosts((prevPosts) =>
            prevPosts.map((p) => {
              if ((p._id || p.id) === postId) {
                let likedByArr = Array.isArray(p.likedBy) ? p.likedBy.filter((id) => id !== userId) : [];
                return {
                  ...p,
                  liked: false,
                  likes: (p.likes || 0) > 0 ? p.likes - 1 : 0,
                  likeError: null,
                  likedBy: likedByArr,
                };
              }
              return p;
            })
          );
        }
        if (fromDetail && selectedPost && (selectedPost._id || selectedPost.id) === postId) {
          setSelectedPost((prev) => {
            if (!prev) return prev;
            let likedByArr = Array.isArray(prev.likedBy) ? [...prev.likedBy] : [];
            if (!isLiked) {
              if (userId && !likedByArr.includes(userId)) likedByArr.push(userId);
            } else {
              likedByArr = likedByArr.filter((id) => id !== userId);
            }
            return {
              ...prev,
              liked: !isLiked,
              likes: !isLiked
                ? (prev.likes || 0) + 1
                : (prev.likes || 0) > 0
                ? prev.likes - 1
                : 0,
              likeError: null,
              likedBy: likedByArr,
            };
          });
        }
      } catch (err) {
        setPosts((prevPosts) =>
          prevPosts.map((p) => {
            if ((p._id || p.id) === postId) {
              let liked = p.liked;
              let likedByArr = Array.isArray(p.likedBy) ? [...p.likedBy] : [];
              if (
                err.message === "Anda sudah melakukan like pada post ini" &&
                isLiked
              ) {
                liked = false;
                likedByArr = likedByArr.filter((id) => id !== userId);
              }
              return {
                ...p,
                likeError: err.message || (!isLiked ? "Gagal melakukan like" : "Gagal melakukan unlike"),
                liked,
                likedBy: likedByArr,
              };
            }
            return p;
          })
        );
        if (fromDetail && selectedPost && (selectedPost._id || selectedPost.id) === postId) {
          setSelectedPost((prev) => {
            if (!prev) return prev;
            let liked = prev.liked;
            let likedByArr = Array.isArray(prev.likedBy) ? [...prev.likedBy] : [];
            if (
              err.message === "Anda sudah melakukan like pada post ini" &&
              isLiked
            ) {
              liked = false;
              likedByArr = likedByArr.filter((id) => id !== userId);
            }
            return {
              ...prev,
              likeError: err.message || (!isLiked ? "Gagal melakukan like" : "Gagal melakukan unlike"),
              liked,
              likedBy: likedByArr,
            };
          });
        }
      } finally {
        setLikeLoading(false);
      }
    },
    [selectedPost, userId]
  );

  const handleSaveToggle = useCallback(
    async (postId, isSaved, fromDetail = false) => {
      setSaveLoading(true);
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          (p._id || p.id) === postId
            ? {
                ...p,
                saveError: null,
              }
            : p
        )
      );
      try {
        if (!isSaved) {
          await saveForumPost(postId);
          setPosts((prevPosts) =>
            prevPosts.map((p) => {
              if ((p._id || p.id) === postId) {
                let savedByArr = Array.isArray(p.savedBy) ? [...p.savedBy] : [];
                if (userId && !savedByArr.includes(userId)) savedByArr.push(userId);
                return {
                  ...p,
                  savedBy: savedByArr,
                  saveError: null,
                };
              }
              return p;
            })
          );
        } else {
          await unsaveForumPost(postId);
          setPosts((prevPosts) =>
            prevPosts.map((p) => {
              if ((p._id || p.id) === postId) {
                let savedByArr = Array.isArray(p.savedBy) ? p.savedBy.filter((id) => id !== userId) : [];
                return {
                  ...p,
                  savedBy: savedByArr,
                  saveError: null,
                };
              }
              return p;
            })
          );
        }
        if (fromDetail && selectedPost && (selectedPost._id || selectedPost.id) === postId) {
          setSelectedPost((prev) => {
            if (!prev) return prev;
            let savedByArr = Array.isArray(prev.savedBy) ? [...prev.savedBy] : [];
            if (!isSaved) {
              if (userId && !savedByArr.includes(userId)) savedByArr.push(userId);
            } else {
              savedByArr = savedByArr.filter((id) => id !== userId);
            }
            return {
              ...prev,
              savedBy: savedByArr,
              saveError: null,
            };
          });
        }
      } catch (err) {
        setPosts((prevPosts) =>
          prevPosts.map((p) => {
            if ((p._id || p.id) === postId) {
              let savedByArr = Array.isArray(p.savedBy) ? [...p.savedBy] : [];
              if (
                err.message === "Anda sudah menyimpan post ini" &&
                isSaved
              ) {
                savedByArr = savedByArr.filter((id) => id !== userId);
              }
              return {
                ...p,
                saveError: err.message || (!isSaved ? "Gagal menyimpan post" : "Gagal batal simpan post"),
                savedBy: savedByArr,
              };
            }
            return p;
          })
        );
        if (fromDetail && selectedPost && (selectedPost._id || selectedPost.id) === postId) {
          setSelectedPost((prev) => {
            if (!prev) return prev;
            let savedByArr = Array.isArray(prev.savedBy) ? [...prev.savedBy] : [];
            if (
              err.message === "Anda sudah menyimpan post ini" &&
              isSaved
            ) {
              savedByArr = savedByArr.filter((id) => id !== userId);
            }
            return {
              ...prev,
              saveError: err.message || (!isSaved ? "Gagal menyimpan post" : "Gagal batal simpan post"),
              savedBy: savedByArr,
            };
          });
        }
      } finally {
        setSaveLoading(false);
      }
    },
    [selectedPost, userId]
  );

  const handlePinToggle = useCallback(
    async (postId, isPinned, fromDetail = false) => {
      setPinLoading(true);
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          (p._id || p.id) === postId
            ? {
                ...p,
                pinError: null,
              }
            : p
        )
      );
      try {
        if (!isPinned) {
          await pinForumPost(postId);
          setPosts((prevPosts) =>
            prevPosts.map((p) => {
              if ((p._id || p.id) === postId) {
                return {
                  ...p,
                  pinned: true,
                  pinError: null,
                };
              }
              return p;
            })
          );
        } else {
          await unpinForumPost(postId);
          setPosts((prevPosts) =>
            prevPosts.map((p) => {
              if ((p._id || p.id) === postId) {
                return {
                  ...p,
                  pinned: false,
                  pinError: null,
                };
              }
              return p;
            })
          );
        }
        if (fromDetail && selectedPost && (selectedPost._id || selectedPost.id) === postId) {
          setSelectedPost((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              pinned: !isPinned,
              pinError: null,
            };
          });
        }
      } catch (err) {
        setPosts((prevPosts) =>
          prevPosts.map((p) => {
            if ((p._id || p.id) === postId) {
              return {
                ...p,
                pinError: err.message || (!isPinned ? "Gagal melakukan pin" : "Gagal melakukan unpin"),
              };
            }
            return p;
          })
        );
        if (fromDetail && selectedPost && (selectedPost._id || selectedPost.id) === postId) {
          setSelectedPost((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              pinError: err.message || (!isPinned ? "Gagal melakukan pin" : "Gagal melakukan unpin"),
            };
          });
        }
      } finally {
        setPinLoading(false);
      }
    },
    [selectedPost]
  );

  const handleHighlightToggle = useCallback(
    async (postId, isHighlighted, fromDetail = false) => {
      setHighlightLoading(true);
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          (p._id || p.id) === postId
            ? {
                ...p,
                highlightError: null,
              }
            : p
        )
      );
      try {
        if (!isHighlighted) {
          await highlightForumPost(postId);
          setPosts((prevPosts) =>
            prevPosts.map((p) => {
              if ((p._id || p.id) === postId) {
                return {
                  ...p,
                  highlighted: true,
                  highlightError: null,
                };
              }
              return p;
            })
          );
        } else {
          await unhighlightForumPost(postId);
          setPosts((prevPosts) =>
            prevPosts.map((p) => {
              if ((p._id || p.id) === postId) {
                return {
                  ...p,
                  highlighted: false,
                  highlightError: null,
                };
              }
              return p;
            })
          );
        }
        if (fromDetail && selectedPost && (selectedPost._id || selectedPost.id) === postId) {
          setSelectedPost((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              highlighted: !isHighlighted,
              highlightError: null,
            };
          });
        }
      } catch (err) {
        setPosts((prevPosts) =>
          prevPosts.map((p) => {
            if ((p._id || p.id) === postId) {
              return {
                ...p,
                highlightError: err.message || (!isHighlighted ? "Gagal melakukan highlight" : "Gagal melakukan unhighlight"),
              };
            }
            return p;
          })
        );
        if (fromDetail && selectedPost && (selectedPost._id || selectedPost.id) === postId) {
          setSelectedPost((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              highlightError: err.message || (!isHighlighted ? "Gagal melakukan highlight" : "Gagal melakukan unhighlight"),
            };
          });
        }
      } finally {
        setHighlightLoading(false);
      }
    },
    [selectedPost]
  );

  const handleSelectPost = (post) => {
    const found = posts.find((p) => (p._id || p.id) === (post._id || post.id));
    setSelectedPost(found || post);
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-black">Forum Alumni</h1>
            <button
              onClick={handleCreatePost}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Buat Post
            </button>
          </div>
          <div className="flex gap-2 mt-2 sm:mt-0">
            <select
              className="border rounded px-3 py-1 text-sm text-black"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              className="border rounded px-3 py-1 text-sm text-black"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="terbaru">Terbaru</option>
              <option value="populer">Populer</option>
              <option value="banyak-dibalas">Paling Banyak Dibalas</option>
            </select>
          </div>
        </div>
        {loading ? (
          <div className="text-center text-black py-10">Memuat data forum...</div>
        ) : fetchError ? (
          <div className="text-center text-red-600 py-10">{fetchError}</div>
        ) : !selectedPost ? (
          <div>
            {sortedPosts.length === 0 ? (
              <div className="text-center text-black py-10">Belum ada topik di kategori ini.</div>
            ) : (
              sortedPosts.map((post) => (
                <PostCard
                  key={post._id || post.id}
                  post={post}
                  onClick={() => handleSelectPost(post)}
                  onLikeToggle={handleLikeToggle}
                  likeLoading={likeLoading && post.liked !== undefined}
                  onPinToggle={handlePinToggle}
                  pinLoading={pinLoading && post.pinned !== undefined}
                  userRole={userRole}
                />
              ))
            )}
          </div>
        ) : (
          <PostDetail
            post={selectedPost}
            onBack={() => setSelectedPost(null)}
            onLikeToggle={handleLikeToggle}
            likeLoading={likeLoading}
            onSaveToggle={handleSaveToggle}
            saveLoading={saveLoading}
            onPinToggle={handlePinToggle}
            pinLoading={pinLoading}
            onHighlightToggle={handleHighlightToggle}
            highlightLoading={highlightLoading}
            userRole={userRole}
          />
        )}
      </div>
      <ForumSidebar />
    </div>
  );
}

export default function ForumAlumniPage() {
  return (
    <div className="min-h-screen bg-[#f4f7fa]">
      <Navbar />
      <div className="py-8 px-2 md:px-8">
        <ForumMain />
      </div>
    </div>
  );
}
