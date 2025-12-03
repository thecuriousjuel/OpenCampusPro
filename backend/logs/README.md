# Logging System

## Overview
The application uses Python's built-in logging module with daily rotating file handlers to maintain comprehensive logs.

## Log Location
All logs are stored in: `backend/logs/`

## Log Files
- **Daily logs**: `YYYY-MM-DD.log` - Each day creates a new log file (e.g., `2025-12-03.log`)
- **Retention**: Logs are kept for 30 days, older logs are automatically deleted

## Log Format
```
[YYYY-MM-DD HH:MM:SS] LEVEL in module (function:line): message
```

Example:
```
[2025-12-03 17:22:15] INFO in auth (register:35): User registered successfully: testuser (ID: 1)
[2025-12-03 17:23:10] WARNING in auth (login:81): Failed login attempt for username: wronguser
```

## Log Levels
- **INFO**: Normal operations (logins, registrations, data operations)
- **WARNING**: Failed operations, validation errors
- **ERROR**: Exceptions and critical errors (includes stack traces)

## What Gets Logged

### Authentication
- Registration attempts (success/failure)
- Login attempts (success/failure)
- Logout events
- Missing credentials warnings

### Database Operations
- Table creation
- CRUD operations (in respective route files)
- Database errors with full stack traces

### Application Events
- Server startup
- Configuration loading
- Extension initialization

## Viewing Logs

### View today's log:
```bash
tail -f backend/logs/$(date +%Y-%m-%d).log
```

### View specific date:
```bash
cat backend/logs/2025-12-03.log
```

### Search for errors in today's log:
```bash
grep ERROR backend/logs/$(date +%Y-%m-%d).log
```

### Search for specific user activity:
```bash
grep "username: testuser" backend/logs/$(date +%Y-%m-%d).log
```

### List all log files:
```bash
ls -lh backend/logs/*.log
```

## Log Rotation
- New log file created at midnight (00:00) daily with format `YYYY-MM-DD.log`
- Each day writes to its own file (e.g., `2025-12-03.log`, `2025-12-04.log`)
- Logs older than 30 days are automatically deleted
