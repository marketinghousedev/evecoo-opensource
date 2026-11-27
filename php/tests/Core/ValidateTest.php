<?php
declare(strict_types=1);

namespace Evecoo\Tests\Core;

use Evecoo\ApiError;
use Evecoo\Validate;
use PHPUnit\Framework\TestCase;

final class ValidateTest extends TestCase
{
    /** @return array{0:int,1:string,2:string,3:array}|null [status, code, messageKey, vars] */
    private static function err(callable $fn): ?array
    {
        try {
            $fn();
            return null;
        } catch (ApiError $e) {
            return [$e->status, $e->errorCode, $e->messageKey, $e->vars];
        }
    }

    public function testLenCountsUtf16CodeUnits(): void
    {
        self::assertSame(0, Validate::len(''));
        self::assertSame(3, Validate::len('abc'));
        self::assertSame(4, Validate::len('café'));
        self::assertSame(2, Validate::len('😀'));       // astral: surrogate pair, like JS
        self::assertSame(1, Validate::len('€'));
        self::assertSame(3, Validate::len('a😀'));
    }

    public function testTrimStripsUnicodeWhitespace(): void
    {
        self::assertSame('a b', Validate::trim("  a b \t\n"));
        self::assertSame('x', Validate::trim("\u{00A0}\u{2003}\u{3000}\u{FEFF}x\u{2028}\u{202F}\v\f"));
        self::assertSame('', Validate::trim("\u{00A0} "));
        self::assertSame("a\u{00A0}b", Validate::trim("a\u{00A0}b"));
    }

    public function testStr(): void
    {
        self::assertSame('Ada', Validate::str(['n' => '  Ada  '], 'n'));
        self::assertSame([400, 'validation_error', 'errors.validation.string', ['field' => 'n', 'min' => 1, 'max' => 200]], self::err(fn () => Validate::str([], 'n')));
        self::assertNotNull(self::err(fn () => Validate::str(['n' => '   '], 'n')));
        self::assertNotNull(self::err(fn () => Validate::str(['n' => 5], 'n')));
        self::assertNotNull(self::err(fn () => Validate::str(['n' => null], 'n')));
        self::assertNotNull(self::err(fn () => Validate::str(['n' => ['a']], 'n')));
        self::assertSame(str_repeat('😀', 2), Validate::str(['n' => str_repeat('😀', 2)], 'n', 1, 4));
        self::assertSame([400, 'validation_error', 'errors.validation.string', ['field' => 'n', 'min' => 1, 'max' => 4]], self::err(fn () => Validate::str(['n' => str_repeat('😀', 3)], 'n', 1, 4)));
        self::assertSame('abcde', Validate::str(['n' => 'abcde'], 'n', 1, 5));
        self::assertNotNull(self::err(fn () => Validate::str(['n' => 'abcdef'], 'n', 1, 5)));
        self::assertSame('ab', Validate::str(['n' => 'ab'], 'n', 2, 5));
        self::assertNotNull(self::err(fn () => Validate::str(['n' => 'a'], 'n', 2, 5)));
    }

    public function testInt(): void
    {
        self::assertSame(5, Validate::int(['n' => 5], 'n', 1, 10));
        self::assertSame(3, Validate::int(['n' => 3.0], 'n', 1, 10));
        self::assertSame(100, Validate::int(['n' => 1e2], 'n', 1, 100));
        self::assertSame(1, Validate::int(['n' => 1], 'n', 1, 10));
        self::assertSame(10, Validate::int(['n' => 10], 'n', 1, 10));
        foreach ([0, 11, 3.5, '5', true, false, null, NAN, INF, -INF, [5], 1e300] as $bad) {
            self::assertSame(
                [400, 'validation_error', 'errors.validation.int', ['field' => 'n', 'min' => 1, 'max' => 10]],
                self::err(fn () => Validate::int(['n' => $bad], 'n', 1, 10)),
                var_export($bad, true),
            );
        }
        self::assertNotNull(self::err(fn () => Validate::int([], 'n', 1, 10)));
    }

