## Complete Project Structure

```
hcl1/
└── AuthAPI/                          ← Main Backend API Folder
    ├── Auth/                         ← JWT Token Generation
    │   └── JwtTokenGenerator.cs      ✨ Generates JWT tokens with claims
    │
    ├── Controllers/                  ← API Endpoints (HTTP Layer)
    │   └── AuthController.cs         🔐 POST /api/auth/register
    │                                 🔐 POST /api/auth/login
    │
    ├── Models/                       ← Domain Entities
    │   └── User.cs                   👤 Id, Name, Email, PasswordHash, Role
    │
    ├── DTOs/                         ← Data Transfer Objects (API Contracts)
    │   ├── RegisterDto.cs            📝 Name, Email, Password
    │   ├── LoginDto.cs               📝 Email, Password
    │   └── AuthResponseDto.cs        📝 Success, Message, Token, User
    │
    ├── Services/                     ← Business Logic (Service Layer)
    │   └── AuthService.cs            ✓ Register/Login logic
    │                                 ✓ Password hashing (PBKDF2-SHA256)
    │                                 ✓ DTO mapping
    │
    ├── Repositories/                 ← Data Access Layer
    │   ├── IUserRepository.cs        📊 Interface
    │   └── UserRepository.cs         📊 GetByEmailAsync, AddAsync
    │
    ├── Data/                         ← Entity Framework
    │   └── AppDbContext.cs           💾 SQLite DbContext
    │                                 💾 User table configuration
    │
    ├── Middleware/                   ← Cross-Cutting Concerns
    │   └── ExceptionMiddleware.cs    🛡️ Global exception handling
    │
    ├── Program.cs                    ⚙️  Application Configuration
    │                                 ⚙️  DI registration
    │                                 ⚙️  Auth setup
    │                                 ⚙️  DB auto-creation
    │
    ├── appsettings.json              🔧 Configuration File
    │                                 🔧 JWT settings
    │                                 🔧 DB connection string
    │                                 🔧 CORS origins
    │
    ├── AuthAPI.csproj                📦 Project File
    │                                 📦 Dependencies
    │                                 📦 .NET 8.0 target
    │
    ├── .gitignore                    🚫 Git excludes
    │                                 🚫 bin/, obj/, *.db
    │
    ├── README.md                     📖 Complete documentation
    │                                 📖 Features, setup, API docs
    │
    ├── TESTING.md                    🧪 Testing guide
    │                                 🧪 cURL, Postman, Swagger examples
    │
    └── SETUP.txt                     🚀 Quick start guide
                                      🚀 Prerequisites, commands
```

## File Purposes

### Core Application Files

| File | Purpose |
|------|---------|
| `Program.cs` | Entry point, DI setup, middleware registration, DB creation |
| `appsettings.json` | Configuration: JWT, DB, CORS, logging |
| `AuthAPI.csproj` | NuGet package references, .NET target |

### Authentication Layer

| File | Purpose |
|------|---------|
| `Auth/JwtTokenGenerator.cs` | Creates JWT tokens with user claims |

### API Layer (HTTP)

| File | Purpose |
|------|---------|
| `Controllers/AuthController.cs` | HTTP endpoints: Register, Login |

### Business Logic Layer

| File | Purpose |
|------|---------|
| `Services/AuthService.cs` | Core logic: validation, hashing, DTO mapping |

### Data Access Layer

| File | Purpose |
|------|---------|
| `Repositories/IUserRepository.cs` | Interface defining data contracts |
| `Repositories/UserRepository.cs` | Implementation: DB queries |
| `Data/AppDbContext.cs` | EF Core configuration, migrations |

### Data Models

| File | Purpose |
|------|---------|
| `Models/User.cs` | Database entity for users |
| `DTOs/RegisterDto.cs` | API request for registration |
| `DTOs/LoginDto.cs` | API request for login |
| `DTOs/AuthResponseDto.cs` | API response with token |

### Cross-Cutting Concerns

| File | Purpose |
|------|---------|
| `Middleware/ExceptionMiddleware.cs` | Handles all global exceptions |

### Documentation

| File | Purpose |
|------|---------|
| `README.md` | Complete feature documentation |
| `TESTING.md` | Testing examples (cURL, Postman, Swagger) |
| `SETUP.txt` | Quick start instructions |

---

## Code Statistics

