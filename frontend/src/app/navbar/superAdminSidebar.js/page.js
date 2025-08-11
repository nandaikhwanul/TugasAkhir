"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
// Import dashboard/page.js
import DashboardPage from "@/app/dashboard/page";

const sidebarLinks = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 13.5V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 9.75V10.5" />
      </svg>
    ),
  },
  {
    label: "Manajemen Admin",
    href: "/superadmin/admins",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
  {
    label: "Manajemen Perusahaan",
    href: "/superadmin/perusahaan",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
  },
  {
    label: "Manajemen User",
    href: "/superadmin/users",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    label: "Pengaturan",
    href: "/superadmin/settings",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
      </svg>
    ),
  },
];

export default function SuperAdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Hamburger animation state
  const [hamburgerActive, setHamburgerActive] = useState(false);

  // Sidebar animation classes
  const sidebarBase =
    "fixed top-0 left-0 z-50 h-screen bg-white shadow-lg flex flex-col items-center transition-all duration-300";
  const sidebarOpen = "w-20 translate-x-0";
  const sidebarClosed = "-translate-x-24 w-20";

  // Overlay for mobile
  const overlay =
    "fixed inset-0 z-40 transition-opacity duration-300";

  // Logout handler
  const handleLogout = (e) => {
    e.preventDefault();
    if (typeof document !== "undefined") {
      document.cookie =
        "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
      window.location.href = "/login";
    }
  };

  // Hamburger button classes
  const hamburgerClass = `flex flex-col justify-center items-center w-10 h-10 cursor-pointer group z-50`;
  const barClass = `h-1 w-7 my-0.5 rounded-full bg-blue-700 transition-all duration-300`;

  return (
    <div className="bg-gray-100 h-screen flex justify-start items-center relative">
      {/* Hamburger */}
      <button
        className={`${hamburgerClass} absolute top-6 left-6`}
        aria-label="Toggle Sidebar"
        onClick={() => {
          setOpen((o) => !o);
          setHamburgerActive((a) => !a);
        }}
        type="button"
      >
        <span
          className={`${barClass} ${
            hamburgerActive
              ? "rotate-45 translate-y-2 bg-blue-600"
              : ""
          }`}
        />
        <span
          className={`${barClass} ${
            hamburgerActive
              ? "opacity-0"
              : ""
          }`}
        />
        <span
          className={`${barClass} ${
            hamburgerActive
              ? "-rotate-45 -translate-y-2 bg-blue-600"
              : ""
          }`}
        />
      </button>

      {/* Overlay for mobile */}
      {open && (
        <div
          className={overlay}
          onClick={() => {
            setOpen(false);
            setHamburgerActive(false);
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${sidebarBase} ${
          open ? sidebarOpen : sidebarClosed
        }`}
        style={{
          minWidth: "5rem",
          maxWidth: "5rem",
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center rounded-md bg-white p-4 text-blue-600 mt-6 mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-8 w-8 cursor-pointer">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
          </svg>
        </div>
        {/* Navigation */}
        <nav className="flex-1 flex flex-col items-center space-y-10">
          <ul className="space-y-2">
            {sidebarLinks.map((link, idx) => (
              <li key={link.href} className="flex justify-center">
                <Link
                  href={link.href}
                  className={`p-3 rounded-lg flex items-center justify-center transition-all group
                    ${
                      pathname === link.href
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                    }
                  `}
                  title={link.label}
                >
                  {link.icon}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {/* Logout */}
        <div className="flex items-center justify-center pb-5 mt-auto">
          <form onSubmit={handleLogout}>
            <button
              type="submit"
              className="flex items-center justify-center p-3 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            </button>
          </form>
        </div>
      </aside>
      {/* Example usage of imported DashboardPage (for demonstration) */}
      {/* <DashboardPage /> */}
    </div>
  );
}
