# Testing the Session service

## Prerequisites

The following services must be started:

```bash
make up
```

Ports used:
- **Gateway**: `http://localhost:8082` (public REST entry point)
- **Session**: `http://localhost:9002` (direct access for Socket.IO)
- **Keycloak**: `http://localhost:8080`
- **Swagger**: `http://localhost:9002/docs`

---

## 1. Obtain a JWT token

All routes (REST and Socket.IO) require a Keycloak Bearer token.

```bash
TOKEN=$(curl -s -X POST \
  http://localhost:8080/realms/chariot/protocol/openid-connect/token \
  -d "grant_type=password" \
  -d "client_id=chariot-app" \
  -d "username=YOUR_USER" \
  -d "password=YOUR_PASSWORD" \
  | jq -r .access_token)

echo $TOKEN
```

The token expires after 5 minutes. Re-run the command to get a new one.

---

## 2. REST API

The REST API is accessible via the gateway at `/api/session`.

### Health check (public, no token required)

```bash
curl http://localhost:8082/api/session/
```

### Create a session

```bash
curl -s -X POST http://localhost:8082/api/session/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"campaignId": "camp_abc123"}' | jq
```

### List your sessions

```bash
curl -s http://localhost:8082/api/session/sessions \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Get a session by ID

```bash
SESSION_ID="your-session-uuid"

curl -s http://localhost:8082/api/session/sessions/$SESSION_ID \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Get participants of a session

```bash
curl -s http://localhost:8082/api/session/sessions/$SESSION_ID/participants \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Join a session

```bash
curl -s -X POST http://localhost:8082/api/session/sessions/$SESSION_ID/join \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"characterId": "char_abc123"}' | jq
```

### Launch a session (creator only)

```bash
curl -s -X POST http://localhost:8082/api/session/sessions/$SESSION_ID/launch \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Leave a session

```bash
curl -s -X POST http://localhost:8082/api/session/sessions/$SESSION_ID/leave \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Close a session (creator only)

```bash
curl -s -X DELETE http://localhost:8082/api/session/sessions/$SESSION_ID \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 3. Socket.IO

The Socket.IO gateway runs directly on the session service (port 9002), namespace `/session`.

The token is read from three sources (in this order):
1. `handshake.auth.token`
2. `handshake.headers.authorization` (Bearer)
3. `handshake.query.token` (query string `?token=...`)

### Testing with Node.js (recommended)

Create a `test-socket.mjs` file:

```js
import { io } from "socket.io-client";

const TOKEN = "PASTE_YOUR_JWT_HERE";
const SESSION_ID = "your-session-uuid";

const socket = io("http://localhost:9002/session", {
  auth: { token: TOKEN },
});

socket.on("connect", () => {
  console.log("Connected:", socket.id);

  // Create a session
  socket.emit("session:create", { campaignId: "camp_abc123" });
});

socket.on("session:created", (data) => {
  console.log("Session created:", data.session.id);

  // Join the created session
  socket.emit("session:join", {
    sessionId: data.session.id,
    characterId: "char_abc123",
  });
});

socket.on("session:joined", (data) => {
  console.log("Session joined:", data);
});

socket.on("session:error", (err) => {
  console.error("Socket error:", err.message);
});

socket.on("connect_error", (err) => {
  console.error("Connection refused:", err.message);
});
```

Run:

```bash
npm install socket.io-client   # once
node test-socket.mjs
```

### Available events (emitted by the client)

| Event | Payload | Description |
|---|---|---|
| `session:create` | `{ campaignId: string }` | Creates a session |
| `session:join` | `{ sessionId: string, characterId: string }` | Joins a session |
| `session:leave` | `{ sessionId: string }` | Leaves a session |
| `session:launch` | `{ sessionId: string }` | Launches the session (creator only) |
| `session:close` | `{ sessionId: string }` | Closes the session (creator only) |

### Events received from the server

| Event | Description |
|---|---|
| `session:created` | Creation confirmation, contains `session` |
| `session:joined` | Confirmation of joining the session |
| `session:left` | Confirmation of leaving |
| `session:launched` | Session launched, contains `session.expiresAt` |
| `session:closed` | Session closed |
| `session:expired` | Session automatically expired (Redis TTL) |
| `session:participant-joined` | Another participant has joined |
| `session:participant-left` | Another participant has left |
| `session:error` | Business error, contains `message` |
| `error` | Connection error (invalid token, etc.) |

---

## 4. Swagger

The interactive documentation is available at:

```
http://localhost:9002/docs
```

Click **Authorize** and enter `Bearer <TOKEN>` to test REST routes directly from the interface.

---

## 5. Logs

```bash
# Follow logs in real time
docker logs chariot-session -f

# Logs from the last 5 minutes
docker logs chariot-session --since=5m
```
