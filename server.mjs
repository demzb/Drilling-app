import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from "@google/genai";

const app = express();
// In a real app, you would configure CORS more securely.
app.use(cors());
app.use(express.json({ limit: '5mb' })); // Increase limit for potentially large transaction lists

const PORT = process.env.PORT || 3001;

app.post('/api/generate-summary', async (req, res) => {
  const { transactions } = req.body;

  if (!transactions || !Array.isArray(transactions)) {
    return res.status(400).json({ error: 'Invalid transactions data provided.' });
  }

  if (transactions.length === 0) {
    return res.json({ summary: "No transaction data available to generate a summary." });
  }
  
  if (!process.env.API_KEY) {
    console.error("Gemini API key not found. Please set it in your environment variables.");
    return res.status(500).json({ error: "AI service is not configured correctly. API key is missing." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
        You are a financial analyst AI for a borehole drilling company in The Gambia.
        The currency is Gambian Dalasi (GMD).
        Based on the following list of financial transactions, provide a concise and insightful summary in markdown format.
        Include:
        1. **Overall Performance:** Brief statement on financial health (e.g., profitable, loss-making, break-even).
        2. **Key Figures:** Total Income, Total Expenses, and Net Profit/Loss in GMD.
        3. **Key Insights:** Mention the largest expense category and the primary source of income based on the data.
        4. **Actionable Recommendations:** Provide one or two brief, actionable recommendations for the business owner (e.g., "Consider reviewing material costs as they form the bulk of expenses," or "Focus on securing more large-scale solar projects as they are the main revenue driver.").
        
        Keep the entire summary to around 4-5 paragraphs.

        Transaction data:
        ${JSON.stringify(transactions.map(({id, sourceId, isReadOnly, user_id, created_at, ...t}) => t), null, 2)}
    `;

     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    res.json({ summary: response.text });

  } catch (error) {
    console.error("Error fetching financial summary from Gemini API:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ error: `An error occurred while communicating with the AI service: ${errorMessage}` });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
