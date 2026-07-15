# Com publicar PalamBlock

Aquest document explica el procediment per publicar noves versions de cada mòdul.

---

## Resum ràpid

| Mòdul | Mecanisme | Comanda / Acció |
|-------|-----------|-----------------|
| palamEXT | Chrome Web Store (manual) | Pujar ZIP al [Developer Dashboard](https://chrome.google.com/webstore/devconsole) |
| palamMaster | Git tag + GitHub Actions | `git tag vX.Y.Z && git push --tags` |
| palamOS-linux | Git tag + GitHub Actions | `git tag vX.Y.Z && git push --tags` |
| palamSRV | Desplegament manual al servidor | `git pull && pm2 restart` (sense auto-update) |

---

## palamEXT — Chrome Web Store

L'extensió de Chrome **no té CI/CD**. Es publica manualment des del [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

### Procediment

1. **Actualitza la versió** a `palamEXT/manifest.json`:
   ```json
   "version": "3.1"
   ```

2. **Crea un ZIP** amb tots els fitxers de l'extensió:
   ```bash
   cd palamEXT
   zip -r palamblock-v3.1.zip . -x "*.git*" "README.md"
   ```

3. **Puja el ZIP** al [Developer Dashboard](https://chrome.google.com/webstore/devconsole):
   - Ves al teu item (PalamBlock)
   - Ves a **Package** → **Upload new package**
   - Arrossega el ZIP
   - Clica **Submit for review**

4. **Espera l'aprovació** de Google (pot trigar hores/dies).

5. Un cop aprovada, els usuaris reben l'actualització automàticament (Chrome ho gestiona).

> **Nota**: No oblidis actualitzar també la versió al `manifest.json` abans de crear el ZIP.

---

## palamMaster — GitHub Actions

L'aplicació d'escriptori del professor es publica automàticament amb un tag de Git.

### Requisits previs

- Repositori: `aniollidon/palamblock-master` (públic)
- GitHub Actions configurat a `.github/workflows/build.yml`
- `electron-updater` llegeix `latest.yml` de les GitHub Releases

### Procediment

1. **Assegura't que tot està commitejat a `main`**:
   ```bash
   git checkout main
   git pull
   git status   # ha d'estar net
   ```

2. **Actualitza la versió** a `palamMaster/package.json`:
   ```json
   "version": "2.0.1"
   ```

3. **Commit + tag + push**:
   ```bash
   git add palamMaster/package.json
   git commit -m "v2.0.1"
   git tag v2.0.1
   git push origin main --tags
   ```

4. **El CI s'encarrega de la resta**:
   - **Job `build`**: Compila per Windows (`.exe`), Linux (`.AppImage`, `.deb`) i macOS (`.dmg`)
   - Genera `latest.yml`, `latest-linux.yml`, `latest-mac.yml`
   - **Job `release`**: Crea una GitHub Release amb tots els artefactes

5. **Verifica** a [GitHub Releases](https://github.com/aniollidon/palamblock-master/releases) que tot s'ha pujat correctament.

6. Els usuaris de palamMaster rebran l'actualització:
   - Automàticament en obrir l'app (3 segons després de carregar)
   - Manualment clicant el botó "Comprovar actualitzacions" a la pantalla d'inici

---

## palamOS-linux — GitHub Actions

L'agent del sistema operatiu (Linux kiosk) es publica amb el mateix mecanisme.

### Requisits previs

- Repositori: `aniollidon/palamblock-palamos-linux` (públic)
- GitHub Actions configurat a `.github/workflows/build.yml`
- L'app s'executa com a AppImage → `electron-updater` pot auto-actualitzar-se

### Procediment

1. **Commiteja a `master`**:
   ```bash
   git checkout master
   git pull
   git status
   ```

2. **Actualitza la versió** a `palamOS-linux/package.json`:
   ```json
   "version": "2.0.1"
   ```

3. **Commit + tag + push**:
   ```bash
   git add palamOS-linux/package.json
   git commit -m "v2.0.1"
   git tag v2.0.1
   git push origin master --tags
   ```

4. **El CI fa**:
   - **Job `build`**: Compila per Linux → `.AppImage` + `latest-linux.yml`
   - **Job `release`**: Crea una GitHub Release amb els artefactes

5. **Verifica** a [GitHub Releases](https://github.com/aniollidon/palamblock-palamos-linux/releases).

6. Els dispositius Linux reben l'actualització automàticament:
   - 10 segons després d'arrencar, `electron-updater` comprova `latest-linux.yml`
   - Si hi ha versió nova, descarrega l'AppImage en segon pla
   - En descarregar-se, copia l'AppImage a `/opt/palamos-dashboard/palam-dash.AppImage` (permisos d'`alumne`, sense `sudo`)
   - Fa `app.exit(0)` i `systemd` (Restart=always) re-arrenca amb la nova versió

> **Important**: L'actualització és completament silenciosa. L'alumne no veu cap diàleg ni notificació. No cal `sudo` perquè l'AppImage se substitueix directament.

---

## palamSRV — Desplegament manual

El servidor **no té actualitzacions automàtiques** (per decisió de disseny: evitar talls de servei no controlats).

### Procediment

```bash
cd /ruta/al/servidor/palamSRV
git pull
npm install    # si hi ha dependències noves
pm2 restart palamSRV
```

---

## Flux complet d'actualització (runtime)

Quan un client (palamMaster o palamOS-linux) s'executa:

```
1. app.whenReady()
2. autoUpdater.checkForUpdatesAndNotify()
3. Descarrega latest-linux.yml de GitHub Releases
4. Compara versions
5. Si nova → descarrega l'AppImage
6. Descarregat → palamOS-linux: copia l'AppImage a `/opt/palamos-dashboard/` i fa `app.exit(0)` (systemd reinicia). palamMaster: `quitAndInstall()` amb diàleg nadiu.
7. L'app es reinicia amb la nova versió
```

Per a més detalls tècnics, consulta el [flux d'actualització](project.md#arquitectura-de-palamBlock).

---

## Notes

- **Compatibilitat de versions**: `electron-updater` només detecta versions amb format semàntic (`vX.Y.Z`). No facis servir `v2.0.0-beta` o similars tret que el `package.json` també ho reflecteixi.
- **Repositoris públics**: No cal token de GitHub per descarregar actualitzacions (els repos són públics).
- **CI**: Si un build falla, la release no es crea. Revisa els logs a Actions.
- **Rollback**: Si una versió és defectuosa, crea una release nova amb un tag superior (no esborris releases anteriors, `electron-updater` sempre busca l'última).
