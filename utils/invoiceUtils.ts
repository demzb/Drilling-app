import { Invoice } from '../types';

export const getInvoiceTotal = (invoice: Pick<Invoice, 'line_items' | 'tax_rate' | 'discount_amount'>): number => {
    const subtotal = invoice.line_items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
    const discountedSubtotal = subtotal - invoice.discount_amount;
    const taxAmount = discountedSubtotal * (invoice.tax_rate / 100);
    return discountedSubtotal + taxAmount;
};

export const getInvoiceTotalPaid = (invoice: Invoice): number => {
    if (!invoice.payments) return 0;
    return invoice.payments.reduce((acc, payment) => acc + payment.amount, 0);
};