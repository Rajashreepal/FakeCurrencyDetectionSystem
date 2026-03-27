using AuthAPI.Models;

namespace AuthAPI.Repositories;

public interface ICartRepository
{
    Task<Cart?> GetByUserIdAsync(int userId);
    Task<CartItem?> GetCartItemAsync(int cartId, int productId);
    Task<Cart> CreateCartAsync(int userId);
    Task<CartItem> AddItemAsync(CartItem cartItem);
    Task UpdateItemAsync(CartItem cartItem);
    Task RemoveItemAsync(int itemId);
    Task ClearCartAsync(int cartId);
    Task SaveChangesAsync();
}
