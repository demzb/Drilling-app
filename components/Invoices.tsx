import React, { useState, useMemo } from 'react';
import { Invoice, InvoiceStatus, Project, Client, Payment, PaymentMethod } from '../types';
import InvoiceEditor from './InvoiceEditor';
import InvoiceDetailModal from './InvoiceDetailModal';
import ConfirmationModal from './ConfirmationModal';
import InvoicePaymentModal from './InvoicePaymentModal';
import PaymentHistoryModal from './PaymentHistoryModal';
import ReceiptModal from './ReceiptModal';
import { getInvoiceTotal, getInvoiceTotalPaid } from '../utils/invoiceUtils';

interface InvoicesProps {
  invoices: Invoice[];
  projects: Project[];
  clients: Client[];
  onSave: (invoice: Omit<Invoice, 'id' | 'created_at' | 'user_id'> & { id?: string }) => Promise<void>;
  onDelete: (invoiceId: string) => void;
  onReceivePayment: (invoiceId: string, paymentDetails: Omit<Payment, 'id'>) => Promise<{ updatedInvoice: Invoice, newPayment: Payment } | null>;
}

const Invoices: React.FC<InvoicesProps> = ({ invoices, projects, clients, onSave, onDelete, onReceivePayment }) => {
    const [view, setView] = useState<'list' | 'editor'>('list');
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [receiptData, setReceiptData] = useState<{ invoice: Invoice, payment: Payment } | null>(null);

    const getNextInvoiceNumber = () => {
        const prefix = 'INV';
        const currentYear = new Date().getFullYear();
        const yearInvoices = invoices.filter(inv => inv.invoice_number.startsWith(`${prefix}-${currentYear}-`));

        if (yearInvoices.length === 0) {
            return `${prefix}-${currentYear}-001`;
        }

        const maxNumber = yearInvoices.reduce((max, inv) => {
            const numPart = parseInt(inv.invoice_number.split('-')[2], 10);
            return !isNaN(numPart) && numPart > max ? numPart : max;
        }, 0);

        const nextNumber = maxNumber + 1;
        return `${prefix}-${currentYear}-${nextNumber.toString().padStart(3, '0')}`;
    };

    const handleSaveInvoice = async (invoiceData: Omit<Invoice, 'id' | 'created_at' | 'user_id'> & { id?: string }) => {
        await onSave(invoiceData);
        setView('list');
        setInvoiceToEdit(null);
    }

    const handleOpenPaymentModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsPaymentModalOpen(true);
    };

    const handleSavePayment = async (details: { amount: number, method: PaymentMethod, checkNumber?: string }) => {
        if (!selectedInvoice) return;
        const paymentDetails: Omit<Payment, 'id'> = {
            date: new Date().toISOString().split('T')[0],
            amount: details.amount,
            method: details.method,
            checkNumber: details.checkNumber,
        };

        const result = await onReceivePayment(selectedInvoice.id, paymentDetails);
        
        setIsPaymentModalOpen(false);
        setSelectedInvoice(null);

        if (result) {
            setReceiptData({ invoice: result.updatedInvoice, payment: result.newPayment });
            setIsReceiptModalOpen(true);
        }
    };
    
    const handleOpenCreate = () => {
        setInvoiceToEdit(null);
        setView('editor');
    };

    const handleOpenEdit = (invoice: Invoice) => {
        setInvoiceToEdit(invoice);
        setView('editor');
    };

    const handleOpenHistoryModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsHistoryModalOpen(true);
    };

    const handleDeleteRequest = (invoice: Invoice) => {
        setInvoiceToDelete(invoice);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (invoiceToDelete) {
            onDelete(invoiceToDelete.id);
            setIsConfirmModalOpen(false);
            setInvoiceToDelete(null);
        }
    };
    
    const handleViewDetails = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsDetailModalOpen(true);
    };
    
    const getStatusStyles = (status: InvoiceStatus) => {
        switch (status) {
          case InvoiceStatus.PAID:
            return { badge: 'bg-green-100 text-green-800', border: 'border-green-500' };
          case InvoiceStatus.PARTIALLY_PAID:
            return { badge: 'bg-yellow-100 text-yellow-800', border: 'border-yellow-500' };
          case InvoiceStatus.SENT:
            return { badge: 'bg-blue-100 text-blue-800', border: 'border-blue-500' };
          case InvoiceStatus.OVERDUE:
            return { badge: 'bg-red-100 text-red-800', border: 'border-red-500' };
          case InvoiceStatus.DRAFT:
          default:
            return { badge: 'bg-gray-100 text-gray-800', border: 'border-gray-400' };
        }
    };

    const filteredAndSortedInvoices = useMemo(() => {
        let result = [...invoices];

        if (statusFilter !== 'All') {
            result = result.filter(invoice => invoice.status === statusFilter);
        }

        result.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [invoices, statusFilter, sortOrder]);

    const handleMarkAsSent = async (invoice: Invoice) => {
        const updatedInvoice = { ...invoice, status: InvoiceStatus.SENT };
        const { created_at, user_id, ...saveData } = updatedInvoice;
        await onSave(saveData);
    };

    if(view === 'editor') {
      return (
        <InvoiceEditor
          invoiceToEdit={invoiceToEdit}
          onCancel={() => setView('list')}
          onSave={handleSaveInvoice}
          nextInvoiceNumber={getNextInvoiceNumber()}
          projects={projects}
          clients={clients}
          onReceivePayment={onReceivePayment}
        />
      );
    }

    return (
        <div className="space-y-6">
            {selectedInvoice && (
                <InvoiceDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={() => { setIsDetailModalOpen(false); setSelectedInvoice(null); }}
                    invoice={selectedInvoice}
                />
            )}
             {selectedInvoice && (
                <InvoicePaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => { setIsPaymentModalOpen(false); setSelectedInvoice(null); }}
                    onSave={handleSavePayment}
                    invoice={selectedInvoice}
                />
            )}
             {selectedInvoice && (
                <PaymentHistoryModal
                    isOpen={isHistoryModalOpen}
                    onClose={() => { setIsHistoryModalOpen(false); setSelectedInvoice(null); }}
                    invoice={selectedInvoice}
                />
            )}
            {receiptData && (
                <ReceiptModal
                    isOpen={isReceiptModalOpen}
                    onClose={() => { setIsReceiptModalOpen(false); setReceiptData(null); }}
                    invoice={receiptData.invoice}
                    payment={receiptData.payment}
                />
            )}
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Invoice"
                message={
                    <>
                        Are you sure you want to delete invoice "<strong>{invoiceToDelete?.invoice_number}</strong>"? This action cannot be undone.
                    </>
                }
            />

            <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="flex flex-wrap justify-between items-center gap-4">
                     <div>
                        <h3 className="text-xl font-semibold text-gray-800">Manage Invoices</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <div>
                            <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700 mr-2">Status:</label>
                            <select id="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border-gray-300 shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500">
                                <option value="All">All</option>
                                {Object.values(InvoiceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <button
                            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                            className="flex items-center text-sm text-gray-600 border border-gray-300 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            <svg xmlns="http://www.w.3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                            Sort by Date ({sortOrder === 'newest' ? 'Newest' : 'Oldest'})
                        </button>
                         <button
                            onClick={handleOpenCreate}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors shadow-md flex items-center"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                             </svg>
                            New Invoice
                        </button>
                    </div>
                </div>
            </div>

            {filteredAndSortedInvoices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredAndSortedInvoices.map(invoice => {
                        const { badge, border } = getStatusStyles(invoice.status);
                        const total = getInvoiceTotal(invoice);
                        const paid = getInvoiceTotalPaid(invoice);
                        const balance = total - paid;
                        const isOverdue = invoice.status === InvoiceStatus.OVERDUE || (invoice.due_date && new Date(invoice.due_date) < new Date() && invoice.status !== InvoiceStatus.PAID);

                        return (
                            <div key={invoice.id} className={`bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border-l-4 ${border} flex flex-col`}>
                                <div className="p-5 flex-grow">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-semibold text-blue-600">{invoice.invoice_number}</p>
                                            <p className="font-bold text-gray-800 truncate">{invoice.client_name}</p>
                                        </div>
                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${badge}`}>{invoice.status}</span>
                                    </div>
                                    <div className="mt-4 space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Total Invoiced</span>
                                            <span className="font-medium text-gray-800">GMD {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Amount Paid</span>
                                            <span className="font-medium text-green-600">GMD {paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 mt-1 border-t">
                                            <span className="font-bold text-gray-800">Balance Due</span>
                                            <span className={`font-bold text-lg ${balance > 0 ? 'text-red-600' : 'text-gray-800'}`}>GMD {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                    <div className="mt-3 text-xs text-gray-500">
                                        {isOverdue ? (
                                            <p className="font-semibold text-red-600">Due on: {invoice.due_date || 'N/A'}</p>
                                        ) : (
                                            <p>Due on: {invoice.due_date || 'N/A'}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-gray-50/70 px-4 py-3 flex flex-wrap justify-end items-center gap-x-4 gap-y-2 border-t">
                                    {invoice.status === InvoiceStatus.DRAFT && (
                                        <button
                                            onClick={() => handleMarkAsSent(invoice)}
                                            className="flex items-center text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded-md transition-colors shadow-sm"
                                            title="Mark this invoice as sent to the client"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 009.894 15V4a1 1 0 011-1h.002a1 1 0 01.998 1.117l-1 8a1 1 0 00.894.883l5-1.428a1 1 0 001.17-1.408l-7-14z" />
                                            </svg>
                                            Mark as Sent
                                        </button>
                                    )}
                                    {![InvoiceStatus.DRAFT, InvoiceStatus.PAID].includes(invoice.status) && (
                                        <button onClick={() => handleOpenPaymentModal(invoice)} className="flex items-center text-sm font-medium text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-md transition-colors shadow-sm">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg>
                                            Receive Payment
                                        </button>
                                    )}
                                    <button onClick={() => handleViewDetails(invoice)} className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">View Details</button>
                                    {invoice.payments && invoice.payments.length > 0 && (
                                        <button onClick={() => handleOpenHistoryModal(invoice)} className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">History</button>
                                    )}
                                    <button onClick={() => handleOpenEdit(invoice)} className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">Edit</button>
                                    <button onClick={() => handleDeleteRequest(invoice)} className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors">Delete</button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center text-gray-500 py-16 bg-white rounded-lg shadow-md border-2 border-dashed">
                     <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices found</h3>
                    <p className="mt-1 text-sm text-gray-500">Create a new invoice to get started.</p>
                </div>
            )}
        </div>
    );
};

export default Invoices;