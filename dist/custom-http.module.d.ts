import { HttpModule as AxiosHttpModule, HttpService } from '@nestjs/axios';
import { OnModuleInit } from '@nestjs/common';
import { CustomLogger } from './custom-logger';
export declare class HttpModule extends AxiosHttpModule implements OnModuleInit {
    private httpService;
    private customLogger;
    constructor(httpService: HttpService, customLogger: CustomLogger);
    onModuleInit(): any;
    private onRequest;
    private onResponse;
}
//# sourceMappingURL=custom-http.module.d.ts.map