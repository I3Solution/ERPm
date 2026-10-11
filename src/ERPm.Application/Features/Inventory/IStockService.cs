using ERPm.Application.DTOs.Inventory;

namespace ERPm.Application.Features.Inventory;

public interface IStockService
{
    Task<List<WarehouseDto>> GetWarehousesAsync(CancellationToken cancellationToken = default);
    Task<List<StockBalanceDto>> GetStockBalancesAsync(Guid? warehouseId, CancellationToken cancellationToken = default);
    Task<bool> CreateStockReceiptAsync(CreateStockReceiptRequest request, CancellationToken cancellationToken = default);
}
