import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';

export interface BranchDto {
  id: string;
  code: string;
  name: string;
  parentId?: string | null;
  parentName?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  isDefault: boolean;
  isActive: boolean;
  children?: BranchDto[];
}

export interface CreateBranchRequest {
  code: string;
  name: string;
  parentId?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

// Special Global Scope Branch option (Toàn công ty / Tất cả chi nhánh)
export const ALL_BRANCHES_OPTION: BranchDto = {
  id: '00000000-0000-0000-0000-000000000000',
  code: 'ALL',
  name: '🌐 Toàn hệ thống (Tất cả chi nhánh)',
  isDefault: false,
  isActive: true,
  children: []
};

const MOCK_BRANCH_TREE: BranchDto[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    code: 'root',
    name: 'Tổng Công Ty (Tập đoàn)',
    address: 'Tòa nhà Keangnam, Hà Nội',
    isDefault: true,
    isActive: true,
    children: [
      {
        id: '00000000-0000-0000-0000-000000000010',
        code: 'KMB',
        name: 'Khối Miền Bắc',
        parentId: '00000000-0000-0000-0000-000000000001',
        isDefault: false,
        isActive: true,
        children: [
          {
            id: '00000000-0000-0000-0000-000000000011',
            code: 'CN-HN',
            name: 'Chi nhánh Hà Nội (HQ)',
            parentId: '00000000-0000-0000-0000-000000000010',
            address: 'Số 1 Phố Huế, Hoàn Kiếm',
            isDefault: false,
            isActive: true,
            children: [
              {
                id: '00000000-0000-0000-0000-000000000012',
                code: 'CH-HK',
                name: 'Cửa hàng Hoàn Kiếm',
                parentId: '00000000-0000-0000-0000-000000000011',
                address: 'Tràng Tiền, Hoàn Kiếm',
                isDefault: false,
                isActive: true,
                children: []
              },
              {
                id: '00000000-0000-0000-0000-000000000013',
                code: 'CH-CG',
                name: 'Cửa hàng Cầu Giấy',
                parentId: '00000000-0000-0000-0000-000000000011',
                address: 'Xuân Thủy, Cầu Giấy',
                isDefault: false,
                isActive: true,
                children: []
              }
            ]
          },
          {
            id: '00000000-0000-0000-0000-000000000014',
            code: 'CN-HP',
            name: 'Chi nhánh Hải Phòng',
            parentId: '00000000-0000-0000-0000-000000000010',
            address: 'Lê Hồng Phong, Hải Phòng',
            isDefault: false,
            isActive: true,
            children: []
          }
        ]
      },
      {
        id: '00000000-0000-0000-0000-000000000020',
        code: 'KMN',
        name: 'Khối Miền Nam',
        parentId: '00000000-0000-0000-0000-000000000001',
        isDefault: false,
        isActive: true,
        children: [
          {
            id: '00000000-0000-0000-0000-000000000021',
            code: 'CN-HCM',
            name: 'Chi nhánh TP. Hồ Chí Minh',
            parentId: '00000000-0000-0000-0000-000000000020',
            address: 'Nguyễn Huệ, Quận 1',
            isDefault: false,
            isActive: true,
            children: [
              {
                id: '00000000-0000-0000-0000-000000000022',
                code: 'CH-Q1',
                name: 'Cửa hàng Quận 1',
                parentId: '00000000-0000-0000-0000-000000000021',
                address: 'Lê Lợi, Quận 1',
                isDefault: false,
                isActive: true,
                children: []
              },
              {
                id: '00000000-0000-0000-0000-000000000023',
                code: 'CH-TD',
                name: 'Cửa hàng Thủ Đức',
                parentId: '00000000-0000-0000-0000-000000000021',
                address: 'Võ Văn Ngân, Thủ Đức',
                isDefault: false,
                isActive: true,
                children: []
              }
            ]
          },
          {
            id: '00000000-0000-0000-0000-000000000024',
            code: 'CN-CT',
            name: 'Chi nhánh Cần Thơ',
            parentId: '00000000-0000-0000-0000-000000000020',
            address: 'Ninh Kiều, Cần Thơ',
            isDefault: false,
            isActive: true,
            children: []
          }
        ]
      },
      {
        id: '00000000-0000-0000-0000-000000000030',
        code: 'KMT',
        name: 'Khối Miền Trung',
        parentId: '00000000-0000-0000-0000-000000000001',
        isDefault: false,
        isActive: true,
        children: [
          {
            id: '00000000-0000-0000-0000-000000000031',
            code: 'CN-DN',
            name: 'Chi nhánh Đà Nẵng',
            parentId: '00000000-0000-0000-0000-000000000030',
            address: 'Bạch Đằng, Đà Nẵng',
            isDefault: false,
            isActive: true,
            children: []
          }
        ]
      }
    ]
  }
];

