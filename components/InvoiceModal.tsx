import React, { useState, useEffect } from 'react';
import { Invoice, LineItem, InvoiceStatus, Project, InvoiceType, BoreholeType, Payment, Client } from '../types';
import ClientModal from './ClientModal';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Omit<Invoice, 'id' | 'created_at' | 'user_id'> & { id?: string }) => Promise<void>;
  invoiceToEdit: Invoice | null;
  nextInvoiceNumber: string;
  projects: Project[];
  clients: Client[];
  onSaveClient: (clientData: Omit<Client, 'id' | 'created_at' | 'user_id'> & { id?: string }) => Promise<Client | null>;
}

const emptyInvoice = {
      invoice_number: '',
      client_id: undefined,
      client_name: '',
      client_address: '',
      date: new Date().toISOString().split('T')[0],
      due_date: '',
      line_items: [{ id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0 }],
      notes: 'Thank you for your business. Please note that 75% of the total amount is payable upon receipt of this invoice, and the remaining 25% is due upon completion of the project. Payment can be made to the specified account.',
      tax_rate: 0,
      discount_amount: 0,
      project_id: undefined,
      project_name: undefined,
      status: InvoiceStatus.DRAFT,
      invoice_type: InvoiceType.INVOICE,
      payments: [],
      borehole_type: BoreholeType.SOLAR_MEDIUM,
};

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, onSave, invoiceToEdit, nextInvoiceNumber, projects, clients, onSaveClient }) => {
  const [invoice, setInvoice] = useState<Omit<Invoice, 'id' | 'user_id' | 'created_at'> & {id?: string}>(emptyInvoice);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (invoiceToEdit) {
      const { user_id, created_at, ...editableInvoice } = invoiceToEdit;
      setInvoice({
        ...editableInvoice,
        discount_amount: editableInvoice.discount_amount || 0,
        borehole_type: editableInvoice.borehole_type || BoreholeType.SOLAR_MEDIUM,
      });
    } else {
      setInvoice({
        ...emptyInvoice,
        invoice_number: nextInvoiceNumber,
      });
    }
  }, [invoiceToEdit, isOpen, nextInvoiceNumber]);


  useEffect(() => {
    const subtotal = invoice.line_items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const discount = parseFloat(String(invoice.discount_amount)) || 0;
    const discountedSubtotal = subtotal - discount;
    const taxAmount = discountedSubtotal * ((parseFloat(String(invoice.tax_rate)) || 0) / 100);
    setTotal(discountedSubtotal + taxAmount);
  }, [invoice.line_items, invoice.tax_rate, invoice.discount_amount]);


  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInvoice({ ...invoice, [name]: value });
  };
  
  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedProjectId = e.target.value;
      const selectedProject = projects.find(p => p.id === selectedProjectId);
      const projectClient = selectedProject ? clients.find(c => c.id === selectedProject.client_id) : null;

      setInvoice({
          ...invoice,
          project_id: selectedProjectId || undefined,
          project_name: selectedProject ? selectedProject.name : undefined,
          client_id: projectClient ? projectClient.id : invoice.client_id,
          client_name: projectClient ? projectClient.name : (selectedProject ? selectedProject.client_name : invoice.client_name),
          client_address: projectClient ? projectClient.address : invoice.client_address,
          borehole_type: selectedProject ? (selectedProject.borehole_type || BoreholeType.SOLAR_MEDIUM) : invoice.borehole_type,
      });
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedClientId = e.target.value;
      if (selectedClientId === '--new--') {
          setIsClientModalOpen(true);
          e.target.value = invoice.client_id || '';
          return;
      }
      const selectedClient = clients.find(c => c.id === selectedClientId);
      setInvoice({
          ...invoice,
          client_id: selectedClientId || undefined,
          client_name: selectedClient ? selectedClient.name : '',
          client_address: selectedClient ? selectedClient.address : '',
      });
  };
  
  const handleSaveNewClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'user_id'> & { id?: string }): Promise<Client | null> => {
    const newClient = await onSaveClient(clientData);
    if (newClient) {
        setInvoice(prev => ({
            ...prev,
            client_id: newClient.id,
            client_name: newClient.name,
            client_address: newClient.address,
        }));
    }
    // Return the new client so the self-contained ClientModal can close itself.
    return newClient;
  };

  const handleLineItemChange = (index: number, field: keyof LineItem, value: string | number) => {
    const newLineItems = [...invoice.line_items];
    const item = newLineItems[index];
    if (typeof item[field] === 'number') {
        (item as any)[field] = parseFloat(String(value)) || 0;
    } else {
        (item as any)[field] = value;
    }
    setInvoice({ ...invoice, line_items: newLineItems });
  };

  const addLineItem = () => {
    setInvoice({
      ...invoice,
      line_items: [...invoice.line_items, { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0 }],
    });
  };

  const removeLineItem = (index: number) => {
    const newLineItems = invoice.line_items.filter((_, i) => i !== index);
    setInvoice({ ...invoice, line_items: newLineItems });
  };

  const handleSave = async () => {
    if (!invoice.client_id) {
        alert("Please select a client for the invoice.");
        return;
    }
    await onSave({
        ...invoice,
        discount_amount: parseFloat(String(invoice.discount_amount)) || 0,
    });
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSave={handleSaveNewClient}
        clientToEdit={null}
      />
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">{invoiceToEdit ? 'Edit Invoice' : 'Create Invoice'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6 space-y-4 overflow-y-auto">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Link to Project</label>
              <select name="project_id" value={invoice.project_id || ''} onChange={handleProjectChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                  <option value="">Select a project (optional)</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Borehole Type</label>
                <select name="borehole_type" value={invoice.borehole_type} onChange={handleChange} disabled={!!invoice.project_id} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100">
                    {Object.values(BoreholeType).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="block text-sm font-medium text-gray-700">Client</label>
                <select name="client_id" value={invoice.client_id || ''} onChange={handleClientChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required disabled={!!invoice.project_id}>
                    <option value="">Select a client...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    <option value="--new--" className="font-bold text-blue-600">-- Add New Client --</option>
                </select>
                {invoice.project_id && <p className="text-xs text-gray-500 mt-1">Client is linked from the selected project.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Client Address</label>
              <textarea name="client_address" value={invoice.client_address} onChange={handleChange} rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="Client address will populate here"></textarea>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
              <input type="text" name="invoice_number" value={invoice.invoice_number} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 sm:text-sm" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Invoice Date</label>
              <input type="date" name="date" value={invoice.date} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input type="date" name="due_date" value={invoice.due_date} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
            </div>
          </div>

          <div className="pt-4">
            <h3 className="text-lg font-medium text-gray-800">Items</h3>
            <div className="space-y-2 mt-2">
              {invoice.line_items.map((item, index) => (
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
                      <select name="status" value={invoice.status} onChange={handleChange} disabled={!!invoiceToEdit && invoiceToEdit.status !== InvoiceStatus.DRAFT} className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm disabled:bg-gray-100 disabled:text-gray-500">
                          {Object.values(InvoiceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                   </div>
                   <div className="flex items-center">
                        <label className="text-sm font-medium text-gray-700 w-32">Discount (GMD)</label>
                        <input type="number" name="discount_amount" value={invoice.discount_amount || ''} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" placeholder="0.00" step="0.01"/>
                    </div>
                   <div className="flex items-center">
                      <label className="text-sm font-medium text-gray-700 w-32">Tax Rate (%)</label>
                      <input type="number" name="tax_rate" value={invoice.tax_rate} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" placeholder="0"/>
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