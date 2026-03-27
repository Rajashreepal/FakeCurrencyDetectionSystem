using AuthAPI.Models;

namespace AuthAPI.Repositories;

public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(int id);
    Task<List<Order>> GetByUserIdAsync(int userId);
    Task<List<Order>> GetAllAsync();
    Task<Order> AddAsync(Order order);
    Task SaveChangesAsync();
}
