
# Documentation du Service de Session

## Introduction

Le service de **Session** est un microservice central de l'écosystème Chariot. Son rôle principal est de gérer le cycle de vie des sessions de jeu, de leur création à leur expiration. Il offre une API RESTful pour les opérations CRUD (Create, Read, Update, Delete) sur les sessions et utilise des WebSockets pour la communication en temps réel entre les participants.

## Architecture

Le service est développé en utilisant le framework [NestJS](https://nestjs.com/) et suit une architecture modulaire.

-   **Langage**: TypeScript
-   **Framework**: NestJS
-   **Base de données**: PostgreSQL, avec l'ORM [Prisma](https://www.prisma.io/)
-   **Communication en temps réel**: WebSockets avec [Socket.IO](https://socket.io/)
-   **Cache et Expiration**: [Redis](https://redis.io/) est utilisé pour gérer l'expiration des sessions.
-   **Authentification**: L'authentification est gérée via [Keycloak](https://www.keycloak.org/). Les tokens JWT sont validés à chaque requête HTTP et à chaque connexion WebSocket.
-   **Documentation API**: [Swagger (OpenAPI)](https://swagger.io/) est utilisé pour générer une documentation interactive de l'API.

## Modèle de Données

La base de données contient deux tables principales : `sessions` et `session_participants`.

### `Session`

Une session représente une instance de jeu.

| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | `String` | Identifiant unique de la session (UUID). |
| `status` | `SessionStatus` | Statut de la session (`activated`, `launched`, `closed`). |
| `expiresAt` | `DateTime?` | Date d'expiration de la session (après 8h de lancement). |
| `deletedAt` | `DateTime?` | Date de suppression (soft delete). |
| `createdAt` | `DateTime` | Date de création. |
| `updatedAt` | `DateTime` | Date de dernière mise à jour. |
| `creatorUserId` | `String` | ID de l'utilisateur créateur. |
| `creatorCampaignId` | `String` | ID de la campagne associée. |
| `participants` | `SessionParticipant[]` | Liste des participants à la session. |

### `SessionParticipant`

Représente un utilisateur participant à une session.

| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | `String` | Identifiant unique du participant (UUID). |
| `userId` | `String` | ID de l'utilisateur. |
| `characterId` | `String` | ID du personnage joué. |
| `joinedAt` | `DateTime` | Date à laquelle le participant a rejoint la session. |
| `sessionId` | `String` | ID de la session à laquelle le participant est lié. |

## API Endpoints (REST)

L'API REST est préfixée par `/sessions`.

-   `POST /`
    -   **Description**: Crée une nouvelle session.
    -   **Body**: `{ "campaignId": "string" }`
    -   **Réponse**: `SessionResponseDto`

-   `GET /`
    -   **Description**: Récupère les sessions de l'utilisateur authentifié.
    -   **Réponse**: `SessionListResponseDto`

-   `GET /:id`
    -   **Description**: Récupère une session par son ID.
    -   **Paramètres**: `id` (UUID)
    -   **Réponse**: `SessionResponseDto`

-   `GET /:id/participants`
    -   **Description**: Récupère les participants et le créateur d'une session.
    -   **Paramètres**: `id` (UUID)
    -   **Réponse**: `SessionParticipantsResponseDto`

-   `POST /:id/launch`
    -   **Description**: Lance une session, ce qui déclenche le minuteur d'expiration de 8 heures. Seul le créateur peut lancer la session.
    -   **Paramètres**: `id` (UUID)
    -   **Réponse**: `SessionResponseDto`

-   `POST /:id/join`
    -   **Description**: Permet à un utilisateur de rejoindre une session.
    -   **Paramètres**: `id` (UUID)
    -   **Body**: `{ "characterId": "string" }`
    -   **Réponse**: `SessionResponseDto`

-   `DELETE /:id/leave`
    -   **Description**: Permet à un utilisateur de quitter une session.
    -   **Paramètres**: `id` (UUID)
    -   **Réponse**: `SessionResponseDto`

-   `DELETE /:id`
    -   **Description**: Supprime une session (soft delete). Seul le créateur peut supprimer la session.
    -   **Paramètres**: `id` (UUID)
    -   **Réponse**: `SessionResponseDto`

## Événements WebSocket

Le serveur WebSocket est accessible via le namespace `/session`.

### Événements émis par le client

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
