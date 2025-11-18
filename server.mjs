import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from "@google/genai";

const app = express();
// In a real app, you would configure CORS more securely.
app.use(cors());
app.use(express.json({ limit: '5mb' })); // Increase limit for potentially large transaction lists

app.post('/api/generate-summary', async (req, res) => {
  const { transactions, projects, startDate, endDate } = req.body;

  if (!transactions || !Array.isArray(transactions) || !projects || !Array.isArray(projects)) {
    return res.status(400).json({ error: 'Invalid transactions or projects data provided.' });
  }

  if (transactions.length === 0) {
    return res.json({ summary: "No transaction data available for the selected period to generate a summary." });
  }
  
  if (!process.env.API_KEY) {
    console.error("Gemini API key not found. Please set it in your environment variables.");
    const vercelInfo = "If deploying on Vercel, make sure to add API_KEY to your project's Environment Variables in the settings.";
    return res.status(500).json({ error: `AI service is not configured correctly. API key is missing. ${vercelInfo}` });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Pre-calculate project profitability to provide more context to the AI
    const projectsWithProfitability = projects.map((p) => {
        const materialCosts = (p.materials || []).reduce((sum, m) => sum + (m.quantity * m.unitCost), 0);
        const staffCosts = (p.staff || []).reduce((sum, s) => sum + s.paymentAmount, 0);
        const otherCosts = (p.other_expenses || []).reduce((sum, e) => sum + e.amount, 0);
        const totalCosts = materialCosts + staffCosts + otherCosts;
        const netProfit = p.amount_received - totalCosts;

        return {
            name: p.name,
            status: p.status,
            revenue: p.amount_received,
            totalCosts: totalCosts,
            netProfit: netProfit,
        };
    });

    const prompt = `
    You are a professional financial analyst AI. Your task is to create a visually appealing and easy-to-read "Financial Analysis Report" for YS Borehole Drilling Company in The Gambia.
    The report MUST be a single block of HTML, using only INLINE CSS STYLES for all styling. The currency is Gambian Dalasi (GMD).

    **IMPORTANT RULES:**
    - DO NOT include \`<html>\`, \`<head>\`, or \`<body>\` tags.
    - DO NOT use markdown, CSS classes, or \`<style>\` blocks. ALL STYLING MUST BE INLINE \`style="..."\` attributes.
    - The entire output must be a single block of HTML content that can be injected into a parent \`div\`.
    - Use color effectively: \`#16A34A\` (green) for income/profit, \`#DC2626\` (red) for expenses/loss, \`#2563EB\` (blue) for neutral/net profit.
    - Use \`<table>\` for layouts to ensure compatibility with document editors like MS Word.

    Here is the required structure and styling. Follow it closely:

    <!-- Main container with styles for centering, padding, and background -->
    <div style="max-width: 800px; margin: auto; background-color: #ffffff; padding: 24px; font-family: Arial, sans-serif; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <!-- 1. Letterhead Section -->
        <div style="text-align: center; border-bottom: 2px solid #E5E7EB; padding-bottom: 1rem; margin-bottom: 1.5rem;">
            <h2 style="font-size: 1.5rem; font-weight: 700; color: #1D4ED8; margin: 0;">YS BOREHOLE DRILLING COMPANY</h2>
            <p style="font-size: 0.875rem; font-weight: 600; color: #4B5563; margin: 0.25rem 0 0 0;">Deals in borehole drilling solar installation, plumbing and electrical specialist</p>
            <p style="font-size: 0.75rem; color: #6B7280; margin: 0.5rem 0 0 0;">Brusubi, The Gambia, West Africa</p>
            <p style="font-size: 0.75rem; color: #6B7280; margin: 0;">Tel: +2203522014 / 7770568 / 2030995 | Email: yusuphasambou1234@gmail.com</p>
        </div>

        <!-- Report Title -->
        <h3 style="font-size: 1.25rem; font-weight: 600; text-align: center; color: #1F2937; margin-bottom: 0.5rem;">Financial Analysis Report</h3>
        <p style="font-size: 0.875rem; text-align: center; color: #6B7280; margin-bottom: 1.5rem;">For the period: ${startDate || 'All Time'} to ${endDate || 'Present'}</p>

        <!-- 2. Key Figures Section -->
        <table style="width: 100%; border-collapse: separate; border-spacing: 1rem; margin-bottom: 1.5rem;">
            <tr>
                <td style="width: 33.33%; background-color: #ECFDF5; padding: 1rem; border-radius: 0.5rem; text-align: center; border: 1px solid #A7F3D0;">
                    <p style="font-size: 0.875rem; font-weight: 500; color: #065F46; margin: 0;">Total Income</p>
                    <p style="font-size: 1.5rem; font-weight: 700; color: #047857; margin-top: 0.25rem;">GMD [CALCULATED TOTAL INCOME]</p>
                </td>
                <td style="width: 33.33%; background-color: #FEF2F2; padding: 1rem; border-radius: 0.5rem; text-align: center; border: 1px solid #FECACA;">
                    <p style="font-size: 0.875rem; font-weight: 500; color: #991B1B; margin: 0;">Total Expenses</p>
                    <p style="font-size: 1.5rem; font-weight: 700; color: #B91C1C; margin-top: 0.25rem;">GMD [CALCULATED TOTAL EXPENSES]</p>
                </td>
                <td style="width: 33.33%; background-color: #EFF6FF; padding: 1rem; border-radius: 0.5rem; text-align: center; border: 1px solid #BFDBFE;">
                    <p style="font-size: 0.875rem; font-weight: 500; color: #1E40AF; margin: 0;">Net Profit / Loss</p>
                    <p style="font-size: 1.5rem; font-weight: 700; color: #1D4ED8; margin-top: 0.25rem;">GMD [CALCULATED NET PROFIT/LOSS]</p>
                </td>
            </tr>
        </table>
        
        <!-- 3. Executive Summary Section -->
        <div>
            <h3 style="font-size: 1.125rem; font-weight: 600; color: #1F2937; border-bottom: 2px solid #E5E7EB; padding-bottom: 0.5rem; margin-bottom: 0.75rem;">Executive Summary</h3>
            <p style="color: #4B5563; font-size: 0.875rem; line-height: 1.6;">[YOUR DETAILED SUMMARY PARAGRAPH HERE. Briefly touch upon overall profitability, key project performance, and major cash flow movements.]</p>
        </div>
        
        <!-- 4. Summary of Income and Expenses -->
        <div style="margin-top: 1.5rem;">
            <h3 style="font-size: 1.125rem; font-weight: 600; color: #1F2937; border-bottom: 2px solid #E5E7EB; padding-bottom: 0.5rem; margin-bottom: 0.75rem;">Summary of Income and Expenses</h3>
            <table style="width: 100%; border-collapse: separate; border-spacing: 2rem 0;">
                <tr>
                    <td style="width: 50%; vertical-align: top;">
                        <h4 style="font-weight: 600; color: #374151; margin-bottom: 0.5rem; text-align: center;">Income Sources</h4>
                        <table style="width: 100%; font-size: 0.875rem; background-color: #ffffff; border-radius: 0.5rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); border: 1px solid #E5E7EB;">
                            <thead style="background-color: #F9FAFB;">
                                <tr>
                                    <th style="padding: 0.5rem; text-align: left; font-weight: 500;">Category</th>
                                    <th style="padding: 0.5rem; text-align: right; font-weight: 500;">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- DYNAMICALLY GENERATE ONE ROW PER INCOME CATEGORY FROM THE TRANSACTION DATA. -->
                            </tbody>
                            <tfoot>
                                <tr style="font-weight: 700; border-top: 2px solid #E5E7EB;">
                                    <td style="padding: 0.5rem;">Total Income</td>
                                    <td style="padding: 0.5rem; text-align: right; color: #16A34A;">[CALCULATED TOTAL INCOME]</td>
                                </tr>
                            </tfoot>
                        </table>
                    </td>
                    <td style="width: 50%; vertical-align: top;">
                        <h4 style="font-weight: 600; color: #374151; margin-bottom: 0.5rem; text-align: center;">Expense Categories</h4>
                        <table style="width: 100%; font-size: 0.875rem; background-color: #ffffff; border-radius: 0.5rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); border: 1px solid #E5E7EB;">
                            <thead style="background-color: #F9FAFB;">
                                <tr>
                                    <th style="padding: 0.5rem; text-align: left; font-weight: 500;">Category</th>
                                    <th style="padding: 0.5rem; text-align: right; font-weight: 500;">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- DYNAMICALLY GENERATE ONE ROW PER EXPENSE CATEGORY FROM THE TRANSACTION DATA. -->
                            </tbody>
                            <tfoot>
                                <tr style="font-weight: 700; border-top: 2px solid #E5E7EB;">
                                    <td style="padding: 0.5rem;">Total Expenses</td>
                                    <td style="padding: 0.5rem; text-align: right; color: #DC2626;">[CALCULATED TOTAL EXPENSES]</td>
                                </tr>
                            </tfoot>
                        </table>
                    </td>
                </tr>
            </table>
        </div>

        <!-- 5. Statement of Profit & Loss -->
        <div style="margin-top: 1.5rem;">
            <h3 style="font-size: 1.125rem; font-weight: 600; color: #1F2937; border-bottom: 2px solid #E5E7EB; padding-bottom: 0.5rem; margin-bottom: 0.75rem;">Statement of Profit & Loss</h3>
            <table style="width: 100%; font-size: 0.875rem;">
                <tbody>
                    <tr style="font-weight: 600; background-color: #F9FAFB;">
                        <td style="padding: 0.5rem;" colspan="2">Income</td>
                    </tr>
                    <tr>
                        <td style="padding: 0.5rem; padding-left: 1.5rem;">Total Revenue from All Sources</td>
                        <td style="padding: 0.5rem; text-align: right; font-weight: 500;">[CALCULATED TOTAL INCOME]</td>
                    </tr>
                    <tr style="font-weight: 600; border-top: 1px solid #E5E7EB;">
                        <td style="padding: 0.5rem;">Total Income</td>
                        <td style="padding: 0.5rem; text-align: right; color: #16A34A;">[CALCULATED TOTAL INCOME]</td>
                    </tr>
                    <tr><td style="padding-top: 0.5rem; padding-bottom: 0.5rem;" colspan="2"></td></tr>
                    <tr style="font-weight: 600; background-color: #F9FAFB;">
                        <td style="padding: 0.5rem;" colspan="2">Expenses</td>
                    </tr>
                    <!-- DYNAMICALLY GENERATE ONE TABLE ROW FOR EACH EXPENSE CATEGORY FROM THE TRANSACTION DATA. -->
                    <tr style="font-weight: 600; border-top: 1px solid #E5E7EB;">
                        <td style="padding: 0.5rem;">Total Expenses</td>
                        <td style="padding: 0.5rem; text-align: right; color: #DC2626;">-[CALCULATED TOTAL EXPENSES]</td>
                    </tr>
                    <tr><td style="padding-top: 0.5rem; padding-bottom: 0.5rem;" colspan="2"></td></tr>
                    <tr style="font-weight: 700; font-size: 1.125rem; background-color: #EFF6FF; border-top: 2px solid #E5E7EB;">
                        <td style="padding: 0.75rem;">Net Profit / Loss</td>
                        <td style="padding: 0.75rem; text-align: right; color: #1D4ED8;">[CALCULATED NET PROFIT/LOSS]</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- 6. Statement of Project Profitability -->
        <div style="margin-top: 1.5rem;">
            <h3 style="font-size: 1.125rem; font-weight: 600; color: #1F2937; border-bottom: 2px solid #E5E7EB; padding-bottom: 0.5rem; margin-bottom: 0.75rem;">Statement of Project Profitability</h3>
            <p style="color: #4B5563; font-size: 0.875rem; margin-bottom: 1rem;">[YOUR ANALYSIS PARAGRAPH HERE. Summarize overall project performance. Mention the most and least profitable projects. Identify any projects that are making a loss.]</p>
            <table style="width: 100%; font-size: 0.875rem;">
                <thead style="background-color: #F9FAFB;">
                    <tr style="font-weight: 600; text-align: left;">
                        <th style="padding: 0.5rem;">Project Name</th>
                        <th style="padding: 0.5rem; text-align: right;">Revenue</th>
                        <th style="padding: 0.5rem; text-align: right;">Total Costs</th>
                        <th style="padding: 0.5rem; text-align: right;">Net Profit</th>
                        <th style="padding: 0.5rem;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- DYNAMICALLY GENERATE ONE TABLE ROW FOR EACH PROJECT FROM THE PROJECT PROFITABILITY DATA. -->
                </tbody>
            </table>
        </div>

        <!-- 7. Strategic Recommendations Section -->
        <div style="margin-top: 1.5rem;">
            <h3 style="font-size: 1.125rem; font-weight: 600; color: #1F2937; border-bottom: 2px solid #E5E7EB; padding-bottom: 0.5rem; margin-bottom: 0.75rem;">Strategic Recommendations</h3>
            <div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 1rem; border-radius: 0 0.5rem 0.5rem 0;">
                <ul style="list-style-position: inside; color: #1E3A8A; font-size: 0.875rem; padding-left: 0; margin: 0;">
                    <!-- Provide 2-3 actionable recommendations based on BOTH the P&L and Project Profitability statements. -->
                    <li style="margin-bottom: 0.5rem;">[Actionable recommendation 1]</li>
                    <li>[Actionable recommendation 2]</li>
                </ul>
            </div>
        </div>
    </div>

    Now, generate the full HTML report based on the following data. Perform all calculations based on this data.

    Transaction data (for P&L and Income/Expense Summaries):
    ${JSON.stringify(transactions.map(({id, source_id, is_read_only, user_id, created_at, ...t}) => t), null, 2)}

    Project Profitability data (all projects, for context):
    ${JSON.stringify(projectsWithProfitability, null, 2)}
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

// Export the app for Vercel's serverless environment
export default app;
