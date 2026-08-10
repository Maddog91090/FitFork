import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { decideNotification as appDecideNotification } from '../lib/notificationSchedule';

/**
 * supabase/functions/send-reminders/index.ts hand-duplicates decideNotification
 * and daysBetween because Deno Edge Functions can't import from src/lib. This
 * test is the safeguard for that duplication: it extracts the two functions'
 * source text directly from the Edge Function file (never the whole file,
 * which has top-level `jsr:` imports that can't resolve under Jest/Node) and
 * cross-checks their output against the app copy. If the two copies drift,
 * this test fails.
 */
describe('decideNotification stays in sync between src/lib and the Deno edge function', () => {
  it('produces identical output to the app copy across the known decision matrix', () => {
    // Normalized to LF regardless of the checkout's line-ending setting (this
    // repo's git config CRLF-normalizes some files on Windows checkouts) —
    // the extraction regex below anchors on '\n', not '\r\n'.
    const edgeFunctionSource = fs
      .readFileSync(path.join(__dirname, '../../supabase/functions/send-reminders/index.ts'), 'utf-8')
      .replace(/\r\n/g, '\n');

    const decideMatch = edgeFunctionSource.match(/function decideNotification\([\s\S]*?\n}\n/);
    const daysBetweenMatch = edgeFunctionSource.match(/function daysBetween\([\s\S]*?\n}\n/);

    if (!decideMatch || !daysBetweenMatch) {
      throw new Error(
        "Could not extract decideNotification/daysBetween from the Edge Function's source " +
          '— has it been renamed or restructured? Update this test to match.'
      );
    }

    // The extracted snippet is still TypeScript (type annotations, a union
    // return type) — transpile it to plain JS before evaluating, rather than
    // hand-stripping types with regex.
    const jsSource = ts.transpileModule(
      `${daysBetweenMatch[0]}\n${decideMatch[0]}\nexport { decideNotification };`,
      { compilerOptions: { module: ts.ModuleKind.CommonJS } }
    ).outputText;

    const moduleExports: { decideNotification?: typeof appDecideNotification } = {};
    // eslint-disable-next-line no-new-func -- trusted first-party source, not user input
    new Function('exports', jsSource)(moduleExports);
    const edgeDecideNotification = moduleExports.decideNotification;
    if (!edgeDecideNotification) {
      throw new Error('Transpiled Edge Function snippet did not export decideNotification.');
    }

    const cases: [string | null, string][] = [
      ['2026-08-06', '2026-08-06'],
      ['2026-08-05', '2026-08-06'],
      ['2026-08-04', '2026-08-06'],
      ['2026-08-01', '2026-08-06'],
      [null, '2026-08-06'],
    ];

    for (const [lastCompletedDate, todayStr] of cases) {
      expect(edgeDecideNotification(lastCompletedDate, todayStr)).toBe(
        appDecideNotification(lastCompletedDate, todayStr)
      );
    }
  });
});
