import React, { useState } from 'react';
import { Invoice } from '../types';
import { generateReminderEmail } from '../utils/emailUtils';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (invoiceId: string) => void;
  invoice: Invoice;
}

const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose, onSend, invoice }) => {
  const [isSending, setIsSending] = useState(false);
  const { subject, body } = generateReminderEmail(invoice);

  if (!isOpen) return null;

  const handleSend = () => {
    setIsSending(true);
    // Simulate sending email
    setTimeout(() => {
      onSend(invoice.id);
      setIsSending(false);
      onClose();
      // In a real app, you might want a more robust notification system (e.g., a toast).
      alert(`Reminder for invoice #${invoice.invoice_number} has been marked as sent.`);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Send Payment Reminder</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={isSending}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700">To:</label>
            <input 
              type="text" 
              // Fix: Changed property to snake_case.
              value={`${invoice.client_name}`} 
              readOnly 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Subject:</label>
            <input 
              type="text" 
              value={subject} 
              readOnly 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Body:</label>
            <textarea 
              value={body} 
              readOnly 
              rows={12}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 sm:text-sm font-mono whitespace-pre-wrap"
            />
          </div>
        </div>

        <div className="flex justify-end items-center p-4 bg-gray-50 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md mr-2 hover:bg-gray-300" disabled={isSending}>Cancel</button>
          <button 
            type="button" 
            onClick={handleSend} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center"
            disabled={isSending}
          >
            {isSending && (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isSending ? 'Sending...' : 'Mark as Sent'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderModal;