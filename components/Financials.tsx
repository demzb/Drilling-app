import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { generateFinancialSummary } from '../services/geminiService';
import TransactionModal from './TransactionModal';
import ConfirmationModal from './ConfirmationModal';

interface FinancialsProps {
  transactions: Transaction[];
  onSaveTransaction: (transaction: Omit<Transaction, 'id'> & { id?: number }) => void;
  onDeleteTransaction: (transactionId: number) => void;
}

const Financials: React.FC<FinancialsProps> = ({ transactions, onSaveTransaction, onDeleteTransaction }) => {
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  
  const totalIncome = transactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setAiSummary('');
    const summary = await generateFinancialSummary(transactions);
    setAiSummary(summary);
    setIsLoading(false);
  };

  const handleOpenAddModal = () => {
    setSelectedTransaction(null);
    setIsTransactionModalOpen(true);
  };

  const handleOpenEditModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsTransactionModalOpen(true);
  };
  
  const handleSaveTransaction = (transaction: Omit<Transaction, 'id'> & { id?: number }) => {
    onSaveTransaction(transaction);
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
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700">AI Financial Summary</h3>
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
        {aiSummary && (
          <div className="prose max-w-none bg-gray-50 p-4 rounded-md border border-gray-200">
             <div className="whitespace-pre-wrap font-sans">{aiSummary}</div>
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
                    {t.isReadOnly ? (
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