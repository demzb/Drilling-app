import { Invoice, InvoiceType, InvoiceStatus, Payment, Project } from '../types';
import { numberToWords } from './numberToWords';
import { getInvoiceTotal, getInvoiceTotalPaid } from './invoiceUtils';


export const generateInvoiceWordHtml = (invoice: Invoice): string => {
  const subtotal = invoice.lineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const discount = invoice.discountAmount || 0;
  const discountedSubtotal = subtotal - discount;
  const taxAmount = discountedSubtotal * (invoice.taxRate / 100);
  const totalAmount = getInvoiceTotal(invoice);
  const totalPaid = getInvoiceTotalPaid(invoice);
  const totalBalanceDue = totalAmount - totalPaid;

  const amountDueLabel = "Balance Due:";
  const amountDueValue = totalBalanceDue;

  const styles = {
    body: `font-family: Arial, sans-serif; color: #333; font-size: 12px;`,
    container: `width: 100%; max-width: 800px; margin: 0 auto;`,
    headerTable: `width: 100%; border-collapse: collapse;`,
    headerCellLeft: `text-align: left; vertical-align: top;`,
    headerCellRight: `text-align: right; vertical-align: top;`,
    clientTable: `width: 100%; border-collapse: collapse; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;`,
    itemsTable: `width: 100%; border-collapse: collapse; margin-top: 30px;`,
    th: `background-color: #f9f9f9; padding: 10px; border-bottom: 2px solid #ddd; text-align: left; font-weight: bold;`,
    td: `padding: 10px; border-bottom: 1px solid #eee;`,
    totalsContainer: `margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;`,
    totalsLeft: `width: 50%; float: left;`,
    totalsRight: `width: 45%; float: right;`,
    totalRow: `display: block; clear: both; margin-bottom: 5px;`,
    totalLabel: `float: left; width: 60%; text-align: right; padding-right: 10px;`,
    totalValue: `float: right; width: 40%; text-align: right; font-weight: bold;`,
    footer: `margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 10px; color: #777;`
  };

  const lineItemsHtml = invoice.lineItems.map(item => `
    <tr>
      <td style="${styles.td}">${item.description}</td>
      <td style="${styles.td} text-align: center;">${item.quantity}</td>
      <td style="${styles.td} text-align: right;">GMD ${item.unitPrice.toFixed(2)}</td>
      <td style="${styles.td} text-align: right; font-weight: bold;">GMD ${(item.quantity * item.unitPrice).toFixed(2)}</td>
    </tr>
  `).join('');
  
  return `
    <div style="${styles.body}">
      <div style="${styles.container}">
        <table style="${styles.headerTable}">
          <tr>
            <td style="${styles.headerCellLeft}">
              <h1 style="font-size: 28px; margin: 0; color: #000;">Invoice</h1>
              <p style="margin: 0; color: #555;">${invoice.invoiceNumber}</p>
              ${invoice.projectName ? `<p style="margin-top: 5px; font-weight: bold; color: #2563EB;">Project: ${invoice.projectName}</p>` : ''}
              ${invoice.boreholeType ? `<p style="margin-top: 5px; color: #555;">${invoice.boreholeType}</p>` : ''}
            </td>
            <td style="${styles.headerCellRight}">
              <h2 style="font-size: 18px; margin: 0; color: #2563EB; text-transform: uppercase;">YS BOREHOLE DRILLING COMPANY</h2>
              <p style="margin: 0; font-size: 10px;">Deals in borehole drilling solar installation, plumbing and electrical specialist</p>
              <p style="margin: 5px 0 0 0; font-size: 10px;">Brusubi the Gambia west Africa</p>
              <p style="margin: 0; font-size: 10px;">Tel: +2203522014/7770568/2030995</p>
              <p style="margin: 0; font-size: 10px;">Email: yusuphasambou1234@gmail.com</p>
            </td>
          </tr>
        </table>

        <table style="${styles.clientTable}">
          <tr>
            <td style="width: 50%; vertical-align: top;">
              <h3 style="font-size: 11px; text-transform: uppercase; color: #555; margin: 0 0 5px 0;">Bill To</h3>
              <p style="font-weight: bold; margin: 0;">${invoice.clientName}</p>
              <p style="margin: 0; white-space: pre-line;">${invoice.clientAddress}</p>
            </td>
            <td style="width: 50%; text-align: right; vertical-align: top;">
              <p style="margin: 0;"><span style="font-weight: bold;">Invoice Date:</span> ${invoice.date}</p>
              <p style="margin: 0;"><span style="font-weight: bold;">Due Date:</span> ${invoice.dueDate}</p>
            </td>
          </tr>
        </table>
        
        <table style="${styles.itemsTable}">
          <thead>
            <tr>
              <th style="${styles.th}">Description</th>
              <th style="${styles.th} text-align: center;">Qty</th>
              <th style="${styles.th} text-align: right;">Unit Price</th>
              <th style="${styles.th} text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${lineItemsHtml}
          </tbody>
        </table>

        <div style="${styles.totalsContainer}">
          <div style="${styles.totalsLeft}">
             <h4 style="font-size: 11px; text-transform: uppercase; margin: 0 0 10px 0;">Notes</h4>
             <p style="font-size: 10px; color: #555;">${invoice.notes}</p>
            <div style="margin-top: 15px;">
              <p style="font-weight: bold; margin: 0;">Amount in Words:</p>
              <p style="font-size: 10px; color: #555; text-transform: capitalize; margin: 0;">${numberToWords(amountDueValue)}</p>
            </div>
          </div>
          <div style="${styles.totalsRight}">
            <div style="${styles.totalRow}">
              <span style="${styles.totalLabel}">Subtotal:</span>
              <span style="${styles.totalValue}">GMD ${subtotal.toFixed(2)}</span>
            </div>
            ${discount > 0 ? `
              <div style="${styles.totalRow}">
                <span style="${styles.totalLabel}">Discount:</span>
                <span style="${styles.totalValue}; color: #22c55e;">- GMD ${discount.toFixed(2)}</span>
              </div>
            ` : ''}
            <div style="${styles.totalRow}">
              <span style="${styles.totalLabel}">Tax (${invoice.taxRate}%):</span>
              <span style="${styles.totalValue}">GMD ${taxAmount.toFixed(2)}</span>
            </div>
            <div style="${styles.totalRow}; margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
              <span style="${styles.totalLabel}; font-weight: bold;">Total:</span>
              <span style="${styles.totalValue};">GMD ${totalAmount.toFixed(2)}</span>
            </div>
            <div style="${styles.totalRow}">
              <span style="${styles.totalLabel}">Amount Paid:</span>
              <span style="${styles.totalValue}; color: #22c55e;">- GMD ${totalPaid.toFixed(2)}</span>
            </div>
            <div style="${styles.totalRow}; background-color: #f2f2f2; padding: 10px; margin-top: 10px; font-size: 16px;">
              <span style="${styles.totalLabel};">${amountDueLabel}</span>
              <span style="${styles.totalValue};">${amountDueValue.toFixed(2)}</span>
            </div>
          </div>
          <div style="clear: both;"></div>
        </div>

        <div style="${styles.footer}">
          <p>Thank you for your business. Please make payment to the specified account.</p>
        </div>
      </div>
    </div>
  `;
};

