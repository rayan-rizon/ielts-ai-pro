import { describe, it, expect } from 'vitest';
import { emailSchema, passwordSchema, usernameSchema, profileSchema } from '@/lib/validations';

/**
 * Input Validation Security Tests
 * Tests that verify input validation properly rejects malicious or malformed input
 */

describe('SQL Injection Prevention', () => {
  describe('emailSchema', () => {
    it('should reject SQL injection in email field', () => {
      const sqlInjectionAttempts = [
        "admin'--",
        "'; DROP TABLE users;--",
        "admin' OR '1'='1",
        "admin@example.com'; DELETE FROM users;--",
        "1' OR '1'='1' /*",
        "'; EXEC xp_cmdshell('dir');--",
      ];

      sqlInjectionAttempts.forEach((attempt) => {
        expect(emailSchema.safeParse(attempt).success).toBe(false);
      });
    });
  });

  describe('usernameSchema', () => {
    it('should reject SQL injection in username field', () => {
      const sqlInjectionAttempts = [
        "admin'--",
        "'; DROP TABLE users;--",
        "admin' OR '1'='1",
        '1; DELETE FROM users',
      ];

      sqlInjectionAttempts.forEach((attempt) => {
        expect(usernameSchema.safeParse(attempt).success).toBe(false);
      });
    });
  });
});

describe('NoSQL Injection Prevention', () => {
  describe('usernameSchema', () => {
    it('should reject NoSQL injection operators', () => {
      const nosqlInjectionAttempts = [
        '{"$gt":""}',
        '{"$ne":""}',
        '{"$regex":".*"}',
        '$where: function()',
      ];

      nosqlInjectionAttempts.forEach((attempt) => {
        expect(usernameSchema.safeParse(attempt).success).toBe(false);
      });
    });
  });
});

describe('Oversized Input Prevention', () => {
  describe('usernameSchema', () => {
    it('should reject usernames exceeding max length', () => {
      const longUsername = 'a'.repeat(100);
      expect(usernameSchema.safeParse(longUsername).success).toBe(false);
    });
  });

  describe('profileSchema', () => {
    it('should reject extremely long full names', () => {
      const longName = 'A'.repeat(200);
      expect(profileSchema.safeParse({ full_name: longName }).success).toBe(false);
    });
  });

  describe('passwordSchema', () => {
    it('should handle very long passwords without crashing', () => {
      const veryLongPassword = 'A'.repeat(10000);
      // Should either accept or reject gracefully, but not throw
      expect(() => passwordSchema.safeParse(veryLongPassword)).not.toThrow();
    });
  });
});

describe('Unicode Attack Prevention', () => {
  describe('usernameSchema', () => {
    it('should reject homoglyph attacks', () => {
      const homoglyphAttempts = [
        'аdmin', // Cyrillic 'а' instead of Latin 'a'
        'admin​', // Zero-width space
        'admin‎', // Left-to-right mark
        'admin\u200B', // Zero-width space (explicit)
      ];

      homoglyphAttempts.forEach((attempt) => {
        expect(usernameSchema.safeParse(attempt).success).toBe(false);
      });
    });

    it('should reject null byte injection', () => {
      const nullByteAttempts = ['admin\x00', 'admin\u0000', 'admin%00'];

      nullByteAttempts.forEach((attempt) => {
        // Should reject because null bytes aren't alphanumeric or underscore
        expect(usernameSchema.safeParse(attempt).success).toBe(false);
      });
    });
  });
});

describe('Path Traversal Prevention', () => {
  describe('usernameSchema', () => {
    it('should reject path traversal attempts', () => {
      const pathTraversalAttempts = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        'user/../../admin',
        'user%2F..%2F..%2Fadmin',
      ];

      pathTraversalAttempts.forEach((attempt) => {
        expect(usernameSchema.safeParse(attempt).success).toBe(false);
      });
    });
  });
});

describe('Command Injection Prevention', () => {
  describe('usernameSchema', () => {
    it('should reject command injection attempts', () => {
      const commandInjectionAttempts = [
        '; ls -la',
        '| cat /etc/passwd',
        '`whoami`',
        '$(cat /etc/passwd)',
        '&& rm -rf /',
      ];

      commandInjectionAttempts.forEach((attempt) => {
        expect(usernameSchema.safeParse(attempt).success).toBe(false);
      });
    });
  });
});

describe('XSS in Input Fields', () => {
  describe('usernameSchema', () => {
    it('should reject XSS attempts in username', () => {
      const xssAttempts = [
        '<script>alert(1)</script>',
        '"><script>alert(1)</script>',
        "'-alert(1)-'",
        '<img src=x onerror=alert(1)>',
      ];

      xssAttempts.forEach((attempt) => {
        expect(usernameSchema.safeParse(attempt).success).toBe(false);
      });
    });
  });

  describe('emailSchema', () => {
    it('should reject XSS attempts in email', () => {
      const xssAttempts = ['<script>@example.com', 'user@<script>.com', 'user"@evil.com'];

      xssAttempts.forEach((attempt) => {
        expect(emailSchema.safeParse(attempt).success).toBe(false);
      });
    });
  });
});

describe('Boundary Testing', () => {
  describe('usernameSchema', () => {
    it('should accept minimum valid length', () => {
      expect(usernameSchema.safeParse('abc').success).toBe(true);
    });

    it('should reject below minimum length', () => {
      expect(usernameSchema.safeParse('ab').success).toBe(false);
    });

    it('should accept maximum valid length', () => {
      const maxUsername = 'a'.repeat(30);
      expect(usernameSchema.safeParse(maxUsername).success).toBe(true);
    });

    it('should reject above maximum length', () => {
      const tooLongUsername = 'a'.repeat(31);
      expect(usernameSchema.safeParse(tooLongUsername).success).toBe(false);
    });
  });

  describe('profileSchema target_band_score', () => {
    it('should accept valid band scores', () => {
      [1, 4.5, 5, 6.5, 7, 8, 9].forEach((score) => {
        expect(
          profileSchema.safeParse({
            full_name: 'Test User',
            target_band_score: score,
          }).success
        ).toBe(true);
      });
    });

    it('should reject invalid band scores', () => {
      [0, -1, 10, 100, 0.5].forEach((score) => {
        expect(
          profileSchema.safeParse({
            full_name: 'Test User',
            target_band_score: score,
          }).success
        ).toBe(false);
      });
    });
  });
});

describe('Type Coercion Attacks', () => {
  describe('emailSchema', () => {
    it('should reject non-string types', () => {
      expect(emailSchema.safeParse(123).success).toBe(false);
      expect(emailSchema.safeParse(null).success).toBe(false);
      expect(emailSchema.safeParse(undefined).success).toBe(false);
      expect(emailSchema.safeParse({}).success).toBe(false);
      expect(emailSchema.safeParse([]).success).toBe(false);
    });
  });

  describe('profileSchema', () => {
    it('should reject wrong types for target_band_score', () => {
      expect(
        profileSchema.safeParse({
          full_name: 'Test',
          target_band_score: 'seven',
        }).success
      ).toBe(false);

      expect(
        profileSchema.safeParse({
          full_name: 'Test',
          target_band_score: '7',
        }).success
      ).toBe(false);
    });
  });
});
