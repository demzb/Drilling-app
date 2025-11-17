import { GoogleGenAI } from '@google/genai';
import { Transaction, Project } from '../types';

export const generateFinancialSummary = async (
  transactions: Transaction[], 
  projects: Project[],
  startDate?: string,
  endDate?: string
): Promise<string> => {
  if (transactions.length === 0) {
    return "No transaction data available for the selected period to generate a summary.";
  }

  if (!process.env.API_KEY) {
    console.error("Gemini API key not found. Please set it in your environment variables.");
    return "AI service is not configured correctly. API key is missing.";
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

    const dateRangeText = startDate && endDate 
        ? `The analysis period is from ${startDate} to ${endDate}.`
        : `The analysis is for all time.`;


    const prompt = `
        You are a professional financial analyst AI creating a formal business report for YS Borehole Drilling Company in The Gambia.
        The currency is Gambian Dalasi (GMD).

        First, create a professional letterhead for the business at the top of the report:
        ### YS BOREHOLE DRILLING COMPANY
        **Deals in borehole drilling solar installation, plumbing and electrical specialist**
        Brusubi, The Gambia, West Africa
        Tel: +2203522014 / 7770568 / 2030995
        Email: yusuphasambou1234@gmail.com
        ***

        Then, provide a detailed and insightful "Financial Analysis Report" in markdown format based on the following list of financial transactions AND project data. ${dateRangeText} The report should be well-structured and easy to read.

        The report must include these sections:
        1.  **Executive Summary:** A high-level paragraph summarizing the key findings, overall financial health, and the most critical takeaway for the business owner FOR THE SPECIFIED PERIOD.
        2.  **Financial Performance Analysis:**
            - Provide the key figures for the period: Total Income, Total Expenses, and Net Profit/Loss in GMD.
            - Calculate and state the Profit Margin ((Net Profit / Total Income) * 100) for the period and provide a brief interpretation (e.g., "This indicates a healthy profit margin of X%...").
        3.  **Project-Based Insights:**
            - Analyze the provided project data in conjunction with the financial transactions from the period.
            - Identify projects with significant financial activity (income or expenses) during this period.
            - Highlight any 'In Progress' projects where the amount received is significantly less than the total budget, suggesting a need to follow up on payments.
            - Comment on the overall financial status of active projects.
        4.  **Cash Flow Breakdown (for the period):**
            - Identify the top 3 largest expense categories during this period and list their total amounts.
            - Identify the primary sources of income during this period (e.g., "Client Payments for completed projects").
        5.  **Strategic Recommendations:**
            - Provide two to three concrete, actionable recommendations based on your analysis of this period.
            - For example: "Focus on securing more 'Solar Powered (Large)' projects as they appear to have higher profitability." or "Review logistics spending, as it's the highest expense category; explore alternative suppliers or bulk purchasing."

        Use markdown formatting like bolding for emphasis on key terms and figures, and use bullet points for lists to improve readability.

        Transaction data (for the specified period):
        ${JSON.stringify(transactions.map(({id, source_id, is_read_only, user_id, created_at, ...t}) => t), null, 2)}

        Project data (all projects, for context):
        ${JSON.stringify(projectsForPrompt, null, 2)}
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    return response.text;

  } catch (error) {
    console.error("Error fetching financial summary from Gemini API:", error);
    if (error instanceof Error) {
        return `An error occurred while communicating with the AI service: ${error.message}`;
    }
    return "An unexpected error occurred while communicating with the AI service. Please try again later.";
  }
};