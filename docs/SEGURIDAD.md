# Guia de Seguridad - SYN-CORE MOD LAUNCHER

---

## Arquitectura de seguridad

### 1. Context Isolation
```javascript
// main.js
webPreferences: {
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: false,
  preload: path.join(__dirname, 'preload.js'),
}
```

El renderer NO tiene acceso directo a Node.js ni al filesystem.
Toda comunicacion pasa por el preload script via IPC.

### 2. Preload Script (puente seguro)
```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getProcesses: () => ipcRenderer.invoke('get-processes'),
  scanMods: () => ipcRenderer.invoke('scan-mods'),
  injectDLL: (dllPath, processId) => ipcRenderer.invoke('inject-dll', dllPath, processId),
});
```

Solo se exponen funciones especificas. No hay acceso a `require`, `fs`, `child_process`, etc.

### 3. Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src https://fonts.gstatic.com;
  img-src 'self' data:;
">
```

- No se permiten scripts externos
- No se permiten conexiones a dominios no autorizados
- Solo fuentes de Google Fonts para tipografia

### 4. IPC Validation
Todos los datos del renderer son validados antes de procesarse:

```javascript
ipcMain.handle('inject-dll', (e, dllPath, processId) => {
  if (!dllPath.toLowerCase().endsWith('.dll')) {
    return { success: false, message: 'El archivo debe ser .dll' };
  }
  if (!fs.existsSync(dllPath)) {
    return { success: false, message: 'DLL no encontrada' };
  }
  // ...
});
```

---

## Permisos del sistema

### Archivos
| Directorio | Accion | Proposito |
|------------|--------|-----------|
| `%APPDATA%/syn-core-launcher/mods/` | Lectura/Escaneo | Buscar mods instalados |
| `%APPDATA%/syn-core-launcher/` | Escritura | Configuracion de la app |

### Red
| Dominio | Protocolo | Proposito |
|---------|-----------|-----------|
| `github.com` | HTTPS | Verificar actualizaciones |
| `objects.githubusercontent.com` | HTTPS | Descargar actualizaciones |

### Win32 API
| Funcion | DLL | Uso |
|---------|-----|-----|
| `OpenProcess` | kernel32 | Abrir proceso de GTA V |
| `VirtualAllocEx` | kernel32 | Asignar memoria remota |
| `WriteProcessMemory` | kernel32 | Escribir ruta de DLL |
| `CreateRemoteThread` | kernel32 | Crear hilo para LoadLibraryW |
| `CreateToolhelp32Snapshot` | kernel32 | Enumerar procesos |

### Permisos NO utilizados
- No se usa `SeDebugPrivilege`
- No se modifica el registro
- No se crean servicios
- No se accede a la red local

---

## Amenazas mitigadas

### 1. Ejecucion remota de codigo
**Riesgo**: Un atacante podria ejecutar codigo arbitrario via el renderer.
**Mitigacion**: `nodeIntegration: false` + `contextIsolation: true` impiden acceso a `require()`.

### 2. Escalamiento de privilegios
**Riesgo**: El launcher podria usarse para obtener permisos elevados.
**Mitigacion**: No se solicita elevacion. La inyeccion requiere que el usuario haya abierto GTA V manualmente.

### 3. Inyeccion de DLL maliciosa
**Riesgo**: Un mod malicioso podria dañar el sistema.
**Mitigacion**: Solo se inyectan DLLs desde la carpeta `mods/` que el usuario controla. No hay ejecucion automatica.

### 4. Data exfiltration
**Riesgo**: Robo de datos personales.
**Mitigacion**: No se envian datos a servidores externos. Solo GitHub Releases para actualizaciones.

---

## Checklist de seguridad para produccion

- [ ] Usar HTTPS para todas las conexiones de red
- [ ] Verificar firmas digitales de actualizaciones
- [ ] Usar code signing en el .exe
- [ ] Implementar auto-update solo desde GitHub Releases verificados
- [ ] No ejecutar codigo JavaScript del renderer en el main process
- [ ] Validar todos los paths antes de usarlos en `fs`
- [ ] No mostrar paths del sistema al usuario
- [ ] Log de errores sin informacion sensible
- [ ] Usar versiones actualizadas de todas las dependencias

---

## Code Signing

Para produccion, se recomienda firmar el .exe:

### Con electron-builder
```json
{
  "build": {
    "win": {
      "certificateFile": "certificate.pfx",
      "certificatePassword": "password"
    }
  }
}
```

### Con GitHub Actions
```yaml
- name: Sign executable
  uses: dlemstra/code-sign-action@v1
  with:
    certificate: ${{ secrets.WINDOWS_CERTIFICATE }}
    password: ${{ secrets.WINDOWS_CERTIFICATE_PASSWORD }}
```

---

## Auditoria de dependencias

```bash
# Verificar vulnerabilidades
npm audit

# Actualizar dependencias
npm update

# Revisar licencias
npx license-checker
```

### Dependencias criticas
| Paquete | Version | Riesgo | Uso |
|---------|---------|--------|-----|
| `koffi` | ^2.8.0 | Bajo | Win32 API binding |
| `electron` | ^28.0.0 | Medio | Framework |
| `electron-updater` | ^6.3.9 | Bajo | Auto-update |

---

## Incidentes de seguridad

Si se descubre una vulnerabilidad:
1. **NO** crear un issue publico
2. Enviar email a `security@syn-core.com` (o el email correspondiente)
3. Incluir: descripcion, pasos para reproducir, version afectada
4. Respuesta en 48 horas maximas
