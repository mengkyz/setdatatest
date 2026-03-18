'use client'

import { useState } from 'react';
import { fetchStocksData } from './actions';

export default function Home() {
  const [stocks, setStocks] = useState(['', '', '']);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // เพิ่ม State สำหรับจัดการ Tab (ค่าเริ่มต้นเป็นหน้าปันผล)
  const [activeTab, setActiveTab] = useState<'ca' | 'news'>('ca');

  const handleInputChange = (index: number, value: string) => {
    const newStocks = [...stocks];
    newStocks[index] = value;
    setStocks(newStocks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults([]);
    
    const data = await fetchStocksData(stocks);
    setResults(data);
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // ฟังก์ชันจัดฟอร์แมตวันที่และเวลาสำหรับตารางข่าว
  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { 
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header & Input Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">ค้นหาข้อมูลหุ้น (ปันผล & ข่าวสาร)</h1>
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

        {/* Global Tabs Menu */}
        {results.length > 0 && (
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('ca')}
              className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'ca' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                  ) : (
                    <>
                      {/* --- Tab: Corporate Action --- */}
                      {activeTab === 'ca' && (
                        result.caData.length === 0 ? (
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
                                {result.caData.map((item: any, i: number) => (
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
                        )
                      )}

                      {/* --- Tab: News --- */}
                      {activeTab === 'news' && (
                        result.newsData.length === 0 ? (
                          <div className="text-gray-500">ไม่มีข้อมูลข่าวสารในช่วง 5 ปีที่ผ่านมา</div>
                        ) : (
                          <div className="overflow-x-auto h-[400px] overflow-y-auto">
                            <table className="w-full text-left text-sm text-gray-600 relative">
                              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b sticky top-0 shadow-sm z-10">
                                <tr>
                                  <th className="px-4 py-3 whitespace-nowrap">วันและเวลา</th>
                                  <th className="px-4 py-3">แหล่งที่มา</th>
                                  <th className="px-4 py-3">หัวข้อข่าว</th>
                                </tr>
                              </thead>
                              <tbody>
                                {result.newsData.map((item: any, i: number) => (
                                  <tr key={i} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(item.datetime)}</td>
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                      <span className={`px-2 py-1 rounded text-xs ${item.source === 'SEC' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {item.source}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <a 
                                        href={item.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-blue-600 hover:text-blue-800 hover:underline"
                                      >
                                        {item.headline}
                                      </a>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )
                      )}
                    </>
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