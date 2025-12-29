-- 1. ARQUITECTURA DEL SISTEMA -->
-- 2. BASE DE DATOS - MODELO COMPLETO

-- 2.1 Tabla: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(150),
    telefono VARCHAR(20),
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'usuario')),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_login TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);

-- 2.2 Tabla: clientes
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nombre_comercial VARCHAR(200) NOT NULL,
    tipo_salida VARCHAR(20) NOT NULL 
        CHECK (tipo_salida IN ('primera_salida', 'salida_normal', 'pickup')),
    rfc VARCHAR(13),
    email VARCHAR(100),
    telefono VARCHAR(20),
    notas TEXT,
    activo BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES usuarios(id),
    vendedor_id INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clientes_tipo_salida ON clientes(tipo_salida);
CREATE INDEX IF NOT EXISTS idx_clientes_activo ON clientes(activo);

-- 2.3 Tabla: sucursales_cliente
CREATE TABLE IF NOT EXISTS sucursales_cliente (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    nombre_sucursal VARCHAR(200) UNIQUE NOT NULL, -- ÚNICO EN TODO EL SISTEMA
    direccion TEXT,
    colonia VARCHAR(100),
    ciudad VARCHAR(100),
    codigo_postal VARCHAR(10),
    telefono VARCHAR(20),
    nombre_encargado VARCHAR(150),
    telefono_encargado VARCHAR(20),
    email_encargado VARCHAR(100),
    notas_entrega TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sucursales_client ON sucursales_cliente(client_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sucursales_nombre ON sucursales_cliente(nombre_sucursal);

-- 2.4 Tabla: usuario_clientes (Asignación)
CREATE TABLE IF NOT EXISTS usuario_clientes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    client_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_usuario_clientes_user ON usuario_clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_usuario_clientes_client ON usuario_clientes(client_id);

-- 2.5 Tabla: categorias_producto
CREATE TABLE IF NOT EXISTS categorias_producto (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.6 Tabla: productos
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    codigo_interno VARCHAR(50) UNIQUE, -- Código general/SKU
    codigo_zelma VARCHAR(50), -- Código usado en Zelma
    codigo_hunucma VARCHAR(50), -- Código usado en Hunucmá
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    especificaciones TEXT, -- Info extra (peso, marca, presentación)
    categoria_id INTEGER REFERENCES categorias_producto(id),
    
    -- Reglas de empaque
    units_per_box INTEGER DEFAULT 1, -- Unidades por caja
    box_type VARCHAR(20) NOT NULL 
        CHECK (box_type IN ('definida', 'no_definida', 'no_aplica')),
    permite_unidad BOOLEAN DEFAULT true, -- Se puede pedir por unidad
    permite_caja BOOLEAN DEFAULT true, -- Se puede pedir por caja
    
    -- Multimedia
    foto_url VARCHAR(255), -- URL relativa o absoluta
    foto_thumbnail_url VARCHAR(255),
    
    -- Precios
    precio_general NUMERIC(10, 2) DEFAULT 0.00,
    
    -- Control
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos(nombre);
CREATE INDEX IF NOT EXISTS idx_productos_codigo_zelma ON productos(codigo_zelma);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);

-- 2.7 Tabla: precios_cliente
CREATE TABLE IF NOT EXISTS precios_cliente (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    precio NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES usuarios(id),
    UNIQUE(client_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_precios_cliente_client ON precios_cliente(client_id);
CREATE INDEX IF NOT EXISTS idx_precios_cliente_product ON precios_cliente(product_id);

-- 2.8 Tabla: inventario_hunucma
CREATE TABLE IF NOT EXISTS inventario_hunucma (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    stock_units INTEGER DEFAULT 0 NOT NULL, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_inv_hunucma_product ON inventario_hunucma(product_id);

-- Constraint: stock no negativo
-- ALTER TABLE inventario_hunucma 
--    ADD CONSTRAINT chk_hunucma_stock_nonneg CHECK (stock_units >= 0);

-- 2.9 Tabla: inventario_zelma
CREATE TABLE IF NOT EXISTS inventario_zelma (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    stock_boxes INTEGER DEFAULT 0 NOT NULL, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_inv_zelma_product ON inventario_zelma(product_id);

-- 2.10 Tabla: ajustes_inventario
CREATE TABLE IF NOT EXISTS ajustes_inventario (
    id SERIAL PRIMARY KEY,
    ubicacion VARCHAR(20) NOT NULL CHECK (ubicacion IN ('hunucma', 'zelma')),
    product_id INTEGER NOT NULL REFERENCES productos(id),
    delta_units INTEGER, -- Para Hunucmá
    delta_boxes INTEGER, -- Para Zelma
    stock_anterior_units INTEGER, -- Snapshot antes del ajuste
    stock_anterior_boxes INTEGER,
    stock_nuevo_units INTEGER, -- Snapshot después
    stock_nuevo_boxes INTEGER,
    motivo VARCHAR(100) NOT NULL, -- 'merma', 'daño', 'ajuste_inventario', 'conteo_físico'
    notas TEXT,
    user_id INTEGER NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ajustes_ubicacion ON ajustes_inventario(ubicacion);
CREATE INDEX IF NOT EXISTS idx_ajustes_product ON ajustes_inventario(product_id);
CREATE INDEX IF NOT EXISTS idx_ajustes_fecha ON ajustes_inventario(created_at);

-- 2.11 Tabla: pedidos_dia (Operativo)
CREATE TABLE IF NOT EXISTS pedidos_dia (
    id SERIAL PRIMARY KEY,
    folio VARCHAR(20) UNIQUE NOT NULL, -- Generado automático (ej: "14043")
    client_id INTEGER NOT NULL REFERENCES clientes(id),
    sucursal_id INTEGER NOT NULL REFERENCES sucursales_cliente(id),
    creado_por_user_id INTEGER NOT NULL REFERENCES usuarios(id),
    
    fecha_entrega DATE NOT NULL,
    origen_surtido VARCHAR(20) DEFAULT 'auto' 
        CHECK (origen_surtido IN ('auto', 'hunucma', 'zelma', 'externo')),
    estado VARCHAR(20) DEFAULT 'borrador' 
        CHECK (estado IN ('borrador', 'confirmado', 'reprogramado', 'cancelado')),
    
    subtotal NUMERIC(10, 2) DEFAULT 0.00,
    descuento NUMERIC(10, 2) DEFAULT 0.00,
    total NUMERIC(10, 2) DEFAULT 0.00,
    
    observaciones TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmado_at TIMESTAMP,
    confirmado_por INTEGER REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_pedidos_dia_folio ON pedidos_dia(folio);
CREATE INDEX IF NOT EXISTS idx_pedidos_dia_client ON pedidos_dia(client_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_dia_sucursal ON pedidos_dia(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_dia_fecha ON pedidos_dia(fecha_entrega);
CREATE INDEX IF NOT EXISTS idx_pedidos_dia_estado ON pedidos_dia(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_dia_created ON pedidos_dia(created_at);

-- 2.12 Tabla: pedido_items_dia
CREATE TABLE IF NOT EXISTS pedido_items_dia (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES pedidos_dia(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES productos(id), -- NULL si es texto libre
    product_text VARCHAR(200), -- Nombre del producto (puede ser texto libre)
    
    quantity_units INTEGER, -- Base: siempre unidades
    quantity_boxes INTEGER, -- Si se capturó por cajas
    
    precio_unitario NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    
    -- Info snapshot del producto al momento del pedido
    units_per_box_snapshot INTEGER,
    box_type_snapshot VARCHAR(20),
    
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_items_dia_pedido ON pedido_items_dia(pedido_id);
CREATE INDEX IF NOT EXISTS idx_items_dia_product ON pedido_items_dia(product_id);

-- 2.13 Tabla: historico_pedidos
CREATE TABLE IF NOT EXISTS historico_pedidos (
    id SERIAL PRIMARY KEY,
    pedido_original_id INTEGER, -- Referencia al ID original de pedidos_dia
    folio VARCHAR(20) NOT NULL,
    client_id INTEGER NOT NULL REFERENCES clientes(id),
    sucursal_id INTEGER NOT NULL REFERENCES sucursales_cliente(id),
    creado_por_user_id INTEGER NOT NULL REFERENCES usuarios(id),
    
    fecha_entrega DATE NOT NULL,
    origen_surtido VARCHAR(20),
    estado VARCHAR(20) DEFAULT 'cerrado',
    
    subtotal NUMERIC(10, 2) DEFAULT 0.00,
    descuento NUMERIC(10, 2) DEFAULT 0.00,
    total NUMERIC(10, 2) DEFAULT 0.00,
    
    observaciones TEXT,
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    confirmado_at TIMESTAMP,
    confirmado_por INTEGER REFERENCES usuarios(id),
    cerrado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cerrado_por INTEGER REFERENCES usuarios(id),
    
    -- Tracking de ediciones post-cierre
    editado_at TIMESTAMP,
    editado_por INTEGER REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_historico_folio ON historico_pedidos(folio);
CREATE INDEX IF NOT EXISTS idx_historico_client ON historico_pedidos(client_id);
CREATE INDEX IF NOT EXISTS idx_historico_fecha ON historico_pedidos(fecha_entrega);
CREATE INDEX IF NOT EXISTS idx_historico_cerrado ON historico_pedidos(cerrado_at);

-- 2.14 Tabla: historico_items
CREATE TABLE IF NOT EXISTS historico_items (
    id SERIAL PRIMARY KEY,
    pedido_historico_id INTEGER NOT NULL REFERENCES historico_pedidos(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES productos(id),
    product_text VARCHAR(200),
    
    quantity_units INTEGER,
    quantity_boxes INTEGER,
    
    precio_unitario NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    
    units_per_box_snapshot INTEGER,
    box_type_snapshot VARCHAR(20),
    
    notas TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_historico_items_pedido ON historico_items(pedido_historico_id);
CREATE INDEX IF NOT EXISTS idx_historico_items_product ON historico_items(product_id);

-- 2.15 Tabla: movimientos_inventario (Kardex/Auditoría)
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id SERIAL PRIMARY KEY,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ubicacion VARCHAR(20) NOT NULL CHECK (ubicacion IN ('hunucma', 'zelma')),
    product_id INTEGER NOT NULL REFERENCES productos(id),
    
    delta_units INTEGER, -- Cambio en unidades (+ o -)
    delta_boxes INTEGER, -- Cambio en cajas (+ o -)
    
    stock_anterior_units INTEGER,
    stock_anterior_boxes INTEGER,
    stock_nuevo_units INTEGER,
    stock_nuevo_boxes INTEGER,
    
    tipo_movimiento VARCHAR(50) NOT NULL,
    -- Tipos: 'nuevo_dia', 'ajuste_manual', 'correccion', 'reabastecimiento'
    
    referencia_id INTEGER, -- ID del pedido, ajuste, etc.
    referencia_tipo VARCHAR(50), -- 'pedido', 'ajuste', 'reabastecimiento'
    
    notas TEXT,
    user_id INTEGER REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_inventario(fecha);
CREATE INDEX IF NOT EXISTS idx_movimientos_ubicacion ON movimientos_inventario(ubicacion);
CREATE INDEX IF NOT EXISTS idx_movimientos_product ON movimientos_inventario(product_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON movimientos_inventario(tipo_movimiento);

-- 2.16 Tabla: config_operacion
CREATE TABLE IF NOT EXISTS config_operacion (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    tipo VARCHAR(20), -- 'string', 'integer', 'boolean', 'json'
    descripcion TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES usuarios(id)
);

-- Valores iniciales
INSERT INTO config_operacion (clave, valor, tipo, descripcion) VALUES
('cutoff_hora', '10:00', 'string', 'Hora de corte para programación de entrega'),
('dias_laborales', '["lunes","martes","miercoles","jueves","viernes","sabado"]', 'json', 'Días laborales'),
('texto_legal_nota', 'Por este PAGARÉ, yo prometo...', 'string', 'Texto legal del pagaré en nota'),
('logo_url', '/uploads/logo.png', 'string', 'URL del logo principal'),
('ubicacion_logo_x', '50', 'integer', 'Posición X del logo en nota (px o %)'),
('ubicacion_logo_y', '10', 'integer', 'Posición Y del logo'),
('folio_actual', '14043', 'integer', 'Último folio generado')
ON CONFLICT (clave) DO NOTHING;

-- 2.17 Tabla: config_minmax_hunucma
CREATE TABLE IF NOT EXISTS config_minmax_hunucma (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    min_units INTEGER DEFAULT 0,
    max_units INTEGER DEFAULT 0,
    auto_calculado_min INTEGER, -- Valor calculado automáticamente
    auto_calculado_max INTEGER,
    override_manual BOOLEAN DEFAULT false, -- Si admin editó manualmente
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_minmax_product ON config_minmax_hunucma(product_id);

-- 2.18 Tabla: pdfs_generados
CREATE TABLE IF NOT EXISTS pdfs_generados (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL, -- 'nota_individual', 'resumen_repartidor'
    referencia_id INTEGER, -- ID pedido o fecha operación
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ruta_archivo VARCHAR(255),
    generado_por INTEGER REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_pdfs_tipo ON pdfs_generados(tipo);
CREATE INDEX IF NOT EXISTS idx_pdfs_fecha ON pdfs_generados(fecha_generacion);

-- 2.19 Tabla: imagenes_operativas
CREATE TABLE IF NOT EXISTS imagenes_operativas (
    id SERIAL PRIMARY KEY,
    fecha_operacion DATE NOT NULL,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('A', 'B', 'C')),
    -- A: Retiro Hunucmá, B: Retiro Zelma, C: Reabastecimiento
    ruta_archivo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_imagenes_fecha ON imagenes_operativas(fecha_operacion);
CREATE INDEX IF NOT EXISTS idx_imagenes_tipo ON imagenes_operativas(tipo);
