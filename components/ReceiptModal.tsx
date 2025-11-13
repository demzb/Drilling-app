import React, { useRef } from 'react';
import { Invoice, Payment } from '../types';
import { generateReceiptHtml } from '../utils/exportUtils';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  payment: Payment;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, invoice, payment }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (!isOpen) return null;

  const receiptHtml = generateReceiptHtml(invoice, payment);

  const handlePrint = () => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Payment Receipt</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-2 bg-gray-100 flex-grow">
          <iframe
            ref={iframeRef}
            srcDoc={receiptHtml}
            title="Receipt"
            className="w-full h-full border-0"
          />
        </div>

        <div className="flex justify-end items-center p-4 bg-gray-50 border-t">
          <button onClick={handlePrint} className="px-4 py-2 bg-green-500 text-white rounded-md mr-2 hover:bg-green-600">Print Receipt</button>
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Close</button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
