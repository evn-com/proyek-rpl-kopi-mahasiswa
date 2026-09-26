'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Users, CheckCircle, ArrowRight } from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';

export default function TableSelectPage() {
  const router = useRouter();
  const { tableNumber, setTableNumber } = useOrderStore();
  const [selectedTable, setSelectedTable] = useState<string | null>(tableNumber);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Generate 20 Tables data
  const tables = Array.from({ length: 20 }, (_, i) => {
    const num = (i + 1).toString().padStart(2, '0');
    return {
      id: `table-${num}`,
      number: `Meja ${num}`,
      capacity: i % 4 === 0 ? 6 : 4,
      isOccupied: i === 2 || i === 7, // Sample occupied tables
    };
  });

  const handleSelectTable = (num: string) => {
    setSelectedTable(num);
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (selectedTable) {
      setTableNumber(selectedTable);
      setShowConfirmModal(false);
      router.push('/menu');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      {/* Title Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-coffee-100 text-coffee-800 text-xs font-bold mb-2">
          <MapPin className="w-3.5 h-3.5 text-coffee-600" />
          <span>Langkah 1 dari 3: Pilih Meja</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-coffee-950">
          Pilih Nomor Meja Anda
        </h1>
        <p className="text-xs sm:text-sm text-coffee-700 mt-1 max-w-md mx-auto">
          Silakan periksa stiker nomor di sudut meja tempat Anda duduk saat ini, lalu pilih pada pilihan berikut:
        </p>
      </div>

      {/* Table Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3.5">
        {tables.map((tbl) => {
          const isCurrentSelected = tableNumber === tbl.number;
          return (
            <button
              key={tbl.id}
              onClick={() => handleSelectTable(tbl.number)}
              className={`relative p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-between min-h-[110px] group shadow-xs ${
                isCurrentSelected
                  ? 'border-coffee-700 bg-coffee-900 text-amber-200 ring-2 ring-coffee-600/50'
                  : tbl.isOccupied
                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-pointer hover:border-gray-300'
                  : 'border-coffee-200/80 bg-white text-coffee-950 hover:border-coffee-500 hover:bg-coffee-50/60'
              }`}
            >
              <div className="flex items-center justify-between w-full text-[10px] mb-2">
                <span className="flex items-center gap-1 opacity-80 font-medium">
                  <Users className="w-3 h-3" /> {tbl.capacity} Kursi
                </span>
                {tbl.isOccupied ? (
                  <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md">
                    Terisi
                  </span>
                ) : (
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                    Kosong
                  </span>
                )}
              </div>

              <div className="my-1">
                <span className="text-lg font-extrabold block group-hover:scale-105 transition-transform">
                  {tbl.number}
                </span>
              </div>

              {isCurrentSelected && (
                <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-300 font-bold">
                  <CheckCircle className="w-3 h-3 text-emerald-400" /> Meja Anda
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-cream rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-coffee-200 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-coffee-100 text-coffee-800 flex items-center justify-center mx-auto mb-4 border border-coffee-300/50">
              <MapPin className="w-7 h-7 text-coffee-700" />
            </div>

            <h3 className="text-xl font-bold text-coffee-950 mb-1">
              Konfirmasi {selectedTable}
            </h3>
            <p className="text-xs text-coffee-700 mb-6 leading-relaxed">
              Apakah Anda benar saat ini sedang duduk di <b>{selectedTable}</b>?
              Pesanan akan diantar langsung ke meja ini.
            </p>

            <div className="flex gap-2.5">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 rounded-xl border border-coffee-300 bg-white text-coffee-800 text-xs font-bold hover:bg-coffee-50 transition-colors"
              >
                Batal / Pilih Lain
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-coffee-800 to-coffee-950 text-amber-100 text-xs font-bold hover:brightness-110 transition-all flex items-center justify-center gap-1 shadow-md"
              >
                <span>Ya, Konfirmasi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
