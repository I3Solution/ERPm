using ERPm.Application.DTOs.Dashboard;

namespace ERPm.Application.Features.Dashboard;

public interface IDashboardService
{
    Task<DashboardMetricsDto> GetMetricsAsync(CancellationToken cancellationToken = default);
}
