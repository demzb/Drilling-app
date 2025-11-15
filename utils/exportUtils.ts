import { Invoice, InvoiceType, InvoiceStatus, Payment, Project, FinancialReportItem, ProjectProfitabilityReportItem, InvoiceReportItem } from '../types';
import { numberToWords } from './numberToWords';
import { getInvoiceTotal, getInvoiceTotalPaid } from './invoiceUtils';

// --- Generic Export Helpers ---

const escapeCsvCell = (cellData: any): string => {
    const stringData = String(cellData ?? '');
    if (stringData.includes(',') || stringData.includes('"') || stringData.includes('\n')) {
        return `"${stringData.replace(/"/g, '""')}"`;
    }
    return stringData;
};

const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// --- Report Exporters ---
export const exportReportAsCsv = (headers: string[], data: any[], fileName: string) => {
    const rows = data.map(item => headers.map(header => {
        // Convert header to camelCase to match object keys
        const key = header.replace(/\s+/g, ' ').replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => index === 0 ? word.toLowerCase() : word.toUpperCase()).replace(/\s/g, '');
        return escapeCsvCell(item[key]);
    }).join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadFile(csvContent, fileName, 'text/csv;charset=utf-8;');
};

const generateReportHtml = (title: string, headers: string[], data: any[]): string => {
    const headerHtml = headers.map(h => `<th style="padding: 8px; border: 1px solid #ddd; text-align: left; background-color: #f2f2f2;">${h}</th>`).join('');
    const bodyHtml = data.map(item => {
        const rowHtml = headers.map(header => {
            const key = header.replace(/\s+/g, ' ').replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => index === 0 ? word.toLowerCase() : word.toUpperCase()).replace(/\s/g, '');
            const isNumeric = typeof item[key] === 'number';
            return `<td style="padding: 8px; border: 1px solid #ddd; text-align: ${isNumeric ? 'right' : 'left'};">${isNumeric ? (item[key] as number).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : (item[key] ?? '')}</td>`;
        }).join('');
        return `<tr>${rowHtml}</tr>`;
    }).join('');

    return `
        <div style="font-family: Arial, sans-serif;">
            <h1 style="text-align: center;">${title}</h1>
            <p style="text-align: center; color: #555; font-size: 12px;">Generated on: ${new Date().toLocaleDateString()}</p>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>${headerHtml}</tr>
                </thead>
                <tbody>
                    ${bodyHtml}
                </tbody>
            </table>
        </div>
    `;
};

export const exportReportAsWord = (title: string, headers: string[], data: any[], fileName: string) => {
    const htmlContent = generateReportHtml(title, headers, data);
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
            "xmlns:w='urn:schemas-microsoft-com:office:word' "+
            "xmlns='http://www.w3.org/TR/REC-html40'>"+
            "<head><meta charset='utf-8'><title>Export</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + htmlContent + footer;
    downloadFile(sourceHTML, fileName, 'application/vnd.ms-word');
};

export const printReport = (title: string, headers: string[], data: any[]) => {
    const htmlContent = generateReportHtml(title, headers, data);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`<html><head><title>${title}</title></head><body>${htmlContent}</body></html>`);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }
};

// --- Specific Document Generators (Invoices, Receipts) ---

