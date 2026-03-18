'use server'

import { chromium } from 'playwright';

export async function fetchNews(symbols: string[], startDate: string, endDate: string) {
  const results = [];
  const validSymbols = symbols.filter(sym => sym.trim() !== '');
  if (validSymbols.length === 0) return results;

  // แปลงวันที่ YYYY-MM-DD เป็นรูปแบบที่ SET API ต้องการ DD%2FMM%2FYYYY
  const formatDateForSet = (isoDate: string) => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}%2F${month}%2F${year}`; 
  };

  const fromDate = formatDateForSet(startDate);
  const toDate = formatDateForSet(endDate);

  let browser;
  try {
    browser = await chromium.launch({ 
      headless: true,
      executablePath: process.env.CHROMIUM_PATH || 'chromium', 
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0",
      viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();

    for (const sym of validSymbols) {
      const symbolUpper = sym.toUpperCase();
      const symbolLower = sym.toLowerCase();
      
      const refererUrl = `https://www.set.or.th/th/market/product/stock/quote/${symbolUpper}/rights`;
      const newsUrl = `https://www.set.or.th/api/set/news/search?symbol=${symbolLower}&fromDate=${fromDate}&toDate=${toDate}&keyword=&lang=th`;

      try {
        await page.goto(refererUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const newsData = await page.evaluate(async (url) => {
          const res = await fetch(url, { headers: { "Accept": "application/json, text/plain, */*" } });
          if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
          return await res.json();
        }, newsUrl);

        results.push({ symbol: symbolUpper, success: true, newsData: newsData.newsInfoList || [] });
      } catch (error: any) {
        results.push({ symbol: symbolUpper, success: false, error: "ไม่สามารถดึงข้อมูลข่าวได้" });
      }

      if (validSymbols.length > 1) await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (error: any) {
    console.error(error);
  } finally {
    if (browser) await browser.close();
  }
  return results;
}