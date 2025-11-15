import React, { useState } from 'react';
import { Client } from '../types';
import ClientModal from './ClientModal';
import ConfirmationModal from './ConfirmationModal';

interface ClientsProps {
  clients: Client[];
  onSaveClient: (client: Omit<Client, 'id' | 'created_at' | 'user_id'> & { id?: string }) => Promise<Client | null>;
  onDeleteClient: (clientId: string) => void;
}

const Clients: React.FC<ClientsProps> = ({ clients, onSaveClient, onDeleteClient }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const handleOpenAddModal = () => {
    setClientToEdit(null);
    setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (client: Client) => {
    setClientToEdit(client);
    setIsModalOpen(true);
  };
  
  const handleDeleteRequest = (client: Client) => {
    setClientToDelete(client);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (clientToDelete) {
      onDeleteClient(clientToDelete.id);
      setIsConfirmModalOpen(false);
      setClientToDelete(null);
    }
  };

  return (
    <>
      <ClientModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveClient}
        clientToEdit={clientToEdit}
      />
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Client"
        message={
          <>
            Are you sure you want to delete "<strong>{clientToDelete?.name}</strong>"? This will unlink them from all associated projects and invoices but will not delete those records.
          </>
        }
      />
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-700">Client Directory</h3>
          <button onClick={handleOpenAddModal} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors">
            Add Client
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Name</th>
                <th scope="col" className="px-6 py-3">Contact Person</th>
                <th scope="col" className="px-6 py-3">Contact Info</th>
                <th scope="col" className="px-6 py-3">Address</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.length > 0 ? clients.map((client) => (
                <tr key={client.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {client.name}
                  </td>
                  <td className="px-6 py-4">{client.contact_person || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <div>{client.email}</div>
                    <div className="text-gray-400">{client.phone}</div>
                  </td>
                  <td className="px-6 py-4">{client.address}</td>
                  <td className="px-6 py-4 text-right space-x-4">
                    <button onClick={() => handleOpenEditModal(client)} className="font-medium text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDeleteRequest(client)} className="font-medium text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              )) : (
                 <tr>
                    <td colSpan={5} className="text-center text-gray-500 py-10">
                        No clients found. Add a client to get started.
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

export default Clients;