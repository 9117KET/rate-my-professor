import { OpenAI } from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

export async function POST(req) {
  try {
    const messages = await req.json();

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Initialize Pinecone
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    const index = pc.Index("rag");

    // Get the last user message
    const userMessage = messages[messages.length - 1].content;

    // Get embedding for the user's question
    const embedding = await openai.embeddings.create({
      input: userMessage,
      model: "text-embedding-3-small",
    });

    // Query Pinecone
    const queryResponse = await index.query({
      vector: embedding.data[0].embedding,
      topK: 3,
      includeMetadata: true,
    });

    // Format context from similar reviews
    const context = queryResponse.matches
      .map(
        (match) =>
          `Professor: ${match.id}\nSubject: ${match.metadata.subject}\nRating: ${match.metadata.stars}/5\nReview: ${match.metadata.review}`
      )
      .join("\n\n");

    // Create chat completion
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant for a Rate My Professor platform. Use the following professor reviews as context to answer questions:\n\n${context}`,
        },
        ...messages,
      ],
      stream: true,
    });

    // Create and return the stream
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const text = chunk.choices[0]?.delta?.content || "";
          controller.enqueue(text);
        }
        controller.close();
      },
    });

    return new Response(stream);
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
