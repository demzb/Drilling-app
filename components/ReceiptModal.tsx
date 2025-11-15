import React from 'react';
import { Invoice, Payment, PaymentMethod } from '../types';
import { generateReceiptHtml } from '../utils/exportUtils';
import { getInvoiceTotal } from '../utils/invoiceUtils';
import { numberToWords } from '../utils/numberToWords';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  payment: Payment;
}

const ReceiptContent: React.FC<{ invoice: Invoice; payment: Payment }> = ({ invoice, payment }) => {
    const totalAmount = getInvoiceTotal(invoice);
    const totalPaidAfterThisPayment = invoice.payments
        .filter(p => new Date(p.date) <= new Date(payment.date))
        .reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = totalAmount - totalPaidAfterThisPayment;

    return (
        <div className="p-8 space-y-8 bg-white" id="receipt-content-for-print">
            {/* Header */}
            <div className="flex justify-between items-start border-b pb-6">
                <div className="w-2/3">
                    <h2 className="text-xl font-bold text-blue-700 uppercase">YS BOREHOLE DRILLING COMPANY</h2>
                    <p className="text-xs text-gray-600">Deals in borehole drilling solar installation, plumbing and electrical specialist</p>
                    <p className="text-xs text-gray-500 mt-2">Brusubi the Gambia west Africa</p>
                    <p className="text-xs text-gray-500">Tel: +2203522014/7770568/2030995</p>
                    <p className="text-xs text-gray-500">Email: yusuphasambou1234@gmail.com</p>
                </div>
                <div className="w-1/3 text-right">
                    <h1 className="text-3xl font-bold text-gray-800 uppercase">Receipt</h1>
                    <p className="mt-1"><span className="font-semibold text-gray-500 text-sm">Receipt No:</span> {payment.id}</p>
                    <p><span className="font-semibold text-gray-500 text-sm">Date:</span> {payment.date}</p>
                </div>
            </div>

            {/* Client & Payment Details */}
            <div className="grid grid-cols-2 gap-8 pt-6">
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase">Bill To</h3>
                    <p className="font-medium text-gray-800">{invoice.client_name}</p>
                    <p className="text-gray-600 whitespace-pre-line">{invoice.client_address}</p>
                </div>
                <div className="text-right">
                     <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Payment Details</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <span className="font-semibold text-gray-500">Payment Method:</span>
                        <span className="text-gray-800">{payment.method}</span>
                        {payment.method === PaymentMethod.CHECK && payment.checkNumber && (
                            <>
                                <span className="font-semibold text-gray-500">Check Number:</span>
                                <span className="text-gray-800">{payment.checkNumber}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Amount Paid */}
            <div className="text-center bg-green-50 border border-green-200 p-6 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Amount Paid</h3>
                <p className="text-5xl font-bold text-green-600 my-2">
                    GMD {payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <p className="text-gray-600 capitalize">{numberToWords(payment.amount)}</p>
            </div>

            {/* Summary Table */}
            <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Payment Summary</h3>
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 text-sm font-semibold text-gray-600">
                            <th className="p-3">Summary</th>
                            <th className="p-3 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b">
                            <td className="p-3">Invoice Total</td>
                            <td className="p-3 text-right">GMD {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                         <tr className="border-b">
                            <td className="p-3">Payment Received</td>
                            <td className="p-3 text-right font-medium text-green-600">GMD {payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                         <tr className="bg-gray-50 font-semibold">
                            <td className="p-3">Balance Due</td>
                            <td className="p-3 text-right">GMD {balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                    </tbody>
                </table>
                <p className="text-xs text-gray-500 mt-2">Payment applied to Invoice #{invoice.invoice_number}.</p>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 border-t pt-4">
                <p className="font-semibold">Thank you for your payment!</p>
                <p>If you have any questions, please contact us at +220 7770568 or yusuphasambou1234@gmail.com</p>
            </div>
        </div>
    );
};


const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, invoice, payment }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('receipt-content-for-print');
    if (printContent) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Print Receipt</title>');
            // Tailwind CDN is required for styles to apply in the print window
            printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
            printWindow.document.write('<style>@media print { .no-print { display: none !important; } body { -webkit-print-color-adjust: exact; } }</style>');
            printWindow.document.write('</head><body class="p-4">');
            printWindow.document.write(printContent.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }
    }
  };

  const handleExportToWord = () => {
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
    fileDownload.download = `Receipt_${invoice.invoice_number}_${payment.id}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b no-print">
          <h2 className="text-xl font-semibold text-gray-800">Payment Receipt Preview</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto bg-gray-100">
           <ReceiptContent invoice={invoice} payment={payment} />
        </div>

        <div className="flex justify-end items-center p-4 bg-gray-50 border-t no-print">
          <button onClick={handleExportToWord} className="px-4 py-2 bg-blue-500 text-white rounded-md mr-2 hover:bg-blue-600">Export to Word</button>
          <button onClick={handlePrint} className="px-4 py-2 bg-green-500 text-white rounded-md mr-2 hover:bg-green-600">Print / Save as PDF</button>
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Close</button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
