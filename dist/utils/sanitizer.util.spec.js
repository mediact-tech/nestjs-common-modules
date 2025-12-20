"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sanitizer_util_1 = require("./sanitizer.util");
describe('Sanitizer Utility', () => {
    describe('maskSensitiveData', () => {
        it('should mask password field', () => {
            const data = { username: 'john', password: 'secret123' };
            const result = (0, sanitizer_util_1.maskSensitiveData)(data);
            expect(result.username).toBe('john');
            expect(result.password).toBe('[REDACTED]');
        });
        it('should mask nested sensitive fields', () => {
            const data = {
                user: {
                    email: 'test@test.com',
                    auth: {
                        apiKey: 'key-123',
                        secret: 'my-secret',
                    },
                },
            };
            const result = (0, sanitizer_util_1.maskSensitiveData)(data);
            expect(result.user.email).toBe('test@test.com');
            expect(result.user.auth.apiKey).toBe('[REDACTED]');
            expect(result.user.auth.secret).toBe('[REDACTED]');
        });
        it('should mask fields containing sensitive keywords (case-insensitive)', () => {
            const data = {
                userPassword: 'pass123',
                API_KEY: 'key-456',
                mySecretValue: 'hidden',
                Authorization: 'Bearer token',
            };
            const result = (0, sanitizer_util_1.maskSensitiveData)(data);
            expect(result.userPassword).toBe('[REDACTED]');
            expect(result.API_KEY).toBe('[REDACTED]');
            expect(result.mySecretValue).toBe('[REDACTED]');
            expect(result.Authorization).toBe('[REDACTED]');
        });
        it('should use custom mask pattern', () => {
            const data = { password: 'secret' };
            const result = (0, sanitizer_util_1.maskSensitiveData)(data, ['password'], '***');
            expect(result.password).toBe('***');
        });
        it('should handle null and undefined', () => {
            expect((0, sanitizer_util_1.maskSensitiveData)(null)).toBeNull();
            expect((0, sanitizer_util_1.maskSensitiveData)(undefined)).toBeUndefined();
        });
    });
    describe('safeStringify', () => {
        it('should stringify simple objects', () => {
            const data = { name: 'test', value: 123 };
            const result = (0, sanitizer_util_1.safeStringify)(data);
            expect(result).toBe('{"name":"test","value":123}');
        });
        it('should handle circular references', () => {
            const obj = { name: 'circular' };
            obj.self = obj;
            const result = (0, sanitizer_util_1.safeStringify)(obj);
            expect(result).toBe('{"name":"circular","self":"[Circular]"}');
        });
        it('should truncate long strings', () => {
            const data = { content: 'a'.repeat(100) };
            const result = (0, sanitizer_util_1.safeStringify)(data, 50);
            expect(result.length).toBeLessThanOrEqual(65);
            expect(result).toContain('...[TRUNCATED]');
        });
        it('should return empty string for null/undefined', () => {
            expect((0, sanitizer_util_1.safeStringify)(null)).toBe('');
            expect((0, sanitizer_util_1.safeStringify)(undefined)).toBe('');
        });
    });
    describe('sanitizePayload', () => {
        describe('body with secrets', () => {
            it('should mask sensitive fields in object body', () => {
                const body = {
                    username: 'john',
                    password: 'secret123',
                    token: 'jwt-token',
                    data: { apiKey: 'key-123' },
                };
                const result = (0, sanitizer_util_1.sanitizePayload)(body);
                const parsed = JSON.parse(result);
                expect(parsed.username).toBe('john');
                expect(parsed.password).toBe('[REDACTED]');
                expect(parsed.token).toBe('[REDACTED]');
                expect(parsed.data.apiKey).toBe('[REDACTED]');
            });
            it('should mask sensitive fields in JSON string body', () => {
                const body = JSON.stringify({
                    email: 'test@test.com',
                    password: 'mypassword',
                    accessToken: 'token123',
                });
                const result = (0, sanitizer_util_1.sanitizePayload)(body);
                const parsed = JSON.parse(result);
                expect(parsed.email).toBe('test@test.com');
                expect(parsed.password).toBe('[REDACTED]');
                expect(parsed.accessToken).toBe('[REDACTED]');
            });
            it('should mask authorization headers', () => {
                const body = {
                    headers: {
                        Authorization: 'Bearer secret-token',
                        'Content-Type': 'application/json',
                    },
                };
                const result = (0, sanitizer_util_1.sanitizePayload)(body);
                const parsed = JSON.parse(result);
                expect(parsed.headers.Authorization).toBe('[REDACTED]');
                expect(parsed.headers['Content-Type']).toBe('application/json');
            });
        });
        describe('formdata content type', () => {
            it('should handle FormData-like object', () => {
                const formData = {
                    fieldName: 'username',
                    fieldValue: 'john',
                    file: {
                        filename: 'document.pdf',
                        mimetype: 'application/pdf',
                        data: 'base64encodeddata',
                    },
                };
                const result = (0, sanitizer_util_1.sanitizePayload)(formData);
                const parsed = JSON.parse(result);
                expect(parsed.fieldName).toBe('username');
                expect(parsed.file.filename).toBe('document.pdf');
            });
            it('should handle multipart form data structure', () => {
                const multipartData = {
                    fields: {
                        name: 'John Doe',
                        email: 'john@example.com',
                        password: 'secret123',
                    },
                    files: [
                        { fieldname: 'avatar', filename: 'photo.jpg', size: 1024 },
                    ],
                };
                const result = (0, sanitizer_util_1.sanitizePayload)(multipartData);
                const parsed = JSON.parse(result);
                expect(parsed.fields.name).toBe('John Doe');
                expect(parsed.fields.password).toBe('[REDACTED]');
                expect(parsed.files[0].filename).toBe('photo.jpg');
            });
            it('should handle string representation of form data', () => {
                const formDataString = 'username=john&password=secret123&file=binary_data';
                const result = (0, sanitizer_util_1.sanitizePayload)(formDataString);
                expect(result).toBe(formDataString);
            });
        });
        describe('formdata with big file', () => {
            it('should truncate large file content in form data', () => {
                const largeFileContent = 'x'.repeat(5000);
                const formData = {
                    filename: 'large-file.bin',
                    content: largeFileContent,
                    metadata: { size: 5000 },
                };
                const result = (0, sanitizer_util_1.sanitizePayload)(formData, { maxLength: 500 });
                expect(result.length).toBeLessThanOrEqual(515);
                expect(result).toContain('...[TRUNCATED]');
            });
            it('should handle multiple large files', () => {
                const files = {
                    files: [
                        { name: 'file1.bin', data: 'a'.repeat(1000) },
                        { name: 'file2.bin', data: 'b'.repeat(1000) },
                    ],
                };
                const result = (0, sanitizer_util_1.sanitizePayload)(files, { maxLength: 200 });
                expect(result.length).toBeLessThanOrEqual(215);
                expect(result).toContain('...[TRUNCATED]');
            });
            it('should preserve metadata while truncating content', () => {
                const formData = {
                    type: 'upload',
                    file: {
                        name: 'document.pdf',
                        size: 1048576,
                        content: 'x'.repeat(3000),
                    },
                };
                const result = (0, sanitizer_util_1.sanitizePayload)(formData, { maxLength: 100 });
                expect(result).toContain('type');
                expect(result).toContain('upload');
                expect(result).toContain('...[TRUNCATED]');
            });
        });
        describe('big body', () => {
            it('should truncate body exceeding default max length (2048)', () => {
                const bigBody = {
                    data: 'x'.repeat(3000),
                    metadata: { type: 'large' },
                };
                const result = (0, sanitizer_util_1.sanitizePayload)(bigBody);
                expect(result.length).toBeLessThanOrEqual(2063);
                expect(result).toContain('...[TRUNCATED]');
            });
            it('should truncate body with custom max length', () => {
                const body = { content: 'a'.repeat(500) };
                const result = (0, sanitizer_util_1.sanitizePayload)(body, { maxLength: 100 });
                expect(result.length).toBeLessThanOrEqual(115);
                expect(result).toContain('...[TRUNCATED]');
            });
            it('should not truncate body within limit', () => {
                const body = { message: 'short message' };
                const result = (0, sanitizer_util_1.sanitizePayload)(body);
                expect(result).not.toContain('...[TRUNCATED]');
                expect(JSON.parse(result)).toEqual(body);
            });
            it('should handle very large nested objects', () => {
                const nestedBody = {
                    level1: {
                        level2: {
                            level3: {
                                data: 'x'.repeat(2000),
                                password: 'secret',
                            },
                        },
                    },
                };
                const result = (0, sanitizer_util_1.sanitizePayload)(nestedBody, { maxLength: 500 });
                expect(result.length).toBeLessThanOrEqual(515);
                expect(result).toContain('...[TRUNCATED]');
            });
            it('should handle large arrays', () => {
                const largeArray = {
                    items: Array(100).fill({ id: 1, name: 'item', secret: 'hidden' }),
                };
                const result = (0, sanitizer_util_1.sanitizePayload)(largeArray, { maxLength: 500 });
                expect(result.length).toBeLessThanOrEqual(515);
            });
            it('should truncate large JSON string body', () => {
                const largeJsonString = JSON.stringify({
                    content: 'y'.repeat(3000),
                });
                const result = (0, sanitizer_util_1.sanitizePayload)(largeJsonString, { maxLength: 500 });
                expect(result.length).toBeLessThanOrEqual(515);
                expect(result).toContain('...[TRUNCATED]');
            });
            it('should truncate large non-JSON string', () => {
                const largeString = 'raw-data-'.repeat(500);
                const result = (0, sanitizer_util_1.sanitizePayload)(largeString, { maxLength: 100 });
                expect(result.length).toBeLessThanOrEqual(115);
                expect(result).toContain('...[TRUNCATED]');
            });
        });
        describe('edge cases', () => {
            it('should return empty string for null', () => {
                expect((0, sanitizer_util_1.sanitizePayload)(null)).toBe('');
            });
            it('should return empty string for undefined', () => {
                expect((0, sanitizer_util_1.sanitizePayload)(undefined)).toBe('');
            });
            it('should handle primitive values', () => {
                expect((0, sanitizer_util_1.sanitizePayload)(123)).toBe('123');
                expect((0, sanitizer_util_1.sanitizePayload)(true)).toBe('true');
            });
            it('should handle empty object', () => {
                expect((0, sanitizer_util_1.sanitizePayload)({})).toBe('{}');
            });
            it('should handle empty array', () => {
                expect((0, sanitizer_util_1.sanitizePayload)([])).toBe('[]');
            });
        });
    });
});
//# sourceMappingURL=sanitizer.util.spec.js.map