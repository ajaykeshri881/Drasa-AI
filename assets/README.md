# Drasa AI Assets

This folder contains all visual assets used in the Drasa AI application.

## Directory Structure

```
assets/
├── icons/           # SVG icon files
│   ├── logo.svg
│   ├── welcome-icon.svg
│   ├── user-avatar.svg
│   ├── ai-avatar.svg
│   ├── space.svg
│   ├── creative.svg
│   ├── learn.svg
│   └── coding.svg
└── images/          # WebP image files (to be generated)
    ├── logo.webp
    ├── welcome-icon.webp
    ├── user-avatar.webp
    ├── ai-avatar.webp
    ├── space.webp
    ├── creative.webp
    ├── learn.webp
    └── coding.webp
```

## Converting SVG to WebP

### Method 1: Online Tool (Easiest)
1. Go to https://cloudconvert.com/svg-to-webp
2. Upload each SVG file from the `icons/` folder
3. Download the converted WebP files
4. Save them in the `images/` folder

### Method 2: Using ImageMagick (Command Line)
```bash
# Install ImageMagick first
# Windows: https://imagemagick.org/script/download.php

# Convert all SVG files to WebP
cd "assets/icons"
magick logo.svg -resize 128x128 ../images/logo.webp
magick welcome-icon.svg -resize 240x240 ../images/welcome-icon.webp
magick user-avatar.svg -resize 72x72 ../images/user-avatar.webp
magick ai-avatar.svg -resize 72x72 ../images/ai-avatar.webp
magick space.svg -resize 120x120 ../images/space.webp
magick creative.svg -resize 120x120 ../images/creative.webp
magick learn.svg -resize 120x120 ../images/learn.webp
magick coding.svg -resize 120x120 ../images/coding.webp
```

### Method 3: Using Node.js (Automated)
```bash
# Install sharp
npm install sharp

# Create convert.js file (see below) and run
node convert.js
```

## WebP Conversion Script (convert.js)

Create this file in the assets folder and run `node convert.js`:

```javascript
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const conversions = [
    { input: 'icons/logo.svg', output: 'images/logo.webp', size: 128 },
    { input: 'icons/welcome-icon.svg', output: 'images/welcome-icon.webp', size: 240 },
    { input: 'icons/user-avatar.svg', output: 'images/user-avatar.webp', size: 72 },
    { input: 'icons/ai-avatar.svg', output: 'images/ai-avatar.webp', size: 72 },
    { input: 'icons/space.svg', output: 'images/space.webp', size: 120 },
    { input: 'icons/creative.svg', output: 'images/creative.webp', size: 120 },
    { input: 'icons/learn.svg', output: 'images/learn.webp', size: 120 },
    { input: 'icons/coding.svg', output: 'images/coding.webp', size: 120 }
];

async function convertToWebP() {
    for (const { input, output, size } of conversions) {
        try {
            await sharp(input)
                .resize(size, size)
                .webp({ quality: 90 })
                .toFile(output);
            console.log(`✅ Converted ${input} to ${output}`);
        } catch (error) {
            console.error(`❌ Error converting ${input}:`, error.message);
        }
    }
    console.log('🎉 All conversions complete!');
}

convertToWebP();
```

## Image Specifications

| Image | Size | Purpose |
|-------|------|---------|
| logo.webp | 128x128 | App logo in header |
| welcome-icon.webp | 240x240 | Large icon on welcome screen |
| user-avatar.webp | 72x72 | User message avatar |
| ai-avatar.webp | 72x72 | AI message avatar |
| space.webp | 120x120 | Space suggestion card |
| creative.webp | 120x120 | Creative writing card |
| learn.webp | 120x120 | Learning suggestion card |
| coding.webp | 120x120 | Coding tips card |

## Using WebP Images

After converting, update the HTML/JavaScript to use WebP images:

```html
<!-- Instead of inline SVG -->
<img src="assets/images/logo.webp" alt="Drasa AI Logo" width="32" height="32">
```

## Benefits of WebP

✅ **Smaller file sizes** - 25-35% smaller than PNG/JPEG
✅ **Faster loading** - Better performance on mobile
✅ **Better quality** - Superior compression algorithm
✅ **Browser support** - Supported by all modern browsers
✅ **Transparency** - Supports alpha channel like PNG

## Browser Fallback

For older browsers, use picture element:

```html
<picture>
  <source srcset="assets/images/logo.webp" type="image/webp">
  <img src="assets/icons/logo.svg" alt="Drasa AI Logo">
</picture>
```

---

**Note:** The HTML currently uses inline SVG for maximum compatibility. To use these WebP images, update the corresponding HTML/JS files to reference these assets.
