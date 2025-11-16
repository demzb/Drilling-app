import React from 'react';
import { Invoice, InvoiceStatus, InvoiceType } from '../types';
import { numberToWords } from '../utils/numberToWords';
import { generateInvoiceWordHtml } from '../utils/exportUtils';
import { getInvoiceTotal, getInvoiceTotalPaid } from '../utils/invoiceUtils';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
}

const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({ isOpen, onClose, invoice }) => {
  if (!isOpen) return null;

  const subtotal = (invoice.line_items || []).reduce((acc, item) => acc + (item.quantity * item.rate), 0);
  const discount = invoice.discount_amount;
  const discountedSubtotal = subtotal - discount;
  const taxAmount = discountedSubtotal * (invoice.tax_rate / 100);
  
  const totalAmount = getInvoiceTotal(invoice);
  const totalPaid = getInvoiceTotalPaid(invoice);
  const totalBalanceDue = totalAmount - totalPaid;

  const amountDueLabel = "Balance Due:";
  const amountDueValue = totalBalanceDue;

  const handlePrint = () => {
    const printContents = document.getElementById('invoice-content')?.innerHTML;
    if (printContents) {
        const printWindow = window.open('', '_blank');
        if(printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Print Invoice</title>
                        <script src="https://cdn.tailwindcss.com"></script>
                        <style>
                            @media print {
                                body { -webkit-print-color-adjust: exact; }
                                .no-print { display: none !important; }
                            }
                        </style>
                    </head>
                    <body class="p-8">${printContents}</body>
                </html>
            `);
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
      const htmlContent = generateInvoiceWordHtml(invoice);
      
      const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
            "xmlns:w='urn:schemas-microsoft-com:office:word' "+
            "xmlns='http://www.w3.org/TR/REC-html40'>"+
            "<head><meta charset='utf-8'><title>Export HTML to Word Document</title></head><body>";
       const footer = "</body></html>";
       const sourceHTML = header+htmlContent+footer;

      const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
      const fileDownload = document.createElement("a");
      document.body.appendChild(fileDownload);
      fileDownload.href = source;
      fileDownload.download = `${invoice.invoice_type.replace(' ', '_')}_${invoice.invoice_number}.doc`;
      fileDownload.click();
      document.body.removeChild(fileDownload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
       <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div id="invoice-content" className="p-8 space-y-8 overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-start border-b pb-6">
            <div className="w-1/3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase">Bill To</h3>
              <p className="font-medium text-gray-800">{invoice.client_name}</p>
              <p className="text-gray-600 whitespace-pre-line">{invoice.client_address}</p>
            </div>

            <div className="w-1/3 text-center">
                <h2 className="text-xl font-bold text-blue-700 uppercase">YS BOREHOLE DRILLING COMPANY</h2>
                <p className="text-xs text-gray-600">Deals in borehole drilling solar installation, plumbing and electrical specialist</p>
                <p className="text-xs text-gray-500 mt-2">Brusubi the Gambia west Africa</p>
                <p className="text-xs text-gray-500">Tel: +2203522014/7770568/2030995</p>
                <p className="text-xs text-gray-500">Email: yusuphasambou1234@gmail.com</p>
            </div>

            <div className="w-1/3 text-right">
                <h1 className="text-3xl font-bold text-gray-800 uppercase">Invoice</h1>
                <p className="text-gray-500 mt-1">{invoice.invoice_number}</p>
                
                <div className="mt-4 text-sm">
                  <div className="grid grid-cols-2 gap-x-1">
                      <span className="font-semibold text-gray-500">Invoice Date:</span>
                      <span className="text-gray-800">{invoice.date}</span>
                      <span className="font-semibold text-gray-500">Due Date:</span>
                      <span className="text-gray-800">{invoice.due_date}</span>
                  </div>
                </div>
            </div>
          </div>
          
          {invoice.project_name && (
            <div className="-mt-4">
                 <p className="text-sm text-center text-blue-600 font-medium mt-1">Project: {invoice.project_name} - {invoice.borehole_type}</p>
            </div>
          )}

          {/* Items Table */}
          <div className="flow-root">
              <table className="min-w-full text-left">
                  <thead className="bg-gray-50">
                      <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      </tr>
                  </thead>
                  <tbody>
                      {(invoice.line_items || []).map((item) => (
                          <tr key={item.id} className="border-b border-gray-200">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.description}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{item.quantity}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">GMD {item.rate.toFixed(2)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-semibold text-right">GMD {(item.quantity * item.rate).toFixed(2)}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-700">GMD {subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Discount</span>
                        <span className="text-green-600">- GMD {discount.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax ({invoice.tax_rate}%)</span>
                    <span className="text-gray-700">GMD {taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-2 border-t">
                    <span className="text-gray-800">Total</span>
                    <span className="text-gray-800">GMD {totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Amount Paid</span>
                    <span className="text-green-600">- GMD {totalPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t bg-gray-100 p-3 rounded-md">
                    <span className="text-gray-900">{amountDueLabel}</span>
                    <span className="text-gray-900">GMD {amountDueValue.toFixed(2)}</span>
                </div>
            </div>
          </div>
          
           {/* Notes & Amount in Words */}
           <div className="pt-6 border-t">
                <p className="text-sm font-semibold text-gray-700">Amount in Words:</p>
                <p className="text-sm text-gray-600 capitalize">{numberToWords(amountDueValue)}</p>
                <p className="text-sm font-semibold text-gray-700 mt-4">Notes:</p>
                <p className="text-sm text-gray-600">{invoice.notes}</p>
            </div>
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

export default InvoiceDetailModal;