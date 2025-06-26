import React from 'react';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import UsersAdmin from './AdminUsers';
import ProjectsAdmin from './AdminProjects';
import WebhookManager from './WebhookManager';

const AdminPanel = () => {
    return (
        <div className="admin-panel-container flex">
            <div className="text-white w-48 p-4 flex flex-col">
                <h1 className="text-lg font-bold text-gray-800 mb-4 mt-2">Admin Dashboard</h1>
                <ul className="flex flex-col flex-1 justify-start">
                    <li className="w-full">
                        <NavLink 
                            to="users" 
                            className={({ isActive }) =>
                                isActive ? "block w-full text-white bg-green-500 px-4 py-2 rounded-md" 
                                         : "block w-full text-gray-800 px-4 py-2 hover:bg-gray-200 hover:text-gray-800 rounded-md"}
                        >
                            Users
                        </NavLink>
                    </li>
                    <li className="w-full mt-2">
                        <NavLink 
                            to="projects" 
                            className={({ isActive }) =>
                                isActive ? "block w-full text-white bg-green-500 px-4 py-2 rounded-md" 
                                         : "block w-full text-gray-800 px-4 py-2 hover:bg-gray-200 hover:text-gray-800 rounded-md"}
                        >
                            Projects
                        </NavLink>
                    </li>
                    <li className="w-full mt-2">
                        <NavLink 
                            to="webhooks" 
                            className={({ isActive }) =>
                                isActive ? "block w-full text-white bg-green-500 px-4 py-2 rounded-md" 
                                         : "block w-full text-gray-800 px-4 py-2 hover:bg-gray-200 hover:text-gray-800 rounded-md"}
                        >
                            Webhooks Stripe
                        </NavLink>
                    </li>
                </ul>
            </div>
            <div className="content flex-grow p-4">
                <Routes>
                    <Route path="/" element={<Navigate replace to="users" />} />
                    <Route path="users" element={<UsersAdmin />} />
                    <Route path="projects" element={<ProjectsAdmin />} />
                    <Route path="webhooks" element={<WebhookManager />} />
                </Routes>
            </div>
        </div>
    );
};

export default AdminPanel;
