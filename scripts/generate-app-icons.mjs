/**
 * Regenerate Expo app icons from diet-elite-logo-transparent.png.
 * Run: npm run icons
 */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '../assets/images');
const logoSrc = path.join(assetsDir, 'diet-elite-logo-transparent.png');

const BRAND_GREEN = { r: 34, g: 112, b: 20, alpha: 1 };
const SIZE = 1024;

async function logoWithoutBlackBg() {
    const { data, info } = await sharp(logoSrc).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width, height, channels } = info;

    for (let i = 0; i < data.length; i += channels) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (r < 40 && g < 40 && b < 40) {
            data[i + 3] = 0;
        }
    }

    return sharp(Buffer.from(data), { raw: { width, height, channels } }).png().toBuffer();
}

async function resizeLogo(logoBuffer, maxSide) {
    return sharp(logoBuffer)
        .resize(maxSide, maxSide, { fit: 'inside', withoutEnlargement: false })
        .png()
        .toBuffer();
}

async function centerOnCanvas(logoBuffer, size, background = null) {
    const meta = await sharp(logoBuffer).metadata();
    const base = background
        ? sharp({
              create: { width: size, height: size, channels: 4, background },
          })
        : sharp({
              create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
          });

    return base
        .composite([
            {
                input: logoBuffer,
                left: Math.round((size - meta.width) / 2),
                top: Math.round((size - meta.height) / 2),
            },
        ])
        .png()
        .toBuffer();
}

async function main() {
    const logo = await logoWithoutBlackBg();

    const iconLogo = await resizeLogo(logo, Math.round(SIZE * 0.76));
    const foregroundLogo = await resizeLogo(logo, Math.round(SIZE * 0.62));
    const splashLogo = await resizeLogo(logo, Math.round(SIZE * 0.55));

    await sharp(await centerOnCanvas(iconLogo, SIZE, BRAND_GREEN))
        .png()
        .toFile(path.join(assetsDir, 'icon.png'));

    await sharp(await centerOnCanvas(foregroundLogo, SIZE))
        .png()
        .toFile(path.join(assetsDir, 'android-icon-foreground.png'));

    await sharp({
        create: { width: SIZE, height: SIZE, channels: 4, background: BRAND_GREEN },
    })
        .png()
        .toFile(path.join(assetsDir, 'android-icon-background.png'));

    const mono = await sharp(logo)
        .resize(Math.round(SIZE * 0.62), Math.round(SIZE * 0.62), { fit: 'inside' })
        .greyscale()
        .threshold(40)
        .negate()
        .toBuffer();

    await sharp(await centerOnCanvas(mono, SIZE))
        .png()
        .toFile(path.join(assetsDir, 'android-icon-monochrome.png'));

    await sharp(await centerOnCanvas(splashLogo, SIZE))
        .png()
        .toFile(path.join(assetsDir, 'splash-icon.png'));

    const faviconLogo = await resizeLogo(logo, 192);
    await sharp(faviconLogo).resize(48, 48).png().toFile(path.join(assetsDir, 'favicon.png'));

    console.log('Generated app icons in assets/images/');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
