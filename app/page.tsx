'use client'

import { useState } from 'react';
import CorporateActionTab from './components/CorporateActionTab';
import NewsTab from './components/NewsTab';

export default function Home() {
  const [stocks, setStocks] = useState(['', '', '']);
  const [searchedSymbols, setSearchedSymbols] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'ca' | 'news'>('ca');

  const handleInputChange = (index: number, value: string) => {
    const newStocks = [...stocks];
    newStocks[index] = value;
    setStocks(newStocks);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validSymbols = stocks.map(s => s.trim()).filter(s => s !== '');
    setSearchedSymbols(validSymbols);
    // ไม่ต้องเรียก fetch ที่นี่แล้ว เพราะปล่อยให้ Component จัดการตัวเอง
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Search Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">ค้นหาข้อมูลหุ้น</h1>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
            {stocks.map((stock, index) => (
              <div key={index} className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-600 mb-1">หุ้นตัวที่ {index + 1}</label>
                <input
                  type="text"
                  placeholder="เช่น PTG"
                  value={stock}
                  onChange={(e) => handleInputChange(index, e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={stocks.every(s => s.trim() === '')}
              className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              ค้นหา
            </button>
          </form>
        </div>

        {/* Global Tabs Menu */}
        {searchedSymbols.length > 0 && (
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('ca')}
              className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'ca' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ประวัติปันผล (Corporate Action)
            </button>
            <button
              onClick={() => setActiveTab('news')}
              className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'news' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ข่าวสารย้อนหลัง (News)
            </button>
          </div>
        )}

        {/* Render Components แบบแยกการโหลดข้อมูล */}
        {searchedSymbols.length > 0 && (
          <div className="relative">
            {/* ซ่อน Component แทนการลบทิ้ง เพื่อเก็บ Cache Data ไว้เวลาสลับแท็บไปมา */}
            <div className={activeTab === 'ca' ? 'block' : 'hidden'}>
              <CorporateActionTab symbols={searchedSymbols} isActive={activeTab === 'ca'} />
            </div>
            <div className={activeTab === 'news' ? 'block' : 'hidden'}>
              <NewsTab symbols={searchedSymbols} isActive={activeTab === 'news'} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}