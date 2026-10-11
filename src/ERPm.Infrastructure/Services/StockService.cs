using ERPm.Application.Common.Interfaces;
using ERPm.Application.DTOs.Inventory;
using ERPm.Application.Features.Inventory;
using ERPm.Domain.Entities.Accounting;
using ERPm.Domain.Entities.Inventory;
using Microsoft.EntityFrameworkCore;

namespace ERPm.Infrastructure.Services;

public class StockService : IStockService
{
    private readonly IApplicationDbContext _context;

    public StockService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<WarehouseDto>> GetWarehousesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Warehouses
            .Where(w => w.IsActive)
            .OrderByDescending(w => w.IsDefault)
            .Select(w => new WarehouseDto
            {
                Id = w.Id,
                Code = w.Code,
                Name = w.Name,
                Translations = w.Translations,
                Address = w.Address,
                IsDefault = w.IsDefault
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<List<StockBalanceDto>> GetStockBalancesAsync(Guid? warehouseId, CancellationToken cancellationToken = default)
    {
        var query = _context.StockBalances
            .Include(b => b.Warehouse)
            .Include(b => b.Item)
                .ThenInclude(i => i!.BaseUom)
            .AsNoTracking();

        if (warehouseId.HasValue)
        {
            query = query.Where(b => b.WarehouseId == warehouseId.Value);
        }

        return await query
            .OrderBy(b => b.Item!.Code)
            .Select(b => new StockBalanceDto
            {
                WarehouseId = b.WarehouseId,
                WarehouseName = b.Warehouse != null ? b.Warehouse.Name : string.Empty,
                ItemId = b.ItemId,
                ItemCode = b.Item != null ? b.Item.Code : string.Empty,
                ItemName = b.Item != null ? b.Item.Name : string.Empty,
                Barcode = b.Item != null ? b.Item.Barcode : null,
                UomName = b.Item != null && b.Item.BaseUom != null ? b.Item.BaseUom.Name : "Cái",
                QuantityOnHand = b.QuantityOnHand,
                AverageCostPrice = b.AverageCostPrice,
                IsLowStock = b.Item != null && b.QuantityOnHand <= b.Item.MinStockAlert
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> CreateStockReceiptAsync(CreateStockReceiptRequest request, CancellationToken cancellationToken = default)
    {
        if (request.Items.Count == 0) return false;

        var count = await _context.StockReceipts.CountAsync(cancellationToken);
        var code = $"PNK{count + 1:D5}";

        var receipt = new StockReceipt
        {
            Code = code,
            ReceiptDate = DateTime.UtcNow,
            WarehouseId = request.WarehouseId,
            SupplierId = request.SupplierId,
            Status = VoucherStatus.Posted,
            Notes = request.Notes
        };

        decimal totalAmount = 0;

        foreach (var itemReq in request.Items)
        {
            var amount = itemReq.Quantity * itemReq.UnitPrice;
            totalAmount += amount;

            receipt.Items.Add(new StockReceiptItem
            {
                ItemId = itemReq.ItemId,
                Quantity = itemReq.Quantity,
                UnitPrice = itemReq.UnitPrice,
                Amount = amount
            });

            // Update or create StockBalance
            var balance = await _context.StockBalances
                .FirstOrDefaultAsync(b => b.WarehouseId == request.WarehouseId && b.ItemId == itemReq.ItemId, cancellationToken);

            if (balance != null)
            {
                var newQty = balance.QuantityOnHand + itemReq.Quantity;
                if (newQty > 0)
                {
                    // Weighted average cost
                    balance.AverageCostPrice = ((balance.QuantityOnHand * balance.AverageCostPrice) + amount) / newQty;
                }
                balance.QuantityOnHand = newQty;
            }
            else
            {
                balance = new StockBalance
                {
                    WarehouseId = request.WarehouseId,
                    ItemId = itemReq.ItemId,
                    QuantityOnHand = itemReq.Quantity,
                    AverageCostPrice = itemReq.UnitPrice
                };
                await _context.StockBalances.AddAsync(balance, cancellationToken);
            }
        }

        receipt.TotalAmount = totalAmount;
        await _context.StockReceipts.AddAsync(receipt, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
