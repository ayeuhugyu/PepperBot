import puppeteer from 'puppeteer';
import fs from "fs-extra";

export interface screenshotUrlOptions {
    fullPage?: boolean;
    resolution?: { width: number; height: number }; // set page dimensions
    savePath?: string; // if left undefined, return a buffer, otherwise save to path
}

export async function screenshotUrl(url: string, options?: screenshotUrlOptions): Promise<Buffer | void> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // set resolution if provided
    if (options?.resolution) {
        await page.setViewport({
            width: options.resolution.width,
            height: options.resolution.height,
        });
    }

    await page.goto(url, { waitUntil: 'networkidle2' });

    let result: Buffer | void;

    const base64Data = await page.screenshot({ encoding: 'base64', fullPage: options?.fullPage ?? false }) as string;
    result = Buffer.from(base64Data, 'base64');

    await browser.close();

    // if a savePath is defined, use fs to write it
    if (options?.savePath) {
        await fs.ensureFileSync(options.savePath);
        await fs.writeFile(options.savePath, result);
        return;
    }

    return result;
}