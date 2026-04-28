# Session Service Documentation

## Introduction

The **Session** service is a central microservice in the Chariot ecosystem. Its primary role is to manage the lifecycle of game sessions, from their creation to their expiration. It provides a RESTful API for CRUD (Create, Read, Update, Delete) operations on sessions and uses WebSockets for real-time communication among participants.

## Architecture

The service is developed using the [NestJS](https://nestjs.com/) framework and follows a modular architecture.

-   **Language**: TypeScript
-   **Framework**: NestJS
-   **Database**: PostgreSQL, with the [Prisma](https://www.prisma.io/) ORM
-   **Real-time Communication**: WebSockets with [Socket.IO](https://socket.io/)
-   **Cache and Expiration**: [Redis](https://redis.io/) is used to manage session expiration.
-   **Authentication**: Authentication is handled via [Keycloak](https://www.keycloak.org/). JWT tokens are validated with each HTTP request and WebSocket connection.
-   **API Documentation**: [Swagger (OpenAPI)](https://swagger.io/) is used to generate interactive API documentation.

## Data Model

The database contains two main tables: `sessions` and `session_participants`.

### `Session`

A session represents a game instance.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `String` | Unique session identifier (UUID). |
| `status` | `SessionStatus` | Status of the session (`activated`, `launched`, `closed`). |
| `expiresAt` | `DateTime?` | Session expiration date (8 hours after launch). |
| `deletedAt` | `DateTime?` | Deletion date (soft delete). |
| `createdAt` | `DateTime` | Creation date. |
| `updatedAt` | `DateTime` | Last update date. |
| `creatorUserId` | `String` | ID of the creator user. |
| `creatorCampaignId` | `String` | ID of the associated campaign. |
| `participants` | `SessionParticipant[]` | List of session participants. |

### `SessionParticipant`

Represents a user participating in a session.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `String` | Unique participant identifier (UUID). |
| `userId` | `String` | User ID. |
| `characterId` | `String` | ID of the character being played. |
| `joinedAt` | `DateTime` | Date the participant joined the session. |
| `sessionId` | `String` | ID of the session the participant is linked to. |

## API Endpoints (REST)

The REST API is prefixed with `/sessions`.

-   `POST /`
    -   **Description**: Creates a new session.
    -   **Body**: `{ "campaignId": "string" }`
    -   **Response**: `SessionResponseDto`

-   `GET /`
    -   **Description**: Retrieves the authenticated user's sessions.
    -   **Response**: `SessionListResponseDto`

-   `GET /:id`
    -   **Description**: Retrieves a session by its ID.
    -   **Parameters**: `id` (UUID)
    -   **Response**: `SessionResponseDto`

-   `GET /:id/participants`
    -   **Description**: Retrieves the participants and creator of a session.
    -   **Parameters**: `id` (UUID)
    -   **Response**: `SessionParticipantsResponseDto`

-   `POST /:id/launch`
    -   **Description**: Launches a session, which starts the 8-hour expiration timer. Only the creator can launch the session.
    -   **Parameters**: `id` (UUID)
    -   **Response**: `SessionResponseDto`

-   `POST /:id/join`
    -   **Description**: Allows a user to join a session.
    -   **Parameters**: `id` (UUID)
    -   **Body**: `{ "characterId": "string" }`
    -   **Response**: `SessionResponseDto`

-   `DELETE /:id/leave`
    -   **Description**: Allows a user to leave a session.
    -   **Parameters**: `id` (UUID)
    -   **Response**: `SessionResponseDto`

-   `DELETE /:id`
    -   **Description**: Deletes a session (soft delete). Only the creator can delete the session.
    -   **Parameters**: `id` (UUID)
    -   **Response**: `SessionResponseDto`

## WebSocket Events

The WebSocket server is accessible via the `/session` namespace.

### Events Emitted by the Client

-   `session:join`
    -   **Description**: Allows a user to join a Socket.IO room for a specific session.
    -   **Payload**: `{ "sessionId": "string" }`

-   `session:leave`
    -   **Description**: Allows a user to leave a Socket.IO room.
    -   **Payload**: `{ "sessionId": "string" }`

### Events emitted by the server

-   `session:user-joined`
    -   **Description**: Notifies session participants that a new user has joined.
    -   **Payload**: `{ "sessionId": "string", "userId": "string", "characterId": "string" }`

-   `session:user-left`
    -   **Description**: Notifies session participants that a user has left.
    -   **Payload**: `{ "sessionId": "string", "userId": "string" }`

-   `session:launched`
    -   **Description**: Notifies participants that the session has been launched.
    -   **Payload**: `{ "sessionId": "string" }`

-   `session:expired`
    -   **Description**: Notifies participants that the session has expired.
    -   **Payload**: `{ "sessionId": "string" }`

-   `session:deleted`
    -   **Description**: Notifies participants that the session has been deleted.
    -   **Payload**: `{ "sessionId": "string" }`

## Session lifecycle

1.  **Creation (`activated`)**: A user creates a session. The status is `activated`. Other users can join it.
2.  **Launch (`launched`)**: The creator launches the session. The status changes to `launched`. An 8-hour timer is started in Redis.
3.  **Expiration (`closed`)**:
    -   If the session is launched, after 8 hours, Redis notifies the service that the session has expired.
    -   The session status changes to `closed`.
    -   Participants are notified via WebSocket and disconnected from the room.
4.  **Deletion**: The creator can delete the session at any time. The session is soft-deleted (`deletedAt` is updated).

## Integration with other services

To interact with the Session service, other microservices must:

1.  **Obtain a valid Keycloak access token**.
2.  **Call the REST API** of the Session service including the token in the `Authorization` header.
3.  **For real-time communication**, connect to the WebSocket server by passing the token in the connection configuration.

Example API call with `curl`:
```bash
curl -X GET http://localhost:9002/sessions \
-H "Authorization: Bearer <YOUR_TOKEN>"
```

### Real-Time Integration Example (Client)

Here is an example of how a client (e.g., a React or Vue frontend application) can connect to the session service and interact in real time.

```javascript
import { io } from "socket.io-client";

const SESSION_ID = "your-session-id";
const USER_TOKEN = "your-jwt-token"; // JWT access token obtained via Keycloak

// 1. Connect to the '/session' namespace with the authentication token
const socket = io("http://localhost:9002/session", {
  auth: {
    token: USER_TOKEN,
  },
});

socket.on("connect", () => {
  console.log(`Connected to WebSocket server with id ${socket.id}`);

  // 2. Join a specific session room
  socket.emit("session:join", { sessionId: SESSION_ID });
});

// 3. Listen to server events
socket.on("session:user-joined", (data) => {
  console.log(`User ${data.userId} joined session ${data.sessionId}`);
});

socket.on("session:user-left", (data) => {
  console.log(`User ${data.userId} left session ${data.sessionId}`);
});

socket.on("session:launched", (data) => {
  console.log(`Session ${data.sessionId} has been launched!`);
});

socket.on("session:expired", (data) => {
  console.error(`Session ${data.sessionId} has expired.`);
  // Handle user disconnection from the session here
});

socket.on("disconnect", (reason) => {
  console.log(`Disconnected from WebSocket server: ${reason}`);
});

// Function to leave a session
function leaveSession() {
  socket.emit("session:leave", { sessionId: SESSION_ID });
}
```

## Running locally

To run the Session service locally, follow these steps:

1.  Make sure the dependent services (PostgreSQL, Redis, Keycloak) are running. The easiest way is to use the `docker-compose` at the root of the project.
2.  Navigate to the `services/session/api` directory.
3.  Install dependencies: `npm install`.
4.  Create a `.env` file based on `.env.example` and configure the environment variables.
5.  Apply database migrations: `npm run prisma:migrate`.
6.  Start the service in development mode: `npm run start:dev`.

The service will then be accessible at `http://localhost:9002`.
Swagger documentation will be available at `http://localhost:9002/docs`.
