import React, { useState, useMemo } from 'react';
import Card from './Card';
import { Project, Transaction, Invoice, TransactionType, InvoiceStatus, ProjectStatus } from '../types';
import { getInvoiceTotal, getInvoiceTotalPaid } from '../utils/invoiceUtils';

interface DashboardProps {
  projects: Project[];
  transactions: Transaction[];
  invoices: Invoice[];
}

const Dashboard: React.FC<DashboardProps> = ({ projects, transactions, invoices }) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activeRange, setActiveRange] = useState<'30d' | '90d' | 'year' | 'all' | 'custom'>('all');

  const handleSetDateRange = (range: '30d' | '90d' | 'year' | 'all') => {
    setActiveRange(range);
    const end = new Date();
    let start = new Date();

    switch (range) {
        case '30d':
            start.setDate(end.getDate() - 30);
            setStartDate(start.toISOString().split('T')[0]);
            setEndDate(end.toISOString().split('T')[0]);
            break;
        case '90d':
            start.setDate(end.getDate() - 90);
            setStartDate(start.toISOString().split('T')[0]);
            setEndDate(end.toISOString().split('T')[0]);
            break;
        case 'year':
            start = new Date(end.getFullYear(), 0, 1);
            setStartDate(start.toISOString().split('T')[0]);
            setEndDate(end.toISOString().split('T')[0]);
            break;
        case 'all':
            setStartDate('');
            setEndDate('');
            break;
    }
  };
  
  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
      setActiveRange('custom');
      if (type === 'start') setStartDate(e.target.value);
      if (type === 'end') setEndDate(e.target.value);
  }

  const filteredTransactions = useMemo(() => {
    if (!startDate && !endDate) {
      return transactions;
    }
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if(start) start.setHours(0, 0, 0, 0);
    if(end) end.setHours(23, 59, 59, 999);

    return transactions.filter(t => {
      try {
        const transactionDate = new Date(t.date);
        if(isNaN(transactionDate.getTime())) return false;
        if (start && transactionDate < start) return false;
        if (end && transactionDate > end) return false;
        return true;
      } catch (e) {
        return false;
      }
    });
  }, [transactions, startDate, endDate]);

  // --- Comparison Period Logic ---
  const { previousPeriodTransactions, isComparisonPossible } = useMemo(() => {
    if (!startDate || !endDate || activeRange === 'all') {
      return { previousPeriodTransactions: [], isComparisonPossible: false };
    }
    const currentStart = new Date(startDate);
    const currentEnd = new Date(endDate);
    
    currentStart.setHours(0, 0, 0, 0);
    currentEnd.setHours(23, 59, 59, 999);

    const duration = currentEnd.getTime() - currentStart.getTime();
    if (duration <= 0) {
      return { previousPeriodTransactions: [], isComparisonPossible: false };
    }

    const previousEnd = new Date(currentStart.getTime() - 1); 
    const previousStart = new Date(previousEnd.getTime() - duration);

    const filtered = transactions.filter(t => {
      try {
        const transactionDate = new Date(t.date);
        if (isNaN(transactionDate.getTime())) return false;
        return transactionDate >= previousStart && transactionDate <= previousEnd;
      } catch (e) {
        return false;
      }
    });

    return { previousPeriodTransactions: filtered, isComparisonPossible: true };
  }, [transactions, startDate, endDate, activeRange]);

  // --- KPI Calculations ---
  const totalRevenue = useMemo(() => filteredTransactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + t.amount, 0), [filteredTransactions]);
  
  const totalExpenses = useMemo(() => filteredTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0), [filteredTransactions]);
  
  const netProfit = useMemo(() => totalRevenue - totalExpenses, [totalRevenue, totalExpenses]);
  
  const previousTotalRevenue = useMemo(() => previousPeriodTransactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + t.amount, 0), [previousPeriodTransactions]);

  const previousTotalExpenses = useMemo(() => previousPeriodTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0), [previousPeriodTransactions]);
    
  const previousNetProfit = useMemo(() => previousTotalRevenue - previousTotalExpenses, [previousTotalRevenue, previousTotalExpenses]);

  const calculateChange = (current: number, previous: number): { change?: string; changeType?: 'positive' | 'negative' } => {
    if (!isComparisonPossible) {
        return { change: undefined, changeType: undefined };
    }
    if (previous === 0) {
        if (current > 0) return { change: 'New', changeType: 'positive' as const };
        return { change: '0%', changeType: undefined };
    }
    if (current === 0) {
        return { change: '100%', changeType: 'negative' as const };
    }

    const percentageChange = ((current - previous) / Math.abs(previous)) * 100;

    if (Math.abs(percentageChange) < 0.1) {
        return { change: '0%', changeType: undefined };
    }

    return {
      change: `${Math.abs(percentageChange).toFixed(0)}%`,
      changeType: percentageChange > 0 ? 'positive' as const : 'negative' as const,
    };
  };

  const revenueChange = calculateChange(totalRevenue, previousTotalRevenue);
  const expenseChangeRaw = calculateChange(totalExpenses, previousTotalExpenses);
  const expenseChange = {
    change: expenseChangeRaw.change,
    changeType: expenseChangeRaw.changeType === 'positive' ? 'negative' : (expenseChangeRaw.changeType === 'negative' ? 'positive' : undefined),
  };
  const netProfitChange = calculateChange(netProfit, previousNetProfit);
  
  const outstandingAmount = invoices
    .filter(inv => inv.status !== InvoiceStatus.PAID && inv.status !== InvoiceStatus.DRAFT)
    .reduce((sum, inv) => sum + (getInvoiceTotal(inv) - getInvoiceTotalPaid(inv)), 0);
    
  const inProgressProjectsCount = useMemo(() => 
    projects.filter(p => p.status === ProjectStatus.IN_PROGRESS).length,
    [projects]
  );
  
  const completedProjectsCount = useMemo(() =>
    projects.filter(p => p.status === ProjectStatus.COMPLETED).length,
    [projects]
  );

  // --- "At a Glance" Data ---
  const today = new Date();
  today.setHours(0,0,0,0);

  const allOverdueInvoices = useMemo(() => invoices.filter(inv =>
      (inv.status === InvoiceStatus.OVERDUE || (inv.due_date && new Date(inv.due_date) < today)) &&
      inv.status !== InvoiceStatus.PAID &&
      inv.status !== InvoiceStatus.DRAFT
  ), [invoices]);

  const overdueInvoices = allOverdueInvoices
    .map(inv => {
        const balance = getInvoiceTotal(inv) - getInvoiceTotalPaid(inv);
        const dueDate = new Date(inv.due_date);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
        return { ...inv, balance, daysOverdue };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue)
    .slice(0, 5);

  const recentTransactions = transactions.slice(0, 5);

  const dateButtonClasses = (range: string) => `px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 transform hover:scale-105 shadow-md ${activeRange === range ? 'bg-white text-blue-600 font-bold ring-2 ring-offset-2 ring-offset-blue-500 ring-white' : 'bg-white/20 text-white hover:bg-white/30'}`;

  return (
    <div className="space-y-6">
      {/* Date Filter Controls */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-xl shadow-lg border border-blue-400">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM13 10a1 1 0 011-1h6a1 1 0 011 1v2a1 1 0 01-1 1h-6a1 1 0 01-1-1v-2zM3 16a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" /></svg>
                <h3 className="text-lg font-bold text-white whitespace-nowrap">Filter Dashboard</h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => handleSetDateRange('30d')} className={dateButtonClasses('30d')}>30 Days</button>
                <button onClick={() => handleSetDateRange('90d')} className={dateButtonClasses('90d')}>90 Days</button>
                <button onClick={() => handleSetDateRange('year')} className={dateButtonClasses('year')}>This Year</button>
                <button onClick={() => handleSetDateRange('all')} className={dateButtonClasses('all')}>All Time</button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <input type="date" value={startDate} onChange={(e) => handleDateInputChange(e, 'start')} className="px-3 py-2 text-sm bg-white/20 text-white border border-white/30 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-white [color-scheme:dark]" />
                <span className="text-white font-semibold">to</span>
                <input type="date" value={endDate} onChange={(e) => handleDateInputChange(e, 'end')} className="px-3 py-2 text-sm bg-white/20 text-white border border-white/30 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-white [color-scheme:dark]" />
            </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          title="Projects In Progress" 
          value={`${inProgressProjectsCount}`} 
          color="blue"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <Card 
          title="Completed Projects" 
          value={`${completedProjectsCount}`} 
          color="green"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <Card 
          title="Total Revenue" 
          value={`GMD ${totalRevenue.toLocaleString()}`} 
          color="purple"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>}
          change={revenueChange.change}
          changeType={revenueChange.changeType}
        />
        <Card 
          title="Total Expenses" 
          value={`GMD ${totalExpenses.toLocaleString()}`} 
          color="red"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
          change={expenseChange.change}
          changeType={expenseChange.changeType}
        />
        <Card 
          title="Net Profit" 
          value={`GMD ${netProfit.toLocaleString()}`} 
          color="yellow"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          change={netProfitChange.change}
          changeType={netProfitChange.changeType}
        />
         <Card 
          title="Outstanding Amount" 
          value={`GMD ${outstandingAmount.toLocaleString()}`} 
          color="orange"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {/* At a Glance Section */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-xl border-t border-l border-gray-50 border-b-4 border-r-4 border-gray-300">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b-2 border-red-200 pb-2">Overdue Invoices</h3>
          <div className="space-y-3">
            {overdueInvoices.length > 0 ? overdueInvoices.map(inv => (
              <div key={inv.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <p className="font-medium text-gray-800">{inv.client_name}</p>
                  <p className="text-xs text-gray-500">{inv.invoice_number}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600">GMD {inv.balance.toLocaleString()}</p>
                  <p className="text-xs text-red-500">{inv.daysOverdue} days overdue</p>
                </div>
              </div>
            )) : <p className="text-gray-500 text-sm">No overdue invoices. Great job!</p>}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-xl border-t border-l border-gray-50 border-b-4 border-r-4 border-gray-300">
           <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b-2 border-green-200 pb-2">Recent Transactions (All Time)</h3>
            <div className="space-y-2">
              {recentTransactions.length > 0 ? recentTransactions.map(t => (
                <div key={t.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{t.description}</p>
                    <p className="text-xs text-gray-500">{t.date} - {t.category}</p>
                  </div>
                  <p className={`font-semibold text-sm ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === TransactionType.INCOME ? '+' : '-'}GMD {t.amount.toLocaleString()}
                  </p>
                </div>
              )) : <p className="text-gray-500 text-sm">No recent transactions.</p>}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;