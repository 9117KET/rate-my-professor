export const generateId = () => {
  // Use a timestamp-based fallback if crypto is not available
  if (typeof window !== "undefined" && window.crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
