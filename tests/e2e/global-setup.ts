import { Api } from './support/api';
import { ADMIN_PASSWORD, USER_PASSWORD } from './support/env';

/**
 * Seeds one fictional company through the public API, the way a person would set it up: a company with two branches
 * and a store, one finance department, one position carrying a role, two employees and three accounts without admin
 * rights. Specs add the rest through the UI.
 */
export default async function globalSetup(): Promise<void> {
  const admin = await Api.login('admin', ADMIN_PASSWORD);
  const group = (await admin.get<any[]>('/branches')).find(b => b.parentId === null);

  const node = (code: string, name: string, parentId: number, orgUnitType: number) =>
    admin.post('/branches', { code, name, parentId, orgUnitType, taxCode: orgUnitType === 1 ? '0100000001' : null });
  const company = await node('COMPANY_A', 'Company A', group.id, 1);
  const hanoi = await node('CA_HN', 'Ha Noi', company.id, 2);
  const hcm = await node('CA_HCM', 'Ho Chi Minh', company.id, 2);
  await node('CA_HN_01', 'Ha Noi Store 01', hanoi.id, 2);

  const roles = Object.fromEntries((await admin.get<any[]>('/sys/roles')).map(r => [r.code, r.id]));
  const levels = Object.fromEntries((await admin.get<any>('/hrm/department-levels?pageSize=50')).items.map((l: any) => [l.code, l.id]));
  const finance = await admin.post('/hrm/departments', {
    code: 'FIN', name: 'Finance', companyId: company.id, branchId: hanoi.id, parentId: null, levelId: levels['DIVISION'], isActive: true
  });
  const position = await admin.post('/hrm/job-positions', {
    code: 'SALES_ACC', name: 'Sales accountant', companyId: company.id, departmentId: finance.id, rankOrder: 4, defaultScopeMode: 'BRANCH_TREE', isActive: true
  });
  await admin.put(`/sys/roles/job-positions/${position.id}`, { roleIds: [roles['SALES_ACCOUNTANT']] });
  const employee = await admin.post('/hrm/employees', {
    code: 'E100', fullName: 'Seed Employee', companyId: company.id, branchId: hanoi.id, departmentId: finance.id, jobPositionId: position.id, hireDate: '2026-01-05'
  });
  await admin.post('/hrm/employees', {
    code: 'E101', fullName: 'Seed Employee Two', companyId: company.id, branchId: hcm.id, departmentId: null, jobPositionId: position.id, hireDate: '2026-01-05'
  });

  // viewer: read-only legacy role; limited: no system role and no employee, so no permissions of its own.
  await admin.post('/auth/users', { userName: 'viewer', displayName: 'Viewer', password: USER_PASSWORD, role: 'Viewer', branchIds: [hanoi.id] });
  await admin.post('/auth/users', { userName: 'limited', displayName: 'Limited', password: USER_PASSWORD, role: 'None', branchIds: [hanoi.id] });
  await admin.post('/auth/users', { userName: 'accountant', displayName: 'Seed Employee', password: USER_PASSWORD, role: 'None', branchIds: [], employeeId: employee.id });
}
