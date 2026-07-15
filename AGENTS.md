# Estructura del projecte
L'objectiu de PalamBlock és la monitorització i control dels dispositius dels alumnes en un entorn educatiu, coordinant l'activitat tant a nivell de navegador com a nivell de sistema operatiu.

A la carpeta docs/project.md es pot consultar els diferents blocs que composen el sistema PalamBlock. De forma molt resumida:
+ palamSRV: Servidor node - gestió centrelitzada
+ plamMaster: Aplicació electron per a gestionar ordinadors i navegadors d'alumne
+ palamEXT: Extensió chrome que monitoritza els navegadors dels alumnes.
+ PalamOS-linux: Servei node que monitoritza els ordinadors dels alumens: Transmet IP, screenshoots i permet emetre contingut a la pantalla d'alummne.

En aquest projecte no hi ha la imatge dels sistemes operatius dels alumnes. És una versió customitzada sobre pop-os (debian). On hi ha instal·lat diversos serveis/configuracions: palam-dash (palamOS-linux), novnc, directives de navegadors, permisos d'usuaris...

# Normes per als agents LLM
## Preguntar sempre abans d'implementar - IMPORTANT! 
Regla: Si la petició té ambigüitats, llacunes d'informació o requereix deduccions per part teva, no implementis res. Formula una pregunta aclaridora clara i concreta, i espera la resposta per continuar.

Només pots actuar sense preguntar si tots els detalls (comportament, entorn, versions, casos límit) estan explícits i consensuats.

Acció obligatòria: Davant qualsevol dubte → atura’t i pregunta.

## Protecció de fitxers sensibles

El model **no pot accedir, llegir, indexar ni inferir contingut** de fitxers sensibles sota cap circumstància.

### Fitxers prohibits

Inclou (no limitat a):

* `.env`
* `client_secret*.json`
* `credentials*.json`
* `secrets.*`
* `*.key`, `*.pem`, `*.p12`, `*.pfx`
* `id_rsa`, `id_dsa`, `authorized_keys`
* `tokens.json`, `auth.json`, `session.json`
* `cookies.txt`, `cookies.json`

Com que no tens accés al `.env`. Treballaràs amb el fitxer `.env.example` que es troba al mateix directori.

### Informació sensible

Prohibit accedir o exposar:

* API keys, tokens, contrasenyes
* secrets de client
* claus privades i certificats
* cookies de sessió

Demana a l'usuari que modifiqui els fitxers sensibles. Renya a l'usuari si introdueix una clau sensible a la conversa.

## Ús d'emoticones
No utilitzis emoticones per a fer botons MAI. Queden malament i van contra les línies de disseny del projecte.