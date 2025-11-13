export enum TransactionType {
  INCOME = 'Income',
  EXPENSE = 'Expense',
}

export interface Transaction {
  id: number;
  date: string;
  description: string;
  category: string;
  type: TransactionType;
  amount: number;
  sourceId?: string; // Links to invoice ID, material ID, etc.
  isReadOnly?: boolean; // To disable editing in Financials UI
}

export enum EmployeeStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

export interface Employee {
  id: number;
  name: string;
  gender: string;
  role: string;
  email: string;
  phone: string;
  startDate: string;
  avatarUrl: string;
  status: EmployeeStatus;
}

export enum ProjectStatus {
    PLANNED = 'Planned',
    IN_PROGRESS = 'In Progress',
    COMPLETED = 'Completed',
    ON_HOLD = 'On Hold'
}

export interface ProjectSummary {
    status: ProjectStatus;
    count: number;
}

// Invoice Types
export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export enum InvoiceStatus {
  DRAFT = 'Draft',
  SENT = 'Sent',
  PARTIALLY_PAID = 'Partially Paid',
  AWAITING_FINAL_PAYMENT = 'Awaiting Final Payment',
  PAID = 'Paid',
  OVERDUE = 'Overdue',
}

export enum InvoiceType {
  PROFORMA = 'Proforma Invoice',
  INVOICE = 'Invoice',
}

export enum BoreholeType {
  SOLAR_SMALL = 'Solar Powered (Small)',
  SOLAR_MEDIUM = 'Solar Powered (Medium)',
  SOLAR_LARGE = 'Solar Powered (Large)',
  ELECTRIC_SMALL = 'Electric Submersible (Small)',
  ELECTRIC_MEDIUM = 'Electric Submersible (Medium)',
  ELECTRIC_LARGE = 'Electric Submersible (Large)',
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientAddress: string;
  date: string;
  dueDate: string;
  lineItems: LineItem[];
  notes: string;
  taxRate: number; // Percentage
  status: InvoiceStatus;
  invoiceType: InvoiceType;
  projectId?: string; // Link to project
  projectName?: string; // For easy display
  payments: Payment[];
  boreholeType?: BoreholeType;
}

// Project Management Types
export interface Material {
  id: string;
  name: string;
  quantity: number;
  unitCost: number;
}

export interface StaffAssignment {
    employeeId: number;
    employeeName: string;
    projectRole: string;
    paymentAmount: number;
}

export interface OtherExpense {
  id: string;
  description: string;
  amount: number;
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  location: string;
  startDate: string;
  endDate?: string;
  status: ProjectStatus;
  totalBudget: number;
  amountReceived: number;
  materials: Material[];
  staff: StaffAssignment[];
  otherExpenses: OtherExpense[];
  boreholeType?: BoreholeType;
}