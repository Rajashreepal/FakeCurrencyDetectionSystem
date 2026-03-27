# Authentication API - .NET Web API

A production-ready, reusable authentication module for any .NET backend. JWT-based, SQLite local database, fully self-contained.

## ✨ Features

- ✅ User Registration with password hashing (PBKDF2)
- ✅ User Login with JWT token generation
- ✅ JWT Bearer Token Authentication
- ✅ SQLite local database (auto-created)
- ✅ Clean layered architecture (Controllers → Services → Repositories)
- ✅ Repository pattern for data access
- ✅ Dependency injection
- ✅ Global exception handling middleware
- ✅ Structured logging
- ✅ Swagger/OpenAPI documentation
- ✅ CORS enabled for all origins
- ✅ Zero external dependencies (runs fully local)

## 📋 Project Structure

```
AuthAPI/
├── Controllers/
│   └── AuthController.cs          # Register & Login endpoints
├── Models/
│   └── User.cs                    # User entity
├── DTOs/
│   ├── RegisterDto.cs
│   ├── LoginDto.cs
│   └── AuthResponseDto.cs
├── Services/
│   └── AuthService.cs             # Business logic
├── Repositories/
│   ├── IUserRepository.cs
│   └── UserRepository.cs          # Data access layer
├── Auth/
│   └── JwtTokenGenerator.cs       # JWT token generation
├── Middleware/
│   └── ExceptionMiddleware.cs     # Global exception handling
├── Data/
│   └── AppDbContext.cs            # Entity Framework DbContext
├── Program.cs                     # App configuration
├── appsettings.json              # Configuration
├── AuthAPI.csproj
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- .NET 8.0 or higher (download from https://dotnet.microsoft.com/download)

### Setup & Run

1. **Navigate to project directory:**
   ```bash
   cd AuthAPI
   ```

2. **Restore dependencies:**
   ```bash
   dotnet restore
   ```

3. **Run the application:**
   ```bash
   dotnet run
   ```

4. **Application starts on:**
   - `http://localhost:5000` (HTTP)
   - `https://localhost:5001` (HTTPS)
   - Swagger UI: `https://localhost:5001/` (in development mode)

## 🔐 API Endpoints

### 1. Register User

**POST** `/api/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Success Response (200):**
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

**Error Response (400):**
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

### 2. Login User

**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": null
  }
}
```

**Sample JWT Token (decoded):**
```json
{
  "nameid": "1",
  "email": "john@example.com",
  "unique_name": "John Doe",
  "iss": "AuthAPI",
  "aud": "AuthAPI-Users",
  "exp": 1711795200,
  "iat": 1711791600
}
```

## 🧪 Testing with Swagger

1. **Open Swagger UI:** `https://localhost:5001/` (when running in development)

2. **Test Register Endpoint:**
   - Click "Try it out" on POST `/api/auth/register`
   - Enter test data:
     ```json
     {
       "name": "Test User",
       "email": "test@example.com",
       "password": "Password123!"
     }
     ```
   - Click "Execute"
   - Copy the response token

3. **Authorize Swagger with JWT Token:**
   - Click "Authorize" button in Swagger UI
   - Paste your JWT token in the value field (without "Bearer " prefix)
   - Click "Authorize"

4. **Test Login Endpoint:**
   - Click "Try it out" on POST `/api/auth/login`
   - Use the same credentials from registration
   - Execute and verify token is returned

## ⚙️ Configuration

Edit `appsettings.json` to customize:

```json
{
  "Jwt": {
    "SecretKey": "your-secret-key-min-32-chars",
    "Issuer": "AuthAPI",
    "Audience": "AuthAPI-Users",
    "ExpiryMinutes": 60
  },
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=auth.db"
  }
}
```

### Important: 🔒 Change SecretKey

In **production**, replace the SecretKey with a strong, random 32+ character string:

```bash
# Generate a secure key (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object {[byte](Get-Random -Maximum 256)})) | clip
```

## 📊 Database

- **Type:** SQLite (local file)
- **File:** `auth.db` (auto-created in project root)
- **Tables:** Users (auto-created)
- **Schema:**
  - `Id` (int, primary key)
  - `Name` (string)
  - `Email` (string, unique)
  - `PasswordHash` (string, hashed with PBKDF2-SHA256)
  - `Role` (string, nullable)
  - `CreatedAt` (datetime)

## 🔐 Security Features

- ✅ **Password Hashing:** PBKDF2-SHA256 with salt
- ✅ **JWT Tokens:** HS256 signing with secret key
- ✅ **Claims:** UserId, Email, Name, Role included in token
- ✅ **Token Expiry:** Configurable (default 60 minutes)
- ✅ **HTTPS Support:** Enabled by default
- ✅ **Exception Handling:** All errors caught and logged
- ✅ **Input Validation:** Email uniqueness, required fields

## 🔌 Integration Guide

To integrate this auth module into another .NET backend:

1. **Copy the entire `AuthAPI` folder** to your solution

2. **Add Authentication to your Program.cs:**
   ```csharp
   // Copy authentication setup from AuthAPI/Program.cs
   builder.Services.AddDbContext<AppDbContext>(options =>
       options.UseSqlite(connectionString)
   );

   builder.Services.AddScoped<IUserRepository, UserRepository>();
   builder.Services.AddScoped<IAuthService, AuthService>();
   builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

   builder.Services.AddAuthentication("Bearer").AddJwtBearer(...);
   ```

3. **Use in other controllers:**
   ```csharp
   [Authorize]
   [HttpGet("protected")]
   public IActionResult ProtectedEndpoint()
   {
       var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
       return Ok($"Authenticated user: {userId}");
   }
   ```

## 🐛 Logging

All operations are logged to console. Logs include:
- User registration/login attempts
- SQL queries (EF Core)
- Errors and exceptions
- Token generation

Example logs:
```
info: AuthAPI.Services.AuthService[0]
      User registered successfully: john@example.com
info: AuthAPI.Auth.JwtTokenGenerator[0]
      JWT token generated for user: 1
```

## 📦 Dependencies

- `Microsoft.EntityFrameworkCore` (8.0.0)
- `Microsoft.EntityFrameworkCore.Sqlite` (8.0.0)
- `Swashbuckle.AspNetCore` (6.4.6)
- `System.IdentityModel.Tokens.Jwt` (7.1.0)

All dependencies are defined in `AuthAPI.csproj`

## 🎯 Next Steps (For Integration)

1. ✅ **Clone/Copy this module** into your backend project
2. ✅ **Run:** `dotnet run`
3. ✅ **Test:** Register & Login via Swagger
4. ✅ **Integrate:** Add `[Authorize]` to protected endpoints in your business APIs
5. ✅ **Extend:** Add more user fields via User model as needed

## 📝 Notes

- Database auto-creates on first run
- No migrations needed (EF Core handles schema)
- All code follows C# naming conventions
- Async/await pattern used throughout
- Dependency injection for testability
- Clean separation of concerns

---

**Ready to use authentication for any .NET backend! 🚀**
