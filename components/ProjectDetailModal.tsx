import React, { useState, useMemo, useEffect } from 'react';
import { Project, Material, Employee, StaffAssignment, OtherExpense, EmployeeStatus } from '../types';

interface ProjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onUpdateProject: (project: Project) => void;
  employees: Employee[];
  onDeleteProject: (projectId: string) => void;
  onEditProject: (project: Project) => void;
}

const emptyMaterial = { name: '', quantity: '1', unitCost: '' };
const emptyStaffAssignment = { employeeId: '', projectRole: '', paymentAmount: '' };
const emptyExpense = { description: '', amount: '' };


const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ isOpen, onClose, project, onUpdateProject, employees, onDeleteProject, onEditProject }) => {
  const [newMaterial, setNewMaterial] = useState(emptyMaterial);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  
  const [newStaffAssignment, setNewStaffAssignment] = useState(emptyStaffAssignment);
  const [editingStaff, setEditingStaff] = useState<StaffAssignment | null>(null);

  const [newExpense, setNewExpense] = useState(emptyExpense);
  const [editingExpense, setEditingExpense] = useState<OtherExpense | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setNewMaterial(emptyMaterial);
      setEditingMaterial(null);
      setNewStaffAssignment(emptyStaffAssignment);
      setEditingStaff(null);
      setNewExpense(emptyExpense);
      setEditingExpense(null);
    }
  }, [isOpen]);

  const totalMaterialCost = useMemo(() => {
    return project.materials.reduce((acc, mat) => acc + (mat.quantity * mat.unitCost), 0);
  }, [project.materials]);
  
  const totalStaffCost = useMemo(() => {
      return project.staff.reduce((acc, s) => acc + s.paymentAmount, 0);
  }, [project.staff]);

  const totalOtherCost = useMemo(() => {
    return project.otherExpenses.reduce((acc, exp) => acc + exp.amount, 0);
  }, [project.otherExpenses]);
  
  const totalProjectCost = useMemo(() => {
    return totalMaterialCost + totalStaffCost + totalOtherCost;
  }, [totalMaterialCost, totalStaffCost, totalOtherCost]);

  const netProfit = project.amountReceived - totalProjectCost;
  
  const availableEmployees = useMemo(() => {
    const assignedIds = new Set(project.staff.map(s => s.employeeId));
    const activeEmployees = employees.filter(emp => emp.status === EmployeeStatus.ACTIVE);
     if (editingStaff) {
        return activeEmployees.filter(emp => !assignedIds.has(emp.id) || emp.id === editingStaff.employeeId);
    }
    return activeEmployees.filter(emp => !assignedIds.has(emp.id));
  }, [employees, project.staff, editingStaff]);

  const handleDeleteClick = () => {
    if (window.confirm('Are you sure you want to delete this project? This will remove all associated expenses and unlink any invoices. This action cannot be undone.')) {
        onDeleteProject(project.id);
    }
  };

  if (!isOpen) return null;

  // --- Material Handlers ---
  const handleMaterialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewMaterial(prev => ({ ...prev, [name]: value }));
  };
  
  const handleStartEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setNewMaterial({
      name: material.name,
      quantity: String(material.quantity),
      unitCost: String(material.unitCost)
    });
  };
  
  const handleCancelEditMaterial = () => {
    setEditingMaterial(null);
    setNewMaterial(emptyMaterial);
  };

  const handleMaterialFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = parseInt(newMaterial.quantity, 10);
    const unitCost = parseFloat(newMaterial.unitCost);

    if (!newMaterial.name || isNaN(quantity) || quantity <= 0 || isNaN(unitCost) || unitCost < 0) {
        alert("Please provide a valid material name, quantity, and unit cost.");
        return;
    }
    
    const updatedMaterials = editingMaterial
      ? project.materials.map(mat => 
          mat.id === editingMaterial.id ? { ...mat, name: newMaterial.name, quantity, unitCost } : mat
        )
      : [...project.materials, { id: `mat-${Date.now()}`, name: newMaterial.name, quantity, unitCost }];
    
    onUpdateProject({ ...project, materials: updatedMaterials });
    handleCancelEditMaterial();
  };

  const handleDeleteMaterial = (materialId: string) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
        const updatedMaterials = project.materials.filter(mat => mat.id !== materialId);
        onUpdateProject({ ...project, materials: updatedMaterials });
    }
  };
  
  // --- Staff Handlers ---
  const handleStaffChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      if (name === 'employeeId') {
        const selectedEmployee = employees.find(emp => emp.id === parseInt(value, 10));
        setNewStaffAssignment(prev => ({
            ...prev,
            employeeId: value,
            projectRole: selectedEmployee ? selectedEmployee.role : ''
        }));
    } else {
        setNewStaffAssignment(prev => ({...prev, [name]: value }));
    }
  };

  const handleStartEditStaff = (staff: StaffAssignment) => {
    setEditingStaff(staff);
    setNewStaffAssignment({
        employeeId: String(staff.employeeId),
        projectRole: staff.projectRole,
        paymentAmount: String(staff.paymentAmount)
    });
  };

  const handleCancelEditStaff = () => {
    setEditingStaff(null);
    setNewStaffAssignment(emptyStaffAssignment);
  }
  
  const handleStaffFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const employeeId = parseInt(newStaffAssignment.employeeId, 10);
    const paymentAmount = parseFloat(newStaffAssignment.paymentAmount);
    
    if (!employeeId || !newStaffAssignment.projectRole || isNaN(paymentAmount) || paymentAmount < 0) {
        alert("Please select a staff member, provide a role, and a valid payment amount.");
        return;
    }
    
    const selectedEmployee = employees.find(emp => emp.id === employeeId);
    if (!selectedEmployee) return;

    const assignmentData = {
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployee.name,
        projectRole: newStaffAssignment.projectRole,
        paymentAmount
    };

    const updatedStaff = editingStaff
        ? project.staff.map(s => s.employeeId === editingStaff.employeeId ? assignmentData : s)
        : [...project.staff, assignmentData];

    onUpdateProject({...project, staff: updatedStaff});
    handleCancelEditStaff();
  };
  
  const handleRemoveStaff = (employeeId: number) => {
    if (window.confirm('Are you sure you want to remove this staff member from the project?')) {
        const updatedStaff = project.staff.filter(s => s.employeeId !== employeeId);
        onUpdateProject({ ...project, staff: updatedStaff });
    }
  };

  // --- Other Expense Handlers ---
  const handleExpenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewExpense(prev => ({ ...prev, [name]: value }));
  };

  const handleStartEditExpense = (expense: OtherExpense) => {
    setEditingExpense(expense);
    setNewExpense({
      description: expense.description,
      amount: String(expense.amount)
    });
  };

  const handleCancelEditExpense = () => {
    setEditingExpense(null);
    setNewExpense(emptyExpense);
  };

  const handleExpenseFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newExpense.amount);
    if (!newExpense.description || isNaN(amount) || amount <= 0) {
      alert("Please provide a valid description and amount.");
      return;
    }

    const updatedExpenses = editingExpense
      ? project.otherExpenses.map(exp => 
          exp.id === editingExpense.id ? { ...exp, description: newExpense.description, amount } : exp
        )
      : [...project.otherExpenses, { id: `exp-${Date.now()}`, description: newExpense.description, amount }];
    
    onUpdateProject({ ...project, otherExpenses: updatedExpenses });
    handleCancelEditExpense();
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      const updatedExpenses = project.otherExpenses.filter(exp => exp.id !== expenseId);
      onUpdateProject({ ...project, otherExpenses: updatedExpenses });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Project Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Project Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-2xl text-gray-800">{project.name}</h3>
                    <p className="text-md text-gray-600">Client: <span className="font-medium text-gray-700">{project.clientName}</span></p>
                    <p className="text-sm text-gray-500">{project.location}</p>
                    {project.boreholeType && (
                        <p className="text-sm text-blue-600 font-medium mt-1">{project.boreholeType}</p>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-sm">Start Date: <span className="font-semibold">{project.startDate}</span></p>
                    <p className="text-sm">Status: <span className="font-semibold">{project.status}</span></p>
                </div>
            </div>
             <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div>
                    <p className="text-xs text-gray-500 uppercase">Total Costs</p>
                    <p className="font-bold text-red-600 text-lg">GMD {totalProjectCost.toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 uppercase">Amount Received</p>
                    <p className="font-bold text-green-600 text-lg">GMD {project.amountReceived.toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 uppercase">Net Profit/Loss</p>
                    <p className={`font-bold text-lg ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        GMD {netProfit.toLocaleString()}
                    </p>
                </div>
            </div>
          </div>
          
          {/* Financials Summary */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Financial Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {/* Left side: Budget & Income */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Project Budget:</span>
                  <span className="font-bold text-lg text-blue-600">GMD {project.totalBudget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount Received:</span>
                  <span className="font-bold text-lg text-green-600">GMD {project.amountReceived.toLocaleString()}</span>
                </div>
              </div>
              {/* Right side: Costs */}
              <div className="space-y-2 border-l-0 md:border-l md:pl-8">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Material Costs:</span>
                  <span className="font-medium text-red-500">- GMD {totalMaterialCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Staff Costs:</span>
                  <span className="font-medium text-red-500">- GMD {totalStaffCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Other Expenses:</span>
                  <span className="font-medium text-red-500">- GMD {totalOtherCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2 mt-1">
                  <span className="font-semibold text-gray-700">Total Costs:</span>
                  <span className="font-bold text-red-600">- GMD {totalProjectCost.toLocaleString()}</span>
                </div>
              </div>
            </div>
            {/* Net Profit/Loss */}
            <div className={`mt-4 pt-4 border-t-2 flex justify-between items-center text-xl font-bold ${netProfit >= 0 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'} p-3 rounded-lg`}>
              <span>{netProfit >= 0 ? 'Net Profit:' : 'Net Loss:'}</span>
              <span>GMD {netProfit.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Materials */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Materials Purchased</h3>
              <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                          <tr>
                              <th className="px-4 py-2">Material</th>
                              <th className="px-4 py-2 text-center">Qty</th>
                              <th className="px-4 py-2 text-right">Unit Cost</th>
                              <th className="px-4 py-2 text-center">Actions</th>
                          </tr>
                      </thead>
                      <tbody>
                          {project.materials.map(mat => (
                              <tr key={mat.id} className="bg-white border-b hover:bg-gray-50">
                                  <td className="px-4 py-2 font-medium text-gray-900">{mat.name}</td>
                                  <td className="px-4 py-2 text-center">{mat.quantity}</td>
                                  <td className="px-4 py-2 text-right">GMD {mat.unitCost.toLocaleString()}</td>
                                  <td className="px-4 py-2 text-center space-x-2">
                                      <button onClick={() => handleStartEditMaterial(mat)} className="font-medium text-blue-600 hover:underline">Edit</button>
                                      <button onClick={() => handleDeleteMaterial(mat.id)} className="font-medium text-red-600 hover:underline">Delete</button>
                                  </td>
                              </tr>
                          ))}
                           {project.materials.length === 0 && (
                              <tr><td colSpan={4} className="text-center text-gray-500 py-4">No materials added yet.</td></tr>
                           )}
                      </tbody>
                  </table>
              </div>
              <form onSubmit={handleMaterialFormSubmit} className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-700 mb-2">{editingMaterial ? 'Edit Material' : 'Add Material'}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                      <div className="sm:col-span-2">
                          <label className="text-xs font-medium text-gray-600">Material Name</label>
                          <input type="text" name="name" value={newMaterial.name} onChange={handleMaterialChange} placeholder="e.g., PVC Pipe" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"/>
                      </div>
                       <div>
                          <label className="text-xs font-medium text-gray-600">Quantity</label>
                          <input type="number" name="quantity" value={newMaterial.quantity} onChange={handleMaterialChange} placeholder="1" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"/>
                      </div>
                       <div>
                          <label className="text-xs font-medium text-gray-600">Unit Cost</label>
                          <input type="number" name="unitCost" value={newMaterial.unitCost} onChange={handleMaterialChange} placeholder="0.00" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" step="0.01"/>
                      </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                      {editingMaterial && ( <button type="button" onClick={handleCancelEditMaterial} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>)}
                      <button type="submit" className={`px-4 py-2 text-white rounded-md ${editingMaterial ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'}`}>{editingMaterial ? 'Update' : 'Add Material'}</button>
                  </div>
              </form>
            </div>

            {/* Staff */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Assigned Staff</h3>
              <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                   <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                          <tr>
                              <th className="px-4 py-2">Name</th>
                              <th className="px-4 py-2">Role</th>
                              <th className="px-4 py-2 text-right">Payment</th>
                              <th className="px-4 py-2 text-center">Actions</th>
                          </tr>
                      </thead>
                      <tbody>
                          {project.staff.map(s => (
                              <tr key={s.employeeId} className="bg-white border-b hover:bg-gray-50">
                                  <td className="px-4 py-2 font-medium text-gray-900">{s.employeeName}</td>
                                  <td className="px-4 py-2">{s.projectRole}</td>
                                  <td className="px-4 py-2 text-right">GMD {s.paymentAmount.toLocaleString()}</td>
                                  <td className="px-4 py-2 text-center space-x-2">
                                     <button onClick={() => handleStartEditStaff(s)} className="font-medium text-blue-600 hover:underline">Edit</button>
                                     <button onClick={() => handleRemoveStaff(s.employeeId)} className="font-medium text-red-600 hover:underline">Remove</button>
                                  </td>
                              </tr>
                          ))}
                           {project.staff.length === 0 && (
                              <tr><td colSpan={4} className="text-center text-gray-500 py-4">No staff assigned yet.</td></tr>
                           )}
                      </tbody>
                  </table>
              </div>
               <form onSubmit={handleStaffFormSubmit} className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-700 mb-2">{editingStaff ? 'Edit Assignment' : 'Assign Staff'}</h4>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <div className="sm:col-span-1">
                          <label className="text-xs font-medium text-gray-600">Staff Member</label>
                          <select name="employeeId" value={newStaffAssignment.employeeId} onChange={handleStaffChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" disabled={!!editingStaff}>
                              <option value="">Select Employee...</option>
                              {editingStaff && <option key={editingStaff.employeeId} value={editingStaff.employeeId}>{editingStaff.employeeName}</option>}
                              {availableEmployees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                              ))}
                          </select>
                      </div>
                       <div>
                          <label className="text-xs font-medium text-gray-600">Project Role</label>
                          <input type="text" name="projectRole" value={newStaffAssignment.projectRole} onChange={handleStaffChange} placeholder="e.g. Site Supervisor" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"/>
                      </div>
                       <div>
                          <label className="text-xs font-medium text-gray-600">Payment (GMD)</label>
                          <input type="number" name="paymentAmount" value={newStaffAssignment.paymentAmount} onChange={handleStaffChange} placeholder="0.00" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" step="0.01"/>
                      </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                      {editingStaff && (<button type="button" onClick={handleCancelEditStaff} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>)}
                      <button type="submit" className={`px-4 py-2 text-white rounded-md ${editingStaff ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'}`}>{editingStaff ? 'Update Assignment' : 'Assign Staff'}</button>
                  </div>
              </form>
            </div>
          </div>
           {/* Other Expenses */}
           <div className="pt-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Other Expenses</h3>
              <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                          <tr>
                              <th className="px-4 py-2">Description</th>
                              <th className="px-4 py-2 text-right">Amount</th>
                              <th className="px-4 py-2 text-center">Actions</th>
                          </tr>
                      </thead>
                      <tbody>
                          {project.otherExpenses.map(exp => (
                              <tr key={exp.id} className="bg-white border-b hover:bg-gray-50">
                                  <td className="px-4 py-2 font-medium text-gray-900">{exp.description}</td>
                                  <td className="px-4 py-2 text-right">GMD {exp.amount.toLocaleString()}</td>
                                  <td className="px-4 py-2 text-center space-x-2">
                                      <button onClick={() => handleStartEditExpense(exp)} className="font-medium text-blue-600 hover:underline">Edit</button>
                                      <button onClick={() => handleDeleteExpense(exp.id)} className="font-medium text-red-600 hover:underline">Delete</button>
                                  </td>
                              </tr>
                          ))}
                           {project.otherExpenses.length === 0 && (
                              <tr><td colSpan={3} className="text-center text-gray-500 py-4">No other expenses added yet.</td></tr>
                           )}
                      </tbody>
                  </table>
              </div>
              <form onSubmit={handleExpenseFormSubmit} className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-700 mb-2">{editingExpense ? 'Edit Expense' : 'Add Expense'}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <div className="sm:col-span-2">
                          <label className="text-xs font-medium text-gray-600">Description</label>
                          <input type="text" name="description" value={newExpense.description} onChange={handleExpenseChange} placeholder="e.g., Permit Fee" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"/>
                      </div>
                       <div>
                          <label className="text-xs font-medium text-gray-600">Amount (GMD)</label>
                          <input type="number" name="amount" value={newExpense.amount} onChange={handleExpenseChange} placeholder="0.00" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" step="0.01"/>
                      </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                      {editingExpense && ( <button type="button" onClick={handleCancelEditExpense} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>)}
                      <button type="submit" className={`px-4 py-2 text-white rounded-md ${editingExpense ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'}`}>{editingExpense ? 'Update' : 'Add Expense'}</button>
                  </div>
              </form>
            </div>
        </div>

        <div className="flex justify-between items-center p-4 bg-gray-50 border-t">
          <button
              onClick={handleDeleteClick}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors"
          >
              Delete Project
          </button>
          <div className="flex items-center space-x-2">
            <button
                onClick={() => onEditProject(project)}
                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 transition-colors"
            >
                Edit Project
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailModal;