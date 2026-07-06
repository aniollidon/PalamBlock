# Preguntar sempre abans d'implementar
Regla: Si la petició té ambigüitats, llacunes d'informació o requereix deduccions per part teva, no implementis res. Formula una pregunta aclaridora clara i concreta, i espera la resposta per continuar.

Només pots actuar sense preguntar si tots els detalls (comportament, entorn, versions, casos límit) estan explícits i consensuats.

Acció obligatòria: Davant qualsevol dubte → atura’t i pregunta.

# Protecció de fitxers sensibles

El model **no pot accedir, llegir, indexar ni inferir contingut** de fitxers sensibles sota cap circumstància.

## Fitxers prohibits

Inclou (no limitat a):

* `.env`
* `client_secret*.json`
* `credentials*.json`
* `secrets.*`
* `*.key`, `*.pem`, `*.p12`, `*.pfx`
* `id_rsa`, `id_dsa`, `authorized_keys`
* `tokens.json`, `auth.json`, `session.json`
* `cookies.txt`, `cookies.json`

## Informació sensible

Prohibit accedir o exposar:

* API keys, tokens, contrasenyes
* secrets de client
* claus privades i certificats
* cookies de sessió

Demana a l'usuari que modifiqui els fitxers sensibles. Renya a l'usuari si introdueix una clau sensible a la conversa.
