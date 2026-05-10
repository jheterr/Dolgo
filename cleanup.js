const fs = require('fs');
const path = require('path');

const root = __dirname;
const pub = {
  img: path.join(root, 'public', 'images'),
  css: path.join(root, 'public', 'stylesheets'),
  js:  path.join(root, 'public', 'javascripts'),
};

// ── Helpers ──────────────────────────────────────────────
function cp(src, destDir) {
  const dest = path.join(destDir, path.basename(src));
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`  copied → ${dest.replace(root, '.')}`);
}

function rm(filePath) {
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath);
    console.log(`  removed ${filePath.replace(root, '.')}`);
  }
}

function rmDir(dirPath) {
  if (fs.existsSync(dirPath) && fs.readdirSync(dirPath).length === 0) {
    fs.rmdirSync(dirPath);
    console.log(`  removed empty dir ${dirPath.replace(root, '.')}`);
  }
}

// ── 1. Collect ALL images & CSS from source folders ──────
const sourceFolders = ['admin', 'staff', 'customer', 'landingPage', 'landing', 'login'];

sourceFolders.forEach(folder => {
  const dir = path.join(root, folder);
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    const ext = path.extname(file).toLowerCase();
    const src = path.join(dir, file);
    if (fs.statSync(src).isDirectory()) return;
    if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext)) {
      // Only copy if not already there
      if (!fs.existsSync(path.join(pub.img, file))) cp(src, pub.img);
      rm(src);
    }
  });
});

// ── 2. Consolidate CSS ───────────────────────────────────
// The 4 key CSS files are already in public/stylesheets.
// Remove duplicates from source folders.
sourceFolders.forEach(folder => {
  const dir = path.join(root, folder);
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    if (path.extname(file).toLowerCase() === '.css') {
      rm(path.join(dir, file));
    }
  });
});

// ── 3. Remove leftover script helper files from root ─────
const scratchFiles = ['migrate.js', 'extract_sidebars.js', 'refactor_layouts.js', 'restructure.js', 'cleanup.js', 'debug.html'];
// We'll leave cleanup.js itself alone since it's running; Node keeps it open.

// ── 4. Rename public/stylesheets/style.css → main.css (it was the combined one) ──
const oldStyleCss = path.join(pub.css, 'style.css');
const newMainCss  = path.join(pub.css, 'main.css');
if (fs.existsSync(oldStyleCss) && !fs.existsSync(newMainCss)) {
  fs.renameSync(oldStyleCss, newMainCss);
  console.log('  renamed style.css → main.css in public/stylesheets');
}

// ── 5. Verify public structure ───────────────────────────
console.log('\n✅ Public images:');
fs.readdirSync(pub.img).forEach(f => console.log('  ', f));
console.log('\n✅ Public stylesheets:');
fs.readdirSync(pub.css).forEach(f => console.log('  ', f));

console.log('\n✅ Cleanup complete!');
