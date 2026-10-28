import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ALL_BRANCHES_OPTION, BranchDto, BranchService } from '../../../core/services/branch.service';

@Component({
  selector: 'app-branch-tree-select',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './branch-tree-select.component.html',
  styleUrls: ['./branch-tree-select.component.scss']
})
export class BranchTreeSelectComponent implements OnInit {
  public branchService = inject(BranchService);
  private elementRef = inject(ElementRef);

  public readonly allBranchesOption = ALL_BRANCHES_OPTION;
  public isOpen = signal<boolean>(false);
  public searchKeyword = signal<string>('');
  public expandedIds = signal<Set<string>>(new Set());

  // Filtered tree supporting keyword search
  public displayedTree = computed<BranchDto[]>(() => {
    const keyword = this.searchKeyword().trim().toLowerCase();
    const tree = this.branchService.branchTree();

    if (!keyword) {
      return tree;
    }

    // Deep search in recursive tree
    const filterNodes = (nodes: BranchDto[]): BranchDto[] => {
      const result: BranchDto[] = [];
      for (const node of nodes) {
        const matchesCurrent =
          node.name.toLowerCase().includes(keyword) ||
          node.code.toLowerCase().includes(keyword) ||
          (node.address && node.address.toLowerCase().includes(keyword));

        const matchedChildren = node.children && node.children.length > 0
          ? filterNodes(node.children)
          : [];

        if (matchesCurrent || matchedChildren.length > 0) {
          result.push({
            ...node,
            children: matchedChildren
          });
          // Auto expand matched parent
          this.expandedIds.update(set => {
            const next = new Set(set);
            next.add(node.id);
            return next;
          });
        }
      }
      return result;
    };

    return filterNodes(tree);
  });

  ngOnInit(): void {
    // Automatically expand the root node by default
    const tree = this.branchService.branchTree();
    if (tree.length > 0) {
      this.expandedIds.update(set => {
        const next = new Set(set);
        next.add(tree[0].id);
        if (tree[0].children) {
          tree[0].children.forEach(c => next.add(c.id));
        }
        return next;
      });
    }
  }

  public toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isOpen.update(v => !v);
  }

  public closeDropdown(): void {
    this.isOpen.set(false);
    this.searchKeyword.set('');
  }

  public toggleExpand(id: string, event: Event): void {
    event.stopPropagation();
    this.expandedIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  public isExpanded(id: string): boolean {
    return this.expandedIds().has(id);
  }

  public isSelected(node: BranchDto): boolean {
    return this.branchService.currentBranch()?.id === node.id;
  }

  public selectBranch(branch: BranchDto, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.branchService.selectBranch(branch);
    this.closeDropdown();
  }

  public selectAllBranches(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.branchService.selectBranch(this.allBranchesOption);
    this.closeDropdown();
  }

  public getNodeIcon(node: BranchDto, depth: number): string {
    if (depth === 0) return '🏛️'; // Root / Tập đoàn
    if (node.children && node.children.length > 0) {
      return depth === 1 ? '🌐' : '🏢'; // Khối / Chi nhánh cha
    }
    return depth >= 3 ? '🏪' : '🏬'; // Cửa hàng / Điểm bán
  }

  @HostListener('document:click', ['$event'])
  public onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  @HostListener('document:keydown.escape')
  public onEscapeKey(): void {
    this.closeDropdown();
  }
}
