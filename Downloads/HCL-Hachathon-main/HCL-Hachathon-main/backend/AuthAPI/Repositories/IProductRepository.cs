using AuthAPI.Models;

namespace AuthAPI.Repositories;

public interface IProductRepository
{
    Task<List<Product>> GetAllAsync();
    Task<Product?> GetByIdAsync(int id);
    Task<List<Product>> GetByCategoryAsync(int categoryId);
    Task<Product> AddAsync(Product product);
    Task DeleteAsync(int id);
    Task SaveChangesAsync();
}
