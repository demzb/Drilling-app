import React, { useState, useEffect } from 'react';
import { Invoice, PaymentMethod } from '../types';
import { getInvoiceTotal, getInvoiceTotalPaid } from '../utils/invoiceUtils';
import ConfirmationModal from './ConfirmationModal';

interface InvoicePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: { amount: number; method: PaymentMethod; checkNumber?: string }) => void;
  invoice: Invoice;
}

const InvoicePaymentModal: React.FC<InvoicePaymentModalProps> = ({ isOpen, onClose, onSave, invoice }) => {
    const totalAmount = getInvoiceTotal(invoice);
    const totalPaid = getInvoiceTotalPaid(invoice);
    const balanceDue = totalAmount - totalPaid;
    
    const [amount, setAmount] = useState('0');
    const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
    const [checkNumber, setCheckNumber] = useState('');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAmount(balanceDue.toFixed(2));
            setMethod(PaymentMethod.CASH);
            setCheckNumber('');
        }
    }, [isOpen, balanceDue]);
    
    if (!isOpen) return null;

    const processSave = () => {
        const numberAmount = parseFloat(amount);
        if (isNaN(numberAmount) || numberAmount <= 0) {
            alert('Please enter a valid, positive payment amount.');
            return;
        }
        if (method === PaymentMethod.CHECK && !checkNumber.trim()) {
            alert('Please enter a check number for check payments.');
            return;
        }
        onSave({ 
            amount: numberAmount, 
            method,
            checkNumber: method === PaymentMethod.CHECK ? checkNumber.trim() : undefined
        });
    }

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const numberAmount = parseFloat(amount);
        if (numberAmount > balanceDue + 0.01) { // Add tolerance
             setIsConfirmOpen(true);
        } else {
            processSave();
        }
    };
    
    const handleConfirmOverpayment = () => {
        setIsConfirmOpen(false);
        processSave();
    };

    const handlePercentageClick = (percentage: number) => {
        const calculatedAmount = balanceDue * percentage;
        setAmount(calculatedAmount.toFixed(2));
    };

    return (
        <>
        <ConfirmationModal
            isOpen={isConfirmOpen}
            onClose={() => setIsConfirmOpen(false)}
            onConfirm={handleConfirmOverpayment}
            title="Confirm Overpayment"
            message={
                <>
                  The payment amount <strong>GMD {parseFloat(amount).toLocaleString()}</strong> is greater than the balance due <strong>GMD {balanceDue.toLocaleString()}</strong>.
                  <br />
                  This will result in an overpayment. Do you want to continue?
                </>
            }
        />
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <form onSubmit={handleSave}>
                    <div className="flex justify-between items-center p-4 border-b">
                        <h2 className="text-xl font-semibold text-gray-800">Receive Payment</h2>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">Invoice #{invoice.invoiceNumber}</p>
                            <p className="font-semibold text-lg text-gray-800">{invoice.clientName}</p>
                        </div>
                         <div className="bg-gray-50 p-3 rounded-md grid grid-cols-3 gap-2 text-center">
                            <div>
                                <p className="text-xs text-gray-500">Total Amount</p>
                                <p className="font-semibold text-gray-800">GMD {totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                            </div>
                             <div>
                                <p className="text-xs text-gray-500">Amount Paid</p>
                                <p className="font-semibold text-green-600">GMD {totalPaid.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                            </div>
                             <div>
                                <p className="text-xs text-gray-500">Balance Due</p>
                                <p className="font-bold text-red-600">
                                    GMD {balanceDue.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                </p>
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Payment Amount to Receive (GMD)</label>
                            <input 
                                type="number" 
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-lg" 
                                placeholder="0.00" 
                                step="0.01"
                                required
                            />
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs text-gray-500">Quick Select:</span>
                                <button type="button" onClick={() => handlePercentageClick(0.25)} className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors">25%</button>
                                <button type="button" onClick={() => handlePercentageClick(0.75)} className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors">75%</button>
                                <button type="button" onClick={() => handlePercentageClick(1)} className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors">100%</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                                <select 
                                    value={method}
                                    onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                >
                                    {Object.values(PaymentMethod).filter(m => m !== PaymentMethod.UNSPECIFIED).map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                           </div>
                           {method === PaymentMethod.CHECK && (
                               <div>
                                    <label className="block text-sm font-medium text-gray-700">Check Number</label>
                                    <input 
                                        type="text" 
                                        value={checkNumber}
                                        onChange={(e) => setCheckNumber(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        placeholder="Enter check #"
                                        required
                                    />
                               </div>
                           )}
                        </div>
                    </div>

                    <div className="flex justify-end items-center p-4 bg-gray-50 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md mr-2 hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save Payment</button>
                    </div>
                </form>
            </div>
        </div>
        </>
    );
};

export default InvoicePaymentModal;