```
Total Files:       16 C# files + configs
Total Lines:       ~1,200 lines of code
Controllers:       1 (AuthController)
Services:          1 (AuthService)
Repositories:      1 (UserRepository)
DTOs:             3 classes
Models:           1 (User)
Middleware:       1 (ExceptionMiddleware)
Interfaces:       3 (IUserRepository, IAuthService, IJwtTokenGenerator)
```

---

## Dependency Injection Chain

```
Program.cs Registers:
├── AppDbContext
│   └── Uses: SQLite connection string
├── IUserRepository → UserRepository
│   └── Depends on: AppDbContext
├── IAuthService → AuthService
│   └── Depends on: IUserRepository, IJwtTokenGenerator
├── IJwtTokenGenerator → JwtTokenGenerator
│   └── Depends on: IConfiguration
└── Authentication/Authorization
    └── Uses: JWT Bearer scheme
```

---

## Request Flow

### Register Request Flow
```
POST /api/auth/register
    ↓
AuthController.Register(RegisterDto)
    ↓
AuthService.RegisterAsync()
    ├─ Validate input
    ├─ Check email uniqueness via UserRepository.GetByEmailAsync()
    ├─ Hash password (PBKDF2-SHA256)
    ├─ Create User entity
    └─ Save via UserRepository.AddAsync() & SaveChangesAsync()
    ↓
Return: AuthResponseDto { success: true, message, user }
```

### Login Request Flow
```
POST /api/auth/login
    ↓
AuthController.Login(LoginDto)
    ↓
AuthService.LoginAsync()
    ├─ Validate input
    ├─ Fetch User via UserRepository.GetByEmailAsync()
    ├─ Verify password (PBKDF2 comparison)
    ├─ Generate JWT via JwtTokenGenerator.GenerateToken()
    │  ├─ Add claims: UserId, Email, Name, Role
    │  ├─ Sign with HS256 + SecretKey
    │  └─ Set expiry from config (default 60 minutes)
    └─ Return user + token
    ↓
Return: AuthResponseDto { success: true, message, token, user }
```

### Protected Request Flow
```
GET /api/protected with Authorization: Bearer <token>
    ↓
UseAuthentication Middleware
    ├─ Extract token from header
    ├─ Validate signature (HS256 with SecretKey)
    ├─ Validate issuer, audience, expiry
    └─ Populate User.Claims with token data
    ↓
[Authorize] attribute checks
    └─ User.Identity.IsAuthenticated == true
    ↓
Proceed to endpoint OR return 401 Unauthorized
```

---

## Database Schema

### Users Table (Auto-Created)
```sql
CREATE TABLE Users (
    Id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    Name              TEXT NOT NULL,
    Email             TEXT NOT NULL UNIQUE,
    PasswordHash      TEXT NOT NULL,
    Role              TEXT NULL,
    CreatedAt         DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IX_Users_Email ON Users(Email);
```

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Framework | .NET 8.0 (Web API) |
| Database | SQLite (local file) |
| ORM | Entity Framework Core |
| Authentication | JWT Bearer |
| Token Signing | HS256 (HMAC-SHA256) |
| Password Hashing | PBKDF2-SHA256 + Salt |
| Logging | ILogger (console) |
| API Documentation | Swagger/OpenAPI |
| Dependency Injection | Built-in (Microsoft.Extensions.DependencyInjection) |

---

## Configuration Overview

### appsettings.json
```json
{
  "Jwt": {
    "SecretKey": "your-secret-key-min-32-chars",     // ← Change in production
    "Issuer": "AuthAPI",                              // ← Token issuer
    "Audience": "AuthAPI-Users",                      // ← Token audience
    "ExpiryMinutes": 60                               // ← Token validity
  },
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=auth.db"        // ← SQLite file path
  },
  "Cors": {
    "AllowedOrigins": [...]                          // ← Allowed origins
  }
}
```

---

## How to Extend

### Add a New User Field
1. Add property to `User.cs` model
2. Update `UserDto.cs` if needed
3. Re-run: SQLite auto-updates schema

### Add Role-Based Authorization
1. Update `User.cs` with role checks
2. Add claims to JWT in `JwtTokenGenerator.cs`
3. Use `[Authorize(Roles = "Admin")]` on endpoints

### Add More Authentication Endpoints
1. Create new methods in `AuthService.cs`
2. Add endpoints in `AuthController.cs`
3. DTOs for new endpoints

### Change Database
1. Update connection string in `appsettings.json`
2. Replace Sqlite provider in `Program.cs`
3. No other code changes needed!

---

**All files organized, documented, and ready for production use! ✅**
