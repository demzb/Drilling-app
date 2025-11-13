import React, { useState } from 'react';
import { Invoice, Payment } from '../types';
import ReceiptModal from './ReceiptModal';
import { getInvoiceTotal, getInvoiceTotalPaid } from '../utils/invoiceUtils';
import { generateReceiptHtml } from '../utils/exportUtils';

interface PaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
}

const PaymentHistoryModal: React.FC<PaymentHistoryModalProps> = ({ isOpen, onClose, invoice }) => {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  if (!isOpen) return null;

  const totalAmount = getInvoiceTotal(invoice);
  const totalPaid = getInvoiceTotalPaid(invoice);
  const balanceDue = totalAmount - totalPaid;

  const handleViewReceipt = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsReceiptModalOpen(true);
  };

  const handleExportToWord = (payment: Payment) => {
    const htmlContent = generateReceiptHtml(invoice, payment);
    
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
          "xmlns:w='urn:schemas-microsoft-com:office:word' "+
          "xmlns='http://www.w3.org/TR/REC-html40'>"+
          "<head><meta charset='utf-8'><title>Export HTML to Word Document</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + htmlContent + footer;

    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `Receipt_${invoice.invoiceNumber}_${payment.id}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  return (
    <>
      {selectedPayment && (
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          invoice={invoice}
          payment={selectedPayment}
        />
      )}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Payment History for Invoice #{invoice.invoiceNumber}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-6 space-y-4 overflow-y-auto">
            <div className="bg-gray-50 p-3 rounded-md grid grid-cols-3 gap-2 text-center">
                <div>
                    <p className="text-sm text-gray-500">Invoice Total</p>
                    <p className="font-semibold text-lg text-gray-800">GMD {totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                </div>
                 <div>
                    <p className="text-sm text-gray-500">Total Paid</p>
                    <p className="font-semibold text-lg text-green-600">GMD {totalPaid.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                </div>
                 <div>
                    <p className="text-sm text-gray-500">Balance Due</p>
                    <p className="font-bold text-lg text-red-600">GMD {balanceDue.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                </div>
            </div>

            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3">Payment Date</th>
                    <th scope="col" className="px-6 py-3">Method</th>
                    <th scope="col" className="px-6 py-3 text-right">Amount</th>
                    <th scope="col" className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.payments.length > 0 ? invoice.payments.map((payment) => (
                    <tr key={payment.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4">{payment.date}</td>
                      <td className="px-6 py-4">
                        {payment.method}
                        {payment.checkNumber && (
                            <span className="block text-xs text-gray-400 mt-1">
                                Check #: {payment.checkNumber}
                            </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-green-700">GMD {payment.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      <td className="px-6 py-4 text-center space-x-4">
                        <button onClick={() => handleViewReceipt(payment)} className="font-medium text-blue-600 hover:underline">Preview Receipt</button>
                        <button onClick={() => handleExportToWord(payment)} className="font-medium text-green-600 hover:underline">Export to Word</button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="text-center text-gray-500 py-10">No payments recorded for this invoice yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end items-center p-4 bg-gray-50 border-t">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Close</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentHistoryModal;