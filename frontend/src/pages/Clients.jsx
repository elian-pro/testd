import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { useAuthStore } from '../store/useAuthStore';

const Clients = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [isBranchModalOpen, setBranchModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [expandedClient, setExpandedClient] = useState(null);
    const [users, setUsers] = useState([]);

    // Auth state to check role
    const { user } = useAuthStore();
    const isAdmin = user?.rol === 'admin';

    useEffect(() => {
        fetchClients();
        if (isAdmin) {
            fetchUsers();
        }
    }, [isAdmin]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data.users);
        } catch (err) {
            console.error("Error fetching users", err);
        }
    };

    const fetchClients = async () => {
        try {
            setLoading(true);
            const res = await api.get('/clients');
            setClients(res.data.clients);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const openBranchModal = (client) => {
        setSelectedClient(client);
        setBranchModalOpen(true);
    };

    const openEditModal = (client) => {
        setSelectedClient(client);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedClient(null);
        fetchClients();
    };

    const toggleExpand = (clientId) => {
        setExpandedClient(expandedClient === clientId ? null : clientId);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
                    <p className="text-gray-500 text-sm mt-1">Administra clientes y sus sucursales</p>
                </div>
                <button
                    onClick={() => { setSelectedClient(null); setModalOpen(true); }}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow-md transition-all hover:scale-105"
                >
                    + Nuevo Cliente
                </button>
            </div>

            {loading ? (
                <table className="min-w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nombre del Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">RFC</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Sucursales</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.map((client) => (
                            <React.Fragment key={client.id}>
                                <tr
                                    className={`border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${expandedClient === client.id ? 'bg-teal-50' : ''
                                        }`}
                                    onClick={() => toggleExpand(client.id)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {client.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="text-sm font-semibold text-gray-900">{client.nombre_comercial}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                                        {client.rfc || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-700">
                                            {client.sucursales?.length || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openEditModal(client);
                                                }}
                                                className="text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded hover:bg-blue-50 transition"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openBranchModal(client);
                                                }}
                                                className="text-teal-600 hover:text-teal-800 font-semibold px-2 py-1 rounded hover:bg-teal-50 transition"
                                            >
                                                Sucursales
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                {expandedClient === client.id && client.sucursales && client.sucursales.length > 0 && (
                                    <tr className="bg-gray-50">
                                        <td colSpan="5" className="px-6 py-4">
                                            <div className="pl-8 space-y-2">
                                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Sucursales:</h4>
                                                {client.sucursales.map((branch) => (
                                                    <div key={branch.id} className="bg-white p-3 rounded-lg border border-gray-200 text-sm">
                                                        <div className="font-semibold text-gray-800">{branch.nombre_sucursal}</div>
                                                        <div className="text-gray-600 mt-1">{branch.direccion}</div>
                                                        <div className="text-gray-500 text-xs mt-1">
                                                            {branch.colonia}, {branch.ciudad} - CP: {branch.codigo_postal}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
                        {clients.length === 0 && (
                <div className="p-12 text-center">
                    <p className="text-gray-500 mb-4">No hay clientes registrados.</p>
                    <button onClick={() => setModalOpen(true)} className="text-teal-600 font-semibold hover:underline">
                        Crear el primero
                    </button>
                </div>
            )}
        </div>
    )
}

            )}

            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={selectedClient ? "Editar Cliente" : "Nuevo Cliente"}>
                <ClientForm
                    onClose={handleCloseModal}
                    clientToEdit={selectedClient}
                    users={users}
                    isAdmin={isAdmin}
                />
            </Modal>

            <Modal
                isOpen={isBranchModalOpen}
                onClose={() => { setBranchModalOpen(false); setSelectedClient(null); }}
                title={`Sucursales de ${selectedClient?.nombre_comercial || 'Cliente'}`}
            >
                <BranchManager client={selectedClient} onUpdate={fetchClients} />
            </Modal>
        </div >
    );
};

const ClientForm = ({ onClose, clientToEdit, users, isAdmin }) => {
    const [formData, setFormData] = useState({
        nombre_comercial: '',
        tipo_salida: 'salida_normal',
        rfc: '',
        email: '',
        telefono: '',
        vendedor_id: ''
    });

    useEffect(() => {
        if (clientToEdit) {
            setFormData({
                nombre_comercial: clientToEdit.nombre_comercial || '',
                tipo_salida: clientToEdit.tipo_salida || 'salida_normal',
                rfc: clientToEdit.rfc || '',
                email: clientToEdit.email || '',
                telefono: clientToEdit.telefono || '',
                vendedor_id: clientToEdit.vendedor_id || ''
            });
        }
    }, [clientToEdit]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (clientToEdit) {
                await api.put(`/clients/${clientToEdit.id}`, formData);
            } else {
                await api.post('/clients', formData);
            }
            onClose();
        } catch (err) {
            alert('Error al guardar cliente: ' + (err.response?.data?.error || err.message));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre Comercial</label>
                <input
                    name="nombre_comercial"
                    value={formData.nombre_comercial}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                    placeholder="Tienda El Ejemplo"
                    required
                />
            </div>
            <div className="grid grid-cols-2 gap-5">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">RFC</label>
                    <input
                        name="rfc"
                        value={formData.rfc}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition font-mono"
                        placeholder="XAXX010101000"
                        maxLength="13"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo Salida</label>
                    <select
                        name="tipo_salida"
                        value={formData.tipo_salida}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition bg-white"
                    >
                        <option value="salida_normal">Salida Normal</option>
                        <option value="primera_salida">Primera Salida</option>
                        <option value="pickup">Pickup</option>
                    </select>
                </div>
            </div>
            <div className="flex justify-end pt-4 gap-3">
                <button type="button" onClick={onClose} className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition">
                    Cancelar
                </button>
                <button type="submit" className="bg-teal-600 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-teal-700 transition transform active:scale-95">
                    Guardar Cliente
                </button>
            </div>
        </form>
    );
};

const BranchManager = ({ client, onUpdate }) => {
    const [branches, setBranches] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [formData, setFormData] = useState({
        nombre_sucursal: '',
        direccion: '',
        colonia: '',
        ciudad: '',
        codigo_postal: '',
        telefono: '',
        contacto_nombre: ''
    });

    useEffect(() => {
        if (client) {
            setBranches(client.sucursales || []);
        }
    }, [client]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEdit = (branch) => {
        setEditingBranch(branch);
        setFormData({
            nombre_sucursal: branch.nombre_sucursal || '',
            direccion: branch.direccion || '',
            colonia: branch.colonia || '',
            ciudad: branch.ciudad || '',
            codigo_postal: branch.codigo_postal || '',
            telefono: branch.telefono || '',
            contacto_nombre: branch.contacto_nombre || ''
        });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBranch) {
                alert('Funcionalidad de edición pendiente en backend');
            } else {
                await api.post(`/clients/${client.id}/branches`, formData);
            }
            setShowForm(false);
            setEditingBranch(null);
            setFormData({
                nombre_sucursal: '',
                direccion: '',
                colonia: '',
                ciudad: '',
                codigo_postal: '',
                telefono: '',
                contacto_nombre: ''
            });
            onUpdate();
        } catch (err) {
            alert('Error al guardar sucursal');
        }
    };

    const cancelForm = () => {
        setShowForm(false);
        setEditingBranch(null);
        setFormData({
            nombre_sucursal: '',
            direccion: '',
            colonia: '',
            ciudad: '',
            codigo_postal: '',
            telefono: '',
            contacto_nombre: ''
        });
    };

    if (!client) return null;

    return (
        <div className="space-y-4">
            {branches.length > 0 ? (
                <div className="space-y-3 mb-4">
                    {branches.map((branch) => (
                        <div key={branch.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-800">{branch.nombre_sucursal}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{branch.direccion}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {branch.colonia}, {branch.ciudad} - CP: {branch.codigo_postal}
                                    </p>
                                    {branch.contacto_nombre && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Contacto: {branch.contacto_nombre} {branch.telefono && `- ${branch.telefono}`}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleEdit(branch)}
                                    className="ml-4 text-teal-600 hover:text-teal-800 text-sm font-semibold px-3 py-1 rounded hover:bg-teal-50 transition"
                                >
                                    Editar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500 text-sm text-center py-4">No hay sucursales registradas</p>
            )}

            {!showForm ? (
                <button
                    onClick={() => setShowForm(true)}
                    className="w-full bg-teal-50 hover:bg-teal-100 text-teal-700 py-3 rounded-lg font-semibold transition border border-teal-200"
                >
                    + Agregar Sucursal
                </button>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
                    <h4 className="font-bold text-gray-800">{editingBranch ? 'Editar' : 'Nueva'} Sucursal</h4>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre de la Sucursal</label>
                        <input
                            name="nombre_sucursal"
                            value={formData.nombre_sucursal}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                            placeholder="Sucursal Centro"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Dirección</label>
                        <input
                            name="direccion"
                            value={formData.direccion}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                            placeholder="Calle Principal #123"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Colonia</label>
                            <input
                                name="colonia"
                                value={formData.colonia}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                                placeholder="Centro"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Ciudad</label>
                            <input
                                name="ciudad"
                                value={formData.ciudad}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                                placeholder="Mérida"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Código Postal</label>
                            <input
                                name="codigo_postal"
                                value={formData.codigo_postal}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                                placeholder="97000"
                                maxLength="5"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Teléfono</label>
                            <input
                                name="telefono"
                                value={formData.telefono}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                                placeholder="9991234567"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre del Contacto</label>
                        <input
                            name="contacto_nombre"
                            value={formData.contacto_nombre}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                            placeholder="Juan Pérez"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={cancelForm}
                            className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="bg-teal-600 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-teal-700 transition transform active:scale-95"
                        >
                            {editingBranch ? 'Actualizar' : 'Guardar'} Sucursal
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default Clients;
