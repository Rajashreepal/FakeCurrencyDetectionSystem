## Quick Testing Guide

### Using cURL

#### 1. Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "password": "AliceSecret123!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": null,
  "user": {
    "id": 1,
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "role": null
  }
}
```

#### 2. Login User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "AliceSecret123!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIxIiwiZW1haWwiOiJhbGljZUBleGFtcGxlLmNvbSIsInVuaXF1ZV9uYW1lIjoiQWxpY2UgSm9obnNvbiIsImlzcyI6IkF1dGhBUEkiLCJhdWQiOiJBdXRoQVBJLVVzZXJzIiwiZXhwIjoxNzExNzk1MjAwLCJpYXQiOjE3MTE3OTE2MDB9.xyz...",
  "user": {
    "id": 1,
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "role": null
  }
}
```

#### 3. Use JWT Token to Call Protected Endpoint
```bash
curl -X GET http://localhost:5000/api/protected \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### Using Postman

#### Step 1: Register
- **Method:** POST
- **URL:** `http://localhost:5000/api/auth/register`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "name": "Bob Smith",
  "email": "bob@example.com",
  "password": "BobPassword123!"
}
```

#### Step 2: Login
- **Method:** POST
- **URL:** `http://localhost:5000/api/auth/login`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "email": "bob@example.com",
  "password": "BobPassword123!"
}
```

#### Step 3: Use Token (copy from login response)
- In any protected endpoint request
- **Headers:** `Authorization: Bearer <paste_token_here>`

---

### Using Swagger UI

1. Open: `https://localhost:5001/` (development mode)

2. **Register Flow:**
   - Click "POST /api/auth/register"
   - Click "Try it out"
   - Paste JSON body
   - Click "Execute"

3. **Authorize Flow:**
   - Click blue "Authorize" button top-right
   - Paste JWT token (without "Bearer " prefix)
   - Click "Authorize"
   - Close dialog

4. **Login Flow:**
   - Repeat step 2 for "POST /api/auth/login"
   - Get JWT token from response

---

### Error Cases to Test

#### Invalid Email (Duplicate)
Request:
```json
{
  "name": "Charlie",
  "email": "alice@example.com",
  "password": "NewPass123!"
}
```

Response:
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

#### Invalid Login Credentials
Request:
```json
{
  "email": "alice@example.com",
  "password": "WrongPassword123!"
}
```

Response:
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

#### Missing Required Fields
Request:
```json
{
  "name": "Dave",
  "email": "dave@example.com"
}
```

Response:
```json
{
  "success": false,
  "message": "Name, Email, and Password are required"
}
```

---

### Testing Checklist

- [ ] Application starts successfully (`dotnet run`)
- [ ] Database `auth.db` is created
- [ ] Swagger UI loads at `https://localhost:5001/`
- [ ] Register endpoint works with valid data
- [ ] Duplicate email registration fails
- [ ] Login with correct credentials returns JWT token
- [ ] Login with wrong password fails
- [ ] JWT token can be decoded
- [ ] Authorization middleware rejects requests without token
- [ ] CORS allows requests from browser

---

### Decode JWT Token (Online)

Visit: https://jwt.io

Paste the token from login response to see:
- Header
- Payload (claims)
- Signature

Example decoded payload:
```json
{
  "iss": "AuthAPI",
  "aud": "AuthAPI-Users",
  "nameid": "1",
  "email": "alice@example.com",
  "unique_name": "Alice Johnson",
  "exp": 1711795200,
  "iat": 1711791600
}
```

---

### Performance Notes

- First run: ~2-3 seconds (downloads dependencies)
- Subsequent runs: <1 second
- Database queries: ~5-10ms
- JWT generation: ~2-3ms
- Token verification: ~1-2ms

---

**All tests passing? Your auth module is ready for integration! ✅**
