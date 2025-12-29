# Guía Paso a Paso para Easypanel

## 📌 IMPORTANTE: Crear 3 Servicios Separados

Tu aplicación necesita 3 servicios. NO uses docker-compose.yml directamente. Créalos uno por uno:

---

## 1️⃣ Crear Base de Datos PostgreSQL

### En Easypanel:
1. Click en **"+ Servicio"**
2. Busca **"Postgres"** en el catálogo
3. Configura:
   - **Nombre**: `distribuidora-postgres`
   - **Database Name**: `distribuidora_db`
   - **Username**: `postgres`
   - **Password**: `TuPasswordSeguro123!` (guárdalo!)
4. Click **"Guardar"**
5. **Espera** a que el servicio esté corriendo (luz verde)

---

## 2️⃣ Crear Backend API

### En Easypanel:
1. Click en **"+ Servicio"**
2. Selecciona **"App"**
3. En **"Fuente"**, selecciona **"Github"**
4. Configura:
   - **Propietario**: `elian-pro`
   - **Repositorio**: `testd`
   - **Rama**: `claude/install-easypanel-vps-B498l`
   - **Ruta de compilación**: `/backend` ⚠️ IMPORTANTE: poner `/backend`

5. En **"Compilación"**:
   - Selecciona: **"Dockerfile"** ☑️
   - **Archivo**: `Dockerfile` (sin ruta, solo el nombre)

6. En **"Variables de entorno"**, agrega:
   ```
   NODE_ENV=production
   PORT=3000
   DB_HOST=distribuidora-postgres
   DB_PORT=5432
   DB_NAME=distribuidora_db
   DB_USER=postgres
   DB_PASSWORD=TuPasswordSeguro123!
   JWT_SECRET=aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5zA7bC9dE1fG
   ```
   ⚠️ Usa la MISMA contraseña que pusiste en PostgreSQL

7. En **"Puertos"**:
   - **Puerto del contenedor**: `3000`

8. En **"Dominios"** (opcional):
   - Agrega: `api.tudominio.com`
   - O usa la IP: `194.163.45.121:3000`

9. En **"Volúmenes"** (para guardar archivos subidos):
   - **Nombre**: `backend-uploads`
   - **Ruta de montaje**: `/app/uploads`

10. Click **"Guardar"** y **"Implementar"**

---

## 3️⃣ Crear Frontend

### En Easypanel:
1. Click en **"+ Servicio"**
2. Selecciona **"App"**
3. En **"Fuente"**, selecciona **"Github"**
4. Configura:
   - **Propietario**: `elian-pro`
   - **Repositorio**: `testd`
   - **Rama**: `claude/install-easypanel-vps-B498l`
   - **Ruta de compilación**: `/frontend` ⚠️ IMPORTANTE: poner `/frontend`

5. En **"Compilación"**:
   - Selecciona: **"Dockerfile"** ☑️
   - **Archivo**: `Dockerfile`

6. En **"Build Args"** (argumentos de compilación):
   ```
   VITE_API_URL=http://194.163.45.121:3000/api
   ```
   ⚠️ Si configuraste un dominio para el backend, usa:
   ```
   VITE_API_URL=https://api.tudominio.com/api
   ```

7. En **"Puertos"**:
   - **Puerto del contenedor**: `80`

8. En **"Dominios"**:
   - Agrega: `tudominio.com`
   - O déjalo sin dominio para acceder por IP

9. Click **"Guardar"** y **"Implementar"**

---

## ✅ Orden de Implementación

1. **Primero**: PostgreSQL (espera a que esté verde ✓)
2. **Segundo**: Backend (espera a que esté verde ✓)
3. **Tercero**: Frontend

---

## 🔍 Verificación

### Backend:
Accede a: `http://194.163.45.121:3000/api/health`
Deberías ver: `{"status":"ok"}` o similar

### Frontend:
Accede a: `http://194.163.45.121` (puerto 80)
Deberías ver la pantalla de login

---

## 🚨 Problemas Comunes

### Error: "Cannot connect to database"
- Verifica que PostgreSQL esté corriendo (luz verde)
- Confirma que `DB_HOST=distribuidora-postgres` (el nombre exacto del servicio)
- Verifica que la contraseña sea la misma en ambos servicios

### Error: "VITE_API_URL not defined"
- El frontend necesita `VITE_API_URL` como **Build Arg**, NO como variable de entorno
- Debe ser configurado ANTES de compilar

### Error: Frontend no se conecta al backend
- Verifica que `VITE_API_URL` apunte a la URL correcta del backend
- Si usas IP: `http://194.163.45.121:3000/api`
- Si usas dominio: `https://api.tudominio.com/api`

---

## 📝 Resumen de Configuración

| Servicio | Tipo | Ruta | Dockerfile | Puerto |
|----------|------|------|------------|--------|
| PostgreSQL | Database | - | - | 5432 |
| Backend | App | `/backend` | `Dockerfile` | 3000 |
| Frontend | App | `/frontend` | `Dockerfile` | 80 |

---

## 🔐 Credenciales a Recordar

- **DB_PASSWORD**: La que configuraste en PostgreSQL
- **JWT_SECRET**: String aleatorio largo (mínimo 32 caracteres)

Guárdalas en un lugar seguro, las necesitarás.
