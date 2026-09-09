import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath) => fs.readFileSync(path.resolve('.', relativePath), 'utf8');

describe('public navbar responsive layout', () => {
  it('uses the mobile navigation before the desktop links can become cramped', () => {
    const navbar = readSource('src/features/core/components/landing/Navbar.jsx');
    const desktopLinks = readSource('src/features/core/components/landing/DesktopNavLinks.jsx');

    expect(navbar).toContain('hidden lg:inline-flex');
    expect(navbar).toContain('group lg:hidden');
    expect(desktopLinks).toContain('shrink-0');
    expect(desktopLinks).toContain('lg:flex');
  });

  it('keeps the portalled menu aligned with both navbar heights', () => {
    const navbar = readSource('src/features/core/components/landing/Navbar.jsx');
    const mobileMenu = readSource('src/features/core/components/landing/MobileNavMenu.jsx');

    expect(navbar).toContain('isScrolled={isScrolled}');
    expect(navbar).toContain('aria-controls="public-navbar-menu"');
    expect(mobileMenu).toContain("isScrolled ? 'top-16 sm:top-18' : 'top-14 sm:top-16'");
    expect(mobileMenu).toContain('id="public-navbar-menu"');
    expect(mobileMenu).toContain('lg:hidden');
  });
});
