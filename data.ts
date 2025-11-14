import { Project, Invoice, Employee, Transaction, ProjectStatus, EmployeeStatus, InvoiceStatus, InvoiceType, BoreholeType, TransactionType, Payment, Client, PaymentMethod } from './types';

export const initialClients: Client[] = [
    {
        id: 'client-1',
        name: 'Bijilo VDC',
        contactPerson: 'Village Alkalo',
        email: 'bijilo.vdc@gambia.gov',
        phone: '446-0001',
        address: 'Bijilo Community Center, WCR',
    },
    {
        id: 'client-2',
        name: 'Mr. Ebrima Ceesay',
        contactPerson: 'Ebrima Ceesay',
        email: 'e.ceesay@personal.com',
        phone: '778-1234',
        address: 'Kotu Layout, KMC',
    },
    {
        id: 'client-3',
        name: 'Sanyang Agricultural Co-op',
        contactPerson: 'Fatou Bojang',
        email: 'sanyang.agri@coop.gm',
        phone: '990-5555',
        address: 'Sanyang, West Coast Region',
    }
];

export const initialEmployees: Employee[] = [
    { id: 1, name: 'Yusupha Sambou', gender: 'Male', role: 'Lead Driller', email: 'yusupha@drillsoft.com', phone: '352-2014', startDate: '2020-01-15', avatarUrl: 'https://i.pravatar.cc/150?u=1', status: EmployeeStatus.ACTIVE },
    { id: 2, name: 'Fatou Jallow', gender: 'Female', role: 'Project Manager', email: 'fatou@drillsoft.com', phone: '777-0568', startDate: '2019-03-10', avatarUrl: 'https://i.pravatar.cc/150?u=2', status: EmployeeStatus.ACTIVE },
    { id: 3, name: 'Lamin Camara', gender: 'Male', role: 'Driller Assistant', email: 'lamin@drillsoft.com', phone: '203-0995', startDate: '2021-06-01', avatarUrl: 'https://i.pravatar.cc/150?u=3', status: EmployeeStatus.ACTIVE },
    { id: 4, name: 'Awa Njie', gender: 'Female', role: 'Solar Technician', email: 'awa@drillsoft.com', phone: '990-1234', startDate: '2022-02-20', avatarUrl: 'https://i.pravatar.cc/150?u=4', status: EmployeeStatus.ACTIVE },
    { id: 5, name: 'Ousman Bah', gender: 'Male', role: 'Plumber', email: 'ousman@drillsoft.com', phone: '665-5678', startDate: '2021-11-05', avatarUrl: 'https://i.pravatar.cc/150?u=5', status: EmployeeStatus.INACTIVE },
];

export const initialProjects: Project[] = [
    {
        id: 'proj-1',
        name: 'Bijilo Community Borehole',
        clientId: 'client-1',
        clientName: 'Bijilo VDC',
        location: 'Bijilo, West Coast Region',
        startDate: '2024-05-10',
        endDate: '2024-06-15',
        status: ProjectStatus.COMPLETED,
        totalBudget: 350000,
        amountReceived: 350000,
        materials: [
            { id: 'mat-1-1', name: '6" PVC Casing', quantity: 10, unitCost: 1500 },
            { id: 'mat-1-2', name: 'Gravel Pack', quantity: 20, unitCost: 250 },
            { id: 'mat-1-3', name: 'Lorentz PS2-1800 Pump', quantity: 1, unitCost: 85000 },
        ],
        staff: [
            { employeeId: 1, employeeName: 'Yusupha Sambou', projectRole: 'Lead Driller', paymentAmount: 25000 },
            { employeeId: 3, employeeName: 'Lamin Camara', projectRole: 'Assistant', paymentAmount: 15000 },
        ],
        otherExpenses: [
            { id: 'exp-1-1', description: 'Fuel for Drilling Rig', amount: 12000 },
            { id: 'exp-1-2', description: 'Geological Survey Permit', amount: 5000 },
        ],
        boreholeType: BoreholeType.SOLAR_LARGE,
    },
    {
        id: 'proj-2',
        name: 'Kotu Residence Well',
        clientId: 'client-2',
        clientName: 'Mr. Ebrima Ceesay',
        location: 'Kotu, Kanifing Municipality',
        startDate: '2024-07-01',
        status: ProjectStatus.IN_PROGRESS,
        totalBudget: 220000,
        amountReceived: 165000,
        materials: [
             { id: 'mat-2-1', name: '4" PVC Casing', quantity: 8, unitCost: 1200 },
        ],
        staff: [
             { employeeId: 1, employeeName: 'Yusupha Sambou', projectRole: 'Site Supervisor', paymentAmount: 20000 },
        ],
        otherExpenses: [],
        boreholeType: BoreholeType.ELECTRIC_MEDIUM,
    },
     {
        id: 'proj-3',
        name: 'Farm Irrigation System',
        clientId: 'client-3',
        clientName: 'Sanyang Agricultural Co-op',
        location: 'Sanyang, West Coast Region',
        startDate: '2024-08-01',
        status: ProjectStatus.PLANNED,
        totalBudget: 550000,
        amountReceived: 0,
        materials: [],
        staff: [],
        otherExpenses: [],
        boreholeType: BoreholeType.SOLAR_LARGE,
    }
];


