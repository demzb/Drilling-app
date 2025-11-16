import React, { useState, useEffect, useMemo } from 'react';
import { Invoice, LineItem, InvoiceStatus, InvoiceType, Project, Client, Payment, PaymentMethod } from '../types';
import { getInvoiceTotal, getInvoiceTotalPaid } from '../utils/invoiceUtils';
import InvoicePaymentModal from './InvoicePaymentModal';

interface InvoiceEditorProps {
    invoiceToEdit: Invoice | null;
    onCancel: () => void;
    onSave: (invoice: Omit<Invoice, 'id' | 'created_at' | 'user_id'> & { id?: string }) => Promise<void>;
    nextInvoiceNumber: string;
    projects: Project[];
    clients: Client[];
    onReceivePayment: (invoiceId: string, paymentDetails: Omit<Payment, 'id'>) => Promise<{ updatedInvoice: Invoice, newPayment: Payment } | null>;
}

const emptyLineItem: Omit<LineItem, 'id'> = { product_service: '', sku: '', description: '', quantity: 1, rate: 0 };

const HelpCircleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const InvoiceEditor: React.FC<InvoiceEditorProps> = ({ invoiceToEdit, onCancel, onSave, nextInvoiceNumber, projects, clients, onReceivePayment }) => {
    const [invoice, setInvoice] = useState<Omit<Invoice, 'id' | 'user_id' | 'created_at'> & { id?: string }>(() => {
        const initialDate = new Date().toISOString().split('T')[0];
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        
        return {
            invoice_number: nextInvoiceNumber,
            project_id: '',
            client_name: '',
            client_email: '',
            client_address: '',
            date: initialDate,
            due_date: dueDate.toISOString().split('T')[0],
            terms: 'Net 30',
            send_later: false,
            line_items: [{ id: Date.now().toString(), ...emptyLineItem }],
            notes: 'Thank you for your business.',
            statement_message: '',
            tax_rate: 0,
            discount_amount: 0,
            status: InvoiceStatus.DRAFT,
            invoice_type: InvoiceType.INVOICE,
            payments: [],
        };
    });

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    useEffect(() => {
        if (invoiceToEdit) {
            const { user_id, created_at, ...editableInvoice } = invoiceToEdit;
            setInvoice({
                ...editableInvoice,
                client_email: clients.find(c => {
                    const project = projects.find(p => p.id === editableInvoice.project_id);
                    return project?.client_id === c.id;
                })?.email || '',
                statement_message: editableInvoice.statement_message || '',
            });
        }
    }, [invoiceToEdit, clients, projects]);

    const { subtotal, total, balanceDue } = useMemo(() => {
        const subtotal = invoice.line_items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
        const total = getInvoiceTotal({
            line_items: invoice.line_items,
            tax_rate: invoice.tax_rate,
            discount_amount: invoice.discount_amount
        });
        const totalPaid = getInvoiceTotalPaid(invoice);
        const balanceDue = total - totalPaid;
        return { subtotal, total, balanceDue };
    }, [invoice.line_items, invoice.tax_rate, invoice.discount_amount, invoice.payments]);


    const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedProjectId = e.target.value;
        const selectedProject = projects.find(p => p.id === selectedProjectId);
        const projectClient = selectedProject ? clients.find(c => c.id === selectedProject.client_id) : null;

        setInvoice(prev => ({
            ...prev,
            project_id: selectedProjectId || '',
            project_name: selectedProject ? selectedProject.name : undefined,
            client_name: projectClient ? projectClient.name : (selectedProject ? selectedProject.client_name : ''),
            client_address: projectClient ? projectClient.address : '',
            client_email: projectClient ? projectClient.email : ''
        }));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const isNumber = type === 'number';

        setInvoice(prev => ({
            ...prev,
            [name]: isCheckbox ? (e.target as HTMLInputElement).checked : (isNumber ? parseFloat(value) || 0 : value),
        }));
    };

    const handleLineItemChange = (index: number, field: keyof LineItem, value: string | number) => {
        const newLineItems = [...invoice.line_items];
        const item = newLineItems[index];
        if (typeof (item as any)[field] === 'number') {
            (item as any)[field] = parseFloat(String(value)) || 0;
        } else {
            (item as any)[field] = value;
        }
        setInvoice(prev => ({ ...prev, line_items: newLineItems }));
    };

    const addLineItem = () => {
        setInvoice(prev => ({
            ...prev,
            line_items: [...prev.line_items, { id: Date.now().toString(), ...emptyLineItem }],
        }));
    };

    const removeLineItem = (index: number) => {
        const newLineItems = invoice.line_items.filter((_, i) => i !== index);
        setInvoice(prev => ({ ...prev, line_items: newLineItems }));
    };

    const clearAllLines = () => {
        setInvoice(prev => ({ ...prev, line_items: [{ id: Date.now().toString(), ...emptyLineItem }] }));
    };

    const handleSave = () => {
        if (!invoice.project_id) {
            alert('Please select a project.');
            return;
        }
        onSave(invoice);
    };

    const handleSavePayment = async (details: { amount: number, method: PaymentMethod, checkNumber?: string }) => {
        if (!invoice.id) return; // Can't pay an unsaved invoice
        const paymentDetails: Omit<Payment, 'id'> = {
            date: new Date().toISOString().split('T')[0],
            amount: details.amount,
            method: details.method,
            checkNumber: details.checkNumber,
        };
        const result = await onReceivePayment(invoice.id, paymentDetails);
        if (result) {
            setInvoice(prev => ({...prev, ...result.updatedInvoice}));
        }
        setIsPaymentModalOpen(false);
    };

    return (
      <>
        {invoice.id && (
            <InvoicePaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onSave={handleSavePayment}
                invoice={invoice as Invoice}
            />
        )}
        <div className="bg-gray-100 flex flex-col h-full">
            {/* Header */}
            <header className="bg-white p-4 border-b flex justify-between items-center sticky top-0 z-10">
                <h1 className="text-xl font-semibold text-gray-800">
                    {invoice.id ? `Invoice no. ${invoice.invoice_number}` : 'New Invoice'}
                </h1>
                <div className="flex items-center space-x-4">
                    <button className="text-gray-500 hover:text-gray-800"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
                    <button className="text-gray-500 hover:text-gray-800"><HelpCircleIcon /></button>
                    <button onClick={onCancel} className="text-gray-500 hover:text-gray-800"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow p-6 overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Top Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-sm space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 flex items-center">Link to Project</label>
                                    <select name="project_id" value={invoice.project_id} onChange={handleProjectChange} required className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                        <option value="" disabled>Select a project</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                 <div>
                                    <label className="text-sm font-medium text-gray-700 flex items-center">Customer email <HelpCircleIcon /></label>
                                    <input type="email" name="client_email" value={invoice.client_email || ''} readOnly className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-100" />
                                </div>
                            </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                               
                                 <div className="flex items-end">
                                    <div className="flex items-center">
                                        <input id="send_later" name="send_later" type="checkbox" checked={invoice.send_later} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                                        <label htmlFor="send_later" className="ml-2 block text-sm text-gray-900">Send later</label>
                                        <HelpCircleIcon />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Billing address</label>
                                    <textarea name="client_address" value={invoice.client_address} readOnly rows={4} className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-100"></textarea>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Terms</label>
                                    <select name="terms" value={invoice.terms} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                        <option>Net 30</option>
                                        <option>Net 15</option>
                                        <option>Net 60</option>
                                        <option>Due on receipt</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Invoice date</label>
                                    <input type="date" name="date" value={invoice.date} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Due date</label>
                                    <input type="date" name="due_date" value={invoice.due_date} onChange={handleInputChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Invoice no.</label>
                                <input type="text" name="invoice_number" value={invoice.invoice_number} onChange={handleInputChange} className="mt-1 w-full max-w-xs border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm text-center flex flex-col justify-center">
                            <p className="text-sm uppercase text-gray-500">Balance Due</p>
                            <p className="text-4xl font-bold text-gray-800 my-4">GMD {balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                            <button onClick={() => setIsPaymentModalOpen(true)} disabled={!invoice.id} className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed">Receive payment</button>
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="bg-white rounded-lg shadow-sm">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-2 w-8"></th>
                                    <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                    <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product/Service</th>
                                    <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                                    <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                    <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                                    <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="p-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {invoice.line_items.map((item, index) => (
                                    <tr key={item.id}>
                                        <td className="p-2 align-top text-gray-400 cursor-move">:::</td>
                                        <td className="p-2 align-top text-sm text-gray-500">{index + 1}</td>
                                        <td className="p-1 align-top"><input type="text" value={item.product_service} onChange={e => handleLineItemChange(index, 'product_service', e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm sm:text-sm" /></td>
                                        <td className="p-1 align-top"><input type="text" value={item.sku} onChange={e => handleLineItemChange(index, 'sku', e.target.value)} className="w-20 border-gray-300 rounded-md shadow-sm sm:text-sm" /></td>
                                        <td className="p-1 align-top"><input type="text" value={item.description} onChange={e => handleLineItemChange(index, 'description', e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm sm:text-sm" /></td>
                                        <td className="p-1 align-top"><input type="number" value={item.quantity} onChange={e => handleLineItemChange(index, 'quantity', e.target.value)} className="w-20 border-gray-300 rounded-md shadow-sm sm:text-sm" /></td>
                                        <td className="p-1 align-top"><input type="number" value={item.rate} onChange={e => handleLineItemChange(index, 'rate', e.target.value)} className="w-24 border-gray-300 rounded-md shadow-sm sm:text-sm" /></td>
                                        <td className="p-2 align-top text-sm text-gray-900">{(item.quantity * item.rate).toFixed(2)}</td>
                                        <td className="p-2 align-top"><button onClick={() => removeLineItem(index)} className="text-gray-400 hover:text-red-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-4 bg-gray-50 border-t flex items-center space-x-2">
                            <button onClick={addLineItem} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">Add lines</button>
                            <button onClick={clearAllLines} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">Clear all lines</button>
                            <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">Add subtotal</button>
                        </div>
                    </div>

                     {/* Bottom Section */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                             <div>
                                <label className="text-sm font-medium text-gray-700">Message on invoice</label>
                                <textarea name="notes" value={invoice.notes} onChange={handleInputChange} rows={4} className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="This will show up on the invoice."></textarea>
                             </div>
                             <div>
                                <label className="text-sm font-medium text-gray-700">Message on statement</label>
                                <textarea name="statement_message" value={invoice.statement_message} onChange={handleInputChange} rows={4} className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="If you send statements to customers, this will show up as the description for this invoice."></textarea>
                             </div>
                             <div>
                                <h3 className="text-sm font-medium text-gray-700">Attachments</h3>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                    <div className="space-y-1 text-center">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        <div className="flex text-sm text-gray-600">
                                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"><span>Drag/Drop files here or click the icon</span><input id="file-upload" name="file-upload" type="file" className="sr-only" multiple /></label>
                                        </div>
                                        <p className="text-xs text-gray-500">Maximum size: 20MB</p>
                                    </div>
                                </div>
                             </div>
                        </div>
                        <div className="flex flex-col justify-end">
                            <div className="bg-white p-6 rounded-lg shadow-sm space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-medium text-gray-900">GMD {subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <label htmlFor="discount_amount" className="text-gray-600">Discount</label>
                                    <input id="discount_amount" name="discount_amount" type="number" value={invoice.discount_amount} onChange={handleInputChange} className="w-28 text-right border-gray-300 rounded-md shadow-sm sm:text-sm" />
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <label htmlFor="tax_rate" className="text-gray-600">Tax (%)</label>
                                    <input id="tax_rate" name="tax_rate" type="number" value={invoice.tax_rate} onChange={handleInputChange} className="w-28 text-right border-gray-300 rounded-md shadow-sm sm:text-sm" />
                                </div>
                                <div className="flex justify-between items-center text-lg font-bold border-t pt-3 mt-3">
                                    <span>Total</span>
                                    <span>GMD {total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Amount paid</span>
                                    <span className="font-medium text-gray-900">- GMD {getInvoiceTotalPaid(invoice).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-lg font-bold border-t pt-3 mt-3">
                                    <span>Balance due</span>
                                    <span>GMD {balanceDue.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                     </div>
                </div>
            </main>
            {/* Footer */}
            <footer className="bg-white p-4 border-t flex justify-end items-center space-x-3 sticky bottom-0 z-10">
                <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Save Invoice</button>
            </footer>
        </div>
      </>
    );
};

export default InvoiceEditor;