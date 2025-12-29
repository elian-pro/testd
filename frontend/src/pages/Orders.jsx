import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterEstado, setFilterEstado] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Modals state
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Action states
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [cancelMotivo, setCancelMotivo] = useState('');

    // Edit details state
    const [orderDetails, setOrderDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [editedItems, setEditedItems] = useState([]);

    // Product list for adding items
    const [allProducts, setAllProducts] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState('');

    useEffect(() => {
        fetchOrders();
        fetchProducts();
    }, [filterEstado]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params = filterEstado ? `?estado=${filterEstado}` : '';
            const res = await api.get(`/orders${params}`);
            setOrders(res.data.orders);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products?activo=true');
            setAllProducts(res.data.products);
        } catch (err) {
            console.error('Error fetching products', err);
        }
    };

    const handleOpenDetails = async (order) => {
        setSelectedOrder(order);
        setShowDetailsModal(true);
        setLoadingDetails(true);
        setEditedItems([]);
        try {
            const res = await api.get(`/orders/${order.id}`);
            setOrderDetails(res.data.order);
            // Prepare items for editing (deep copy)
            setEditedItems(res.data.order.items.map(item => ({
                id: item.id,
                product_id: item.product_id,
                product_name: item.Product?.nombre || item.product_text,
                quantity_units: item.quantity_units,
                quantity_boxes: item.quantity_boxes,
                precio_unitario: item.precio_unitario,
                notas: item.notas || '',
                box_type: item.box_type_snapshot || item.Product?.box_type,
                units_per_box: item.units_per_box_snapshot || item.Product?.units_per_box
            })));
        } catch (err) {
            alert('Error al cargar detalles');
            setShowDetailsModal(false);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleAddItem = () => {
        if (!selectedProductId) return;

        const productToAdd = allProducts.find(p => p.id === parseInt(selectedProductId));
        if (!productToAdd) return;

        // Check if already exists
        const exists = editedItems.some(item => item.product_id === productToAdd.id);
        if (exists) {
            alert('El producto ya está en el pedido');
            return;
        }

        const newItem = {
            product_id: productToAdd.id,
            product_name: productToAdd.nombre,
            quantity_units: 0,
            quantity_boxes: 0,
            precio_unitario: productToAdd.precio_general,
            notas: '',
            box_type: productToAdd.box_type,
            units_per_box: productToAdd.units_per_box
        };

        setEditedItems([...editedItems, newItem]);
        setSelectedProductId('');
    };

    const handleUpdateItem = (index, field, value) => {
        const newItems = [...editedItems];
        newItems[index][field] = value;

        // Auto-calculate units if boxes change
        if (field === 'quantity_boxes') {
            const boxes = parseInt(value) || 0;
            const unitsPerBox = newItems[index].units_per_box || 0;
            const boxType = newItems[index].box_type;

            if (boxType === 'definida' && unitsPerBox > 0) {
                newItems[index].quantity_units = boxes * unitsPerBox;
            }
        }

        setEditedItems(newItems);
    };

    const handleRemoveItem = (index) => {
        if (window.confirm('¿Eliminar este producto del pedido?')) {
            const newItems = [...editedItems];
            newItems.splice(index, 1);
            setEditedItems(newItems);
        }
    };

    const handleSaveChanges = async () => {
        try {
            // Prepare payload
            const itemsPayload = editedItems.map(item => ({
                product_id: item.product_id,
                quantity_units: parseInt(item.quantity_units || 0),
                quantity_boxes: parseInt(item.quantity_boxes || 0),
                notas: item.notas
            }));

            await api.put(`/orders/${selectedOrder.id}/items`, {
                items: itemsPayload
            });

            alert('Pedido actualizado correctamente');
            setShowDetailsModal(false);
            fetchOrders(); // Refresh list to update totals
        } catch (err) {
            alert('Error al actualizar pedido: ' + (err.response?.data?.error || 'Error desconocido'));
        }
    };

    const handleConfirmOrder = async (order) => {
        try {
            await api.post(`/orders/${order.id}/confirm`);
            alert(`Pedido confirmado con folio: ${order.folio || 'generado'}`);
            fetchOrders();
            setShowConfirmModal(false);
        } catch (err) {
            alert('Error al confirmar: ' + (err.response?.data?.error || 'Error desconocido'));
        }
    };

    const handleReschedule = async () => {
        if (!rescheduleDate) {
            alert('Selecciona una nueva fecha');
            return;
        }
        try {
            await api.post(`/orders/${selectedOrder.id}/reschedule`, {
                nueva_fecha: rescheduleDate
            });
            alert('Pedido reprogramado');
            fetchOrders();
            setShowRescheduleModal(false);
            setRescheduleDate('');
        } catch (err) {
            alert('Error al reprogramar: ' + (err.response?.data?.error || 'Error desconocido'));
        }
    };

    const handleCancel = async () => {
        try {
            await api.patch(`/orders/${selectedOrder.id}/status`, {
                estado: 'cancelado',
                motivo: cancelMotivo
            });
            alert('Pedido cancelado');
            fetchOrders();
            setShowCancelModal(false);
            setCancelMotivo('');
        } catch (err) {
            alert('Error al cancelar: ' + (err.response?.data?.error || 'Error desconocido'));
        }
    };

    const getEstadoBadge = (estado) => {
        const styles = {
            borrador: 'bg-gray-100 text-gray-700',
            confirmado: 'bg-emerald-100 text-emerald-700',
            reprogramado: 'bg-amber-100 text-amber-700',
            cancelado: 'bg-red-100 text-red-700',
            cerrado: 'bg-slate-100 text-slate-700'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[estado] || 'bg-gray-100 text-gray-700'}`}>
                {estado.toUpperCase()}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Pedidos</h1>
                    <p className="text-gray-500 text-sm mt-1">Gestiona todos los pedidos del sistema</p>
                </div>
                <div className="flex gap-3">
                    <select
                        value={filterEstado}
                        onChange={e => setFilterEstado(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                        <option value="">Todos los estados</option>
                        <option value="borrador">Borrador</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="reprogramado">Reprogramado</option>
                        <option value="cancelado">Cancelado</option>
                        <option value="cerrado">Cerrado</option>
                    </select>
                    <Link
                        to="/orders/new"
                        className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold shadow-md transition"
                    >
                        + Nuevo Pedido
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Folio</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Cliente</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Sucursal</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Fecha Entrega</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase">Estado</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">Total</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {orders.map(order => (
                                <tr key={order.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="font-mono text-sm font-semibold text-gray-800">
                                                {order.folio || `BORRADOR-${order.id}`}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                        {order.cliente?.nombre_comercial || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {order.sucursal?.nombre_sucursal || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {order.fecha_entrega || 'Pendiente'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {getEstadoBadge(order.estado)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-800">
                                        ${parseFloat(order.total || 0).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenDetails(order)}
                                                className="text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded hover:bg-blue-50"
                                            >
                                                Ver / Editar
                                            </button>

                                            {order.estado === 'borrador' && (
                                                <button
                                                    onClick={() => { setSelectedOrder(order); setShowConfirmModal(true); }}
                                                    className="text-teal-600 hover:text-teal-800 font-semibold px-2 py-1 rounded hover:bg-teal-50"
                                                >
                                                    Confirmar
                                                </button>
                                            )}
                                            {order.estado === 'confirmado' && (
                                                <>
                                                    <button
                                                        onClick={() => { setSelectedOrder(order); setShowRescheduleModal(true); }}
                                                        className="text-amber-600 hover:text-amber-800 font-semibold px-2 py-1 rounded hover:bg-amber-50"
                                                    >
                                                        Reprogramar
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedOrder(order); setShowCancelModal(true); }}
                                                        className="text-red-600 hover:text-red-800 font-semibold px-2 py-1 rounded hover:bg-red-50"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </>
                                            )}
                                            {order.estado === 'reprogramado' && (
                                                <button
                                                    onClick={() => { setSelectedOrder(order); setShowCancelModal(true); }}
                                                    className="text-red-600 hover:text-red-800 font-semibold px-2 py-1 rounded hover:bg-red-50"
                                                >
                                                    Cancelar
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {orders.length === 0 && (
                        <div className="p-12 text-center">
                            <p className="text-gray-500 mb-4">No hay pedidos para mostrar</p>
                            <Link to="/orders/new" className="text-teal-600 font-semibold hover:underline">
                                Crear el primero
                            </Link>
                        </div>
                    )}
                </div>
            )}

            {/* Details Modal */}
            <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} title={`Detalles del Pedido ${selectedOrder?.folio || ''}`}>
                {loadingDetails ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Info Header */}
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg text-sm">
                            <div>
                                <p className="text-gray-500">Cliente</p>
                                <p className="font-semibold">{orderDetails?.cliente?.nombre_comercial}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Sucursal</p>
                                <p className="font-semibold">{orderDetails?.sucursal?.nombre_sucursal}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Estado</p>
                                <p className="font-semibold">{orderDetails?.estado?.toUpperCase()}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Total</p>
                                <p className="font-bold text-teal-700">${parseFloat(orderDetails?.total || 0).toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Add Item Section (Only for Drafts) */}
                        {orderDetails?.estado === 'borrador' && (
                            <div className="flex gap-2">
                                <select
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                    value={selectedProductId}
                                    onChange={(e) => setSelectedProductId(e.target.value)}
                                >
                                    <option value="">-- Seleccionar producto para agregar --</option>
                                    {allProducts.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.nombre} ({p.codigo_hunucma} / {p.codigo_zelma}) - ${p.precio_general}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleAddItem}
                                    className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-700"
                                >
                                    Agregar
                                </button>
                            </div>
                        )}

                        {/* Items Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">Unidades (Sueltas)</th>
                                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">Cajas</th>
                                        <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">Billing Total Units</th>
                                        <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                                        {orderDetails?.estado === 'borrador' && (
                                            <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase"></th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {editedItems.map((item, index) => {
                                        // Visual subtotal
                                        const units = parseInt(item.quantity_units || 0);
                                        const boxes = parseInt(item.quantity_boxes || 0);
                                        let totalDisplayUnits = units;
                                        if (item.box_type === 'definida' && item.units_per_box > 0) {
                                            totalDisplayUnits = (boxes * item.units_per_box) + units;
                                        }
                                        const subtotal = item.precio_unitario * totalDisplayUnits;

                                        return (
                                            <tr key={index}>
                                                <td className="px-2 py-3 text-sm">
                                                    <div className="font-medium text-gray-900">{item.product_name}</div>
                                                    <div className="text-xs text-gray-500">${item.precio_unitario}</div>
                                                </td>
                                                <td className="px-2 py-3 text-center">
                                                    {orderDetails?.estado === 'borrador' ? (
                                                        <input
                                                            type="number"
                                                            className="w-16 border rounded text-center p-1"
                                                            value={item.quantity_units}
                                                            onChange={(e) => handleUpdateItem(index, 'quantity_units', e.target.value)}
                                                            min="0"
                                                        />
                                                    ) : (
                                                        <span className="text-sm">{item.quantity_units}</span>
                                                    )}
                                                </td>
                                                <td className="px-2 py-3 text-center">
                                                    {orderDetails?.estado === 'borrador' ? (
                                                        <input
                                                            type="number"
                                                            className="w-16 border rounded text-center p-1"
                                                            value={item.quantity_boxes}
                                                            onChange={(e) => handleUpdateItem(index, 'quantity_boxes', e.target.value)}
                                                            min="0"
                                                            disabled={item.box_type !== 'definida'}
                                                        />
                                                    ) : (
                                                        <span className="text-sm">{item.quantity_boxes}</span>
                                                    )}
                                                </td>
                                                <td className="px-2 py-3 text-right text-sm text-gray-500">
                                                    {totalDisplayUnits}
                                                </td>
                                                <td className="px-2 py-3 text-right text-sm font-semibold">
                                                    ${subtotal.toFixed(2)}
                                                </td>
                                                {orderDetails?.estado === 'borrador' && (
                                                    <td className="px-2 py-3 text-right">
                                                        <button
                                                            onClick={() => handleRemoveItem(index)}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                            >
                                Cerrar
                            </button>
                            {orderDetails?.estado === 'borrador' && (
                                <button
                                    onClick={handleSaveChanges}
                                    className="bg-teal-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-teal-700"
                                >
                                    Guardar Cambios
                                </button>
                            )}
                        </div>
                    </div>
                )
                }
            </Modal >

            {/* Confirm Modal */}
            < Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="Confirmar Pedido" >
                <div className="space-y-4">
                    <p className="text-gray-700">
                        ¿Estás seguro de confirmar este pedido? Se generará un folio y se calculará la fecha de entrega automáticamente.
                    </p>
                    {selectedOrder && (
                        <div className="bg-gray-50 p-4 rounded-lg text-sm">
                            <p><strong>Cliente:</strong> {selectedOrder.cliente?.nombre_comercial}</p>
                            <p><strong>Sucursal:</strong> {selectedOrder.sucursal?.nombre_sucursal}</p>
                            <p><strong>Total:</strong> ${parseFloat(selectedOrder.total || 0).toFixed(2)}</p>
                        </div>
                    )}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            onClick={() => setShowConfirmModal(false)}
                            className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => handleConfirmOrder(selectedOrder)}
                            className="bg-teal-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-teal-700"
                        >
                            Confirmar Pedido
                        </button>
                    </div>
                </div>
            </Modal >

            {/* Reschedule Modal */}
            < Modal isOpen={showRescheduleModal} onClose={() => setShowRescheduleModal(false)} title="Reprogramar Pedido" >
                <div className="space-y-4">
                    <p className="text-gray-700">Selecciona la nueva fecha de entrega:</p>
                    <input
                        type="date"
                        value={rescheduleDate}
                        onChange={e => setRescheduleDate(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            onClick={() => setShowRescheduleModal(false)}
                            className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleReschedule}
                            className="bg-amber-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-amber-700"
                        >
                            Reprogramar
                        </button>
                    </div>
                </div>
            </Modal >

            {/* Cancel Modal */}
            < Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancelar Pedido" >
                <div className="space-y-4">
                    <p className="text-gray-700">Indica el motivo de cancelación:</p>
                    <textarea
                        value={cancelMotivo}
                        onChange={e => setCancelMotivo(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                        rows="3"
                        placeholder="Motivo de cancelación..."
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            onClick={() => setShowCancelModal(false)}
                            className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                        >
                            Volver
                        </button>
                        <button
                            onClick={handleCancel}
                            className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700"
                        >
                            Cancelar Pedido
                        </button>
                    </div>
                </div>
            </Modal >
        </div >
    );
};

export default Orders;
