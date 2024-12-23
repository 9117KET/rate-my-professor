import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import { encode } from "punycode";

// Define the system prompt for the Rate My Professor Assistant
const systemPrompt = `
#System Prompt for “Rate My Professor” Agent

You are the Rate My Professor Assistant. You have access to a knowledge base containing professor data (e.g., reviews, subjects taught, ratings, and other relevant information). The user will ask questions about professors, courses, or related academic interests, and you will respond by retrieving and presenting the most suitable professor matches from the knowledge base using Retrieval-Augmented Generation (RAG).

Your goals:

Understand the User Query

Identify the key subject(s), rating requirements, or any other constraints from the user.
Perform RAG-based Retrieval

Query your knowledge base to find professors who best match the user’s request.
Sort and prioritize according to relevance (e.g., subject match, highest rating, or other relevant criteria).
Provide Top 3 Matches

Present the top three professor candidates based on your retrieval.
If fewer than three professors fit the criteria, return as many as are relevant.
Summarize and Explain

For each recommendation, give a concise summary, such as:
Professor name
Relevant subject(s)
Average rating or “stars”
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

// Define the POST request handler
export async function POST(req) {
  // Parse the incoming request data
  const data = await req.json();

  // Initialize Pinecone client with API key
  const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });

  // Access the specific index and namespace in Pinecone
  const index = pc.index("rag").namespace("ns1");

  // Initialize OpenAI client
  const openai = new OpenAI();

  // Extract the last message content from the request data
  const text = data[data.length - 1].content;

  // Create an embedding for the text using OpenAI's embedding model
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  });

  // Query the Pinecone index with the embedding to find top 3 matches
  const results = await index.query({
    topK: 3,
    includeMetadata: true,
    vector: embedding.data[0].embedding,
  });

  // Construct a result string from the query matches
  let resultString = "Return Results from vector db (done automatically):";
  results.matches.forEach((match) => {
    resultString += `\n
    Professor: ${match.id}
    Review: ${match.metadata.stars}
    Subject: ${match.metadata.subject}
    Stars ${match.metadata.stars}
    \n\n
    `;
  });

  // Prepare the last message content with the result string
  const lastMessage = data[data.length - 1];
  const lastMessageContent = lastMessage.content + resultString;

  // Exclude the last message from the data for the chat completion
  const lastDataWithoutLastMessage = data.slice(0, data.length - 1);

  // Create a chat completion using OpenAI's API
  const completion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      ...lastDataWithoutLastMessage,
      { role: "user", content: lastMessageContent },
    ],
    model: "gpt-4o-mini",
    stream: true,
  });

  // Create a readable stream to handle the completion response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        // Iterate over the completion chunks and enqueue them to the stream
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            const text = encode(content);
            controller.enqueue(text);
          }
        }
      } catch (err) {
        // Handle any errors during streaming
        controller.error(err);
      } finally {
        // Close the stream when done
        controller.close();
      }
    },
  });

  // Return the response as a Next.js response object
  return new NextResponse(stream);
}
