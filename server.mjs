import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from "@google/genai";

const app = express();
// In a real app, you would configure CORS more securely.
app.use(cors());
app.use(express.json({ limit: '5mb' })); // Increase limit for potentially large transaction lists

const PORT = process.env.PORT || 3001;

app.post('/api/generate-summary', async (req, res) => {
  const { transactions, projects } = req.body;

  if (!transactions || !Array.isArray(transactions) || !projects || !Array.isArray(projects)) {
    return res.status(400).json({ error: 'Invalid transactions or projects data provided.' });
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

    // Clean project data for a more focused prompt
    const projectsForPrompt = projects.map(p => ({
        name: p.name,
        status: p.status,
        total_budget: p.total_budget,
        amount_received: p.amount_received
    }));

    const prompt = `
        You are a financial analyst AI for a borehole drilling company in The Gambia.
        The currency is Gambian Dalasi (GMD).
        Based on the following list of financial transactions AND project data, provide a concise and insightful summary in markdown format.
        Include:
        1. **Overall Performance:** Brief statement on financial health (e.g., profitable, loss-making, break-even) based on the transactions.
        2. **Key Figures:** Total Income, Total Expenses, and Net Profit/Loss in GMD from the transaction data.
        3. **Key Insights:** Mention the largest expense category and the primary source of income.
        4. **Actionable Recommendations:** Provide one or two brief, actionable recommendations for the business owner. **Crucially, consider the status and budget of projects in your recommendations.** For example, if a large project is 'In Progress' but payments received are low compared to its budget, you might suggest following up on invoices. If many projects are 'Completed' with good profit margins, suggest pursuing similar work. Use the provided project data to make your recommendations more specific and relevant.

        Keep the entire summary to around 4-5 paragraphs.

        Transaction data:
        ${JSON.stringify(transactions.map(({id, source_id, is_read_only, user_id, created_at, ...t}) => t), null, 2)}

        Project data:
        ${JSON.stringify(projectsForPrompt, null, 2)}
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