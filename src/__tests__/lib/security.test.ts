import { describe, it, expect } from 'vitest';
import { sanitizeHtml, hasSuspiciousContent } from '@/lib/security';

describe('sanitizeHtml', () => {
  describe('basic sanitization', () => {
    it('should return empty string for null/undefined', () => {
      expect(sanitizeHtml(null)).toBe('');
      expect(sanitizeHtml(undefined)).toBe('');
      expect(sanitizeHtml('')).toBe('');
    });

    it('should allow safe HTML tags', () => {
      expect(sanitizeHtml('<p>Hello</p>')).toBe('<p>Hello</p>');
      expect(sanitizeHtml('<strong>Bold</strong>')).toBe('<strong>Bold</strong>');
      expect(sanitizeHtml('<em>Italic</em>')).toBe('<em>Italic</em>');
      expect(sanitizeHtml('<br />')).toContain('br');
    });

    it('should allow list elements', () => {
      const list = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      expect(sanitizeHtml(list)).toContain('<ul>');
      expect(sanitizeHtml(list)).toContain('<li>');
    });

    it('should allow headings', () => {
      expect(sanitizeHtml('<h1>Title</h1>')).toBe('<h1>Title</h1>');
      expect(sanitizeHtml('<h2>Subtitle</h2>')).toBe('<h2>Subtitle</h2>');
    });
  });

  describe('XSS prevention', () => {
    it('should strip script tags', () => {
      const malicious = '<script>alert("xss")</script>';
      const result = sanitizeHtml(malicious);
      expect(result).not.toContain('<script');
      expect(result).not.toContain('alert');
    });

    it('should strip inline event handlers', () => {
      const onclick = '<button onclick="alert(1)">Click</button>';
      expect(sanitizeHtml(onclick)).not.toContain('onclick');

      const onerror = '<img onerror="alert(1)" src="x">';
      expect(sanitizeHtml(onerror)).not.toContain('onerror');

      const onload = '<body onload="alert(1)">';
      expect(sanitizeHtml(onload)).not.toContain('onload');

      const onmouseover = '<div onmouseover="alert(1)">Hover</div>';
      expect(sanitizeHtml(onmouseover)).not.toContain('onmouseover');
    });

    it('should strip iframe tags', () => {
      const iframe = '<iframe src="http://evil.com"></iframe>';
      expect(sanitizeHtml(iframe)).not.toContain('<iframe');
    });

    it('should strip object and embed tags', () => {
      const object = '<object data="http://evil.com"></object>';
      const embed = '<embed src="http://evil.com">';
      expect(sanitizeHtml(object)).not.toContain('<object');
      expect(sanitizeHtml(embed)).not.toContain('<embed');
    });

    it('should strip style tags', () => {
      const style = '<style>body { background: red; }</style>';
      expect(sanitizeHtml(style)).not.toContain('<style');
    });

    it('should strip link tags', () => {
      const link = '<link rel="stylesheet" href="http://evil.com/evil.css">';
      expect(sanitizeHtml(link)).not.toContain('<link');
    });

    it('should handle javascript: protocol in href', () => {
      const jsLink = '<a href="javascript:alert(1)">Click me</a>';
      const result = sanitizeHtml(jsLink);
      expect(result).not.toContain('javascript:');
    });
  });

  describe('allowed attributes', () => {
    it('should allow href on links', () => {
      const link = '<a href="https://example.com">Link</a>';
      expect(sanitizeHtml(link)).toContain('href');
    });

    it('should protect links that open a new tab', () => {
      const result = sanitizeHtml('<a href="https://example.com" target="_blank">Example</a>');

      expect(result).toContain('target="_blank"');
      expect(result).toContain('rel="noopener noreferrer"');
    });

    it('should allow src on images', () => {
      const img = '<img src="https://example.com/img.jpg" alt="Test">';
      expect(sanitizeHtml(img)).toContain('src');
      expect(sanitizeHtml(img)).toContain('alt');
    });

    it('should allow class and id attributes', () => {
      const div = '<div class="container" id="main">Content</div>';
      expect(sanitizeHtml(div)).toContain('class');
      expect(sanitizeHtml(div)).toContain('id');
    });
  });

  describe('nested tags', () => {
    it('should handle nested safe content', () => {
      const nested = '<div><p><strong>Bold</strong> and <em>italic</em></p></div>';
      const result = sanitizeHtml(nested);
      expect(result).toContain('<strong>');
      expect(result).toContain('<em>');
    });

    it('should strip malicious content from nested structures', () => {
      const nested = '<div><p>Safe</p><script>evil()</script></div>';
      const result = sanitizeHtml(nested);
      expect(result).toContain('Safe');
      expect(result).not.toContain('<script');
    });
  });
});

describe('hasSuspiciousContent', () => {
  it('should detect script tags', () => {
    expect(hasSuspiciousContent('<script>alert(1)</script>')).toBe(true);
    expect(hasSuspiciousContent('<SCRIPT>alert(1)</SCRIPT>')).toBe(true);
  });

  it('should detect javascript: protocol', () => {
    expect(hasSuspiciousContent('javascript:alert(1)')).toBe(true);
    expect(hasSuspiciousContent('JAVASCRIPT:alert(1)')).toBe(true);
  });

  it('should detect event handlers', () => {
    expect(hasSuspiciousContent('onload=alert(1)')).toBe(true);
    expect(hasSuspiciousContent('onerror=alert(1)')).toBe(true);
    expect(hasSuspiciousContent('onclick=alert(1)')).toBe(true);
  });

  it('should return false for safe content', () => {
    expect(hasSuspiciousContent('Hello, world!')).toBe(false);
    expect(hasSuspiciousContent('<p>Safe paragraph</p>')).toBe(false);
    expect(hasSuspiciousContent('Loading data...')).toBe(false);
  });
});
