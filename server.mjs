import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { GoogleGenAI } from "@google/genai";

// --- DATABASE SETUP ---
const adapter = new JSONFile('db.json');
const defaultData = { projects: [], invoices: [], employees: [], transactions: [] };
const db = new Low(adapter, defaultData);
await db.read();

// --- EXPRESS APP SETUP ---
const app = express();
app.use(cors());
app.use(express.json());

// --- UTILITY FUNCTIONS ---
const getInvoiceTotal = (invoice) => {
    const subtotal = invoice.lineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const taxAmount = subtotal * (invoice.taxRate / 100);
    return subtotal + taxAmount;
};

// --- API ENDPOINTS ---

// GET all data
app.get('/api/data', (req, res) => {
    res.json(db.data);
});

// --- TRANSACTIONS ---
app.post('/api/transactions', async (req, res) => {
    const newTransaction = { ...req.body, id: Date.now() };
    db.data.transactions.unshift(newTransaction);
    await db.write();
    res.status(201).json(newTransaction);
});

app.put('/api/transactions/:id', async (req, res) => {
    const transactionId = parseInt(req.params.id, 10);
    const updatedTransaction = req.body;
    const index = db.data.transactions.findIndex(t => t.id === transactionId);
    if (index === -1) return res.status(404).json({ message: 'Transaction not found' });
    db.data.transactions[index] = updatedTransaction;
    await db.write();
    res.json(updatedTransaction);
});

app.delete('/api/transactions/:id', async (req, res) => {
    const transactionId = parseInt(req.params.id, 10);
    const initialLength = db.data.transactions.length;
    db.data.transactions = db.data.transactions.filter(t => t.id !== transactionId);
    if (db.data.transactions.length === initialLength) return res.status(404).json({ message: 'Transaction not found' });
    await db.write();
    res.json(db.data);
});

// --- EMPLOYEES ---
app.post('/api/employees', async (req, res) => {
    const newEmployee = { ...req.body, id: Date.now() };
    db.data.employees.unshift(newEmployee);
    await db.write();
    res.status(201).json(newEmployee);
});

app.put('/api/employees/:id', async (req, res) => {
    const employeeId = parseInt(req.params.id, 10);
    const updatedEmployee = req.body;
    const index = db.data.employees.findIndex(e => e.id === employeeId);
    if (index === -1) return res.status(404).json({ message: 'Employee not found' });
    db.data.employees[index] = updatedEmployee;
    await db.write();
    res.json(updatedEmployee);
});

