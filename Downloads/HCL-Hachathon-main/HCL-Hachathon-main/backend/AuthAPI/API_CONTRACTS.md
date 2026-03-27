## API Contracts & Responses

### 1. Register Endpoint

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "name": "string (required, 1-255 chars)",
  "email": "string (required, valid email, unique)",
  "password": "string (required, min 8 chars recommended)"
}
```

**Successful Response (200 OK):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": null,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": null
  }
}
```

**Error Response - Duplicate Email (400 Bad Request):**
```json
{
  "success": false,
  "message": "User with this email already exists",
  "token": null,
  "user": null
}
```

**Error Response - Missing Fields (400 Bad Request):**
```json
{
  "success": false,
  "message": "Name, Email, and Password are required",
  "token": null,
  "user": null
}
```

**Error Response - Server Error (500 Internal Server Error):**
```json
{
  "success": false,
  "message": "An error occurred during registration",
  "errorType": "Exception"
}
```

---

### 2. Login Endpoint

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "string (required, valid email)",
  "password": "string (required)"
}
```

**Successful Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIxIiwiZW1haWwiOiJqb2huQGV4YW1wbGUuY29tIiwidW5pcXVlX25hbWUiOiJKb2huIERvZSIsImlzcyI6IkF1dGhBUEkiLCJhdWQiOiJBdXRoQVBJLVVzZXJzIiwiZXhwIjoxNzExNzk4ODAwLCJpYXQiOjE3MTE3OTUyMDB9.aBc...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": null
  }
}
```

**Token Breakdown (when decoded at jwt.io):**
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "nameid": "1",                    // User ID
    "email": "john@example.com",      // User Email
    "unique_name": "John Doe",        // User Name
    "role": "Admin",                  // User Role (if set)
    "iss": "AuthAPI",                 // Issuer
    "aud": "AuthAPI-Users",           // Audience
    "exp": 1711798800,                // Expiration timestamp
    "iat": 1711795200                 // Issued at timestamp
  },
  "signature": "..."                  // HS256 signature
}
```

**Error Response - Invalid Credentials (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid email or password",
  "token": null,
  "user": null
}
```

**Error Response - Missing Fields (400 Bad Request):**
```json
{
  "success": false,
  "message": "Email and Password are required",
  "token": null,
  "user": null
}
```

**Error Response - Server Error (500 Internal Server Error):**
```json
{
  "success": false,
  "message": "An error occurred during login",
  "errorType": "Exception"
}
```

---

## Using JWT Token in Protected Requests

### Add Authorization Header

```http
GET /api/protected HTTP/1.1
Host: localhost:5001
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Examples Using Token

**cURL:**
```bash
curl -X GET http://localhost:5000/api/protected \
  -H "Authorization: Bearer <token>"
```

**JavaScript Fetch:**
```javascript
fetch('http://localhost:5000/api/protected', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

**Postman:**
1. In Headers tab
2. Add key: `Authorization`
3. Add value: `Bearer <paste_token_here>`

---

## Example Usage Scenarios

### Scenario 1: Complete Registration and Login Flow

**Step 1: Register**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Smith",
    "email": "alice@example.com",
    "password": "SecurePass123!"
  }'
```

Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "Alice Smith",
    "email": "alice@example.com",
    "role": null
  }
}
```

**Step 2: Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "SecurePass123!"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Alice Smith",
    "email": "alice@example.com",
    "role": null
  }
}
```

**Step 3: Use Token**
```bash
# Extract token from response and use in header
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:5000/api/protected \
  -H "Authorization: Bearer $TOKEN"
```

---

### Scenario 2: Error Cases

**Duplicate Email Registration:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Different Name",
    "email": "alice@example.com",
    "password": "Other123!"
  }'
```

Response: `400 Bad Request`
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

**Wrong Password Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "WrongPassword123!"
  }'
```

Response: `400 Bad Request`
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**Missing Required Fields:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob",
    "email": "bob@example.com"
  }'
```

Response: `400 Bad Request`
```json
{
  "success": false,
  "message": "Name, Email, and Password are required"
}
```

---

## HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| `200` | Success | Register successful, login successful |
| `400` | Bad Request | Validation failed, duplicate email, wrong password |
| `401` | Unauthorized | Missing token, invalid token, expired token |
| `403` | Forbidden | Token valid but insufficient permissions |
| `500` | Server Error | Database error, unhandled exception |

---

## Response Structure

### Success Response
```typescript
{
  success: boolean,           // true if operation succeeded
  message: string,            // Human-readable message
  token?: string,             // JWT token (only in login)
  user?: {
    id: number,
    name: string,
    email: string,
    role: string | null
  }
}
```

### Error Response
```typescript
{
  success: boolean,           // false if operation failed
  message: string,            // Error description
  errorType?: string,         // Exception type name
  token?: null,
  user?: null
}
```

---

## Token Claims

The JWT token includes these claims:

| Claim | Type | Description |
|-------|------|-------------|
| `nameid` | string | User ID |
| `email` | string | User email |
| `unique_name` | string | User name |
| `role` | string | User role (if set) |
| `iss` | string | Issuer (AuthAPI) |
| `aud` | string | Audience (AuthAPI-Users) |
| `exp` | number | Expiration time (unix timestamp) |
| `iat` | number | Issued at time (unix timestamp) |

---

## Integration Example

### How to Use in Another .NET API

```csharp
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    // Only accessible with valid JWT token
    [Authorize]
    [HttpGet("profile")]
    public IActionResult GetProfile()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var email = User.FindFirst(ClaimTypes.Email)?.Value;

        return Ok(new {
            message = $"User {email} (ID: {userId})",
            authenticated = User.Identity?.IsAuthenticated
        });
    }

    // Admin only endpoint
    [Authorize(Roles = "Admin")]
    [HttpGet("admin")]
    public IActionResult AdminOnly()
    {
        return Ok("Admin access granted");
    }

    // Public endpoint
    [HttpGet("public")]
    public IActionResult PublicData()
    {
        return Ok("Public data");
    }
}
```

---

## Testing Checklist

- [ ] Register with valid data → 200 OK
- [ ] Register with duplicate email → 400 Bad Request
- [ ] Register with missing fields → 400 Bad Request
- [ ] Login with correct credentials → 200 OK with token
- [ ] Login with wrong password → 400 Bad Request
- [ ] Use token in Authorization header → 200 OK
- [ ] Use expired token → 401 Unauthorized
- [ ] Use invalid token → 401 Unauthorized
- [ ] Access [Authorize] endpoint without token → 401 Unauthorized
- [ ] Access public endpoint → 200 OK

---

**All API contracts documented and ready for frontend integration! ✅**
