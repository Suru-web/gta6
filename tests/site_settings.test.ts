import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { createSessionToken } from '../src/lib/auth';
import { getSiteSettings, saveSiteSettings } from '../src/lib/site-settings';
import { POST } from '../src/app/api/admin/site-settings/route';

let originalCwd: string;
let directory: string;
beforeEach(async () => {
  originalCwd = process.cwd();
  directory = await mkdtemp(path.join(tmpdir(), 'arena-settings-'));
  process.chdir(directory);
});
afterEach(async () => {
  process.chdir(originalCwd);
  await rm(directory, { recursive: true, force: true });
});

describe('Side Quest visibility', () => {
  it('defaults to visible and persists changes independently of payment settings', async () => {
    await mkdir('data', { recursive: true });
    const payment = '{"upiId":"original@upi","payeeName":"Original"}';
    await writeFile('data/upi_config.json', payment);
    expect(await getSiteSettings()).toEqual({ sideQuestVisible: true });
    await saveSiteSettings({ sideQuestVisible: false });
    expect(await getSiteSettings()).toEqual({ sideQuestVisible: false });
    expect(await readFile('data/upi_config.json', 'utf8')).toBe(payment);
    await saveSiteSettings({ sideQuestVisible: true });
    expect(await getSiteSettings()).toEqual({ sideQuestVisible: true });
  });

  it('rejects unauthenticated and malformed updates without changing the setting', async () => {
    const request = (body: unknown, authorization?: string) => new NextRequest('http://localhost/api/admin/site-settings', {
      method: 'POST', headers: { 'content-type': 'application/json', ...(authorization ? { authorization } : {}) }, body: JSON.stringify(body),
    });
    expect((await POST(request({ sideQuestVisible: false }))).status).toBe(401);
    const auth = `Bearer ${createSessionToken('test-admin')}`;
    expect((await POST(request({ sideQuestVisible: 'false' }, auth))).status).toBe(400);
    expect(await getSiteSettings()).toEqual({ sideQuestVisible: true });
    expect((await POST(request({ sideQuestVisible: false }, auth))).status).toBe(200);
    expect(await getSiteSettings()).toEqual({ sideQuestVisible: false });
  });

  it('does not claim success with unshared serverless storage', async () => {
    const old = process.env.VERCEL;
    process.env.VERCEL = '1';
    try {
      await expect(saveSiteSettings({ sideQuestVisible: false })).rejects.toThrow('Shared storage');
    } finally {
      if (old === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = old;
    }
  });
});
