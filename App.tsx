import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Financials from './components/Financials';
import HumanResources from './components/HumanResources';
import Invoices from './components/Invoices';
import Projects from './components/Projects';
import { Project, Invoice, Employee, Transaction, ProjectStatus, InvoiceStatus, InvoiceType, TransactionType } from './types';
import { initialProjects, initialInvoices, initialEmployees, initialTransactions } from './data';

const getInvoiceTotal = (invoice: Omit<Invoice, 'id'> & { id?: string }): number => {
    const subtotal = invoice.lineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const taxAmount = subtotal * (invoice.taxRate / 100);
    return subtotal + taxAmount;
};

const App: React.FC = () => {
  const [activePage, setActivePage] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveInvoice = useCallback((invoiceData: Omit<Invoice, 'id'> & { id?: string }) => {
    setProjects(currentProjects => {
      setTransactions(currentTransactions => {
        let newTransactions = [...currentTransactions];
        let updatedInvoice: Invoice;
        let updatedInvoices: Invoice[];

        const isEditing = !!invoiceData.id;

        if (isEditing) {
          updatedInvoice = { ...invoiceData, id: invoiceData.id! };
          updatedInvoices = invoices.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv);
        } else {
          updatedInvoice = { ...invoiceData, id: `inv-${Date.now()}` };
          updatedInvoices = [updatedInvoice, ...invoices];
        }

        // Server logic replication
        const totalAmount = getInvoiceTotal(updatedInvoice);
        const depositAmount = totalAmount * 0.75;
        if (updatedInvoice.invoiceType === InvoiceType.PROFORMA && (updatedInvoice.status === InvoiceStatus.SENT || updatedInvoice.status === InvoiceStatus.PARTIALLY_PAID) && updatedInvoice.amountPaid >= depositAmount && updatedInvoice.amountPaid < totalAmount) {
            updatedInvoice.status = InvoiceStatus.AWAITING_FINAL_PAYMENT;
        }
        if (updatedInvoice.status === InvoiceStatus.PAID) {
            updatedInvoice.amountPaid = totalAmount;
        }

        // Transaction management
        newTransactions = newTransactions.filter(t => t.sourceId !== updatedInvoice.id);
        if (updatedInvoice.amountPaid > 0) {
            newTransactions.unshift({
                id: Date.now(),
                date: updatedInvoice.date,
                description: `Payment for Invoice #${updatedInvoice.invoiceNumber}`,
                category: 'Client Payment',
                type: TransactionType.INCOME,
                amount: updatedInvoice.amountPaid,
                sourceId: updatedInvoice.id,
                isReadOnly: true,
            });
        }
        
        setInvoices(updatedInvoices);

        // Update Project amountReceived and status
        let newProjects = [...currentProjects];
        if (updatedInvoice.projectId) {
            const projectIndex = newProjects.findIndex(p => p.id === updatedInvoice.projectId);
            if (projectIndex !== -1) {
                const totalPaidForProject = updatedInvoices
                    .filter(inv => inv.projectId === updatedInvoice.projectId)
                    .reduce((sum, inv) => sum + inv.amountPaid, 0);
                
                newProjects[projectIndex].amountReceived = totalPaidForProject;

                if (newProjects[projectIndex].status === ProjectStatus.PLANNED && totalPaidForProject > 0) {
                    newProjects[projectIndex].status = ProjectStatus.IN_PROGRESS;
                }
                if (newProjects[projectIndex].status === ProjectStatus.IN_PROGRESS && newProjects[projectIndex].totalBudget > 0 && totalPaidForProject >= newProjects[projectIndex].totalBudget) {
                    newProjects[projectIndex].status = ProjectStatus.COMPLETED;
                }
            }
        }
        
        return newTransactions;
      });
      return currentProjects;
    });
  }, [invoices]);


  const handleDeleteInvoice = useCallback((invoiceId: string) => {
    const invoiceToDelete = invoices.find(inv => inv.id === invoiceId);
    if (!invoiceToDelete) return;

    const updatedInvoices = invoices.filter(inv => inv.id !== invoiceId);
    setInvoices(updatedInvoices);

    setTransactions(currentTransactions => currentTransactions.filter(t => t.sourceId !== invoiceId));

    if (invoiceToDelete.projectId) {
        setProjects(currentProjects => {
            const projectIndex = currentProjects.findIndex(p => p.id === invoiceToDelete.projectId);
            if (projectIndex !== -1) {
                const totalPaid = updatedInvoices
                    .filter(inv => inv.projectId === invoiceToDelete.projectId)
                    .reduce((sum, inv) => sum + inv.amountPaid, 0);
                
                const newProjects = [...currentProjects];
                newProjects[projectIndex].amountReceived = totalPaid;
                return newProjects;
            }
            return currentProjects;
        });
    }
  }, [invoices]);

  const handleSaveProject = useCallback((project: Omit<Project, 'id'> & { id?: string }) => {
    if (project.id) { // Editing
        setProjects(prev => prev.map(p => p.id === project.id ? { ...p, ...project } as Project : p));
    } else { // Creating
        const newProject = { ...project, id: `proj-${Date.now()}` };
        setProjects(prev => [newProject, ...prev]);
    }
  }, []);
  
  const handleProjectDetailsUpdate = useCallback((updatedProject: Project) => {
    setTransactions(currentTransactions => {
        const originalProject = projects.find(p => p.id === updatedProject.id);
        if (!originalProject) return currentTransactions;

        let newTransactions = [...currentTransactions];

        const manageTransaction = (item: {id: string, description: string, amount: number}, type: 'Material' | 'Staff' | 'Expense') => {
            const existingTx = newTransactions.find(t => t.sourceId === item.id);
            if (existingTx) {
                existingTx.amount = item.amount;
                existingTx.description = `${type}: ${item.description} for project ${updatedProject.name}`;
            } else {
                 newTransactions.unshift({
                    id: Date.now() + Math.random(),
                    date: new Date().toISOString().split('T')[0],
                    description: `${type}: ${item.description} for project ${updatedProject.name}`,
                    category: type === 'Staff' ? 'Payroll' : 'Project Expense',
                    type: TransactionType.EXPENSE,
                    amount: item.amount,
                    sourceId: item.id,
                    isReadOnly: true,
                });
            }
        };

        const originalMaterialIds = new Set(originalProject.materials.map(m => m.id));
        updatedProject.materials.forEach(mat => manageTransaction({ id: mat.id, description: mat.name, amount: mat.quantity * mat.unitCost }, 'Material'));
        const deletedMaterialIds = [...originalMaterialIds].filter(id => !updatedProject.materials.some(m => m.id === id));
        
        const getStaffSourceId = (s: {employeeId: number}) => `staff-${updatedProject.id}-${s.employeeId}`;
        const originalStaffIds = new Set(originalProject.staff.map(getStaffSourceId));
        updatedProject.staff.forEach(s => manageTransaction({ id: getStaffSourceId(s), description: `${s.employeeName} (${s.projectRole})`, amount: s.paymentAmount }, 'Staff'));
        const deletedStaffIds = [...originalStaffIds].filter(id => !updatedProject.staff.some(s => getStaffSourceId(s) === id));

        const originalExpenseIds = new Set(originalProject.otherExpenses.map(e => e.id));
        updatedProject.otherExpenses.forEach(exp => manageTransaction({ id: exp.id, description: exp.description, amount: exp.amount }, 'Expense'));
        const deletedExpenseIds = [...originalExpenseIds].filter(id => !updatedProject.otherExpenses.some(e => e.id === id));
        
        const allDeletedIds = new Set([...deletedMaterialIds, ...deletedStaffIds, ...deletedExpenseIds]);
        newTransactions = newTransactions.filter(t => !allDeletedIds.has(t.sourceId!));

        return newTransactions;
    });

    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  }, [projects]);


  const handleDeleteProject = useCallback((projectId: string) => {
     const projectToDelete = projects.find(p => p.id === projectId);
     if (!projectToDelete) return;

     const sourceIdsToDelete = new Set();
     projectToDelete.materials.forEach(m => sourceIdsToDelete.add(m.id));
     projectToDelete.staff.forEach(s => sourceIdsToDelete.add(`staff-${projectId}-${s.employeeId}`));
     projectToDelete.otherExpenses.forEach(e => sourceIdsToDelete.add(e.id));
     
     setTransactions(prev => prev.filter(t => !sourceIdsToDelete.has(t.sourceId!)));
     setProjects(prev => prev.filter(p => p.id !== projectId));
     setInvoices(prev => prev.map(inv => {
         if (inv.projectId === projectId) {
             return { ...inv, projectId: undefined, projectName: undefined };
         }
         return inv;
     }));
  }, [projects]);

  const handleSaveEmployee = useCallback((employee: Omit<Employee, 'id'> & { id?: number }) => {
    if (employee.id) { // Editing
        setEmployees(prev => prev.map(e => e.id === employee.id ? employee as Employee : e));
    } else { // Creating
        const newEmployee = { ...employee, id: Date.now() };
        setEmployees(prev => [newEmployee, ...prev]);
    }
  }, []);

  const handleDeleteEmployee = useCallback((employeeId: number) => {
    if (!window.confirm("Are you sure you want to delete this employee? This will remove them from all assigned projects and cannot be undone.")) {
        return;
    }
    setEmployees(prev => prev.filter(e => e.id !== employeeId));

    setProjects(currentProjects => {
        const newProjects = [...currentProjects];
        const staffSourceIdsToDelete = new Set();

        newProjects.forEach(p => {
            const staffIndex = p.staff.findIndex(s => s.employeeId === employeeId);
            if (staffIndex > -1) {
                staffSourceIdsToDelete.add(`staff-${p.id}-${employeeId}`);
                p.staff.splice(staffIndex, 1);
            }
        });

        if (staffSourceIdsToDelete.size > 0) {
            setTransactions(currentTransactions => 
                currentTransactions.filter(t => !staffSourceIdsToDelete.has(t.sourceId!))
            );
        }

        return newProjects;
    });
  }, []);
  
  const handleSaveTransaction = useCallback((transaction: Omit<Transaction, 'id'> & { id?: number }) => {
     if (transaction.id) {
         setTransactions(prev => prev.map(t => t.id === transaction.id ? transaction as Transaction : t));
     } else {
         const newTransaction = { ...transaction, id: Date.now() };
         setTransactions(prev => [newTransaction, ...prev]);
     }
  }, []);

  const handleDeleteTransaction = useCallback((transactionId: number) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
        setTransactions(prev => prev.filter(t => t.id !== transactionId));
    }
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center h-full"><div className="text-xl font-semibold">Loading Business Suite...</div></div>;
    }
    switch (activePage) {
      case 'Dashboard':
        return <Dashboard projects={projects} employees={employees} transactions={transactions} />;
      case 'Financials':
        return <Financials 
                  transactions={transactions} 
                  onSaveTransaction={handleSaveTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
               />;
      case 'Projects':
        return <Projects 
                  projects={projects} 
                  employees={employees}
                  onDeleteProject={handleDeleteProject}
                  onSaveProject={handleSaveProject}
                  onUpdateProjectDetails={handleProjectDetailsUpdate}
               />;
      case 'Invoices':
        return <Invoices 
                  invoices={invoices}
                  projects={projects}
                  onSave={handleSaveInvoice}
                  onDelete={handleDeleteInvoice}
               />;
      case 'Human Resources':
        return <HumanResources 
                  employees={employees} 
                  onSaveEmployee={handleSaveEmployee} 
                  onDeleteEmployee={handleDeleteEmployee} 
               />;
      default:
        return <Dashboard projects={projects} employees={employees} transactions={transactions} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar activePage={activePage} setActivePage={setActivePage} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
            currentPage={activePage} 
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 sm:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
