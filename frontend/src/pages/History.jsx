import React, { useState, useEffect } from 'react';
import api from '../services/api';
// import * as ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';

const History = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        console.log("History: fetchHistory called");
        try {
            setLoading(true);
            console.log("History: calling api.get('/orders')");
            const res = await api.get('/orders');
            console.log("History: api response", res.status, res.data);
            const history = res.data.orders.filter(o => ['cerrado', 'cancelado'].includes(o.estado));
            setOrders(history);
        } catch (err) {
            console.error("History: error fetching", err);
            console.error("History: error response", err.response);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        alert("Funcionalidad de exportar pendiente de instalación de librerías.");
        /*
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Histórico de Pedidos');

        worksheet.columns = [
            { header: 'Folio', key: 'folio', width: 15 },
            { header: 'Fecha Entrega', key: 'fecha', width: 15 },
            { header: 'Cliente', key: 'cliente', width: 30 },
            { header: 'Sucursal', key: 'sucursal', width: 25 },
            { header: 'Estado', key: 'estado', width: 15 },
            { header: 'Total', key: 'total', width: 15 },
        ];

        orders.forEach(order => {
            worksheet.addRow({
                folio: order.folio,
                fecha: order.fecha_entrega,
                cliente: order.cliente?.nombre_comercial,
                sucursal: order.sucursal?.nombre_sucursal,
                estado: order.estado,
                total: parseFloat(order.total)
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `historico_pedidos_${new Date().toISOString().split('T')[0]}.xlsx`);
        */
    };

    const filteredOrders = orders.filter(o => {
        if (!dateRange.start && !dateRange.end) return true;
        const orderDate = new Date(o.fecha_entrega);
        const start = dateRange.start ? new Date(dateRange.start) : new Date(0);
        const end = dateRange.end ? new Date(dateRange.end) : new Date(8640000000000000);
        return orderDate >= start && orderDate <= end;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Histórico de Pedidos</h1>
                    <p className="text-gray-500 text-sm mt-1">Consulta y exporta pedidos cerrados y cancelados</p>
                </div>
                <div className="flex gap-3 items-end">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Desde</label>
                        <input
                            type="date"
                            className="px-3 py-2 border rounded-lg text-sm"
                            value={dateRange.start}
                            onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                        <input
                            type="date"
                            className="px-3 py-2 border rounded-lg text-sm"
                            value={dateRange.end}
                            onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>
                    <button
                        onClick={handleExport}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold shadow-md transition flex items-center gap-2"
                    >
                        <span>📊</span> Exportar Excel
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Folio</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Fecha Entrega</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Cliente</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Sucursal</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase">Estado</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan="6" className="text-center py-8">Cargando...</td></tr>
                        ) : filteredOrders.length === 0 ? (
                            <tr><td colSpan="6" className="text-center py-8 text-gray-500">No hay pedidos en el histórico</td></tr>
                        ) : (
                            filteredOrders.map(order => (
                                <tr key={order.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 font-mono text-sm font-semibold text-gray-800">{order.folio}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{order.fecha_entrega}</td>
                                    <td className="px-6 py-4 text-sm text-gray-800">{order.cliente?.nombre_comercial}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{order.sucursal?.nombre_sucursal}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${order.estado === 'cerrado' ? 'bg-slate-100 text-slate-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {order.estado.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-bold text-gray-800">${parseFloat(order.total).toFixed(2)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default History;
