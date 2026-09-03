# Proyecto Análisis - Angular Frontend

Un frontend Angular moderno y limpio para gestionar el sistema de análisis.

## Características

- **Autenticación JWT**: Login seguro con token JWT
- **Gestión de Catálogos**: Empresas, Sucursales, Géneros, Estados de Usuario
- **Interfaz Dark Mode**: Tema oscuro elegante con Tailwind CSS
- **Servicio API Centralizado**: Una única clase de servicio para todas las llamadas HTTP
- **Estructura Plana**: Componentes simples y fáciles de entender
- **Guardias de Autenticación**: Rutas protegidas que requieren autenticación

## Requisitos Previos

- Node.js 18+ 
- npm 9+
- Angular CLI 18+

## Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start

# Compilar para producción
npm run build
```

## Estructura del Proyecto

```
src/
├── app/
│   ├── services/
│   │   ├── api.service.ts          # Servicio centralizado de API
│   │   ├── auth.service.ts         # Servicio de autenticación
│   │   └── auth.guard.ts           # Guardia de rutas
│   ├── components/
│   │   ├── login.component.*       # Componente de login
│   │   ├── dashboard.component.*   # Panel principal
│   │   ├── companies.component.*   # Gestión de empresas
│   │   └── branches.component.*    # Gestión de sucursales
│   ├── models/
│   │   └── index.ts                # Interfaces y tipos
│   ├── app.routes.ts               # Configuración de rutas
│   ├── app.config.ts               # Configuración de la app
│   └── app.component.*             # Componente raíz
├── styles.css                      # Estilos globales
├── main.ts                         # Punto de entrada
└── index.html                      # HTML principal
```

## Configuración

### Backend

Por defecto, la aplicación se conecta al backend en `http://localhost:3000`.

Si necesitas cambiar la URL, actualiza en [src/app/services/api.service.ts](src/app/services/api.service.ts):

```typescript
private apiUrl = 'http://localhost:3000'; // Cambia aquí
```

### Tailwind CSS

La configuración de Tailwind está en [tailwind.config.js](tailwind.config.js). El tema oscuro está habilitado por defecto.

## Endpoints Disponibles

El frontend se conecta a los siguientes endpoints del backend:

### Autenticación
- `POST /auth/login` - Iniciar sesión

### Catálogos (requieren autenticación)
- `GET /catalogos/empresas` - Obtener empresas
- `POST /catalogos/empresas` - Crear empresa
- `PUT /catalogos/empresas/:id` - Actualizar empresa
- `DELETE /catalogos/empresas/:id` - Eliminar empresa
- `GET /catalogos/sucursales` - Obtener sucursales
- `POST /catalogos/sucursales` - Crear sucursal
- `PUT /catalogos/sucursales/:id` - Actualizar sucursal
- `DELETE /catalogos/sucursales/:id` - Eliminar sucursal

## Tema y Estilos

La aplicación utiliza **Tailwind CSS** con tema oscuro. Todos los colores y estilos están configurados en [tailwind.config.js](tailwind.config.js).

Para personalizar colores, edita el archivo de configuración de Tailwind.

## Autenticación

El token JWT se almacena en `localStorage` con la clave `auth_token`. El token se envía automáticamente en todas las peticiones autenticadas en el header:

```
Authorization: Bearer <token>
```

## Notas de Desarrollo

- **Validación**: Los formularios utilizan validadores de Angular Forms
- **Manejo de Errores**: Los errores de API se muestran en la UI
- **Estados de Carga**: Los botones se deshabilitan durante las operaciones
- **Unsubscribe**: Todos los componentes implementan `OnDestroy` y usan `takeUntil` para evitar memory leaks

## Contribución

Este es un proyecto de demostración. Para modificaciones:

1. Mantén la estructura plana y simple
2. Agrega nuevos componentes en `src/app/components/`
3. Extiende el `ApiService` para nuevos endpoints
4. Usa Tailwind CSS para estilos

## Licencia

ISC

## Contacto

Proyecto Análisis 2 - Sistema de Gestión
