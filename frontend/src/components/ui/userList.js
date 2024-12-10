import React, { useState, useEffect } from 'react';
import apiClient from '../../utilities/apiClient';

const AdminUserList = () => {
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [errorUsers, setErrorUsers] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        setErrorUsers(null);
        try {
            const response = await apiClient.get('/users/getAll');
            setUsers(response.data);
        } catch (err) {
            console.error('Error fetching users:', err);
            setErrorUsers(err.response?.data?.message || 'Failed to fetch users.');
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleDelete = async (userId) => {
        const confirmDelete = window.confirm('Are you sure you want to delete this user?');
        if (!confirmDelete) return;

        try {
            await apiClient.delete(`/users/deleteUser/${userId}`);
            // Remove the deleted user from the state
            setUsers((prevUsers) => prevUsers.filter((user) => user._id !== userId));
        } catch (err) {
            console.error('Error deleting user:', err);
            alert('Failed to delete user.');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">User Management</h2>
            {loadingUsers ? (
                <div className="flex items-center">
                    <svg className="animate-spin h-5 w-5 text-gray-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span className="text-gray-600">Loading users...</span>
                </div>
            ) : errorUsers ? (
                <p className="text-red-500 text-center">{errorUsers}</p>
            ) : users.length === 0 ? (
                <p className="text-center text-gray-600">No users found.</p>
            ) : (
                <ul className="space-y-2 overflow-auto">
                    {users.map((user) => (
                        <li key={user._id} className="flex justify-between items-center border-b border-gray-200 pb-2">
                            <div>
                                <span className="font-semibold">{user.username}</span> - <span className="text-gray-600">{user.email}</span>
                                {user.isAdmin && <span className="ml-2 text-xs text-white bg-green-500 rounded px-2 py-0.5">Admin</span>}
                            </div>
                            <button
                                onClick={() => handleDelete(user._id)}
                                className="text-red-600 hover:text-red-800"
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AdminUserList;