export const initialInvoices: Invoice[] = [
    {
        id: 'inv-1',
        invoiceNumber: 'INV-2024-001',
        clientId: 'client-1',
        clientName: 'Bijilo VDC',
        clientAddress: 'Bijilo Community Center, WCR',
        date: '2024-05-05',
        dueDate: '2024-06-20',
        lineItems: [{ id: 'li-1-1', description: 'Complete Solar Borehole Installation (Large)', quantity: 1, unitPrice: 350000 }],
        notes: 'Final payment for the completed community project.',
        taxRate: 0,
        discountAmount: 0,
        status: InvoiceStatus.PAID,
        invoiceType: InvoiceType.INVOICE,
        projectId: 'proj-1',
        projectName: 'Bijilo Community Borehole',
        payments: [{id: 'pay-1', date: '2024-06-15', amount: 350000, method: PaymentMethod.BANK_TRANSFER}],
        boreholeType: BoreholeType.SOLAR_LARGE,
    },
     {
        id: 'inv-2',
        invoiceNumber: 'INV-2024-002',
        clientId: 'client-2',
        clientName: 'Mr. Ebrima Ceesay',
        clientAddress: 'Kotu Layout, KMC',
        date: '2024-06-25',
        dueDate: '2024-07-02',
        lineItems: [{ id: 'li-2-1', description: 'Electric Submersible Borehole (Medium)', quantity: 1, unitPrice: 220000 }],
        notes: '75% deposit to commence work.',
        taxRate: 0,
        discountAmount: 0,
        status: InvoiceStatus.PARTIALLY_PAID,
        invoiceType: InvoiceType.INVOICE,
        projectId: 'proj-2',
        projectName: 'Kotu Residence Well',
        payments: [{ id: 'pay-2', date: '2024-06-28', amount: 165000, method: PaymentMethod.CASH}], // 75% of 220,000
        boreholeType: BoreholeType.ELECTRIC_MEDIUM,
    }
];

// Generate transactions from projects and invoices
const autoTransactions: Transaction[] = [];

initialInvoices.forEach(inv => {
    inv.payments.forEach(payment => {
        autoTransactions.push({
            id: Date.now() + Math.random(),
            date: payment.date,
            description: `Payment for Invoice #${inv.invoiceNumber}`,
            category: 'Client Payment',
            type: TransactionType.INCOME,
            amount: payment.amount,
            sourceId: payment.id,
            isReadOnly: true,
        });
    });
});

initialProjects.forEach(proj => {
    proj.materials.forEach(mat => {
        autoTransactions.push({
            id: Date.now() + Math.random(),
            date: proj.startDate,
            description: `Material: ${mat.name} for project ${proj.name}`,
            category: 'Project Expense',
            type: TransactionType.EXPENSE,
            amount: mat.quantity * mat.unitCost,
            sourceId: mat.id,
            isReadOnly: true,
        });
    });
    proj.staff.forEach(s => {
        autoTransactions.push({
            id: Date.now() + Math.random(),
            date: proj.startDate,
            description: `Staff: ${s.employeeName} (${s.projectRole}) for project ${proj.name}`,
            category: 'Payroll',
            type: TransactionType.EXPENSE,
            amount: s.paymentAmount,
            sourceId: `staff-${proj.id}-${s.employeeId}`,
            isReadOnly: true,
        });
    });
    proj.otherExpenses.forEach(exp => {
        autoTransactions.push({
            id: Date.now() + Math.random(),
            date: proj.startDate,
            description: `Expense: ${exp.description} for project ${proj.name}`,
            category: 'Project Expense',
            type: TransactionType.EXPENSE,
            amount: exp.amount,
            sourceId: exp.id,
            isReadOnly: true,
        });
    });
});

export const initialTransactions: Transaction[] = autoTransactions;