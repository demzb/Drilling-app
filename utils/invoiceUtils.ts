import { Invoice } from '../types';

// Fix: Changed properties to snake_case to match the Invoice type.
export const getInvoiceTotal = (invoice: Pick<Invoice, 'line_items' | 'tax_rate' | 'discount_amount'>): number => {
    // Fix: Changed property to snake_case.
    const subtotal = invoice.line_items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    // Fix: Changed property to snake_case.
    const discountedSubtotal = subtotal - (invoice.discount_amount || 0);
    // Fix: Changed property to snake_case.
    const taxAmount = discountedSubtotal * (invoice.tax_rate / 100);
    return discountedSubtotal + taxAmount;
};

export const getInvoiceTotalPaid = (invoice: Invoice): number => {
    if (!invoice.payments) return 0;
    return invoice.payments.reduce((acc, payment) => acc + payment.amount, 0);
};