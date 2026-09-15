# SYN-CORE MOD LAUNCHER

![Electron](https://img.shields.io/badge/Electron-28-47848F?logo=electron)
![License](https://img.shields.io/badge/License-MIT-green)
![Platform](https://img.shields.io/badge/Platform-Windows_10%2F11-blue)

Launcher de mods para GTA V con interfaz tactica, inyeccion de DLLs y actualizaciones automaticas desde GitHub Releases.

---

## Caracteristicas

- **Interfaz tactica** - Tema "Underground Syndicate" con Barlow Condensed y JetBrains Mono
- **Inyeccion de DLLs** - Inyeccion directa via Win32 API (koffi)
- **Soporte dual** - GTA Enhanced y GTA Legacy
- **Auto-scan** - Detecta mods automaticamente desde `mods/`
- **Actualizaciones** - Busca y descarga actualizaciones desde GitHub Releases
- **Seguridad** - contextIsolation, preload script, CSP headers
- **Sin installers** - Portable o instalador NSIS

---

## Capturas

```
┌─────────────────────────────────────────────────┐
│ SYN-CORE    GTA V: 12345    [─] [□] [×]        │
├──────────┬──────────────────────────────────────┤
│ MODOS    │  GTA ENHANCED    MOD ENGINE v4.2     │
│          │                                      │
│ [GTA EN] │  ┌─────────┐  ┌─────────┐           │
│ [GTA LE] │  │ YimMenu │  │ YimMenu │           │
│          │  │   V2    │  │ V2 Rojo │           │
│          │  │ [INJECT]│  │ [INJECT]│           │
│──────────│  └─────────┘  └─────────┘           │
│ Updates  │                                      │
│ Settings │                                      │
├──────────┴──────────────────────────────────────┤
│ PID: 12345  DLLs: 2  Sistema OK       v1.0.0   │
└─────────────────────────────────────────────────┘
```

---

## Instalacion

### Requisitos
- Windows 10/11 (64-bit)
- Node.js 18+ (solo para desarrollo)
- GTA V o GTA V Enhanced

### Desde fuente
```bash
git clone https://github.com/TU-USUARIO/syn-core-launcher.git
cd syn-core-launcher
npm install
npm approve-scripts electron koffi
npm start
```

### Compilar .exe
```bash
npm run build
```
El instalador se genera en `dist/`.

---

## Uso

1. Ejecutar el launcher
2. Abrir GTA V
3. Esperar a que el PID aparezca en verde
4. Seleccionar el mod
5. Clic en "INYECTAR AHORA"

---

## Mods

### Estructura
```
mods/
  GTA Enhanced/
    DLL/
      MiMod/
        MiMod.dll
        mod.json
  GTA Legacy/
    DLL/
```

### mod.json (ejemplo)
```json
{
  "name": "Mi Mod",
  "description": "Descripcion del mod",
  "key": "INSERT",
  "badge": "MENU",
  "badgeColor": "cyan"
}
```

---

## Documentacion

- [Guia de uso](docs/GUIA-USO.md)
- [Seguridad](docs/SEGURIDAD.md)
- [Actualizaciones](docs/ACTUALIZACIONES.md)
- [Desarrollo](docs/DESARROLLO.md)

---

## Actualizaciones

El launcher busca actualizaciones automaticamente al iniciar. Las actualizaciones se descargan en background y se instalan al reiniciar.

### Publicar una actualizacion
```bash
# Actualizar version
npm version patch

# Compilar
npm run build

# Crear release
gh release create v1.0.1 dist/SYN-CORE-LAUNCHER-Setup-1.0.1.exe \
  --title "v1.0.1" \
  --notes "Correccion de bugs"
```

---

## Stack

| Componente | Tecnologia |
|------------|------------|
| Framework | Electron 28 |
| Win32 API | koffi |
| Build | electron-builder |
| Updates | electron-updater |
| UI | HTML/CSS/JS |
| Fonts | Barlow Condensed, JetBrains Mono |
| Icons | Material Symbols |

---

## Seguridad

- `contextIsolation: ON` - Renderer aislado
- `nodeIntegration: OFF` - Sin Node.js en renderer
- `preload.js` - IPC seguro via contextBridge
- `CSP` - Content Security Policy habilitado

Ver [SEGURIDAD.md](docs/SEGURIDAD.md) para detalles completos.

---

## Licencia

MIT

---

## Soporte

- [GitHub Issues](https://github.com/TU-USUARIO/syn-core-launcher/issues)
