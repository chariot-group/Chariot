# Documentation: Using Winston Logger in CHARIOT

## Introduction

This project uses [Winston](https://github.com/winstonjs/winston) as the logger to ensure centralized and flexible log management. Winston is already installed and initialized.

## Log files

Logs are stored in `logger/logs/{combine|error}.log` only in a production environment. In development, logs are printed to the console. To change the environment, adjust the `ENV` variable in `.env`.

In production, only `info`, `warn`, and `error` logs are persisted. In development, all log levels are printed to the console.

### combine.log

This file contains all `info`, `warn`, and `error` logs.

### error.log

This file contains only `error` logs.

Error logs therefore appear in both `combine.log` AND `error.log`.

## Usage in a Service or Controller

Inject the Winston logger into any service or controller and add a context to better identify the origin of logs:

```typescript
import { Logger, Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly logger: Logger,
  ) {}

  readonly SERVICE_NAME = AppController.name;

  @Get()
  getHello(): string {
  this.logger.log('Info hello world', this.SERVICE_NAME); // Appears as info in combine.log
  this.logger.warn('Warning hello world', this.SERVICE_NAME); // Appears as warn in combine.log
  this.logger.error('Error hello world', this.SERVICE_NAME); // Appears as error in combine.log and error.log
    return this.appService.getHello();
  }
}
```

Adding the second parameter (`this.SERVICE_NAME`) specifies a context for each log, making tracking and debugging easier.

## Best Practices

- Always use the logger instead of `console.log` (even if it works).
- Use appropriate log levels to ease debugging.
- Add context to logs to identify their origin.
- Do not log sensitive information (passwords, tokens, etc.).
