# 🔄 Log Collection Flow - Detailed Diagram

## 1️⃣ LOG WRITING PHASE

```
LOG SOURCES
│
├─ Backend (NestJS)
│  │
│  ├─ Configured Winston Logger (services/chariot/backend/src/logger/winston.logger.ts)
│  │  │
│  │  ├─ this.logger.log('message', 'Context')
│  │  │  │
│  │  │  └─ Writes to: services/chariot/backend/logger/logs/combine.log
│  │  │     Format: 2024-10-24 14:30:45.123 PM - info: [AppService] message
│  │  │
│  │  ├─ this.logger.error('error', 'Context')
│  │  │  │
│  │  │  └─ Writes to: 
│  │  │     ├─ services/chariot/backend/logger/logs/error.log (separate)
│  │  │     └─ services/chariot/backend/logger/logs/combine.log (also)
│  │  │
│  │  └─ Production ONLY: files rotate by size
│  │
│  └─ How it works:
│     └─ Winston writes continuously while app is running
│        Files fill in real-time
│
├─ Frontend (Next.js)
│  │
│  ├─ npm run dev 2>&1 | tee -a logs/frontend.log
│  │  │
│  │  ├─ 2>&1 : Redirects stderr to stdout
│  │  └─ tee -a : Writes to both console AND file
│  │
│  └─ Log sources:
│     ├─ Next.js startup messages
│     ├─ API calls (via axios)
│     ├─ Build warnings/errors
│     └─ Runtime errors/warnings
│
└─ MongoDB
   │
   ├─ docker run ... --logpath /var/log/mongodb/mongod.log
   │
   └─ Generates JSON logs:
      ├─ Connection events
      ├─ Query profiling
      ├─ Replica set info
      └─ Performance metrics
```

## 2️⃣ COLLECTION PHASE (Promtail)

```
CREATED FILES
│
├─ services/chariot/backend/logger/logs/combine.log    ← Winston
├─ services/chariot/backend/logger/logs/error.log      ← Winston (errors)
├─ services/chariot/frontend/logs/frontend.log         ← Next.js
└─ infrastructure/mongo/logs/mongod.log                ← MongoDB

│
▼ PROMTAIL SCRAPE (every 30s)
│
├─ /logs/chariot-backend/*.log
│  │
│  └─ Applies backend parser:
│     ├─ Regex: ^(?P<timestamp>...) - (?P<level>\w+): \[(?P<context>...)\] (?P<message>.*)$
│     │
│     ├─ Parses:
│     │  ├─ timestamp → Converts to RFC3339Nano
│     │  ├─ level → Label {level="info|warn|error"}
│     │  ├─ context → Label {context="AppService|AuthController"}
│     │  └─ message → Log content
│     │
│     └─ Result:
│        ├─ Labels: {job="backend", service="nestjs", level="error", context="AppService", environment="development"}
│        └─ Content: "User login failed: invalid credentials"
│
├─ /logs/chariot-frontend/*.log
│  │
│  └─ Applies frontend parser:
│     ├─ Simple regex: (?P<message>.*)
│     │
│     ├─ Result:
│     │  ├─ Labels: {job="frontend", service="nextjs", component="application", environment="development"}
│     │  └─ Content: "Ready - started server on http://localhost:3000"
│     │
│     └─ Note: Logs not structured, only plain text
│
└─ /logs/chariot-mongo/*.log
   │
   └─ Applies MongoDB parser:
      ├─ JSON parser: {"t":{"$date":"2024-10-24T14:30:45.123Z"},"s":"I","c":"CONN","msg":"..."}
      │
      ├─ Result:
      │  ├─ Labels: {job="mongodb", service="database", component="storage", environment="development"}
      │  └─ Content: "Accepted connection from 172.17.0.1:54321"
      │
      └─ Note: MongoDB logs are natively JSON
```

## 3️⃣ SENDING PHASE (Promtail → Loki)

```
PROMTAIL BATCH (every 1s or 1024 logs)
│
├─ Accumulates logs:
│  ├─ Up to 1024 logs OR
│  └─ 1 second passes
│
▼
├─ POST http://loki:3100/loki/api/v1/push
│  │
│  ├─ Headers:
│  │  ├─ Content-Type: application/json
│  │  └─ User-Agent: Promtail
│  │
│  └─ Body (format):
│     {
│       "streams": [
│         {
│           "stream": {
│             "job": "backend",
│             "service": "nestjs",
│             "level": "error",
│             "context": "AppService",
│             "environment": "development"
│           },
│           "values": [
│             ["1729775445123456789", "User login failed: invalid credentials"],
│             ["1729775446234567890", "Error: JWT expired"]
│           ]
│         }
│       ]
│     }
│
└─ Retry logic if ERROR:
   ├─ 1st attempt : Immediate
   ├─ 2nd attempt : +100ms
   ├─ 3rd attempt : +1s (exponential backoff)
   └─ Give up after 3 attempts
```

## 4️⃣ INGESTION PHASE (Loki)

