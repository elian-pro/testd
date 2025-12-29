const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Client = sequelize.define('Client', {
    // ... fields defined below ...
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre_comercial: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    tipo_salida: {
        type: DataTypes.ENUM('primera_salida', 'salida_normal', 'pickup'),
        allowNull: false
    },
    rfc: {
        type: DataTypes.STRING(13)
    },
    email: {
        type: DataTypes.STRING(100)
    },
    telefono: {
        type: DataTypes.STRING(20)
    },
    notas: {
        type: DataTypes.TEXT
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
    },
    vendedor_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'usuarios',
            key: 'id'
        }
    }
}, {
    tableName: 'clientes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Client;
