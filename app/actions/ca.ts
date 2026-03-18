'use server'

import { chromium } from 'playwright';

export async function fetchCorporateActions(symbols: string[]) {
  const results = [];
  const validSymbols = symbols.filter(sym => sym.trim() !== '');
  if (validSymbols.length === 0) return results;

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
      const caUrl = `https://www.set.or.th/api/set/stock/${symbolLower}/corporate-action?lang=th`;

      try {
        await page.goto(refererUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const caData = await page.evaluate(async (url) => {
          const res = await fetch(url, { headers: { "Accept": "application/json, text/plain, */*" } });
          if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
          return await res.json();
        }, caUrl);

        results.push({ symbol: symbolUpper, success: true, caData });
      } catch (error: any) {
        results.push({ symbol: symbolUpper, success: false, error: "ไม่สามารถดึงข้อมูลได้" });
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