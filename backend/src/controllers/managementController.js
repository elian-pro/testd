const { User, Client, Branch } = require('../models');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

// --- USERS ---

const getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password_hash'] }
        });
        res.json({ users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
};

const createUser = async (req, res) => {
    try {
        const { username, email, password, nombre_completo, rol } = req.body;

        // Validations could be improved or moved to specialized middleware
        if (!username || !email || !password || !rol) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        const newUser = await User.create({
            username,
            email,
            password_hash,
            nombre_completo,
            rol
        });

        const userResp = newUser.toJSON();
        delete userResp.password_hash;

        res.status(201).json({ user: userResp });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'Usuario o email ya existe' });
        }
        console.error(error);
        res.status(500).json({ error: 'Error al crear usuario' });
    }
};

const toggleUserActive = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);

        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        await user.update({ activo: !user.activo });
        res.json({ message: `Usuario ${user.activo ? 'activado' : 'desactivado'} correctamente` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
};


// --- CLIENTS ---

const getClients = async (req, res) => {
    try {
        // If admin, all clients. If user, only assigned ones (TODO: User-Client assignment logic in phase 3)
        // For now, returning all for Admin
        const clients = await Client.findAll({
            include: [
                {
                    model: Branch,
                    as: 'sucursales'
                },
                {
                    model: User,
                    as: 'vendedor',
                    attributes: ['id', 'username', 'nombre_completo']
                }
            ],
            order: [['nombre_comercial', 'ASC']]
        });
        res.json({ clients });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
};

const createClient = async (req, res) => {
    try {
        const { nombre_comercial, tipo_salida, rfc, email, telefono, notas, vendedor_id } = req.body;

        const newClient = await Client.create({
            nombre_comercial,
            tipo_salida,
            rfc,
            email,
            telefono,
            notas,
            created_by: req.user.userId,
            vendedor_id: vendedor_id || null
        });

        res.status(201).json({ client: newClient });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear cliente' });
    }
};

const updateClient = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_comercial, tipo_salida, rfc, email, telefono, notas, vendedor_id, activo } = req.body;

        const client = await Client.findByPk(id);
        if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });

        await client.update({
            nombre_comercial,
            tipo_salida,
            rfc,
            email,
            telefono,
            notas,
            vendedor_id: vendedor_id || null,
            activo: activo !== undefined ? activo : client.activo
        });

        res.json({ client });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar cliente' });
    }
};

const createBranch = async (req, res) => {
    try {
        const { clientId } = req.params;
        const { nombre_sucursal, direccion, telefono, nombre_encargado } = req.body;

        const newBranch = await Branch.create({
            client_id: clientId,
            nombre_sucursal,
            direccion,
            telefono,
            nombre_encargado
        });

        res.status(201).json({ branch: newBranch });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'Nombre de sucursal ya existe' });
        }
        console.error(error);
        res.status(500).json({ error: 'Error al crear sucursal' });
    }
};

module.exports = {
    getUsers,
    createUser,
    toggleUserActive,
    getClients,
    createClient,
    updateClient,
    createBranch
    createBranch
};
