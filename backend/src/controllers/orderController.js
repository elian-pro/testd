const { Order, OrderItem, Product, Client, Branch, InventoryHunucma, InventoryZelma, sequelize } = require('../models');
const { Op } = require('sequelize');

// Helper to calculate delivery date based on time and day
const calcularFechaEntrega = () => {
    const ahora = new Date();
    const cutoffHora = 10; // 10:00 AM
    const hora = ahora.getHours();

    let fechaEntrega = new Date(ahora);

    // If after 10:00, delivery is next business day
    if (hora >= cutoffHora) {
        fechaEntrega.setDate(fechaEntrega.getDate() + 1);
    }

    // Handle weekend logic
    const diaSemana = fechaEntrega.getDay(); // 0=Sunday, 6=Saturday

    // If Sunday, move to Monday
    if (diaSemana === 0) {
        fechaEntrega.setDate(fechaEntrega.getDate() + 1);
    }
    // If Saturday after 10:00, move to Monday
    else if (diaSemana === 6 && hora >= cutoffHora) {
        fechaEntrega.setDate(fechaEntrega.getDate() + 2);
    }

    return fechaEntrega.toISOString().split('T')[0]; // Return YYYY-MM-DD
};

// Helper to generate next folio
const generateNextFolio = async () => {
    const lastOrder = await Order.findOne({
        where: {
            folio: { [Op.ne]: null },
            estado: { [Op.ne]: 'borrador' }
        },
        order: [['id', 'DESC']]
    });

    let nextNumber = 14043; // Base from spec
    if (lastOrder && lastOrder.folio) {
        const currentNumber = parseInt(lastOrder.folio.replace(/[^0-9]/g, ''));
        if (!isNaN(currentNumber)) {
            nextNumber = currentNumber + 1;
        }
    }

    return `FO-${nextNumber}`;
};

const createOrderDraft = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { client_id, sucursal_id, items, observaciones, es_pickup } = req.body;

        // Validate client and branch exist
        const client = await Client.findByPk(client_id);
        const branch = await Branch.findByPk(sucursal_id);

        if (!client) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        if (!branch) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Sucursal no encontrada' });
        }

        const newOrder = await Order.create({
            folio: null, // Will be assigned on confirmation
            client_id,
            sucursal_id,
            creado_por_user_id: req.user.userId,
            fecha_entrega: null, // Will be calculated on confirmation
            estado: 'borrador',
            es_pickup: es_pickup || false,
            observaciones
        }, { transaction });

        let totalOrder = 0;

        for (const item of items) {
            const product = await Product.findByPk(item.product_id);

            if (!product) {
                await transaction.rollback();
                return res.status(404).json({ error: `Producto ${item.product_id} no encontrado` });
            }

            let quantity_units = item.quantity_units || 0;
            let quantity_boxes = item.quantity_boxes || 0;

            // Calculate units based on box type
            if (product.box_type === 'definida' && quantity_boxes && !quantity_units) {
                quantity_units = quantity_boxes * product.units_per_box;
            }

            // Use client-specific price if available, otherwise general price
            const precio_unitario = item.precio_unitario || product.precio_general;
            const subtotal = precio_unitario * quantity_units;
            totalOrder += subtotal;

            await OrderItem.create({
                pedido_id: newOrder.id,
                product_id: item.product_id,
                product_text: product.nombre,
                quantity_units,
                quantity_boxes,
                precio_unitario,
                subtotal,
                units_per_box_snapshot: product.units_per_box,
                box_type_snapshot: product.box_type,
                notas: item.notas
            }, { transaction });
        }

        await newOrder.update({
            total: totalOrder,
            subtotal: totalOrder
        }, { transaction });

        await transaction.commit();

        res.status(201).json({ order: newOrder });
    } catch (error) {
        await transaction.rollback();
        console.error(error);
        res.status(500).json({ error: 'Error al crear pedido' });
    }
};

const confirmOrder = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const order = await Order.findByPk(id, {
            include: [
                { model: Client, as: 'cliente' },
                { model: OrderItem, as: 'items', include: [{ model: Product }] }
            ]
        });

        if (!order) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        if (order.estado !== 'borrador') {
            await transaction.rollback();
            return res.status(400).json({ error: 'El pedido no está en borrador' });
        }

        // Validate stock availability
        for (const item of order.items) {
            if (!item.Product) continue;

            const invHunucma = await InventoryHunucma.findOne({
                where: { product_id: item.product_id }
            });

            if (invHunucma && invHunucma.stock_actual < item.quantity_units) {
                // Check if we can fulfill from Zelma
                const invZelma = await InventoryZelma.findOne({
                    where: { product_id: item.product_id }
                });

                if (!invZelma || invZelma.stock_cajas < Math.ceil(item.quantity_units / item.Product.units_per_box)) {
                    await transaction.rollback();
                    return res.status(400).json({
                        error: `Stock insuficiente para ${item.Product.nombre}`
                    });
                }
            }
        }

        // Generate folio
        const folio = await generateNextFolio();

        // Calculate delivery date
        const fecha_entrega = calcularFechaEntrega();

        // Determine tipo_salida_aplicado
        let tipo_salida_aplicado = 'salida_normal';
        if (order.es_pickup) {
            tipo_salida_aplicado = 'pickup';
        } else if (order.cliente && order.cliente.tipo_salida === 'primera_salida') {
            tipo_salida_aplicado = 'primera_salida';
        }

        await order.update({
            estado: 'confirmado',
            folio,
            fecha_entrega,
            tipo_salida_aplicado,
            confirmado_at: new Date(),
            confirmado_por: req.user.userId
        }, { transaction });

        await transaction.commit();

        const updatedOrder = await Order.findByPk(id, {
            include: [
                { model: Client, as: 'cliente' },
                { model: Branch, as: 'sucursal' },
                { model: OrderItem, as: 'items', include: [{ model: Product }] }
            ]
        });

        res.json({ success: true, order: updatedOrder });
    } catch (error) {
        await transaction.rollback();
        console.error(error);
        res.status(500).json({ error: 'Error al confirmar pedido' });
    }
};

