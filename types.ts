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
  source_id?: string; 
  is_read_only?: boolean;
  user_id: string;
  created_at: string;
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
  start_date: string;
  avatar_url: string;
  status: EmployeeStatus;
  user_id: string;
  created_at: string;
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
  PAID = 'Paid',
  OVERDUE = 'Overdue',
}

export enum InvoiceType {
  INVOICE = 'Invoice',
  PROFORMA = 'Proforma Invoice',
}

export enum BoreholeType {
  SOLAR_SMALL = 'Solar Powered (Small)',
  SOLAR_MEDIUM = 'Solar Powered (Medium)',
  SOLAR_LARGE = 'Solar Powered (Large)',
  ELECTRIC_SMALL = 'Electric Submersible (Small)',
  ELECTRIC_MEDIUM = 'Electric Submersible (Medium)',
  ELECTRIC_LARGE = 'Electric Submersible (Large)',
}

export enum PaymentMethod {
  CASH = 'Cash',
  BANK_TRANSFER = 'Bank Transfer',
  CHECK = 'Check',
  UNSPECIFIED = 'Unspecified',
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  notes?: string;
  checkNumber?: string;
}

export interface Client {
  id: string;
  name: string;
  contact_person?: string;
  email: string;
  phone: string;
  address: string;
  user_id: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id?: string;
  client_name: string;
  client_address: string;
  date: string;
  due_date: string;
  line_items: LineItem[];
  notes: string;
  tax_rate: number; // Percentage
  discount_amount: number; // Fixed discount amount
  status: InvoiceStatus;
  invoice_type: InvoiceType;
  project_id?: string; // Link to project
  project_name?: string; // For easy display
  payments: Payment[];
  borehole_type?: BoreholeType;
  last_reminder_sent?: string;
  user_id: string;
  created_at: string;
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
  client_id?: string;
  client_name: string;
  location: string;
  start_date: string;
  end_date?: string;
  status: ProjectStatus;
  total_budget: number;
  amount_received: number;
  materials: Material[];
  staff: StaffAssignment[];
  other_expenses: OtherExpense[];
  borehole_type?: BoreholeType;
  user_id: string;
  created_at: string;
}