@Injectable({
  providedIn: 'root'
})
export class BranchService {
  private readonly apiUrl = 'http://localhost:5000/api/v1/branches';
  private readonly STORAGE_KEY = 'erpm_selected_branch_id';

  public branches = signal<BranchDto[]>([]);
  public branchTree = signal<BranchDto[]>(MOCK_BRANCH_TREE);
  public currentBranch = signal<BranchDto | null>(MOCK_BRANCH_TREE[0]);
  public isLoading = signal<boolean>(false);

  constructor(private http: HttpClient) {
    this.initSavedBranch();
    this.loadBranches();
  }

  private initSavedBranch(): void {
    const savedId = localStorage.getItem(this.STORAGE_KEY);
    if (savedId) {
      if (savedId === ALL_BRANCHES_OPTION.id) {
        this.currentBranch.set(ALL_BRANCHES_OPTION);
      } else {
        const found = this.findBranchInTree(this.branchTree(), savedId);
        if (found) {
          this.currentBranch.set(found);
        }
      }
    }
  }

  public loadBranches(): void {
    this.isLoading.set(true);

    // Load Flat list
    this.http.get<{ success: boolean; data: BranchDto[] }>(this.apiUrl)
      .subscribe({
        next: (res) => {
          if (res && res.success && res.data && res.data.length > 0) {
            this.branches.set(res.data);
          }
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        }
      });

    // Load Tree list
    this.http.get<{ success: boolean; data: BranchDto[] }>(`${this.apiUrl}/tree`)
      .subscribe({
        next: (res) => {
          if (res && res.success && res.data && res.data.length > 0) {
            this.branchTree.set(res.data);
            const savedId = localStorage.getItem(this.STORAGE_KEY);
            if (savedId && savedId !== ALL_BRANCHES_OPTION.id) {
              const matched = this.findBranchInTree(res.data, savedId);
              if (matched) {
                this.currentBranch.set(matched);
                return;
              }
            }
            if (!this.currentBranch() || this.currentBranch()?.id !== ALL_BRANCHES_OPTION.id) {
              this.currentBranch.set(res.data[0]);
            }
          }
        },
        error: () => {
          // Keep mock tree if server is unreachable
        }
      });
  }

  public selectBranch(branch: BranchDto): void {
    this.currentBranch.set(branch);
    localStorage.setItem(this.STORAGE_KEY, branch.id);
  }

  public getActiveBranchIdForQuery(): string | null {
    const current = this.currentBranch();
    if (!current || current.id === ALL_BRANCHES_OPTION.id || current.code === 'ALL') {
      return null; // Return null so backend queries all branches
    }
    return current.id;
  }

  public findBranchInTree(nodes: BranchDto[], id: string): BranchDto | null {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children && node.children.length > 0) {
        const found = this.findBranchInTree(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  public createBranch(request: CreateBranchRequest): Observable<BranchDto> {
    return this.http.post<{ success: boolean; data: BranchDto }>(this.apiUrl, request)
      .pipe(
        map(res => res.data),
        tap(created => {
          this.branches.set([...this.branches(), created]);
          this.loadBranches();
        })
      );
  }
}
