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

    // Function to extract valid key (same as in embeddingService)
    // Supports both sk- (40-60 chars) and sk-proj- (100-200 chars) formats
    function extractValidOpenAIKey(keyRaw) {
      if (!keyRaw) return null;
      let cleaned = keyRaw
        .replace(/^["']|["']$/g, "")
        .trim()
        .replace(/[^\x20-\x7E]/g, "");

      // Check for sk-proj- format (project keys, typically 100-200 chars)
      if (cleaned.startsWith("sk-proj-")) {
        if (cleaned.length >= 100 && cleaned.length <= 200) {
          return cleaned;
        }
        // If too long, might be duplicated - try to extract the first valid one
        if (cleaned.length > 200) {
          const keyPattern = /sk-proj-[a-zA-Z0-9_-]{90,190}/;
          const match = cleaned.match(keyPattern);
          if (match && match[0].length >= 100 && match[0].length <= 200) {
            return match[0];
          }
        }
        return cleaned;
      }

      // Check for standard sk- format (40-60 chars)
      if (cleaned.startsWith("sk-")) {
        if (cleaned.length >= 40 && cleaned.length <= 60) {
          return cleaned;
        }
        // If too long, might be duplicated - try to extract the first valid one
        if (cleaned.length > 60) {
          const keyPattern = /sk-[a-zA-Z0-9]{37,57}/;
          const match = cleaned.match(keyPattern);
          if (match && match[0].length >= 40 && match[0].length <= 60) {
            return match[0];
          }
        }
        return cleaned;
      }

      return null;
    }

    // Extract a valid key (handles concatenated/corrupted keys)
    const openAIKeyExtracted = extractValidOpenAIKey(openAIKeyRaw);
    const openAIKey = openAIKeyExtracted || "";

    // Check if key was cleaned/extracted
    let cleanedKeyRaw = openAIKeyRaw;
    if (openAIKeyRaw) {
      cleanedKeyRaw = openAIKeyRaw
        .replace(/^["']|["']$/g, "")
        .trim()
        .replace(/[^\x20-\x7E]/g, "");
    }
    const hadHiddenChars = originalLength !== cleanedKeyRaw.length;
    const wasExtracted =
      openAIKeyExtracted && openAIKeyExtracted !== cleanedKeyRaw;
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
          startsWithSk:
            openAIKey?.startsWith("sk-") ||
            openAIKey?.startsWith("sk-proj-") ||
            false,
          startsWithSkProj: openAIKey?.startsWith("sk-proj-") || false,
          isValidFormat:
            openAIKey &&
            (openAIKey.startsWith("sk-proj-") || openAIKey.startsWith("sk-")) &&
            ((openAIKey.startsWith("sk-proj-") &&
              openAIKey.length >= 100 &&
              openAIKey.length <= 200) ||
              (openAIKey.startsWith("sk-") &&
                openAIKey.length >= 40 &&
                openAIKey.length <= 60)),
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
          warning: wasExtracted
            ? `Key was extracted from a longer string (original: ${originalLength} chars, extracted: ${openAIKey.length} chars). The original key appears to be duplicated or concatenated. Please update your Vercel environment variable with only the valid key.`
            : hadHiddenChars
            ? `Key had hidden characters (original: ${originalLength} chars, cleaned: ${openAIKey.length} chars)`
            : openAIKey.startsWith("sk-proj-") &&
              (openAIKey.length < 100 || openAIKey.length > 200)
            ? `Key is ${openAIKey.length < 100 ? "too short" : "too long"} (${
                openAIKey.length
              } chars). sk-proj- keys should be 100-200 characters.`
            : openAIKey.startsWith("sk-") &&
              (openAIKey.length < 40 || openAIKey.length > 60)
            ? `Key is ${openAIKey.length < 40 ? "too short" : "too long"} (${
                openAIKey.length
              } chars). sk- keys should be 40-60 characters.`
            : !openAIKey.startsWith("sk-") &&
              !openAIKey.startsWith("sk-proj-") &&
              openAIKey.length > 0
            ? `Key does not start with "sk-" or "sk-proj-". Valid OpenAI keys must start with one of these prefixes.`
            : null,
          wasExtracted: wasExtracted,
          extractedLength: openAIKeyExtracted?.length || null,
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