export const generateReceiptHtml = (invoice: Invoice, payment: Payment): string => {
  const totalAmount = getInvoiceTotal(invoice);
  const totalPaidAfterThisPayment = invoice.payments
    .filter(p => new Date(p.date) <= new Date(payment.date))
    .reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = totalAmount - totalPaidAfterThisPayment;

  return `
    <div style="font-family: Arial, sans-serif; color: #333; font-size: 12px; max-width: 800px; margin: auto;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="vertical-align: top;">
            <h1 style="font-size: 28px; margin: 0; color: #000;">Payment Receipt</h1>
            <p style="margin: 0; color: #555;">Receipt ID: ${payment.id}</p>
          </td>
          <td style="text-align: right; vertical-align: top;">
              <h2 style="font-size: 18px; margin: 0; color: #2563EB; text-transform: uppercase;">YS BOREHOLE DRILLING COMPANY</h2>
              <p style="margin: 0; font-size: 10px;">Brusubi the Gambia west Africa</p>
              <p style="margin: 0; font-size: 10px;">Tel: +2203522014/7770568/2030995</p>
          </td>
        </tr>
      </table>

      <table style="width: 100%; border-collapse: collapse; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
          <tr>
            <td style="width: 50%; vertical-align: top;">
              <h3 style="font-size: 11px; text-transform: uppercase; color: #555; margin: 0 0 5px 0;">Received From</h3>
              <p style="font-weight: bold; margin: 0;">${invoice.clientName}</p>
              <p style="margin: 0; white-space: pre-line;">${invoice.clientAddress}</p>
            </td>
            <td style="width: 50%; text-align: right; vertical-align: top;">
              <p style="margin: 0;"><span style="font-weight: bold;">Payment Date:</span> ${payment.date}</p>
              <p style="margin: 0;"><span style="font-weight: bold;">Payment Method:</span> ${payment.method}</p>
              ${payment.checkNumber ? `<p style="margin: 0;"><span style="font-weight: bold;">Check Number:</span> ${payment.checkNumber}</p>` : ''}
            </td>
          </tr>
      </table>

      <div style="margin-top: 30px; text-align: center; background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
        <h3 style="margin: 0; font-size: 14px; text-transform: uppercase; color: #555;">Amount Received</h3>
        <p style="margin: 5px 0 0 0; font-size: 36px; font-weight: bold; color: #16a34a;">
          GMD ${payment.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
        </p>
        <p style="margin: 5px 0 0 0; text-transform: capitalize;">${numberToWords(payment.amount)}</p>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 30px;">
          <thead>
              <tr>
                  <th style="background-color: #f9f9f9; padding: 10px; border-bottom: 2px solid #ddd; text-align: left;">Description</th>
                  <th style="background-color: #f9f9f9; padding: 10px; border-bottom: 2px solid #ddd; text-align: right;">Invoice Total</th>
                  <th style="background-color: #f9f9f9; padding: 10px; border-bottom: 2px solid #ddd; text-align: right;">Balance Due</th>
              </tr>
          </thead>
          <tbody>
              <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;">
                      Invoice: ${invoice.invoiceNumber}<br/>
                      ${invoice.projectName ? `<span style="font-size: 11px; color: #555;">Project: ${invoice.projectName}</span>` : ''}
                  </td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">GMD ${totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">GMD ${balanceDue.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              </tr>
          </tbody>
      </table>

      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
          <p style="font-size: 12px; font-weight: bold;">Thank You!</p>
      </div>
    </div>
  `;
};

