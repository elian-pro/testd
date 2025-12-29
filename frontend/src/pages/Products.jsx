import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await api.get('/products');
            setProducts(res.data.products);
        } catch (err) {
            console.error(err);
            setError('Error al cargar productos');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingProduct(null);
        fetchProducts();
    };

    const filteredProducts = products.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.codigo_interno && p.codigo_interno.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Catálogo de Productos</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestiona tu inventario y precios</p>
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                    <input
                        type="text"
                        placeholder="🔍 Buscar producto..."
                        className="flex-1 sm:w-64 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button
                        onClick={() => { setEditingProduct(null); setModalOpen(true); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
                    >
                        + Nuevo
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200">{error}</div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Producto</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Precio</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Hunucmá</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Zelma</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0 bg-slate-100 rounded-lg flex items-center justify-center text-lg">
                                                📦
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-bold text-slate-900">{product.nombre}</div>
                                                <div className="text-xs text-slate-500 font-mono mt-0.5">{product.codigo_interno || 'S/C'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                                            {product.Category?.nombre || 'General'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">
                                        ${product.precio_general}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <StatusBadge status={product.disponibilidad_hunucma} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <StatusBadge status={product.disponibilidad_zelma} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleEdit(product)}
                                            className="text-blue-600 hover:text-blue-800 font-semibold px-3 py-1 rounded hover:bg-blue-50 transition"
                                        >
                                            Editar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredProducts.length === 0 && (
                        <div className="p-12 text-center">
                            <p className="text-slate-500 mb-4">No se encontraron productos.</p>
                            <button onClick={() => setModalOpen(true)} className="text-blue-600 font-semibold hover:underline">
                                Crear el primero
                            </button>
                        </div>
                    )}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingProduct ? "Editar Producto" : "Nuevo Producto"}
            >
                <ProductForm product={editingProduct} onClose={handleCloseModal} />
            </Modal>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const isAvailable = status === 'disponible';
    return (
        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
            {isAvailable ? 'Disponible' : 'Agotado'}
        </span>
    );
};

const ProductForm = ({ product, onClose }) => {
    const [formData, setFormData] = useState({
        nombre: product?.nombre || '',
        codigo_interno: product?.codigo_interno || '',
        descripcion: product?.descripcion || '',
        categoria_id: product?.categoria_id || '',
        precio_general: product?.precio_general || '',
        units_per_box: product?.units_per_box || 1,
        box_type: product?.box_type || 'definida'
    });
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/categories');
                setCategories(res.data.categories);
            } catch (err) {
                console.error('Error loading categories', err);
            }
        };
        fetchCategories();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (product) {
                await api.put(`/products/${product.id}`, formData);
            } else {
                await api.post('/products', formData);
            }
            onClose();
        } catch (err) {
            alert('Error al guardar producto: ' + (err.response?.data?.error || 'Error desconocido'));
            console.error(err);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre del Producto</label>
                <input
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="Ej: Galletas Emperador"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Descripción</label>
                <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="Descripción del producto"
                    rows="2"
                />
            </div>

            <div className="grid grid-cols-2 gap-5">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Código Interno</label>
                    <input
                        name="codigo_interno"
                        value={formData.codigo_interno}
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        placeholder="ABC-123"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Precio General</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-500">$</span>
                        <input
                            name="precio_general"
                            type="number"
                            step="0.01"
                            value={formData.precio_general}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-lg pl-8 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            placeholder="0.00"
                        />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Categoría</label>
                <select
                    name="categoria_id"
                    value={formData.categoria_id}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
                >
                    <option value="">Seleccione una categoría...</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                </select>
            </div>

            {/* Box Configuration Section */}
            <div className="border-t border-slate-200 pt-5 mt-2">
                <h4 className="font-semibold text-slate-700 mb-4 flex items-center">
                    <span className="mr-2">📦</span> Configuración de Empaque
                </h4>

                <div className="grid grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de Caja</label>
                        <select
                            name="box_type"
                            value={formData.box_type}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
                        >
                            <option value="definida">Caja Definida</option>
                            <option value="variable">Caja Variable</option>
                        </select>
                        <p className="text-xs text-slate-400 mt-1">
                            {formData.box_type === 'definida' ? 'Cantidad fija por caja' : 'Cantidad variable por caja'}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Unidades por Caja</label>
                        <input
                            name="units_per_box"
                            type="number"
                            min="1"
                            value={formData.units_per_box}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            placeholder="12"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                            Unidades que contiene cada caja
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4 gap-3 border-t border-slate-100">
                <button type="button" onClick={onClose} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition">
                    Cancelar
                </button>
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-blue-700 transition transform active:scale-95">
                    {product ? 'Actualizar' : 'Guardar'} Producto
                </button>
            </div>
        </form>
    );
};

export default Products;
