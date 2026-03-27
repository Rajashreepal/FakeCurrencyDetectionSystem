using Microsoft.EntityFrameworkCore;
using AuthAPI.Data;
using AuthAPI.Models;

namespace AuthAPI.Repositories;

public class CartRepository : ICartRepository
{
    private readonly AppDbContext _context;

    public CartRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Cart?> GetByUserIdAsync(int userId)
    {
        return await _context.Carts
            .Include(c => c.Items)
            .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(c => c.UserId == userId);
    }

    public async Task<CartItem?> GetCartItemAsync(int cartId, int productId)
    {
        return await _context.CartItems
            .FirstOrDefaultAsync(ci => ci.CartId == cartId && ci.ProductId == productId);
    }

    public async Task<Cart> CreateCartAsync(int userId)
    {
        var cart = new Cart { UserId = userId };
        await _context.Carts.AddAsync(cart);
        return cart;
    }

    public async Task<CartItem> AddItemAsync(CartItem cartItem)
    {
        await _context.CartItems.AddAsync(cartItem);
        return cartItem;
    }

    public async Task UpdateItemAsync(CartItem cartItem)
    {
        _context.CartItems.Update(cartItem);
    }

    public async Task RemoveItemAsync(int itemId)
    {
        var item = await _context.CartItems.FindAsync(itemId);
        if (item != null)
        {
            _context.CartItems.Remove(item);
        }
    }

    public async Task ClearCartAsync(int cartId)
    {
        var items = await _context.CartItems.Where(ci => ci.CartId == cartId).ToListAsync();
        _context.CartItems.RemoveRange(items);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
