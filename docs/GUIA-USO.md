# SYN-CORE MOD LAUNCHER

### Instalacion, uso y configuracion completa.

---

## Tabla de contenidos

1. [Instalacion](#1-instalacion)
2. [Uso basico](#2-uso-basico)
3. [Estructura de mods](#3-estructura-de-mods)
4. [Archivo mod.json](#4-archivo-modjson)
5. [Actualizaciones automaticas](#5-actualizaciones-automaticas)
6. [Compilar el .exe](#6-compiler-el-exe)
7. [Seguridad](#7-seguridad)
8. [Solucion de problemas](#8-solucion-de-problemas)

---

## 1. Instalacion

### Requisitos
- Windows 10/11 (64-bit)
- Node.js 18+ (solo para desarrollo)
- GTA V o GTA V Enhanced instalado

### Desde fuente
```bash
git clone https://github.com/TU-USUARIO/syn-core-launcher.git
cd syn-core-launcher
npm install
npm approve-scripts electron koffi
npm start
```

### Desde .exe (liberacion)
1. Descargar `SYN-CORE-LAUNCHER-Setup-x.x.x.exe` desde GitHub Releases
2. Ejecutar el instalador
3. Seleccionar carpeta de instalacion
4. Iniciar desde el acceso directo del escritorio

---

## 2. Uso basico

### Ventana principal
- **Barra lateral izquierda**: Cambia entre GTA Enhanced y GTA Legacy
- **Barra de estado superior**: Muestra si GTA V esta detectado (PID en verde)
- **Area principal**: Lista de mods disponibles con boton de inyeccion

### Inyectar un mod
1. Abrir GTA V (o GTA V Enhanced)
2. Esperar a que el PID aparezca en verde en la barra superior
3. Hacer clic en "INYECTAR AHORA" en el mod deseado
4. El toast confirmara la inyeccion

### Teclas de acceso rapido
- El launcher no requiere teclas especiales
- Todos los controles son clics en la interfaz

---

## 3. Estructura de mods

```
mods/
  GTA Enhanced/
    DLL/
      YimMenu V2/
        YimMenuV2.dll
        mod.json
      YimMenu V2 Rojo/
        YimMenuV2Rojo.dll
        mod.json
  GTA Legacy/
    DLL/
      mod.json
```

### Reglas
- Cada mod es una **carpeta** dentro de `DLL/`
- Cada carpeta contiene un `.dll` y un `mod.json`
- El nombre de la carpeta es el ID del mod
- Solo se carga el primer `.dll` encontrado en cada carpeta

---

## 4. Archivo mod.json

### Campos disponibles

| Campo          | Tipo    | Obligatorio | Descripcion                                      |
|----------------|---------|-------------|--------------------------------------------------|
| `name`         | string  | No          | Nombre visible en la UI (default: nombre carpeta)|
| `description`  | string  | No          | Descripcion del mod                              |
| `key`          | string  | No          | Tecla de activacion (default: "INSERT")          |
| `badge`        | string  | No          | Texto del badge (default: "MOD")                 |
| `badgeColor`   | string  | No          | Color: "cyan", "red", "amber"                    |
| `icon`         | string  | No          | Icono Material Symbols (default: "bolt")         |

### Ejemplo minimo
```json
{
  "name": "Mi Mod",
  "description": "Descripcion del mod"
}
```

### Ejemplo completo
```json
{
  "name": "YimMenu V2",
  "description": "Menu completo con todas las funciones",
  "key": "INSERT",
  "badge": "MENU",
  "badgeColor": "cyan",
  "icon": "bolt"
}
```

---

## 5. Actualizaciones automaticas

El launcher busca actualizaciones automaticamente al iniciar.

### Flujo
1. Al abrir, se verifica GitHub Releases por nuevas versiones
2. Si hay actualizacion disponible, se notifica al usuario
3. La descarga ocurre en segundo plano con barra de progreso
4. Cuando termina, se ofrece reiniciar para instalar

### Manualmente
- Ir a la seccion "Actualizaciones" en la barra lateral
- Clic en "Buscar actualizaciones"
- Si hay nueva version, clic en "Reiniciar para instalar"

### Configuracion
Las actualizaciones usan `electron-updater` con GitHub Releases.
La configuracion esta en `package.json` dentro de `build.publish`.

---

## 6. Compilar el .exe

### Requisitos
- Node.js 18+
- Windows 10/11

### Compilar
```bash
# Instalar dependencias
npm install
npm approve-scripts electron koffi

# Generar instalador NSIS
npm run build

# Generar portable (sin instalador)
npm run build:portable

# Generar carpeta sin empaquetar
npm run build:dir
```

### Salida
Los archivos se generan en `dist/`:
- `SYN-CORE-LAUNCHER-Setup-x.x.x.exe` (instalador)
- `SYN-CORE-LAUNCHER-x.x.x.exe` (portable)

### Notas
- `koffi` usa binarios pre-compilados (no requiere Visual Studio)
- `electron-builder` genera el instalador NSIS automaticamente
- Si hay problemas con symlinks, ejecutar como administrador

---

## 7. Seguridad

### Arquitectura implementada
- **contextIsolation: ON** - Renderer aislado del proceso principal
- **nodeIntegration: OFF** - Sin acceso a Node.js desde el renderer
- **preload.js** - Puente IPC seguro con `contextBridge`
- **CSP headers** - Content Security Policy en el HTML

### Permisos de archivos
- El launcher solo accede a su propia carpeta `mods/`
- No modifica archivos del sistema
- No accede a la carpeta de GTA V

### Permisos de red
- Solo conexiones a GitHub Releases para actualizaciones
- No se envian datos personales
- No hay telemetria

---

## 8. Solucion de problemas

### GTA V no se detecta
- Asegurarse de que GTA V este corriendo
- Verificar que el PID aparezca en la barra de estado
- Algunos antivirus bloquean la enumeracion de procesos

### DLL no se inyecta
- Verificar que el archivo sea `.dll` valido
- Ejecutar el launcher como administrador
- Desactivar temporalmente el antivirus
- Verificar que el juego este en modo ventana o Sin DXGI

### La app no inicia
- Verificar que Node.js este instalado: `node --version`
- Reinstalar dependencias: `rm -rf node_modules && npm install`
- Ejecutar `npm approve-scripts electron koffi`

### Actualizaciones no funcionan
- Verificar conexion a internet
- Verificar que GitHub no este bloqueado
- Los releases deben ser `public` en GitHub

---

## Soporte

- GitHub Issues: `https://github.com/TU-USUARIO/syn-core-launcher/issues`
- Licencia: MIT
