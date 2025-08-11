"use client";
import React, { useEffect, useRef, useState } from "react";

/**
 * Loader modal: tampil sebagai modal dengan backdrop semi-transparan gelap.
 * Loader tetap handle delay 2s + fade out 400ms sebelum onFinish.
 * Modal tidak bisa di-close manual, pointerEvents diaktifkan agar tidak bisa klik ke bawah.
 */
const Loader = ({ onFinish }) => {
  const [closing, setClosing] = useState(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!finishedRef.current) {
        setClosing(true);
        setTimeout(() => {
          if (!finishedRef.current && onFinish) {
            finishedRef.current = true;
            onFinish();
          }
        }, 400);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center items-center transition-opacity duration-400`}
      style={{
        minHeight: "100vh",
        minWidth: "100vw",
        pointerEvents: "auto", // modal: block interaction below
        background: closing
          ? "rgba(30,30,40,0.5)"
          : "rgba(30,30,40,0.5)", // modal backdrop
        opacity: closing ? 0 : 1,
      }}
    >
      <div className="relative flex flex-col justify-center items-center bg-white rounded-2xl shadow-2xl w-[120px] h-[120px] pointer-events-auto">
        <div className="absolute left-0 top-0 w-full h-full flex justify-center items-center">
          <div className="relative w-[80px] h-[80px]">
            <div className="absolute w-[80px] h-[80px] rounded-full border border-transparent border-b-4 border-b-[#ff8df9] animate-[rotate1_2s_linear_infinite]" />
            <div className="absolute w-[80px] h-[80px] rounded-full border border-transparent border-b-4 border-b-[#ff416a] animate-[rotate2_2s_linear_infinite]" />
            <div className="absolute w-[80px] h-[80px] rounded-full border border-transparent border-b-4 border-b-[#00ffff] animate-[rotate3_2s_linear_infinite]" />
            <div className="absolute w-[80px] h-[80px] rounded-full border border-transparent border-b-4 border-b-[#fcb737] animate-[rotate4_2s_linear_infinite]" />
          </div>
        </div>
        <div className="relative z-10 mt-[90px] text-gray-700 text-sm font-semibold text-center">Loading...</div>
      </div>
      <style jsx>{`
        @keyframes rotate1 {
          from {
            transform: rotateX(50deg) rotateZ(110deg);
          }
          to {
            transform: rotateX(50deg) rotateZ(470deg);
          }
        }
        @keyframes rotate2 {
          from {
            transform: rotateX(20deg) rotateY(50deg) rotateZ(20deg);
          }
          to {
            transform: rotateX(20deg) rotateY(50deg) rotateZ(380deg);
          }
        }
        @keyframes rotate3 {
          from {
            transform: rotateX(40deg) rotateY(130deg) rotateZ(450deg);
          }
          to {
            transform: rotateX(40deg) rotateY(130deg) rotateZ(90deg);
          }
        }
        @keyframes rotate4 {
          from {
            transform: rotateX(70deg) rotateZ(270deg);
          }
          to {
            transform: rotateX(70deg) rotateZ(630deg);
          }
        }
        .animate-\[rotate1_2s_linear_infinite\] {
          animation: rotate1 2s linear infinite;
        }
        .animate-\[rotate2_2s_linear_infinite\] {
          animation: rotate2 2s linear infinite;
        }
        .animate-\[rotate3_2s_linear_infinite\] {
          animation: rotate3 2s linear infinite;
        }
        .animate-\[rotate4_2s_linear_infinite\] {
          animation: rotate4 2s linear infinite;
        }
        .transition-opacity {
          transition-property: opacity;
        }
        .duration-400 {
          transition-duration: 400ms;
        }
      `}</style>
    </div>
  );
};

export default Loader;
