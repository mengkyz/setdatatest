'use client'

import { useState, useEffect } from 'react';
import { fetchCorporateActions } from '@/app/actions/ca';

export default function CorporateActionTab({ symbols, isActive }: { symbols: string[], isActive: boolean }) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState('');

  useEffect(() => {
    // จะดึงข้อมูลก็ต่อเมื่อ แท็บนี้ถูกเปิดดูอยู่ และ หุ้นที่ค้นหามีการเปลี่ยนแปลง
    const currentSymbols = symbols.join(',');
    if (isActive && currentSymbols !== lastFetched && symbols.length > 0) {
      const loadData = async () => {
        setLoading(true);
        const data = await fetchCorporateActions(symbols);
        setResults(data);
        setLastFetched(currentSymbols);
        setLoading(false);
      };
      loadData();
    }
  }, [symbols, isActive, lastFetched]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">กำลังดึงข้อมูลปันผล...</div>;
  if (results.length === 0) return null;

  return (
    <div className="space-y-6 mt-6">
      {results.map((result, idx) => (
        <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-green-50 px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-green-900">หุ้น: {result.symbol} (ปันผล)</h2>
          </div>
          <div className="p-6">
            {!result.success ? (
              <div className="text-red-500">❌ {result.error}</div>
            ) : result.caData.length === 0 ? (
              <div className="text-gray-500">ไม่มีประวัติ Corporate Action</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3">ประเภท (CA)</th>
                      <th className="px-4 py-3">วันขึ้นเครื่องหมาย</th>
                      <th className="px-4 py-3">เงินปันผล (บาท)</th>
                      <th className="px-4 py-3">วันจ่ายเงิน</th>
                      <th className="px-4 py-3">รายละเอียด</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.caData.map((item: any, i: number) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{item.caType}</td>
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
  );
}