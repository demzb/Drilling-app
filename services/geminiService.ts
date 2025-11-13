import { Transaction } from '../types';
import { GoogleGenAI } from "@google/genai";

export const generateFinancialSummary = async (transactions: Transaction[]): Promise<string> => {
  if (transactions.length === 0) {
    return "No transaction data available to generate a summary.";
  }

  if (!process.env.API_KEY) {
    return "Error: API Key not configured. Please set the API_KEY environment variable.";
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
        You are a financial analyst AI for a borehole drilling company.
        Based on the following list of financial transactions, provide a concise and insightful summary in markdown format.
        Include:
        1. **Overall Performance:** Brief statement on financial health.
        2. **Key Figures:** Total Income, Total Expenses, Net Profit/Loss.
        3. **Key Insights:** Largest expense category, primary income source.
        4. **Recommendations:** One or two brief, actionable recommendations.
        Transaction data:
        ${JSON.stringify(transactions, null, 2)}
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating financial summary with Gemini:", error);
    return "An error occurred while communicating with the AI service. Please check your network connection and API key, then try again.";
  }
};
