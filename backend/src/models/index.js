const sequelize = require('../config/database');
const User = require('./User');
const Client = require('./Client');
const Branch = require('./Branch');
const Category = require('./Category');
const Product = require('./Product');
const { InventoryHunucma, InventoryZelma } = require('./Inventory');
const { Order, OrderItem } = require('./Order');
const Notification = require('./Notification');

// User Associations
User.hasMany(Client, { foreignKey: 'created_by' });
Client.belongsTo(User, { foreignKey: 'created_by', as: 'creador' });
Client.belongsTo(User, { foreignKey: 'vendedor_id', as: 'vendedor' });

// Client Associations
Client.hasMany(Branch, { foreignKey: 'client_id', as: 'sucursales' });
Branch.belongsTo(Client, { foreignKey: 'client_id', as: 'cliente' });

// Category & Product Associations
Category.hasMany(Product, { foreignKey: 'categoria_id' });
Product.belongsTo(Category, { foreignKey: 'categoria_id' });

// Inventory Associations
Product.hasOne(InventoryHunucma, { foreignKey: 'product_id', as: 'inventario_hunucma' });
InventoryHunucma.belongsTo(Product, { foreignKey: 'product_id' });

Product.hasOne(InventoryZelma, { foreignKey: 'product_id', as: 'inventario_zelma' });
InventoryZelma.belongsTo(Product, { foreignKey: 'product_id' });

// Order Associations
Client.hasMany(Order, { foreignKey: 'client_id' });
Order.belongsTo(Client, { foreignKey: 'client_id', as: 'cliente' });

Branch.hasMany(Order, { foreignKey: 'sucursal_id' });
Order.belongsTo(Branch, { foreignKey: 'sucursal_id', as: 'sucursal' });

User.hasMany(Order, { foreignKey: 'creado_por_user_id', as: 'pedidos_creados' });
Order.belongsTo(User, { foreignKey: 'creado_por_user_id', as: 'creador' });

Order.hasMany(OrderItem, { foreignKey: 'pedido_id', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'pedido_id' });

Product.hasMany(OrderItem, { foreignKey: 'product_id' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id' });

// Notification Associations
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
    sequelize,
    User,
    Client,
    Branch,
    Category,
    Product,
    InventoryHunucma,
    InventoryZelma,
    Order,
    OrderItem,
    Notification
};

