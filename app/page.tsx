'use client'

import { useState } from 'react';
import { fetchStocksData } from './actions';

export default function Home() {
  const [stocks, setStocks] = useState(['', '', '']);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (index: number, value: string) => {
    const newStocks = [...stocks];
    newStocks[index] = value;
    setStocks(newStocks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults([]);
    
    // เรียกใช้ Server Action
    const data = await fetchStocksData(stocks);
    setResults(data);
    setLoading(false);
  };

  // ฟังก์ชันจัดรูปแบบวันที่ให้ดูง่าย (เช่น 10/03/2026)
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header & Input Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">ค้นหาข้อมูลปันผล (Corporate Action)</h1>
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
              disabled={loading || stocks.every(s => s.trim() === '')}
              className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'กำลังค้นหา...' : 'ดึงข้อมูล'}
            </button>
          </form>
        </div>

        {/* Dashboard Results */}
        {results.length > 0 && (
          <div className="space-y-6">
            {results.map((result, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-blue-50 px-6 py-4 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-blue-900">หุ้น: {result.symbol}</h2>
                </div>
                
                <div className="p-6">
                  {!result.success ? (
                    <div className="text-red-500 font-medium">❌ ไม่สามารถดึงข้อมูลได้: {result.error}</div>
                  ) : result.data.length === 0 ? (
                    <div className="text-gray-500">ไม่มีประวัติ Corporate Action</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-3">ประเภท (CA)</th>
                            <th className="px-4 py-3">วันขึ้นเครื่องหมาย (X-Date)</th>
                            <th className="px-4 py-3">เงินปันผล (บาท)</th>
                            <th className="px-4 py-3">วันจ่ายเงิน (Payment Date)</th>
                            <th className="px-4 py-3">รายละเอียดเพิ่มเติม</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.data.map((item: any, i: number) => (
                            <tr key={i} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-900">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${item.caType === 'XD' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                                  {item.caType}
                                </span>
                              </td>
                              <td className="px-4 py-3">{formatDate(item.xdate)}</td>
                              <td className="px-4 py-3">{item.dividend ? item.dividend.toFixed(2) : '-'}</td>
                              <td className="px-4 py-3">{formatDate(item.paymentDate)}</td>
                              <td className="px-4 py-3 max-w-xs truncate" title={item.agenda || item.sourceOfDividend}>
                                {item.agenda || item.sourceOfDividend || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}