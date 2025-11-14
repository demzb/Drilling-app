import React, { useState, useEffect } from 'react';
import { Employee, EmployeeStatus } from '../types';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Omit<Employee, 'id'> & { id?: number }) => void;
  employeeToEdit: Employee | null;
}

const emptyEmployee: Omit<Employee, 'id'> = {
    name: '',
    role: '',
    gender: '',
    email: '',
    phone: '',
    startDate: new Date().toISOString().split('T')[0],
    avatarUrl: '',
    status: EmployeeStatus.ACTIVE,
    // FIX: Add missing properties to satisfy the Omit<Employee, 'id'> type. These are backend-managed fields.
    user_id: '',
    created_at: '',
};

const EmployeeModal: React.FC<EmployeeModalProps> = ({ isOpen, onClose, onSave, employeeToEdit }) => {
    const [formData, setFormData] = useState<Omit<Employee, 'id'>>(emptyEmployee);

    useEffect(() => {
        if (employeeToEdit) {
            setFormData(employeeToEdit);
        } else {
            setFormData(emptyEmployee);
        }
    }, [employeeToEdit, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.role || !formData.gender) {
            alert('Please fill in Name, Role, and Gender.');
            return;
        }

        const employeeData = { ...formData };
        if (employeeToEdit) {
            (employeeData as Employee).id = employeeToEdit.id;
        }
        
        onSave(employeeData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                <form onSubmit={handleSubmit}>
                    <div className="flex justify-between items-center p-4 border-b">
                        <h2 className="text-xl font-semibold text-gray-800">
                            {employeeToEdit ? 'Edit Employee' : 'Add New Employee'}
                        </h2>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Role</label>
                                <input type="text" name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                                <label className="block text-sm font-medium text-gray-700">Gender</label>
                                <select name="gender" value={formData.gender} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required>
                                    <option value="">Select Gender</option>
                                    <option>Male</option>
                                    <option>Female</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required>
                                    <option value={EmployeeStatus.ACTIVE}>Active</option>
                                    <option value={EmployeeStatus.INACTIVE}>Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                                <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email Address</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                        </div>
                    </div>

                    <div className="flex justify-end items-center p-4 bg-gray-50 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md mr-2 hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            {employeeToEdit ? 'Save Changes' : 'Add Employee'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmployeeModal;