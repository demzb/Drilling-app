import { Transaction } from '../types';

export const generateFinancialSummary = async (transactions: Transaction[]): Promise<string> => {
  if (transactions.length === 0) {
    return "No transaction data available to generate a summary.";
  }

  try {
    // The server is already set up with an /api/financial-summary endpoint.
    // We will call that instead of calling the Gemini API directly from the client.
    const apiEndpoint = '/api/financial-summary';

    const res = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transactions }),
    });

    if (!res.ok) {
      // Try to parse the error from the backend, otherwise use the status text.
      let errorMessage = `Request failed with status: ${res.status} ${res.statusText}`;
      try {
        const errorBody = await res.json();
        if (errorBody.error) {
          errorMessage = errorBody.error;
        }
      } catch (e) {
        // Could not parse JSON body, stick with the status text.
      }
      console.error("Server returned an error:", errorMessage);
      return `Failed to generate summary: ${errorMessage}`;
    }

    const data = await res.json();
    if (data.summary) {
      return data.summary;
    } else {
      return "Received an empty summary from the server.";
    }
  } catch (error) {
    console.error("Error fetching financial summary from backend:", error);
    return "An error occurred while communicating with the application server. Please check your network connection and try again.";
  }
};
