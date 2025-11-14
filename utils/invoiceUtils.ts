import { Invoice } from '../types';

export const getInvoiceTotal = (invoice: Pick<Invoice, 'lineItems' | 'taxRate' | 'discountAmount'>): number => {
    const subtotal = invoice.lineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const discountedSubtotal = subtotal - (invoice.discountAmount || 0);
    const taxAmount = discountedSubtotal * (invoice.taxRate / 100);
    return discountedSubtotal + taxAmount;
};

export const getInvoiceTotalPaid = (invoice: Invoice): number => {
    if (!invoice.payments) return 0;
    return invoice.payments.reduce((acc, payment) => acc + payment.amount, 0);
};