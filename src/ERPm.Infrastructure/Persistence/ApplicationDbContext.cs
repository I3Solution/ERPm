using System.Text.Json;
using ERPm.Application.Common.Interfaces;
using ERPm.Domain.Common;
using ERPm.Domain.Entities.Accounting;
using ERPm.Domain.Entities.Catalog;
using ERPm.Domain.Entities.Inventory;
using ERPm.Domain.Entities.Localization;
using ERPm.Domain.Entities.Partner;
using ERPm.Domain.Entities.Sales;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace ERPm.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<AppLanguage> AppLanguages => Set<AppLanguage>();
    public DbSet<AppDictionary> AppDictionaries => Set<AppDictionary>();
    public DbSet<UnitOfMeasure> UnitsOfMeasure => Set<UnitOfMeasure>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Item> Items => Set<Item>();
    public DbSet<Partner> Partners => Set<Partner>();
    public DbSet<Warehouse> Warehouses => Set<Warehouse>();
    public DbSet<StockBalance> StockBalances => Set<StockBalance>();
    public DbSet<StockReceipt> StockReceipts => Set<StockReceipt>();
    public DbSet<StockReceiptItem> StockReceiptItems => Set<StockReceiptItem>();
    public DbSet<StockIssue> StockIssues => Set<StockIssue>();
    public DbSet<StockIssueItem> StockIssueItems => Set<StockIssueItem>();
    public DbSet<SalesInvoice> SalesInvoices => Set<SalesInvoice>();
    public DbSet<SalesInvoiceItem> SalesInvoiceItems => Set<SalesInvoiceItem>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<JournalEntry> JournalEntries => Set<JournalEntry>();
    public DbSet<JournalEntryLine> JournalEntryLines => Set<JournalEntryLine>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        var dictionaryComparer = new ValueComparer<Dictionary<string, string>>(
            (c1, c2) => c1 != null && c2 != null && c1.SequenceEqual(c2),
            c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.Key.GetHashCode(), v.Value.GetHashCode())),
            c => new Dictionary<string, string>(c));

        // 1. Localization
        modelBuilder.Entity<AppLanguage>(entity =>
        {
            entity.ToTable("app_languages");
            entity.HasKey(e => e.Code);
            entity.Ignore(e => e.Id);
            entity.Property(e => e.Code).HasMaxLength(10);
            entity.Property(e => e.Name).HasMaxLength(50).IsRequired();
            entity.Property(e => e.FlagIcon).HasMaxLength(50);
        });

        modelBuilder.Entity<AppDictionary>(entity =>
        {
            entity.ToTable("app_dictionaries");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.LanguageCode).HasMaxLength(10).IsRequired();
            entity.Property(e => e.Category).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Key).HasMaxLength(150).IsRequired();
            entity.Property(e => e.Value).IsRequired();

            entity.HasOne(e => e.Language)
                .WithMany(l => l.Dictionaries)
                .HasForeignKey(e => e.LanguageCode)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => new { e.LanguageCode, e.Key }).IsUnique();
        });

        // 2. Catalog / ITEM
        modelBuilder.Entity<UnitOfMeasure>(entity =>
        {
            entity.ToTable("units_of_measure");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).HasMaxLength(20).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Translations)
                .HasColumnType("jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, (JsonSerializerOptions?)null) ?? new Dictionary<string, string>())
                .Metadata.SetValueComparer(dictionaryComparer);

            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.ToTable("categories");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Translations)
                .HasColumnType("jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, (JsonSerializerOptions?)null) ?? new Dictionary<string, string>())
                .Metadata.SetValueComparer(dictionaryComparer);

            entity.HasOne(e => e.Parent)
                .WithMany(e => e.Children)
                .HasForeignKey(e => e.ParentId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        modelBuilder.Entity<Item>(entity =>
        {
            entity.ToTable("items");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Barcode).HasMaxLength(100);
            entity.Property(e => e.Name).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Translations)
                .HasColumnType("jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, (JsonSerializerOptions?)null) ?? new Dictionary<string, string>())
                .Metadata.SetValueComparer(dictionaryComparer);

            entity.Property(e => e.SalePrice).HasPrecision(18, 4);
            entity.Property(e => e.CostPrice).HasPrecision(18, 4);
            entity.Property(e => e.MinStockAlert).HasPrecision(18, 4);
            entity.Property(e => e.MaxStockAlert).HasPrecision(18, 4);

            entity.HasOne(e => e.Category)
                .WithMany(c => c.Items)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.BaseUom)
                .WithMany(u => u.Items)
                .HasForeignKey(e => e.BaseUomId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasIndex(e => e.Barcode);
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        // 3. Partner
        modelBuilder.Entity<Partner>(entity =>
        {
            entity.ToTable("partners");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Phone).HasMaxLength(50);
            entity.Property(e => e.Email).HasMaxLength(100);
            entity.Property(e => e.TaxCode).HasMaxLength(50);

            entity.Property(e => e.CreditLimit).HasPrecision(18, 4);
            entity.Property(e => e.DebtBalance).HasPrecision(18, 4);

            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        // 4. Inventory
        modelBuilder.Entity<Warehouse>(entity =>
        {
            entity.ToTable("warehouses");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Translations)
                .HasColumnType("jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, (JsonSerializerOptions?)null) ?? new Dictionary<string, string>())
                .Metadata.SetValueComparer(dictionaryComparer);

            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        modelBuilder.Entity<StockBalance>(entity =>
        {
            entity.ToTable("stock_balances");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.QuantityOnHand).HasPrecision(18, 4);
            entity.Property(e => e.AverageCostPrice).HasPrecision(18, 4);

            entity.HasOne(e => e.Warehouse)
                .WithMany()
                .HasForeignKey(e => e.WarehouseId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Item)
                .WithMany()
                .HasForeignKey(e => e.ItemId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => new { e.WarehouseId, e.ItemId }).IsUnique();
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        modelBuilder.Entity<StockReceipt>(entity =>
        {
            entity.ToTable("stock_receipts");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
            entity.Property(e => e.TotalAmount).HasPrecision(18, 4);

            entity.HasOne(e => e.Warehouse)
                .WithMany()
                .HasForeignKey(e => e.WarehouseId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Supplier)
                .WithMany()
                .HasForeignKey(e => e.SupplierId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        modelBuilder.Entity<StockReceiptItem>(entity =>
        {
            entity.ToTable("stock_receipt_items");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Quantity).HasPrecision(18, 4);
            entity.Property(e => e.UnitPrice).HasPrecision(18, 4);
            entity.Property(e => e.Amount).HasPrecision(18, 4);

            entity.HasOne(e => e.StockReceipt)
                .WithMany(r => r.Items)
                .HasForeignKey(e => e.StockReceiptId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Item)
                .WithMany()
                .HasForeignKey(e => e.ItemId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<StockIssue>(entity =>
        {
            entity.ToTable("stock_issues");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
            entity.Property(e => e.TotalCostAmount).HasPrecision(18, 4);

            entity.HasOne(e => e.Warehouse)
                .WithMany()
                .HasForeignKey(e => e.WarehouseId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Customer)
                .WithMany()
                .HasForeignKey(e => e.CustomerId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        modelBuilder.Entity<StockIssueItem>(entity =>
        {
            entity.ToTable("stock_issue_items");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Quantity).HasPrecision(18, 4);
            entity.Property(e => e.UnitCost).HasPrecision(18, 4);
            entity.Property(e => e.TotalCost).HasPrecision(18, 4);

            entity.HasOne(e => e.StockIssue)
                .WithMany(i => i.Items)
                .HasForeignKey(e => e.StockIssueId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Item)
                .WithMany()
                .HasForeignKey(e => e.ItemId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // 5. Sales & Invoicing
        modelBuilder.Entity<SalesInvoice>(entity =>
        {
            entity.ToTable("sales_invoices");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.InvoiceNumber).HasMaxLength(50).IsRequired();
            entity.Property(e => e.CustomerName).HasMaxLength(255).IsRequired();

            entity.Property(e => e.SubTotal).HasPrecision(18, 4);
            entity.Property(e => e.DiscountAmount).HasPrecision(18, 4);
            entity.Property(e => e.TaxAmount).HasPrecision(18, 4);
            entity.Property(e => e.TotalAmount).HasPrecision(18, 4);
            entity.Property(e => e.PaidAmount).HasPrecision(18, 4);
            entity.Property(e => e.RemainingDebt).HasPrecision(18, 4);

            entity.HasOne(e => e.Customer)
                .WithMany()
                .HasForeignKey(e => e.CustomerId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Warehouse)
                .WithMany()
                .HasForeignKey(e => e.WarehouseId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.JournalEntry)
                .WithMany()
                .HasForeignKey(e => e.JournalEntryId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.StockIssue)
                .WithMany()
                .HasForeignKey(e => e.StockIssueId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => e.InvoiceNumber).IsUnique();
            entity.HasIndex(e => e.InvoiceDate);
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        modelBuilder.Entity<SalesInvoiceItem>(entity =>
        {
            entity.ToTable("sales_invoice_items");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Quantity).HasPrecision(18, 4);
            entity.Property(e => e.UnitPrice).HasPrecision(18, 4);
            entity.Property(e => e.DiscountPercent).HasPrecision(18, 4);
            entity.Property(e => e.Amount).HasPrecision(18, 4);
            entity.Property(e => e.CostPrice).HasPrecision(18, 4);

            entity.HasOne(e => e.SalesInvoice)
                .WithMany(i => i.Items)
                .HasForeignKey(e => e.SalesInvoiceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Item)
                .WithMany()
                .HasForeignKey(e => e.ItemId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // 6. Accounting Foundation
        modelBuilder.Entity<Account>(entity =>
        {
            entity.ToTable("accounts");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Translations)
                .HasColumnType("jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, (JsonSerializerOptions?)null) ?? new Dictionary<string, string>())
                .Metadata.SetValueComparer(dictionaryComparer);

            entity.HasOne(e => e.Parent)
                .WithMany(e => e.Children)
                .HasForeignKey(e => e.ParentId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        modelBuilder.Entity<JournalEntry>(entity =>
        {
            entity.ToTable("journal_entries");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.VoucherNumber).HasMaxLength(50).IsRequired();
            entity.Property(e => e.VoucherType).HasMaxLength(50).IsRequired();

            entity.HasIndex(e => e.VoucherNumber).IsUnique();
            entity.HasIndex(e => e.PostingDate);
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        modelBuilder.Entity<JournalEntryLine>(entity =>
        {
            entity.ToTable("journal_entry_lines");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.DebitAmount).HasPrecision(18, 4);
            entity.Property(e => e.CreditAmount).HasPrecision(18, 4);

            entity.HasOne(e => e.JournalEntry)
                .WithMany(j => j.Lines)
                .HasForeignKey(e => e.JournalEntryId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Account)
                .WithMany()
                .HasForeignKey(e => e.AccountId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Partner)
                .WithMany()
                .HasForeignKey(e => e.PartnerId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker.Entries<IAuditable>();
        var now = DateTime.UtcNow;

        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAtUtc = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.LastModifiedAtUtc = now;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
