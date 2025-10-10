# 📚 Documentation - Access Rights and `IsCreatorGuard`

## 🔐 Authentication & Access Token

### 1. Retrieving the token

When a user logs in via:

```json
POST /auth/login
```

A **JWT (JSON Web Token)** is generated and returned in the response:

```json
{
    "message": "User logged in 1ms",
    "access_token": {JWT}
}
```

This token contains the user identifier (`userId`) and is used to authenticate subsequent requests.

---

### 2. Using in Postman

To test a protected route with **Postman**:

- Go to the **Headers** tab
- Add a header:

```
Key: Cookie
Value: accessToken=<JWT>
```

#### Example:

```
Cookie: accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🛡️ Rights verification: `IsCreatorGuard`

The **`IsCreatorGuard`** is a custom guard that ensures the authenticated user is **the creator of a resource**.

### 🧠 How it works

- The `:id` parameter is extracted from the route (`@Param('id')`).
- The service injected via `@IsCreator(Service)` must expose a `findOne(id)` method returning an object with a `creatorId` property.
- The guard compares `creatorId` to `request.user.userId`.

---

### ✅ Usage example

#### Step 1: Enable the guard at the controller level

In the controller, add:

```ts
@UseGuards(IsCreatorGuard)
@Controller('groups')
export class GroupController {
  ...
}
```

#### Step 2: Protect a method

Add `@IsCreator(GroupService)` to each method that uses `:id`:

```ts
@IsCreator(GroupService)
@Get(':id')
findOne(@Param('id') id: string) {
  return this.groupService.findOne(id);
}

@IsCreator(GroupService)
@Patch(':id')
update(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
  return this.groupService.update(id, dto);
}
```

---

### 🔁 Required conditions

- The service must expose a `findOne(id: string)` method returning `{ creatorId: string }`.
- The `id` parameter must be present in the route.
- The user must be authenticated (valid JWT token in cookies).

---

## 🧪 Quick summary

| Item                         | Description                                                           |
| ---------------------------- | --------------------------------------------------------------------- |
| `accessToken`                | JWT stored in cookies after login                                     |
| `@UseGuards(IsCreatorGuard)` | Enables the guard on all routes of the controller                     |
| `@IsCreator(Service)`        | Ensures the user is the creator of the targeted resource              |
| Required service method      | `findOne(id: string): Promise<{ creatorId: string }>`                 |
