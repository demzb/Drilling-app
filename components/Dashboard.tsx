import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Card from './Card';
import { Project, Employee, Transaction, ProjectStatus, TransactionType } from '../types';

interface DashboardProps {
  projects: Project[];
  employees: Employee[];
  transactions: Transaction[];
}

const COLORS = ['#00C49F', '#0088FE', '#FFBB28', '#FF8042'];

const Dashboard: React.FC<DashboardProps> = ({ projects, employees, transactions }) => {
  // Card calculations
  const totalRevenue = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + t.amount, 0);

  const plannedProjects = projects.filter(p => p.status === ProjectStatus.PLANNED).length;
  const activeProjects = projects.filter(p => p.status === ProjectStatus.IN_PROGRESS).length;
  const completedProjects = projects.filter(p => p.status === ProjectStatus.COMPLETED).length;

  // Project status pie chart data
  const projectStatusCounts = projects.reduce((acc, project) => {
    acc[project.status] = (acc[project.status] || 0) + 1;
    return acc;
  }, {} as Record<ProjectStatus, number>);

  // Fix: Explicitly cast the result of Object.entries to resolve the type inference issue
  // where `value` was being inferred as `unknown`.
  const projectData = (Object.entries(projectStatusCounts) as [string, number][])
    .map(([name, value]) => ({ name, value }))
    .filter(item => item.value > 0);

  // Monthly financial overview bar chart data
  const monthlyData = transactions.reduce((acc, t) => {
    const date = new Date(t.date);
    if (isNaN(date.getTime())) return acc;

    const monthKey = t.date.substring(0, 7);
    
    if (!acc[monthKey]) {
      acc[monthKey] = { name: date.toLocaleString('default', { month: 'short' }), Income: 0, Expense: 0 };
    }
    if (t.type === TransactionType.INCOME) {
      acc[monthKey].Income += t.amount;
    } else {
      acc[monthKey].Expense += t.amount;
    }
    return acc;
  }, {} as Record<string, {name: string, Income: number, Expense: number}>);
    
  const revenueData = Object.entries(monthlyData)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([, value]) => value);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          title="Total Revenue" 
          value={`GMD ${totalRevenue.toLocaleString()}`} 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>} 
        />
        <Card 
          title="Planned Projects" 
          value={plannedProjects.toString()} 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
        />
        <Card 
          title="Active Projects" 
          value={activeProjects.toString()} 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
        />
         <Card 
          title="Completed Projects" 
          value={completedProjects.toString()} 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Monthly Financial Overview</h3>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Income" fill="#3B82F6" />
                <Bar dataKey="Expense" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">No financial data available.</div>
          )}
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Project Status</h3>
          {projectData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={projectData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {projectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">No project data available.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
