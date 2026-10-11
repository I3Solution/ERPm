using ERPm.Application.Common.Interfaces;
using ERPm.Application.Features.Catalog;
using ERPm.Application.Features.Dashboard;
using ERPm.Application.Features.Inventory;
using ERPm.Application.Features.Localization;
using ERPm.Application.Features.Partner;
using ERPm.Application.Features.Sales;
using ERPm.Infrastructure.Persistence;
using ERPm.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ERPm.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(connectionString, npgsqlOptions =>
            {
                npgsqlOptions.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName);
                npgsqlOptions.EnableRetryOnFailure(3);
            }));

        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());

        // Register All Domain & Feature Services
        services.AddScoped<ILocalizationService, LocalizationService>();
        services.AddScoped<IItemService, ItemService>();
        services.AddScoped<IStockService, StockService>();
        services.AddScoped<ISalesInvoiceService, SalesInvoiceService>();
        services.AddScoped<IPartnerService, PartnerService>();
        services.AddScoped<IDashboardService, DashboardService>();

        return services;
    }
}
