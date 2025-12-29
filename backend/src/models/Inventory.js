const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InventoryHunucma = sequelize.define('InventoryHunucma', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    product_id: {
        type: DataTypes.INTEGER,
        unique: true,
        allowNull: false,
        references: {
            model: 'productos',
            key: 'id'
        }
    },
    stock_units: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        validate: {
            min: 0 // Application level check, DB constraint also exists
        }
    },
    updated_by: {
        type: DataTypes.INTEGER,
        references: {
            model: 'usuarios',
            key: 'id'
        }
    }
}, {
    tableName: 'inventario_hunucma',
    timestamps: true,
    createdAt: false,
    updatedAt: 'updated_at'
});

const InventoryZelma = sequelize.define('InventoryZelma', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    product_id: {
        type: DataTypes.INTEGER,
        unique: true,
        allowNull: false,
        references: {
            model: 'productos',
            key: 'id'
        }
    },
    stock_boxes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    updated_by: {
        type: DataTypes.INTEGER,
        references: {
            model: 'usuarios',
            key: 'id'
        }
    }
}, {
    tableName: 'inventario_zelma',
    timestamps: true,
    createdAt: false,
    updatedAt: 'updated_at'
});

module.exports = { InventoryHunucma, InventoryZelma };
