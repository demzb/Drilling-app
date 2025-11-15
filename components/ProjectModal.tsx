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

type ProjectFormData = Omit<Project, 'id' | 'user_id' | 'created_at' | 'amount_received' | 'materials' | 'staff' | 'other_expenses'>;

const emptyProject: ProjectFormData = {
    name: '',
    client_id: undefined,
    client_name: '',
    location: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: ProjectStatus.PLANNED,
    total_budget: 0,
    borehole_type: BoreholeType.SOLAR_MEDIUM,
};

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSave, project, clients, onSaveClient }) => {
  const [formData, setFormData] = useState<ProjectFormData>(emptyProject);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  useEffect(() => {
    if (project) {
      const { 
        id, user_id, created_at, amount_received, materials, staff, other_expenses, 
        ...editableData 
      } = project;
      setFormData({
        ...editableData,
        end_date: editableData.end_date || '',
        borehole_type: editableData.borehole_type || BoreholeType.SOLAR_MEDIUM,
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
        e.target.value = formData.client_id || '';
        return;
    }
    const selectedClient = clients.find(c => c.id === selectedClientId);
    setFormData(prev => ({
        ...prev,
        client_id: selectedClientId || undefined,
        client_name: selectedClient ? selectedClient.name : '',
    }));
  };

  const handleSaveNewClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'user_id'> & { id?: string }): Promise<Client | null> => {
    const newClient = await onSaveClient(clientData);
    if (newClient) {
        setFormData(prev => ({
            ...prev,
            client_id: newClient.id,
            client_name: newClient.name,
        }));
    }
    // Return the new client so the self-contained ClientModal can close itself.
    return newClient;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.client_id) {
      alert('Please fill in Project Name and select a Client.');
      return;
    }
    
    const projectToSave = {
        ...formData,
        total_budget: parseFloat(String(formData.total_budget)) || 0,
        amount_received: project ? project.amount_received : 0,
        materials: project ? project.materials : [],
        staff: project ? project.staff : [],
        other_expenses: project ? project.other_expenses : [],
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
                    <select name="client_id" value={formData.client_id || ''} onChange={handleClientChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required>
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
                    <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">End Date (Optional)</label>
                    <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Total Budget (GMD)</label>
                    <input type="number" name="total_budget" value={formData.total_budget} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="0.00" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Borehole Type</label>
                    <select name="borehole_type" value={formData.borehole_type} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
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
