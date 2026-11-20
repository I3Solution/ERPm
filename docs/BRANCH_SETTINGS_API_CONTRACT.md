# Branch Settings API contract · Step 27

Phiên bản đặc tả v1, ngày 2026-11-21. [Nghiệp vụ, DB và FE](../.ai/plans/plan-step-27-branch-settings.md)

## 1. Quy ước chung

- API dùng JSON camelCase, bearer token và envelope `ApiResponse<T>` hiện có gồm `success`, `data`, `message`, `errorCode`, `errors`. Các route bên dưới là contract triển khai.
- `branchId` là ID dương của đơn vị Company hoặc Branch đang hoạt động. `settingKey` tối đa 96 ký tự, có ít nhất hai đoạn phân cách bằng dấu chấm, ví dụ `delivery.cutoff_time`. Mỗi đoạn bắt đầu bằng chữ thường và chỉ gồm chữ thường ASCII, số và gạch dưới. Key phân biệt rõ với nhãn hiển thị.
- Mỗi cấu hình scalar có hai trạng thái tại chỗ là `inherit` và `override`. Với `inherit` cấm gửi thuộc tính `value`. Với `override` bắt buộc gửi `value` đúng kiểu, và `null` là không hợp lệ.
- Kiểu dữ liệu nhận qua contract này được xác định từ định nghĩa key.

| `valueType` | Dữ liệu JSON | Kiểm tra |
| --- | --- | --- |
| `boolean` | Boolean | Nhận `true` và `false`. |
| `integer` | Number nguyên an toàn cho JavaScript | Range `min/max` nếu khai báo. |
| `decimal` | Chuỗi thập phân, ví dụ `"10000.2500"` | Tối đa precision 18, scale 4. Dấu chấm cố định, không exponent. Range dùng cùng định dạng. |
| `time` | Chuỗi `HH:mm` | Giờ địa phương 24h, từ `00:00` đến `23:59`. |
| `string` | Chuỗi | `maxLength` và `allowEmpty`. |
| `choice` | Chuỗi mã ổn định | Nằm trong `constraints.options[].value`. |

## 2. Định nghĩa key

| Method và path | Quyền | Kết quả |
| --- | --- | --- |
| `GET /api/v1/sys/branch-setting-definitions` | `sys:branch-setting:view` | `200`, danh mục định nghĩa đang hiệu lực mà tài khoản được phép đọc. Có bộ lọc `group` tùy chọn. |
| `POST /api/v1/sys/branch-setting-definitions` | `sys:branch-setting:manage_definition` | `201`, định nghĩa scalar mới. Key trùng trả `409`. |

Ví dụ tạo key đơn giản

```json
{
  "key": "delivery.cutoff_time",
  "groupKey": "operations",
  "valueType": "time",
  "labels": { "vi": "Giờ chốt giao hàng", "en": "Delivery cutoff time" },
  "defaultValue": "16:00",
  "constraints": {},
  "sortOrder": 10
}
```

`labels.vi` và `labels.en` bắt buộc. Tùy chọn dạng choice có `{ value, labels: { vi, en } }`. Server từ chối constraint không tương ứng với kiểu giá trị, kiểm tra mặc định bằng cùng validator của override và trả `storageKind: "scalar"` cho key tạo qua API. Key module do backend đăng ký để phản hồi `storageKind: "module"` cùng `editorKey`. MVP cho tạo key mới, đọc định nghĩa và chỉnh override. Thay kiểu, đổi mã hoặc xóa định nghĩa đã sử dụng được xử lý bằng migration sau khi đánh giá ảnh hưởng.

## 3. Đọc, xem ảnh hưởng và ghi cấu hình

