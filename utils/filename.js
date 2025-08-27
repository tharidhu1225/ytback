export function sanitizeFilename(input, fallback = 'download') {
  const withoutInvalid = (input || fallback)
    .replace(/[\\/:*?"<>|]+/g, ' ') // Remove Windows-invalid characters
    .replace(/["']/g, '')           // Remove quotes
    .replace(/[\r\n]+/g, ' ')       // Remove newlines
    .replace(/\s+/g, ' ')           // Collapse multiple spaces
    .trim();
  return withoutInvalid || fallback;
}