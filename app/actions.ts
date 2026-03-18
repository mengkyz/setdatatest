'use server'

import { chromium } from 'playwright';

export async function fetchStocksData(symbols: string[]) {
  const results = [];
  const validSymbols = symbols.filter(sym => sym.trim() !== '');

  if (validSymbols.length === 0) return results;

  let browser;
  try {
    // 1. เปิดเบราว์เซอร์โดยใช้ Path เต็มที่ได้จาก Nix Environment
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
      const apiUrl = `https://www.set.or.th/api/set/stock/${symbolLower}/corporate-action?lang=th`;

      try {
        // 2. ให้เบราว์เซอร์เข้าไปที่หน้าเว็บจริงก่อน เพื่อให้ได้ Cookies และผ่านด่าน WAF ของ Imperva
        await page.goto(refererUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // 3. สั่งรัน JavaScript ในหน้าเว็บนั้น เพื่อยิง API (เหมือนคนคลิกดูข้อมูล WAF จะไม่บล็อก)
        const data = await page.evaluate(async (url) => {
          const res = await fetch(url, {
            headers: {
              "Accept": "application/json, text/plain, */*",
            }
          });
          
          if (!res.ok) {
            throw new Error(`HTTP Error: ${res.status}`);
          }
          return await res.json();
        }, apiUrl);

        results.push({ symbol: symbolUpper, success: true, data: data });

      } catch (error: any) {
        console.error(`Error fetching ${symbolUpper}:`, error);
        results.push({ symbol: symbolUpper, success: false, error: "ถูกบล็อกโดยระบบป้องกัน หรือ โหลดหน้าเว็บไม่สำเร็จ" });
      }

      // หน่วงเวลา 2 วินาทีก่อนไปดึงหุ้นตัวถัดไป ป้องกันการโดนแบน IP
      if (validSymbols.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  } catch (error: any) {
    console.error("Browser launch error:", error);
    // กรณีที่เบราว์เซอร์เปิดไม่ได้
  } finally {
    // ปิดเบราว์เซอร์ทุกครั้งเพื่อคืน Memory
    if (browser) {
      await browser.close();
    }
  }

  return results;
}