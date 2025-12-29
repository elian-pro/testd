import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

// Icons (using emojis for simplicity)
const Icons = {
    dashboard: '📊',
    orders: '📝',
    products: '📦',
    inventory: '🏭',
    users: '👥',
    clients: '🤝',
    operations: '⚙️',
    logout: '🚪'
};

const DashboardLayout = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname.startsWith(path);

    const navItems = [
        { label: 'Dashboard', path: '/dashboard', icon: Icons.dashboard },
        { label: 'Pedidos', path: '/orders', icon: Icons.orders },
        { label: 'Catálogo de Productos', path: '/products', icon: Icons.products },
        { label: 'Inventario', path: '/inventory', icon: Icons.inventory },
    ];

    if (user?.rol === 'admin') {
        navItems.push({ label: 'Usuarios', path: '/users', icon: Icons.users });
        navItems.push({ label: 'Clientes', path: '/clients', icon: Icons.clients });
        navItems.push({ label: 'Operaciones', path: '/operations', icon: Icons.operations });
        navItems.push({ label: 'Histórico', path: '/history', icon: '📜' });
    }


    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            {/* Sidebar - Teal/Green Theme */}
            <aside
                className={`bg-gradient-to-b from-teal-600 to-teal-700 text-white transition-all duration-300 ease-in-out flex flex-col shadow-xl ${sidebarOpen ? 'w-72' : 'w-20'
                    }`}
            >
                <div className="h-20 flex items-center justify-between px-6 border-b border-teal-500/30">
                    {sidebarOpen ? (
                        <h1 className="text-xl font-bold tracking-wide text-white">DISTRIBUIDORA</h1>
                    ) : (
                        <span className="text-xl font-bold mx-auto">D</span>
                    )}
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-teal-100 hover:text-white focus:outline-none ml-2">
                        {sidebarOpen ? '«' : '»'}
                    </button>
                </div>

                <nav className="flex-1 mt-6 px-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${isActive(item.path)
                                ? 'bg-teal-500/30 text-white font-semibold'
                                : 'text-teal-50 hover:bg-teal-500/20 hover:text-white'
                                }`}
                        >
                            <span className="text-lg">{item.icon}</span>
                            {sidebarOpen && (
                                <span className="ml-3 font-medium">{item.label}</span>
                            )}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-teal-500/30">
                    <div className={`flex items-center ${!sidebarOpen && 'justify-center'}`}>
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white shadow">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        {sidebarOpen && (
                            <div className="ml-3 overflow-hidden">
                                <p className="text-sm font-semibold text-white truncate">{user?.username || 'Usuario'}</p>
                                <p className="text-xs text-teal-100 capitalize truncate">{user?.rol}</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        className={`mt-4 w-full flex items-center justify-center bg-red-500/20 hover:bg-red-500 text-red-100 hover:text-white py-2.5 rounded-lg transition-colors duration-200 border border-red-400/30 ${!sidebarOpen && 'px-0'}`}
                    >
                        <span className="text-lg">{Icons.logout}</span>
                        {sidebarOpen && <span className="ml-2 font-medium">Cerrar Sesión</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white shadow-sm flex items-center px-8 justify-between z-10 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">
                            {navItems.find(i => isActive(i.path))?.label || 'Panel de Control'}
                        </h2>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button className="p-2 text-gray-400 hover:text-teal-600 transition-colors relative">
                            <span className="sr-only">Notificaciones</span>
                            🔔
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
