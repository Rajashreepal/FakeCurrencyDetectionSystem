using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Threading.RateLimiting;
using AuthAPI.Data;
using AuthAPI.Middleware;
using AuthAPI.Repositories;
using AuthAPI.Services;
using AuthAPI.Auth;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();

// Add DbContext - SQLite
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(connectionString)
);

// Add Repository Pattern
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<ICartRepository, CartRepository>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IInventoryRepository, InventoryRepository>();

// Add Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddScoped<IOrderService, OrderService>();

// Add Authentication with JWT
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT:SecretKey is missing");

builder.Services
    .AddAuthentication("Bearer")
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ValidateIssuer = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidateAudience = true,
            ValidAudience = jwtSettings["Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// Add Swagger
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Enter JWT token"
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Add CORS - Allow All
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Add Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Global policy: 100 requests per minute per IP
    options.AddFixedWindowLimiter("GlobalLimit", opt =>
    {
        opt.PermitLimit = 100;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 5;
    });

    // Strict policy for auth endpoints: 10 requests per 15 seconds
    options.AddFixedWindowLimiter("AuthLimit", opt =>
    {
        opt.PermitLimit = 10;
        opt.Window = TimeSpan.FromSeconds(15);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 2;
    });

    // Default global limiter per IP
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1)
            }));
});

var app = builder.Build();

// Create/Migrate Database and Seed Data
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    Console.WriteLine("✓ Database created/migrated successfully");

    // Seed initial data
    await SeedDatabase(db);
}

// Configure Middleware
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Auth API v1");
    options.RoutePrefix = string.Empty;
});

// Add Exception Middleware
app.UseMiddleware<ExceptionMiddleware>();

app.UseHttpsRedirection();

// Enable CORS
app.UseCors("AllowAll");

// Enable Rate Limiting
app.UseRateLimiter();

// Add Authentication & Authorization middleware
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

// Seed Database Function
async Task SeedDatabase(AppDbContext context)
{
    try
    {
        // Seed Admin User
        if (!context.Users.Any(u => u.Email == "admin@example.com"))
        {
            var adminUser = new AuthAPI.Models.User
            {
                Name = "Admin User",
                Email = "admin@example.com",
                PasswordHash = HashPasswordForSeed("Admin@123"),
                Role = "Admin"
            };
            context.Users.Add(adminUser);
            await context.SaveChangesAsync();
            Console.WriteLine("✓ Admin user seeded");
        }

        // Seed Customer User
        if (!context.Users.Any(u => u.Email == "customer@example.com"))
        {
            var customerUser = new AuthAPI.Models.User
            {
                Name = "John Customer",
                Email = "customer@example.com",
                PasswordHash = HashPasswordForSeed("Customer@123"),
                Role = "Customer"
            };
            context.Users.Add(customerUser);
            await context.SaveChangesAsync();
            Console.WriteLine("✓ Customer user seeded");
        }

        // Seed Categories
        if (!context.Categories.Any())
        {
            var categories = new List<AuthAPI.Models.Category>
            {
                new() { Name = "Pizza", Description = "Delicious pizzas" },
                new() { Name = "Cold Drinks", Description = "Refreshing beverages" },
                new() { Name = "Breads", Description = "Fresh baked breads" }
            };
            context.Categories.AddRange(categories);
            await context.SaveChangesAsync();
            Console.WriteLine("✓ Categories seeded");
        }

        // Seed Products
        if (!context.Products.Any())
        {
            var pizzaCategory = context.Categories.First(c => c.Name == "Pizza");
            var drinksCategory = context.Categories.First(c => c.Name == "Cold Drinks");
            var breadsCategory = context.Categories.First(c => c.Name == "Breads");

            var products = new List<AuthAPI.Models.Product>
            {
                new() { Name = "Margherita Pizza", Description = "Classic cheese pizza", Price = 9.99m, CategoryId = pizzaCategory.Id, StockQuantity = 50 },
                new() { Name = "Pepperoni Pizza", Description = "Loaded with pepperoni", Price = 11.99m, CategoryId = pizzaCategory.Id, StockQuantity = 50 },
                new() { Name = "Coca Cola", Description = "250ml Cold Coke", Price = 1.99m, CategoryId = drinksCategory.Id, StockQuantity = 100 },
                new() { Name = "Orange Juice", Description = "Fresh orange juice", Price = 2.49m, CategoryId = drinksCategory.Id, StockQuantity = 80 },
                new() { Name = "Whole Wheat Bread", Description = "Healthy whole wheat", Price = 3.99m, CategoryId = breadsCategory.Id, StockQuantity = 60 },
                new() { Name = "White Bread", Description = "Soft white bread", Price = 2.99m, CategoryId = breadsCategory.Id, StockQuantity = 70 }
            };
            context.Products.AddRange(products);
            await context.SaveChangesAsync();
            Console.WriteLine("✓ Products seeded");
        }

        // Seed Inventory
        if (!context.Inventories.Any())
        {
            var products = context.Products.ToList();
            var inventories = products.Select(p => new AuthAPI.Models.Inventory
            {
                ProductId = p.Id,
                AvailableQuantity = p.StockQuantity,
                ReservedQuantity = 0,
                LastUpdated = DateTime.UtcNow
            }).ToList();
            context.Inventories.AddRange(inventories);
            await context.SaveChangesAsync();
            Console.WriteLine("✓ Inventory seeded");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"✗ Error seeding database: {ex.Message}");
    }
}

// Helper to hash passwords for seed data (same algorithm as AuthService)
static string HashPasswordForSeed(string password)
{
    var salt = new byte[16];
    using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
    {
        rng.GetBytes(salt);
    }
    var pbkdf2 = new System.Security.Cryptography.Rfc2898DeriveBytes(
        password, salt, 10000, System.Security.Cryptography.HashAlgorithmName.SHA256);
    var hash = pbkdf2.GetBytes(20);
    var hashWithSalt = new byte[36];
    Buffer.BlockCopy(salt, 0, hashWithSalt, 0, 16);
    Buffer.BlockCopy(hash, 0, hashWithSalt, 16, 20);
    return Convert.ToBase64String(hashWithSalt);
}

