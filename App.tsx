import React, { useState, useCallback, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Financials from './components/Financials';
import HumanResources from './components/HumanResources';
import Invoices from './components/Invoices';
import Projects from './components/Projects';
import Clients from './components/Clients';
import Login from './components/Login';
import { supabase } from './supabase';
import { Project, Invoice, Employee, Transaction, TransactionType, Payment, Client } from './types';
import { getInvoiceTotal, getInvoiceTotalPaid } from './utils/invoiceUtils';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [
        { data: projectsData, error: projectsError },
        { data: invoicesData, error: invoicesError },
        { data: employeesData, error: employeesError },
        { data: transactionsData, error: transactionsError },
        { data: clientsData, error: clientsError },
      ] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('invoices').select('*').order('created_at', { ascending: false }),
        supabase.from('employees').select('*').order('name', { ascending: true }),
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('clients').select('*').order('name', { ascending: true }),
      ]);
      
      if (projectsError) throw projectsError;
      if (invoicesError) throw invoicesError;
      if (employeesError) throw employeesError;
      if (transactionsError) throw transactionsError;
      if (clientsError) throw clientsError;
      
      setProjects(projectsData || []);
      setInvoices(invoicesData || []);
      setEmployees(employeesData || []);
      setTransactions(transactionsData || []);
      setClients(clientsData || []);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
        setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchData();
      
      const channels = supabase.channel('db-changes');
      channels
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => fetchData())
        .subscribe();
        
        return () => {
            supabase.removeChannel(channels);
        };
    }
  }, [session, fetchData]);

  // --- CRUD Handlers ---

  const handleReceivePayment = useCallback(async (invoiceId: string, paymentDetails: Omit<Payment, 'id'>) => {
    const { data: invoiceToUpdate, error: fetchError } = await supabase.from('invoices').select('*').eq('id', invoiceId).single();
    if (fetchError || !invoiceToUpdate) return console.error('Error fetching invoice for payment', fetchError);
    
    const newPayment: Payment = { ...paymentDetails, id: `pay-${Date.now()}` };
    const payments = [...invoiceToUpdate.payments, newPayment];
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalAmount = getInvoiceTotal(invoiceToUpdate);
    let newStatus = invoiceToUpdate.status;
    if (totalPaid >= totalAmount) newStatus = 'Paid';
    else if (totalPaid > 0) newStatus = 'Partially Paid';
    
    const updatedInvoice = { ...invoiceToUpdate, payments, status: newStatus };
    
    const { error: updateError } = await supabase.from('invoices').update(updatedInvoice).eq('id', invoiceId);
    if(updateError) return console.error("Error updating invoice with payment", updateError);
    
    // Create transaction
    const newTransaction = {
        date: paymentDetails.date,
        description: `Payment for Invoice #${invoiceToUpdate.invoiceNumber}`,
        category: 'Client Payment',
        type: TransactionType.INCOME,
        amount: paymentDetails.amount,
        isReadOnly: true,
        user_id: session?.user.id,
    };
    await supabase.from('transactions').insert(newTransaction);
    // Project amount update is handled via a trigger in Supabase for accuracy
  }, [session]);

  const handleSaveInvoice = useCallback(async (invoiceData: Omit<Invoice, 'id' | 'created_at' | 'user_id'> & { id?: string }) => {
    const { id, ...dataToSave } = invoiceData;
    if (id) {
        await supabase.from('invoices').update(dataToSave).eq('id', id);
    } else {
        await supabase.from('invoices').insert({ ...dataToSave, user_id: session?.user.id, payments: [] });
    }
  }, [session]);

  const handleDeleteInvoice = useCallback(async (invoiceId: string) => {
    await supabase.from('invoices').delete().eq('id', invoiceId);
  }, []);

  const handleSaveProject = useCallback(async (projectData: Omit<Project, 'id' | 'created_at' | 'user_id'> & { id?: string }) => {
    const { id, ...dataToSave } = projectData;
    if (id) {
      await supabase.from('projects').update(dataToSave).eq('id', id);
    } else {
      await supabase.from('projects').insert({ 
          ...dataToSave, 
          user_id: session?.user.id,
          amountReceived: 0,
          materials: [],
          staff: [],
          otherExpenses: [],
      });
    }
  }, [session]);
  
  const handleProjectDetailsUpdate = useCallback(async (updatedProject: Project) => {
    await supabase.from('projects').update(updatedProject).eq('id', updatedProject.id);
    // Real-time updates will refresh data, auto-transactions should be handled by Supabase triggers/functions for consistency
  }, []);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    await supabase.from('projects').delete().eq('id', projectId);
  }, []);

  const handleSaveEmployee = useCallback(async (employeeData: Omit<Employee, 'id' | 'created_at' | 'user_id'> & { id?: number }) => {
    const { id, ...dataToSave } = employeeData;
     if (id) {
         await supabase.from('employees').update(dataToSave).eq('id', id);
     } else {
         await supabase.from('employees').insert({ ...dataToSave, user_id: session?.user.id });
     }
  }, [session]);

  const handleDeleteEmployee = useCallback(async (employeeId: number) => {
    await supabase.from('employees').delete().eq('id', employeeId);
  }, []);
  
  const handleSaveTransaction = useCallback(async (transactionData: Omit<Transaction, 'id' | 'created_at' | 'user_id'> & { id?: number }) => {
     const { id, ...dataToSave } = transactionData;
     if (id) {
         await supabase.from('transactions').update(dataToSave).eq('id', id);
     } else {
         await supabase.from('transactions').insert({ ...dataToSave, user_id: session?.user.id });
     }
  }, [session]);

  const handleDeleteTransaction = useCallback(async (transactionId: number) => {
    await supabase.from('transactions').delete().eq('id', transactionId);
  }, []);

  const handleSaveClient = useCallback(async (clientData: Omit<Client, 'id' | 'created_at' | 'user_id'> & { id?: string }) => {
    const { id, ...dataToSave } = clientData;
    if (id) {
        await supabase.from('clients').update(dataToSave).eq('id', id);
    } else {
        await supabase.from('clients').insert({ ...dataToSave, user_id: session?.user.id });
    }
  }, [session]);

  const handleDeleteClient = useCallback(async (clientId: string) => {
    await supabase.from('clients').delete().eq('id', clientId);
  }, []);

  const renderContent = () => {
    if (loading && !session) return <div></div>; // Blank screen while session is being checked
    if (!session) return <Login />;

    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
            <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
      );
    }

    switch (activePage) {
      case 'Dashboard':
        return <Dashboard projects={projects} transactions={transactions} invoices={invoices} />;
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
                  clients={clients}
                  onDeleteProject={handleDeleteProject}
                  onSaveProject={handleSaveProject}
                  onUpdateProjectDetails={handleProjectDetailsUpdate}
               />;
      case 'Invoices':
        return <Invoices 
                  invoices={invoices}
                  projects={projects}
                  clients={clients}
                  onSave={handleSaveInvoice}
                  onDelete={handleDeleteInvoice}
                  onReceivePayment={handleReceivePayment}
               />;
      case 'Clients':
        return <Clients 
                  clients={clients}
                  onSaveClient={handleSaveClient}
                  onDeleteClient={handleDeleteClient}
                />;
      case 'Human Resources':
        return <HumanResources 
                  employees={employees} 
                  onSaveEmployee={handleSaveEmployee} 
                  onDeleteEmployee={handleDeleteEmployee} 
               />;
      default:
        return <Dashboard projects={projects} transactions={transactions} invoices={invoices} />;
    }
  };
  
  if (!session) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar activePage={activePage} setActivePage={setActivePage} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
            currentPage={activePage} 
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onLogout={() => supabase.auth.signOut()}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 sm:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;