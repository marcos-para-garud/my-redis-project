// const express = require("express");
// const ClusterRedis = require("./ClusterRedis");
// const cors = require("cors");

// const cluster = new ClusterRedis(["node1", "node2", "node3"]);
// const app = express();
// app.use(express.json());
// app.use(cors());

// app.post("/set", (req, res) => {
//   const { key, value, ttl } = req.body;
//   const result = cluster.set(key, value, ttl);
//   res.send({ result });
// });

// app.get("/get", (req, res) => {
//   const { key } = req.query;
//   const value = cluster.get(key);
//   res.send({ value });
// });

// app.delete("/delete", (req, res) => {
//   const { key } = req.query;
//   const result = cluster.delete(key);
//   res.send({ result });
// });

// app.get("/keys", (req, res) => {
//   const allKeys = [];
//   for (const node of Object.values(cluster.nodes)) {
//     allKeys.push(...node.keys());
//   }
//   res.send({ keys: allKeys });
// });

// app.get("/ttl", (req, res) => {
//   const { key } = req.query;
//   const result = cluster.route(key).ttl(key);
//   res.send({ ttl: result });
// });

// app.get("/stats", (req, res) => {
//   const distribution = cluster.getNodeKeyDistribution();
//   res.send({ distribution });
// });

// const PORT = 3001;
// app.listen(PORT, () => {
//   console.log(`🚀 Redis HTTP API server running at http://localhost:${PORT}`);
// });















// apiServer.js
const express = require("express");
const ClusterRedis = require("./ClusterRedis");
const cors = require("cors");

const app = express();
const cluster = new ClusterRedis(["node1", "node2", "node3"]);

app.use(cors());
app.use(express.json());

// GET key
app.get("/get", (req, res) => {
  const { key } = req.query;
  const value = cluster.get(key);
  res.send({ key, value });
});

// SET key
app.post("/set", (req, res) => {
  const { key, value, ttl } = req.body;
  cluster.set(key, value, ttl);
  res.send({ message: "OK" });
});

// DELETE key
app.delete("/delete", (req, res) => {
  const { key } = req.query;
  const result = cluster.delete(key);
  res.send({ key, result });
});

// Get all keys
app.get("/keys", (req, res) => {
  const keys = cluster.route("any").keys(); // Example: pick any node for keys
  res.send(keys);
});

// Info
app.get("/info", (req, res) => {
  res.send(cluster.route("any").info());
});

app.listen(3001, () => {
  console.log("API server running at http://localhost:3001");
});
