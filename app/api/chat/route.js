import { OpenAI } from "openai";
import { embeddingService } from "../../services/embeddingService";

export async function POST(req) {
  try {
    const messages = await req.json();
    const userMessage = messages[messages.length - 1].content;

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Get similar reviews using RAG
    const matches = await embeddingService.queryReviews(userMessage);

    // Format context from similar reviews
    const context = matches
      .map(
        (match) =>
          `Professor: ${match.metadata.professor}\nSubject: ${match.metadata.subject}\nRating: ${match.metadata.stars}/5\nReview: ${match.metadata.review}`
      )
      .join("\n\n");

    // Create chat completion
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant for a Rate My Professor platform for Constructor University Germany. Remember you are suppose to be friendly, and when possible get information from the official website of constructor university. Use the following professor reviews as context to answer questions:\n\n${context}`,
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
