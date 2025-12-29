const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const login = async (req, res) => {
    try {
        const { username_or_email, password } = req.body;

        if (!username_or_email || !password) {
            return res.status(400).json({ error: 'Usuario/Email y contraseña son requeridos' });
        }

        // Find user by username OR email
        const { Op } = require('sequelize');
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { username: username_or_email },
                    { email: username_or_email }
                ],
                activo: true
            }
        });

        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Generate JWT
        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username,
                rol: user.rol
            },
            process.env.JWT_SECRET || 'secret_dev_key',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Update last login
        await user.update({ ultimo_login: new Date() });

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                nombre_completo: user.nombre_completo,
                rol: user.rol
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error en el servidor al iniciar sesión' });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.userId, {
            attributes: { exclude: ['password_hash'] }
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ user });
    } catch (error) {
        console.error('GetMe error:', error);
        res.status(500).json({ error: 'Error al obtener datos del usuario' });
    }
};

module.exports = { login, getMe };
