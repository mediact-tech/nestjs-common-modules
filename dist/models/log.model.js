"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogModel = void 0;
class LogModel {
    toReadAbleFormat() {
        return [
            `ENDPOINT: ${this.method}| ${this.endpoint}`,
            `USERID: ${this.userId}`,
            `RID: ${this.correlationId}`,
            `MSG: ${this.message}`,
            `BODY: ${this.body}`,
            `STATUS: ${[this.httpStatusCode, this.statusCode].join(',')}`,
        ]
            .filter((e) => e?.length > 10)
            .join('\n');
    }
}
exports.LogModel = LogModel;
//# sourceMappingURL=log.model.js.map