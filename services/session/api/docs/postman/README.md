# Collection Postman pour le Service Session

Ce répertoire contient une collection Postman pour faciliter le test et l'interaction avec l'API et le serveur WebSocket du service `session`.

## Fichiers

-   `chariot-session.postman_collection.json`: Le fichier de collection Postman à importer.

## Prérequis

-   [Postman](https://www.postman.com/downloads/) doit être installé sur votre machine.
-   Le service `session` doit être en cours d'exécution en local.

## Importation de la collection

1.  Ouvrez Postman.
2.  Cliquez sur le bouton **Import** en haut à gauche.
3.  Sélectionnez le fichier `chariot-session.postman_collection.json` depuis ce répertoire.
4.  La collection "Chariot - Service Session" apparaîtra dans votre liste de collections.

## Configuration

La collection utilise une variable `baseUrl` pour définir l'adresse de base du service.

-   Par défaut, elle est initialisée à `http://localhost:3001`.
-   Si votre service s'exécute sur un port différent, vous pouvez modifier cette variable en sélectionnant la collection, en allant dans l'onglet **Variables**, et en modifiant la valeur de `baseUrl`.

## Utilisation

### Test de l'API REST

La collection inclut une requête `GET` pour le *health check* :

1.  Développez la collection et le dossier `API`.
2.  Sélectionnez la requête **Health Check**.
3.  Cliquez sur **Send**.
4.  Vous devriez recevoir une réponse avec un statut `200 OK` et un corps de réponse confirmant que le service est en ligne. L'onglet **Tests** de la requête validera automatiquement la réponse.

### Test du WebSocket

Une requête WebSocket est pré-configurée pour vous connecter au service :

1.  Développez le dossier `WebSocket`.
2.  Sélectionnez la requête **Connexion au service Session**.
3.  Cliquez sur **Connect**. Une fois la connexion établie, une zone de messages s'affichera.
4.  Allez dans l'onglet **Message** (la zone de saisie en bas).
5.  Le corps du message est pré-rempli avec un exemple. **Vous devez l'adapter** pour correspondre aux événements (`event`) et aux données (`data`) attendus par votre `SessionGateway`.
    ```json
    {
      "event": "votre-evenement",
      "data": {
        "cle": "valeur"
      }
    }
    ```
6.  Cliquez sur **Send** pour envoyer le message au serveur.
7.  Les messages reçus du serveur apparaîtront dans la section des messages au-dessus de la zone de saisie.
