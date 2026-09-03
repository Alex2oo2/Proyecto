# Guía Rápida de Inicio

## Pasos para Ejecutar la Aplicación

### 1. Asegúrate que el Backend esté Corriendo
```bash
cd Proyecto_analisis_2
npm install
npm start
# El servidor debe estar en http://localhost:3000
```

### 2. Instala Dependencias del Frontend
```bash
cd Proyecto_analisis_FE
npm install
```

### 3. Inicia el Servidor de Desarrollo
```bash
npm start
```

La aplicación se abrirá automáticamente en `http://localhost:4200`

## Credenciales de Prueba

Usa las credenciales de un usuario existente en la base de datos. Según el código del backend:
- **Usuario**: (ej: username de la tabla USUARIO)
- **Contraseña**: (contraseña registrada)

## Funcionalidades Disponibles

### Login
- Ingresa con tus credenciales
- El token JWT se guarda automáticamente
- La sesión persiste en localStorage

### Dashboard
- Visualiza tu información de usuario y rol
- Cambia entre secciones usando las pestañas

### Gestión de Empresas
- **Ver**: Lista de todas las empresas
- **Crear**: Nuevo botón para agregar empresas
- **Editar**: Haz clic en "Editar" en cada empresa
- **Eliminar**: Haz clic en "Eliminar" (requiere confirmación)

### Gestión de Sucursales
- Similar a empresas, pero vinculadas a una empresa
- Selecciona la empresa al crear/editar

## Notas Importantes

1. **CORS**: El backend debe tener CORS habilitado (ya está configurado)
2. **Autenticación**: Todas las peticiones excepto login requieren token
3. **Permisos**: Algunos endpoints requieren permisos específicos del rol
4. **Tema Oscuro**: El tema está completamente en modo oscuro por defecto

## Troubleshooting

### Error: "Cannot GET /api/..."
- Asegúrate que el backend está corriendo en `http://localhost:3000`
- Verifica que los endpoints existen en el backend

### Error: "Token inválido o expirado"
- Cierra sesión y vuelve a iniciar
- Limpia localStorage: `localStorage.clear()`

### Error: "Acceso denegado"
- Tu rol no tiene permisos para esa acción
- Contacta al administrador para que te asigne permisos

## Documentación

- [README Principal](./README.md) - Información general del proyecto
- [Angular Docs](https://angular.io/docs) - Documentación oficial de Angular
- [Tailwind CSS](https://tailwindcss.com/docs) - Documentación de estilos
