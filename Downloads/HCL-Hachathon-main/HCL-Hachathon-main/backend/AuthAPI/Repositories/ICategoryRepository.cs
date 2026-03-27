using AuthAPI.Models;

namespace AuthAPI.Repositories;

public interface ICategoryRepository
{
    Task<List<Category>> GetAllAsync();
    Task<Category?> GetByIdAsync(int id);
    Task<Category> AddAsync(Category category);
    Task DeleteAsync(int id);
    Task SaveChangesAsync();
}
