# Arquitectura de PalamBlock

Aquest document resumeix l'arquitectura global de PalamBlock i la interacció entre els seus diferents mòduls. Aquest sistema funciona mitjançant una arquitectura de tipus **client-servidor**, on la comunicació principal en temps real es produeix a través de sentències **WebSocket**.

L'objectiu de PalamBlock és la monitorització i control dels dispositius dels alumnes en un entorn educatiu, coordinant l'activitat tant a nivell de navegador com a nivell de sistema operatiu.

## Mòduls Principals

### 1. palamSRV (Servidor Central Backend)
És el cor de la plataforma. Aquest servidor (desenvolupat en Node.js) rep la telemetria dels clients, gestiona les regles restrictives i canalitza les comunicacions entre els alumnes i els administradors. Depenent del tipus de comunicació i fluïdesa, utilitza una API REST clàssica o WebSockets:

* **API REST (`/api/v1`):** S'encarrega exclusivament de les transaccions d'un sol ús i les validacions prèvies. La responsabilitat principal d'aquesta API és **gestionar l'autenticació i els inicis de sessió** (`login`, `auth`), retornant els *tokens* necessaris sense mantenir connexions obertes que saturin el servidor (o enviament asíncron d'errors/logs amb `/error/front`). Això prevé possibles atacs per connexions buides a nivell de Socket.
* **WebSockets (`src/ws/`):** Un cop validat el login a través de l'API REST, els clients utilitzen els *tokens* rebuts per obrir la connexió a través de WebSockets. Aquests s'utilitzen per a la comunicació i telemetria asíncrona i bidireccional continua. Estan dividits per espais de noms (*namespaces*):
  * `ws-extension`: Fluxe de telemetria de l'extensió del navegador (palamEXT), així com canal de comandes (`do`, `close tab`, `block`) que viatgen des del servidor cap a Chromium per aplicar regles de filtre web a l'instant.
  * `ws-os`: Via de comunicació des de l'agent basat a Linux (palamOS-linux). Registra el context del sistema de l'alumne o màquina i actua de braç executor (`emit('execute', ...)`) per accions del propi SO o canvis de control al panell o VNCs.
  * `ws-admin` / `ws-cast`: Punt d'accés bidireccional per `palamMaster`. D'una banda rep tota la informació re-emesa procedent dels altres canals (monitorització en viu) i per una altra banda envia instruccions administratives centralitzades per a l'ecosistema del grup lligades amb `authToken` de verificació.

### 2. palamEXT (Client: Extensió de Navegador)
Extensió basava en Chromium instal·lada obligatòriament al dispositiu de l'alumne.
* **Funció:** S'encarrega de l'autenticació (sistema de *login* per saber qui és l'alumne) i monitoritza en temps real les pestanyes i l'activitat de navegació.
* **Interacció:** Realitza el login mitjançant l'API REST i, utilitzant el canal bidireccional exclusiu `ws-extension` a través de WebSocket, es connecta permanentment al servidor per reportar l'ús i bloquejar immediatament les webs no permeses, o actuar sota demanda d'altres missatges i requeriments (forçar tancament de pestanyes, etc.).
* **Auto-login local:** Quan l'extensió està instal·lada per política (`installType === "admin"`), fa polling periòdic a `localhost:9876/credentials` per obtenir les credencials des de `palam-dash` i evitar el login manual en sistemes congelats. Si el pont no respon, mostra el formulari manual com a fallback.

### 3. palamOS-linux 
#### setup-OS
Tot allò que cal per configurar la màquina d'alumne: Directives, permisos, customitzacions. Serveis esencials: novnc, x11vnc

#### palam-dash (Client: Agent del Sistema Operatiu)
Servei autònom que s'executa a la màquina Linux de l'alumne preparada amb directives específiques.
* **Funció:** Permet l'enllaç de PalamBlock arrelat en l'OS de Linux (per recollir dades com ara la IP del dispositiu). L'agent força instruccions extres on l'extensió no arriba. 
* **Interacció:** Després del login, interactua per defecte via WebSockets utilitzant el canal `ws-os`.  S'activa acompanyat d'un procés **noVNC** configurat per accedir a la pantalla de la màquina; d'aquesta manera el servidor intervé mostrant sobre la pantalla de l'alumne el formulari de *login*, missatges, o pantalles completes a través del sub-canal especialitzat de vídeo `ws-cast`.

#### Pont local palam-dash ↔ palamEXT
En sistemes congelats (plantilla Examen), les dades del navegador no persisteixen entre sessions. Per evitar que l'alumne hagi d'introduir credencials manualment, `palam-dash` exposa un petit servidor HTTP a `localhost:9876` que proporciona les credencials a l'extensió:
* **`GET /credentials`** → `{ server, alumne }` (o HTTP 503 si encara no s'ha fet login)
* `palamEXT` (només amb `installType === "admin"`) fa polling cada 3 segons fins a obtenir-les
* L'autenticació resultant (`localAuth`) es valida al servidor creuant la IP de la connexió amb el `registerOS` previ de `palam-dash`
* Si el pont falla, l'extensió mostra el formulari de login manual com a fallback

### 4. palamMaster (Client: Panell de Control / Professor)
Aplicació d'escriptori (construïda amb Electron) per als professors o l'administrador informàtic.
* **Funció:** És el Centre de Comandament, permet visualitzar en viu on naviga cada alumne, enviar instruccions a través del servidor, alterar llistats dels alumenes i gestionar les excepcions o regles.
* **Interacció:** Aquesta aplicació **no es connecta** directament ni a `ws-extension` ni a `ws-os`. Tota la interacció es fa a través dels seus propis dos canals específics: S'autentica i es connecta principalment per **`ws-admin`**. El servidor (`palamSRV`) actua d'embut: s'encarrega d'agrupar les telemetries rebudes pels altres websockets (telemetria de Chromium i estat de Linux) i les *re-emet* unificades cap a `palamMaster` via `ws-admin`. L'altre canal que obre és **`ws-cast`** de forma secundària per rebre streamings (visualització de pantalla en brut) i previsualitzar escriptoris de les estacions Linux quan se sol·licita.

### 5. palamOS-windows 
*(Deprecat)* Aquesta carpeta mantenia l'antiga versió OS adaptada a ordinadors amb Windows. El mòdul ja no està mantingut i es pot ignorar per complet respecte el desenvolupament actual.
