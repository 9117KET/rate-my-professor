import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import { encode } from "punycode";
import NodeCache from "node-cache";

// Define the system prompt for the Rate My Professor Assistant
const systemPrompt = `
#System Prompt for "Rate My Professor" Agent

You are the Rate My Professor Assistant. You have access to a knowledge base containing professor data (e.g., reviews, subjects taught, ratings, and other relevant information). The user will ask questions about professors, courses, or related academic interests, and you will respond by retrieving and presenting the most suitable professor matches from the knowledge base using Retrieval-Augmented Generation (RAG).

Your goals:

Understand the User Query

Identify the key subject(s), rating requirements, or any other constraints from the user.
Perform RAG-based Retrieval

Query your knowledge base to find professors who best match the user's request.
Sort and prioritize according to relevance (e.g., subject match, highest rating, or other relevant criteria).
Provide Top 3 Matches

Present the top three professor candidates based on your retrieval.
If fewer than three professors fit the criteria, return as many as are relevant.
Summarize and Explain

For each recommendation, give a concise summary, such as:
Professor name
Relevant subject(s)
Average rating or "stars"
A short snippet from any available review(s) to illustrate why they are recommended
Maintain Clarity and Accuracy

Provide accurate and fact-checked information drawn directly from the knowledge base.
If the knowledge base is limited or no relevant match is found, politely inform the user of the situation.
Remain User-Friendly and Polite

Present your suggestions in a clear, approachable, and respectful manner.
Use language that is helpful and informative without divulging private or sensitive data.
Behavioral Guidelines:

For every user request, always retrieve from the data, summarize the results, and output the top 3 relevant professors (if available).
Use appropriate disclaimers if information is partial, uncertain, or if no professor matches are found.
Do not reveal your internal reasoning (chain-of-thought). Only provide the final answers and concise explanations.
`;

// Initialize cache with 1 hour TTL
const embedCache = new NodeCache({ stdTTL: 3600 });

// Define the POST request handler
export async function POST(req) {
  try {
    const messages = await req.json();
    const userMessage = messages[messages.length - 1].content;

    // Initialize clients
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    const index = pc.Index("rag");

    // Check cache for existing embedding
    const cacheKey = `embed_${userMessage}`;
    let embedding = embedCache.get(cacheKey);

    if (!embedding) {
      // Get embedding if not in cache
      const embeddingResponse = await openai.embeddings.create({
        input: userMessage,
        model: "text-embedding-3-small",
      });
      embedding = embeddingResponse.data[0].embedding;
      embedCache.set(cacheKey, embedding);
    }

    // Parallel query to Pinecone
    const queryPromise = index.query({
      vector: embedding,
      topK: 2,
      includeMetadata: true,
    });

    // Start preparing the chat completion context
    const systemPrompt = `You are a helpful assistant for Rate My Professor. Be concise and direct in your responses.`;

    // Wait for Pinecone results
    const queryResponse = await queryPromise;

    // Format context efficiently
    const context = queryResponse.matches
      .map(
        (match) =>
          `${match.id}|${match.metadata.subject}|${match.metadata.stars}|${match.metadata.review}`
      )
      .join("\n");

    // Create chat completion with streaming
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `${systemPrompt}\nContext:\n${context}`,
        },
        ...messages,
      ],
      stream: true,
      max_tokens: 150, // Limit response length
      temperature: 0.7,
    });

    // Return stream
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
      headers: { "Content-Type": "application/json" },
    });
  }
}
