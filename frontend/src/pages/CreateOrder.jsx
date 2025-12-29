import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CreateOrder = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [carts, setCarts] = useState([]);
    const [activeCartIndex, setActiveCartIndex] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [clientsRes, productsRes] = await Promise.all([
                    api.get('/clients'),
                    api.get('/products?activo=true')
                ]);
                setClients(clientsRes.data.clients);
                setProducts(productsRes.data.products);
            } catch (err) {
                console.error(err);
            }
        };
        loadData();
    }, []);

    const createNewCart = () => {
        const newCart = {
            id: Date.now(),
            client_id: '',
            sucursal_id: '',
            es_pickup: false,
            observaciones: '',
            items: []
        };
        setCarts([...carts, newCart]);
        setActiveCartIndex(carts.length);
    };

    const updateCart = (index, field, value) => {
        const newCarts = [...carts];
        newCarts[index][field] = value;

        // Reset sucursal if client changes
        if (field === 'client_id') {
            newCarts[index].sucursal_id = '';
        }

        setCarts(newCarts);
    };

    const removeCart = (index) => {
        const newCarts = [...carts];
        newCarts.splice(index, 1);
        setCarts(newCarts);
        if (activeCartIndex >= newCarts.length) {
            setActiveCartIndex(newCarts.length - 1);
        }
    };

    const addItemToCart = (product) => {
        if (activeCartIndex === null) {
            alert('Primero crea un carrito');
            return;
        }

        const cart = carts[activeCartIndex];
        const existing = cart.items.find(item => item.product_id === product.id);
        if (existing) return;

        const newCarts = [...carts];
        newCarts[activeCartIndex].items.push({
            product_id: product.id,
            product_text: product.nombre,
            precio_unitario: product.precio_general,
            quantity_units: 0,
            quantity_boxes: 0,
            notas: '',
            box_type: product.box_type,
            units_per_box: product.units_per_box
        });
        setCarts(newCarts);
    };

    const updateCartItem = (cartIndex, itemIndex, field, value) => {
        const newCarts = [...carts];
        const item = newCarts[cartIndex].items[itemIndex];
        item[field] = value;
        setCarts(newCarts);
    };

    const removeCartItem = (cartIndex, itemIndex) => {
        const newCarts = [...carts];
        newCarts[cartIndex].items.splice(itemIndex, 1);
        setCarts(newCarts);
    };

    const submitCart = async (cartIndex) => {
        const cart = carts[cartIndex];

        if (!cart.client_id || !cart.sucursal_id || cart.items.length === 0) {
            alert('Por favor complete cliente, sucursal y agregue productos.');
            return;
        }

        try {
            const payload = {
                client_id: parseInt(cart.client_id),
                sucursal_id: parseInt(cart.sucursal_id),
                es_pickup: cart.es_pickup,
                observaciones: cart.observaciones,
                items: cart.items.map(item => {
                    const units = parseInt(item.quantity_units || 0);
                    const boxes = parseInt(item.quantity_boxes || 0);
                    let totalUnits = units;

                    if (item.box_type === 'definida' && item.units_per_box > 0) {
                        totalUnits = (boxes * item.units_per_box) + units;
                    }

                    return {
                        product_id: item.product_id,
                        product_text: item.product_text,
                        precio_unitario: parseFloat(item.precio_unitario),
                        quantity_units: totalUnits, // Send TOTAL units for billing
                        quantity_boxes: boxes,
                        notas: item.notas
                    };
                })
            };

            await api.post('/orders', payload);

            // Remove this cart after successful creation
            const newCarts = [...carts];
            newCarts.splice(cartIndex, 1);
            setCarts(newCarts);

            if (newCarts.length === 0) {
                navigate('/orders');
            } else if (activeCartIndex >= newCarts.length) {
                setActiveCartIndex(newCarts.length - 1);
            }

            alert('Pedido creado como borrador');
        } catch (err) {
            console.error(err);
            alert('Error al crear pedido: ' + (err.response?.data?.error || 'Error desconocido'));
        }
    };

    const filteredProducts = products.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeCart = activeCartIndex !== null ? carts[activeCartIndex] : null;
    const selectedClient = activeCart ? clients.find(c => c.id === parseInt(activeCart.client_id)) : null;

    return (
        <div className="flex h-[calc(100vh-120px)] gap-4">
            {/* Left: Product Catalog */}
            <div className="w-1/3 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h2 className="text-lg font-bold mb-3 text-gray-800">📦 Catálogo</h2>
                <input
                    type="text"
                    placeholder="🔍 Buscar producto..."
                    className="px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-teal-500 outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <div className="flex-1 overflow-y-auto space-y-2">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center hover:bg-teal-50 transition">
                            <div>
                                <p className="font-medium text-gray-800">{product.nombre}</p>
                                <p className="text-sm text-gray-500">${product.precio_general}</p>
                            </div>
                            <button
                                onClick={() => addItemToCart(product)}
                                className="bg-teal-100 text-teal-700 px-3 py-1 rounded-lg text-sm hover:bg-teal-200 font-semibold"
                                disabled={activeCartIndex === null}
                            >
                                +
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Middle: Cart Tabs */}
            <div className="w-2/3 flex flex-col">
                <div className="flex gap-2 mb-3">
                    {carts.map((cart, idx) => (
                        <button
                            key={cart.id}
                            onClick={() => setActiveCartIndex(idx)}
                            className={`px-4 py-2 rounded-t-lg font-semibold transition ${activeCartIndex === idx
                                ? 'bg-white text-teal-700 border-t-2 border-teal-600'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Pedido {idx + 1}
                            <button
                                onClick={(e) => { e.stopPropagation(); removeCart(idx); }}
                                className="ml-2 text-red-500 hover:text-red-700"
                            >
                                ×
                            </button>
                        </button>
                    ))}
                    <button
                        onClick={createNewCart}
                        className="px-4 py-2 bg-teal-600 text-white rounded-t-lg font-semibold hover:bg-teal-700"
                    >
                        + Nuevo Pedido
                    </button>
                </div>

                {activeCart ? (
                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
                        {/* Client/Branch Selection */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Cliente</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
                                    value={activeCart.client_id}
                                    onChange={e => updateCart(activeCartIndex, 'client_id', e.target.value)}
                                >
                                    <option value="">Seleccione...</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre_comercial}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedClient && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Sucursal</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
                                        value={activeCart.sucursal_id}
                                        onChange={e => updateCart(activeCartIndex, 'sucursal_id', e.target.value)}
                                    >
                                        <option value="">Seleccione...</option>
                                        {selectedClient.sucursales?.map(s => (
                                            <option key={s.id} value={s.id}>{s.nombre_sucursal}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Pickup Checkbox */}
                        <div className="mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={activeCart.es_pickup}
                                    onChange={e => updateCart(activeCartIndex, 'es_pickup', e.target.checked)}
                                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                                />
                                <span className="text-sm font-semibold text-gray-700">
                                    🚗 Es Pick Up (cliente recoge en Zelma)
                                </span>
                            </label>
                            {selectedClient && !activeCart.es_pickup && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Tipo de salida: <span className="font-semibold">{selectedClient.tipo_salida || 'salida_normal'}</span>
                                </p>
                            )}
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4 mb-4">
                            <h3 className="font-semibold mb-3 text-gray-800">Productos ({activeCart.items.length})</h3>
                            {activeCart.items.length === 0 ? (
                                <p className="text-gray-500 text-sm">Agrega productos del catálogo</p>
                            ) : (
                                <div className="space-y-3">
                                    {activeCart.items.map((item, idx) => {
                                        // Calculate subtotal for display
                                        const units = parseInt(item.quantity_units || 0);
                                        const boxes = parseInt(item.quantity_boxes || 0);
                                        let totalDisplayUnits = units;
                                        if (item.box_type === 'definida' && item.units_per_box > 0) {
                                            totalDisplayUnits = (boxes * item.units_per_box) + units;
                                        }
                                        const subtotal = item.precio_unitario * totalDisplayUnits;

                                        return (
                                            <div key={idx} className="bg-white p-3 rounded-lg shadow-sm text-sm">
                                                <div className="flex justify-between font-medium mb-2">
                                                    <span className="text-gray-800">{item.product_text}</span>
                                                    <button
                                                        onClick={() => removeCartItem(activeCartIndex, idx)}
                                                        className="text-red-500 hover:text-red-700 font-bold"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                                <div className="flex gap-3 items-center">
                                                    <div>
                                                        <label className="text-xs text-gray-600">Unidades (Sueltas)</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className="w-20 border rounded px-2 py-1 text-center"
                                                            value={item.quantity_units}
                                                            onChange={e => updateCartItem(activeCartIndex, idx, 'quantity_units', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-600">Cajas ({item.units_per_box || '-'} u/cja)</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className="w-20 border rounded px-2 py-1 text-center"
                                                            value={item.quantity_boxes}
                                                            onChange={e => updateCartItem(activeCartIndex, idx, 'quantity_boxes', e.target.value)}
                                                            disabled={item.box_type !== 'definida'}
                                                        />
                                                    </div>
                                                    <div className="flex-1 text-right font-bold text-teal-700">
                                                        ${subtotal.toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={() => submitCart(activeCartIndex)}
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-bold shadow-md transition"
                        >
                            Crear Pedido (Borrador)
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                            <p className="text-lg font-semibold mb-2">No hay pedidos activos</p>
                            <p className="text-sm">Haz click en "+ Nuevo Pedido" para comenzar</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateOrder;
