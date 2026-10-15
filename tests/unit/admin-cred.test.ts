import { describe, it, expect, beforeEach } from 'vitest';

async function compareAdminCredentials(inputEmail: string, inputPassword: string): Promise<boolean> {
  const adminEmail = 'admin@events.local';
  const adminPassword = 'change-me-admin';
  
  const encoder = new TextEncoder();
  const emailHash1 = await crypto.subtle.digest('SHA-256', encoder.encode(adminEmail));
  const emailHash2 = await crypto.subtle.digest('SHA-256', encoder.encode(inputEmail));
  const passHash1 = await crypto.subtle.digest('SHA-256', encoder.encode(adminPassword));
  const passHash2 = await crypto.subtle.digest('SHA-256', encoder.encode(inputPassword));
  
  const emailEqual = emailHash1.byteLength === emailHash2.byteLength && 
    (new Uint8Array(emailHash1)).every((v, i) => v === new Uint8Array(emailHash2)[i]);
  const passEqual = passHash1.byteLength === passHash2.byteLength && 
    (new Uint8Array(passHash1)).every((v, i) => v === new Uint8Array(passHash2)[i]);
  
  return emailEqual && passEqual;
}

describe('admin credential comparison', () => {
  it('EC-A16: accepts correct credentials', async () => {
    expect(await compareAdminCredentials('admin@events.local', 'change-me-admin')).toBe(true);
  });

  it('EC-A16: rejects wrong email', async () => {
    expect(await compareAdminCredentials('wrong@events.local', 'change-me-admin')).toBe(false);
  });

  it('EC-A16: rejects wrong password', async () => {
    expect(await compareAdminCredentials('admin@events.local', 'wrong')).toBe(false);
  });

  it('EC-A16: rejects different length inputs', async () => {
    expect(await compareAdminCredentials('a', 'change-me-admin')).toBe(false);
    expect(await compareAdminCredentials('admin@events.local', 'a')).toBe(false);
  });
});