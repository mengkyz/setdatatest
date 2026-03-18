'use server'

import { chromium } from 'playwright';

export async function fetchStocksData(symbols: string[]) {
  const results = [];
  const validSymbols = symbols.filter(sym => sym.trim() !== '');

  if (validSymbols.length === 0) return results;

  // คำนวณวันที่สำหรับดึงข่าว (ย้อนหลัง 5 ปีถึงปัจจุบัน)
  const today = new Date();
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(today.getFullYear() - 5);

  const formatDate = (date: Date) => {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}%2F${m}%2F${y}`;
  };

  const toDate = formatDate(today);
  const fromDate = formatDate(fiveYearsAgo);

  let browser;
  try {
    // 1. เปิดเบราว์เซอร์ Chromium
    browser = await chromium.launch({ 
      headless: true,
      executablePath: process.env.CHROMIUM_PATH || 'chromium', 
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();

    for (const sym of validSymbols) {
      const symbolUpper = sym.toUpperCase();
      const symbolLower = sym.toLowerCase();
      
      const refererUrl = `https://www.set.or.th/th/market/product/stock/quote/${symbolUpper}/rights`;
      const caUrl = `https://www.set.or.th/api/set/stock/${symbolLower}/corporate-action?lang=th`;
      const newsUrl = `https://www.set.or.th/api/set/news/search?symbol=${symbolLower}&fromDate=${fromDate}&toDate=${toDate}&keyword=&lang=th`;

      try {
        // 2. ให้เบราว์เซอร์เข้าไปที่หน้าเว็บจริงก่อน เพื่อผ่านด่าน WAF
        await page.goto(refererUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // 3. ยิงดึงข้อมูล Corporate Action
        const caData = await page.evaluate(async (url) => {
          const res = await fetch(url, { headers: { "Accept": "application/json, text/plain, */*" } });
          if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
          return await res.json();
        }, caUrl);

        // 4. ยิงดึงข้อมูล News ต่อเลยในเซสชันเดียวกัน (ประหยัดเวลา)
        const newsData = await page.evaluate(async (url) => {
          const res = await fetch(url, { headers: { "Accept": "application/json, text/plain, */*" } });
          if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
          return await res.json();
        }, newsUrl);

        // เก็บผลลัพธ์ทั้ง 2 แบบลงใน Object เดียว
        results.push({ 
          symbol: symbolUpper, 
          success: true, 
          caData: caData,
          newsData: newsData.newsInfoList || [] 
        });

      } catch (error: any) {
        console.error(`Error fetching ${symbolUpper}:`, error);
        results.push({ symbol: symbolUpper, success: false, error: "ถูกบล็อกโดยระบบป้องกัน หรือ โหลดหน้าเว็บไม่สำเร็จ" });
      }

      // หน่วงเวลา 2 วินาทีก่อนดึงตัวถัดไป
      if (validSymbols.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  } catch (error: any) {
    console.error("Browser launch error:", error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return results;
}