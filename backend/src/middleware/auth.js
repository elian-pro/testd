const jwt = require('jsonwebtoken');
const { User } = require('../models');

const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ error: 'Formato de token inválido' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_dev_key');

        // Check if user still exists and is active
        const user = await User.findByPk(decoded.userId);

        if (!user || !user.activo) {
            return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
        }

        req.user = decoded; // Attach user info to request
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
};

const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado: requiere rol admin' });
    }
    next();
};

module.exports = { requireAuth, requireAdmin };