app.delete('/api/employees/:id', async (req, res) => {
    const employeeId = parseInt(req.params.id, 10);
    
    const employeeExists = db.data.employees.some(e => e.id === employeeId);
    if (!employeeExists) {
        return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Remove employee from any projects
    db.data.projects.forEach(p => {
        const initialStaffCount = p.staff.length;
        p.staff = p.staff.filter(s => s.employeeId !== employeeId);
        if (p.staff.length < initialStaffCount) {
             // Also remove their transaction
             const staffSourceId = `staff-${p.id}-${employeeId}`;
             db.data.transactions = db.data.transactions.filter(t => t.sourceId !== staffSourceId);
        }
    });

    // Delete employee
    db.data.employees = db.data.employees.filter(emp => emp.id !== employeeId);
    
    await db.write();
    // Return the entire updated database state to the client
    res.json(db.data);
});


// --- INVOICES ---
app.post('/api/invoices', async (req, res) => {
    const newInvoice = { ...req.body, id: `inv-${Date.now()}`};
    
    // Logic from frontend handler
    const totalAmount = getInvoiceTotal(newInvoice);
    const depositAmount = totalAmount * 0.75;
    if (newInvoice.invoiceType === 'Proforma Invoice' && (newInvoice.status === 'Sent' || newInvoice.status === 'Partially Paid') && newInvoice.amountPaid >= depositAmount && newInvoice.amountPaid < totalAmount) {
        newInvoice.status = 'Awaiting Final Payment';
    }
    if (newInvoice.status === 'Paid') {
        newInvoice.amountPaid = totalAmount;
    }

    db.data.invoices.unshift(newInvoice);

    // Update Project amountReceived and status
    if (newInvoice.projectId) {
        const projectIndex = db.data.projects.findIndex(p => p.id === newInvoice.projectId);
        if (projectIndex !== -1) {
             const totalPaidForProject = db.data.invoices
                .filter(inv => inv.projectId === newInvoice.projectId)
                .reduce((sum, inv) => sum + inv.amountPaid, 0);
            
            db.data.projects[projectIndex].amountReceived = totalPaidForProject;

            if (db.data.projects[projectIndex].status === 'Planned' && totalPaidForProject > 0) {
                 db.data.projects[projectIndex].status = 'In Progress';
            }
             if (db.data.projects[projectIndex].status === 'In Progress' && db.data.projects[projectIndex].totalBudget > 0 && totalPaidForProject >= db.data.projects[projectIndex].totalBudget) {
                db.data.projects[projectIndex].status = 'Completed';
            }
        }
    }

    // Create Transaction
    if (newInvoice.amountPaid > 0) {
        db.data.transactions = db.data.transactions.filter(t => t.sourceId !== newInvoice.id);
        db.data.transactions.unshift({
            id: Date.now(),
            date: newInvoice.date,
            description: `Payment for Invoice #${newInvoice.invoiceNumber}`,
            category: 'Client Payment',
            type: 'Income',
            amount: newInvoice.amountPaid,
            sourceId: newInvoice.id,
            isReadOnly: true,
        });
    }

    await db.write();
    res.status(201).json({ invoice: newInvoice, projects: db.data.projects, transactions: db.data.transactions });
});

app.put('/api/invoices/:id', async (req, res) => {
    const invoiceId = req.params.id;
    const updatedInvoice = req.body;
    const index = db.data.invoices.findIndex(inv => inv.id === invoiceId);
    if (index === -1) return res.status(404).json({ message: 'Invoice not found' });
    
    const oldInvoice = db.data.invoices[index];

    // Logic from frontend handler
    const totalAmount = getInvoiceTotal(updatedInvoice);
    const depositAmount = totalAmount * 0.75;
    if (updatedInvoice.invoiceType === 'Proforma Invoice' && (updatedInvoice.status === 'Sent' || updatedInvoice.status === 'Partially Paid') && updatedInvoice.amountPaid >= depositAmount && updatedInvoice.amountPaid < totalAmount) {
        updatedInvoice.status = 'Awaiting Final Payment';
    }
     if (updatedInvoice.status === 'Paid') {
        updatedInvoice.amountPaid = totalAmount;
    }
    
    db.data.invoices[index] = updatedInvoice;
    
    // Update linked projects
    const projectIdsToUpdate = new Set();
    if (updatedInvoice.projectId) projectIdsToUpdate.add(updatedInvoice.projectId);
    if (oldInvoice.projectId) projectIdsToUpdate.add(oldInvoice.projectId);

    projectIdsToUpdate.forEach(projectId => {
        const projectIndex = db.data.projects.findIndex(p => p.id === projectId);
        if (projectIndex !== -1) {
            const totalPaidForProject = db.data.invoices
                .filter(inv => inv.projectId === projectId)
                .reduce((sum, inv) => sum + inv.amountPaid, 0);
                
            db.data.projects[projectIndex].amountReceived = totalPaidForProject;

            if (db.data.projects[projectIndex].status === 'Planned' && totalPaidForProject > 0) {
                 db.data.projects[projectIndex].status = 'In Progress';
            }
            if (db.data.projects[projectIndex].status === 'In Progress' && db.data.projects[projectIndex].totalBudget > 0 && totalPaidForProject >= db.data.projects[projectIndex].totalBudget) {
                db.data.projects[projectIndex].status = 'Completed';
            }
        }
    });

    // Update transaction
    db.data.transactions = db.data.transactions.filter(t => t.sourceId !== invoiceId);
    if (updatedInvoice.amountPaid > 0) {
        db.data.transactions.unshift({
            id: Date.now(),
            date: updatedInvoice.date,
            description: `Payment for Invoice #${updatedInvoice.invoiceNumber}`,
            category: 'Client Payment',
            type: 'Income',
            amount: updatedInvoice.amountPaid,
            sourceId: updatedInvoice.id,
            isReadOnly: true,
        });
    }

    await db.write();
    res.json({ invoice: updatedInvoice, projects: db.data.projects, transactions: db.data.transactions });
});

app.delete('/api/invoices/:id', async (req, res) => {
    const invoiceId = req.params.id;
    const invoiceToDelete = db.data.invoices.find(inv => inv.id === invoiceId);
    if (!invoiceToDelete) return res.status(404).json({ message: 'Invoice not found' });

    db.data.invoices = db.data.invoices.filter(inv => inv.id !== invoiceId);
    
    // Update project if linked
    if (invoiceToDelete.projectId) {
        const projectIndex = db.data.projects.findIndex(p => p.id === invoiceToDelete.projectId);
        if (projectIndex !== -1) {
             const totalPaid = db.data.invoices
                .filter(inv => inv.projectId === invoiceToDelete.projectId)
                .reduce((sum, inv) => sum + inv.amountPaid, 0);
            db.data.projects[projectIndex].amountReceived = totalPaid;
        }
    }
    // Delete transaction
    db.data.transactions = db.data.transactions.filter(t => t.sourceId !== invoiceId);

    await db.write();
    res.json(db.data);
});

// --- PROJECTS ---
app.post('/api/projects', async (req, res) => {
    const newProject = { ...req.body, id: `proj-${Date.now()}` };
    db.data.projects.unshift(newProject);
    await db.write();
    res.status(201).json(newProject);
});

app.put('/api/projects/:id', async (req, res) => {
    const projectId = req.params.id;
    const updatedProject = req.body;
    const index = db.data.projects.findIndex(p => p.id === projectId);
    if (index === -1) return res.status(404).json({ message: 'Project not found' });

    const originalProject = db.data.projects[index];

    // --- Transaction Management Logic ---
    let transactionsCopy = [...db.data.transactions];

    const manageTransaction = (item, type) => {
        const sourceId = item.id;
        const description = `${type}: ${item.description} for project ${updatedProject.name}`;
        const amount = item.amount;
        
        const existingTxIndex = transactionsCopy.findIndex(t => t.sourceId === sourceId);

        if (existingTxIndex !== -1) {
            // Update existing transaction
            transactionsCopy[existingTxIndex] = { ...transactionsCopy[existingTxIndex], amount, description };
        } else {
            // Add new transaction
            transactionsCopy.unshift({
                id: Date.now() + Math.random(),
                date: new Date().toISOString().split('T')[0],
                description,
                category: type === 'Staff' ? 'Payroll' : 'Project Expense',
                type: 'Expense',
                amount: amount,
                sourceId: sourceId,
                isReadOnly: true,
            });
        }
    };
    
    const originalMaterialIds = new Set(originalProject.materials.map(m => m.id));
    updatedProject.materials.forEach(mat => {
        manageTransaction({ id: mat.id, description: mat.name, amount: mat.quantity * mat.unitCost }, 'Material');
    });
    const deletedMaterialIds = [...originalMaterialIds].filter(id => !updatedProject.materials.some(m => m.id === id));
    
    const getStaffSourceId = (s) => `staff-${updatedProject.id}-${s.employeeId}`;
    const originalStaffIds = new Set(originalProject.staff.map(getStaffSourceId));
    updatedProject.staff.forEach(s => {
        manageTransaction({ id: getStaffSourceId(s), description: `${s.employeeName} (${s.projectRole})`, amount: s.paymentAmount }, 'Staff');
    });
    const deletedStaffIds = [...originalStaffIds].filter(id => !updatedProject.staff.some(s => getStaffSourceId(s) === id));

    const originalExpenseIds = new Set(originalProject.otherExpenses.map(e => e.id));
    updatedProject.otherExpenses.forEach(exp => {
        manageTransaction({ id: exp.id, description: exp.description, amount: exp.amount }, 'Expense');
    });
    const deletedExpenseIds = [...originalExpenseIds].filter(id => !updatedProject.otherExpenses.some(e => e.id === id));

    const allDeletedIds = new Set([...deletedMaterialIds, ...deletedStaffIds, ...deletedExpenseIds]);
    db.data.transactions = transactionsCopy.filter(t => !allDeletedIds.has(t.sourceId));
    // --- End Transaction Logic ---

    db.data.projects[index] = updatedProject;

    await db.write();
    res.json({ project: updatedProject, transactions: db.data.transactions });
});

app.delete('/api/projects/:id', async (req, res) => {
    const projectId = req.params.id;
    const projectToDelete = db.data.projects.find(p => p.id === projectId);
    if (!projectToDelete) return res.status(404).json({ message: 'Project not found' });
    
    const sourceIdsToDelete = new Set();
    projectToDelete.materials.forEach(m => sourceIdsToDelete.add(m.id));
    projectToDelete.staff.forEach(s => sourceIdsToDelete.add(`staff-${projectId}-${s.employeeId}`));
    projectToDelete.otherExpenses.forEach(e => sourceIdsToDelete.add(e.id));
    
    db.data.transactions = db.data.transactions.filter(t => !sourceIdsToDelete.has(t.sourceId));
    db.data.projects = db.data.projects.filter(p => p.id !== projectId);
    db.data.invoices.forEach(invoice => {
        if (invoice.projectId === projectId) {
            invoice.projectId = undefined;
            invoice.projectName = undefined;
        }
    });
    
    await db.write();
    res.json(db.data);
});


// --- AI SUMMARY ---
app.post('/api/financial-summary', async (req, res) => {
    const { transactions } = req.body;

    if (!process.env.API_KEY) {
        return res.status(500).json({ error: "API Key not configured on the server." });
    }
     if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
        return res.status(400).json({ error: "Transaction data is required." });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
        You are a financial analyst AI for a borehole drilling company.
        Based on the following list of financial transactions, provide a concise and insightful summary in markdown format.
        Include:
        1. **Overall Performance:** Brief statement on financial health.
        2. **Key Figures:** Total Income, Total Expenses, Net Profit/Loss.
        3. **Key Insights:** Largest expense category, primary income source.
        4. **Recommendations:** One or two brief, actionable recommendations.
        Transaction data:
        ${JSON.stringify(transactions, null, 2)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        res.json({ summary: response.text });
    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: "Failed to generate AI summary." });
    }
});


// --- SERVER START ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});