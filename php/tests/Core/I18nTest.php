<?php
declare(strict_types=1);

namespace Evecoo\Tests\Core;

use Evecoo\I18n;
use Evecoo\Request;
use PHPUnit\Framework\TestCase;

final class I18nTest extends TestCase
{
    protected function setUp(): void
    {
        I18n::reset();
    }

    public function testLocalesAndCatalog(): void
    {
        self::assertContains('en', I18n::locales());
        self::assertSame(I18n::locales(), array_values(array_unique(I18n::locales())));
        self::assertSame('Welcome, Ada!', I18n::t('en', 'automations.welcome.title', ['name' => 'Ada']));
        self::assertSame('3 / 10 stamps', I18n::t('en', 'card.progress', ['stamps' => 3, 'total' => 10]));
        self::assertSame('Too many attempts. Please wait a moment and try again.', I18n::t('en', 'errors.rateLimited'));
        self::assertSame('This action is not supported.', I18n::t('en', 'errors.methodNotAllowed'));
    }

    public function testMissingKeyAndUnknownLocaleFallBack(): void
    {
        self::assertSame('no.such.key', I18n::t('en', 'no.such.key'));
        self::assertSame(I18n::t('en', 'common.save'), I18n::t('xx', 'common.save'));
        self::assertSame(I18n::t('en', 'common.save'), I18n::t('../../etc/passwd', 'common.save'));
        self::assertSame(I18n::messages('en'), I18n::messages('zz-ZZ'));
    }

    public function testInterpolationLeavesUnknownVars(): void
    {
        self::assertSame(
            '"name" must be text between 1 and {max} characters long.',
            I18n::t('en', 'errors.validation.string', ['field' => 'name', 'min' => 1]),
        );
    }

    public function testResolve(): void
    {
        self::assertSame('en', I18n::resolve(null, null));
        self::assertSame('en', I18n::resolve('zz', 'zz-ZZ,fr;q=0.8'));
        self::assertSame('en', I18n::resolve('../../etc/passwd', null));
        self::assertSame('en', I18n::resolve(null, 'en-GB,en;q=0.9'));
        self::assertSame('en', I18n::resolve('EN', null));
        self::assertSame('en', I18n::resolve(null, 'fr;q=1, *;q=0.5, en;q=0.1'));
        self::assertSame('en', I18n::resolve(null, 'en;q=0'));
    }

    public function testResolvePrefersCookieThenQOrder(): void
    {
        // Uses whatever locales exist; with only 'en' present the order checks degrade gracefully.
        $locales = I18n::locales();
        $other = array_values(array_filter($locales, static fn (string $l): bool => $l !== 'en'))[0] ?? null;
        if ($other === null) {
            self::assertSame('en', I18n::resolve('en', 'de'));
            return;
        }
        self::assertSame($other, I18n::resolve($other, 'en'));
        self::assertSame($other, I18n::resolve(null, "en;q=0.5, $other;q=0.9"));
        self::assertSame('en', I18n::resolve('en', $other));
    }

    public function testFromRequestReadsCookieAndHeader(): void
    {
        $r = new Request('GET', '/api/x', ['Cookie' => 'a=1; locale=en; b=2', 'Accept-Language' => 'de'], '', '');
        self::assertSame('en', I18n::fromRequest($r));
        self::assertSame('en', I18n::cookieValue('a=1; locale=en', 'locale'));
        self::assertSame('a b', I18n::cookieValue('locale=a%20b', 'locale'));
        self::assertNull(I18n::cookieValue('locale=%E0%A4%A', 'locale'));
        self::assertNull(I18n::cookieValue('other=1', 'locale'));
        self::assertNull(I18n::cookieValue(null, 'locale'));
    }

    public function testPluralFallback(): void
    {
        // Keys that do not exist exercise the .other / category fallback without touching the catalog.
        self::assertSame('n', I18n::t('en', 'n', ['count' => 1]));
    }
}
