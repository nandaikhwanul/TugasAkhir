import { redirect } from "next/navigation";
import "./globals.css"; // Pastikan global CSS diimpor

export default function Home() {
  redirect("/login");
  return null;
}
