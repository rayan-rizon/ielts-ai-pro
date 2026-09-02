import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const sourceRoot = path.resolve(process.cwd(), 'src');
const sourceExtensions = new Set(['.css', '.js', '.jsx', '.ts', '.tsx']);

function sourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(entryPath);
    return sourceExtensions.has(path.extname(entry.name)) ? [entryPath] : [];
  });
}

describe('dark-mode gradient stops', () => {
  it('does not leave a light via stop active after changing dark endpoints', () => {
    const leaks = sourceFiles(sourceRoot).flatMap((file) =>
      fs
        .readFileSync(file, 'utf8')
        .split('\n')
        .flatMap((line, index) =>
          /bg-linear-to-.*\bvia-.*dark:from-/.test(line) && !/dark:via-/.test(line)
            ? [`${path.relative(process.cwd(), file)}:${index + 1}`]
            : []
        )
    );

    expect(leaks).toEqual([]);
  });
});