const escapeCsvCell = (cellData: any): string => {
    const stringData = String(cellData ?? '');
    if (stringData.includes(',') || stringData.includes('"') || stringData.includes('\n')) {
        return `"${stringData.replace(/"/g, '""')}"`;
    }
    return stringData;
};

export const exportProjectsToCSV = (projects: Project[]) => {
    const headers = [
        'ID', 'Name', 'Client', 'Location', 'Start Date', 'End Date',
        'Status', 'Borehole Type', 'Total Budget', 'Amount Received'
    ];

    const rows = projects.map(p => [
        p.id, p.name, p.clientName, p.location, p.startDate, p.endDate || 'N/A',
        p.status, p.boreholeType || 'N/A', p.totalBudget, p.amountReceived
    ].map(escapeCsvCell).join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "projects_export.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const printProjectsList = (projects: Project[]) => {
    const tableRows = projects.map(p => `
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${p.name}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${p.clientName}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${p.status}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">GMD ${p.totalBudget.toLocaleString()}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">GMD ${p.amountReceived.toLocaleString()}</td>
        </tr>
    `).join('');

    const htmlContent = `
        <html>
            <head>
                <title>Projects List</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    table { width: 100%; border-collapse: collapse; }
                    h1 { text-align: center; }
                </style>
            </head>
            <body>
                <h1>Projects List</h1>
                <table>
                    <thead>
                        <tr>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left; background-color: #f2f2f2;">Project Name</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left; background-color: #f2f2f2;">Client</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left; background-color: #f2f2f2;">Status</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: right; background-color: #f2f2f2;">Budget</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: right; background-color: #f2f2f2;">Received</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }
};

export const exportProjectDetailToCSV = (project: Project) => {
    let csvContent = '';

    const addSection = (title: string, headers: string[], data: string[][]) => {
        csvContent += `\n${title}\n`;
        csvContent += headers.join(',') + '\n';
        data.forEach(row => {
            csvContent += row.map(escapeCsvCell).join(',') + '\n';
        });
    };

    // Section 1: Project Summary
    const summaryData = [
        ['Project Name', project.name],
        ['Client Name', project.clientName],
        ['Location', project.location],
        ['Start Date', project.startDate],
        ['End Date', project.endDate || 'N/A'],
        ['Status', project.status],
        ['Borehole Type', project.boreholeType || 'N/A'],
    ];
    csvContent += 'Project Summary\n';
    summaryData.forEach(row => {
        csvContent += row.map(escapeCsvCell).join(',') + '\n';
    });

    // Section 2: Financials
    const totalMaterialCost = project.materials.reduce((acc, mat) => acc + (mat.quantity * mat.unitCost), 0);
    const totalStaffCost = project.staff.reduce((acc, s) => acc + s.paymentAmount, 0);
    const totalOtherCost = project.otherExpenses.reduce((acc, exp) => acc + exp.amount, 0);
    const totalProjectCost = totalMaterialCost + totalStaffCost + totalOtherCost;
    const netProfit = project.amountReceived - totalProjectCost;