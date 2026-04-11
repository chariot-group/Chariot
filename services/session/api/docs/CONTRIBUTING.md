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
    -   **Description**: Permet à un utilisateur de rejoindre une "room" Socket.IO pour une session spécifique.
    -   **Payload**: `{ "sessionId": "string" }`

-   `session:leave`
    -   **Description**: Permet à un utilisateur de quitter une "room" Socket.IO.
    -   **Payload**: `{ "sessionId": "string" }`

### Événements émis par le serveur

-   `session:user-joined`
    -   **Description**: Notifie les participants d'une session qu'un nouvel utilisateur a rejoint.
    -   **Payload**: `{ "sessionId": "string", "userId": "string", "characterId": "string" }`

-   `session:user-left`
    -   **Description**: Notifie les participants d'une session qu'un utilisateur a quitté.
    -   **Payload**: `{ "sessionId": "string", "userId": "string" }`

-   `session:launched`
    -   **Description**: Notifie les participants que la session a été lancée.
    -   **Payload**: `{ "sessionId": "string" }`

-   `session:expired`
    -   **Description**: Notifie les participants que la session a expiré.
    -   **Payload**: `{ "sessionId": "string" }`

-   `session:deleted`
    -   **Description**: Notifie les participants que la session a été supprimée.
    -   **Payload**: `{ "sessionId": "string" }`

## Cycle de vie d'une session

1.  **Création (`activated`)**: Un utilisateur crée une session. Le statut est `activated`. Les autres utilisateurs peuvent la rejoindre.
2.  **Lancement (`launched`)**: Le créateur lance la session. Le statut passe à `launched`. Un timer de 8 heures est démarré dans Redis.
3.  **Expiration (`closed`)**:
    -   Si la session est lancée, après 8 heures, Redis notifie le service que la session a expiré.
    -   Le statut de la session passe à `closed`.
    -   Les participants sont notifiés via WebSocket et déconnectés de la room.
4.  **Suppression**: Le créateur peut supprimer la session à tout moment. La session est "soft-deleted" (`deletedAt` est mis à jour).

## Intégration avec d'autres services

Pour interagir avec le service de Session, les autres microservices doivent :

1.  **Obtenir un token d'accès Keycloak valide**.
2.  **Appeler l'API REST** du service de Session en incluant le token dans le header `Authorization`.
3.  **Pour la communication en temps réel**, se connecter au serveur WebSocket en passant le token dans la configuration de connexion.

Exemple d'appel API avec `curl`:
```bash
curl -X GET http://localhost:9002/sessions \
-H "Authorization: Bearer <VOTRE_TOKEN>"
```

### Exemple d'Intégration en Temps Réel (Client)

Voici un exemple de la manière dont un client (par exemple, une application front-end en React ou Vue) peut se connecter au service de session et interagir en temps réel.

```javascript
import { io } from "socket.io-client";

const SESSION_ID = "votre-session-id";
const USER_TOKEN = "votre-token-jwt"; // Le token d'accès JWT obtenu via Keycloak

// 1. Connexion au namespace '/session' avec le token d'authentification
const socket = io("http://localhost:9002/session", {
  auth: {
    token: USER_TOKEN,
  },
});

socket.on("connect", () => {
  console.log(`Connecté au serveur WebSocket avec l'id ${socket.id}`);

  // 2. Rejoindre une room de session spécifique
  socket.emit("session:join", { sessionId: SESSION_ID });
});

// 3. Écouter les événements du serveur
socket.on("session:user-joined", (data) => {
  console.log(`L'utilisateur ${data.userId} a rejoint la session ${data.sessionId}`);
});

socket.on("session:user-left", (data) => {
  console.log(`L'utilisateur ${data.userId} a quitté la session ${data.sessionId}`);
});

socket.on("session:launched", (data) => {
  console.log(`La session ${data.sessionId} a été lancée !`);
});

socket.on("session:expired", (data) => {
  console.error(`La session ${data.sessionId} a expiré.`);
  // Ici, vous devriez gérer la déconnexion de l'utilisateur de la session
});

socket.on("disconnect", (reason) => {
  console.log(`Déconnecté du serveur WebSocket: ${reason}`);
});

// Fonction pour quitter une session
function leaveSession() {
  socket.emit("session:leave", { sessionId: SESSION_ID });
}
```

## Lancement en local

Pour lancer le service de Session en local, suivez ces étapes :

1.  Assurez-vous que les services dépendants (PostgreSQL, Redis, Keycloak) sont en cours d'exécution. Le plus simple est d'utiliser le `docker-compose` à la racine du projet.
2.  Naviguez vers le répertoire `services/session/api`.
3.  Installez les dépendances : `npm install`.
4.  Créez un fichier `.env` basé sur `.env.example` et configurez les variables d'environnement.
5.  Appliquez les migrations de la base de données : `npm run prisma:migrate`.
6.  Lancez le service en mode développement : `npm run start:dev`.

Le service sera alors accessible sur `http://localhost:9002`.
La documentation Swagger sera disponible sur `http://localhost:9002/docs`.
