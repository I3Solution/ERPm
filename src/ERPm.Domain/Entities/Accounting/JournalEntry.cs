using ERPm.Domain.Common;

namespace ERPm.Domain.Entities.Accounting;

public class JournalEntry : BaseAuditableEntity
{
    public string VoucherNumber { get; set; } = string.Empty; // Số chứng từ ghi sổ (vd: PKT00001, HD00001)
    public string VoucherType { get; set; } = string.Empty;   // SALES_INVOICE, STOCK_ISSUE, PAYMENT, RECEIPT
    public DateTime DocDate { get; set; } = DateTime.UtcNow;  // Ngày chứng từ
    public DateTime PostingDate { get; set; } = DateTime.UtcNow; // Ngày ghi sổ

    public string? Description { get; set; }                  // Diễn giải chung
    public VoucherStatus Status { get; set; } = VoucherStatus.Draft;

    public Guid? ReferenceId { get; set; }                    // ID của chứng từ gốc (vd: SalesInvoiceId)

    // Bút toán chi tiết (Debit / Credit)
    public virtual ICollection<JournalEntryLine> Lines { get; set; } = new List<JournalEntryLine>();
}
