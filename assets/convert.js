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
    console.log('🚀 Starting SVG to WebP conversion...\n');
    
    // Ensure images directory exists
    if (!fs.existsSync('images')) {
        fs.mkdirSync('images', { recursive: true });
        console.log('📁 Created images directory\n');
    }
    
    let successCount = 0;
    let failCount = 0;
    
    for (const { input, output, size } of conversions) {
        try {
            await sharp(input)
                .resize(size, size, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .webp({ quality: 90, alphaQuality: 100 })
                .toFile(output);
            
            const stats = fs.statSync(output);
            const sizeKB = (stats.size / 1024).toFixed(2);
            console.log(`✅ ${path.basename(input)} → ${path.basename(output)} (${sizeKB} KB)`);
            successCount++;
        } catch (error) {
            console.error(`❌ Error converting ${input}: ${error.message}`);
            failCount++;
        }
    }
    
    console.log(`\n🎉 Conversion complete!`);
    console.log(`   ✅ Success: ${successCount}`);
    if (failCount > 0) {
        console.log(`   ❌ Failed: ${failCount}`);
    }
}

// Check if sharp is installed
try {
    require.resolve('sharp');
    convertToWebP().catch(console.error);
} catch (e) {
    console.error('❌ Error: sharp module not found!');
    console.error('📦 Please install it first: npm install sharp');
    console.error('   Or run: npm install');
}
