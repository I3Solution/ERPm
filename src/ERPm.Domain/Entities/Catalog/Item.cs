using ERPm.Domain.Common;

namespace ERPm.Domain.Entities.Catalog;

public class Item : BaseAuditableEntity
{
    public string Code { get; set; } = string.Empty;       // SKU (vd: SP0001)
    public string? Barcode { get; set; }                   // Mã vạch / QR (vd: 8935001812345)
    public string Name { get; set; } = string.Empty;       // Tên sản phẩm chính
    public Dictionary<string, string> Translations { get; set; } = new(); // {"vi": "...", "en": "..."}

    public ItemType ItemType { get; set; } = ItemType.Goods;

    public Guid? CategoryId { get; set; }
    public Guid BaseUomId { get; set; }

    // Giá & Định mức tồn (Bắt buộc decimal(18, 4) theo quy chuẩn kế toán)
    public decimal SalePrice { get; set; } = 0m;
    public decimal CostPrice { get; set; } = 0m;
    public decimal MinStockAlert { get; set; } = 0m;
    public decimal MaxStockAlert { get; set; } = 0m;

    public string? ImageUrl { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public virtual Category? Category { get; set; }
    public virtual UnitOfMeasure? BaseUom { get; set; }
}
