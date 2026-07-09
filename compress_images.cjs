const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');

fs.readdir(publicDir, (err, files) => {
  if (err) throw err;
  
  const pngFiles = files.filter(f => f.endsWith('.png') && f !== 'favicon.png');
  
  pngFiles.forEach(async (file) => {
    const inputPath = path.join(publicDir, file);
    const outputPath = path.join(publicDir, file.replace('.png', '.webp'));
    
    try {
      await sharp(inputPath)
        .webp({ quality: 80 })
        .toFile(outputPath);
      
      console.log(`Converted ${file} to WebP.`);
      
      // Optionally delete the old png to save space, but maybe keep for a sec
      fs.unlinkSync(inputPath);
      console.log(`Deleted original ${file}`);
    } catch (e) {
      console.error(`Error converting ${file}:`, e);
    }
  });
});
