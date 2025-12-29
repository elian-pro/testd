const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'categorias_producto',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false // No updated_at in schema for this table, checking schema... yes, updated_at is missing in CREATE TABLE but commonly good to have. Schema says created_at only. adhering to schema.
});

module.exports = Category;
