# API Response Conventions

## General Structure
All API responses must follow a consistent structure to ensure clarity and uniformity across the application.

```json
{
  "message": "Message descriptif",
  "data": { ... } | [ ... ] | null,
  "errors": [
    {
      "code": "CODE_ERREUR_INTERNE",
      "type": "critique | informatif | warning"
    }
  ]
}
```

## Response Components

### HTTP Status Codes
- Use the most appropriate HTTP status code for each response.
- Examples:
  - `200 OK`: Request succeeded.
  - `201 Created`: Resource successfully created.
  - `400 Bad Request`: Client-side error (invalid input, missing params, etc.).
  - `401 Unauthorized`: Authentication failed.
  - `403 Forbidden`: Access denied.
  - `404 Not Found`: Resource not found.
  - `500 Internal Server Error`: Unexpected server-side error.

### Message
- A clear, human-readable message in English describing the outcome.
- Examples:
  - `"Campaigns recovered successfully."`
  - `"User authentication failed."`
  - `"Invalid query parameters."`

### Data
- Should contain the requested resource (object or list).
- If no data is returned, set an empty object `{}`.

### Errors
- Always an array.
- Contains:
  - `code`: Internal error code as specified in tickets to facilitate translation of user messages. These codes are stored in language files.
  - `type`: Classification of the error (`critical`, `informational`, `warning`). Used to display the correct color/state to users.

## Response Examples

### Success (Data retrieval)
```json
{
  "message": "Campaigns recovered successfully.",
  "data": [
    { "id": 1, "name": "Campagne A" },
    { "id": 2, "name": "Campagne B" }
  ],
  "errors": []
}
```

### Success (Resource creation)
```json
{
  "message": "Utilisateur créé avec succès.",
  "data": { "id": 123, "username": "johndoe" },
  "errors": []
}
```

### Error (Validation error)
```json
{
  "message": "Invalid query parameters.",
  "data": null,
  "errors": [
    {
      "code": "ENTREE_INVALIDE",
      "type": "critique"
    }
  ]
}
```

### Error (Authentication failure)
```json
{
  "message": "User authentication failed.",
  "data": null,
  "errors": [
    {
      "code": "IDENTIFIANTS_INVALIDES",
      "type": "critique"
    }
  ]
}
```
