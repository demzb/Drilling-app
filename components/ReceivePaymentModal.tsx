import React, { useState, useEffect } from 'react';
import { Project } from '../types';

interface ReceivePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: { projectId: string; amount: number; date: string; notes?: string }) => void;
  project: Project;
}

const ReceivePaymentModal: React.FC<ReceivePaymentModalProps> = ({ isOpen, onClose, onSave, project }) => {
    const pendingAmount = project.totalBudget - project.amountReceived;
    const [amount, setAmount] = useState(pendingAmount.toString());
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (isOpen) {
            setAmount((project.totalBudget - project.amountReceived).toString());
            setDate(new Date().toISOString().split('T')[0]);
            setNotes('');
        }
    }, [isOpen, project]);
    
    if (!isOpen) return null;

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const numberAmount = parseFloat(amount);
        if (isNaN(numberAmount) || numberAmount <= 0) {
            alert('Please enter a valid, positive payment amount.');
            return;
        }
        onSave({
            projectId: project.id,
            amount: numberAmount,
            date,
            notes,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <form onSubmit={handleSave}>
                    <div className="flex justify-between items-center p-4 border-b">
                        <h2 className="text-xl font-semibold text-gray-800">Receive Project Payment</h2>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">Project</p>
                            <p className="font-semibold text-lg text-gray-800">{project.name}</p>
                        </div>
                         <div className="bg-gray-50 p-3 rounded-md text-center">
                            <p className="text-sm text-gray-500">Pending Amount</p>
                            <p className="font-bold text-2xl text-red-600">
                                GMD {pendingAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Payment Amount (GMD)</label>
                                <input 
                                    type="number" 
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" 
                                    placeholder="0.00" 
                                    step="0.01"
                                    required
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                                <input 
                                    type="date" 
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                            <textarea 
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                placeholder="e.g., Final settlement payment"
                            ></textarea>
                        </div>

                    </div>

                    <div className="flex justify-end items-center p-4 bg-gray-50 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md mr-2 hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save Payment</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReceivePaymentModal;