# my-redis-project

# 🧠 Redis Clone (Node.js)

This is a Redis-like in-memory key-value data store built using **Node.js**, designed for educational and experimental purposes. It supports:

- ✅ Set / Get / Delete / Exists / FlushAll  
- ⏳ TTL (Time-To-Live) with async expiry (**multi-threaded via Worker Threads**)  
- 🧠 LRU Caching (evicts least recently used items)  
- 💾 RDB Persistence (**multi-processing via Child Process**)  
- 📡 Master-Slave Replication over TCP  
- 📢 Pub-Sub Messaging  
- 🧵 Multi-threading (TTL expiry with Worker Threads)  
- 🧬 Multi-processing (Persistence with Child Processes)  

---

## 📦 Folder Structure

```
.
├── masterServer.js       # TCP master to accept slaves
├── redis.js              # Core logic for key-value store
├── rdbWorker.js          # Handles file write (RDB persistence)
├── ttlWorker.js          # Manages TTL expiry using Worker Threads
├── data.json             # RDB saved file (auto-generated)
└── slave.js              # (Example) slave connection logic
```

---

## 🚀 Getting Started

### 1. Clone the Repo
```bash
git clone https://github.com/marcos-para-garud/my-redis-project.git
cd redis-clone
```

### 2. Install Node.js (v14+ recommended)

### 3. Run the Master Server
```bash
node masterServer.js
```

### 4. (Optional) Connect a Slave
Create a `slave.js` file and connect to port `7000`.

Example:
```js
const net = require("net");
const client = net.createConnection({ port: 7000 }, () => {
  console.log("Connected to master");
});

client.on("data", (data) => {
  console.log("Master sent:", data.toString());
});
```

---

## 🧪 Features

### ➕ Set
```js
redis.set("name", "Alice");
redis.set("temp", "123", 5); // expires in 5 seconds
```

### 🔍 Get
```js
redis.get("name"); // returns "Alice"
```

### ❌ Delete
```js
redis.delete("name");
```

### 🕒 TTL (Multi-threaded)
```js
redis.set("session", "abc", 10); // expires after 10s
redis.ttl("session"); // time remaining
```
- TTL expiry is handled asynchronously using **Worker Threads** in `ttlWorker.js`.

### 💾 Persistence (Multi-processing)
- Data is saved to `data.json` every 30 seconds using a **Child Process** (`rdbWorker.js`).
- On startup, the data and TTLs are restored automatically.

### 🧠 LRU Cache
- Supports maximum of 100 items.
- Least recently used items are evicted when limit is exceeded.

### 📢 Pub-Sub
```js
redis.subscribe("channel1", (msg) => console.log("Got:", msg));
redis.publish("channel1", "Hello World!");
```

### 📡 Replication
Every command (`SET`, `DELETE`, etc.) is sent to connected slave sockets over TCP for real-time replication.

---

## 📁 Data Persistence

- Keys and TTLs are stored in `data.json`.
- TTLs are re-initialized on reload.
- Persistence handled in a **child process** to prevent blocking the main thread.

---

## 🛠 Commands Summary

| Command         | Description                        |
|----------------|------------------------------------|
| `set`          | Store a value, optional TTL        |
| `get`          | Retrieve a value                   |
| `delete`       | Remove a key                       |
| `exists`       | Check if key exists                |
| `flushAll`     | Wipe all data                      |
| `keys`         | List all stored keys               |
| `expire`       | Set TTL for existing key           |
| `ttl`          | Time remaining before expiration   |
| `incr` / `decr`| Increment / Decrement a number     |
| `publish`      | Publish message to channel         |
| `subscribe`    | Subscribe to a channel             |

---

## ⚙️ Concurrency Model

- 🧵 **Multi-threading** via [Worker Threads](https://nodejs.org/api/worker_threads.html)  
  - Non-blocking TTL expiration handled in `ttlWorker.js`.
- 🧬 **Multi-processing** via [Child Process](https://nodejs.org/api/child_process.html)  
  - Periodic background RDB saves in `rdbWorker.js`.

---

## 🔒 Limitations

- No AOF (Append-Only File) support yet.
- No snapshotting or clustering.
- Not production-ready.

---

## 🤝 Contributing

Pull requests and suggestions are welcome! If you learned something from this project, drop a ⭐️

---


