using AuthAPI.DTOs;
using AuthAPI.Models;
using AuthAPI.Repositories;

namespace AuthAPI.Services;

public interface ICartService
{
    Task<CartDto?> GetCartAsync(int userId);
    Task<CartDto> AddToCartAsync(int userId, AddToCartDto dto);
    Task<CartDto> UpdateCartItemAsync(int userId, int itemId, UpdateCartItemDto dto);
    Task RemoveFromCartAsync(int userId, int itemId);
    Task ClearCartAsync(int userId);
}

public class CartService : ICartService
{
    private readonly ICartRepository _cartRepository;
    private readonly IProductRepository _productRepository;
    private readonly ILogger<CartService> _logger;

    public CartService(
        ICartRepository cartRepository,
        IProductRepository productRepository,
        ILogger<CartService> logger)
    {
        _cartRepository = cartRepository;
        _productRepository = productRepository;
        _logger = logger;
    }

    public async Task<CartDto?> GetCartAsync(int userId)
    {
        try
        {
            var cart = await _cartRepository.GetByUserIdAsync(userId);
            if (cart == null) return null;

            return MapToDto(cart);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cart for user {UserId}", userId);
            throw;
        }
    }

    public async Task<CartDto> AddToCartAsync(int userId, AddToCartDto dto)
    {
        try
        {
            if (dto.Quantity <= 0)
                throw new ArgumentException("Quantity must be greater than 0");

            var product = await _productRepository.GetByIdAsync(dto.ProductId);
            if (product == null)
                throw new KeyNotFoundException("Product not found");

            if (product.StockQuantity < dto.Quantity)
                throw new InvalidOperationException("Insufficient stock");

            var cart = await _cartRepository.GetByUserIdAsync(userId);
            if (cart == null)
            {
                cart = await _cartRepository.CreateCartAsync(userId);
                await _cartRepository.SaveChangesAsync();
            }

            var existingItem = await _cartRepository.GetCartItemAsync(cart.Id, dto.ProductId);
            if (existingItem != null)
            {
                existingItem.Quantity += dto.Quantity;
                await _cartRepository.UpdateItemAsync(existingItem);
            }
            else
            {
                var cartItem = new CartItem
                {
                    CartId = cart.Id,
                    ProductId = dto.ProductId,
                    Quantity = dto.Quantity,
                    Price = product.Price
                };
                await _cartRepository.AddItemAsync(cartItem);
            }

            await _cartRepository.SaveChangesAsync();
            _logger.LogInformation("Product {ProductId} added to cart for user {UserId}", dto.ProductId, userId);

            cart = await _cartRepository.GetByUserIdAsync(userId);
            return MapToDto(cart!);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding to cart for user {UserId}", userId);
            throw;
        }
    }

    public async Task<CartDto> UpdateCartItemAsync(int userId, int itemId, UpdateCartItemDto dto)
    {
        try
        {
            if (dto.Quantity <= 0)
                throw new ArgumentException("Quantity must be greater than 0");

            var cart = await _cartRepository.GetByUserIdAsync(userId);
            if (cart == null)
                throw new KeyNotFoundException("Cart not found");

            var item = cart.Items.FirstOrDefault(i => i.Id == itemId);
            if (item == null)
                throw new KeyNotFoundException("Cart item not found");

            var product = await _productRepository.GetByIdAsync(item.ProductId);
            if (product == null || product.StockQuantity < dto.Quantity)
                throw new InvalidOperationException("Insufficient stock");

            item.Quantity = dto.Quantity;
            await _cartRepository.UpdateItemAsync(item);
            await _cartRepository.SaveChangesAsync();

            _logger.LogInformation("Cart item {ItemId} updated for user {UserId}", itemId, userId);

            cart = await _cartRepository.GetByUserIdAsync(userId);
            return MapToDto(cart!);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating cart item {ItemId} for user {UserId}", itemId, userId);
            throw;
        }
    }

    public async Task RemoveFromCartAsync(int userId, int itemId)
    {
        try
        {
            var cart = await _cartRepository.GetByUserIdAsync(userId);
            if (cart == null)
                throw new KeyNotFoundException("Cart not found");

            var item = cart.Items.FirstOrDefault(i => i.Id == itemId);
            if (item == null)
                throw new KeyNotFoundException("Cart item not found");

            await _cartRepository.RemoveItemAsync(itemId);
            await _cartRepository.SaveChangesAsync();

            _logger.LogInformation("Cart item {ItemId} removed for user {UserId}", itemId, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing cart item {ItemId} for user {UserId}", itemId, userId);
            throw;
        }
    }

    public async Task ClearCartAsync(int userId)
    {
        try
        {
            var cart = await _cartRepository.GetByUserIdAsync(userId);
            if (cart != null)
            {
                await _cartRepository.ClearCartAsync(cart.Id);
                await _cartRepository.SaveChangesAsync();
                _logger.LogInformation("Cart cleared for user {UserId}", userId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing cart for user {UserId}", userId);
            throw;
        }
    }

    private CartDto MapToDto(Cart cart)
    {
        return new CartDto
        {
            Id = cart.Id,
            Items = cart.Items.Select(i => new CartItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.Product.Name,
                Quantity = i.Quantity,
                Price = i.Price
            }).ToList()
        };
    }
}
