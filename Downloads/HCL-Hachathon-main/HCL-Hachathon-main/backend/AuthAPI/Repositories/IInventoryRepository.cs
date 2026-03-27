using AuthAPI.Models;

namespace AuthAPI.Repositories;

public interface IInventoryRepository
{
    Task<Inventory?> GetByProductIdAsync(int productId);
    Task<List<Inventory>> GetAllAsync();
    Task<Inventory> AddAsync(Inventory inventory);
    Task UpdateAsync(Inventory inventory);
    Task SaveChangesAsync();
}
