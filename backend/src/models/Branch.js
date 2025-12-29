const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Branch = sequelize.define('Branch', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    client_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'clientes',
            key: 'id'
        }
    },
    nombre_sucursal: {
        type: DataTypes.STRING(200),
        unique: true,
        allowNull: false
    },
    direccion: {
        type: DataTypes.TEXT
    },
    colonia: {
        type: DataTypes.STRING(100)
    },
    ciudad: {
        type: DataTypes.STRING(100)
    },
    codigo_postal: {
        type: DataTypes.STRING(10)
    },
    telefono: {
        type: DataTypes.STRING(20)
    },
    nombre_encargado: {
        type: DataTypes.STRING(150)
    },
    telefono_encargado: {
        type: DataTypes.STRING(20)
    },
    email_encargado: {
        type: DataTypes.STRING(100)
    },
    notas_entrega: {
        type: DataTypes.TEXT
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'sucursales_cliente',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Branch;
