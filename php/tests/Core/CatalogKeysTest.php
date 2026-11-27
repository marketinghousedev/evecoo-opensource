<?php
declare(strict_types=1);

namespace Evecoo\Tests\Core;

use PHPUnit\Framework\TestCase;

/** Every 'errors.*' key literal used anywhere under php/ (app code and tests) must exist in messages/en.json. */
final class CatalogKeysTest extends TestCase
{
    public function testEveryErrorsKeyUsedInPhpExistsInEnJson(): void
    {
        $root = dirname(__DIR__, 2);
        $en = json_decode((string) file_get_contents(dirname($root) . '/messages/en.json'), true);
        self::assertIsArray($en);

        $used = [];
        $it = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($root, \FilesystemIterator::SKIP_DOTS));
        foreach ($it as $file) {
            $path = $file->getPathname();
            if (!str_ends_with($path, '.php') || str_contains($path, '/vendor/') || str_ends_with($path, 'CatalogKeysTest.php')) continue;
            preg_match_all('/[\'"](errors\.[A-Za-z0-9_.]*[A-Za-z0-9_])[\'"]/', (string) file_get_contents($path), $m);
            foreach ($m[1] as $k) $used[$k][] = substr($path, strlen($root) + 1);
        }
        self::assertArrayHasKey('errors.internal', $used);
        self::assertArrayHasKey('errors.rateLimited', $used);
        self::assertArrayHasKey('errors.methodNotAllowed', $used);
        $missing = array_diff(array_keys($used), array_keys($en));
        self::assertSame([], array_values($missing), 'missing in en.json: ' . json_encode(array_intersect_key($used, array_flip($missing))));
    }
}
