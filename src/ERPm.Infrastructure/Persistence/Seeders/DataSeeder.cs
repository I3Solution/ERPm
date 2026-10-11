using ERPm.Domain.Entities.Accounting;
using ERPm.Domain.Entities.Catalog;
using ERPm.Domain.Entities.Inventory;
using ERPm.Domain.Entities.Localization;
using ERPm.Domain.Entities.Partner;
using Microsoft.EntityFrameworkCore;

namespace ERPm.Infrastructure.Persistence.Seeders;

public static class DataSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        // 1. Seed Languages
        if (!await context.AppLanguages.AnyAsync())
        {
            var languages = new List<AppLanguage>
            {
                new() { Id = "vi", Code = "vi", Name = "Tiếng Việt", FlagIcon = "flag-vn", IsDefault = true, IsActive = true, SortOrder = 1 },
                new() { Id = "en", Code = "en", Name = "English", FlagIcon = "flag-us", IsDefault = false, IsActive = true, SortOrder = 2 }
            };
            await context.AppLanguages.AddRangeAsync(languages);
            await context.SaveChangesAsync();
        }

        // 2. Seed Dictionary Keys
        if (!await context.AppDictionaries.AnyAsync())
        {
            var dictionaries = new List<AppDictionary>
            {
                // Common
                new() { LanguageCode = "vi", Category = "COMMON", Key = "common.app_name", Value = "ERPm - Quản trị Bán hàng & Tồn kho" },
                new() { LanguageCode = "en", Category = "COMMON", Key = "common.app_name", Value = "ERPm - Sales & Inventory Management" },
                new() { LanguageCode = "vi", Category = "COMMON", Key = "common.save", Value = "Lưu lại" },
                new() { LanguageCode = "en", Category = "COMMON", Key = "common.save", Value = "Save" },
                new() { LanguageCode = "vi", Category = "COMMON", Key = "common.cancel", Value = "Hủy bỏ" },
                new() { LanguageCode = "en", Category = "COMMON", Key = "common.cancel", Value = "Cancel" },
                new() { LanguageCode = "vi", Category = "COMMON", Key = "common.search", Value = "Tìm kiếm..." },
                new() { LanguageCode = "en", Category = "COMMON", Key = "common.search", Value = "Search..." },
                new() { LanguageCode = "vi", Category = "COMMON", Key = "common.create", Value = "Thêm mới" },
                new() { LanguageCode = "en", Category = "COMMON", Key = "common.create", Value = "Create New" },

                // Menu
                new() { LanguageCode = "vi", Category = "MENU", Key = "menu.dashboard", Value = "Tổng quan" },
                new() { LanguageCode = "en", Category = "MENU", Key = "menu.dashboard", Value = "Dashboard" },
                new() { LanguageCode = "vi", Category = "MENU", Key = "menu.catalog", Value = "Sản phẩm (ITEM)" },
                new() { LanguageCode = "en", Category = "MENU", Key = "menu.catalog", Value = "Items & Catalog" },
                new() { LanguageCode = "vi", Category = "MENU", Key = "menu.inventory", Value = "Kho hàng" },
                new() { LanguageCode = "en", Category = "MENU", Key = "menu.inventory", Value = "Inventory" },
                new() { LanguageCode = "vi", Category = "MENU", Key = "menu.sales", Value = "Bán hàng (POS)" },
                new() { LanguageCode = "en", Category = "MENU", Key = "menu.sales", Value = "Sales & POS" },
                new() { LanguageCode = "vi", Category = "MENU", Key = "menu.partners", Value = "Khách hàng & Đối tác" },
                new() { LanguageCode = "en", Category = "MENU", Key = "menu.partners", Value = "Partners & Customers" },
                new() { LanguageCode = "vi", Category = "MENU", Key = "menu.accounting", Value = "Kế toán tài chính" },
                new() { LanguageCode = "en", Category = "MENU", Key = "menu.accounting", Value = "Accounting" },

                // Catalog fields
                new() { LanguageCode = "vi", Category = "CATALOG", Key = "catalog.item_code", Value = "Mã SKU" },
                new() { LanguageCode = "en", Category = "CATALOG", Key = "catalog.item_code", Value = "SKU Code" },
                new() { LanguageCode = "vi", Category = "CATALOG", Key = "catalog.barcode", Value = "Mã vạch / QR" },
                new() { LanguageCode = "en", Category = "CATALOG", Key = "catalog.barcode", Value = "Barcode / QR" },
                new() { LanguageCode = "vi", Category = "CATALOG", Key = "catalog.item_name", Value = "Tên sản phẩm" },
                new() { LanguageCode = "en", Category = "CATALOG", Key = "catalog.item_name", Value = "Item Name" },
                new() { LanguageCode = "vi", Category = "CATALOG", Key = "catalog.sale_price", Value = "Giá bán" },
                new() { LanguageCode = "en", Category = "CATALOG", Key = "catalog.sale_price", Value = "Sale Price" },
                new() { LanguageCode = "vi", Category = "CATALOG", Key = "catalog.cost_price", Value = "Giá vốn" },
                new() { LanguageCode = "en", Category = "CATALOG", Key = "catalog.cost_price", Value = "Cost Price" }
            };
            await context.AppDictionaries.AddRangeAsync(dictionaries);
            await context.SaveChangesAsync();
        }

        // 3. Seed Warehouse
        var defaultWarehouse = await context.Warehouses.FirstOrDefaultAsync(w => w.Code == "KHO01");
        if (defaultWarehouse == null)
        {
            defaultWarehouse = new Warehouse
            {
                Code = "KHO01",
                Name = "Kho Tổng Trung Tâm",
                Translations = new() { ["vi"] = "Kho Tổng Trung Tâm", ["en"] = "Main Central Warehouse" },
                Address = "Hà Nội, Việt Nam",
                IsDefault = true,
                IsActive = true
            };
            await context.Warehouses.AddAsync(defaultWarehouse);
            await context.SaveChangesAsync();
        }

        // 4. Seed Units of Measure
        var uomCai = await context.UnitsOfMeasure.FirstOrDefaultAsync(u => u.Code == "CAI");
        if (uomCai == null)
        {
            uomCai = new UnitOfMeasure { Code = "CAI", Name = "Cái", Translations = new() { ["vi"] = "Cái", ["en"] = "Piece" } };
            var uomHop = new UnitOfMeasure { Code = "HOP", Name = "Hộp", Translations = new() { ["vi"] = "Hộp", ["en"] = "Box" } };
            var uomKg = new UnitOfMeasure { Code = "KG", Name = "Kg", Translations = new() { ["vi"] = "Kilogram", ["en"] = "Kilogram" } };
            await context.UnitsOfMeasure.AddRangeAsync([uomCai, uomHop, uomKg]);
            await context.SaveChangesAsync();
        }

        // 5. Seed Partners (Customer & Supplier)
        if (!await context.Partners.AnyAsync())
        {
            var partners = new List<Partner>
            {
                new() { Code = "KH0001", Name = "Công ty TNHH Minh Khang", PartnerType = PartnerType.Customer, Phone = "0912345678", Email = "contact@minhkhang.vn", TaxCode = "0102030405", CreditLimit = 20000000m, DebtBalance = 4500000m },
                new() { Code = "KH0002", Name = "Khách Hàng Lẻ Vãng Lai", PartnerType = PartnerType.Customer, Phone = "0988888888", CreditLimit = 0m, DebtBalance = 0m },
                new() { Code = "NCC0001", Name = "Tập Đoàn Văn Phòng Phẩm Á Châu", PartnerType = PartnerType.Supplier, Phone = "0243888999", Email = "supplier@achau.vn", TaxCode = "0304050607", CreditLimit = 50000000m, DebtBalance = -12000000m }
            };
            await context.Partners.AddRangeAsync(partners);
            await context.SaveChangesAsync();
        }

        // 6. Seed Items & Stock Balances
        if (!await context.Items.AnyAsync())
        {
            var item1 = new Item
            {
                Code = "SP0001",
                Barcode = "8935001812345",
                Name = "Bút bi Thiên Long 0.5mm",
                Translations = new() { ["vi"] = "Bút bi Thiên Long 0.5mm", ["en"] = "Thien Long Ballpoint Pen 0.5mm" },
                ItemType = ItemType.Goods,
                BaseUomId = uomCai.Id,
                SalePrice = 5000m,
                CostPrice = 3200m,
                MinStockAlert = 20m,
                MaxStockAlert = 500m,
                IsActive = true
            };

            var item2 = new Item
            {
                Code = "SP0002",
                Barcode = "8936002934567",
                Name = "Giấy in Double A A4 70gsm",
                Translations = new() { ["vi"] = "Giấy in Double A A4 70gsm", ["en"] = "Double A Paper A4 70gsm" },
                ItemType = ItemType.Goods,
                BaseUomId = uomCai.Id,
                SalePrice = 78000m,
                CostPrice = 62000m,
                MinStockAlert = 10m,
                MaxStockAlert = 200m,
                IsActive = true
            };

            var item3 = new Item
            {
                Code = "DV0001",
                Barcode = "",
                Name = "Dịch vụ giao hàng tận nơi",
                Translations = new() { ["vi"] = "Dịch vụ giao hàng tận nơi", ["en"] = "Door-to-door Delivery Service" },
                ItemType = ItemType.Service,
                BaseUomId = uomCai.Id,
                SalePrice = 30000m,
                CostPrice = 0m,
                MinStockAlert = 0m,
                MaxStockAlert = 0m,
                IsActive = true
            };

            await context.Items.AddRangeAsync([item1, item2, item3]);
            await context.SaveChangesAsync();

            // Seed initial StockBalance
            var balance1 = new StockBalance { WarehouseId = defaultWarehouse.Id, ItemId = item1.Id, QuantityOnHand = 150m, AverageCostPrice = 3200m };
            var balance2 = new StockBalance { WarehouseId = defaultWarehouse.Id, ItemId = item2.Id, QuantityOnHand = 45m, AverageCostPrice = 62000m };
            await context.StockBalances.AddRangeAsync([balance1, balance2]);
            await context.SaveChangesAsync();
        }

        // 7. Seed Standard Chart of Accounts (TT200/133)
        if (!await context.Accounts.AnyAsync())
        {
            var accounts = new List<Account>
            {
                new() { Code = "111", Name = "Tiền mặt", AccountType = AccountType.Asset, Translations = new() { ["vi"] = "Tiền mặt", ["en"] = "Cash on Hand" } },
                new() { Code = "112", Name = "Tiền gửi ngân hàng", AccountType = AccountType.Asset, Translations = new() { ["vi"] = "Tiền gửi ngân hàng", ["en"] = "Cash in Bank" } },
                new() { Code = "131", Name = "Phải thu của khách hàng", AccountType = AccountType.Asset, Translations = new() { ["vi"] = "Phải thu của khách hàng", ["en"] = "Accounts Receivable" } },
                new() { Code = "156", Name = "Hàng hóa", AccountType = AccountType.Asset, Translations = new() { ["vi"] = "Hàng hóa", ["en"] = "Merchandise Inventory" } },
                new() { Code = "331", Name = "Phải trả cho người bán", AccountType = AccountType.Liability, Translations = new() { ["vi"] = "Phải trả cho người bán", ["en"] = "Accounts Payable" } },
                new() { Code = "511", Name = "Doanh thu bán hàng", AccountType = AccountType.Revenue, Translations = new() { ["vi"] = "Doanh thu bán hàng", ["en"] = "Sales Revenue" } },
                new() { Code = "632", Name = "Giá vốn hàng bán", AccountType = AccountType.Expense, Translations = new() { ["vi"] = "Giá vốn hàng bán", ["en"] = "Cost of Goods Sold" } },
                new() { Code = "642", Name = "Chi phí quản lý doanh nghiệp", AccountType = AccountType.Expense, Translations = new() { ["vi"] = "Chi phí quản lý doanh nghiệp", ["en"] = "General & Admin Expenses" } },
                new() { Code = "911", Name = "Xác định kết quả kinh doanh", AccountType = AccountType.Equity, Translations = new() { ["vi"] = "Xác định kết quả kinh doanh", ["en"] = "Income Summary" } }
            };
            await context.Accounts.AddRangeAsync(accounts);
            await context.SaveChangesAsync();
        }
    }
}
