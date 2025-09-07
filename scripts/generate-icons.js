const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');

const sourceIcon = path.join(__dirname, '../src/assets/icon.png');
const publicDir = path.join(__dirname, '../public');
const assetsDir = path.join(__dirname, '../src/assets/icons');

// Kích thước icons cần tạo
const iconSizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 }, // Apple recommend 180x180
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'android-chrome-144x144.png', size: 144 } // For Microsoft
];

async function generateIcons() {
  try {
    // Kiểm tra file nguồn có tồn tại
    if (!await fs.pathExists(sourceIcon)) {
      console.error('❌ File icon.png not found in src/assets/');
      process.exit(1);
    }

    // Tạo thư mục nếu chưa có
    await fs.ensureDir(assetsDir);
    await fs.ensureDir(publicDir);

    console.log('🔄 Generating icons...');

    // Tạo từng icon
    for (const icon of iconSizes) {
      const outputPath = path.join(assetsDir, icon.name);
      
      await sharp(sourceIcon)
        .resize(icon.size, icon.size)
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated ${icon.name}`);
    }

    // Tạo favicon.ico (chứa multiple sizes)
    const faviconSizes = [16, 32, 64];
    const faviconImages = await Promise.all(
      faviconSizes.map(size =>
        sharp(sourceIcon)
          .resize(size, size)
          .png()
          .toBuffer()
      )
    );

    // Dùng image đầu tiên làm favicon.ico (đơn giản)
    await sharp(faviconImages[0]).toFile(path.join(assetsDir, 'favicon.ico'));
    console.log('✅ Generated favicon.ico');

    // Copy tất cả icons vào public folder
    const filesToCopy = [...iconSizes.map(i => i.name), 'favicon.ico'];
    for (const file of filesToCopy) {
      const sourceFile = path.join(assetsDir, file);
      const destFile = path.join(publicDir, file);
      await fs.copy(sourceFile, destFile);
    }

    console.log('🎉 All icons generated and copied to public folder!');
    
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();