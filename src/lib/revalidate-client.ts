/**
 * @file admin/src/lib/revalidate-client.ts
 * @description Helper to trigger on-demand ISR revalidation on the public Client website.
 */

const CLIENT_BASE_URL =
  process.env.NEXT_PUBLIC_CLIENT_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://www.astraivtechnologies.com'
    : 'http://localhost:3000');

function getRevalidateSecret(): string {
  const secret = process.env.REVALIDATE_SECRET?.trim();
  if (!secret) {
    console.warn('[Revalidate Notice]: REVALIDATE_SECRET is not configured in Admin environment.');
    return '';
  }
  return secret;
}

export async function triggerClientRevalidation(paths: string[], tags: string[] = []): Promise<boolean> {
  if (!paths.length && !tags.length) return true;

  const secret = getRevalidateSecret();
  if (!secret) return false;

  try {
    const res = await fetch(`${CLIENT_BASE_URL}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': secret,
      },
      body: JSON.stringify({ paths, tags }),
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) {
      console.warn(`[triggerClientRevalidation] Server returned status ${res.status}`);
      return false;
    }
    return true;
  } catch (err: unknown) {
    // Non-blocking warning: don't fail admin saves if client is offline or network is slow
    console.warn('[triggerClientRevalidation Notice]:', (err as Error)?.message || err);
    return false;
  }
}
