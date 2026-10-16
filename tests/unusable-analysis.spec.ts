import { test, expect } from '@playwright/test';
import path from 'path';

const SAMPLE_IMAGE = path.resolve(__dirname, '../img/confidence-with-hyperpigmentation-v0-397eauo43yoh1.webp');

/**
 * Reproduces the "no usable results" report against the REAL YouCam API.
 * Step-by-step: upload → preview → click Analyze → validation → API → verdict.
 */
test.describe('Unusable analysis reproduction', () => {
  test('sample hyperpigmentation image end-to-end', async ({ page }) => {
    test.setTimeout(300_000);

    const consoleLogs: string[] = [];
    const networkLog: { url: string; status: number; body: string }[] = [];
    const navLog: string[] = [];

    page.on('console', (msg) => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });
    page.on('pageerror', (err) => {
      consoleLogs.push(`[pageerror] ${err.message}\n${err.stack ?? ''}`);
    });
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) navLog.push(`[nav] ${frame.url()}`);
    });
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('makeupar.com') || url.includes('/api/skinAnalysis') || url.includes('/api/virtualTryOn')) {
        let body = '';
        try {
          body = (await response.text()).slice(0, 8000);
        } catch {
          body = '<no body>';
        }
        networkLog.push({ url, status: response.status(), body });
      }
    });

    const dumps: string[] = [];
    const snap = async (label: string) => {
      const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 400);
      dumps.push(`--- ${label}: ${text}`);
      return text;
    };

    try {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('input[type="file"]')).toBeAttached();
      await snap('loaded');

      // Hydration-safe upload: retry the real "Upload" button click until the
      // native file chooser opens (pre-hydration clicks/events are silently
      // dropped by React, which would falsely stall the test).
      let fileChooser: import('@playwright/test').FileChooser | null = null;
      for (let i = 0; i < 60 && !fileChooser; i++) {
        const fcPromise = page
          .waitForEvent('filechooser', { timeout: 1000 })
          .catch(() => null);
        await page
          .getByRole('button', { name: 'Upload' })
          .click({ timeout: 2000 })
          .catch(() => {});
        fileChooser = await fcPromise;
        if (!fileChooser) await page.waitForTimeout(500);
      }
      if (!fileChooser) {
        throw new Error('File chooser never opened — hydration/onClick appears broken');
      }
      dumps.push('>>> File chooser opened — selecting sample image');
      await fileChooser.setFiles(SAMPLE_IMAGE);

      // Phase 1: wait for the preview screen (or error) — up to 15s.
      let phase1 = '';
      for (let i = 0; i < 15; i++) {
        await page.waitForTimeout(1000);
        phase1 = await snap(`upload+t${i + 1}s`);
        if (/Analyze|Retake|valid image|too large/i.test(phase1)) break;
      }
      await page.screenshot({ path: 'test-results/phase1-after-upload.png' });

      // Phase 2: if the preview screen is up, click Analyze.
      const analyzeBtn = page.getByRole('button', { name: /^Analyze$/i });
      if (await analyzeBtn.isVisible().catch(() => false)) {
        dumps.push('>>> Preview screen visible — clicking Analyze');
        await analyzeBtn.click();
      } else {
        dumps.push('>>> Preview screen NOT visible after upload — skipping Analyze click');
      }

      // Phase 3: poll for scan/results/error state every 2s for 60s, then 10s up to 240s.
      for (let t = 0; t <= 240; t += 2) {
        await page.waitForTimeout(2000);
        const text = await snap(`t+${t + 2}s`);
        if (t % 20 === 0) await page.screenshot({ path: `test-results/phase3-t${t + 2}s.png` });
        if (/no usable results|Analysis Error/i.test(text)) {
          dumps.push('>>> ERROR STATE REACHED');
          break;
        }
        if (/Health Score/i.test(text)) {
          dumps.push('>>> RESULTS RENDERED');
          break;
        }
      }
      // Verify the live try-on image actually loads (not just rendered).
      const tryOnImg = page.locator('img[alt="Your virtual try-on result"]');
      if ((await tryOnImg.count()) > 0) {
        try {
          await page.waitForFunction(
            () => {
              const img = document.querySelector(
                'img[alt="Your virtual try-on result"]'
              ) as HTMLImageElement | null;
              return Boolean(img) && img!.complete && img!.naturalWidth > 0;
            },
            undefined,
            { timeout: 20_000 }
          );
          dumps.push('>>> TRY-ON IMAGE LOADED');
        } catch {
          const state = await tryOnImg.evaluate((el) => ({
            complete: (el as HTMLImageElement).complete,
            naturalWidth: (el as HTMLImageElement).naturalWidth,
          })).catch(() => null);
          dumps.push(`>>> TRY-ON IMAGE NOT LOADED ${JSON.stringify(state)}`);
        }
      } else {
        dumps.push('>>> TRY-ON IMAGE ELEMENT MISSING');
      }
    } finally {
      console.log('=== TIMELINE ===');
      console.log(dumps.join('\n'));
      console.log('=== NAVIGATIONS ===');
      console.log(navLog.join('\n') || '<none>');
      console.log('=== NETWORK LOG ===');
      for (const entry of networkLog) {
        console.log(`--- ${entry.status} ${entry.url}`);
        console.log(entry.body);
      }
      console.log('=== CONSOLE LOG (all) ===');
      console.log(consoleLogs.join('\n'));
      try {
        const bodyText = await page.locator('body').innerText();
        console.log('=== FINAL BODY TEXT (first 3000) ===');
        console.log(bodyText.slice(0, 3000));
        await page.screenshot({ path: 'test-results/unusable-repro-final.png', fullPage: true });
      } catch {
        /* page may be closed */
      }
    }
  });
});


