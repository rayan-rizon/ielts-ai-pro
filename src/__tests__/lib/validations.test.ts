import { describe, it, expect } from 'vitest';
import {
    emailSchema,
    passwordSchema,
    usernameSchema,
    signInSchema,
    signUpSchema,
    passwordChangeSchema,
    profileSchema,
    validateField,
    getPasswordStrength,
} from '@/lib/validations';

describe('Validation Schemas', () => {
    describe('emailSchema', () => {
        it('should accept valid email addresses', () => {
            expect(emailSchema.safeParse('user@example.com').success).toBe(true);
            expect(emailSchema.safeParse('test.user@domain.co.uk').success).toBe(true);
            expect(emailSchema.safeParse('user+tag@example.org').success).toBe(true);
        });

        it('should reject invalid email addresses', () => {
            expect(emailSchema.safeParse('').success).toBe(false);
            expect(emailSchema.safeParse('invalid').success).toBe(false);
            expect(emailSchema.safeParse('user@').success).toBe(false);
            expect(emailSchema.safeParse('@domain.com').success).toBe(false);
            expect(emailSchema.safeParse('user@domain').success).toBe(false);
        });
    });

    describe('passwordSchema', () => {
        it('should accept valid passwords', () => {
            expect(passwordSchema.safeParse('password123').success).toBe(true);
            expect(passwordSchema.safeParse('abcdef').success).toBe(true);
        });

        it('should reject short passwords', () => {
            expect(passwordSchema.safeParse('').success).toBe(false);
            expect(passwordSchema.safeParse('12345').success).toBe(false);
        });
    });

    describe('usernameSchema', () => {
        it('should accept valid usernames', () => {
            expect(usernameSchema.safeParse('user_name').success).toBe(true);
            expect(usernameSchema.safeParse('User123').success).toBe(true);
            expect(usernameSchema.safeParse('abc').success).toBe(true);
        });

        it('should reject invalid usernames', () => {
            expect(usernameSchema.safeParse('').success).toBe(false);
            expect(usernameSchema.safeParse('ab').success).toBe(false); // Too short
            expect(usernameSchema.safeParse('a'.repeat(31)).success).toBe(false); // Too long
            expect(usernameSchema.safeParse('user name').success).toBe(false); // Contains space
            expect(usernameSchema.safeParse('user@name').success).toBe(false); // Invalid char
        });
    });

    describe('signInSchema', () => {
        it('should validate sign in data', () => {
            const validData = { email: 'user@example.com', password: 'password123' };
            expect(signInSchema.safeParse(validData).success).toBe(true);
        });

        it('should reject invalid sign in data', () => {
            expect(signInSchema.safeParse({ email: '', password: '' }).success).toBe(false);
            expect(signInSchema.safeParse({ email: 'invalid', password: 'pass' }).success).toBe(false);
        });
    });

    describe('signUpSchema', () => {
        it('should validate sign up data with strong password', () => {
            const validData = {
                email: 'user@example.com',
                username: 'newuser',
                password: 'Password123',
            };
            expect(signUpSchema.safeParse(validData).success).toBe(true);
        });

        it('should reject weak passwords', () => {
            const weakPassword = {
                email: 'user@example.com',
                username: 'newuser',
                password: 'password', // No uppercase, no number
            };
            expect(signUpSchema.safeParse(weakPassword).success).toBe(false);
        });

        it('should require uppercase letter', () => {
            const noUppercase = {
                email: 'user@example.com',
                username: 'newuser',
                password: 'password123',
            };
            expect(signUpSchema.safeParse(noUppercase).success).toBe(false);
        });

        it('should require lowercase letter', () => {
            const noLowercase = {
                email: 'user@example.com',
                username: 'newuser',
                password: 'PASSWORD123',
            };
            expect(signUpSchema.safeParse(noLowercase).success).toBe(false);
        });

        it('should require number', () => {
            const noNumber = {
                email: 'user@example.com',
                username: 'newuser',
                password: 'Password',
            };
            expect(signUpSchema.safeParse(noNumber).success).toBe(false);
        });
    });

    describe('passwordChangeSchema', () => {
        it('should validate matching passwords', () => {
            const validData = {
                currentPassword: 'oldpassword',
                newPassword: 'NewPassword123',
                confirmPassword: 'NewPassword123',
            };
            expect(passwordChangeSchema.safeParse(validData).success).toBe(true);
        });

        it('should reject non-matching passwords', () => {
            const mismatchData = {
                currentPassword: 'oldpassword',
                newPassword: 'NewPassword123',
                confirmPassword: 'DifferentPassword123',
            };
            expect(passwordChangeSchema.safeParse(mismatchData).success).toBe(false);
        });
    });

    describe('profileSchema', () => {
        it('should validate profile data', () => {
            const validProfile = {
                full_name: 'John Doe',
                username: 'johndoe',
                target_band_score: 7,
            };
            expect(profileSchema.safeParse(validProfile).success).toBe(true);
        });

        it('should reject invalid band scores', () => {
            expect(
                profileSchema.safeParse({ full_name: 'John', target_band_score: 0 }).success
            ).toBe(false);
            expect(
                profileSchema.safeParse({ full_name: 'John', target_band_score: 10 }).success
            ).toBe(false);
        });
    });
});

describe('validateField', () => {
    it('should return valid for correct values', () => {
        const result = validateField(emailSchema, 'user@example.com');
        expect(result.valid).toBe(true);
        expect(result.error).toBeNull();
    });

    it('should return error message for invalid values', () => {
        const result = validateField(emailSchema, 'invalid');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('email');
    });
});

describe('getPasswordStrength', () => {
    it('should return low score for weak passwords', () => {
        const result = getPasswordStrength('abc');
        expect(result.score).toBeLessThanOrEqual(2);
        expect(result.label).toMatch(/weak/i);
    });

    it('should return higher score for longer passwords', () => {
        const short = getPasswordStrength('abcdef');
        const long = getPasswordStrength('abcdefghijklmnop');
        expect(long.score).toBeGreaterThanOrEqual(short.score);
    });

    it('should reward uppercase letters', () => {
        const noUpper = getPasswordStrength('abcdefgh');
        const withUpper = getPasswordStrength('Abcdefgh');
        expect(withUpper.score).toBeGreaterThan(noUpper.score);
    });

    it('should reward numbers', () => {
        const noNumbers = getPasswordStrength('abcdefgh');
        const withNumbers = getPasswordStrength('abcdefg1');
        expect(withNumbers.score).toBeGreaterThan(noNumbers.score);
    });

    it('should reward special characters', () => {
        const noSpecial = getPasswordStrength('Abcdefg1');
        const withSpecial = getPasswordStrength('Abcdefg1!');
        expect(withSpecial.score).toBeGreaterThan(noSpecial.score);
    });

    it('should return high score for strong passwords', () => {
        const result = getPasswordStrength('SecureP@ssw0rd!');
        expect(result.score).toBeGreaterThanOrEqual(4);
        expect(result.label).toMatch(/strong/i);
    });
});
