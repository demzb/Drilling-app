import { Transaction } from '../types';

export const generateFinancialSummary = async (transactions: Transaction[]): Promise<string> => {
  if (transactions.length === 0) {
    return "No transaction data available to generate a summary.";
  }
  
  try {
    const response = await fetch('/api/financial-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transactions }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error from summary API:", errorData);
      return `Error: ${errorData.error || 'Failed to generate summary from server.'}`;
    }

    const data = await response.json();
    return data.summary;

  } catch (error) {
    console.error("Error generating financial summary:", error);
    return "An error occurred while communicating with the AI service. Please check your network connection and try again.";
  }
};
