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

## Usage in Guards and Interceptors

Guards and interceptors should also use the Winston logger to trace authentication and authorization events:

```typescript
import { 
  CanActivate, 
  ExecutionContext, 
  Injectable, 
  Logger 
} from '@nestjs/common';

@Injectable()
export class MyGuard implements CanActivate {
  private readonly logger = new Logger(MyGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Guard logic
      this.logger.log('Access granted for user');
      return true;
    } catch (error) {
      this.logger.error(`Access denied: ${error.message}`, error.stack);
      throw error;
    }
  }
}
```

## Best Practices

### 1. Always Provide Context

Always include the class name as context to identify the log source:

```typescript
private readonly logger = new Logger(MyClass.name);
```

### 2. Use Appropriate Log Levels

- `debug`: Development information, verbose details
- `log` (info): Normal system operations, user actions
- `warn`: Unusual situations that don't prevent operation
- `error`: Errors requiring attention (always include stack trace)

### 3. Include Stack Traces for Errors

Always pass the stack trace as the second parameter for errors:

```typescript
this.logger.error(`Operation failed: ${error.message}`, error.stack);
```

### 4. Never Log Sensitive Information

❌ **Never log:**
- Passwords
- Complete tokens (JWT, API keys)
- Credit card numbers
- Personal identification numbers

✅ **Instead, log:**
- Partial identifiers (first/last characters)
- User IDs
- Request metadata

Example:
```typescript
// ❌ Bad
this.logger.log(`Token: ${token}`);

// ✅ Good
this.logger.log(`Token received for user: ${userId}`);
```

## Forbidden Practices

**Never use `console.log`, `console.error`, `console.warn`, or `console.debug` in production code.**

All logging must go through the Winston logger to ensure:
- Consistent log format
- Proper log level filtering
- File persistence in production
- Centralized log management

See the functional rule **FR-logging-system** in `docs/functional-rules.md` for complete requirements.


## Best Practices

- Always use the logger instead of `console.log` (even if it works).
- Use appropriate log levels to ease debugging.
- Add context to logs to identify their origin.
- Do not log sensitive information (passwords, tokens, etc.).
