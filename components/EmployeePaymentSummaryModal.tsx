import React, { useMemo } from 'react';
import { Employee, Project } from '../types';

interface EmployeePaymentSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  projects: Project[];
}

const EmployeePaymentSummaryModal: React.FC<EmployeePaymentSummaryModalProps> = ({ isOpen, onClose, employee, projects }) => {
  const paymentSummary = useMemo(() => {
    if (!employee) return [];

    const summary: { projectName: string; clientName: string; paymentAmount: number }[] = [];

    projects.forEach(project => {
      const staffAssignment = project.staff.find(s => s.employeeId === employee.id);
      if (staffAssignment && staffAssignment.paymentAmount > 0) {
        summary.push({
          projectName: project.name,
          clientName: project.client_name,
          paymentAmount: staffAssignment.paymentAmount,
        });
      }
    });

    return summary;
  }, [projects, employee]);

  const totalPayments = useMemo(() => {
    return paymentSummary.reduce((total, item) => total + item.paymentAmount, 0);
  }, [paymentSummary]);

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Payment Summary for {employee.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Project Name</th>
                  <th scope="col" className="px-6 py-3">Client</th>
                  <th scope="col" className="px-6 py-3 text-right">Payment Amount</th>
                </tr>
              </thead>
              <tbody>
                {paymentSummary.length > 0 ? paymentSummary.map((item, index) => (
                  <tr key={index} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{item.projectName}</td>
                    <td className="px-6 py-4">{item.clientName}</td>
                    <td className="px-6 py-4 text-right font-medium text-green-700">
                      GMD {item.paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="text-center text-gray-500 py-10">No payment records found for this employee.</td>
                  </tr>
                )}
              </tbody>
              {paymentSummary.length > 0 && (
                <tfoot className="bg-gray-100 font-semibold">
                  <tr>
                    <td colSpan={2} className="px-6 py-3 text-right text-gray-800">Total Payments</td>
                    <td className="px-6 py-3 text-right text-lg text-green-800">
                      GMD {totalPayments.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        <div className="flex justify-end items-center p-4 bg-gray-50 border-t">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Close</button>
        </div>
      </div>
    </div>
  );
};

export default EmployeePaymentSummaryModal;
