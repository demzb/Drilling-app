import React from 'react';
import { Invoice, InvoiceStatus, InvoiceType } from '../types';
import { numberToWords } from '../utils/numberToWords';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  isProjectCompleted?: boolean;
}

const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({ isOpen, onClose, invoice, isProjectCompleted }) => {
  if (!isOpen) return null;

  const subtotal = invoice.lineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const taxAmount = subtotal * (invoice.taxRate / 100);
  const totalAmount = subtotal + taxAmount;
  
  const title = invoice.invoiceType;
  
  const depositAmount = totalAmount * 0.75;
  const finalBalanceAmount = totalAmount * 0.25;
  const totalBalanceDue = totalAmount - invoice.amountPaid;

  const isProformaPhase = invoice.invoiceType === InvoiceType.PROFORMA && invoice.status !== InvoiceStatus.AWAITING_FINAL_PAYMENT && invoice.status !== InvoiceStatus.PAID;

  const amountDueLabel = isProformaPhase ? "Balance on Deposit:" : "Balance Due:";
  const amountDueValue = isProformaPhase ? Math.max(0, depositAmount - invoice.amountPaid) : totalBalanceDue;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
       <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col print:shadow-none print:max-h-full print:w-full">
        <div id="invoice-content" className="p-8 space-y-8 overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
              <p className="text-gray-500">{invoice.invoiceNumber}</p>
              {invoice.projectName && (
                <p className="text-sm text-blue-600 font-medium mt-1">Project: {invoice.projectName}</p>
              )}
               {invoice.boreholeType && (
                <p className="text-sm text-gray-500 font-medium mt-1">{invoice.boreholeType}</p>
              )}
            </div>
            <div className="text-right">
                <h2 className="text-xl font-bold text-blue-700 uppercase">YS BOREHOLE DRILLING COMPANY</h2>
                <p className="text-xs text-gray-600">Deals in borehole drilling solar installation, plumbing and electrical specialist</p>
                <p className="text-xs text-gray-500 mt-2">Brusubi the Gambia west Africa</p>
                <p className="text-xs text-gray-500">Tel: +2203522014/7770568/2030995</p>
                <p className="text-xs text-gray-500">Email: yusuphasambou1234@gmail.com</p>
            </div>
          </div>
          
          {/* Client & Dates */}
          <div className="grid grid-cols-2 gap-8 border-t pt-6">
            <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase">Bill To</h3>
                <p className="font-medium text-gray-800">{invoice.clientName}</p>
                <p className="text-gray-600 whitespace-pre-line">{invoice.clientAddress}</p>
            </div>
             <div className="text-right">
                <div className="grid grid-cols-2">
                    <span className="font-semibold text-gray-500">Invoice Date:</span>
                    <span className="text-gray-800">{invoice.date}</span>
                    <span className="font-semibold text-gray-500">Due Date:</span>
                    <span className="text-gray-800">{invoice.dueDate}</span>
                </div>
            </div>
          </div>
          
          {/* Line Items Table */}
          <div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-sm font-semibold text-gray-600">
                  <th className="p-3">Description</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map(item => (
                  <tr key={item.id} className="border-b">
                    <td className="p-3">{item.description}</td>
                    <td className="p-3 text-center">{item.quantity}</td>
                    <td className="p-3 text-right">GMD {item.unitPrice.toFixed(2)}</td>
                    <td className="p-3 text-right font-medium">GMD {(item.quantity * item.unitPrice).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Totals & Payment Terms */}
          <div className="flex justify-between items-start pt-6 border-t">
            <div className="w-2/5 pr-4">
                 <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Payment Terms</h4>
                 <div className="text-sm text-gray-700 space-y-1">
                    <p><span className="font-semibold">75% Deposit:</span> GMD {depositAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    <p><span className="font-semibold">25% Final Balance:</span> GMD {finalBalanceAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                 </div>
                 <p className="text-xs text-gray-500 mt-2">Deposit is due to commence work. Final balance is due upon project completion.</p>
                 <div className="mt-4">
                    <p className="font-semibold text-sm text-gray-800">Amount in Words:</p>
                    <p className="text-xs text-gray-600 capitalize">{numberToWords(amountDueValue)}</p>
                </div>
            </div>
            <div className="w-3/5 max-w-sm space-y-2">
                <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal:</span>
                    <span className="font-medium text-gray-800">GMD {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Tax ({invoice.taxRate}%):</span>
                    <span className="font-medium text-gray-800">GMD {taxAmount.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="font-semibold text-gray-800">Total Project Cost:</span>
                    <span className="font-semibold text-gray-800">GMD {totalAmount.toFixed(2)}</span>
                </div>
                 {isProformaPhase && (
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">75% Deposit Due:</span>
                        <span className="font-medium text-gray-800">GMD {depositAmount.toFixed(2)}</span>
                    </div>
                )}
                 <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Amount Paid:</span>
                    <span className="font-medium text-green-600">- GMD {invoice.amountPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between bg-gray-100 p-3 rounded-md mt-2">
                    <span className="font-bold text-lg text-gray-800">{amountDueLabel}</span>
                    <span className="font-bold text-lg text-gray-800">GMD {amountDueValue.toFixed(2)}</span>
                </div>
            </div>
          </div>
          
           {/* Footer Notes */}
          <div className="text-center text-xs text-gray-500 border-t pt-4">
            <p>{invoice.notes}</p>
          </div>
        </div>

        <div className="flex justify-end items-center p-4 bg-gray-50 border-t print:hidden">
          <button onClick={handlePrint} className="px-4 py-2 bg-green-500 text-white rounded-md mr-2 hover:bg-green-600">Print</button>
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Close</button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailModal;