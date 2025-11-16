import React from 'react';

interface BusinessFlowchartProps {
  setActivePage: (page: string) => void;
}

// Sub-component for a single step in the flow
const FlowCard: React.FC<{ title: string; icon: React.ReactNode; onClick: () => void; }> = ({ title, icon, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center text-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md hover:bg-blue-50 border border-gray-200 transition-all duration-200 w-32 h-28 group"
  >
    <div className="text-blue-500 mb-2 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <span className="text-sm font-semibold text-gray-700">{title}</span>
  </button>
);

// Sub-component for the connecting arrow
const FlowArrow: React.FC = () => (
  <div className="flex-shrink-0 w-12 md:w-16 items-center justify-center hidden md:flex">
    <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  </div>
);

// Sub-component for a vertical connecting arrow for mobile
const VerticalFlowArrow: React.FC = () => (
    <div className="flex-shrink-0 h-12 flex items-center justify-center md:hidden">
      <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 17l-4 4m0 0l-4-4m4 4V3" />
      </svg>
    </div>
);


const BusinessFlowchart: React.FC<BusinessFlowchartProps> = ({ setActivePage }) => {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-100 p-6 rounded-lg shadow-xl border-t border-l border-gray-50 border-b-4 border-r-4 border-gray-200 space-y-8">
      <h2 className="text-2xl font-bold text-gray-800 text-center">YS DRILLING BUSINESS WORK FLOW</h2>

      {/* Customer Workflow */}
      <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-center text-blue-700 mb-6">Customers & Sales (Money In)</h3>
        <div className="flex flex-col md:flex-row items-center justify-center flex-wrap">
          <FlowCard 
            title="Clients" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.282-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.282.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
            onClick={() => setActivePage('Clients')}
          />
          <FlowArrow />
          <VerticalFlowArrow />
          <FlowCard 
            title="Projects"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
            onClick={() => setActivePage('Projects')}
          />
          <FlowArrow />
          <VerticalFlowArrow />
          <FlowCard
            title="Invoices"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            onClick={() => setActivePage('Invoices')}
          />
          <FlowArrow />
          <VerticalFlowArrow />
          <FlowCard
            title="Receive Payments"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
            onClick={() => setActivePage('Invoices')}
          />
        </div>
      </div>
      
      {/* Company Workflow */}
      <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-center text-purple-700 mb-6">Company & Expenses (Money Out)</h3>
        <div className="flex flex-col md:flex-row items-center justify-center flex-wrap">
            <FlowCard
                title="Record Expenses"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
                onClick={() => setActivePage('Financials')}
            />
            <FlowArrow />
            <VerticalFlowArrow />
            <FlowCard
                title="Manage Employees"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.965 5.965 0 0112 13a5.965 5.965 0 013 2.803M15 21a6 6 0 00-9-5.197" /></svg>}
                onClick={() => setActivePage('Human Resources')}
            />
            <FlowArrow />
            <VerticalFlowArrow />
            <FlowCard
                title="View Reports"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                onClick={() => setActivePage('Reporting')}
            />
        </div>
      </div>
    </div>
  );
};

export default BusinessFlowchart;