namespace AuthAPI.Models;

public class Inventory
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public int AvailableQuantity { get; set; }
    public int ReservedQuantity { get; set; } // Reserved by orders
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

    // Navigation
    public Product Product { get; set; } = null!;
}
