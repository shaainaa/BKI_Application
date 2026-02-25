"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, CheckCircle, ChevronDown } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// --- DATA DUMMY UNTUK GRAFIK ---
const dataGrafik = [
  { name: "JAN", total: 10000 },
  { name: "FEB", total: 15000 },
  { name: "MAR", total: 35000 },
  { name: "APR", total: 55000 },
  { name: "MEI", total: 65000 },
  { name: "JUNI", total: 45000 },
  { name: "JULI", total: 15000 },
  { name: "AGS", total: 25000 },
  { name: "SEP", total: 50000 },
  { name: "OKT", total: 70000 },
  { name: "NOV", total: 85000 },
  { name: "DES", total: 100000 },
];

// --- DATA DUMMY UNTUK AKTIVITAS ---
const aktivitasTerbaru = [
  { id: 1, tipe: "pembayaran", judul: "Pembayaran PDS 92A-2025", status: "Telah dilakukan" },
  { id: 2, tipe: "pembayaran", judul: "Pembayaran PDS 92A-2025", status: "Telah dilakukan" },
  { id: 3, tipe: "pembayaran", judul: "Pembayaran PDS 92A-2025", status: "Telah dilakukan" },
  { id: 4, tipe: "persetujuan", judul: "Permohonan PDS 333B-2025", status: "Telah disetujui" },
];

export default function Dashboard() {
  const [namaUser, setNamaUser] = useState<string>("");

  // Ambil user dari localStorage saat component mount
  useEffect(() => {
    const userString = localStorage.getItem("user");

    if (userString) {
      try {
        const user = JSON.parse(userString);
        setNamaUser(user.nama);
      } catch (error) {
        console.error("Gagal membaca data user:", error);
      }
    }
  }, []);

  const formatYAxis = (tickItem: number) => {
    if (tickItem === 0) return "0";
    return `${tickItem / 1000}k`;
  };

  return (
    <div className="flex-1 bg-gray-50/50 p-8 min-h-screen font-sans text-[#1F2937]">
      
      {/* Sapaan User Dinamis */}
      <h1 className="text-4xl font-bold mb-8">
        Selamat datang, {namaUser || "User"}!
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- GRAFIK --- */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Nominal PDS Per Bulan</h2>
            <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
              Bulan <ChevronDown size={16} />
            </button>
          </div>

          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataGrafik} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818CF8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#818CF8" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />

                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#9CA3AF" }}
                  dy={10}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#9CA3AF" }}
                  tickFormatter={formatYAxis}
                />

                <Tooltip
                  formatter={(value: any) =>
                    new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(Number(value))
                  }
                  labelStyle={{ color: "#374151", fontWeight: "bold" }}
                />

                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#6366F1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- AKTIVITAS --- */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold mb-6">Aktivitas Terbaru</h2>

          <div className="space-y-5">
            {aktivitasTerbaru.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-xl flex items-center justify-center ${
                    item.tipe === "pembayaran"
                      ? "bg-[#A7F3D0] text-[#047857]"
                      : "bg-[#FDE68A] text-[#D97706]"
                  }`}
                >
                  {item.tipe === "pembayaran" ? (
                    <CreditCard size={24} />
                  ) : (
                    <CheckCircle size={24} />
                  )}
                </div>

                <div>
                  <p className="font-bold text-sm text-gray-800">{item.judul}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}