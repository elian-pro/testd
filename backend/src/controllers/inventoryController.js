const { InventoryHunucma, InventoryZelma, Product, sequelize } = require('../models');
const { DataTypes } = require('sequelize');

// --- HUNUCMA ---

const getInventoryHunucma = async (req, res) => {
    try {
        const inventory = await InventoryHunucma.findAll({
            include: [
                { model: Product, attributes: ['nombre', 'codigo_hunucma', 'foto_thumbnail_url'] }
            ],
            order: [[Product, 'nombre', 'ASC']]
        });
        res.json({ inventory });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener inventario Hunucmá' });
    }
};

const adjustInventoryHunucma = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { product_id, delta_units, motivo, notas } = req.body;
        console.log('Adjusting Hunucma:', { product_id, delta_units, motivo, notas, user: req.user });

        const inventory = await InventoryHunucma.findOne({ where: { product_id } });
        if (!inventory) return res.status(404).json({ error: 'Producto no encontrado en inventario Hunucmá' });

        const stock_anterior = inventory.stock_units;
        const stock_nuevo = stock_anterior + delta_units;

        if (stock_nuevo < 0) {
            await transaction.rollback();
            return res.status(400).json({ error: 'El stock no puede ser negativo' });
        }

        await inventory.update({ stock_units: stock_nuevo, updated_by: req.user.userId }, { transaction });

        await transaction.commit();
        res.json({ success: true, stock_nuevo });
    } catch (error) {
        await transaction.rollback();
        console.error('Inventory Adjustment Error:', error);
        res.status(500).json({ error: 'Error al ajustar inventario: ' + error.message });
    }
};

// --- ZELMA ---

const getInventoryZelma = async (req, res) => {
    try {
        const inventory = await InventoryZelma.findAll({
            include: [
                { model: Product, attributes: ['nombre', 'codigo_zelma', 'foto_thumbnail_url'] }
            ],
            order: [[Product, 'nombre', 'ASC']]
        });
        res.json({ inventory });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener inventario Zelma' });
    }
};

const adjustInventoryZelma = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { product_id, delta_boxes, motivo, notas } = req.body;
        console.log('Adjusting Zelma:', { product_id, delta_boxes, motivo, notas, user: req.user });

        const inventory = await InventoryZelma.findOne({ where: { product_id } });
        if (!inventory) return res.status(404).json({ error: 'Producto no encontrado en inventario Zelma' });

        const stock_anterior = inventory.stock_boxes;
        const stock_nuevo = stock_anterior + delta_boxes;

        // Zelma allows negative stock (warning only)
        await inventory.update({ stock_boxes: stock_nuevo, updated_by: req.user.userId }, { transaction });

        await transaction.commit();
        res.json({ success: true, stock_nuevo });
    } catch (error) {
        await transaction.rollback();
        console.error('Inventory Adjustment Error (Zelma):', error);
        res.status(500).json({ error: 'Error al ajustar inventario: ' + error.message });
    }
};

module.exports = {
    getInventoryHunucma,
    adjustInventoryHunucma,
    getInventoryZelma,
    adjustInventoryZelma
};
