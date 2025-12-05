import { OpenAIApi, Configuration } from "openai-edge";

const config = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(config);

export async function getEmbeddings(text: string) {
    try {
        // Validate input
        if (!text || typeof text !== "string" || text.trim().length === 0) {
            throw new Error("Text input is required and must be a non-empty string");
        }

        // Check if API key is configured
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY is not configured");
        }

        const response = await openai.createEmbedding({
            model: "text-embedding-ada-002",
            input: text.replace(/\n/g, " "),
        });

        // Check if response is ok
        if (!response.ok) {
            const errorText = await response.text();
            console.error("OpenAI API error response:", response.status, errorText);
            throw new Error(`OpenAI API returned status ${response.status}: ${errorText}`);
        }

        const result = await response.json();

        // Validate response structure
        if (!result) {
            throw new Error("Invalid response from OpenAI API: response is null or undefined");
        }

        if (!result.data || !Array.isArray(result.data)) {
            console.error("Invalid response structure:", result);
            throw new Error(`Invalid response structure from OpenAI API. Expected data array, got: ${JSON.stringify(result)}`);
        }

        if (result.data.length === 0) {
            throw new Error("OpenAI API returned empty data array");
        }

        if (!result.data[0] || !result.data[0].embedding) {
            console.error("Invalid embedding structure:", result.data[0]);
            throw new Error("OpenAI API returned invalid embedding structure");
        }

        const embedding = result.data[0].embedding;
        if (!Array.isArray(embedding) || embedding.length === 0) {
            throw new Error("Embedding is not a valid array or is empty");
        }

        return embedding as number[];
    } catch (error) {
        console.error("Error calling OpenAI embeddings API:", error);
        
        // Provide more helpful error messages
        if (error instanceof Error) {
            // Re-throw with the original error message
            throw error;
        }
        
        // Handle unknown errors
        throw new Error(`Failed to get embeddings: ${String(error)}`);
    }
}
