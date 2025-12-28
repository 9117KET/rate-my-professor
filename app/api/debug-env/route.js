/**
 * Diagnostic endpoint to check environment variables
 * This helps debug API key issues in production
 * WARNING: Remove this endpoint after debugging for security
 */
export async function GET() {
  try {
    // Check both OPENAI_API_KEY and OPENAI_API_KEY_NEW (same as code does)
    let openAIKeyRaw =
      process.env.OPENAI_API_KEY_NEW || process.env.OPENAI_API_KEY;
    const originalLength = openAIKeyRaw?.length || 0;

    // Clean the key: remove quotes, trim whitespace, and remove any non-printable characters
    if (openAIKeyRaw) {
      // Remove surrounding quotes if present
      openAIKeyRaw = openAIKeyRaw.replace(/^["']|["']$/g, "");
      // Trim whitespace and newlines
      openAIKeyRaw = openAIKeyRaw.trim();
      // Remove any non-printable characters except standard alphanumeric and hyphens/underscores
      openAIKeyRaw = openAIKeyRaw.replace(/[^\x20-\x7E]/g, "");
    }

    const openAIKey = openAIKeyRaw || "";
    const hadHiddenChars = originalLength !== openAIKey.length;
    const pineconeKey = process.env.PINECONE_API_KEY;

    // Create safe previews (first 10 chars + last 4 chars + length)
    const openAIPreview = openAIKey
      ? `${openAIKey.substring(0, 10)}...${openAIKey.substring(
          openAIKey.length - 4
        )} (length: ${openAIKey.length})`
      : "MISSING";

    const pineconePreview = pineconeKey
      ? `${pineconeKey.substring(0, 10)}...${pineconeKey.substring(
          pineconeKey.length - 4
        )} (length: ${pineconeKey.length})`
      : "MISSING";

    return Response.json(
      {
        openai: {
          present: !!openAIKey,
          preview: openAIPreview,
          length: openAIKey?.length || 0,
          startsWithSk: openAIKey?.startsWith("sk-") || false,
          isValidFormat:
            openAIKey?.startsWith("sk-") &&
            (openAIKey?.length || 0) >= 20 &&
            (openAIKey?.length || 0) <= 100,
          endsWith: openAIKey
            ? openAIKey.substring(openAIKey.length - 10)
            : "N/A",
          source: process.env.OPENAI_API_KEY_NEW
            ? "OPENAI_API_KEY_NEW"
            : process.env.OPENAI_API_KEY
            ? "OPENAI_API_KEY"
            : "NONE",
          rawLength: originalLength,
          cleanedLength: openAIKey?.length || 0,
          hadHiddenChars: hadHiddenChars,
          warning: hadHiddenChars
            ? `Key had hidden characters (original: ${originalLength} chars, cleaned: ${openAIKey.length} chars)`
            : openAIKey.length > 100
            ? `Key is unusually long (${openAIKey.length} chars). Valid keys are typically 40-60 characters.`
            : null,
        },
        pinecone: {
          present: !!pineconeKey,
          preview: pineconePreview,
          length: pineconeKey?.length || 0,
          startsWithPcsk: pineconeKey?.startsWith("pcsk_") || false,
        },
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
