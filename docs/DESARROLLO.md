# Guia de Desarrollo - SYN-CORE MOD LAUNCHER

---

## Estructura del proyecto

```
syn-core-launcher/
├── main.js              # Proceso principal (Node.js)
├── preload.js           # Puente IPC seguro
├── package.json         # Dependencias y configuracion electron-builder
├── src/
│   ├── index.html       # Interfaz principal
│   ├── styles.css       # Estilos (tema SYN-CORE)
│   └── renderer.js      # Logica del frontend
├── mods/                # Mods del usuario
│   ├── GTA Enhanced/
│   │   └── DLL/
│   └── GTA Legacy/
│       └── DLL/
├── assets/
│   └── icon.ico         # Icono de la app
├── docs/
│   ├── GUIA-USO.md      # Documentacion para el usuario
│   ├── SEGURIDAD.md     # Arquitectura de seguridad
│   ├── ACTUALIZACIONES.md # Sistema de auto-update
│   └── DESARROLLO.md    # Esta guia
└── README.md
```

---

## Stack tecnologico

| Componente | Tecnologia | Version |
|------------|------------|---------|
| Framework | Electron | ^28.0.0 |
| Win32 API | koffi | ^2.8.0 |
| Empaquetado | electron-builder | ^25.1.8 |
| Auto-update | electron-updater | ^6.3.9 |
| UI | HTML/CSS/JS vanilla | - |
| Tipografia | Barlow Condensed, Chivo, JetBrains Mono | - |
| Iconos | Material Symbols Outlined | - |

---

## Arquitectura

### Proceso Principal (main.js)
- Ventana de BrowserWindow con `contextIsolation: true`
- Inicializacion de Win32 API via koffi
- Escaneo de mods en `%APPDATA%/syn-core-launcher/mods/`
- Inyeccion de DLLs via `CreateRemoteThread` + `LoadLibraryW`
- Auto-updater via `electron-updater`

### Preload Script (preload.js)
- Expone API segura via `contextBridge.exposeInMainWorld`
- IPC invoke para operaciones sincronas
- IPC on para eventos de actualizacion

### Renderer (src/renderer.js)
- DOM manipulation vanilla
- Polling de procesos cada 2 segundos
- View switching (Mods, Actualizaciones, Ajustes)
- Toast notifications
- Manejo de actualizaciones

---

## Comandos de desarrollo

```bash
# Instalar dependencias
npm install
npm approve-scripts electron koffi

# Ejecutar en modo desarrollo
npm start

# Compilar .exe
npm run build

# Compilar portable
npm run build:portable

# Compilar sin empaquetar (para debug)
npm run build:dir
```

---

## Convenciones de codigo

### JavaScript
- Sin framework, vanilla JS
- Funciones async/await para IPC
- Nombres descriptivos en ingles
- Sin comments (excepto secciones)
- `const` por defecto, `let` cuando sea necesario

### CSS
- Variables de color no usadas (colores hardcodeados en el tema)
- Clases BEM-ish: `.mod-card`, `.mod-card-header`, `.mod-icon`
- Grid para layouts, Flexbox para componentes
- Responsive con `minmax()` en grids

### HTML
- Semantic tags (`nav`, `main`, `button`)
- Material Symbols para iconos
- IDs para referencia JS, clases para estilos

---

## Dependencias

### Production
| Paquete | Uso | Tamaño |
|---------|-----|--------|
| `koffi` | Win32 API binding | ~2MB (prebuilt) |
| `electron-updater` | Auto-update desde GitHub | ~500KB |

### Development
| Paquete | Uso |
|---------|-----|
| `electron` | Framework |
| `electron-builder` | Empaquetado y build |

---

## Win32 API (koffi)

### Funciones utilizadas
```javascript
// Procesos
OpenProcess(access, inherit, pid) → handle
CloseHandle(handle) → bool
CreateToolhelp32Snapshot(flags, pid) → handle
Process32FirstW(snapshot, entry) → bool
Process32NextW(snapshot, entry) → bool

// Memoria
VirtualAllocEx(handle, addr, size, allocType, protect) → addr
VirtualFreeEx(handle, addr, size, freeType) → bool
WriteProcessMemory(handle, addr, buffer, size, written) → bool

// Hilos
CreateRemoteThread(handle, attr, stackSize, startAddr, param, flags, threadId) → handle
WaitForSingleObject(handle, timeout) → bool

// DLLs
GetModuleHandleA(name) → handle
GetProcAddress(handle, name) → addr
```

### Struct PROCESSENTRY32W
```javascript
const PROCESSENTRY32W = koffi.struct('PROCESSENTRY32W', {
  dwSize: 'uint32',
  cntUsage: 'uint32',
  th32ProcessID: 'uint32',
  th32DefaultHeapID: 'uint64',
  th32ModuleID: 'uint32',
  th32ThreadCount: 'uint32',
  th32ParentProcessID: 'uint32',
  pcPriClassBase: 'int32',
  dwFlags: 'uint32',
  szExeFile: koffi.array('char16_t', 260),
});
```

---

## Testing

### Pruebas manuales
1. Ejecutar `npm start`
2. Abrir GTA V
3. Verificar que el PID aparece en la barra de estado
4. Colocar un mod en `mods/GTA Enhanced/DLL/`
5. Verificar que la card del mod aparece
6. Clic en "INYECTAR AHORA"
7. Verificar que la DLL se inyecta

### Pruebas de actualizacion
1. Publicar un release en GitHub con version mayor
2. Ejecutar la version anterior
3. Verificar que detecta la actualizacion
4. Verificar que descarga e instala

---

## Contribuir

1. Fork el repositorio
2. Crear branch: `git checkout -b feature/nueva-funcionalidad`
3. Hacer cambios
4. Probar: `npm start`
5. Compilar: `npm run build`
6. Crear Pull Request

### Branch naming
- `feature/descripcion` - Nuevas funcionalidades
- `fix/descripcion` - Correccion de bugs
- `docs/descripcion` - Cambios en documentacion

---

## License

MIT
