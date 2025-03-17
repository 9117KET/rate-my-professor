import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import { encode } from "punycode";
import NodeCache from "node-cache";
import Fuse from "fuse.js";

// Define the system prompt for the Rate My Professor Assistant
const additionalContext = `
# How to Use the Platform
- The platform is designed to help students make informed decisions about courses and professors.
- Features include a chat section for AI assistance, a rate button for submitting reviews, and a reviews section for browsing feedback.
- Users can also access tips and guidelines for using the platform effectively as well as tips from other students on how they succeeded in some courses.

# Imprint and Legal Notice
- The platform is for informational purposes only, and reviews are user-generated.
- Users should maintain anonymity and describe professor when giving bad reviews and stating professors name when giving a good review.
- The platform complies with GDPR, ensuring data protection and privacy.
`;

const systemPrompt = `
#System Prompt for "Rate My Professor AI" Agent

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

${additionalContext}
`;

// Initialize cache with 1 hour TTL
const embedCache = new NodeCache({ stdTTL: 3600 });
const professorNamesCache = new NodeCache({ stdTTL: 3600 });

// Define a more robust maximum retry count for API operations
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// Helper function to add delay between retries
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function for retrying API calls
async function retryOperation(operation, maxRetries = MAX_RETRIES) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't delay on the last attempt
      if (attempt < maxRetries) {
        await delay(RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }

  throw lastError;
}

// Helper function to normalize German characters
function normalizeGermanText(text) {
  if (!text || typeof text !== "string") return ["", ""];

  const germanCharMap = {
    ä: "ae",
    ä: "a",
    ö: "oe",
    ö: "o",
    ü: "ue",
    ü: "u",
    ß: "ss",
    ß: "s",
    Ä: "Ae",
    Ä: "A",
    Ö: "Oe",
    Ö: "O",
    Ü: "Ue",
    Ü: "U",
    á: "a",
    à: "a",
    â: "a",
    é: "e",
    è: "e",
    ê: "e",
    í: "i",
    ì: "i",
    î: "i",
    ó: "o",
    ò: "o",
    ô: "o",
    ú: "u",
    ù: "u",
    û: "u",
  };

  // First, create normalized version with standard replacements (ä -> ae)
  const normalized = text.replace(
    /[äöüßÄÖÜáàâéèêíìîóòôúùû]/g,
    (char) => germanCharMap[char] || char
  );

  // Also create simplified version for additional matching (ä -> a)
  const simplified = text
    .replace(/[äÄáàâ]/g, (c) =>
      "aA".includes(c.toUpperCase()) ? (c.toUpperCase() === "A" ? "A" : "a") : c
    )
    .replace(/[öÖóòô]/g, (c) =>
      "oO".includes(c.toUpperCase()) ? (c.toUpperCase() === "O" ? "O" : "o") : c
    )
    .replace(/[üÜúùû]/g, (c) =>
      "uU".includes(c.toUpperCase()) ? (c.toUpperCase() === "U" ? "U" : "u") : c
    )
    .replace(/[éèêëÉÈÊË]/g, (c) =>
      "eE".includes(c.toUpperCase()) ? (c.toUpperCase() === "E" ? "E" : "e") : c
    )
    .replace(/[íìîïÍÌÎÏ]/g, (c) =>
      "iI".includes(c.toUpperCase()) ? (c.toUpperCase() === "I" ? "I" : "i") : c
    )
    .replace(/[ß]/g, "ss");

  return [text, normalized, simplified];
}

// Helper function to extract professor names from Pinecone
async function getProfessorNames(index) {
  const cacheKey = "professor_names";
  let professorNames = professorNamesCache.get(cacheKey);

  if (!professorNames) {
    professorNames = [];
    let totalVectors = 0;
    const pageSize = 1000; // Adjust based on your Pinecone tier and limits
    let nextPageToken = null;

    try {
      // Fetch professor data in pages
      do {
        const fetchParams = {
          ids: [],
          includeMetadata: true,
          limit: pageSize,
        };

        if (nextPageToken) {
          fetchParams.paginationToken = nextPageToken;
        }

        const response = await index.fetch(fetchParams);

        // Process this page of results
        const pageResults = Object.values(response.vectors || {}).flatMap(
          (prof) => {
            const name = prof.metadata?.name || prof.id;
            // Skip items without a name
            if (!name) return [];

            const [original, normalized, simplified] =
              normalizeGermanText(name);
            totalVectors++;

            // Create entries for all name variants
            return [
              {
                id: prof.id,
                fullName: original,
                normalizedName: normalized,
                simplifiedName: simplified,
                department: prof.metadata?.department || "",
                subject: prof.metadata?.subject || "",
              },
              // Only add variant if different from original
              ...(normalized !== original
                ? [
                    {
                      id: prof.id,
                      fullName: normalized,
                      normalizedName: normalized,
                      simplifiedName: simplified,
                      department: prof.metadata?.department || "",
                      subject: prof.metadata?.subject || "",
                    },
                  ]
                : []),
              // Only add simplified if different from other variants
              ...(simplified !== normalized && simplified !== original
                ? [
                    {
                      id: prof.id,
                      fullName: simplified,
                      normalizedName: simplified,
                      simplifiedName: simplified,
                      department: prof.metadata?.department || "",
                      subject: prof.metadata?.subject || "",
                    },
                  ]
                : []),
            ];
          }
        );

        professorNames = [...professorNames, ...pageResults];
        nextPageToken = response.paginationToken;
      } while (nextPageToken);

      // Cache the results
      professorNamesCache.set(cacheKey, professorNames);
      console.log(
        `Cached ${professorNames.length} name variants for ${totalVectors} professors`
      );
    } catch (error) {
      console.error("Error fetching professor names:", error);
      // Return empty array on error rather than failing
      return [];
    }
  }

  return professorNames;
}