| Method và path | Quyền | Kết quả |
| --- | --- | --- |
| `GET /api/v1/sys/branches/{branchId}/settings` | `sys:branch-setting:view` | `200`, `{ items: SettingView[] }`. Có bộ lọc `group` tùy chọn. |
| `GET /api/v1/sys/branches/{branchId}/settings/{settingKey}` | `sys:branch-setting:view` | `200`, `SettingView`, kèm HTTP `ETag`. |
| `POST /api/v1/sys/branches/{branchId}/settings/{settingKey}/preview` | `sys:branch-setting:edit` | `200`, ảnh hưởng dự kiến, dùng request như PUT. Yêu cầu `If-Match`. |
| `PUT /api/v1/sys/branches/{branchId}/settings/{settingKey}` | `sys:branch-setting:edit` | `200`, `SettingView` sau lưu và HTTP `ETag` mới. Yêu cầu `If-Match`. |
| `GET /api/v1/sys/branches/{branchId}/settings/{settingKey}/history` | `sys:branch-setting:view` | `200`, `PagedResult<SettingHistoryItem>`, mới nhất trước. `pageIndex` bắt đầu từ 1, `pageSize` mặc định 20, tối đa 100. |

Ví dụ `GET` một key đang kế thừa

```json
{
  "success": true,
  "data": {
    "branchId": 12,
    "key": "delivery.cutoff_time",
    "storageKind": "scalar",
    "valueType": "time",
    "local": { "mode": "inherit" },
    "effective": {
      "status": "resolved",
      "value": "16:00",
      "source": { "kind": "ancestor", "branchId": 10, "branchName": "Công ty A" }
    },
    "canEdit": true,
    "etag": "\"bs-12-cutoff-v3\""
  }
}
```

`source.kind` là `local`, `ancestor`, `system_default` hoặc `module_fallback`. Với `local` và `ancestor`, chỉ trả ID và tên nguồn khi caller có quyền xem đơn vị nguồn. Với `system_default` và `module_fallback`, bỏ ID và tên nguồn. `effective.status` là `resolved` hoặc `invalid`. Khi `invalid`, bỏ `value`, trả `errorCode` trong `effective` và thông tin nguồn nếu được phép. Kế thừa một cấu hình lỗi vẫn cho phép mở trang để sửa.

Ví dụ ghi đè

```json
{
  "mode": "override",
  "value": "17:00",
  "reason": "Đổi giờ chốt của chi nhánh"
}
```

Ví dụ trở về kế thừa

```json
{
  "mode": "inherit",
  "reason": "Dùng lại giờ của công ty"
}
```

`reason` nếu có thì trim và tối đa 500 ký tự. Nhóm kho yêu cầu lý do khi lưu qua contract mới. Khi form còn mở, FE dùng token `etag` đúng dạng entity tag, ví dụ gửi header `If-Match: "bs-12-cutoff-v3"`. Backend thay token nếu local, nguồn hiệu lực hoặc tập ảnh hưởng của key trong cây thay đổi. Lưu đối chiếu token và kiểm lại quyền, ảnh hưởng và dữ liệu trong giao dịch.

Ví dụ `data` trả về khi xem ảnh hưởng

```json
{
  "blocked": false,
  "affectedBranchCount": 1,
  "changes": [
    {
      "branchId": 15,
      "branchName": "Điểm bán Hoàn Kiếm",
      "before": { "value": "16:00", "sourceKind": "ancestor" },
      "after": { "value": "17:00", "sourceKind": "ancestor" }
    }
  ],
  "blockers": []
}
```

`changes` xét các đơn vị con có thay đổi giá trị hoặc nguồn. `blockers` gồm `{ code, count? }`, ví dụ SO đang giữ tồn liên quan tới thao tác gỡ kho, chỉ trả dữ liệu caller được xem. Tác động ngoài phạm vi chỉnh trả `403` mà không đưa danh sách bên ngoài scope vào response. FE có thể xem trước rồi lưu với cùng token. Backend kiểm tra lại blocker tại thời điểm ghi và trả `409` nếu có nghiệp vụ mới phát sinh.

`SettingHistoryItem` gồm `branchId`, `key`, `previousLocal`, `newLocal`, `changedBy`, `changedAtUtc`, `reason`, `revision`. Hai trường local theo cùng quy ước mode và value. Lịch sử theo đơn vị ghi thay đổi, nên một chi nhánh xem được tác động kế thừa qua thông tin nguồn và mở lịch sử của cấp cha khi được cấp quyền.

## 4. Nhóm kho xuất SO lưu tại WMS

Key `wms.so_warehouse_policy` có `storageKind=module`. SYS đọc giá trị hiệu lực qua module để hiển thị ở tab Kho. Màn chỉnh gọi API WMS. Ghi trực tiếp key module bằng API scalar trả `409 error.branch_setting.module_managed`.

