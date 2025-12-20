"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.correlationMiddleware = exports.CORRELATION_ID_HEADER = void 0;
exports.getCorrelationId = getCorrelationId;
exports.getUserId = getUserId;
exports.setUserId = setUserId;
exports.getRequestContext = getRequestContext;
exports._getLoggerContext = _getLoggerContext;
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const async_hooks_1 = require("async_hooks");
const crypto_1 = require("crypto");
const asyncLocalStorage = new async_hooks_1.AsyncLocalStorage();
function getCorrelationId() {
    return asyncLocalStorage.getStore()?.correlationId;
}
function getUserId() {
    return asyncLocalStorage.getStore()?.userId;
}
function setUserId(userId) {
    const store = asyncLocalStorage.getStore();
    if (store) {
        store.userId = userId;
    }
}
function getRequestContext() {
    return asyncLocalStorage.getStore();
}
exports.CORRELATION_ID_HEADER = 'x-correlation-id';
exports.correlationMiddleware = (0, fastify_plugin_1.default)((fastify) => {
    fastify.addHook('onRequest', (req, reply, done) => {
        const correlationId = req.headers[exports.CORRELATION_ID_HEADER] || (0, crypto_1.randomUUID)();
        asyncLocalStorage.run({ correlationId }, () => {
            req.headers[exports.CORRELATION_ID_HEADER] = correlationId;
            reply.header(exports.CORRELATION_ID_HEADER, correlationId);
            done();
        });
    });
});
function _getLoggerContext() {
    const store = asyncLocalStorage.getStore();
    return {
        correlationId: store?.correlationId,
        userId: store?.userId,
    };
}
//# sourceMappingURL=correlation.middleware.js.map