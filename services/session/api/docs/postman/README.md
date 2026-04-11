# Postman Collection for the Session Service

This directory contains a Postman collection to facilitate testing and interaction with the API and WebSocket server of the `session` service.

## Files

-   `chariot-session.postman_collection.json`: The Postman collection file to import.

## Prerequisites

-   [Postman](https://www.postman.com/downloads/) must be installed on your machine.
-   The `session` service must be running locally.

## Importing the Collection

1.  Open Postman.
2.  Click the **Import** button in the top-left corner.
3.  Select the `chariot-session.postman_collection.json` file from this directory.
4.  The "Chariot - Service Session" collection will appear in your list of collections.

## Configuration

The collection uses a `baseUrl` variable to define the base address of the service.

-   By default, it is initialized to `http://localhost:3001`.
-   If your service runs on a different port, you can modify this variable by selecting the collection, going to the **Variables** tab, and changing the value of `baseUrl`.

## Usage

### Testing the REST API

The collection includes a `GET` request for the health check:

1.  Expand the collection and the `API` folder.
2.  Select the **Health Check** request.
3.  Click **Send**.
4.  You should receive a response with a `200 OK` status and a response body confirming that the service is online. The **Tests** tab of the request will automatically validate the response.

### Testing the WebSocket

A WebSocket request is pre-configured to connect you to the service:

1.  Expand the `WebSocket` folder.
2.  Select the **Connexion au service Session** (Session Service Connection) request.
3.  Click **Connect**. Once the connection is established, a message area will appear.
4.  Go to the **Message** tab (the input area at the bottom).
5.  The message body is pre-filled with an example. **You must adapt it** to match the events (`event`) and data (`data`) expected by your `SessionGateway`.
    ```json
    {
      "event": "your-event",
      "data": {
        "key": "value"
      }
    }
    ```
6.  Click **Send** to send the message to the server.
7.  Messages received from the server will appear in the message section above the input area.
