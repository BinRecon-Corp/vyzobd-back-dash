const fs = require('fs');
const file = 'src/backend/services/storefront/cart.service.ts';
let code = fs.readFileSync(file, 'utf8');

// The file has duplicate classes or duplicated methods at the bottom.
// Let's just find the last "}" of the first mergeGuestCart and truncate the file there.

const mergeStr = "  static async mergeGuestCart(guestSessionId: string, customerId: string) {";
const firstMergeIdx = code.indexOf(mergeStr);
const secondMergeIdx = code.indexOf(mergeStr, firstMergeIdx + 1);

if (secondMergeIdx !== -1) {
    // The duplicated code was inserted somewhere.
    // Let's look at the structure.
    console.log("firstMergeIdx", firstMergeIdx);
    console.log("secondMergeIdx", secondMergeIdx);
}
