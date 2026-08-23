export const normalizePhone = (phone: string | null | undefined): string | null => {
  if (!phone) return null;
  
  // Strip all non-digit characters (including spaces, dashes, plus signs)
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 0) return null;

  // Normalize BD numbers to 11 digits starting with 01
  // e.g., +88017... -> 017...
  if (digits.startsWith("880") && digits.length === 13) {
    digits = digits.substring(2);
  }

  return digits;
};
