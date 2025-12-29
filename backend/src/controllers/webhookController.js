const { Order, OrderItem, Product, Client, Branch, sequelize } = require('../models');
const { Op } = require('sequelize');

// Process webhook from N8N
const processWebhook = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const items = req.body; // Array of { Cliente, Producto, Cantidad }

        if (!Array.isArray(items) || items.length === 0) {
            await transaction.rollback();
            return res.status(400).json({
                error: 'Formato inválido. Se espera un array de items.'
            });
        }

        // Group items by Cliente (sucursal name)
        const ordersByClient = {};
        const errors = [];
        const warnings = [];

        for (const item of items) {
            const { Cliente, Producto, Cantidad } = item;

            if (!Cliente || !Producto || !Cantidad) {
                errors.push(`Item incompleto: ${JSON.stringify(item)}`);
                continue;
            }

            // Find branch by unique name (nombre_sucursal)
            const branch = await Branch.findOne({
                where: { nombre_sucursal: Cliente },
                include: [{ model: Client, as: 'cliente' }]
            });

            if (!branch) {
                errors.push(`Sucursal no encontrada: "${Cliente}"`);
                continue;
            }

            // Find product by exact name match
            const product = await Product.findOne({
                where: {
                    nombre: { [Op.like]: Producto.trim() },
                    activo: true
                }
            });

            if (!product) {
                errors.push(`Producto no encontrado: "${Producto}" para cliente "${Cliente}"`);
                continue;
            }

            // Parse quantity
            const cantidad = parseFloat(Cantidad);
            if (isNaN(cantidad) || cantidad <= 0) {
                errors.push(`Cantidad inválida: "${Cantidad}" para producto "${Producto}"`);
                continue;
            }

            // Determine if quantity is boxes or units based on box_type
            let quantity_units = 0;
            let quantity_boxes = 0;

            if (product.box_type === 'definida') {
                // For defined boxes, quantity is in boxes
                quantity_boxes = cantidad;
                quantity_units = cantidad * product.units_per_box;
            } else {
                // For undefined or N/A, quantity is in units
                quantity_units = cantidad;
            }

            // Group by client_id and sucursal_id
            const key = `${branch.client_id}-${branch.id}`;

            if (!ordersByClient[key]) {
                ordersByClient[key] = {
                    client_id: branch.client_id,
                    sucursal_id: branch.id,
                    sucursal_nombre: branch.nombre_sucursal,
                    items: []
                };
            }

            ordersByClient[key].items.push({
                product_id: product.id,
                product_text: product.nombre,
                precio_unitario: product.precio_general, // TODO: Check for client-specific price
                quantity_units,
                quantity_boxes,
                notas: `Pedido automático vía webhook`
            });
        }

        // Create orders
        const createdOrders = [];

        for (const key in ordersByClient) {
            const orderData = ordersByClient[key];

            // Calculate total
            let total = 0;
            for (const item of orderData.items) {
                total += item.precio_unitario * item.quantity_units;
            }

            // Create order as BORRADOR
            const newOrder = await Order.create({
                folio: null,
                client_id: orderData.client_id,
                sucursal_id: orderData.sucursal_id,
                creado_por_user_id: 1, // TODO: Use webhook user or system user
                fecha_entrega: null,
                estado: 'borrador',
                es_pickup: false,
                observaciones: 'Pedido creado automáticamente vía webhook N8N',
                subtotal: total,
                total: total
            }, { transaction });

            // Create order items
            for (const item of orderData.items) {
                await OrderItem.create({
                    pedido_id: newOrder.id,
                    product_id: item.product_id,
                    product_text: item.product_text,
                    quantity_units: item.quantity_units,
                    quantity_boxes: item.quantity_boxes,
                    precio_unitario: item.precio_unitario,
                    subtotal: item.precio_unitario * item.quantity_units,
                    units_per_box_snapshot: null,
                    box_type_snapshot: null,
                    notas: item.notas
                }, { transaction });
            }

            createdOrders.push({
                order_id: newOrder.id,
                sucursal: orderData.sucursal_nombre,
                items_count: orderData.items.length,
                total: total
            });
        }

        await transaction.commit();

        // Prepare response
        const response = {
            success: true,
            orders_created: createdOrders.length,
            orders: createdOrders,
            errors: errors.length > 0 ? errors : undefined,
            warnings: warnings.length > 0 ? warnings : undefined
        };

        // If there are errors, log them for admin notification
        if (errors.length > 0) {
            console.error('Webhook processing errors:', errors);
            // TODO: Send notification to admin and user
        }

        res.status(201).json(response);
    } catch (error) {
        await transaction.rollback();
        console.error('Webhook error:', error);
        res.status(500).json({
            error: 'Error al procesar webhook',
            details: error.message
        });
    }
};

module.exports = {
    processWebhook
};
