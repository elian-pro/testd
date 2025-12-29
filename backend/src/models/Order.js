const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    folio: {
        type: DataTypes.STRING(20),
        unique: true,
        allowNull: true // Null until confirmed
    },
    client_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'clientes',
            key: 'id'
        }
    },
    sucursal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'sucursales_cliente',
            key: 'id'
        }
    },
    creado_por_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'usuarios',
            key: 'id'
        }
    },
    fecha_entrega: {
        type: DataTypes.DATEONLY,
        allowNull: true // Calculated on confirmation
    },
    origen_surtido: {
        type: DataTypes.ENUM('auto', 'hunucma', 'zelma', 'externo'),
        defaultValue: 'auto'
    },
    estado: {
        type: DataTypes.ENUM('borrador', 'confirmado', 'reprogramado', 'cancelado', 'cerrado'),
        defaultValue: 'borrador'
    },
    es_pickup: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'True if this is a pickup order (no delivery)'
    },
    tipo_salida_aplicado: {
        type: DataTypes.ENUM('primera_salida', 'salida_normal', 'pickup'),
        allowNull: true,
        comment: 'Type of exit applied when order was confirmed'
    },
    subtotal: {
        type: DataTypes.NUMERIC(10, 2),
        defaultValue: 0.00
    },
    descuento: {
        type: DataTypes.NUMERIC(10, 2),
        defaultValue: 0.00
    },
    total: {
        type: DataTypes.NUMERIC(10, 2),
        defaultValue: 0.00
    },
    observaciones: {
        type: DataTypes.TEXT
    },
    confirmado_at: {
        type: DataTypes.DATE
    },
    confirmado_por: {
        type: DataTypes.INTEGER,
        references: {
            model: 'usuarios',
            key: 'id'
        }
    },
    reprogramado_desde: {
        type: DataTypes.DATEONLY,
        comment: 'Original delivery date if rescheduled'
    },
    cancelado_at: {
        type: DataTypes.DATE
    },
    cancelado_motivo: {
        type: DataTypes.TEXT
    },
    cerrado_at: {
        type: DataTypes.DATE,
        comment: 'When moved to historical (Nuevo Día)'
    }
}, {
    tableName: 'pedidos_dia',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});


const OrderItem = sequelize.define('OrderItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    pedido_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'pedidos_dia',
            key: 'id'
        }
    },
    product_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'productos',
            key: 'id'
        }
    },
    product_text: {
        type: DataTypes.STRING(200)
    },
    quantity_units: {
        type: DataTypes.INTEGER
    },
    quantity_boxes: {
        type: DataTypes.INTEGER
    },
    precio_unitario: {
        type: DataTypes.NUMERIC(10, 2),
        allowNull: false
    },
    subtotal: {
        type: DataTypes.NUMERIC(10, 2),
        allowNull: false
    },
    units_per_box_snapshot: {
        type: DataTypes.INTEGER
    },
    box_type_snapshot: {
        type: DataTypes.STRING(20)
    },
    notas: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'pedido_items_dia',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = { Order, OrderItem };
