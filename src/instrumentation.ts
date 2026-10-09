/**
 * @file admin/src/instrumentation.ts
 * @description Next.js server lifecycle hook for runtime initialization.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Enterprise serverless runtime lifecycle initialization
  }
}
