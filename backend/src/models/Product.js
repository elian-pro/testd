const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    codigo_interno: {
        type: DataTypes.STRING(50),
        unique: true
    },
    codigo_zelma: {
        type: DataTypes.STRING(50)
    },
    codigo_hunucma: {
        type: DataTypes.STRING(50)
    },
    nombre: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT
    },
    especificaciones: {
        type: DataTypes.TEXT
    },
    categoria_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'categorias_producto',
            key: 'id'
        }
    },
    units_per_box: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    box_type: {
        type: DataTypes.ENUM('definida', 'no_definida', 'no_aplica'),
        allowNull: false
    },
    permite_unidad: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    permite_caja: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    foto_url: {
        type: DataTypes.STRING(255)
    },
    foto_thumbnail_url: {
        type: DataTypes.STRING(255)
    },
    precio_general: {
        type: DataTypes.NUMERIC(10, 2),
        defaultValue: 0.00
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    created_by: {
        type: DataTypes.INTEGER,
        references: {
            model: 'usuarios',
            key: 'id'
        }
    }
}, {
    tableName: 'productos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Product;
