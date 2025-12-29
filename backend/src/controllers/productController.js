const { Product, Category, InventoryHunucma, InventoryZelma } = require('../models');
const { Op } = require('sequelize');

const getProducts = async (req, res) => {
    try {
        const { search, categoria_id, activo } = req.query;

        const whereClause = {};
        if (activo !== undefined) {
            whereClause.activo = activo === 'true';
        }

        if (search) {
            whereClause[Op.or] = [
                { nombre: { [Op.iLike]: `%${search}%` } },
                { codigo_interno: { [Op.iLike]: `%${search}%` } }
            ];
        }

        if (categoria_id) {
            whereClause.categoria_id = categoria_id;
        }

        const products = await Product.findAll({
            where: whereClause,
            include: [
                { model: Category, attributes: ['nombre'] },
                { model: InventoryHunucma, as: 'inventario_hunucma', attributes: ['stock_units'] },
                { model: InventoryZelma, as: 'inventario_zelma', attributes: ['stock_boxes'] }
            ],
            order: [['nombre', 'ASC']]
        });

        // Transform response to include simple availability status
        const productsWithStatus = products.map(p => {
            const prod = p.toJSON();
            prod.disponibilidad_hunucma = prod.inventario_hunucma?.stock_units > 0 ? 'disponible' : 'agotado'; // Simplified for now
            prod.disponibilidad_zelma = prod.inventario_zelma?.stock_boxes > 0 ? 'disponible' : 'agotado';
            return prod;
        });

        res.json({ products: productsWithStatus });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
};

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id, {
            include: [
                { model: Category },
                { model: InventoryHunucma, as: 'inventario_hunucma' },
                { model: InventoryZelma, as: 'inventario_zelma' }
            ]
        });

        if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

        res.json({ product });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener producto' });
    }
};

const createProduct = async (req, res) => {
    try {
        const {
            nombre, codigo_interno, categoria_id, units_per_box, box_type,
            precio_general, permite_unidad, permite_caja
        } = req.body;

        const newProduct = await Product.create({
            nombre,
            codigo_interno,
            categoria_id,
            units_per_box,
            box_type,
            precio_general,
            permite_unidad,
            permite_caja,
            created_by: req.user.userId
        });

        // Initialize inventory records to 0
        await InventoryHunucma.create({ product_id: newProduct.id, stock_units: 0 });
        await InventoryZelma.create({ product_id: newProduct.id, stock_boxes: 0 });

        res.status(201).json({ product: newProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear producto' });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);

        if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

        await product.update(req.body);
        res.json({ product });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
};

const toggleProductActive = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);

        if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

        await product.update({ activo: !product.activo });
        res.json({ message: `Producto ${product.activo ? 'activado' : 'desactivado'}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al alternar estado del producto' });
    }
};

// Categories
const getCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({ where: { activo: true } });
        res.json({ categories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    toggleProductActive,
    getCategories
};
