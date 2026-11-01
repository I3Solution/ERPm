import { expect, test } from '@playwright/test';
import { Api } from '../support/api';
import { ADMIN_PASSWORD, USER_PASSWORD } from '../support/env';

// Proves the seeded database is what the browser specs expect. API only: no pages, no selectors.

test('seed creates the organization tree: group > company > two branches > store', async () => {
  const admin = await Api.login('admin', ADMIN_PASSWORD);
  const tree = await admin.get<any[]>('/branches/tree');
  const company = tree[0].children.find((n: any) => n.code === 'COMPANY_A');
  expect(company.name).toBe('Company A');
  expect(company.children.map((n: any) => n.code).sort()).toEqual(['CA_HCM', 'CA_HN']);
  expect(company.children.find((n: any) => n.code === 'CA_HN').children.map((n: any) => n.code)).toEqual(['CA_HN_01']);
});

test('seed creates the finance department, the position with its role and two employees', async () => {
  const admin = await Api.login('admin', ADMIN_PASSWORD);
  const departments = (await admin.get<any>('/hrm/departments?pageSize=50')).items;
  expect(departments.map((d: any) => d.code)).toContain('FIN');
  const positions = (await admin.get<any>('/hrm/job-positions?pageSize=50')).items;
  const position = positions.find((p: any) => p.code === 'SALES_ACC');
  expect((await admin.get<any[]>(`/sys/roles/job-positions/${position.id}`)).length).toBe(1);
  const employees = (await admin.get<any>('/hrm/employees?pageSize=50')).items;
  expect(employees.map((e: any) => e.code).sort()).toEqual(['E100', 'E101']);
});

test('every seeded account can sign in, and rights differ as intended', async () => {
  for (const userName of ['viewer', 'limited', 'accountant']) await Api.login(userName, USER_PASSWORD);
  const accountant = await Api.login('accountant', USER_PASSWORD);
  const me = await accountant.get<any>('/auth/me');
  expect(me.permissions).toContain('sd:order:view');
  expect(me.permissions).not.toContain('sys:user:create');
  const limited = await Api.login('limited', USER_PASSWORD);
  expect((await limited.get<any>('/auth/me')).permissions).not.toContain('hrm:employee:view');
});
