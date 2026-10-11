/*
 * Shrinks any oversized photo or video in /Images so the site stays fast,
 * then updates content/*.json to point at the new files.
 *
 * Runs automatically (see .github/workflows/optimize-media.yml) every time
 * you upload something through Pages CMS — you never need to run it yourself.
 *
 *  - JPG / PNG  → WebP, max 2000px on the long side
 *  - big WebP   → resized/recompressed in place
 *  - GIF > 1MB  → MP4 (much smaller, same look)
 *  - video > 5MB → re-encoded MP4, max 1080p
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const sharp = require('sharp');

const IMAGES = 'Images';
const CONTENT = 'content';
const MAX = 2000;
const KEEP = new Set(['logo.png', 'logo_with_background.jpg']); // small files used by the page head
const renames = {};

const kb = (f) => fs.statSync(f).size / 1024;

function slug(name) {
    return name.replace(/\.[^.]+$/, '').normalize('NFKD').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'file';
}

function freeName(base, ext, original) {
    let name = `${base}${ext}`;
    let i = 2;
    while (fs.existsSync(path.join(IMAGES, name)) && name !== original) name = `${base}-${i++}${ext}`;
    return name;
}

function ffmpeg(args) {
    execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });
}

async function run() {
    const files = fs.readdirSync(IMAGES).filter((f) => fs.statSync(path.join(IMAGES, f)).isFile());

    for (const file of files) {
        if (KEEP.has(file)) continue;
        const src = path.join(IMAGES, file);
        const ext = path.extname(file).toLowerCase();

        try {
            if (['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.bmp'].includes(ext)) {
                const meta = await sharp(src).metadata();
                const big = Math.max(meta.width || 0, meta.height || 0) > MAX;
                if (!big && kb(src) < 300) continue; // already small enough
                const out = freeName(slug(file), '.webp', file);
                const buf = await sharp(src).rotate().resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
                fs.writeFileSync(path.join(IMAGES, out), buf);
                fs.unlinkSync(src);
                renames[file] = out;
                console.log(`image  ${file} → ${out}`);
            } else if (ext === '.webp') {
                const meta = await sharp(src).metadata();
                const big = Math.max(meta.width || 0, meta.height || 0) > MAX;
                if (!big && kb(src) < 800) continue;
                const buf = await sharp(src).resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
                fs.writeFileSync(src, buf);
                console.log(`image  ${file} (recompressed)`);
            } else if (ext === '.gif') {
                if (kb(src) < 1024) continue;
                const out = freeName(slug(file), '.mp4', file);
                ffmpeg(['-i', src, '-an', '-vf', "scale='min(1920,iw)':-2:flags=lanczos,scale=trunc(iw/2)*2:trunc(ih/2)*2", '-c:v', 'libx264', '-crf', '24', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(IMAGES, out)]);
                fs.unlinkSync(src);
                renames[file] = out;
                console.log(`gif    ${file} → ${out}`);
            } else if (['.mp4', '.mov', '.m4v', '.webm'].includes(ext)) {
                if (kb(src) < 5 * 1024) continue;
                const out = freeName(slug(file), '.mp4', file);
                const tmp = path.join(IMAGES, `.tmp-${out}`);
                ffmpeg(['-i', src, '-vf', "scale=-2:'min(1080,ih)',scale=trunc(iw/2)*2:trunc(ih/2)*2", '-r', '30', '-c:v', 'libx264', '-crf', '26', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', tmp]);
                fs.unlinkSync(src);
                fs.renameSync(tmp, path.join(IMAGES, out));
                if (out !== file) renames[file] = out;
                console.log(`video  ${file} → ${out}`);
            }
        } catch (err) {
            console.warn(`skipped ${file}: ${err.message}`);
        }
    }

    // Point the content files at the new names
    if (!Object.keys(renames).length) return;
    for (const f of fs.readdirSync(CONTENT).filter((x) => x.endsWith('.json'))) {
        const p = path.join(CONTENT, f);
        let text = fs.readFileSync(p, 'utf8');
        const before = text;
        for (const [from, to] of Object.entries(renames)) {
            for (const variant of new Set([from, encodeURI(from), from.replace(/ /g, '%20')])) {
                text = text.split(`Images/${variant}"`).join(`Images/${to}"`);
            }
        }
        if (text !== before) {
            fs.writeFileSync(p, text);
            console.log(`updated ${p}`);
        }
    }
}

run().catch((e) => { console.error(e); process.exit(1); });