export const generateInvoiceWordHtml = (invoice: Invoice): string => {
  const subtotal = invoice.line_items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const discount = invoice.discount_amount || 0;
  const discountedSubtotal = subtotal - discount;
  const taxAmount = discountedSubtotal * (invoice.tax_rate / 100);
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

  const lineItemsHtml = invoice.line_items.map(item => `
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
              <p style="margin: 0; color: #555;">${invoice.invoice_number}</p>
              ${invoice.project_name ? `<p style="margin-top: 5px; font-weight: bold; color: #2563EB;">Project: ${invoice.project_name}</p>` : ''}
              ${invoice.borehole_type ? `<p style="margin-top: 5px; color: #555;">${invoice.borehole_type}</p>` : ''}
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
              <p style="font-weight: bold; margin: 0;">${invoice.client_name}</p>
              <p style="margin: 0; white-space: pre-line;">${invoice.client_address}</p>
            </td>
            <td style="width: 50%; text-align: right; vertical-align: top;">
              <p style="margin: 0;"><span style="font-weight: bold;">Invoice Date:</span> ${invoice.date}</p>
              <p style="margin: 0;"><span style="font-weight: bold;">Due Date:</span> ${invoice.due_date}</p>
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
              <span style="${styles.totalLabel}">Tax (${invoice.tax_rate}%):</span>
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
    <div style="font-family: Arial, sans-serif; color: #333; font-size: 12px; max-width: 800px; margin: auto; padding: 20px;">
      
      <!-- Header -->
      <table style="width: 100%; border-collapse: collapse; border-bottom: 1px solid #ccc; padding-bottom: 20px;">
        <tr>
          <td style="width: 66%; vertical-align: top;">
            <h2 style="font-size: 18px; font-weight: bold; color: #2563EB; text-transform: uppercase; margin: 0;">YS BOREHOLE DRILLING COMPANY</h2>
            <p style="font-size: 10px; margin: 0;">Deals in borehole drilling solar installation, plumbing and electrical specialist</p>
            <p style="font-size: 10px; color: #555; margin: 8px 0 0 0;">Brusubi the Gambia west Africa</p>
            <p style="font-size: 10px; color: #555; margin: 0;">Tel: +2203522014/7770568/2030995</p>
            <p style="font-size: 10px; color: #555; margin: 0;">Email: yusuphasambou1234@gmail.com</p>
          </td>
          <td style="width: 34%; text-align: right; vertical-align: top;">
            <h1 style="font-size: 28px; font-weight: bold; text-transform: uppercase; margin: 0;">Receipt</h1>
            <p style="margin: 5px 0 0 0;"><span style="font-weight: bold; color: #555; font-size: 11px;">Receipt No:</span> ${payment.id}</p>
            <p style="margin: 0;"><span style="font-weight: bold; color: #555; font-size: 11px;">Date:</span> ${payment.date}</p>
          </td>
        </tr>
      </table>

      <!-- Client & Payment Details -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; padding-top: 20px;">
        <tr>
          <td style="width: 50%; vertical-align: top;">
            <h3 style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #555; margin: 0 0 5px 0;">Bill To</h3>
            <p style="font-weight: bold; margin: 0;">${invoice.client_name}</p>
            <p style="margin: 0; white-space: pre-line;">${invoice.client_address}</p>
          </td>
          <td style="width: 50%; text-align: right; vertical-align: top;">
            <h3 style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #555; margin: 0 0 5px 0;">Payment Details</h3>
            <p style="margin: 0;"><span style="font-weight: bold; color: #555; font-size: 11px;">Payment Method:</span> ${payment.method}</p>
            ${payment.checkNumber ? `<p style="margin: 0;"><span style="font-weight: bold; color: #555; font-size: 11px;">Check Number:</span> ${payment.checkNumber}</p>` : ''}
          </td>
        </tr>
      </table>

      <!-- Amount Paid -->
      <div style="margin-top: 30px; text-align: center; background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 5px;">
        <h3 style="margin: 0; font-size: 12px; font-weight: bold; text-transform: uppercase; color: #555; letter-spacing: 0.5px;">Amount Paid</h3>
        <p style="margin: 5px 0 0 0; font-size: 36px; font-weight: bold; color: #16a34a;">
          GMD ${payment.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
        </p>
        <p style="margin: 5px 0 0 0; text-transform: capitalize; color: #333;">${numberToWords(payment.amount)}</p>
      </div>
      
      <!-- Payment Summary -->
      <div style="margin-top: 30px;">
        <h3 style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 10px;">Payment Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="background-color: #f9f9f9; padding: 10px; border-bottom: 2px solid #ddd; text-align: left;">Summary</th>
              <th style="background-color: #f9f9f9; padding: 10px; border-bottom: 2px solid #ddd; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">Invoice Total</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">GMD ${totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">Payment Received</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #16a34a;">GMD ${payment.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
            </tr>
            <tr style="background-color: #f9f9f9; font-weight: bold;">
              <td style="padding: 10px;">Balance Due</td>
              <td style="padding: 10px; text-align: right;">GMD ${balanceDue.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
            </tr>
          </tbody>
        </table>
        <p style="font-size: 10px; color: #555; margin-top: 8px;">Payment applied to Invoice #${invoice.invoice_number}.</p>
      </div>

      <!-- Footer -->
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 11px;">
          <p style="font-weight: bold;">Thank you for your payment!</p>
          <p style="color: #555; margin-top: 5px;">If you have any questions, please contact us at +220 7770568 or yusuphasambou1234@gmail.com</p>
      </div>
    </div>
  `;
};

export const exportProjectsToCSV = (projects: Project[]) => {
    const headers = [
        'ID', 'Name', 'Client', 'Location', 'Start Date', 'End Date',
        'Status', 'Borehole Type', 'Total Budget', 'Amount Received'
    ];

    const rows = projects.map(p => [
        p.id, p.name, p.client_name, p.location, p.start_date, p.end_date || 'N/A',
        p.status, p.borehole_type || 'N/A', p.total_budget, p.amount_received
    ].map(escapeCsvCell).join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadFile(csvContent, 'projects_export.csv', 'text/csv;charset=utf-8;');
};

export const printProjectsList = (projects: Project[]) => {
    const tableRows = projects.map(p => `
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${p.name}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${p.client_name}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${p.status}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">GMD ${p.total_budget.toLocaleString()}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">GMD ${p.amount_received.toLocaleString()}</td>
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

    const addSection = (title: string, headers: string[], data: (string | number)[][]) => {
        csvContent += `\n${title}\n`;
        csvContent += headers.join(',') + '\n';
        data.forEach(row => {
            csvContent += row.map(escapeCsvCell).join(',') + '\n';
        });
    };

    // Section 1: Project Summary
    const summaryData = [
        ['Project Name', project.name],
        ['Client Name', project.client_name],
        ['Location', project.location],
        ['Start Date', project.start_date],
        ['End Date', project.end_date || 'N/A'],
        ['Status', project.status],
        ['Borehole Type', project.borehole_type || 'N/A'],
    ];
    csvContent += 'Project Summary\n';
    summaryData.forEach(row => {
        csvContent += row.map(escapeCsvCell).join(',') + '\n';
    });

    // Section 2: Financials
    const totalMaterialCost = project.materials.reduce((acc, mat) => acc + (mat.quantity * mat.unitCost), 0);
    const totalStaffCost = project.staff.reduce((acc, s) => acc + s.paymentAmount, 0);
    const totalOtherCost = project.other_expenses.reduce((acc, exp) => acc + exp.amount, 0);
    const totalProjectCost = totalMaterialCost + totalStaffCost + totalOtherCost;
    const netProfit = project.amount_received - totalProjectCost;
    
    const financialData = [
        ['Total Budget', project.total_budget],
        ['Amount Received', project.amount_received],
        ['Total Material Cost', totalMaterialCost],
        ['Total Staff Cost', totalStaffCost],
        ['Total Other Cost', totalOtherCost],
        ['Total Project Cost', totalProjectCost],
        ['Net Profit/Loss', netProfit],
    ];
    csvContent += '\nFinancial Summary\n';
    financialData.forEach(row => {
        csvContent += row.map(escapeCsvCell).join(',') + '\n';
    });

    // Section 3: Materials
    if (project.materials.length > 0) {
        addSection(
            'Materials',
            ['Name', 'Quantity', 'Unit Cost', 'Total Cost'],
            project.materials.map(mat => [
                mat.name,
                mat.quantity,
                mat.unitCost,
                mat.quantity * mat.unitCost
            ])
        );
    }

    // Section 4: Staff
    if (project.staff.length > 0) {
        addSection(
            'Assigned Staff',
            ['Name', 'Role', 'Payment'],
            project.staff.map(s => [
                s.employeeName,
                s.projectRole,
                s.paymentAmount
            ])
        );
    }

    // Section 5: Other Expenses
    if (project.other_expenses.length > 0) {
        addSection(
            'Other Expenses',
            ['Description', 'Amount'],
            project.other_expenses.map(exp => [
                exp.description,
                exp.amount
            ])
        );
    }

    downloadFile(csvContent, `project_${project.id}_details.csv`, 'text/csv;charset=utf-8;');
};