/**
 * Diagnostic endpoint to check environment variables
 * This helps debug API key issues in production
 * WARNING: Remove this endpoint after debugging for security
 */
export async function GET() {
  try {
    const openAIKey = process.env.OPENAI_API_KEY;
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
          endsWith: openAIKey
            ? openAIKey.substring(openAIKey.length - 10)
            : "N/A",
        },
        pinecone: {
          present: !!pineconeKey,
          preview: pineconePreview,
          length: pineconeKey?.length || 0,
          startsWithPcsk: pineconeKey?.startsWith("pcsk_") || false,
        },
        timestamp: new Date().toISOString(),
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
