using AuthAPI.Models;

namespace AuthAPI.Repositories;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<List<User>> GetAllAsync();
    Task<User> AddAsync(User user);
    Task DeleteAsync(int id);
    Task SaveChangesAsync();
}
