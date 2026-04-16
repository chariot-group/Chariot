import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
    getHello(): string {
        return 'Chariot Session API is up and running! ✅';
    }
}
