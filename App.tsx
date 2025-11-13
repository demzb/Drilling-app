import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Financials from './components/Financials';
import HumanResources from './components/HumanResources';
import Invoices from './components/Invoices';
import Projects from './components/Projects';
import { Project, Invoice, Employee, Transaction } from './types';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fullStateUpdate = (data: any) => {
    setProjects(data.projects || []);
    setInvoices(data.invoices || []);
    setEmployees(data.employees || []);
    setTransactions(data.transactions || []);
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/data');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        fullStateUpdate(data);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSaveInvoice = useCallback(async (invoiceData: Omit<Invoice, 'id'> & { id?: string }) => {
    const isEditing = !!invoiceData.id;
    const url = isEditing ? `/api/invoices/${invoiceData.id}` : '/api/invoices';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      });
      const result = await response.json();
      
      const updatedInvoices = isEditing
        ? invoices.map(inv => inv.id === result.invoice.id ? result.invoice : inv)
        : [result.invoice, ...invoices];

      setInvoices(updatedInvoices);
      setProjects(result.projects);
      setTransactions(result.transactions);

    } catch (error) {
      console.error("Failed to save invoice:", error);
    }
  }, [invoices]);

  const handleDeleteInvoice = useCallback(async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, { method: 'DELETE' });
      if (response.ok) {
        const data = await response.json();
        fullStateUpdate(data);
      } else {
        console.error("Failed to delete invoice:", await response.text());
      }
    } catch (error) {
      console.error("Failed to delete invoice:", error);
    }
  }, []);

  const handleSaveProject = useCallback(async (project: Omit<Project, 'id'> & { id?: string }) => {
    const isEditing = !!project.id;
    const url = isEditing ? `/api/projects/${project.id}` : '/api/projects';
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(project)
        });
        const result = await response.json();
        if (isEditing) {
            // PUT returns a complex object
            setProjects(prev => prev.map(p => p.id === result.project.id ? result.project : p));
            setTransactions(result.transactions);
        } else {
            // POST returns just the project
            setProjects(prev => [result, ...prev]);
        }
    } catch (error) {
        console.error("Failed to save project:", error);
    }
  }, []);
  
  const handleProjectDetailsUpdate = useCallback(async (updatedProject: Project) => {
    try {
        const response = await fetch(`/api/projects/${updatedProject.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedProject)
        });
        const result = await response.json();
        setProjects(prev => prev.map(p => p.id === result.project.id ? result.project : p));
        setTransactions(result.transactions);
    } catch (error) {
        console.error("Failed to update project details:", error);
    }
  }, []);

  const handleDeleteProject = useCallback(async (projectId: string) => {
     try {
        const response = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
        if (response.ok) {
            const data = await response.json();
            fullStateUpdate(data);
        } else {
            console.error("Failed to delete project:", await response.text());
        }
     } catch (error) {
        console.error("Failed to delete project:", error);
     }
  }, []);

  const handleSaveEmployee = useCallback(async (employee: Omit<Employee, 'id'> & { id?: number }) => {
    const isEditing = !!employee.id;
    const url = isEditing ? `/api/employees/${employee.id}` : '/api/employees';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employee),
      });
      const savedEmployee = await response.json();
      if (isEditing) {
        setEmployees(prev => prev.map(e => e.id === savedEmployee.id ? savedEmployee : e));
      } else {
        setEmployees(prev => [savedEmployee, ...prev]);
      }
    } catch (error) {
      console.error("Failed to save employee:", error);
    }
  }, []);

  const handleDeleteEmployee = useCallback(async (employeeId: number) => {
    if (!window.confirm("Are you sure you want to delete this employee? This will remove them from all assigned projects and cannot be undone.")) {
        return;
    }
    try {
        const res = await fetch(`/api/employees/${employeeId}`, { method: 'DELETE' });
        if(res.ok) {
            const data = await res.json();
            fullStateUpdate(data);
        } else {
             const errorText = await res.text();
             console.error("Failed to delete employee:", errorText);
             alert(`Error deleting employee: ${errorText}`);
        }
    } catch (error) {
        console.error("Failed to delete employee:", error);
    }
  }, []);
  
  const handleSaveTransaction = useCallback(async (transaction: Omit<Transaction, 'id'> & { id?: number }) => {
     const isEditing = !!transaction.id;
     const url = isEditing ? `/api/transactions/${transaction.id}` : '/api/transactions';
     const method = isEditing ? 'PUT' : 'POST';

     try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transaction)
        });
        const savedTransaction = await response.json();
        if (isEditing) {
            setTransactions(prev => prev.map(t => t.id === savedTransaction.id ? savedTransaction : t));
        } else {
            setTransactions(prev => [savedTransaction, ...prev]);
        }
     } catch(error) {
         console.error("Failed to save transaction:", error);
     }
  }, []);

  const handleDeleteTransaction = useCallback(async (transactionId: number) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
        try {
            const response = await fetch(`/api/transactions/${transactionId}`, { method: 'DELETE' });
            if (response.ok) {
                const data = await response.json();
                fullStateUpdate(data);
            } else {
                console.error("Failed to delete transaction:", await response.text());
            }
        } catch(error) {
            console.error("Failed to delete transaction:", error);
        }
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