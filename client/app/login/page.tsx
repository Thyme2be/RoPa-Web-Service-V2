"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username_or_email: username,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let message = "เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลและรหัสผ่าน";
        
        if (typeof errorData.detail === "string") {
          message = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          // Handle FastAPI's list of error objects
          message = errorData.detail.map((err: any) => err.msg).join(", ");
        }
        
        throw new Error(message);
      }

      const data = await response.json();

      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
      }

      router.push("/");
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <Image
          src="/images/login-bg.png"
          alt="background"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">

        {/* Logo */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-12 w-[280px] sm:w-[420px] h-[80px] sm:h-[130px] transition-all duration-300 pointer-events-none">
          <Image
            src="/images/netbay-logo.png"
            alt="Netbay Logo"
            fill
            sizes="(max-width: 640px) 280px, 420px"
            className="object-contain"
            priority
          />
        </div>

        {/* Liquid Glass Card */}
        <form onSubmit={handleSubmit} className="w-full rounded-2xl border border-white/70 p-8 sm:p-10 flex flex-col gap-4 relative shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] backdrop-blur-xl overflow-hidden">
          <h1 className="text-[36px] font-bold text-white text-center tracking-wide drop-shadow-md">
            เข้าสู่ระบบ
          </h1>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-white px-4 py-3 rounded-lg text-sm text-center font-medium drop-shadow-sm">
              {error}
            </div>
          )}

          {/* Input Email */}
          <div className="relative w-full">
            <input
              type="text"
              id="username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="peer block w-full bg-transparent border-x-0 border-t-0 border-b border-white/50 pb-2 pt-6 pr-8 text-white focus:outline-none focus:border-white focus:ring-0 transition-colors placeholder-transparent"
              placeholder="email"
            />
            <label
              htmlFor="username"
              className="absolute left-0 bottom-2 text-white pointer-events-none origin-left transition-all duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-110 peer-focus:-translate-y-7 peer-focus:scale-[0.85] peer-focus:text-white/90 peer-[&:not(:placeholder-shown)]:-translate-y-7 peer-[&:not(:placeholder-shown)]:scale-[0.85]"
            >
              อีเมลหรือชื่อบัญชีผู้ใช้
            </label>
            <div className="absolute right-0 bottom-2 text-white/90 pointer-events-none pb-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Input Password */}
          <div className="relative w-full">
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="peer block w-full bg-transparent border-x-0 border-t-0 border-b border-white/50 pb-2 pt-6 pr-8 text-white focus:outline-none focus:border-white focus:ring-0 transition-colors placeholder-transparent"
              placeholder="password"
            />
            <label
              htmlFor="password"
              className="absolute left-0 bottom-2 text-white pointer-events-none origin-left transition-all duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-110 peer-focus:-translate-y-7 peer-focus:scale-[0.85] peer-focus:text-white/90 peer-[&:not(:placeholder-shown)]:-translate-y-7 peer-[&:not(:placeholder-shown)]:scale-[0.85]"
            >
              รหัสผ่าน
            </label>
            <div className="absolute right-0 bottom-2 text-white/90 pointer-events-none pb-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[18px] h-[18px]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
              </svg>
            </div>
          </div>

          {/* Remember Me */}
          <label className="flex items-center mt-2 cursor-pointer group w-fit">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                name="remember"
                className="peer appearance-none w-[18px] h-[18px] border border-white/50 rounded-[4px] bg-white/5 outline-none cursor-pointer checked:bg-[#b32937] checked:border-white transition-all"
              />
              <svg className="absolute w-[11px] h-[11px] text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity drop-shadow-sm" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 7.5L5.5 11L12.5 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="ml-[10px] text-white text-[14px] select-none tracking-wide">
              จดจำการเข้าสู่ระบบ
            </span>
          </label>

          {/* Login Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full max-w-[200px] mt-3 py-[12px] rounded-xl text-white font-semibold text-[18px] bg-gradient-to-br from-[#80181e] to-[#1c0505] border border-white/70 shadow-[0_4px_15px_rgba(255,0,0,0.25)] hover:shadow-[0_4px_20px_rgba(255,0,0,0.4)] hover:from-[#c22831] hover:to-[#3b0a0a] transition-all flex justify-center items-center tracking-wider cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </div>

        </form>
      </div>
    </main>
  );
}
