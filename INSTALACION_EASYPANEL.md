# Guía de Instalación en Easypanel

Esta guía te ayudará a instalar y configurar la aplicación de Distribuidora en tu VPS usando Easypanel.

## Requisitos Previos

- VPS con Easypanel instalado
- Acceso al panel de Easypanel
- Dominio configurado (opcional pero recomendado)

## Método 1: Instalación con Docker Compose (Recomendado)

### Paso 1: Preparar el Repositorio

1. Clona este repositorio en tu servidor o conéctalo desde GitHub en Easypanel
2. Crea un archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

3. Edita el archivo `.env` con tus configuraciones:

```bash
nano .env
```

**Variables importantes a configurar:**

- `DB_PASSWORD`: Una contraseña segura para PostgreSQL
- `JWT_SECRET`: Un string aleatorio largo y seguro (mínimo 32 caracteres)
- `VITE_API_URL`: La URL pública de tu API (ej: `https://api.tudominio.com/api`)

### Paso 2: Crear el Proyecto en Easypanel

1. Accede a tu panel de Easypanel
2. Click en "Create Project"
3. Selecciona "Docker Compose"
4. Pega el contenido del archivo `docker-compose.yml`
5. O conecta tu repositorio de GitHub

### Paso 3: Configurar Variables de Entorno en Easypanel

En la sección de Environment Variables de Easypanel, agrega:

```
DB_NAME=distribuidora_db
DB_USER=postgres
DB_PASSWORD=tu_password_seguro
JWT_SECRET=tu_jwt_secret_muy_seguro
BACKEND_PORT=3000
FRONTEND_PORT=80
VITE_API_URL=https://api.tudominio.com/api
```

### Paso 4: Configurar Dominios

En Easypanel, configura dos dominios:

1. **Frontend**:
   - Servicio: `frontend`
   - Puerto: `80`
   - Dominio: `tudominio.com` o `app.tudominio.com`

2. **Backend API**:
   - Servicio: `backend`
   - Puerto: `3000`
   - Dominio: `api.tudominio.com`

**Importante**: Asegúrate de que `VITE_API_URL` apunte al dominio del backend que configuraste.

### Paso 5: Inicializar la Base de Datos

El esquema SQL se importará automáticamente al iniciar PostgreSQL por primera vez.

Si necesitas crear un usuario administrador inicial:

1. Accede al contenedor del backend:
```bash
docker exec -it distribuidora-backend sh
```

2. Ejecuta el seed (si existe):
```bash
npm run seed
# o
node src/scripts/seed.js
```

## Método 2: Instalación Manual por Servicios

Si prefieres crear cada servicio individualmente en Easypanel:

### 1. Crear Base de Datos PostgreSQL

- Crea un servicio PostgreSQL
- Nombre: `distribuidora-postgres`
- Variables:
  - `POSTGRES_DB=distribuidora_db`
  - `POSTGRES_USER=postgres`
  - `POSTGRES_PASSWORD=tu_password`
- Volume: `/var/lib/postgresql/data`

### 2. Crear Backend

- Tipo: App
- Build Type: Dockerfile
- Dockerfile path: `backend/Dockerfile`
- Puerto: `3000`
- Variables:
  ```
  NODE_ENV=production
  PORT=3000
  DB_HOST=distribuidora-postgres
  DB_PORT=5432
  DB_NAME=distribuidora_db
  DB_USER=postgres
  DB_PASSWORD=tu_password
  JWT_SECRET=tu_jwt_secret
  ```
- Volume: `/app/uploads` (para archivos subidos)

### 3. Crear Frontend

- Tipo: App
- Build Type: Dockerfile
- Dockerfile path: `frontend/Dockerfile`
- Puerto: `80`
- Build args:
  - `VITE_API_URL=https://api.tudominio.com/api`

## Verificación

1. Accede a tu dominio del frontend
2. Deberías ver la pantalla de login
3. Verifica que el backend responda en: `https://api.tudominio.com/api/health`

## Usuarios por Defecto

Si ejecutaste el seed, deberías tener un usuario admin por defecto. Revisa el archivo `backend/src/scripts/seed.js` para conocer las credenciales.

## Troubleshooting

### El frontend no se conecta al backend

- Verifica que `VITE_API_URL` esté correctamente configurado
- Asegúrate de que el backend esté accesible públicamente
- Revisa los logs del navegador (F12) para ver errores de CORS

### Error de conexión a la base de datos

- Verifica que el servicio PostgreSQL esté corriendo
- Confirma que las credenciales en `.env` sean correctas
- Asegúrate de que `DB_HOST` apunte al nombre correcto del servicio

### Puppeteer no funciona (para PDFs)

- El Dockerfile del backend ya incluye las dependencias necesarias
- Si hay problemas, verifica los logs del contenedor backend

### Los archivos subidos no persisten

- Asegúrate de tener configurado el volume para `/app/uploads` en el backend

## Comandos Útiles

### Ver logs del backend
```bash
docker logs -f distribuidora-backend
```

### Ver logs del frontend
```bash
docker logs -f distribuidora-frontend
```

### Acceder al contenedor del backend
```bash
docker exec -it distribuidora-backend sh
```

### Backup de la base de datos
```bash
docker exec distribuidora-postgres pg_dump -U postgres distribuidora_db > backup.sql
```

### Restaurar base de datos
```bash
docker exec -i distribuidora-postgres psql -U postgres distribuidora_db < backup.sql
```

## Seguridad

1. **Cambia todas las contraseñas por defecto**
2. **Usa HTTPS** (Easypanel lo configura automáticamente con Let's Encrypt)
3. **JWT_SECRET** debe ser único y seguro
4. **Configura firewall** en tu VPS si es necesario
5. **Backups regulares** de la base de datos

## Soporte

Si encuentras problemas, revisa:
- Logs de los contenedores
- Configuración de variables de entorno
- Conectividad de red entre servicios

## Actualización

Para actualizar la aplicación:

1. Haz git pull del repositorio
2. En Easypanel, rebuild los servicios
3. O con docker-compose:
```bash
docker-compose down
docker-compose up -d --build
```

---

**Nota**: Esta aplicación está configurada para producción. Para desarrollo local, usa:

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```
