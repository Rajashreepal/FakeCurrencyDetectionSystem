using AuthAPI.DTOs;
using AuthAPI.Models;
using AuthAPI.Repositories;

namespace AuthAPI.Services;

public interface IOrderService
{
    Task<OrderDto?> GetOrderAsync(int id);
    Task<List<OrderDto>> GetUserOrdersAsync(int userId);
    Task<List<OrderDto>> GetAllOrdersAsync();
    Task<OrderDto> CreateOrderAsync(int userId);
}

public class OrderService : IOrderService
{
    private readonly IOrderRepository _orderRepository;
    private readonly ICartRepository _cartRepository;
    private readonly IProductRepository _productRepository;
    private readonly IInventoryRepository _inventoryRepository;
    private readonly ILogger<OrderService> _logger;

    public OrderService(
        IOrderRepository orderRepository,
        ICartRepository cartRepository,
        IProductRepository productRepository,
        IInventoryRepository inventoryRepository,
        ILogger<OrderService> logger)
    {
        _orderRepository = orderRepository;
        _cartRepository = cartRepository;
        _productRepository = productRepository;
        _inventoryRepository = inventoryRepository;
        _logger = logger;
    }

    public async Task<OrderDto?> GetOrderAsync(int id)
    {
        try
        {
            var order = await _orderRepository.GetByIdAsync(id);
            if (order == null) return null;

            return MapToDto(order);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting order {OrderId}", id);
            throw;
        }
    }

    public async Task<List<OrderDto>> GetUserOrdersAsync(int userId)
    {
        try
        {
            var orders = await _orderRepository.GetByUserIdAsync(userId);
            return orders.Select(MapToDto).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting orders for user {UserId}", userId);
            throw;
        }
    }

    public async Task<List<OrderDto>> GetAllOrdersAsync()
    {
        try
        {
            var orders = await _orderRepository.GetAllAsync();
            return orders.Select(MapToDto).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all orders");
            throw;
        }
    }

    public async Task<OrderDto> CreateOrderAsync(int userId)
    {
        try
        {
            var cart = await _cartRepository.GetByUserIdAsync(userId);
            if (cart == null || !cart.Items.Any())
                throw new InvalidOperationException("Cart is empty");

            var order = new Order
            {
                UserId = userId,
                Status = "Pending",
                TotalAmount = 0
            };

            decimal totalAmount = 0;

            foreach (var cartItem in cart.Items)
            {
                var product = await _productRepository.GetByIdAsync(cartItem.ProductId);
                if (product == null)
                    throw new KeyNotFoundException($"Product {cartItem.ProductId} not found");

                if (product.StockQuantity < cartItem.Quantity)
                    throw new InvalidOperationException($"Insufficient stock for {product.Name}");

                var orderItem = new OrderItem
                {
                    ProductId = cartItem.ProductId,
                    Quantity = cartItem.Quantity,
                    Price = cartItem.Price,
                    Subtotal = cartItem.Quantity * cartItem.Price
                };
                order.Items.Add(orderItem);
                totalAmount += orderItem.Subtotal;

                // Update stock
                product.StockQuantity -= cartItem.Quantity;
                await _productRepository.SaveChangesAsync();

                // Update inventory
                var inventory = await _inventoryRepository.GetByProductIdAsync(product.Id);
                if (inventory != null)
                {
                    inventory.AvailableQuantity = product.StockQuantity;
                    inventory.LastUpdated = DateTime.UtcNow;
                    await _inventoryRepository.UpdateAsync(inventory);
                }
            }

            order.TotalAmount = totalAmount;
            await _orderRepository.AddAsync(order);
            await _orderRepository.SaveChangesAsync();

            // Clear cart
            await _cartRepository.ClearCartAsync(cart.Id);
            await _cartRepository.SaveChangesAsync();

            _logger.LogInformation("Order {OrderId} created for user {UserId} with amount {Amount}", order.Id, userId, totalAmount);

            return MapToDto(order);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating order for user {UserId}", userId);
            throw;
        }
    }

    private OrderDto MapToDto(Order order)
    {
        return new OrderDto
        {
            Id = order.Id,
            Status = order.Status,
            TotalAmount = order.TotalAmount,
            CreatedAt = order.CreatedAt,
            Items = order.Items.Select(i => new OrderItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.Product.Name,
                Quantity = i.Quantity,
                Price = i.Price,
                Subtotal = i.Subtotal
            }).ToList()
        };
    }
}
