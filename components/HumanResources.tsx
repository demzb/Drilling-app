import React, { useState } from 'react';
import { Employee, EmployeeStatus } from '../types';
import EmployeeModal from './EmployeeModal';
import ConfirmationModal from './ConfirmationModal';

interface HumanResourcesProps {
  employees: Employee[];
  onSaveEmployee: (employee: Omit<Employee, 'id'> & { id?: number }) => void;
  onDeleteEmployee: (employeeId: number) => void;
}

const HumanResources: React.FC<HumanResourcesProps> = ({ employees, onSaveEmployee, onDeleteEmployee }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  const handleOpenAddModal = () => {
    setEmployeeToEdit(null);
    setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (employee: Employee) => {
    setEmployeeToEdit(employee);
    setIsModalOpen(true);
  };

  const handleSaveEmployee = (employeeData: Omit<Employee, 'id'> & { id?: number }) => {
    const finalEmployeeData = {
        ...employeeData,
        status: employeeData.status || EmployeeStatus.ACTIVE,
        avatarUrl: employeeData.avatarUrl || `https://i.pravatar.cc/150?u=${Date.now()}`
    };
    onSaveEmployee(finalEmployeeData);
    setIsModalOpen(false);
  };
  
  const handleDeleteRequest = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (employeeToDelete) {
      onDeleteEmployee(employeeToDelete.id);
      setIsConfirmModalOpen(false);
      setEmployeeToDelete(null);
    }
  };

  return (
    <>
      <EmployeeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEmployee}
        employeeToEdit={employeeToEdit}
      />
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Employee"
        message={
          <>
            Are you sure you want to delete "<strong>{employeeToDelete?.name}</strong>"? This will remove them from all assigned projects and cannot be undone.
          </>
        }
      />
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-700">Employee Directory</h3>
          <button onClick={handleOpenAddModal} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors">
            Add Employee
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Name</th>
                <th scope="col" className="px-6 py-3">Role</th>
                <th scope="col" className="px-6 py-3">Gender</th>
                <th scope="col" className="px-6 py-3">Contact</th>
                <th scope="col" className="px-6 py-3">Start Date</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.length > 0 ? employees.map((employee) => (
                <tr key={employee.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {employee.name}
                  </td>
                  <td className="px-6 py-4">{employee.role}</td>
                  <td className="px-6 py-4">{employee.gender}</td>
                  <td className="px-6 py-4">
                    <div>{employee.email}</div>
                    <div className="text-gray-400">{employee.phone}</div>
                  </td>
                  <td className="px-6 py-4">{employee.startDate}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      employee.status === EmployeeStatus.ACTIVE 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-4">
                    <button onClick={() => handleOpenEditModal(employee)} className="font-medium text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDeleteRequest(employee)} className="font-medium text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              )) : (
                 <tr>
                    <td colSpan={7} className="text-center text-gray-500 py-10">
                        No employees found. Add an employee to get started.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default HumanResources;