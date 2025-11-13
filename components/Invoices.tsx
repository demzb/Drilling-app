import React, { useState, useMemo } from 'react';
import { Invoice, InvoiceStatus, Project, ProjectStatus, InvoiceType, Payment, Client, PaymentMethod } from '../types';
import InvoiceModal from './ProformaInvoiceModal';
import InvoiceDetailModal from './InvoiceDetailModal';
import ConfirmationModal from './ConfirmationModal';
import InvoicePaymentModal from './InvoicePaymentModal';
import PaymentHistoryModal from './PaymentHistoryModal';
import ReminderModal from './ReminderModal';
import { getInvoiceTotal, getInvoiceTotalPaid } from '../utils/invoiceUtils';

interface InvoicesProps {
  invoices: Invoice[];
  projects: Project[];
  clients: Client[];
  onSave: (invoice: Omit<Invoice, 'id' | 'payments'> & { id?: string; payments?: Payment[] }) => void;
  onDelete: (invoiceId: string) => void;
  onReceivePayment: (invoiceId: string, paymentDetails: Omit<Payment, 'id'>) => void;
  onSendReminder: (invoiceId: string) => void;
}

const Invoices: React.FC<InvoicesProps> = ({ invoices, projects, clients, onSave, onDelete, onReceivePayment, onSendReminder }) => {
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState<boolean>(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
    const [isReminderModalOpen, setIsReminderModalOpen] = useState<boolean>(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [typeFilter, setTypeFilter] = useState<string>('All');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);


    const getNextInvoiceNumber = () => {
        const prefix = 'INV';
        const currentYear = new Date().getFullYear();
        const yearInvoices = invoices.filter(inv => inv.invoiceNumber.startsWith(`${prefix}-${currentYear}-`));

        if (yearInvoices.length === 0) {
            return `${prefix}-${currentYear}-001`;
        }

        const maxNumber = yearInvoices.reduce((max, inv) => {
            const numPart = parseInt(inv.invoiceNumber.split('-')[2], 10);
            return !isNaN(numPart) && numPart > max ? numPart : max;
        }, 0);

        const nextNumber = maxNumber + 1;
        return `${prefix}-${currentYear}-${nextNumber.toString().padStart(3, '0')}`;
    };

    const handleSaveInvoice = (invoiceData: Omit<Invoice, 'id' | 'payments'> & { id?: string }) => {
        onSave(invoiceData);
        setIsInvoiceModalOpen(false);
        setSelectedInvoice(null);
    }

    const handleOpenPaymentModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsPaymentModalOpen(true);
    };

    const handleSavePayment = (details: { amount: number, method: PaymentMethod, checkNumber?: string }) => {
        if (!selectedInvoice) return;
        const paymentDetails: Omit<Payment, 'id'> = {
            date: new Date().toISOString().split('T')[0],
            amount: details.amount,
            method: details.method,
            checkNumber: details.checkNumber,
        };
        onReceivePayment(selectedInvoice.id, paymentDetails);
        setIsPaymentModalOpen(false);
        setSelectedInvoice(null);
    };

    const handleOpenReminderModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsReminderModalOpen(true);
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

    const handleSendFinalInvoice = (invoice: Invoice) => {
        const updatedInvoice = { ...invoice, status: InvoiceStatus.SENT, invoiceType: InvoiceType.INVOICE };
        onSave(updatedInvoice);
        handleViewDetails(updatedInvoice);
    };
    
    const getStatusColor = (status: InvoiceStatus) => {
        switch (status) {
            case InvoiceStatus.PAID: return 'bg-green-500 text-white';
            case InvoiceStatus.PARTIALLY_PAID: return 'bg-yellow-500 text-white';
            case InvoiceStatus.AWAITING_FINAL_PAYMENT: return 'bg-purple-500 text-white';
            case InvoiceStatus.SENT: return 'bg-blue-500 text-white';
            case InvoiceStatus.OVERDUE: return 'bg-red-500 text-white';
            case InvoiceStatus.DRAFT:
            default: return 'bg-gray-400 text-white';
        }
    };

    const getAmountDueNow = (invoice: Invoice): number => {
        const total = getInvoiceTotal(invoice);
        
        if (invoice.invoiceType === InvoiceType.INVOICE) {
            return total;
        }

        if (invoice.status === InvoiceStatus.DRAFT) {
            return 0;
        }
        
        if (invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.AWAITING_FINAL_PAYMENT) {
            return total;
        }
        
        return total * 0.75;
    };


    const filteredAndSortedInvoices = useMemo(() => {
        let result = [...invoices];

        if (statusFilter !== 'All') {
            result = result.filter(invoice => invoice.status === statusFilter);
        }

        if (typeFilter !== 'All') {
            result = result.filter(invoice => invoice.invoiceType === typeFilter);
        }

        result.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [invoices, statusFilter, typeFilter, sortOrder]);


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
            {selectedInvoice && (
                <ReminderModal
                    isOpen={isReminderModalOpen}
                    onClose={() => { setIsReminderModalOpen(false); setSelectedInvoice(null); }}
                    onSend={onSendReminder}
                    invoice={selectedInvoice}
                />
            )}
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Invoice"
                message={
                    <>
                        Are you sure you want to delete invoice "<strong>{invoiceToDelete?.invoiceNumber}</strong>"? This action cannot be undone.
                    </>
                }
            />

            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                    <h3 className="text-xl font-semibold text-gray-800">Invoices</h3>
                    <div className="flex flex-wrap items-center gap-4">
                        <div>
                            <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700 mr-2">Status:</label>
                            <select id="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border-gray-300 shadow-sm text-sm">
                                <option value="All">All</option>
                                {Object.values(InvoiceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="typeFilter" className="text-sm font-medium text-gray-700 mr-2">Type:</label>
                            <select id="typeFilter" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-md border-gray-300 shadow-sm text-sm">
                                <option value="All">All</option>
                                {Object.values(InvoiceType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <button
                            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                            className="flex items-center text-sm text-gray-600 border border-gray-300 px-3 py-1.5 rounded-md hover:bg-gray-50"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7l4-4m0 0l4 4m-4-4v18" /></svg>
                            Sort by Date ({sortOrder === 'newest' ? 'Newest' : 'Oldest'})
                        </button>
                         <button
                            onClick={handleOpenCreateModal}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                        >
                            Create Invoice
                        </button>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Invoice #</th>
                                <th scope="col" className="px-6 py-3">Client</th>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3 text-right">Total</th>
                                <th scope="col" className="px-6 py-3 text-right">Paid</th>
                                <th scope="col" className="px-6 py-3 text-right">Balance</th>
                                <th scope="col" className="px-6 py-3 text-center">Status</th>
                                <th scope="col" className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedInvoices.map((invoice) => {
                                const total = getInvoiceTotal(invoice);
                                const totalPaid = getInvoiceTotalPaid(invoice);
                                const balance = total - totalPaid;
                                return (
                                <tr key={invoice.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-blue-600">{invoice.invoiceNumber}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{invoice.clientName}</td>
                                    <td className="px-6 py-4">{invoice.date}</td>
                                    <td className="px-6 py-4 text-right font-medium text-gray-800">
                                        GMD {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-green-600">
                                        GMD {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-red-600">
                                        GMD {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                         <span className={`px-3 py-1 rounded-md text-xs font-semibold tracking-wide uppercase ${getStatusColor(invoice.status)}`}>
                                            {invoice.status}
                                        </span>
                                        {invoice.lastReminderSent && (
                                            <p className="text-xs text-gray-400 mt-1" title={`Last reminder sent on ${invoice.lastReminderSent}`}>
                                                Reminded
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <div className="flex justify-center items-center space-x-2">
                                        <button onClick={() => handleViewDetails(invoice)} className="font-medium text-blue-600 hover:underline">View</button>
                                        <button onClick={() => handleOpenEditModal(invoice)} className="font-medium text-yellow-600 hover:underline">Edit</button>
                                        {invoice.status !== InvoiceStatus.PAID && invoice.status !== InvoiceStatus.DRAFT && (
                                            <button onClick={() => handleOpenPaymentModal(invoice)} className="font-medium text-green-600 hover:underline">Pay</button>
                                        )}
                                        <button 
                                            onClick={() => handleOpenReminderModal(invoice)}
                                            className={`font-medium ${invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.DRAFT ? 'text-gray-400 cursor-not-allowed' : 'text-cyan-600 hover:underline'}`}
                                            disabled={invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.DRAFT}
                                            title={invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.DRAFT ? "Cannot send reminder" : "Send payment reminder"}
                                        >
                                            Remind
                                        </button>
                                        <button onClick={() => handleOpenHistoryModal(invoice)} className="font-medium text-purple-600 hover:underline">Payments</button>
                                        <button onClick={() => handleDeleteRequest(invoice)} className="font-medium text-red-600 hover:underline">Delete</button>
                                      </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                    {filteredAndSortedInvoices.length === 0 && <p className="text-center text-gray-500 py-4">No invoices match the current filters.</p>}
                </div>
            </div>
        </div>
    );
};

export default Invoices;