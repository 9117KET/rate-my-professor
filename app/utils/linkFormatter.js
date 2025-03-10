export const formatTextWithLinks = (text) => {
  // Handle the case where text is an object with a content property
  if (typeof text === "object" && text !== null) {
    if (text.content && typeof text.content === "string") {
      text = text.content;
    } else {
      // If it's an object but doesn't have a usable content property, convert to string
      return JSON.stringify(text);
    }
  } else if (typeof text !== "string") {
    // If not a string or object, convert to string or return empty string
    return String(text || "");
  }

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#001B3F", textDecoration: "underline" }}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};
