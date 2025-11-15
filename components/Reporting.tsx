import React, { useState, useMemo } from 'react';
import { Project, Transaction, Invoice, Client, Employee, TransactionType, ProjectStatus, InvoiceStatus, ProjectProfitabilityReportItem, FinancialReportItem, InvoiceReportItem, Payment, ProfitAndLossStatementItem } from '../types';
import { exportReportAsCsv, exportReportAsWord, printReport } from '../utils/exportUtils';
import { getInvoiceTotal, getInvoiceTotalPaid } from '../utils/invoiceUtils';

interface ReportingProps {
  projects: Project[];
  transactions: Transaction[];
  invoices: Invoice[];
  clients: Client[];
  employees: Employee[];
}

const today = new Date().toISOString().split('T')[0];
const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];

interface ReportCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    gradientClasses: string;
    children: React.ReactNode;
}

const ReportCard: React.FC<ReportCardProps> = ({ title, description, icon, gradientClasses, children }) => (
    <div className={`p-6 rounded-xl shadow-lg text-white flex flex-col h-full ${gradientClasses}`}>
        <div className="flex items-start mb-4">
            <div className="bg-white/20 p-3 rounded-full mr-4 shrink-0">
                {icon}
            </div>
            <div>
                <h2 className="text-xl font-bold">{title}</h2>
                <p className="text-sm opacity-90 mt-1">{description}</p>
            </div>
        </div>
        <div className="flex-grow flex flex-col justify-end">
            {children}
        </div>
    </div>
);