    public function testIntFromDecodedJsonFloat(): void
    {
        $o = (array) json_decode('{"a":3.0,"b":3.5,"c":"3"}', false);
        self::assertSame(3, Validate::int($o, 'a', 0, 10));
        self::assertNotNull(self::err(fn () => Validate::int($o, 'b', 0, 10)));
        self::assertNotNull(self::err(fn () => Validate::int($o, 'c', 0, 10)));
    }

    public function testEmail(): void
    {
        self::assertSame('ada@example.com', Validate::email(['e' => "  Ada@Example.COM \u{00A0}"], 'e'));
        self::assertSame('über@straße.de', Validate::email(['e' => 'ÜBER@straße.de'], 'e'));
        $local = str_repeat('a', 254 - strlen('@x.io'));
        self::assertSame($local . '@x.io', Validate::email(['e' => $local . '@x.io'], 'e'));
        foreach (['', 'a', 'a@b', 'a@b.', '@b.c', 'a b@c.d', "a\u{00A0}b@c.d", 'a@@b.c', 'a@b@c.d', 5, null, 'a' . $local . '@x.io', "a@b.c\nx"] as $bad) {
            self::assertSame(
                [400, 'validation_error', 'errors.validation.email', ['field' => 'e']],
                self::err(fn () => Validate::email(['e' => $bad], 'e')),
                var_export($bad, true),
            );
        }
    }

    public function testHexColor(): void
    {
        self::assertSame('#1F6F5B', Validate::hexColor(['c' => '#1F6F5B'], 'c'));
        self::assertSame('#abcdef', Validate::hexColor(['c' => '#abcdef'], 'c'));
        foreach (['1F6F5B', '#1F6F5', '#1F6F5BB', '#GGGGGG', ' #1F6F5B', "#1F6F5B\n", 123, null] as $bad) {
            self::assertSame([400, 'validation_error', 'errors.validation.color', ['field' => 'c']], self::err(fn () => Validate::hexColor(['c' => $bad], 'c')));
        }
    }

    public function testIsoDate(): void
    {
        self::assertNull(Validate::isoDate([], 'd'));
        self::assertNull(Validate::isoDate(['d' => null], 'd'));
        self::assertSame('1990-06-15', Validate::isoDate(['d' => '1990-06-15'], 'd'));
        self::assertSame('2000-02-29', Validate::isoDate(['d' => '2000-02-29'], 'd'));
        foreach (['1900-02-29', '2023-02-29', '2023-13-01', '2023-00-10', '2023-04-31', '2023-1-1', '2023-01-01T00:00', "2023-01-01\n", 20230101, '', true] as $bad) {
            self::assertSame([400, 'validation_error', 'errors.validation.date', ['field' => 'd']], self::err(fn () => Validate::isoDate(['d' => $bad], 'd')), var_export($bad, true));
        }
    }

    public function testPasswords(): void
    {
        self::assertSame(' pass word ', Validate::newPassword(['password' => ' pass word ']));
        self::assertSame(str_repeat('x', 200), Validate::newPassword(['password' => str_repeat('x', 200)]));
        $e = [400, 'validation_error', 'errors.validation.string', ['field' => 'password', 'min' => 8, 'max' => 200]];
        self::assertSame($e, self::err(fn () => Validate::newPassword(['password' => 'short'])));
        self::assertSame($e, self::err(fn () => Validate::newPassword(['password' => str_repeat('x', 201)])));
        self::assertSame($e, self::err(fn () => Validate::newPassword(['password' => 12345678])));
        self::assertSame($e, self::err(fn () => Validate::newPassword([])));
        self::assertSame('pw', Validate::newPassword(['pw' => str_repeat('😀', 4)], 'pw') === str_repeat('😀', 4) ? 'pw' : 'x');

        self::assertSame('x', Validate::anyPassword(['password' => 'x']));
        self::assertSame('', Validate::anyPassword(['password' => '']));
        self::assertSame(
            [400, 'validation_error', 'errors.validation.string', ['field' => 'password', 'min' => 0, 'max' => 200]],
            self::err(fn () => Validate::anyPassword(['password' => 5])),
        );
    }
}
