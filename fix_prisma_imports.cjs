const fs = require('fs');
const path = require('path');

const findFiles = (dir, filesList = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findFiles(filePath, filesList);
    } else if (filePath.endsWith('.ts')) {
      filesList.push(filePath);
    }
  }
  return filesList;
};

const allFiles = findFiles('src/backend');

allFiles.forEach(file => {
  if (file === 'src/backend/config/db.ts') return;
  
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('new PrismaClient()')) {
    content = content.replace(/import \{ PrismaClient, Prisma \} from "@prisma\/client";/g, 'import { Prisma } from "@prisma/client";');
    content = content.replace(/import \{ PrismaClient \} from "@prisma\/client";/g, '');
    
    // figure out relative path to config/db.ts
    const depth = file.split('/').length - 3;
    const relPath = depth === 0 ? './config/db' : '../'.repeat(depth) + 'config/db';
    
    content = content.replace(/const prisma = new PrismaClient\(\);/g, `import { prisma } from "${relPath}";`);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});