const Reporting: React.FC<ReportingProps> = ({ projects, transactions, invoices, clients }) => {
    const [reportData, setReportData] = useState<any[] | null>(null);
    const [reportTitle, setReportTitle] = useState('');
    const [reportHeaders, setReportHeaders] = useState<string[]>([]);
    
    const [startDate, setStartDate] = useState(thirtyDaysAgo);
    const [endDate, setEndDate] = useState(today);
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const generateFinancialReport = () => {
        setIsLoading(true);
        const filtered = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            start.setHours(0,0,0,0);
            end.setHours(23,59,59,999);
            return transactionDate >= start && transactionDate <= end;
        });

        const data: FinancialReportItem[] = filtered.map(t => ({
            date: t.date,
            description: t.description,
            category: t.category,
            type: t.type,
            amount: t.type === TransactionType.INCOME ? t.amount : -t.amount,
        }));
        
        const headers = ["Date", "Description", "Category", "Type", "Amount"];
        setReportData(data);
        setReportHeaders(headers);
        setReportTitle(`Financial Report (${startDate} to ${endDate})`);
        setIsLoading(false);
    };

    const generateProfitAndLossStatement = () => {
        setIsLoading(true);
        const start = new Date(startDate);
        const end = new Date(endDate);
        start.setHours(0,0,0,0);
        end.setHours(23,59,59,999);

        const filtered = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= start && transactionDate <= end;
        });

        const incomeTransactions = filtered.filter(t => t.type === TransactionType.INCOME);
        const expenseTransactions = filtered.filter(t => t.type === TransactionType.EXPENSE);

        const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);

        const expensesByCategory = expenseTransactions.reduce((acc: Record<string, number>, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});
        
        // FIX: Added initial value to reduce() to prevent type errors when operating on an empty array.
        const totalExpenses = Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0);
        const netProfit = totalIncome - totalExpenses;

        const data: ProfitAndLossStatementItem[] = [];

        data.push({ description: 'Income', amount: null, isHeader: true });
        data.push({ description: 'Total Revenue', amount: totalIncome, isSubItem: true });
        data.push({ description: 'Total Income', amount: totalIncome, isTotal: true });
        data.push({ description: '', amount: null });

        data.push({ description: 'Expenses', amount: null, isHeader: true });
        Object.entries(expensesByCategory).forEach(([category, amount]) => {
            data.push({ description: category, amount: amount, isSubItem: true });
        });
        if (Object.keys(expensesByCategory).length > 0) {
            data.push({ description: 'Total Expenses', amount: totalExpenses, isTotal: true });
            data.push({ description: '', amount: null });
        }

        data.push({ description: 'Net Profit / Loss', amount: netProfit, isTotal: true });

        const headers = ["Description", "Amount"];
        setReportData(data);
        setReportHeaders(headers);
        setReportTitle(`Statement of Profit & Loss (${startDate} to ${endDate})`);
        setIsLoading(false);
    };
    
    const generateProjectProfitabilityReport = () => {
        setIsLoading(true);
        const data: ProjectProfitabilityReportItem[] = projects.map(p => {
            // FIX: Added initial value to reduce() calls to prevent type errors when operating on empty arrays.
            const materialCosts = p.materials.reduce((sum, m) => sum + (m.quantity * m.unitCost), 0);
            const staffCosts = p.staff.reduce((sum, s) => sum + s.paymentAmount, 0);
            const otherCosts = p.other_expenses.reduce((sum, e) => sum + e.amount, 0);
            const totalCosts = materialCosts + staffCosts + otherCosts;
            const netProfit = p.amount_received - totalCosts;

            return {
                projectName: p.name,
                clientName: p.client_name,
                status: p.status,
                amountReceived: p.amount_received,
                totalCosts,
                netProfit,
            };
        });
        
        const headers = ["Project Name", "Client Name", "Status", "Amount Received", "Total Costs", "Net Profit"];
        setReportData(data);
        setReportHeaders(headers);
        setReportTitle('Project Profitability Report');
        setIsLoading(false);
    };

    const generateInvoiceSummaryReport = () => {
        setIsLoading(true);
        const filtered = invoices.filter(i => {
            const invoiceDate = new Date(i.date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            start.setHours(0,0,0,0);
            end.setHours(23,59,59,999);
            return invoiceDate >= start && invoiceDate <= end;
        });

        const data: InvoiceReportItem[] = filtered.map(i => {
            const total = getInvoiceTotal(i);
            const paid = getInvoiceTotalPaid(i);
            const balance = total - paid;
            return {
                invoiceNumber: i.invoice_number,
                clientName: i.client_name,
                date: i.date,
                dueDate: i.due_date,
                status: i.status,
                total,
                paid,
                balance,
            };
        });

        const headers = ["Invoice Number", "Client Name", "Date", "Due Date", "Status", "Total", "Paid", "Balance"];
        setReportData(data);
        setReportHeaders(headers);
        setReportTitle(`Invoice Summary Report (${startDate} to ${endDate})`);
        setIsLoading(false);
    };

    const generateClientStatementReport = () => {
        if (!selectedClientId) {
            alert('Please select a client.');
            return;
        }
        setIsLoading(true);
        const clientInvoices = invoices.filter(i => i.client_id === selectedClientId);
        const client = clients.find(c => c.id === selectedClientId);

        const data: any[] = [];
        clientInvoices.forEach(invoice => {
            data.push({
                date: invoice.date,
                description: `Invoice #${invoice.invoice_number}`,
                invoice: getInvoiceTotal(invoice),
                payment: 0,
            });
            invoice.payments.forEach(payment => {
                data.push({
                    date: payment.date,
                    description: `Payment for Invoice #${invoice.invoice_number} (${payment.method})`,
                    invoice: 0,
                    payment: payment.amount,
                });
            });
        });

        data.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let balance = 0;
        const finalData = data.map(item => {
            balance += item.invoice - item.payment;
            return { ...item, balance };
        });

        const headers = ["Date", "Description", "Invoice", "Payment", "Balance"];
        setReportData(finalData);
        setReportHeaders(headers);
        setReportTitle(`Account Statement for ${client?.name}`);
        setIsLoading(false);
    };
    
    const inputClasses = "w-full rounded-md border-white/30 bg-white/20 px-3 py-2 text-sm text-white placeholder-white/70 shadow-sm focus:border-white focus:ring-white/50";
    const buttonClasses = "flex w-full items-center justify-center rounded-lg bg-white/20 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50";

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Reporting Center</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ReportCard title="Financial Report" description="Summary of income and expenses within a specified period." icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} gradientClasses="bg-gradient-to-br from-indigo-500 to-blue-600">
                    <div className="space-y-4">
                         <div className="flex items-center gap-2">
                             <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClasses}/>
                             <span className="text-white/80">to</span>
                             <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClasses}/>
                         </div>
                         <button onClick={generateFinancialReport} className={buttonClasses}>Generate Report</button>
                    </div>
                </ReportCard>
                
                <ReportCard title="Profit & Loss" description="A detailed breakdown of revenues and expenses to calculate net profit." icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} gradientClasses="bg-gradient-to-br from-teal-500 to-cyan-600">
                     <div className="space-y-4">
                         <div className="flex items-center gap-2">
                             <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClasses}/>
                             <span className="text-white/80">to</span>
                             <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClasses}/>
                         </div>
                         <button onClick={generateProfitAndLossStatement} className={buttonClasses}>Generate Statement</button>
                    </div>
                </ReportCard>

                <ReportCard title="Project Profitability" description="Analyzes the profitability of each project from start to finish." icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} gradientClasses="bg-gradient-to-br from-green-500 to-emerald-600">
                    <div className="space-y-4">
                         <div className="h-[52px]"></div> {/* Spacer */}
                         <button onClick={generateProjectProfitabilityReport} className={buttonClasses}>Generate Report</button>
                    </div>
                </ReportCard>

                <ReportCard title="Invoice Summary" description="Lists all invoices and their payment status over a period." icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11h-4" /></svg>} gradientClasses="bg-gradient-to-br from-purple-500 to-violet-600">
                     <div className="space-y-4">
                         <div className="flex items-center gap-2">
                             <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClasses}/>
                             <span className="text-white/80">to</span>
                             <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClasses}/>
                         </div>
                         <button onClick={generateInvoiceSummaryReport} className={buttonClasses}>Generate Report</button>
                    </div>
                </ReportCard>

                <ReportCard title="Client Statement" description="Shows a client's history of invoices and payments." icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.282-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.282.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} gradientClasses="bg-gradient-to-br from-amber-500 to-orange-600">
                     <div className="space-y-4">
                        <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className={inputClasses}>
                            <option value="">-- Select a Client --</option>
                            {clients.map(c => <option key={c.id} value={c.id} className="text-black">{c.name}</option>)}
                        </select>
                        <button onClick={generateClientStatementReport} className={buttonClasses}>Generate Statement</button>
                    </div>
                </ReportCard>
            </div>

            {isLoading && (
              <div className="flex justify-center items-center p-8 bg-white rounded-lg shadow-md mt-8">
                  <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="ml-4 text-gray-600 text-lg">Generating Report...</span>
              </div>
            )}

            {reportData && reportData.length > 0 && !isLoading && (
                <div className="bg-white p-6 rounded-lg shadow-xl mt-8">
                    <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                        <h3 className="text-2xl font-semibold text-gray-800">{reportTitle}</h3>
                        <div className="flex items-center gap-2">
                            <button onClick={() => exportReportAsCsv(reportHeaders, reportData, `${reportTitle}.csv`)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-all shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 00-1 1v1a1 1 0 001 1h4a1 1 0 001-1v-1a1 1 0 00-1-1H8z" clipRule="evenodd" /></svg>CSV</button>
                            <button onClick={() => exportReportAsWord(reportTitle, reportHeaders, reportData, `${reportTitle}.doc`)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-all shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>Word</button>
                            <button onClick={() => printReport(reportTitle, reportHeaders, reportData)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-all shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>PDF/Print</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto max-h-[500px] border rounded-lg">
                        <table className="w-full text-sm text-left text-gray-600">
                            <thead className="text-xs text-slate-600 uppercase bg-slate-100 sticky top-0">
                                <tr>
                                    {reportHeaders.map(header => <th key={header} scope="col" className="px-6 py-3 font-semibold tracking-wider">{header}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.map((item, index) => {
                                    const isHeader = 'isHeader' in item && item.isHeader;
                                    const isTotal = 'isTotal' in item && item.isTotal;
                                    const isSubItem = 'isSubItem' in item && item.isSubItem;

                                    if (item.description === '' && item.amount === null) {
                                        return <tr key={index} className="h-6 border-b bg-slate-50"><td colSpan={reportHeaders.length}></td></tr>;
                                    }

                                    let rowClasses = "border-b odd:bg-white even:bg-slate-50/50";
                                    if (isTotal) rowClasses += " font-bold bg-slate-100";
                                    if (isHeader) rowClasses += " font-bold text-slate-800 bg-slate-200 text-base";
                                    
                                    return (
                                        <tr key={index} className={rowClasses}>
                                            {reportHeaders.map(header => {
                                                const key = header.replace(/\s+/g, ' ').replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => index === 0 ? word.toLowerCase() : word.toUpperCase()).replace(/\s/g, '');
                                                const value = item[key];
                                                const isNumeric = typeof value === 'number';
                                                
                                                let cellClasses = `px-6 py-3`;
                                                if(isHeader) cellClasses = `px-6 py-2`;
                                                if (isNumeric) cellClasses += " text-right";
                                                if (isSubItem && key === 'description') cellClasses += " pl-10";
                                                if (isTotal && isNumeric && value < 0) cellClasses += ' text-red-600';

                                                return (
                                                    <td key={key} className={cellClasses}>
                                                        {value === null 
                                                            ? '' 
                                                            : isNumeric 
                                                                ? `GMD ${(value as number).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
                                                                : value
                                                        }
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {reportData && reportData.length === 0 && !isLoading && (
                 <div className="bg-white p-6 rounded-lg shadow-xl mt-8 text-center text-gray-500">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-2">{reportTitle}</h3>
                    <p>No data found for the selected criteria.</p>
                </div>
            )}
        </div>
    );
};

export default Reporting;