const fs = require('fs');
let content = fs.readFileSync('src/backend/services/storefront/content.service.ts', 'utf8');

// The file currently has:
// export const storefrontContentService = new StorefrontContentService();
// Followed by the appended methods

// I will split it, put the methods inside the class, and then export at the end.

const parts = content.split('export const storefrontContentService = new StorefrontContentService();');
if (parts.length > 1) {
  let mainClass = parts[0];
  let appendedMethods = parts[1];

  // The mainClass ends with the closing brace of the class
  const lastBraceIndex = mainClass.lastIndexOf('}');
  
  if (lastBraceIndex !== -1) {
    const beforeBrace = mainClass.substring(0, lastBraceIndex);
    const afterBrace = mainClass.substring(lastBraceIndex + 1); // should be empty or whitespace

    const newContent = beforeBrace + '\n' + appendedMethods + '\n}\n\nexport const storefrontContentService = new StorefrontContentService();\n';
    fs.writeFileSync('src/backend/services/storefront/content.service.ts', newContent);
    console.log('Fixed content.service.ts');
  }
}
