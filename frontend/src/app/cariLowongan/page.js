"use client";
import FilterLowongan from "./filterLowongan/page";
import Navbar from "../navbar/page";
import TokenKadaluarsaRedirect from "../tokenKadaluarsa";

export default function FilterJobsSidebar() {
  return (
    <div>
      <TokenKadaluarsaRedirect />
      <Navbar />
      <div className="flex w-screen min-h-screen bg-gray-100 items-start pt-8 px-0 fixed left-0 top-0">
        {/* Sidebar tetap, tapi kosong */}
        <aside className="w-0" />
        <main className="flex-1 w-full relative p-10">
          {/* FilterLowongan lebar penuh kiri-kanan */}
          <FilterLowongan />
        </main>
      </div>
    </div>
  );
}
