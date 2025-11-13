import React, { useState } from 'react';
import { Project, ProjectStatus, Employee } from '../types';
import ProjectModal from './ProjectModal';
import ProjectDetailModal from './ProjectDetailModal';

interface ProjectsProps {
  projects: Project[];
  employees: Employee[];
  onDeleteProject: (projectId: string) => void;
  onSaveProject: (project: Omit<Project, 'id'> & { id?: string }) => void;
  onUpdateProjectDetails: (project: Project) => void;
}

const Projects: React.FC<ProjectsProps> = ({ projects, employees, onDeleteProject, onSaveProject, onUpdateProjectDetails }) => {
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    const handleOpenAddModal = () => {
        setSelectedProject(null);
        setIsProjectModalOpen(true);
    };
    
    const handleOpenDetailModal = (project: Project) => {
        setSelectedProject(project);
        setIsDetailModalOpen(true);
    };

    const handleOpenEditModal = (project: Project) => {
        setSelectedProject(project);
        setIsDetailModalOpen(false);
        setIsProjectModalOpen(true);
    };

    const handleSaveProjectAndCloseModal = (project: Omit<Project, 'id'> & { id?: string }) => {
        onSaveProject(project);
        setIsProjectModalOpen(false);
    };

    const handleUpdateProjectDetailsAndRefresh = (updatedProject: Project) => {
        onUpdateProjectDetails(updatedProject);
        if (selectedProject && selectedProject.id === updatedProject.id) {
            setSelectedProject(updatedProject);
        }
    };

    const handleDeleteProjectAndCloseModal = (projectId: string) => {
        onDeleteProject(projectId);
        setIsDetailModalOpen(false);
        setSelectedProject(null);
    };
    
    const getStatusColor = (status: ProjectStatus) => {
        switch (status) {
            case ProjectStatus.COMPLETED: return 'border-green-500';
            case ProjectStatus.IN_PROGRESS: return 'border-blue-500';
            case ProjectStatus.ON_HOLD: return 'border-yellow-500';
            case ProjectStatus.PLANNED:
            default: return 'border-gray-300';
        }
    };

    return (
        <div className="space-y-6">
            <ProjectModal
                isOpen={isProjectModalOpen}
                onClose={() => setIsProjectModalOpen(false)}
                onSave={handleSaveProjectAndCloseModal}
                project={selectedProject}
            />
            {selectedProject && (
                <ProjectDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    project={selectedProject}
                    onUpdateProject={handleUpdateProjectDetailsAndRefresh}
                    employees={employees}
                    onDeleteProject={handleDeleteProjectAndCloseModal}
                    onEditProject={handleOpenEditModal}
                />
            )}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Projects Overview</h2>
                <button
                    onClick={handleOpenAddModal}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors shadow"
                >
                    Add New Project
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => (
                    <div key={project.id} className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 border-l-4 ${getStatusColor(project.status)}`}>
                        <div className="p-5">
                            <p className="text-sm text-gray-500">{project.clientName}</p>
                            <h3 className="font-bold text-lg text-gray-800 truncate">{project.name}</h3>
                            <div className="mb-4">
                                <p className="text-xs text-gray-400">{project.location}</p>
                                {project.boreholeType && (
                                    <p className="text-xs font-semibold text-blue-600 mt-1">{project.boreholeType}</p>
                                )}
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="font-medium text-gray-600">Status:</span>
                                    <span className="font-semibold text-gray-800">{project.status}</span>
                                </div>
                                 <div className="flex justify-between">
                                    <span className="font-medium text-gray-600">Budget:</span>
                                    <span className="font-semibold text-gray-800">GMD {project.totalBudget.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium text-gray-600">Received:</span>
                                    <span className="font-semibold text-green-600">GMD {project.amountReceived.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="mt-4">
                               <div className="w-full bg-gray-200 rounded-full h-2.5">
                                 <div className="bg-green-500 h-2.5 rounded-full" style={{width: `${project.totalBudget > 0 ? (project.amountReceived / project.totalBudget) * 100 : 0}%`}}></div>
                               </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-5 py-3 text-right">
                             <button onClick={() => handleOpenDetailModal(project)} className="font-medium text-blue-600 hover:underline">View Details</button>
                        </div>
                    </div>
                ))}
            </div>

             {projects.length === 0 && <p className="text-center text-gray-500 py-10">No projects yet. Add one to get started.</p>}
        </div>
    );
};

export default Projects;