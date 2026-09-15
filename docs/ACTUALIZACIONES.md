# Sistema de Actualizaciones Automaticas

---

## Como funciona

El launcher usa `electron-updater` para buscar y descargar actualizaciones desde GitHub Releases.

### Flujo completo

```
App inicia
    │
    ▼
mainWindow 'ready-to-show'
    │
    ▼
autoUpdater.checkForUpdatesAndNotify()
    │
    ├─ No hay actualizacion → usuario sigue usando la app
    │
    └─ Hay actualizacion
         │
         ▼
    Dialogo nativo: "Nueva version disponible"
         │
         ▼
    Descarga en background (sin bloquear UI)
         │
         ▼
    Barra de progreso visible en la UI
         │
         ▼
    Descarga completa → toast "Reiniciar para instalar"
         │
         ▼
    Clic en "Reiniciar" → autoUpdater.quitAndInstall()
         │
         ▼
    La app se cierra, el instalador actualiza, la app reabre
```

---

## Configuracion

### package.json
```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "TU-USUARIO",
      "repo": "syn-core-launcher",
      "releaseType": "release"
    }
  }
}
```

### electron-updater en main.js
```javascript
const { autoUpdater } = require('electron-updater');

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
```

---

## Crear una liberacion

### 1. Actualizar version
```bash
# Actualizar version en package.json
npm version patch  # x.x.1 → x.x.2
npm version minor  # x.1.x → x.2.x
npm version major  # 1.x.x → 2.x.x
```

### 2. Compilar
```bash
npm run build
```

### 3. Crear release en GitHub
```bash
# Usando gh CLI
gh release create v1.0.1 dist/SYN-CORE-LAUNCHER-Setup-1.0.1.exe \
  --title "SYN-CORE v1.0.1" \
  --notes "Correccion de bugs y mejoras"
```

### 4. Formato del tag
- Tags deben empezar con `v`: `v1.0.1`, `v2.0.0`
- El nombre del .exe debe incluir la version
- Publicar como `Release` (no `Pre-release`)

---

## Eventos de actualizacion

### Desde main.js (proceso principal)
```javascript
autoUpdater.on('checking-for-update', () => { ... });
autoUpdater.on('update-available', (info) => { ... });
autoUpdater.on('update-not-available', () => { ... });
autoUpdater.on('download-progress', (progress) => { ... });
autoUpdater.on('update-downloaded', (info) => { ... });
autoUpdater.on('error', (err) => { ... });
```

### Desde renderer.js (interfaz)
```javascript
window.api.onUpdateAvailable((data) => {
  // data.version, data.releaseDate
});

window.api.onUpdateProgress((data) => {
  // data.percent, data.bytesPerSecond, data.transferred, data.total
});

window.api.onUpdateDownloaded((data) => {
  // data.version
});
```

---

## Estrategia de versiones

### MAJOR.MINOR.PATCH
- **MAJOR**: Cambios incompatibles (nueva UI, nuevos requisitos)
- **MINOR**: Nuevas funcionalidades compatibles
- **PATCH**: Correccion de bugs

### Ejemplo
```
v1.0.0 - Lanzamiento inicial
v1.0.1 - Correccion de bug en inyeccion
v1.1.0 - Nuevo soporte para GTA Legacy
v2.0.0 - Nueva interfaz, requiere reinstalacion
```

---

## Troubleshooting

### No detecta actualizaciones
1. Verificar que la version en `package.json` sea mayor a la instalada
2. Verificar que el release exista en GitHub
3. Verificar que el tag empiece con `v`
4. Verificar que el .exe este adjunto al release

### Descarga fallida
1. Verificar conexion a internet
2. Verificar que `objects.githubusercontent.com` no este bloqueado
3. Verificar espacio en disco

### Instalacion fallida
1. Ejecutar como administrador
2. Cerrar la app antes de instalar manualmente
3. Verificar que el antivirus no bloquee el instalador
