<?php
declare(strict_types=1);

namespace Evecoo\Tests\Core;

use Evecoo\ApiError;
use Evecoo\Time;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class TimeTest extends TestCase
{
    public function testNowIsoShape(): void
    {
        self::assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/D', Time::nowIso());
        self::assertEqualsWithDelta(microtime(true) * 1000, Time::nowMs(), 1000);
    }

    public function testToIsoAndBack(): void
    {
        self::assertSame('1970-01-01T00:00:00.000Z', Time::toIso(0));
        self::assertSame('2027-06-15T09:00:00.123Z', Time::toIso(1813050000123));
        self::assertSame(1813050000123, Time::isoToMs('2027-06-15T09:00:00.123Z'));
        self::assertSame('9999-12-31T23:59:59.999Z', Time::toIso(Time::isoToMs('9999-12-31T23:59:59.999Z')));
        $now = Time::nowMs();
        self::assertSame($now, Time::isoToMs(Time::toIso($now)));
        self::assertNull(Time::isoToMs('garbage'));
    }

    /** @return array<string,array{0:string,1:int}> */
    public static function accepted(): array
    {
        $base = 1813050000000; // 2027-06-15T09:00:00Z
        return [
            'Z' => ['2027-06-15T09:00:00Z', $base],
            'accept.py microseconds' => ['2027-06-15T09:00:00.123456Z', $base + 123],
            'python isoformat no fraction' => ['2027-06-15T09:00:00Z', $base],
            'nanoseconds truncated' => ['2027-06-15T09:00:00.999999999Z', $base + 999],
            'one fraction digit' => ['2027-06-15T09:00:00.1Z', $base + 100],
            'no offset = UTC' => ['2027-06-15T09:00:00', $base],
            'space separator' => ['2027-06-15 09:00:00Z', $base],
            'no seconds' => ['2027-06-15T09:00Z', $base],
            'date only' => ['2027-06-15', $base - 9 * 3600000],
            'plus offset colon' => ['2027-06-15T11:00:00+02:00', $base],
            'minus offset no colon' => ['2027-06-15T04:30:00-0430', $base],
            'leap day' => ['2028-02-29T00:00:00Z', 1835395200000],
            'epoch' => ['1970-01-01T00:00:00Z', 0],
            'year 9999' => ['9999-12-31T23:59:59.999Z', 253402300799999],
        ];
    }

    #[DataProvider('accepted')]
    public function testParseNowAccepts(string $in, int $ms): void
    {
        self::assertSame($ms, Time::parseNow($in));
    }

    /** @return array<string,array{0:mixed}> */
    public static function rejected(): array
    {
        return [
            'int' => [42],
            'float' => [1.5],
            'null' => [null],
            'bool' => [true],
            'array' => [['2027-06-15']],
            'word' => ['nope'],
            'empty' => [''],
            'extended year' => ['+275760-09-13T00:00:00Z'],
            'before 1970' => ['1969-12-31T00:00:00Z'],
            'before 1970 by offset' => ['1970-01-01T00:30:00+01:00'],
            'year 10000 by offset' => ['9999-12-31T23:30:00-01:00'],
            'Feb 30' => ['2027-02-30T00:00:00Z'],
            'non-leap Feb 29' => ['2027-02-29'],
            'month 13' => ['2027-13-01'],
            'hour 24' => ['2027-06-15T24:00:00Z'],
            'minute 60' => ['2027-06-15T09:60:00Z'],
            'second 60' => ['2027-06-15T09:00:60Z'],
            'offset hour 24' => ['2027-06-15T09:00:00+24:00'],
            'ten fraction digits' => ['2027-06-15T09:00:00.1234567890Z'],
            'lowercase t' => ['2027-06-15t09:00:00Z'],
            'trailing newline' => ["2027-06-15T09:00:00Z\n"],
            'short year' => ['227-06-15'],
            'two-digit offset only' => ['2027-06-15T09:00:00+02'],
        ];
    }

    #[DataProvider('rejected')]
    public function testParseNowRejects(mixed $in): void
    {
        try {
            Time::parseNow($in);
            self::fail('accepted ' . var_export($in, true));
        } catch (ApiError $e) {
            self::assertSame(400, $e->status);
            self::assertSame('validation_error', $e->errorCode);
            self::assertSame('errors.validation.now', $e->messageKey);
            self::assertSame(['field' => 'now'], $e->vars);
        }
    }
}
