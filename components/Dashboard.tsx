import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import Card from './Card';
import { Project, Transaction, Invoice, TransactionType, InvoiceStatus } from '../types';
import { getInvoiceTotal, getInvoiceTotalPaid } from '../utils/invoiceUtils';

interface DashboardProps {
  projects: Project[];
  transactions: Transaction[];
  invoices: Invoice[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];

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

  // --- KPI Calculations ---
  const totalRevenue = filteredTransactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = filteredTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const netProfit = totalRevenue - totalExpenses;
  
  const outstandingAmount = invoices
    .filter(inv => inv.status !== InvoiceStatus.PAID && inv.status !== InvoiceStatus.DRAFT)
    .reduce((sum, inv) => sum + (getInvoiceTotal(inv) - getInvoiceTotalPaid(inv)), 0);

  // --- Chart Data Calculations ---
  // Monthly financial overview bar chart data
  const monthlyData = filteredTransactions.reduce((acc, t) => {
    const date = new Date(t.date);
    if (isNaN(date.getTime())) return acc;
    const monthKey = t.date.substring(0, 7);
    if (!acc[monthKey]) {
      acc[monthKey] = { name: date.toLocaleString('default', { month: 'short', year: '2-digit' }), Income: 0, Expense: 0 };
    }
    if (t.type === TransactionType.INCOME) acc[monthKey].Income += t.amount;
    else acc[monthKey].Expense += t.amount;
    return acc;
  }, {} as Record<string, {name: string, Income: number, Expense: number}>);
    
  const revenueData = Object.keys(monthlyData).sort().map(key => monthlyData[key]);

  // Expense breakdown donut chart data
  const expenseByCategory = filteredTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
    }, {} as Record<string, number>);

  const expenseData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

  // --- "At a Glance" Data ---
  const today = new Date();
  today.setHours(0,0,0,0);

  const overdueInvoices = invoices
    .filter(inv => 
        (inv.status === InvoiceStatus.OVERDUE || (new Date(inv.dueDate) < today)) && 
        inv.status !== InvoiceStatus.PAID && 
        inv.status !== InvoiceStatus.DRAFT
    )
    .map(inv => {
        const balance = getInvoiceTotal(inv) - getInvoiceTotalPaid(inv);
        const dueDate = new Date(inv.dueDate);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
        return { ...inv, balance, daysOverdue };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue)
    .slice(0, 5);

  const recentTransactions = transactions.slice(0, 5);

  const dateButtonClasses = (range: string) => `px-3 py-1 text-sm font-medium rounded-md transition-colors ${activeRange === range ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`;

  return (
    <div className="space-y-6">
      {/* Date Filter Controls */}
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-md font-semibold text-gray-700 whitespace-nowrap">Filter Data</h3>
            <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => handleSetDateRange('30d')} className={dateButtonClasses('30d')}>Last 30 Days</button>
                <button onClick={() => handleSetDateRange('90d')} className={dateButtonClasses('90d')}>Last 90 Days</button>
                <button onClick={() => handleSetDateRange('year')} className={dateButtonClasses('year')}>This Year</button>
                <button onClick={() => handleSetDateRange('all')} className={dateButtonClasses('all')}>All Time</button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <input type="date" value={startDate} onChange={(e) => handleDateInputChange(e, 'start')} className="px-2 py-1 text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                <span className="text-gray-500">to</span>
                <input type="date" value={endDate} onChange={(e) => handleDateInputChange(e, 'end')} className="px-2 py-1 text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" />
            </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          title="Total Revenue" 
          value={`GMD ${totalRevenue.toLocaleString()}`} 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>} 
        />
        <Card 
          title="Total Expenses" 
          value={`GMD ${totalExpenses.toLocaleString()}`} 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
        />
        <Card 
          title="Net Profit" 
          value={`GMD ${netProfit.toLocaleString()}`} 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
        />
         <Card 
          title="Outstanding Amount" 
          value={`GMD ${outstandingAmount.toLocaleString()}`} 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-xl border-t border-l border-gray-50 border-b-4 border-r-4 border-gray-300">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Monthly Financial Overview</h3>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(value as number)} />
                <Tooltip formatter={(value: number) => `GMD ${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="Income" fill="#3B82F6" />
                <Bar dataKey="Expense" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">No financial data for selected period.</div>
          )}
        </div>
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-xl border-t border-l border-gray-50 border-b-4 border-r-4 border-gray-300">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Expense Breakdown</h3>
          {expenseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  paddingAngle={5}
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `GMD ${value.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">No expense data for selected period.</div>
          )}
        </div>
      </div>
      
      {/* At a Glance Section */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-xl border-t border-l border-gray-50 border-b-4 border-r-4 border-gray-300">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Overdue Invoices</h3>
          <div className="space-y-3">
            {overdueInvoices.length > 0 ? overdueInvoices.map(inv => (
              <div key={inv.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <p className="font-medium text-gray-800">{inv.clientName}</p>
                  <p className="text-xs text-gray-500">{inv.invoiceNumber}</p>
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
           <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Transactions (All Time)</h3>
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