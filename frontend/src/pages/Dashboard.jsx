import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Link } from 'react-router-dom';
import api from '../services/api';

const StatCard = ({ title, value, icon, color, footer, loading }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">{title}</h3>
                    {loading ? (
                        <div className="h-9 w-16 bg-gray-200 animate-pulse rounded mt-2"></div>
                    ) : (
                        <p className="text-3xl font-extrabold text-gray-800 mt-2">{value}</p>
                    )}
                </div>
                <span className={`p-3 rounded-xl ${color} text-white text-xl shadow-lg`}>
                    {icon}
                </span>
            </div>
            {footer && (
                <div className="text-xs text-gray-400 mt-2 pt-4 border-t border-gray-50">
                    {footer}
                </div>
            )}
        </div>
    </div>
);

const Dashboard = () => {
    const { user } = useAuthStore();
    const [stats, setStats] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/dashboard/stats');
            setStats(res.data.stats);
            setRecentOrders(res.data.recent_orders);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
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
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[estado] || 'bg-gray-100 text-gray-700'}`}>
                {estado.toUpperCase()}
            </span>
        );
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 60) return `Hace ${diffMins} min`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `Hace ${diffHours} h`;
        return date.toLocaleDateString('es-MX');
    };

    return (
        <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Pedidos Hoy"
                    value={stats?.orders_today || 0}
                    icon="📝"
                    color="bg-teal-600"
                    footer={`${stats?.draft_orders || 0} borradores`}
                    loading={loading}
                />
                <StatCard
                    title="Por Entregar"
                    value={stats?.confirmed_orders || 0}
                    icon="🚚"
                    color="bg-orange-500"
                    footer="Confirmados para hoy"
                    loading={loading}
                />
                <StatCard
                    title="Productos Activos"
                    value={stats?.total_products || 0}
                    icon="📦"
                    color="bg-purple-500"
                    footer={`${stats?.low_stock_count || 0} con bajo stock`}
                    loading={loading}
                />
                <StatCard
                    title="Alertas Stock"
                    value={stats?.low_stock_count || 0}
                    icon="⚠️"
                    color="bg-red-500"
                    footer="Productos < 10 unidades"
                    loading={loading}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Quick Actions */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Acciones Rápidas</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Link
                            to="/orders/new"
                            className="flex items-center justify-center p-4 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl font-semibold transition border border-teal-200"
                        >
                            + Nuevo Pedido
                        </Link>
                        <Link
                            to="/products"
                            className="flex items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-semibold transition border border-gray-200"
                        >
                            Ver Catálogo
                        </Link>
                        <Link
                            to="/inventory"
                            className="flex items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-semibold transition border border-gray-200"
                        >
                            Ajustar Stock
                        </Link>
                        <Link
                            to="/clients"
                            className="flex items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-semibold transition border border-gray-200"
                        >
                            Clientes
                        </Link>
                        {user?.rol === 'admin' && (
                            <>
                                <Link
                                    to="/operations"
                                    className="flex items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-semibold transition border border-purple-200"
                                >
                                    📄 Generar Notas
                                </Link>
                                <Link
                                    to="/operations"
                                    className="flex items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl font-semibold transition border border-orange-200"
                                >
                                    🌅 Nuevo Día
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Actividad Reciente</h3>
                    <div className="space-y-4">
                        {loading ? (
                            [1, 2, 3].map(i => (
                                <div key={i} className="flex items-center pb-4 border-b border-gray-50">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse mr-4"></div>
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4 mb-2"></div>
                                        <div className="h-3 bg-gray-200 animate-pulse rounded w-1/2"></div>
                                    </div>
                                </div>
                            ))
                        ) : recentOrders.length > 0 ? (
                            recentOrders.map(order => (
                                <div key={order.id} className="flex items-center justify-between pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                                    <div className="flex items-center flex-1">
                                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center mr-4 text-teal-600">
                                            📝
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">
                                                Pedido {order.folio || `#${order.id}`}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {formatTime(order.created_at)} • ${parseFloat(order.total || 0).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                    {getEstadoBadge(order.estado)}
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-sm text-center py-8">No hay actividad reciente</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
