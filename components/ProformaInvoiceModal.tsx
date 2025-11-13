import React, { useState, useEffect } from 'react';
import { Invoice, LineItem, InvoiceStatus, Project, InvoiceType, BoreholeType } from '../types';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Omit<Invoice, 'id'> & { id?: string }) => void;
  invoiceToEdit: Invoice | null;
  nextInvoiceNumber: string;
  projects: Project[];
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, onSave, invoiceToEdit, nextInvoiceNumber, projects }) => {
  const getInitialState = () => {
    if (invoiceToEdit) {
      return { 
        ...invoiceToEdit,
        boreholeType: invoiceToEdit.boreholeType || BoreholeType.SOLAR_MEDIUM,
      };
    }
    return {
      invoiceNumber: nextInvoiceNumber,
      clientName: '',
      clientAddress: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      lineItems: [{ id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0 }],
      notes: 'Thank you for your business. Please make payment to the specified account.',
      taxRate: 0,
      projectId: undefined,
      projectName: undefined,
      status: InvoiceStatus.DRAFT,
      invoiceType: InvoiceType.PROFORMA,
      amountPaid: 0,
      boreholeType: BoreholeType.SOLAR_MEDIUM,
    };
  };

  const [invoice, setInvoice] = useState<Omit<Invoice, 'id'> & {id?: string}>(getInitialState);
  
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setInvoice(getInitialState());
  }, [invoiceToEdit, isOpen, nextInvoiceNumber]);


  useEffect(() => {
    const newSubtotal = invoice.lineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const taxAmount = newSubtotal * (invoice.taxRate / 100);
    setTotal(newSubtotal + taxAmount);
  }, [invoice.lineItems, invoice.taxRate]);


  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInvoice({ ...invoice, [name]: value });
  };
  
  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedProjectId = e.target.value;
      const selectedProject = projects.find(p => p.id === selectedProjectId);
      setInvoice({
          ...invoice,
          projectId: selectedProjectId || undefined,
          projectName: selectedProject ? selectedProject.name : undefined,
          clientName: selectedProject ? selectedProject.clientName : invoice.clientName,
          boreholeType: selectedProject ? (selectedProject.boreholeType || BoreholeType.SOLAR_MEDIUM) : invoice.boreholeType,
      });
  };
  
  const handleLineItemChange = (index: number, field: keyof LineItem, value: string | number) => {
    const newLineItems = [...invoice.lineItems];
    const item = newLineItems[index];
    if (typeof item[field] === 'number') {
        (item as any)[field] = value === '' ? '' : parseFloat(value as string) || 0;
    } else {
        (item as any)[field] = value;
    }
    setInvoice({ ...invoice, lineItems: newLineItems });
  };

  const addLineItem = () => {
    setInvoice({
      ...invoice,
      lineItems: [...invoice.lineItems, { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0 }],
    });
  };

  const removeLineItem = (index: number) => {
    const newLineItems = invoice.lineItems.filter((_, i) => i !== index);
    setInvoice({ ...invoice, lineItems: newLineItems });
  };

  const handleSave = () => {
    onSave({
      ...invoice,
      amountPaid: parseFloat(String(invoice.amountPaid)) || 0
    });
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">{invoiceToEdit ? 'Edit Invoice' : 'Create Invoice'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6 space-y-4 overflow-y-auto">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Link to Project</label>
              <select name="projectId" value={invoice.projectId || ''} onChange={handleProjectChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                  <option value="">Select a project (optional)</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Invoice Type</label>
              <select name="invoiceType" value={invoice.invoiceType} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                  <option value={InvoiceType.PROFORMA}>{InvoiceType.PROFORMA}</option>
                  <option value={InvoiceType.INVOICE}>{InvoiceType.INVOICE}</option>
              </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Borehole Type</label>
                <select name="boreholeType" value={invoice.boreholeType} onChange={handleChange} disabled={!!invoice.projectId} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100">
                    {Object.values(BoreholeType).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="block text-sm font-medium text-gray-700">Client Name</label>
                <input type="text" name="clientName" value={invoice.clientName} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="e.g., John Doe" required/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Client Address</label>
              <textarea name="clientAddress" value={invoice.clientAddress} onChange={handleChange} rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="e.g., 123 Main St, City, Country"></textarea>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
              <input type="text" name="invoiceNumber" value={invoice.invoiceNumber} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 sm:text-sm" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Invoice Date</label>
              <input type="date" name="date" value={invoice.date} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input type="date" name="dueDate" value={invoice.dueDate} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
            </div>
          </div>

          <div className="pt-4">
            <h3 className="text-lg font-medium text-gray-800">Items</h3>
            <div className="space-y-2 mt-2">
              {invoice.lineItems.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                  <input type="text" placeholder="Description" value={item.description} onChange={(e) => handleLineItemChange(index, 'description', e.target.value)} className="col-span-6 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"/>
                  <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)} className="col-span-2 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"/>
                  <input type="number" placeholder="Unit Price" value={item.unitPrice} onChange={(e) => handleLineItemChange(index, 'unitPrice', e.target.value)} className="col-span-2 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"/>
                  <p className="col-span-1 text-right text-sm text-gray-600">{(item.quantity * item.unitPrice).toFixed(2)}</p>
                  <button onClick={() => removeLineItem(index)} className="col-span-1 text-red-500 hover:text-red-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addLineItem} className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add Item</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea name="notes" value={invoice.notes} onChange={handleChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"></textarea>
              </div>
              <div className="space-y-2">
                   <div className="flex items-center">
                      <label className="text-sm font-medium text-gray-700 w-32">Status</label>
                      <select name="status" value={invoice.status} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm">
                          {Object.values(InvoiceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                   </div>
                   <div className="flex items-center">
                      <label className="text-sm font-medium text-gray-700 w-32">Amount Paid (GMD)</label>
                      <input type="number" name="amountPaid" value={invoice.amountPaid} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" placeholder="0.00"/>
                   </div>
                   <div className="flex items-center">
                      <label className="text-sm font-medium text-gray-700 w-32">Tax Rate (%)</label>
                      <input type="number" name="taxRate" value={invoice.taxRate} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" placeholder="0"/>
                   </div>
                   <div className="flex justify-between items-center pt-2 border-t mt-2">
                       <span className="text-lg font-semibold text-gray-800">Total</span>
                       <span className="text-lg font-semibold text-gray-800">GMD {total.toFixed(2)}</span>
                   </div>
              </div>
          </div>
        </div>

        <div className="flex justify-end items-center p-4 bg-gray-50 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md mr-2 hover:bg-gray-300">Cancel</button>
          <button type="button" onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{invoiceToEdit ? 'Save Changes' : 'Create Invoice'}</button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;