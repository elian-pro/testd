const { Order, Product, Client, InventoryHunucma, InventoryZelma, sequelize } = require('../models');
const { Op } = require('sequelize');

const getDashboardStats = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Count orders by status for today
        const ordersToday = await Order.count({
            where: {
                createdAt: {
                    [Op.gte]: new Date(today)
                }
            }
        });

        const confirmedOrders = await Order.count({
            where: {
                estado: 'confirmado',
                fecha_entrega: today
            }
        });

        const draftOrders = await Order.count({
            where: { estado: 'borrador' }
        });

        // Total products
        const totalProducts = await Product.count({
            where: { activo: true }
        });

        // Low stock products (less than 10 units in Hunucmá)
        const lowStockCount = await InventoryHunucma.count({
            where: {
                stock_actual: {
                    [Op.lt]: 10
                }
            }
        });

        // Recent orders (last 5)
        const recentOrders = await Order.findAll({
            limit: 5,
            order: [['created_at', 'DESC']],
            include: [
                { model: Client, as: 'cliente', attributes: ['nombre_comercial'] }
            ],
            attributes: ['id', 'folio', 'estado', 'total', 'created_at']
        });

        res.json({
            stats: {
                orders_today: ordersToday,
                confirmed_orders: confirmedOrders,
                draft_orders: draftOrders,
                total_products: totalProducts,
                low_stock_count: lowStockCount
            },
            recent_orders: recentOrders
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            error: 'Error al obtener estadísticas',
            details: error.message
        });
    }
};

module.exports = {
    getDashboardStats
};
