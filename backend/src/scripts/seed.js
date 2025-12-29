const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '../.env' }); // Adjust path if needed

const { sequelize, User } = require('../models');

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');
        await sequelize.sync();

        const adminExists = await User.findOne({ where: { username: 'admin' } });
        if (adminExists) {
            console.log('Admin user already exists.');
            process.exit(0);
        }

        const passwordHash = await bcrypt.hash('admin123', 10);
        await User.create({
            username: 'admin',
            email: 'admin@example.com',
            password_hash: passwordHash,
            rol: 'admin',
            nombre_completo: 'Administrador del Sistema',
            activo: true
        });

        console.log('Admin user created: username=admin, password=admin123');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
