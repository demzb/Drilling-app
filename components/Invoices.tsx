import React, { useState, useMemo } from 'react';
import { Invoice, InvoiceStatus, Project, ProjectStatus, InvoiceType, Payment, Client, PaymentMethod } from '../types';
import InvoiceModal from './InvoiceModal';
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
  onSaveClient: (clientData: Omit<Client, 'id' | 'created_at' | 'user_id'> & { id?: string }) => Promise<Client | null>;
}

const Invoices: React.FC<InvoicesProps> = ({ invoices, projects, clients, onSave, onDelete, onReceivePayment, onSaveClient }) => {
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState<boolean>(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
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
        setIsInvoiceModalOpen(false);
        setSelectedInvoice(null);
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
    
    const handleOpenCreateModal = () => {
        setSelectedInvoice(null);
        setIsInvoiceModalOpen(true);
    };

    const handleOpenEditModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsInvoiceModalOpen(true);
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


    return (
        <div className="space-y-6">
            <InvoiceModal
                isOpen={isInvoiceModalOpen}
                onClose={() => setIsInvoiceModalOpen(false)}
                onSave={handleSaveInvoice}
                nextInvoiceNumber={getNextInvoiceNumber()}
                projects={projects}
                clients={clients}
                invoiceToEdit={selectedInvoice}
                onSaveClient={onSaveClient}
            />
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
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                            Sort by Date ({sortOrder === 'newest' ? 'Newest' : 'Oldest'})
                        </button>
                         <button
                            onClick={handleOpenCreateModal}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors shadow-md flex items-center"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                            Create Invoice
                        </button>
                    </div>
                </div>
            </div>
            
            {filteredAndSortedInvoices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredAndSortedInvoices.map((invoice) => {
                        const total = getInvoiceTotal(invoice);
                        const totalPaid = getInvoiceTotalPaid(invoice);
                        const balance = total - totalPaid;
                        const statusStyles = getStatusStyles(invoice.status);

                        return (
                        <div key={invoice.id} className={`bg-gradient-to-br from-white to-slate-50 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out hover:-translate-y-1 border-l-4 ${statusStyles.border} flex flex-col`}>
                            <div className="p-5 flex-grow">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-blue-600">{invoice.invoice_number}</p>
                                        <p className="text-sm font-medium text-gray-700 truncate">{invoice.client_name}</p>
                                    </div>
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusStyles.badge} shrink-0`}>
                                        {invoice.status}
                                    </span>
                                </div>

                                <div className="mt-4 pt-4 border-t space-y-2">
                                    <div className="flex justify-between text-sm items-baseline">
                                        <span className="text-gray-500">Total:</span>
                                        <span className="font-semibold text-gray-800">GMD {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between text-sm items-baseline">
                                        <span className="text-gray-500">Paid:</span>
                                        <span className="font-semibold text-green-600">GMD {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between text-sm items-baseline">
                                        <span className="text-gray-500 font-semibold">Balance:</span>
                                        <span className="font-bold text-red-600">GMD {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                                
                                <div className="mt-4 pt-2 border-t text-xs text-gray-500 space-y-1">
                                    <div className="flex justify-between">
                                        <span>Invoice Date:</span>
                                        <span className="font-medium">{invoice.date}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Due Date:</span>
                                        <span className="font-medium">{invoice.due_date || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50/50 px-2 py-2 flex justify-center items-center border-t">
                                <div className="flex flex-wrap justify-center gap-x-1 gap-y-1">
                                    <button onClick={() => handleViewDetails(invoice)} className="flex items-center text-xs font-medium text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-md p-2 transition-colors duration-200"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>View</button>
                                    <button onClick={() => handleOpenEditModal(invoice)} className="flex items-center text-xs font-medium text-gray-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-md p-2 transition-colors duration-200"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>Edit</button>
                                    {invoice.status !== InvoiceStatus.PAID && invoice.status !== InvoiceStatus.DRAFT && (
                                        <button onClick={() => handleOpenPaymentModal(invoice)} className="flex items-center text-xs font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-md p-2 transition-colors duration-200"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg>Pay</button>
                                    )}
                                    <button onClick={() => handleOpenHistoryModal(invoice)} className="flex items-center text-xs font-medium text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-md p-2 transition-colors duration-200"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.898 0V3a1 1 0 112 0v2.101a7.002 7.002 0 01.491 10.592l-1.954 1.954A1 1 0 0115.536 18H4.464a1 1 0 01-.707-1.707l-1.954-1.954A7.002 7.002 0 014 5.101V3a1 1 0 011-1zM6 10a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" /></svg>Payments</button>
                                    <button onClick={() => handleDeleteRequest(invoice)} className="flex items-center text-xs font-medium text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-md p-2 transition-colors duration-200"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>Delete</button>
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
                ) : (
                <div className="text-center text-gray-500 py-16 bg-white rounded-lg shadow-md border-2 border-dashed">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices found</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new invoice or adjusting your filters.</p>
                </div>
            )}
        </div>
    );
};

export default Invoices;