```
REQUEST RECEIVED
│
▼
├─ Authentication: ✅ Bypassed (auth_enabled: false)
│
├─ Validation:
│  ├─ Valid JSON format?
│  ├─ Timestamps in ascending order?
│  ├─ Valid labels?
│  └─ Under ingestion limit (10MB/s)?
│
▼
├─ INGESTION into Loki:
│  │
│  ├─ Received in ingester (memory)
│  │  └─ 3 minutes cache (chunk_idle_period)
│  │
│  ├─ Chunk encoding: Snappy (compression)
│  │
│  ├─ Creates a chunk (~1.5MB max)
│  │
│  └─ Writes to storage:
│     └─ /loki/chunks/
│        ├─ Current logs (hot)
│        └─ TSDB Index in /loki/boltdb-shipper-active/
│
▼
├─ INDEXING (automatic)
│  │
│  ├─ Creates TSDB index:
│  │  └─ Indexes labels for fast filtering
│  │
│  └─ Index example:
│     ├─ "job=backend" → [chunk_1, chunk_2, chunk_5]
│     ├─ "level=error" → [chunk_2, chunk_7]
│     └─ "environment=development" → [chunk_1-1000]
│
└─ ✅ Ready for queries
```

## 5️⃣ RETENTION PHASE

```
TIME ELAPSED
│
├─ Day 1: HOT STORAGE (fast, expensive)
│  ├─ Storage: Memory + /loki/chunks/
│  ├─ Access: Immediate (< 10ms)
│  └─ Used for: Active debugging, real-time alerts
│
├─ Days 2-7: HOT STORAGE (before expiration)
│  ├─ Storage: /loki/chunks/ (compressed)
│  └─ Access: Very fast (< 100ms)
│
└─ Day 8+: EXPIRATION
   │
   ├─ Compactor runs cleanup:
   │  ├─ Checks age > 7 days
   │  ├─ Wait 2h before deletion
   │  └─ Removes chunks
   │
   └─ Disk space freed
      └─ Ready for new storage
```

## 6️⃣ QUERY PHASE (Grafana)

```
USER OPENS GRAFANA
│
▼
├─ Grafana → Loki Datasource (http://loki:3100)
│
▼
├─ QUERY: {job="backend", level="error"}
│
▼
├─ LOKI QUERY ENGINE:
│  │
│  ├─ 1. Parse the query
│  │  └─ Select: job=backend AND level=error
│  │
│  ├─ 2. Consult TSDB index
│  │  └─ Retrieve: [chunk_2, chunk_5, chunk_7]
│  │
│  ├─ 3. Fetch chunks
│  │  ├─ Decompress (Snappy)
│  │  └─ Filter matching logs
│  │
│  └─ 4. Return results
│     ├─ Format: Stream + values
│     └─ Timestamped + labeled
│
▼
├─ RESULTS DISPLAYED:
│  │
│  ├─ [14:30:45] AppService: User login failed
│  ├─ [14:30:46] AuthController: JWT validation error
│  ├─ [14:31:12] AppService: Database connection failed
│  └─ ...
│
└─ ✅ Visualized in Grafana
```

## 🔄 Complete Loop (Real-time)

```
Application generates logs
      │
      ▼ (instantaneous)
  Logs to files
      │
      ▼ (< 1s)
 Promtail scrape
      │
      ▼ (< 1s)
Batch and send to Loki
      │
      ▼ (< 100ms)
  Loki ingests
      │
      ▼ (< 10ms)
 TSDB Index
      │
      ▼ (on query)
 Grafana queries Loki
      │
      ▼ (< 500ms)
 Logs visible in Grafana

📊 TOTAL LATENCY: ~2-3 seconds max
```

## 📈 Example Volumetry

```
Backend (NestJS):
├─ 100 req/min
├─ 2 logs per request
└─ Total: ~200 logs/min = 3.3 logs/sec

Frontend (Next.js):
├─ 5 startup logs
├─ 1 log per API request (100 req/min)
└─ Total: ~100 logs/min = 1.6 logs/sec

MongoDB:
├─ 1 log per request
├─ 100 req/min
└─ Total: ~100 logs/min = 1.6 logs/sec

GRAND TOTAL: ~6.5 logs/sec = 26 KB/s (uncompressed)

Promtail batch size: 1024
Batch time: 1s max
└─ Batch every 1-2 seconds (optimal)

Loki capacity: 10 MB/s max
Used: ~26 KB/s
Usage: 0.26% of capacity ✅
```

## 🎯 Key Points

1. **Writing**: Winston writes in real-time, Next.js captures stdout
2. **Scrape**: Promtail reads files every 30s (but continuously)
3. **Batch**: Send by batch to optimize network requests
4. **Parsing**: Each source has its own format (regex, JSON, plaintext)
5. **Indexing**: TSDB index each label for fast queries
6. **Retention**: Hot storage 7 days, then automatic expiration
7. **Latency**: ~2-3s from log to Grafana (very acceptable)
8. **Scalability**: Capacity for 100x more logs with same config

