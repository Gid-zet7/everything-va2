import { Configuration, OpenAIApi } from "openai-edge";
import { Message, OpenAIStream, StreamingTextResponse } from "ai";

import { NextResponse } from "next/server";
import { OramaManager } from "@/lib/orama";
import { db } from "@/server/db";
import { getKindeUserForAPI } from "@/lib/kinde";
import { getSubscriptionStatus } from "@/lib/stripe-actions";
import { FREE_CREDITS_PER_DAY } from "@/app/constants";

// export const runtime = "edge";

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

export async function POST(req: Request) {
  try {
    const user = await getKindeUserForAPI();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;
    
    // Validate request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
    }
    
    const { messages, accountId } = body;
    
    // Validate required fields
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 });
    }
    
    if (!accountId || typeof accountId !== "string") {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
    }
    
    // Check subscription and rate limits
    const isSubscribed = await getSubscriptionStatus();
    if (!isSubscribed) {
      const today = new Date().toDateString();
      
      let chatbotInteraction;
      try {
        // First, try to find existing record for today using composite unique key
        chatbotInteraction = await db.chatbotInteraction.findUnique({
          where: {
            day_userId: {
              day: today,
              userId,
            },
          },
        });
        
        // If not found, try to create one
        if (!chatbotInteraction) {
          try {
            chatbotInteraction = await db.chatbotInteraction.create({
              data: {
                day: today,
                count: 1,
                userId,
              },
            });
          } catch (createError: any) {
            // Handle race condition: if creation fails due to unique constraint,
            // another request likely created it - try to find it again
            if (createError?.code === 'P2002') {
              // Wait a tiny bit to let the other transaction complete
              await new Promise(resolve => setTimeout(resolve, 50));
              
              chatbotInteraction = await db.chatbotInteraction.findUnique({
                where: {
                  day_userId: {
                    day: today,
                    userId,
                  },
                },
              });
              
              // If still not found and error is about userId unique constraint,
              // there's an existing record for a different day - update it
              if (!chatbotInteraction && createError.meta?.target?.includes('userId')) {
                const existingRecord = await db.chatbotInteraction.findUnique({
                  where: { userId },
                });
                
                if (existingRecord) {
                  // Update existing record to today and reset count if it's a new day
                  if (existingRecord.day !== today) {
                    chatbotInteraction = await db.chatbotInteraction.update({
                      where: { userId },
                      data: {
                        day: today,
                        count: 1,
                      },
                    });
                  } else {
                    chatbotInteraction = existingRecord;
                  }
                }
              }
              
              // If we still don't have a record, re-throw the error
              if (!chatbotInteraction) {
                throw createError;
              }
            } else {
              throw createError;
            }
          }
        }
      } catch (error) {
        console.error("Error checking/creating chatbot interaction:", error);
        // If we can't check the limit due to a database error, 
        // log it but allow the request to proceed (fail open)
        chatbotInteraction = null;
      }
      
      // Check if limit is reached
      if (chatbotInteraction && chatbotInteraction.count >= FREE_CREDITS_PER_DAY) {
        return NextResponse.json({ error: "Limit reached" }, { status: 429 });
      }
    }
    
    // Verify account exists and belongs to user
    const account = await db.account.findFirst({
      where: {
        id: accountId,
        userId,
      },
      select: { id: true },
    });
    
    if (!account) {
      return NextResponse.json(
        { error: "Account not found or access denied" },
        { status: 404 }
      );
    }
    
    // Initialize Orama manager with error handling
    let oramaManager: OramaManager;
    try {
      oramaManager = new OramaManager(accountId);
      await oramaManager.initialize();
    } catch (error) {
      console.error("Error initializing Orama manager:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      if (errorMessage.includes("Account not found")) {
        return NextResponse.json(
          { error: "Account not found. Please select a valid email account." },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: `Failed to initialize search index: ${errorMessage}` },
        { status: 500 }
      );
    }
    
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.content) {
      return NextResponse.json({ error: "Last message content is required" }, { status: 400 });
    }
    
    // Perform vector search with error handling
    let context;
    try {
      context = await oramaManager.vectorSearch({
        prompt: lastMessage.content,
      });
      console.log(context.hits.length + " hits found");
    } catch (error) {
      console.error("Error performing vector search:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // If it's an embeddings error, provide specific feedback
      if (errorMessage.includes("embedding") || errorMessage.includes("OpenAI") || errorMessage.includes("OPENAI_API_KEY")) {
        if (errorMessage.includes("not configured") || errorMessage.includes("OPENAI_API_KEY")) {
          return NextResponse.json(
            { error: "AI service is not properly configured. Please contact support." },
            { status: 500 }
          );
        }
        return NextResponse.json(
          { error: "Search service unavailable. Please try again later." },
          { status: 503 }
        );
      }
      
      // If it's a validation error (empty text, etc.)
      if (errorMessage.includes("required") || errorMessage.includes("empty") || errorMessage.includes("invalid")) {
        return NextResponse.json(
          { error: `Invalid search query: ${errorMessage}` },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: `Search failed: ${errorMessage}` },
        { status: 500 }
      );
    }
    
    // Build context string with fallback for empty results
    const contextString = context.hits.length > 0
      ? context.hits.map((hit) => JSON.stringify(hit.document)).join("\n")
      : "No relevant emails found in your mailbox for this query.";
    
    const prompt = {
      role: "system",
      content: `You are an AI email assistant embedded in an email client app. Your purpose is to help the user compose emails by answering questions, providing suggestions, and offering relevant information based on the context of their previous emails.
            THE TIME NOW IS ${new Date().toLocaleString()}
      
      START CONTEXT BLOCK
      ${contextString}
      END OF CONTEXT BLOCK
      
      When responding, please keep in mind:
      - Be helpful, clever, and articulate.
      - Rely on the provided email context to inform your responses.
      - If the context does not contain enough information to answer a question, politely say you don't have enough information.
      - Avoid apologizing for previous responses. Instead, indicate that you have updated your knowledge based on new information.
      - Do not invent or speculate about anything that is not directly supported by the email context.
      - Keep your responses concise and relevant to the user's questions or the email being composed.`,
    };

    // Create OpenAI chat completion with error handling
    let response;
    try {
      response = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          prompt,
          ...messages.filter((message: Message) => message.role === "user"),
        ],
        stream: true,
      });
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      if (errorMessage.includes("API key") || errorMessage.includes("authentication")) {
        return NextResponse.json(
          { error: "AI service configuration error. Please contact support." },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: `AI service unavailable: ${errorMessage}` },
        { status: 503 }
      );
    }
    
    const stream = OpenAIStream(response, {
      onStart: async () => {},
      onCompletion: async (completion) => {
        try {
          const today = new Date().toDateString();
          // Use upsert to handle the case where the record might not exist
          // (though it should exist if we got past the rate limit check)
          await db.chatbotInteraction.upsert({
            where: {
              day_userId: {
                day: today,
                userId,
              },
            },
            create: {
              day: today,
              count: 1,
              userId,
            },
            update: {
              count: {
                increment: 1,
              },
            },
          });
        } catch (error) {
          console.error("Error updating chatbot interaction count:", error);
          // Don't fail the request if counting fails
        }
      },
    });
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error("Unexpected error in chat API:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json(
      { error: `Server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
