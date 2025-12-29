const { Sequelize } = require('sequelize');
require('dotenv').config({ path: '../.env' });

const { sequelize, Category } = require('../models');

async function seedCategories() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const categories = [
            { nombre: 'Galletas', descripcion: 'Galletas y productos de panadería', activo: true },
            { nombre: 'Bebidas', descripcion: 'Refrescos, jugos y bebidas', activo: true },
            { nombre: 'Botanas', descripcion: 'Papas, frituras y snacks', activo: true },
            { nombre: 'Dulces', descripcion: 'Dulces y chocolates', activo: true },
            { nombre: 'Lácteos', descripcion: 'Leche, yogurt y derivados', activo: true },
            { nombre: 'Abarrotes', descripcion: 'Productos de abarrotes generales', activo: true },
        ];

        for (const cat of categories) {
            await Category.findOrCreate({
                where: { nombre: cat.nombre },
                defaults: cat
            });
        }

        console.log('Categories seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seedCategories();
