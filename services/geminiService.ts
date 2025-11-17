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

  // The Gemini API call is now made from the backend.
  // Vercel will automatically handle this as a serverless function.
  const apiEndpoint = '/api/generate-summary';

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transactions, projects, startDate, endDate }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.summary;

  } catch (error) {
    console.error("Error fetching financial summary from backend:", error);
    if (error instanceof Error) {
        return `An error occurred while communicating with the AI service: ${error.message}`;
    }
    return "An unexpected error occurred while communicating with the AI service. Please check the server logs and ensure your Vercel environment variables are set.";
  }
};
