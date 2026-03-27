namespace AuthAPI.Models;

public class Order
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Completed, Cancelled
    public decimal TotalAmount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}

public class OrderItem
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; } // Price per unit at time of order
    public decimal Subtotal { get; set; } // Quantity * Price

    // Navigation
    public Order Order { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