| Method và path | Kết quả |
| --- | --- |
| `GET /api/v1/stock/branches/{branchId}/serving-warehouses?includePolicy=true` | `200`, `SettingView` với `storageKind=module`, `editorKey=wms.so_warehouse_policy` và `ETag`. |
| `POST /api/v1/stock/branches/{branchId}/serving-warehouses/preview` | `200`, ảnh hưởng và blocker. Yêu cầu mode rõ ràng và `If-Match`. |
| `PUT /api/v1/stock/branches/{branchId}/serving-warehouses` | Với mode rõ ràng, bắt buộc `If-Match` và lý do. Trả `SettingView` và `ETag` mới. |

Nhóm quản trị WMS đọc với `sys:branch-setting:view` và `wms:stock:view`, ghi với `sys:branch-setting:edit` cùng quyền cấu hình kho phục vụ hiện có `sys:branch:edit`, trên đúng đơn vị. Luồng chọn kho SO giữ endpoint và quyền nghiệp vụ SD, dùng cùng resolver dưới service.

```json
{
  "mode": "fixed_list",
  "warehouses": [
    { "warehouseId": 1114, "isDefault": true },
    { "warehouseId": 1115, "isDefault": false }
  ],
  "reason": "Phân lại kho phục vụ SO"
}
```

WMS nhận `fixed_list`, `own_warehouses` và `inherit`. `fixed_list` cần 1–100 kho duy nhất cùng công ty, đang hoạt động và đúng một mặc định. Hai mode còn lại bỏ trường `warehouses`. Trong `SettingView.local.mode`, ghi `inherit` hoặc `override`. Nếu override, `local.value` chứa `{ mode: "fixed_list", warehouses: [...] }` hoặc `{ mode: "own_warehouses" }`. Giá trị hiệu lực gồm `warehouses` theo projection đang dùng và `defaultWarehouseId` nếu có. ID kho trong payload là ID entity Warehouse.

Nếu cấu hình danh sách chỉ định đã có kho không hợp lệ hoặc mất kho mặc định, trả `effective.status=invalid` cùng `error.sd.warehouse_not_serving`. Nếu đang dùng kho của chi nhánh và không có kho khả dụng, trả danh sách rỗng trong API đọc; luồng SO hàng hóa báo chưa có kho phục vụ khi cần giữ tồn.

**Tương thích chuyển tiếp.** GET cũ bỏ `includePolicy` vẫn trả mảng kho. PUT cũ bỏ `mode` giữ mảng trả về. Payload mảng có dòng tương đương `fixed_list`, mảng rỗng tương đương `own_warehouses`. Reset kế thừa gửi `mode=inherit` rõ ràng. Tất cả đường ghi dùng cùng quyền cấu hình, scope, guard bảo vệ tồn và audit. Trước khi triển khai, đối chiếu các vai trò đang chỉnh kho và cấp quyền mới cho đúng vai trò và scope được duyệt. Điều kiện `If-Match` áp cho client mới gửi mode rõ ràng.

## 5. Mã lỗi

| HTTP | Trường hợp | Ví dụ `errorCode` |
| --- | --- | --- |
| 400 | Key hoặc payload sai kiểu, mode không hợp lệ, mặc định không đạt schema | `error.branch_setting.invalid_value` |
| 401 | Thiếu hoặc hết phiên xác thực | Theo cơ chế xác thực hiện hành |
| 403 | Thiếu quyền tác vụ hoặc phạm vi thay đổi một đơn vị con không được cấp | `error.access.denied` |
| 404 | Đơn vị hoặc key không có trong phạm vi đọc | `error.branch_setting.not_found` |
| 409 | Trùng định nghĩa, ghi key module qua API scalar, kho có giữ tồn bị ảnh hưởng | `error.branch_setting.duplicate_key`, `error.branch_setting.module_managed`, `error.branch_setting.active_reservations` |
| 412 | `If-Match` cũ | `error.branch_setting.stale_revision` |
| 428 | Thiếu `If-Match` trên thao tác có yêu cầu | `error.branch_setting.revision_required` |

Các mã lỗi mới và text tĩnh của màn hình có dictionary VI/EN ở FE/BE. Hành vi nghiệp vụ lấy từ backend, kể cả khi caller gọi API trực tiếp.
