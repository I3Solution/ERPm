# 🏛️ ERPM - ENTERPRISE MULTI-REPOSITORY ARCHITECTURE

> **Tổ chức:** [I3Solution](https://github.com/I3Solution)  
> **Parent Umbrella Repository:** `https://github.com/I3Solution/ERPm.git`

Hệ thống **ERPm** (Quản trị Bán hàng, Tồn kho & Kế toán mở rộng) được phân rã thành mô hình **Multi-Repository & Git Submodule** cấp độ doanh nghiệp:

```text
ERPm (Parent Umbrella Orchestrator)
│
├── ERPm-BE (Backend .NET 8 Clean Architecture)
│   └── Remote: https://github.com/I3Solution/ERPm-BE.git
│
└── ERPm-FE (Frontend Angular 18 + Ionic 8 Hybrid)
    ├── Remote: https://github.com/I3Solution/ERPm-FE.git
    │
    └── Modules (Git Submodules bên trong FE):
        ├── catalog    -> https://github.com/I3Solution/ERPm-FE-catalog.git
        ├── dashboard  -> https://github.com/I3Solution/ERPm-FE-dashboard.git
        ├── inventory  -> https://github.com/I3Solution/ERPm-FE-inventory.git
        ├── partners   -> https://github.com/I3Solution/ERPm-FE-partners.git
        └── sales      -> https://github.com/I3Solution/ERPm-FE-sales.git
```

---

## 📌 QUẢN LÝ TIẾN ĐỘ & PHÁT TRIỂN ĐỘC LẬP
Mỗi dự án và submodule đều sở hữu hệ thống tài liệu và lộ trình phát triển độc lập:
1. **Backend ([ERPm-BE](file:///d:/WORKING%20PLACE/ERPm/ERPm-BE/)):**
   - Tài liệu kiến trúc: [ERPm-BE/PROJECT_MASTER.md](file:///d:/WORKING%20PLACE/ERPm/ERPm-BE/PROJECT_MASTER.md)
   - Chỉ dẫn AI: [ERPm-BE/AGENTS.md](file:///d:/WORKING%20PLACE/ERPm/ERPm-BE/AGENTS.md)
   - Lộ trình & Trạng thái: [ERPm-BE/.ai/roadmap.md](file:///d:/WORKING%20PLACE/ERPm/ERPm-BE/.ai/roadmap.md) & [status.md](file:///d:/WORKING%20PLACE/ERPm/ERPm-BE/.ai/status.md)
2. **Frontend ([ERPm-FE](file:///d:/WORKING%20PLACE/ERPm/ERPm-FE/)):**
   - Tài liệu kiến trúc: [ERPm-FE/PROJECT_MASTER.md](file:///d:/WORKING%20PLACE/ERPm/ERPm-FE/PROJECT_MASTER.md)
   - Chỉ dẫn AI: [ERPm-FE/AGENTS.md](file:///d:/WORKING%20PLACE/ERPm/ERPm-FE/AGENTS.md)
   - Lộ trình & Trạng thái: [ERPm-FE/.ai/roadmap.md](file:///d:/WORKING%20PLACE/ERPm/ERPm-FE/.ai/roadmap.md) & [status.md](file:///d:/WORKING%20PLACE/ERPm/ERPm-FE/.ai/status.md)
3. **Các Submodule FE:**
   - Mỗi submodule (`catalog`, `dashboard`, `inventory`, `partners`, `sales`) có folder `.ai/` riêng lưu `plan.md` (kế hoạch con từ task FE giao), `status.md` và `steps/`.

---

## 🚀 HƯỚNG DẪN CLONE TOÀN BỘ HỆ THỐNG
```bash
# Clone đệ quy toàn bộ umbrella repo và tất cả submodules (cả BE, FE và các FE module submodules)
git clone --recurse-submodules https://github.com/I3Solution/ERPm.git
```