// Helper function to find potential professor name matches
function findProfessorMatches(userMessage, professorNames) {
  // Pre-process user message to remove common titles and prefixes
  const preprocessedMessage = userMessage
    .replace(
      /\b(prof|professor|dr|doktor|dozent|herr|frau|mr|ms|mrs|miss)\b\.?\s*/gi,
      ""
    )
    .trim();

  const [originalQuery, normalizedQuery, simplifiedQuery] =
    normalizeGermanText(preprocessedMessage);

  const fuseOptions = {
    keys: [
      { name: "fullName", weight: 2 },
      { name: "normalizedName", weight: 2 },
      { name: "department", weight: 0.5 },
      { name: "subject", weight: 0.5 },
    ],
    includeScore: true,
    threshold: 0.65, // Slightly increased threshold for more permissive matching
    distance: 100,
    ignoreLocation: true, // Ignore where in the string the match occurs
    useExtendedSearch: true,
    getFn: (obj, path) => {
      // Custom getter to handle all forms of the name
      const value = Fuse.config.getFn(obj, path);
      if (typeof value === "string") {
        const [original, normalized, simplified] = normalizeGermanText(value);
        return [original, normalized, simplified];
      }
      return value;
    },
  };

  const fuse = new Fuse(professorNames, fuseOptions);

  // Create pattern variations for the search
  const searchPatterns = [];

  // Add full queries
  searchPatterns.push(originalQuery);
  if (normalizedQuery !== originalQuery) searchPatterns.push(normalizedQuery);
  if (simplifiedQuery !== normalizedQuery && simplifiedQuery !== originalQuery)
    searchPatterns.push(simplifiedQuery);

  // Split into words and create combinations
  const words = preprocessedMessage.toLowerCase().split(/\s+/);

  // Add individual word patterns for words of sufficient length
  words.forEach((word) => {
    if (word.length >= 3) {
      const [originalWord, normalizedWord, simplifiedWord] =
        normalizeGermanText(word);
      searchPatterns.push(originalWord);
      if (normalizedWord !== originalWord) searchPatterns.push(normalizedWord);
      if (simplifiedWord !== normalizedWord && simplifiedWord !== originalWord)
        searchPatterns.push(simplifiedWord);
    }
  });

  // Add adjacent word pairs
  for (let i = 0; i < words.length - 1; i++) {
    const pairText = `${words[i]} ${words[i + 1]}`;
    const [originalPair, normalizedPair, simplifiedPair] =
      normalizeGermanText(pairText);
    searchPatterns.push(originalPair);
    if (normalizedPair !== originalPair) searchPatterns.push(normalizedPair);
    if (simplifiedPair !== normalizedPair && simplifiedPair !== originalPair)
      searchPatterns.push(simplifiedPair);
  }

  // Perform searches and collect results
  const matches = new Set();
  const seenScores = new Map(); // Track best scores for each ID

  // Remove duplicates from search patterns
  const uniquePatterns = [...new Set(searchPatterns)];

  uniquePatterns.forEach((pattern) => {
    const results = fuse.search(pattern);
    results.forEach((result) => {
      const currentScore = result.score;
      const previousScore = seenScores.get(result.item.id);

      // Keep the result if it's the first occurrence or has a better score
      if (previousScore === undefined || currentScore < previousScore) {
        matches.add(result.item.id);
        seenScores.set(result.item.id, currentScore);
      }
    });
  });

  return Array.from(matches);
}

