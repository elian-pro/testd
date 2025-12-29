import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';

const Inventory = () => {
    const [activeTab, setActiveTab] = useState('hunucma'); // 'hunucma' or 'zelma'
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [operationType, setOperationType] = useState('entrada'); // 'entrada' or 'salida'

    useEffect(() => {
        fetchInventory();
    }, [activeTab]);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/inventory/${activeTab}`);
            setInventory(res.data.inventory);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (item, type) => {
        setSelectedProduct(item);
        setOperationType(type);
        setModalOpen(true);
    };

    const getStockValue = (item) => {
        return activeTab === 'hunucma' ? item.stock_units : item.stock_boxes;
    };

    const getStockColor = (value) => {
        if (value === 0) return 'text-red-600';
        if (value < 10) return 'text-orange-600';
        return 'text-gray-800';
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Inventario</h1>
                <p className="text-gray-500 text-sm">Gestiona las existencias de Hunucmá y Zelma</p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-200">
                    <button
                        className={`flex-1 px-6 py-4 font-semibold text-sm focus:outline-none transition ${activeTab === 'hunucma'
                            ? 'bg-teal-50 border-b-2 border-teal-600 text-teal-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        onClick={() => setActiveTab('hunucma')}
                    >
                        🏭 Hunucmá (Unidades)
                    </button>
                    <button
                        className={`flex-1 px-6 py-4 font-semibold text-sm focus:outline-none transition ${activeTab === 'zelma'
                            ? 'bg-teal-50 border-b-2 border-teal-600 text-teal-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        onClick={() => setActiveTab('zelma')}
                    >
                        📦 Zelma (Cajas)
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Producto</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Código</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase">
                                        Existencia ({activeTab === 'hunucma' ? 'Unidades' : 'Cajas'})
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {inventory.map((item) => {
                                    const stockValue = getStockValue(item);
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {item.Product?.nombre}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                {activeTab === 'hunucma' ? item.Product?.codigo_hunucma : item.Product?.codigo_zelma}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-center text-2xl font-bold ${getStockColor(stockValue)}`}>
                                                {stockValue}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => openModal(item, 'entrada')}
                                                        className="bg-green-50 text-green-700 hover:bg-green-100 px-4 py-2 rounded-lg font-semibold transition border border-green-200"
                                                    >
                                                        ➕ Entrada
                                                    </button>
                                                    <button
                                                        onClick={() => openModal(item, 'salida')}
                                                        className="bg-red-50 text-red-700 hover:bg-red-100 px-4 py-2 rounded-lg font-semibold transition border border-red-200"
                                                    >
                                                        ➖ Salida
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {inventory.length === 0 && (
                            <div className="p-12 text-center">
                                <p className="text-gray-500">No hay productos en el inventario</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                title={`${operationType === 'entrada' ? '➕ Entrada' : '➖ Salida'} de Inventario - ${activeTab === 'hunucma' ? 'Hunucmá' : 'Zelma'}`}
            >
                <InventoryForm
                    location={activeTab}
                    item={selectedProduct}
                    operationType={operationType}
                    onClose={() => { setModalOpen(false); fetchInventory(); }}
                />
            </Modal>
        </div>
    );
};

const InventoryForm = ({ location, item, operationType, onClose }) => {
    const [cantidad, setCantidad] = useState('');
    const [motivo, setMotivo] = useState(operationType === 'entrada' ? 'entrada_compra' : 'salida_venta');
    const [notas, setNotas] = useState('');

    const currentStock = location === 'hunucma' ? item?.stock_units : item?.stock_boxes;
    const newStock = operationType === 'entrada'
        ? currentStock + parseInt(cantidad || 0)
        : currentStock - parseInt(cantidad || 0);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!cantidad || parseInt(cantidad) <= 0) {
            alert('Ingresa una cantidad válida');
            return;
        }

        if (operationType === 'salida' && parseInt(cantidad) > currentStock) {
            alert('No hay suficiente stock para realizar esta salida');
            return;
        }

        try {
            const delta = operationType === 'entrada' ? parseInt(cantidad) : -parseInt(cantidad);
            const payload = {
                product_id: item.product_id,
                motivo,
                notas
            };

            if (location === 'hunucma') {
                payload.delta_units = delta;
            } else {
                payload.delta_boxes = delta;
            }

            await api.post(`/inventory/${location}/adjust`, payload);
            alert(`${operationType === 'entrada' ? 'Entrada' : 'Salida'} registrada exitosamente`);
            onClose();
        } catch (err) {
            alert('Error al registrar movimiento: ' + (err.response?.data?.error || 'Error desconocido'));
            console.error(err);
        }
    };

    const motivosEntrada = [
        { value: 'entrada_compra', label: 'Compra de mercancía' },
        { value: 'entrada_devolucion', label: 'Devolución de cliente' },
        { value: 'entrada_ajuste', label: 'Ajuste de inventario' },
        { value: 'entrada_traspaso', label: 'Traspaso entre almacenes' }
    ];

    const motivosSalida = [
        { value: 'salida_venta', label: 'Venta / Pedido' },
        { value: 'salida_merma', label: 'Merma / Daño' },
        { value: 'salida_ajuste', label: 'Ajuste de inventario' },
        { value: 'salida_traspaso', label: 'Traspaso entre almacenes' }
    ];

    const motivos = operationType === 'entrada' ? motivosEntrada : motivosSalida;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-bold text-gray-800 mb-2">{item?.Product?.nombre}</p>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Stock actual:</span>
                    <span className="font-bold text-gray-800">{currentStock} {location === 'hunucma' ? 'unidades' : 'cajas'}</span>
                </div>
                {cantidad && (
                    <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-200">
                        <span className="text-gray-600">Stock después:</span>
                        <span className={`font-bold ${newStock < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {newStock} {location === 'hunucma' ? 'unidades' : 'cajas'}
                        </span>
                    </div>
                )}
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cantidad a {operationType === 'entrada' ? 'agregar' : 'retirar'}
                </label>
                <input
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="Ingresa la cantidad"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Motivo</label>
                <select
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
                >
                    {motivos.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notas (opcional)</label>
                <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
                    rows="3"
                    placeholder="Agrega notas adicionales..."
                />
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className={`px-6 py-2 rounded-lg font-bold text-white shadow-md transition ${operationType === 'entrada'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                        }`}
                >
                    Confirmar {operationType === 'entrada' ? 'Entrada' : 'Salida'}
                </button>
            </div>
        </form>
    );
};

export default Inventory;
