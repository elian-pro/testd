const { Order, OrderItem, Product, Client, Branch, InventoryHunucma, InventoryZelma, sequelize } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs').promises;
const pdfGenerator = require('../services/pdfGenerator');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/pdfs');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Generate all PDFs for confirmed orders
const generateOrderPDFs = async (req, res) => {
    try {
        // Get all CONFIRMADO orders for today
        const today = new Date().toISOString().split('T')[0];

        const orders = await Order.findAll({
            where: {
                estado: 'confirmado',
                fecha_entrega: today
            },
            include: [
                { model: Client, as: 'cliente' },
                { model: Branch, as: 'sucursal' },
                { model: OrderItem, as: 'items', include: [{ model: Product }] }
            ]
        });

        if (orders.length === 0) {
            return res.json({
                success: true,
                message: 'No hay pedidos confirmados para generar',
                orders_count: 0
            });
        }

        // Separate pickup vs delivery orders
        const pickupOrders = orders.filter(o => o.es_pickup);
        const deliveryOrders = orders.filter(o => !o.es_pickup);

        const generatedFiles = [];

        // Generate individual PDFs for all orders
        for (const order of orders) {
            const filename = `pedido_${order.folio}_${Date.now()}.pdf`;
            const filepath = path.join(uploadsDir, filename);

            await pdfGenerator.generateOrderNote(order, filepath);

            generatedFiles.push({
                type: 'order_note',
                folio: order.folio,
                is_pickup: order.es_pickup,
                url: `/uploads/pdfs/${filename}`
            });
        }

        // Generate delivery summary (only for non-pickup orders)
        if (deliveryOrders.length > 0) {
            const summaryFilename = `resumen_reparto_${Date.now()}.pdf`;
            const summaryPath = path.join(uploadsDir, summaryFilename);

            await pdfGenerator.generateDeliverySummary(deliveryOrders, summaryPath);

            generatedFiles.push({
                type: 'delivery_summary',
                url: `/uploads/pdfs/${summaryFilename}`
            });
        }

        // TODO: Generate 3 operation images (Hunucmá, Zelma, Reabastecimiento)

        res.json({
            success: true,
            orders_count: orders.length,
            pickup_count: pickupOrders.length,
            delivery_count: deliveryOrders.length,
            files: generatedFiles
        });

    } catch (error) {
        console.error('Error generating PDFs:', error);
        res.status(500).json({
            error: 'Error al generar PDFs',
            details: error.message
        });
    }
};

// Close the day and move orders to historical
const processNewDay = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        // Get all CONFIRMADO orders
        const confirmedOrders = await Order.findAll({
            where: { estado: 'confirmado' },
            include: [
                { model: OrderItem, as: 'items', include: [{ model: Product }] }
            ],
            transaction
        });

        if (confirmedOrders.length === 0) {
            await transaction.rollback();
            return res.json({
                success: true,
                message: 'No hay pedidos confirmados para procesar',
                orders_processed: 0
            });
        }

        // Process each order
        for (const order of confirmedOrders) {
            // Deduct inventory
            for (const item of order.items) {
                if (!item.Product) continue;

                const product = item.Product;

                // Determine source based on tipo_salida_aplicado
                if (order.tipo_salida_aplicado === 'primera_salida') {
                    // Try Hunucmá first
                    const invHunucma = await InventoryHunucma.findOne({
                        where: { product_id: product.id },
                        transaction
                    });

                    if (invHunucma && invHunucma.stock_actual >= item.quantity_units) {
                        // Deduct from Hunucmá
                        await invHunucma.update({
                            stock_actual: invHunucma.stock_actual - item.quantity_units
                        }, { transaction });
                    } else {
                        // Deduct remaining from Zelma
                        const remaining = item.quantity_units - (invHunucma?.stock_actual || 0);
                        if (invHunucma) {
                            await invHunucma.update({ stock_actual: 0 }, { transaction });
                        }

                        const invZelma = await InventoryZelma.findOne({
                            where: { product_id: product.id },
                            transaction
                        });

                        if (invZelma) {
                            const boxesToDeduct = Math.ceil(remaining / product.units_per_box);
                            await invZelma.update({
                                stock_cajas: invZelma.stock_cajas - boxesToDeduct
                            }, { transaction });
                        }
                    }
                } else {
                    // salida_normal or pickup - deduct from Zelma
                    const invZelma = await InventoryZelma.findOne({
                        where: { product_id: product.id },
                        transaction
                    });

                    if (invZelma) {
                        const boxesToDeduct = Math.ceil(item.quantity_units / product.units_per_box);
                        await invZelma.update({
                            stock_cajas: invZelma.stock_cajas - boxesToDeduct
                        }, { transaction });
                    }
                }
            }

            // Mark order as CERRADO
            await order.update({
                estado: 'cerrado',
                cerrado_at: new Date()
            }, { transaction });
        }

        await transaction.commit();

        res.json({
            success: true,
            message: 'Nuevo día procesado exitosamente',
            orders_processed: confirmedOrders.length,
            timestamp: new Date()
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Error processing new day:', error);
        res.status(500).json({
            error: 'Error al procesar nuevo día',
            details: error.message
        });
    }
};

module.exports = {
    generateOrderPDFs,
    processNewDay
};
