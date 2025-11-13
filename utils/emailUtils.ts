import { Invoice } from '../types';
import { getInvoiceTotal, getInvoiceTotalPaid } from './invoiceUtils';

export const generateReminderEmail = (invoice: Invoice): { subject: string; body: string } => {
  const totalAmount = getInvoiceTotal(invoice);
  const totalPaid = getInvoiceTotalPaid(invoice);
  const balanceDue = totalAmount - totalPaid;

  const subject = `Reminder: Payment for Invoice #${invoice.invoiceNumber}`;

  const body = `Dear ${invoice.clientName},

This is a friendly reminder that invoice #${invoice.invoiceNumber} is due on ${invoice.dueDate}.

Invoice Details:
- Invoice Number: ${invoice.invoiceNumber}
- Total Amount: GMD ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
- Amount Paid: GMD ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
- Balance Due: GMD ${balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}

You can make the payment via bank transfer or by visiting our office.

If you have already made the payment, please disregard this reminder. If you have any questions, feel free to contact us.

Thank you for your business.

Best regards,
YS Borehole Drilling Company
`;

  return { subject, body };
};
