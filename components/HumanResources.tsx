import React, { useState } from 'react';
import { Employee, EmployeeStatus } from '../types';
import EmployeeModal from './EmployeeModal';
import ConfirmationModal from './ConfirmationModal';

interface HumanResourcesProps {
  employees: Employee[];
  onSaveEmployee: (employee: Omit<Employee, 'id' | 'created_at' | 'user_id'> & { id?: number }) => Promise<void>;
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

  const handleSaveEmployee = async (employeeData: Omit<Employee, 'id' | 'created_at' | 'user_id'> & { id?: number }) => {
    const finalEmployeeData = {
        ...employeeData,
        status: employeeData.status || EmployeeStatus.ACTIVE,
        avatar_url: employeeData.avatar_url || `https://i.pravatar.cc/150?u=${Date.now()}`
    };
    await onSaveEmployee(finalEmployeeData);
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
  
  const getStatusStyles = (status: EmployeeStatus) => {
    switch (status) {
      case EmployeeStatus.ACTIVE:
        return {
          badge: 'bg-cyan-100 text-cyan-800',
          border: 'border-cyan-500',
        };
      case EmployeeStatus.INACTIVE:
      default:
        return {
          badge: 'bg-rose-100 text-rose-800',
          border: 'border-rose-500',
        };
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Employee Directory</h2>
          <button onClick={handleOpenAddModal} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors shadow-md flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Employee
          </button>
        </div>

        {employees.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {employees.map((employee) => {
              const statusStyles = getStatusStyles(employee.status);
              return (
                <div key={employee.id} className={`bg-gradient-to-br from-white to-slate-50 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out hover:-translate-y-1 border-l-4 ${statusStyles.border} flex flex-col`}>
                  <div className="p-6 text-center flex-grow">
                    <div className="w-24 h-24 rounded-full mx-auto -mt-12 border-4 border-white shadow-md bg-blue-700 flex flex-col items-center justify-center text-white select-none">
                        <span className="text-4xl font-extrabold tracking-tighter">YS</span>
                        <span className="text-[10px] tracking-[0.2em] uppercase -mt-1">Drilling</span>
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-gray-800">{employee.name}</h3>
                    <p className="text-sm text-blue-600 font-semibold">{employee.role}</p>
                    
                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${statusStyles.badge} mt-2`}>
                      {employee.status}
                    </span>
                    
                    <p className="text-xs text-gray-500 mt-2">{employee.gender} &middot; Joined on {employee.start_date}</p>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3 text-left">
                       <div className="flex items-center text-sm text-gray-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                          <a href={`mailto:${employee.email}`} className="hover:text-blue-500 break-all">{employee.email}</a>
                       </div>
                       <div className="flex items-center text-sm text-gray-600">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                           <a href={`tel:${employee.phone}`} className="hover:text-blue-500">{employee.phone}</a>
                       </div>
                    </div>
                  </div>

                  <div className="bg-gray-50/50 px-6 py-3 flex justify-around items-center border-t">
                     <button onClick={() => handleOpenEditModal(employee)} className="flex items-center text-sm font-medium text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg p-2 transition-colors duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                          <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                        </svg>
                        Edit
                    </button>
                    <button onClick={() => handleDeleteRequest(employee)} className="flex items-center text-sm font-medium text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-lg p-2 transition-colors duration-200">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                       Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-16 bg-white rounded-lg shadow-md border-2 border-dashed">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.965 5.965 0 0112 13a5.965 5.965 0 013 2.803M15 21a6 6 0 00-9-5.197" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No employees found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a new employee.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default HumanResources;