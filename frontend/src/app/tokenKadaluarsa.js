"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

function getTokenFromCookie() {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";").map((c) => c.trim());
  for (const c of cookies) {
    if (c.startsWith("token=")) {
      return decodeURIComponent(c.substring("token=".length));
    }
  }
  return null;
}

function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return true;
    // exp in seconds, Date.now() in ms
    return Date.now() >= payload.exp * 1000;
  } catch (e) {
    return true;
  }
}

export default function TokenKadaluarsaRedirect() {
  const router = useRouter();

  useEffect(() => {
    const token = getTokenFromCookie();
    if (!token || isTokenExpired(token)) {
      router.replace("/login");
    }
  }, [router]);

  return null;
}
