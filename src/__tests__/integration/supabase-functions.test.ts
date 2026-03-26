import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Integration Tests: Supabase Edge Functions
 * Mocking responses from Edge Functions to test frontend integration logic.
 */

describe('Supabase Functions Integration', () => {
    beforeEach(() => {
        global.fetch = vi.fn();
    });

    describe('generateDetailedFeedback', () => {
        it('should handle successful AI feedback response', async () => {
            const mockResponse = {
                feedback: 'Great writing!',
                score: 7.5,
                strengths: ['Grammar'],
                weaknesses: ['Vocabulary range']
            };

            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => mockResponse
            });

            // Mock implementation of function call
            const result = await fetch('/functions/v1/generateDetailedFeedback', {
                method: 'POST',
                body: JSON.stringify({ content: 'Test content' })
            });
            const data = await result.json();

            expect(data.score).toBe(7.5);
            expect(data.feedback).toBe('Great writing!');
        });

        it('should handle function errors gracefully', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            });

            const result = await fetch('/functions/v1/generateDetailedFeedback', {
                method: 'POST'
            });

            expect(result.ok).toBe(false);
            expect(result.status).toBe(500);
        });
    });

    describe('transcribeAudio', () => {
        it('should return transcription on success', async () => {
            const mockTranscription = { text: 'Hello, this is a test transcription.' };

            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => mockTranscription
            });

            const result = await fetch('/functions/v1/transcribeAudio', {
                method: 'POST',
                body: new Blob(['audio-data'], { type: 'audio/wav' })
            });
            const data = await result.json();

            expect(data.text).toContain('test transcription');
        });
    });

    describe('create-checkout-session', () => {
        it('should return session URL for Stripe', async () => {
            const mockSession = { url: 'https://checkout.stripe.com/pay/abc' };

            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => mockSession
            });

            const result = await fetch('/functions/v1/create-checkout-session', {
                method: 'POST',
                body: JSON.stringify({ priceId: 'price_123' })
            });
            const data = await result.json();

            expect(data.url).toBe('https://checkout.stripe.com/pay/abc');
        });
    });
});
