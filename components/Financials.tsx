import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, Project } from '../types';
import { generateFinancialSummary } from '../services/geminiService';
import TransactionModal from './TransactionModal';
import ConfirmationModal from './ConfirmationModal';

interface FinancialsProps {
  transactions: Transaction[];
  projects: Project[];
  onSaveTransaction: (transaction: Omit<Transaction, 'id' | 'created_at' | 'user_id'> & { id?: number }) => Promise<void>;
  onDeleteTransaction: (transactionId: number) => void;
}

const Financials: React.FC<FinancialsProps> = ({ transactions, projects, onSaveTransaction, onDeleteTransaction }) => {
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  
  // State for summary date filtering
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activeRange, setActiveRange] = useState<'30d' | '90d' | 'year' | 'all' | 'custom'>('all');

  const totalIncome = transactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const handleSetDateRange = (range: '30d' | '90d' | 'year' | 'all') => {
    setActiveRange(range);
    const end = new Date();
    let start = new Date();

    switch (range) {
        case '30d':
            start.setDate(end.getDate() - 30);
            setStartDate(start.toISOString().split('T')[0]);
            setEndDate(end.toISOString().split('T')[0]);
            break;
        case '90d':
            start.setDate(end.getDate() - 90);
            setStartDate(start.toISOString().split('T')[0]);
            setEndDate(end.toISOString().split('T')[0]);
            break;
        case 'year':
            start = new Date(end.getFullYear(), 0, 1);
            setStartDate(start.toISOString().split('T')[0]);
            setEndDate(end.toISOString().split('T')[0]);
            break;
        case 'all':
            setStartDate('');
            setEndDate('');
            break;
    }
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
      setActiveRange('custom');
      if (type === 'start') setStartDate(e.target.value);
      if (type === 'end') setEndDate(e.target.value);
  }
  
  const filteredTransactionsForSummary = useMemo(() => {
    if (!startDate && !endDate) {
      return transactions;
    }
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if(start) start.setHours(0, 0, 0, 0);
    if(end) end.setHours(23, 59, 59, 999);

    return transactions.filter(t => {
      try {
        const transactionDate = new Date(t.date);
        if(isNaN(transactionDate.getTime())) return false;
        if (start && transactionDate < start) return false;
        if (end && transactionDate > end) return false;
        return true;
      } catch (e) {
        return false;
      }
    });
  }, [transactions, startDate, endDate]);

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setAiSummary('');
    const summary = await generateFinancialSummary(filteredTransactionsForSummary, projects, startDate, endDate);
    setAiSummary(summary);
    setIsLoading(false);
  };
  
  const handleClearSummary = () => {
    setAiSummary('');
  };
  
  const handleDownloadSummary = () => {
    if (!aiSummary) return;

    // The aiSummary is now a self-contained HTML block with inline styles.
    const fileHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Financial Analysis Report</title>
        </head>
        <body style="background-color: #F9FAFB; font-family: Arial, sans-serif; padding: 32px;">
          ${aiSummary}
        </body>
      </html>
    `;
    
    const blob = new Blob([fileHtml], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Financial_Analysis_Report.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenAddModal = () => {
    setSelectedTransaction(null);
    setIsTransactionModalOpen(true);
  };

  const handleOpenEditModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsTransactionModalOpen(true);
  };
  
  const handleSaveTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at' | 'user_id'> & { id?: number }) => {
    await onSaveTransaction(transaction);
    setIsTransactionModalOpen(false);
  };

  const handleDeleteRequest = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setIsConfirmModalOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (transactionToDelete) {
      onDeleteTransaction(transactionToDelete.id);
      setIsConfirmModalOpen(false);
      setTransactionToDelete(null);
    }
  };

  const displaySummary = useMemo(() => ({ __html: aiSummary }), [aiSummary]);

  const dateButtonClasses = (range: string) => `px-3 py-1.5 text-xs font-medium rounded-full transition-colors duration-200 shadow-sm ${activeRange === range ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'}`;

  return (
    <div className="space-y-6">
      <TransactionModal 
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSave={handleSaveTransaction}
        transaction={selectedTransaction}
      />
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Transaction"
        message={
            <>
              Are you sure you want to delete this transaction?
              <br />
              <strong>{transactionToDelete?.description} - GMD {transactionToDelete?.amount.toLocaleString()}</strong>
            </>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-gray-500 font-medium">Total Income</h4>
          <p className="text-3xl font-bold text-green-500 mt-2">GMD {totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-gray-500 font-medium">Total Expenses</h4>
          <p className="text-3xl font-bold text-red-500 mt-2">GMD {totalExpense.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-gray-500 font-medium">Net Profit</h4>
          <p className={`text-3xl font-bold mt-2 ${netProfit >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
            GMD {netProfit.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
          <h3 className="text-lg font-semibold text-gray-700">AI Financial Summary</h3>
          <div className="flex items-center space-x-2">
            <button
                onClick={handleDownloadSummary}
                disabled={!aiSummary || isLoading}
                className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:bg-green-300 transition-colors"
              >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download
            </button>
            {aiSummary && !isLoading && (
              <button
                onClick={handleClearSummary}
                className="flex items-center bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Clear
              </button>
            )}
            <button
              onClick={handleGenerateSummary}
              disabled={isLoading || transactions.length === 0}
              className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-blue-300 transition-colors"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : "Generate Summary"}
            </button>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Select Period for Analysis</label>
                  <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => handleSetDateRange('30d')} className={dateButtonClasses('30d')}>Last 30 Days</button>
                      <button onClick={() => handleSetDateRange('90d')} className={dateButtonClasses('90d')}>Last 90 Days</button>
                      <button onClick={() => handleSetDateRange('year')} className={dateButtonClasses('year')}>This Year</button>
                      <button onClick={() => handleSetDateRange('all')} className={dateButtonClasses('all')}>All Time</button>
                  </div>
              </div>
              <div>
                  <label className="text-sm font-medium text-gray-700 w-full block mb-2">Or select a custom range</label>
                  <div className="flex items-center gap-2">
                      <input type="date" value={startDate} onChange={(e) => handleDateInputChange(e, 'start')} className="px-3 py-1.5 text-sm w-full bg-white text-gray-700 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      <span className="text-gray-500 font-semibold">to</span>
                      <input type="date" value={endDate} onChange={(e) => handleDateInputChange(e, 'end')} className="px-3 py-1.5 text-sm w-full bg-white text-gray-700 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
              </div>
          </div>
        </div>

        {aiSummary && (
          // The AI summary now has its own container and styling.
          // This outer div is just a placeholder.
          <div>
             <div dangerouslySetInnerHTML={displaySummary} />
          </div>
        )}
         {isLoading && !aiSummary && (
          <div className="flex items-center justify-center h-24 text-gray-500">
            Generating AI summary, please wait...
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">All Transactions</h3>
            <button
                onClick={handleOpenAddModal}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors"
            >
                Add Manual Transaction
            </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Date</th>
                <th scope="col" className="px-6 py-3">Description</th>
                <th scope="col" className="px-6 py-3">Category</th>
                <th scope="col" className="px-6 py-3">Type</th>
                <th scope="col" className="px-6 py-3 text-right">Amount</th>
                <th scope="col" className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? transactions.map((t) => (
                <tr key={t.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{t.date}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{t.description}</td>
                  <td className="px-6 py-4">{t.category}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      t.type === TransactionType.INCOME ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {t.type}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-medium ${
                    t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'
                  }`}>
                    GMD {t.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center space-x-2">
                    {t.is_read_only ? (
                        <span className="italic text-gray-400 text-xs" title="This transaction is managed automatically by a project or invoice.">Read-only</span>
                    ) : (
                        <>
                        <button onClick={() => handleOpenEditModal(t)} className="font-medium text-blue-600 hover:underline">Edit</button>
                        <button onClick={() => handleDeleteRequest(t)} className="font-medium text-red-600 hover:underline">Delete</button>
                        </>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-10">No transactions recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Financials;