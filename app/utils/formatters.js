export const formatTimestamp = (date) => {
  if (!date) return "";

  // Ensure we're working with a Date object
  const dateObj = date instanceof Date ? date : new Date(date);

  // Check for invalid date
  if (isNaN(dateObj.getTime())) return "";

  try {
    return new Intl.DateTimeFormat("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour12: false,
      timeZone: "Europe/Berlin",
    }).format(dateObj);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
};