const updateOrderStatus = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { estado, motivo } = req.body;

        const order = await Order.findByPk(id);
        if (!order) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        const updateData = { estado };

        if (estado === 'cancelado') {
            updateData.cancelado_at = new Date();
            updateData.cancelado_motivo = motivo;
        }

        await order.update(updateData, { transaction });
        await transaction.commit();

        res.json({ success: true, order });
    } catch (error) {
        await transaction.rollback();
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar estado' });
    }
};

const rescheduleOrder = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { nueva_fecha } = req.body;

        const order = await Order.findByPk(id);
        if (!order) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        if (order.estado !== 'confirmado') {
            await transaction.rollback();
            return res.status(400).json({ error: 'Solo se pueden reprogramar pedidos confirmados' });
        }

        await order.update({
            estado: 'reprogramado',
            reprogramado_desde: order.fecha_entrega,
            fecha_entrega: nueva_fecha
        }, { transaction });

        await transaction.commit();
        res.json({ success: true, order });
    } catch (error) {
        await transaction.rollback();
        console.error(error);
        res.status(500).json({ error: 'Error al reprogramar pedido' });
    }
};

const getOrders = async (req, res) => {
    try {
        const { estado, fecha, folio } = req.query;
        const whereClause = {};

        if (estado) whereClause.estado = estado;
        if (fecha) whereClause.fecha_entrega = fecha;
        if (folio) whereClause.folio = { [Op.like]: `%${folio}%` };

        const orders = await Order.findAll({
            where: whereClause,
            include: [
                { model: Client, as: 'cliente', attributes: ['nombre_comercial'] },
                { model: Branch, as: 'sucursal', attributes: ['nombre_sucursal'] },
                { model: OrderItem, as: 'items' }
            ],
            order: [['created_at', 'DESC']]
        });

        res.json({ orders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener pedidos' });
    }
};

const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findByPk(id, {
            include: [
                { model: Client, as: 'cliente' },
                { model: Branch, as: 'sucursal' },
                { model: OrderItem, as: 'items', include: [{ model: Product }] }
            ]
        });

        if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

        res.json({ order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener pedido' });
    }
};

const updateOrderItems = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { items } = req.body; // Array of { product_id, quantity_units, quantity_boxes, notas }

        const order = await Order.findByPk(id);
        if (!order) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        if (order.estado !== 'borrador') {
            await transaction.rollback();
            return res.status(400).json({ error: 'Solo se pueden editar pedidos en borrador' });
        }

        // Delete existing items
        await OrderItem.destroy({
            where: { pedido_id: id },
            transaction
        });

        let totalOrder = 0;

        // Re-create items
        for (const item of items) {
            const product = await Product.findByPk(item.product_id);
            if (!product) continue;

            let quantity_units = item.quantity_units || 0;
            let quantity_boxes = item.quantity_boxes || 0;

            if (product.box_type === 'definida' && quantity_boxes && !quantity_units) {
                quantity_units = quantity_boxes * product.units_per_box;
            }

            const precio_unitario = product.precio_general;
            const subtotal = precio_unitario * quantity_units;
            totalOrder += subtotal;

            await OrderItem.create({
                pedido_id: id,
                product_id: item.product_id,
                product_text: product.nombre,
                quantity_units,
                quantity_boxes,
                precio_unitario,
                subtotal,
                units_per_box_snapshot: product.units_per_box,
                box_type_snapshot: product.box_type,
                notas: item.notas
            }, { transaction });
        }

        // Update order total
        await order.update({
            total: totalOrder,
            subtotal: totalOrder
        }, { transaction });

        await transaction.commit();

        // Return updated order
        const updatedOrder = await Order.findByPk(id, {
            include: [
                { model: Client, as: 'cliente' },
                { model: Branch, as: 'sucursal' },
                { model: OrderItem, as: 'items', include: [{ model: Product }] }
            ]
        });

        res.json({ success: true, order: updatedOrder });
    } catch (error) {
        await transaction.rollback();
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar items del pedido' });
    }
};

module.exports = {
    createOrderDraft,
    confirmOrder,
    updateOrderStatus,
    rescheduleOrder,
    getOrders,
    getOrderById,
    updateOrderItems
};
