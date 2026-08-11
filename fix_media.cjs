const fs = require('fs');

// 1. Fix ProductMediaTab.tsx
let mediaTab = fs.readFileSync('src/components/products/ProductMediaTab.tsx', 'utf8');

mediaTab = mediaTab.replace(
  `} from '../../services/product.service';`,
  `} from '../../services/product.service';\nimport { mediaService } from '../../services/media.service';`
);

const oldElseBlock = `      } else {
        // Handle local previews for product creation
        const newLocalImages: ProductImageItem[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          const isPrimary = isPrimaryUpload && i === 0;
          newLocalImages.push({
            id: \`temp-\${Date.now()}-\${Math.random().toString(36).substring(2, 7)}\`,
            imageUrl: dataUrl,
            url: dataUrl,
            publicId: null,`;

const newElseBlock = `      } else {
        // Upload via mediaService for product creation
        const newLocalImages: ProductImageItem[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const uploadedAsset = await mediaService.uploadAsset(file, 'products');
          const isPrimary = isPrimaryUpload && i === 0;
          newLocalImages.push({
            id: uploadedAsset.id || \`temp-\${Date.now()}-\${Math.random().toString(36).substring(2, 7)}\`,
            imageUrl: uploadedAsset.secureUrl || uploadedAsset.url,
            url: uploadedAsset.secureUrl || uploadedAsset.url,
            publicId: uploadedAsset.publicId || null,`;

mediaTab = mediaTab.replace(oldElseBlock, newElseBlock);

fs.writeFileSync('src/components/products/ProductMediaTab.tsx', mediaTab);

// 2. Fix MediaUploaderInput.tsx
let mediaUploader = fs.readFileSync('src/components/admin/MediaUploaderInput.tsx', 'utf8');
mediaUploader = mediaUploader.replace(
  `localStorage.getItem('token');`,
  `localStorage.getItem('accessToken');`
);
fs.writeFileSync('src/components/admin/MediaUploaderInput.tsx', mediaUploader);

console.log('Fixed files');
