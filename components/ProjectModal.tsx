import React, { useState, useEffect } from 'react';
import { Project, ProjectStatus, BoreholeType, Client } from '../types';
import ClientModal from './ClientModal';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Omit<Project, 'id' | 'created_at' | 'user_id'> & { id?: string }) => Promise<void>;
  project: Project | null;
  clients: Client[];
  onSaveClient: (clientData: Omit<Client, 'id' | 'created_at' | 'user_id'> & { id?: string }) => Promise<Client | null>;
}

type ProjectFormData = Omit<Project, 'id' | 'user_id' | 'created_at' | 'amountReceived' | 'materials' | 'staff' | 'otherExpenses'>;

const emptyProject: ProjectFormData = {
    name: '',
    clientId: undefined,
    clientName: '',
    location: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: ProjectStatus.PLANNED,
    totalBudget: 0,
    boreholeType: BoreholeType.SOLAR_MEDIUM,
};

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSave, project, clients, onSaveClient }) => {
  const [formData, setFormData] = useState<ProjectFormData>(emptyProject);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  useEffect(() => {
    if (project) {
      const { 
        id, user_id, created_at, amountReceived, materials, staff, otherExpenses, 
        ...editableData 
      } = project;
      setFormData({
        ...editableData,
        endDate: editableData.endDate || '',
        boreholeType: editableData.boreholeType || BoreholeType.SOLAR_MEDIUM,
      });
    } else {
      setFormData(emptyProject);
    }
  }, [project, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedClientId = e.target.value;
    if (selectedClientId === '--new--') {
        setIsClientModalOpen(true);
        e.target.value = formData.clientId || '';
        return;
    }
    const selectedClient = clients.find(c => c.id === selectedClientId);
    setFormData(prev => ({
        ...prev,
        clientId: selectedClientId || undefined,
        clientName: selectedClient ? selectedClient.name : '',
    }));
  };

  const handleSaveNewClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'user_id'> & { id?: string }) => {
    const newClient = await onSaveClient(clientData);
    if (newClient) {
        setFormData(prev => ({
            ...prev,
            clientId: newClient.id,
            clientName: newClient.name,
        }));
    }
    setIsClientModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.clientId) {
      alert('Please fill in Project Name and select a Client.');
      return;
    }
    
    const projectToSave = {
        ...formData,
        totalBudget: parseFloat(String(formData.totalBudget)) || 0,
        amountReceived: project ? project.amountReceived : 0,
        materials: project ? project.materials : [],
        staff: project ? project.staff : [],
        otherExpenses: project ? project.otherExpenses : [],
        ...(project && { id: project.id })
    };

    await onSave(projectToSave);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSave={handleSaveNewClient}
        clientToEdit={null}
      />
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800">{project ? 'Edit Project' : 'Add New Project'}</h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Project Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Client</label>
                    <select name="clientId" value={formData.clientId || ''} onChange={handleClientChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required>
                      <option value="">Select a client...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      <option value="--new--" className="font-bold text-blue-600">-- Add New Client --</option>
                    </select>
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input type="text" name="location" value={formData.location} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">End Date (Optional)</label>
                    <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Total Budget (GMD)</label>
                    <input type="number" name="totalBudget" value={formData.totalBudget} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="0.00" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Borehole Type</label>
                    <select name="boreholeType" value={formData.boreholeType} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                        {Object.values(BoreholeType).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                        {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>
          </div>

          <div className="flex justify-end items-center p-4 bg-gray-50 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md mr-2 hover:bg-gray-300">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{project ? 'Save Changes' : 'Create Project'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;