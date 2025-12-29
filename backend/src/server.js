require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Sequelize } = require('sequelize');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Sistema de Pedidos API running' });
});

const authRoutes = require('./routes/authRoutes');
const managementRoutes = require('./routes/managementRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const operationsRoutes = require('./routes/operationsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { sequelize } = require('./models');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', managementRoutes);
app.use('/api', productRoutes);
app.use('/api', orderRoutes);
app.use('/api', inventoryRoutes);
app.use('/api', webhookRoutes);
app.use('/api', operationsRoutes);
app.use('/api', dashboardRoutes);


// Database Connection & Sync
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    // Sync models (careful with force: true in production!)
    // For dev, alter: true helps update schema without dropping data
    await sequelize.sync({ alter: true });
    console.log('Database synced.');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

startServer();
