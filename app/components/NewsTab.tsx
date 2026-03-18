'use client'

import { useState, useEffect } from 'react';
import { fetchNews } from '@/app/actions/news';

export default function NewsTab({ symbols, isActive }: { symbols: string[], isActive: boolean }) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetchedState, setLastFetchedState] = useState('');

  // ค่า Default ของวันที่ (ย้อนหลัง 1 ปี)
  const today = new Date();
  const lastYear = new Date();
  lastYear.setFullYear(today.getFullYear() - 1);

  const [startDate, setStartDate] = useState(lastYear.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  const loadData = async () => {
    if (symbols.length === 0) return;
    setLoading(true);
    const data = await fetchNews(symbols, startDate, endDate);
    setResults(data);
    setLastFetchedState(`${symbols.join(',')}_${startDate}_${endDate}`);
    setLoading(false);
  };

  // ดึงข้อมูลอัตโนมัติเมื่อเข้ามาแท็บนี้ครั้งแรกสำหรับหุ้นตัวนั้นๆ
  useEffect(() => {
    const currentState = `${symbols.join(',')}_${startDate}_${endDate}`;
    if (isActive && currentState !== lastFetchedState && symbols.length > 0) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols, isActive]);

  const handleFilter = () => {
    loadData();
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('th-TH', { 
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  if (!isActive && results.length === 0) return null;

  return (
    <div className="mt-6 space-y-4">
      {/* ส่วนของ Date Filter */}
      <div className="flex flex-wrap items-end gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">ตั้งแต่วันที่</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">ถึงวันที่</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={handleFilter} disabled={loading} className="px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-md text-sm hover:bg-blue-200 disabled:opacity-50">
          กรองข้อมูล
        </button>
      </div>

      {loading && <div className="p-4 text-center text-gray-500 animate-pulse">กำลังดึงข้อมูลข่าว...</div>}

      {!loading && results.map((result, idx) => (
        <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-blue-50 px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-blue-900">หุ้น: {result.symbol} (ข่าวสาร)</h2>
          </div>
          <div className="p-6">
            {!result.success ? (
              <div className="text-red-500">❌ {result.error}</div>
            ) : result.newsData.length === 0 ? (
              <div className="text-gray-500">ไม่มีข้อมูลข่าวสารในช่วงเวลาที่เลือก</div>
            ) : (
              <div className="overflow-x-auto h-[400px] overflow-y-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b sticky top-0 shadow-sm">
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
                        <td className="px-4 py-3 font-medium">
                          <span className={`px-2 py-1 rounded text-xs ${item.source === 'SEC' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>{item.source}</span>
                        </td>
                        <td className="px-4 py-3">
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{item.headline}</a>
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
  );
}