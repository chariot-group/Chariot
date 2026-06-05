import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
    getHello(): string {
        return 'Chariot Payment API is up and running! ✅';
    }
}
