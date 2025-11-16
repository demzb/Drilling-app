import React, { useState, useCallback, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import supabase from './supabase';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Financials from './components/Financials';
import HumanResources from './components/HumanResources';
import Invoices from './components/Invoices';
import Projects from './components/Projects';
import Clients from './components/Clients';
import Reporting from './components/Reporting';
import Login from './components/Login';
import FlowchartPage from './components/FlowchartPage';
import { Project, Invoice, Employee, Transaction, TransactionType, Payment, Client, ProjectStatus } from './types';
import { getInvoiceTotal } from './utils/invoiceUtils';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [activePage, setActivePage] = useState('Flowchart');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data states
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // --- Auth & Data Loading ---
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        // Clear data on logout
        setProjects([]);
        setInvoices([]);
        setEmployees([]);
        setTransactions([]);
        setClients([]);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) return;

    const fetchAllData = async () => {
        const [
            clientsRes,
            employeesRes,
            invoicesRes,
            projectsRes,
            transactionsRes,
        ] = await Promise.all([
            supabase.from('clients').select('*').order('created_at', { ascending: false }),
            supabase.from('employees').select('*').order('created_at', { ascending: false }),
            supabase.from('invoices').select('*').order('created_at', { ascending: false }),
            supabase.from('projects').select('*').order('created_at', { ascending: false }),
            supabase.from('transactions').select('*').order('created_at', { ascending: false }),
        ]);

        if (clientsRes.data) setClients(clientsRes.data);
        if (employeesRes.data) setEmployees(employeesRes.data);
        if (invoicesRes.data) setInvoices(invoicesRes.data);
        if (projectsRes.data) setProjects(projectsRes.data);
        if (transactionsRes.data) setTransactions(transactionsRes.data);
    };

    fetchAllData();

    // --- Real-time Subscriptions (for all users) ---
    const clientChannel = supabase.channel('public:clients').on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, payload => {
        if (payload.eventType === 'INSERT') setClients(current => [payload.new as Client, ...current]);
        if (payload.eventType === 'UPDATE') setClients(current => current.map(c => c.id === payload.new.id ? payload.new as Client : c));
        if (payload.eventType === 'DELETE') setClients(current => current.filter(c => c.id !== payload.old.id));
    }).subscribe();

    const employeeChannel = supabase.channel('public:employees').on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, payload => {
        if (payload.eventType === 'INSERT') setEmployees(current => [payload.new as Employee, ...current]);
        if (payload.eventType === 'UPDATE') setEmployees(current => current.map(e => e.id === payload.new.id ? payload.new as Employee : e));
        if (payload.eventType === 'DELETE') setEmployees(current => current.filter(e => e.id !== payload.old.id));
    }).subscribe();

    const invoiceChannel = supabase.channel('public:invoices').on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, payload => {
        if (payload.eventType === 'INSERT') setInvoices(current => [payload.new as Invoice, ...current]);
        if (payload.eventType === 'UPDATE') setInvoices(current => current.map(i => i.id === payload.new.id ? payload.new as Invoice : i));
        if (payload.eventType === 'DELETE') setInvoices(current => current.filter(i => i.id !== payload.old.id));
    }).subscribe();

    const projectChannel = supabase.channel('public:projects').on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, payload => {
        if (payload.eventType === 'INSERT') setProjects(current => [payload.new as Project, ...current]);
        if (payload.eventType === 'UPDATE') setProjects(current => current.map(p => p.id === payload.new.id ? payload.new as Project : p));
        if (payload.eventType === 'DELETE') setProjects(current => current.filter(p => p.id !== payload.old.id));
    }).subscribe();

    const transactionChannel = supabase.channel('public:transactions').on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, payload => {
        if (payload.eventType === 'INSERT') setTransactions(current => [payload.new as Transaction, ...current]);
        if (payload.eventType === 'UPDATE') setTransactions(current => current.map(t => t.id === payload.new.id ? payload.new as Transaction : t));
        if (payload.eventType === 'DELETE') setTransactions(current => current.filter(t => t.id !== payload.old.id));
    }).subscribe();

    return () => {
        supabase.removeChannel(clientChannel);
        supabase.removeChannel(employeeChannel);
        supabase.removeChannel(invoiceChannel);
        supabase.removeChannel(projectChannel);
        supabase.removeChannel(transactionChannel);
    };
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const updateProjectBudget = useCallback(async (projectId: string) => {
    const { data: projectInvoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('project_id', projectId);

    if (invoicesError) {
        console.error("Error fetching project invoices for budget update:", invoicesError.message);
        return;
    }

    if (!projectInvoices) return;

    const newTotalBudget = projectInvoices.reduce((sum, inv) => sum + getInvoiceTotal(inv as Invoice), 0);

    const { data: updatedProject, error: projectUpdateError } = await supabase
        .from('projects')
        .update({ total_budget: newTotalBudget })
        .eq('id', projectId)
        .select()
        .single();

    if (projectUpdateError) {
        console.error("Error updating project budget:", projectUpdateError.message);
        alert(`Error updating project budget: ${projectUpdateError.message}`);
    } else if (updatedProject) {
        setProjects(current => current.map(p => p.id === projectId ? updatedProject : p));
    }
  }, []);

  // --- CRUD Handlers (rewritten for Supabase) ---
  const handleReceivePayment = useCallback(async (invoiceId: string, paymentDetails: Omit<Payment, 'id'>): Promise<{ updatedInvoice: Invoice, newPayment: Payment } | null> => {
    if (!session) return null;
    const invoiceToUpdate = invoices.find(inv => inv.id === invoiceId);
    if (!invoiceToUpdate) return null;

    const newPayment: Payment = { ...paymentDetails, id: `pay-${Date.now()}` };
    const payments = [...invoiceToUpdate.payments, newPayment];
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalAmount = getInvoiceTotal(invoiceToUpdate);
    let newStatus = invoiceToUpdate.status;
    if (totalPaid >= totalAmount) newStatus = 'Paid';
    else if (totalPaid > 0) newStatus = 'Partially Paid';
    
    const { data: updatedInvoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .update({ payments, status: newStatus })
      .eq('id', invoiceId)
      .select()
      .single();
      
    if (invoiceError) {
        console.error("Error updating invoice:", invoiceError.message);
        alert(`Error updating invoice: ${invoiceError.message}`);
        return null;
    }
    
    if (!updatedInvoiceData) {
        return null;
    }

    const updatedInvoice = updatedInvoiceData as Invoice;
    setInvoices(current => current.map(i => i.id === invoiceId ? updatedInvoice : i));

    // Update project amount_received and status
    if (invoiceToUpdate.project_id) {
      const { data: projectToUpdate, error: projectFetchError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', invoiceToUpdate.project_id)
          .single();
      
      if (projectFetchError || !projectToUpdate) {
          console.error("Error fetching project for payment update:", projectFetchError?.message);
      } else {
        const newAmountReceived = projectToUpdate.amount_received + paymentDetails.amount;
        let newProjectStatus = projectToUpdate.status;
        
        if (projectToUpdate.total_budget > 0 && projectToUpdate.status !== ProjectStatus.COMPLETED) {
            const percentagePaid = (newAmountReceived / projectToUpdate.total_budget) * 100;
            if (percentagePaid >= 100) {
                newProjectStatus = ProjectStatus.COMPLETED;
            } else if (percentagePaid >= 75) {
                newProjectStatus = ProjectStatus.IN_PROGRESS;
            }
        }
    
        const { data: updatedProject, error: projectUpdateError } = await supabase
            .from('projects')
            .update({ amount_received: newAmountReceived, status: newProjectStatus })
            .eq('id', projectToUpdate.id)
            .select()
            .single();
    
        if (projectUpdateError) {
            console.error("Error updating project after payment:", projectUpdateError.message);
            alert(`Error updating project: ${projectUpdateError.message}`);
        }
        if (updatedProject) {
            setProjects(current => current.map(p => p.id === projectToUpdate.id ? updatedProject : p));
        }
      }
    }

    const newTransactionData: Omit<Transaction, 'id' | 'created_at'> = {
        date: paymentDetails.date,
        description: `Payment for Invoice #${invoiceToUpdate.invoice_number}`,
        category: 'Client Payment',
        type: TransactionType.INCOME,
        amount: paymentDetails.amount,
        is_read_only: true,
        user_id: session.user.id,
    };
    const { data: createdTransaction, error: transactionError } = await supabase.from('transactions').insert(newTransactionData).select().single();
    if(transactionError) console.error("Error creating transaction:", transactionError.message);
    if(createdTransaction) setTransactions(current => [createdTransaction, ...current]);

    return { updatedInvoice, newPayment };
  }, [invoices, session]);

  const handleSaveInvoice = useCallback(async (invoiceData: Omit<Invoice, 'id' | 'created_at' | 'user_id'> & { id?: string }) => {
    if (!session) return;
    
    let originalProjectId: string | undefined | null;
    if (invoiceData.id) {
        const originalInvoice = invoices.find(inv => inv.id === invoiceData.id);
        originalProjectId = originalInvoice?.project_id;
    }

    const { id, ...dataToSave } = invoiceData;
    const finalData = { 
        ...dataToSave, 
        user_id: session.user.id,
        due_date: dataToSave.due_date || null // FIX: Ensure empty due date is saved as null
    };

    const { data: savedInvoice, error } = id
      ? await supabase.from('invoices').update(finalData).eq('id', id).select().single()
      : await supabase.from('invoices').insert({ ...finalData, payments: [] }).select().single();
    
    if (error) {
        console.error("Error saving invoice:", error.message);
        alert(`Error saving invoice: ${error.message}`);
        return;
    }
    
    if (savedInvoice) {
        if (id) {
            setInvoices(current => current.map(i => i.id === id ? savedInvoice : i));
        } else {
            setInvoices(current => [savedInvoice, ...current]);
        }
    }

    const newProjectId = savedInvoice?.project_id;

    if (originalProjectId && originalProjectId !== newProjectId) {
        await updateProjectBudget(originalProjectId);
    }
    if (newProjectId) {
        await updateProjectBudget(newProjectId);
    }
  }, [session, invoices, updateProjectBudget]);

  const handleDeleteInvoice = useCallback(async (invoiceId: string) => {
    const invoiceToDelete = invoices.find(inv => inv.id === invoiceId);
    const projectId = invoiceToDelete?.project_id;

    const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
    if (error) {
        console.error("Error deleting invoice:", error.message);
        alert(`Error deleting invoice: ${error.message}`);
        return;
    }
    setInvoices(current => current.filter(i => i.id !== invoiceId));
    
    if (projectId) {
        await updateProjectBudget(projectId);
    }
  }, [invoices, updateProjectBudget]);

  const handleSaveProject = useCallback(async (projectData: Omit<Project, 'id' | 'created_at' | 'user_id'> & { id?: string }) => {
    if (!session) return;
    const { id, ...dataToSave } = projectData;
    const finalData = { 
        ...dataToSave, 
        user_id: session.user.id,
        end_date: dataToSave.end_date || null // FIX: Ensure empty end date is saved as null
    };

    const { data: savedProject, error } = id
      ? await supabase.from('projects').update(finalData).eq('id', id).select().single()
      : await supabase.from('projects').insert({ ...finalData, amount_received: 0, materials: [], staff: [], other_expenses: [] }).select().single();
    
    if (error) {
        console.error("Error saving project:", error.message);
        alert(`Error saving project: ${error.message}`);
        return;
    }

    if (savedProject) {
        if (id) {
            setProjects(current => current.map(p => p.id === id ? savedProject : p));
        } else {
            setProjects(current => [savedProject, ...current]);
        }
    }
  }, [session]);
  
  const handleProjectDetailsUpdate = useCallback(async (updatedProject: Project) => {
    const { id, user_id, created_at, ...dataToUpdate } = updatedProject;
    const { error } = await supabase.from('projects').update(dataToUpdate).eq('id', id);
    if (error) {
        console.error("Error updating project details:", error.message);
        alert(`Error updating project details: ${error.message}`);
    } else {
        setProjects(current => current.map(p => p.id === id ? updatedProject : p));
    }
  }, []);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) {
        console.error("Error deleting project:", error.message);
        alert(`Error deleting project: ${error.message}`);
    } else {
        setProjects(current => current.filter(p => p.id !== projectId));
    }
  }, []);

  const handleSaveEmployee = useCallback(async (employeeData: Omit<Employee, 'id' | 'created_at' | 'user_id'> & { id?: number }) => {
    if (!session) return;
    const { id, ...dataToSave } = employeeData;
    const finalData = { ...dataToSave, user_id: session.user.id };
    
    const { data: savedEmployee, error } = id
      ? await supabase.from('employees').update(finalData).eq('id', id).select().single()
      : await supabase.from('employees').insert(finalData).select().single();

    if (error) {
        console.error("Error saving employee:", error.message);
        alert(`Error saving employee: ${error.message}`);
        return;
    }
    
    if (savedEmployee) {
        if (id) {
            setEmployees(current => current.map(e => e.id === id ? savedEmployee : e));
        } else {
            setEmployees(current => [savedEmployee, ...current]);
        }
    }
  }, [session]);

  const handleDeleteEmployee = useCallback(async (employeeId: number) => {
    const { error } = await supabase.from('employees').delete().eq('id', employeeId);
    if (error) {
        console.error("Error deleting employee:", error.message);
        alert(`Error deleting employee: ${error.message}`);
    } else {
        setEmployees(current => current.filter(e => e.id !== employeeId));
    }
  }, []);
  
  const handleSaveTransaction = useCallback(async (transactionData: Omit<Transaction, 'id' | 'created_at' | 'user_id'> & { id?: number }) => {
    if (!session) return;
    const { id, ...dataToSave } = transactionData;
    const finalData = { ...dataToSave, user_id: session.user.id };

    const { data: savedTransaction, error } = id
        ? await supabase.from('transactions').update(finalData).eq('id', id).select().single()
        : await supabase.from('transactions').insert(finalData).select().single();

    if (error) {
        console.error("Error saving transaction:", error.message);
        alert(`Error saving transaction: ${error.message}`);
        return;
    }

    if (savedTransaction) {
        if (id) {
            setTransactions(current => current.map(t => t.id === id ? savedTransaction : t));
        } else {
            setTransactions(current => [savedTransaction, ...current]);
        }
    }
  }, [session]);

  const handleDeleteTransaction = useCallback(async (transactionId: number) => {
    const { error } = await supabase.from('transactions').delete().eq('id', transactionId);
    if (error) {
        console.error("Error deleting transaction:", error.message);
        alert(`Error deleting transaction: ${error.message}`);
    } else {
        setTransactions(current => current.filter(t => t.id !== transactionId));
    }
  }, []);

  const handleSaveClient = useCallback(async (clientData: Omit<Client, 'id' | 'created_at' | 'user_id'> & { id?: string }): Promise<Client | null> => {
    if (!session) return null;
    const { id, ...dataToSave } = clientData;
    const finalData = { ...dataToSave, user_id: session.user.id };

    if (id) {
        const { data: savedClient, error } = await supabase.from('clients').update(finalData).eq('id', id).select().single();
        if (error) {
            console.error("Error updating client:", error.message);
            alert(`Error updating client: ${error.message}`);
            return null;
        }
        if (savedClient) {
            setClients(current => current.map(c => c.id === id ? savedClient : c));
        }
        return savedClient;
    } else {
        const { data: savedClient, error } = await supabase.from('clients').insert(finalData).select().single();
        if (error) {
            console.error("Error creating client:", error.message);
            alert(`Error creating client: ${error.message}`);
            return null;
        }
        if (savedClient) {
            setClients(current => [savedClient, ...current]);
        }
        return savedClient;
    }
  }, [session]);

  const handleDeleteClient = useCallback(async (clientId: string) => {
    const { error } = await supabase.from('clients').delete().eq('id', clientId);
    if (error) {
        console.error("Error deleting client:", error.message);
        alert(`Error deleting client: ${error.message}`);
    } else {
        setClients(current => current.filter(c => c.id !== clientId));
    }
  }, []);

  const renderContent = () => {
    switch (activePage) {
      case 'Flowchart':
        return <FlowchartPage setActivePage={setActivePage} />;
      case 'Dashboard':
        return <Dashboard projects={projects} transactions={transactions} invoices={invoices} />;
      case 'Financials':
        return <Financials transactions={transactions} projects={projects} onSaveTransaction={handleSaveTransaction} onDeleteTransaction={handleDeleteTransaction} />;
      case 'Projects':
        return <Projects projects={projects} employees={employees} clients={clients} onDeleteProject={handleDeleteProject} onSaveProject={handleSaveProject} onUpdateProjectDetails={handleProjectDetailsUpdate} onSaveClient={handleSaveClient} />;
      case 'Invoices':
        return <Invoices invoices={invoices} projects={projects} clients={clients} onSave={handleSaveInvoice} onDelete={handleDeleteInvoice} onReceivePayment={handleReceivePayment} />;
      case 'Clients':
        return <Clients clients={clients} onSaveClient={handleSaveClient} onDeleteClient={handleDeleteClient} />;
      case 'Human Resources':
        return <HumanResources employees={employees} projects={projects} onSaveEmployee={handleSaveEmployee} onDeleteEmployee={handleDeleteEmployee} />;
      case 'Reporting':
        return <Reporting projects={projects} transactions={transactions} invoices={invoices} clients={clients} employees={employees} />;
      default:
        return <FlowchartPage setActivePage={setActivePage} />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          currentPage={activePage} 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-blue-50 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;