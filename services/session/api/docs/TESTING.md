# Tester le service Session

## Prérequis

Les services suivants doivent être démarrés :

```bash
make up
```

Ports utilisés :
- **Gateway** : `http://localhost:8082` (point d'entrée REST public)
- **Session** : `http://localhost:9002` (accès direct pour Socket.IO)
- **Keycloak** : `http://localhost:8080`
- **Swagger** : `http://localhost:9002/docs`

---

## 1. Obtenir un token JWT

Toutes les routes (REST et Socket.IO) nécessitent un token Bearer Keycloak.

```bash
TOKEN=$(curl -s -X POST \
  http://localhost:8080/realms/chariot/protocol/openid-connect/token \
  -d "grant_type=password" \
  -d "client_id=chariot-app" \
  -d "username=TON_USER" \
  -d "password=TON_MDP" \
  | jq -r .access_token)

echo $TOKEN
```

Le token expire après 5 minutes. Relancer la commande pour en obtenir un nouveau.

---

## 2. API REST

L'API REST est accessible via le gateway sur `/api/session`.

### Health check (public, sans token)

```bash
curl http://localhost:8082/api/session/
```

### Créer une session

```bash
curl -s -X POST http://localhost:8082/api/session/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"campaignId": "camp_abc123"}' | jq
```

### Lister ses sessions

```bash
curl -s http://localhost:8082/api/session/sessions \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Obtenir une session par ID

```bash
SESSION_ID="uuid-de-la-session"

curl -s http://localhost:8082/api/session/sessions/$SESSION_ID \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Obtenir les participants d'une session

```bash
curl -s http://localhost:8082/api/session/sessions/$SESSION_ID/participants \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Rejoindre une session

```bash
curl -s -X POST http://localhost:8082/api/session/sessions/$SESSION_ID/join \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"characterId": "char_abc123"}' | jq
```

### Lancer une session (créateur uniquement)

```bash
curl -s -X POST http://localhost:8082/api/session/sessions/$SESSION_ID/launch \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Quitter une session

```bash
curl -s -X POST http://localhost:8082/api/session/sessions/$SESSION_ID/leave \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Clôturer une session (créateur uniquement)

```bash
curl -s -X DELETE http://localhost:8082/api/session/sessions/$SESSION_ID \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 3. Socket.IO

Le gateway Socket.IO tourne directement sur le service session (port 9002), namespace `/session`.

Le token est lu depuis trois sources (dans cet ordre) :
1. `handshake.auth.token`
2. `handshake.headers.authorization` (Bearer)
3. `handshake.query.token` (query string `?token=...`)

### Tester avec Node.js (méthode recommandée)

Créer un fichier `test-socket.mjs` :

```js
import { io } from "socket.io-client";

const TOKEN = "COLLER_LE_JWT_ICI";
const SESSION_ID = "uuid-de-la-session";

const socket = io("http://localhost:9002/session", {
  auth: { token: TOKEN },
});

socket.on("connect", () => {
  console.log("Connecté :", socket.id);

  // Créer une session
  socket.emit("session:create", { campaignId: "camp_abc123" });
});

socket.on("session:created", (data) => {
  console.log("Session créée :", data.session.id);

  // Rejoindre la session créée
  socket.emit("session:join", {
    sessionId: data.session.id,
    characterId: "char_abc123",
  });
});

socket.on("session:joined", (data) => {
  console.log("Session rejointe :", data);
});

socket.on("session:error", (err) => {
  console.error("Erreur socket :", err.message);
});

socket.on("connect_error", (err) => {
  console.error("Connexion refusée :", err.message);
});
```

Lancer :

```bash
npm install socket.io-client   # une seule fois
node test-socket.mjs
```

### Événements disponibles (émis par le client)

| Événement | Payload | Description |
|---|---|---|
| `session:create` | `{ campaignId: string }` | Crée une session |
| `session:join` | `{ sessionId: string, characterId: string }` | Rejoint une session |
| `session:leave` | `{ sessionId: string }` | Quitte une session |
| `session:launch` | `{ sessionId: string }` | Lance la session (créateur seulement) |
| `session:close` | `{ sessionId: string }` | Clôture la session (créateur seulement) |

### Événements reçus du serveur

| Événement | Description |
|---|---|
| `session:created` | Confirmation de création, contient `session` |
| `session:joined` | Confirmation d'entrée dans la session |
| `session:left` | Confirmation de sortie |
| `session:launched` | Session lancée, contient `session.expiresAt` |
| `session:closed` | Session clôturée |
| `session:expired` | Session expirée automatiquement (TTL Redis) |
| `session:participant-joined` | Un autre participant a rejoint |
| `session:participant-left` | Un autre participant est parti |
| `session:error` | Erreur métier, contient `message` |
| `error` | Erreur de connexion (token invalide, etc.) |

---

## 4. Swagger

La documentation interactive est disponible sur :

```
http://localhost:9002/docs
```

Cliquer sur **Authorize** et entrer `Bearer <TOKEN>` pour tester les routes REST directement depuis l'interface.

---

## 5. Logs

```bash
# Suivre les logs en temps réel
docker logs chariot-session -f

# Logs des 5 dernières minutes
docker logs chariot-session --since=5m
```
