import React, { useState } from 'react';
import api from '../services/api';

const Operations = () => {
    const [loading, setLoading] = useState(false);
    const [generatedFiles, setGeneratedFiles] = useState([]);
    const [newDayResult, setNewDayResult] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const handleGeneratePDFs = async () => {
        try {
            setLoading(true);
            const res = await api.post('/operations/generate-pdfs');
            setGeneratedFiles(res.data.files || []);
            alert(`PDFs generados exitosamente!\n${res.data.orders_count} pedidos procesados`);
        } catch (err) {
            alert('Error al generar PDFs: ' + (err.response?.data?.error || 'Error desconocido'));
        } finally {
            setLoading(false);
        }
    };

    const handleNewDay = async () => {
        try {
            setLoading(true);
            const res = await api.post('/operations/new-day');
            setNewDayResult(res.data);
            setShowConfirmModal(false);
            alert(`Nuevo día procesado!\n${res.data.orders_processed} pedidos cerrados`);
        } catch (err) {
            alert('Error al procesar nuevo día: ' + (err.response?.data?.error || 'Error desconocido'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Operación Diaria</h1>
                <p className="text-gray-500 text-sm">Gestiona las operaciones del día</p>
            </div>

            {/* Generate PDFs Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">📄 Generar Pedidos</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Genera PDFs individuales y resumen de reparto para pedidos confirmados
                        </p>
                    </div>
                    <button
                        onClick={handleGeneratePDFs}
                        disabled={loading}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Generando...' : 'Generar Pedidos'}
                    </button>
                </div>

                {generatedFiles.length > 0 && (
                    <div className="mt-6 border-t border-gray-200 pt-4">
                        <h3 className="font-semibold text-gray-700 mb-3">Archivos Generados:</h3>
                        <div className="space-y-2">
                            {generatedFiles.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                    <div>
                                        <span className="font-medium text-gray-800">
                                            {file.type === 'delivery_summary' ? '📋 Resumen de Reparto' : `📝 Nota ${file.folio}`}
                                        </span>
                                        {file.is_pickup && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">Pick Up</span>}
                                    </div>
                                    <a
                                        href={`http://localhost:3000${file.url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-teal-600 hover:text-teal-800 font-semibold"
                                    >
                                        Descargar
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        <strong>Nota:</strong> Este botón puede presionarse múltiples veces. Genera PDFs para todos los pedidos confirmados del día.
                    </p>
                </div>
            </div>

            {/* New Day Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">🌅 Nuevo Día</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Cierra el día actual y transfiere pedidos confirmados al histórico
                        </p>
                    </div>
                    <button
                        onClick={() => setShowConfirmModal(true)}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Procesar Nuevo Día
                    </button>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800 font-semibold mb-2">⚠️ ADVERTENCIA: Esta acción es IRREVERSIBLE</p>
                    <ul className="text-sm text-red-700 space-y-1 ml-4 list-disc">
                        <li>Mueve todos los pedidos CONFIRMADOS al estado CERRADO</li>
                        <li>Descuenta el inventario de Hunucmá y Zelma</li>
                        <li>Aplica el reabastecimiento automático</li>
                        <li>Los pedidos BORRADOR se mantienen sin cambios</li>
                    </ul>
                </div>

                {newDayResult && (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-800">
                            ✅ Último proceso: {newDayResult.orders_processed} pedidos cerrados
                            <br />
                            Fecha: {new Date(newDayResult.timestamp).toLocaleString('es-MX')}
                        </p>
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">⚠️ Confirmar Nuevo Día</h3>
                        <p className="text-gray-700 mb-6">
                            ¿Estás seguro de procesar el nuevo día? Esta acción NO se puede deshacer.
                            Todos los pedidos confirmados serán cerrados y el inventario será descontado.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleNewDay}
                                className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition"
                            >
                                Sí, Procesar Nuevo Día
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Operations;
