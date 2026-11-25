import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import { AddressInfo } from 'node:net';
import { User } from '../src/models/User';
import router from '../src/routes/api';
import { PERMISSIONS, ROLES } from '../src/types/roles';
import { requirePermission, requireAnyPermission } from '../src/middleware/auth';

// Isolate the authorization boundary: no database, controllers or production
// endpoints are contacted. Authentication still verifies a real signed token
// and the actual Express route middleware executes for each HTTP request.
const testedRoutes: Array<[string, string]> = [
  ['get', '/teacher-attendance/quick'],
  ['post', '/teacher-attendance/mark'],
  ['delete', '/finance/payments/:id'],
  ['get', '/audit-logs'],
  ['get', '/users'],
];
for (const [method, path] of testedRoutes) {
  const layer = (router as any).stack.find((entry: any) => entry.route?.path === path && entry.route.methods[method]);
  assert.ok(layer, `${method.toUpperCase()} ${path} exists`);
  const stack = layer.route.stack;
  stack[stack.length - 1].handle = (_req: unknown, res: express.Response) => res.status(204).end();
}

test('authorization middleware respects employee grants, revokes and any/all semantics', () => {
  const invoke = (guard: ReturnType<typeof requirePermission>, user?: object) => {
    let status = 204;
    let next = false;
    const res = { status: (code: number) => { status = code; return res; }, json: () => res };
    guard({ user } as any, res as any, () => { next = true; });
    return next ? 204 : status;
  };
  const user = { role: ROLES.EMPLOYEE, customPermissions: [PERMISSIONS.FINANCE_VIEW], revokedPermissions: [] };
  assert.equal(invoke(requirePermission(PERMISSIONS.FINANCE_VIEW)), 401);
  assert.equal(invoke(requirePermission(PERMISSIONS.FINANCE_VIEW), user), 204);
  assert.equal(invoke(requirePermission(PERMISSIONS.FINANCE_VIEW, PERMISSIONS.FINANCE_DELETE), user), 403);
  assert.equal(invoke(requireAnyPermission(PERMISSIONS.FINANCE_VIEW, PERMISSIONS.FINANCE_DELETE), user), 204);
  assert.equal(invoke(requirePermission(PERMISSIONS.FINANCE_VIEW), { ...user, revokedPermissions: [PERMISSIONS.FINANCE_VIEW] }), 403);
  assert.equal(invoke(requireAnyPermission(PERMISSIONS.FINANCE_VIEW), { role: ROLES.SUPERADMIN }), 204);
});

test('actual protected API routes reject absent and revoked permissions', async () => {
  const secret = 'isolated-test-secret';
  const oldSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = secret;
  const originalFindById = User.findById;
  let currentUser: any = { role: ROLES.EMPLOYEE, status: 'active', customPermissions: [], revokedPermissions: [] };
  (User as any).findById = async () => currentUser;
  const app = express();
  app.use(express.json());
  app.use('/api/v1', router);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;
  const token = jwt.sign({ accountId: 'test-only' }, secret);
  const request = (path: string, method = 'GET', authenticated = true) => fetch(base + path, {
    method, headers: authenticated ? { Authorization: `Bearer ${token}` } : {},
  });
  try {
    assert.equal((await request('/teacher-attendance/quick', 'GET', false)).status, 401);
    assert.equal((await request('/teacher-attendance/quick')).status, 403);
    currentUser.customPermissions = [PERMISSIONS.ATTENDANCE_VIEW];
    assert.equal((await request('/teacher-attendance/quick')).status, 204);
    assert.equal((await request('/teacher-attendance/mark', 'POST')).status, 403);
    currentUser.customPermissions = [PERMISSIONS.ATTENDANCE_MANAGE];
    assert.equal((await request('/teacher-attendance/mark', 'POST')).status, 204);
    currentUser.revokedPermissions = [PERMISSIONS.ATTENDANCE_MANAGE];
    assert.equal((await request('/teacher-attendance/mark', 'POST')).status, 403);
    currentUser = { ...currentUser, customPermissions: [PERMISSIONS.FINANCE_DELETE], revokedPermissions: [] };
    assert.equal((await request('/finance/payments/test', 'DELETE')).status, 204);
    currentUser.revokedPermissions = [PERMISSIONS.FINANCE_DELETE];
    assert.equal((await request('/finance/payments/test', 'DELETE')).status, 403);
    currentUser = { ...currentUser, customPermissions: [PERMISSIONS.PERMISSIONS_MANAGE], revokedPermissions: [] };
    assert.equal((await request('/users')).status, 204);
    assert.equal((await request('/audit-logs')).status, 403);
    currentUser.customPermissions = [PERMISSIONS.AUDIT_LOGS_VIEW];
    assert.equal((await request('/audit-logs')).status, 204);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
    (User as any).findById = originalFindById;
    if (oldSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = oldSecret;
  }
});