// Define the POST request handler
export async function POST(req) {
  try {
    const messages = await req.json();
    const userMessage = messages[messages.length - 1].content;

    if (
      !userMessage ||
      typeof userMessage !== "string" ||
      userMessage.trim().length === 0
    ) {
      return new Response(
        JSON.stringify({ error: "Please provide a valid query." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize clients
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    // Check if API keys are available
    if (!process.env.OPENAI_API_KEY || !process.env.PINECONE_API_KEY) {
      console.error("Missing API keys");
      return new Response(
        JSON.stringify({
          error: "Server configuration error. Please contact support.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const index = pc.Index("rag");

    // Get professor names and find potential matches in parallel
    const professorsPromise = getProfessorNames(index);

    // Check cache for existing embedding in parallel
    const cacheKey = `embed_${userMessage}`;
    let embedding = embedCache.get(cacheKey);

    let embeddingPromise;
    if (!embedding) {
      embeddingPromise = retryOperation(async () => {
        const embeddingResponse = await openai.embeddings.create({
          input: userMessage,
          model: "text-embedding-3-small",
        });
        return embeddingResponse.data[0].embedding;
      });
    }

    // Wait for professor names
    let professorNames;
    try {
      professorNames = await professorsPromise;
    } catch (error) {
      console.error("Error fetching professor names:", error);
      professorNames = [];
    }

    // Find potential matches
    const potentialProfessorMatches = findProfessorMatches(
      userMessage,
      professorNames
    );

    // Get professor name suggestions for the UI
    let professorNameSuggestions = [];
    if (potentialProfessorMatches.length > 0) {
      // Get unique, original professor names for all matched IDs
      const matchedProfessorSet = new Set();
      professorNames.forEach((prof) => {
        if (potentialProfessorMatches.includes(prof.id)) {
          matchedProfessorSet.add(prof.fullName);
        }
      });
      professorNameSuggestions = Array.from(matchedProfessorSet).slice(0, 5); // Limit to top 5
    }

    // Wait for embedding if it was being calculated
    if (embeddingPromise) {
      try {
        embedding = await embeddingPromise;
        embedCache.set(cacheKey, embedding);
      } catch (error) {
        console.error("Error creating embedding:", error);
        return new Response(
          JSON.stringify({
            error: "Failed to process your query. Please try again.",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Query Pinecone with both semantic search and name matches
    let queryResponse;
    try {
      queryResponse = await retryOperation(async () => {
        return await index.query({
          vector: embedding,
          topK: 5,
          includeMetadata: true,
          filter:
            potentialProfessorMatches.length > 0
              ? { id: { $in: potentialProfessorMatches } }
              : undefined,
        });
      });
    } catch (error) {
      console.error("Error querying Pinecone:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to search the database. Please try again.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if we have any results
    if (!queryResponse.matches || queryResponse.matches.length === 0) {
      // If no matches found with filter, try again without filter for fallback results
      if (potentialProfessorMatches.length > 0) {
        try {
          queryResponse = await retryOperation(async () => {
            return await index.query({
              vector: embedding,
              topK: 5,
              includeMetadata: true,
            });
          });
        } catch (error) {
          console.error("Error in fallback Pinecone query:", error);
        }
      }

      // If still no results, inform the user
      if (!queryResponse.matches || queryResponse.matches.length === 0) {
        // We'll continue but make sure to handle this in the AI response
        console.log("No matching professors found for query:", userMessage);
      }
    }

    // Format context with more detailed information
    const context = (queryResponse.matches || [])
      .map((match) => {
        const metadata = match.metadata || {};
        return `Professor ID: ${match.id}
Full Name: ${metadata.name || match.id}
Subject: ${metadata.subject || "N/A"}
Department: ${metadata.department || "N/A"}
Rating: ${metadata.stars || "N/A"} stars
Review: ${metadata.review || "No review available"}
Similarity Score: ${match.score}
${"-".repeat(50)}`;
      })
      .join("\n");

    // Check if the total context is empty
    const noResults =
      queryResponse.matches?.length === 0 || !queryResponse.matches;

    // Enhance system prompt with handling for name variations
    const enhancedPrompt = `${systemPrompt}
Additional Instructions:
- I understand that professor names might contain German special characters (ä, ö, ü, ß).
- If a user types a name without special characters, I'll match it to professors with those characters (e.g., "Muller" will match "Müller").
- If no exact matches are found, I'll suggest similar names that might match their query, including variations with German characters.
- I should always explain why I'm showing certain results, especially if they're based on partial or phonetic matches.
- When suggesting professors, I'll show both the correct spelling with special characters and common alternative spellings.
${
  noResults
    ? "- No professors matching the query were found in the database. I should explain this politely and suggest that the user try a different query or check the spelling."
    : ""
}

${
  professorNameSuggestions.length > 0
    ? `Potential professor name matches for this query: ${professorNameSuggestions.join(
        ", "
      )}`
    : ""
}

Context:\n${context || "No matching professors found."}`;

    // Create chat completion with streaming
    const response = await retryOperation(async () => {
      return await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: enhancedPrompt,
          },
          ...messages,
        ],
        stream: true,
        max_tokens: 1500,
        temperature: 0.7,
      });
    });

    // Return stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const text = chunk.choices[0]?.delta?.content || "";
            controller.enqueue(text);
          }
        } catch (error) {
          console.error("Error in streaming response:", error);
          controller.enqueue(
            "\n\nI'm sorry, there was an error processing your request. Please try again later."
          );
        }
        controller.close();
      },
    });

    return new Response(stream);
  } catch (error) {
    console.error("Error in POST handler:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unknown error occurred" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
