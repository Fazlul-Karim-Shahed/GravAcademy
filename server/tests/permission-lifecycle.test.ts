import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import type { AddressInfo } from 'node:net';
import router from '../src/routes/api';
import { User } from '../src/models/User';
import { AuditLog } from '../src/models/AuditLog';
import { PERMISSIONS, ROLES } from '../src/types/roles';

// Real authentication, route guards and controllers; only persistence is
// replaced by a private in-memory store. No network or production database.
test('admin grants and revokes employee access without changing the employee token', async () => {
  const oldSecret = process.env.JWT_SECRET;
  const secret = 'isolated-permission-lifecycle-secret';
  process.env.JWT_SECRET = secret;
  const originalFind = User.findById;
  const originalCreate = AuditLog.create;
  const originalAuditFind = AuditLog.find;
  const admin: any = { _id: 'admin', name: 'Test Admin', role: ROLES.SUPERADMIN, status: 'active', customPermissions: [], revokedPermissions: [] };
  const employee: any = { _id: 'employee', name: 'Test Employee', role: ROLES.EMPLOYEE, status: 'active', customPermissions: [], revokedPermissions: [], save: async () => undefined };
  const delegate: any = { _id: 'delegate', name: 'Test Delegate', role: ROLES.EMPLOYEE, status: 'active', customPermissions: [PERMISSIONS.PERMISSIONS_MANAGE], revokedPermissions: [], save: async () => undefined };
  const users: Record<string, any> = { admin, employee, delegate };
  (User as any).findById = async (id: unknown) => users[String(id)] ?? null;
  (AuditLog as any).create = async () => ({});
  (AuditLog as any).find = () => ({ sort: () => ({ limit: async () => [] }) });
  const app = express();
  app.use(express.json());
  app.use('/api/v1', router);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;
  const tokens = Object.fromEntries(Object.keys(users).map((id) => [id, jwt.sign({ accountId: id }, secret)]));
  const request = (actor: string, path: string, method = 'GET', body?: unknown) => fetch(base + path, {
    method, headers: { Authorization: `Bearer ${tokens[actor]}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  try {
    assert.equal((await request('employee', '/audit-logs')).status, 403);
    assert.equal((await request('admin', '/users/employee/role', 'PUT', { customPermissions: [PERMISSIONS.AUDIT_LOGS_VIEW] })).status, 200);
    const profile = await (await request('employee', '/auth/me')).json() as any;
    assert.ok(profile.data.user.effectivePermissions.includes(PERMISSIONS.AUDIT_LOGS_VIEW));
    assert.equal((await request('employee', '/audit-logs')).status, 200);
    assert.equal((await request('admin', '/users/employee/role', 'PUT', { customPermissions: [], revokedPermissions: [PERMISSIONS.AUDIT_LOGS_VIEW] })).status, 200);
    const revokedProfile = await (await request('employee', '/auth/me')).json() as any;
    assert.ok(!revokedProfile.data.user.effectivePermissions.includes(PERMISSIONS.AUDIT_LOGS_VIEW));
    assert.equal((await request('employee', '/audit-logs')).status, 403);
    assert.equal((await request('delegate', '/users/delegate/role', 'PUT', { customPermissions: [PERMISSIONS.USERS_MANAGE] })).status, 403);
    assert.equal((await request('delegate', '/users/employee/role', 'PUT', { role: ROLES.ADMIN })).status, 403);
    assert.equal((await request('delegate', '/users/employee/role', 'PUT', { customPermissions: [PERMISSIONS.USERS_MANAGE] })).status, 403);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    (User as any).findById = originalFind;
    (AuditLog as any).create = originalCreate;
    (AuditLog as any).find = originalAuditFind;
    if (oldSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = oldSecret;
  }
});
