/**
 * Trigger.dev Configuration
 *
 * Configuration for background job processing with Trigger.dev.
 * Requires TRIGGER_SECRET_KEY environment variable to be set.
 *
 * @see https://trigger.dev/docs
 */

import { defineConfig } from '@trigger.dev/sdk/v3';

export default defineConfig({
  project: 'nextmethod',
  runtime: 'node',
  logLevel: 'info',
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
    },
  },
  dirs: ['./trigger'],
});
