import { Transaction, Project } from '../types';

export const generateFinancialSummary = async (transactions: Transaction[], projects: Project[]): Promise<string> => {
  if (transactions.length === 0) {
    return "No transaction data available to generate a summary.";
  }
  
  // Assumes the frontend is served from the same origin as the backend,
  // or a proxy is set up to forward /api requests to the backend server.
  const backendUrl = '/api/generate-summary';

  try {
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transactions, projects }),
    });

    if (!response.ok) {
        let errorMsg = `Request failed with status ${response.status}`;
        try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
        } catch (e) {
            // response is not json, use text
            errorMsg = await response.text();
        }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return data.summary;

  } catch (error) {
    console.error("Error fetching financial summary from backend:", error);
    if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
            return "Could not connect to the AI service. Please ensure the backend server is running and accessible.";
        }
        return `An error occurred while communicating with the AI service: ${error.message}`;
    }
    return "An unexpected error occurred while communicating with the AI service. Please try again later.";
  }
};