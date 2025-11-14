import { GoogleGenAI } from "@google/genai";
import { Transaction } from '../types';

export const generateFinancialSummary = async (transactions: Transaction[]): Promise<string> => {
  if (transactions.length === 0) {
    return "No transaction data available to generate a summary.";
  }
  
  if (!process.env.API_KEY) {
    console.error("Gemini API key not found. Please set it in your environment variables.");
    return "Error: AI service is not configured correctly. API key is missing.";
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
        ${JSON.stringify(transactions.map(({id, sourceId, isReadOnly, ...t}) => t), null, 2)}
    `;

     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text;

  } catch (error) {
    console.error("Error fetching financial summary from Gemini API:", error);
    return "An error occurred while communicating with the AI service. Please try again later.";
  }
};
