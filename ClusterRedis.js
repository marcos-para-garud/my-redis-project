const RedisClone = require("./redis");
const ConsistentHashRing = require("./ConsistentHashRing");

class ClusterRedis{
    constructor(nodeNames)
    {
        this.ring = new ConsistentHashRing(nodeNames , 10);
        this.nodes = {};
         // Create RedisClone instance for each node
    for (const name of nodeNames) {
        this.nodes[name] = new RedisClone(name); // You might already have a constructor
      }
    }

    route(key) {
        const nodeName = this.ring.getNode(key);
        console.log(`Routing key "${key}" to node: ${nodeName}`);
        return this.nodes[nodeName];
      }

      set(key, value, ttl = null) {
        const node = this.route(key);
        return node.set(key, value, ttl);
      }
    // set(key, value, ttl = null) {
    //     const nodeName = this.hashRing.getNode(key);
    //     const node = this.nodes[nodeName];
    //     node.set(key, value, ttl); // Forward to RedisClone instance
    // }
    

      get(key) {
        const node = this.route(key);
        return node.get(key);
      }

      delete(key) {
        const node = this.route(key);
        return node.delete(key);
      }
    
      // Optional: Debug utility
      printShards() {
        for (const [name, node] of Object.entries(this.nodes)) {
          console.log(`Shard: ${name}, Keys:`, Array.from(node.store.keys()));
        }
      }

      // for testing redis consistent hashing is properly working or not

    //   getNodeKeyDistribution() {
    //     const distribution = {};
    //     for (const [nodeName, nodeInstance] of Object.entries(this.nodes)) {
    //         distribution[nodeName] = Object.keys(nodeInstance.store).length;
    //     }
    //     return distribution;
    // }


    getNodeKeyDistribution() {
        const distribution = {};
        for (const [nodeName, nodeInstance] of Object.entries(this.nodes)) {
          // 🔥 Fix: .store is a Map, so use .size
          distribution[nodeName] = nodeInstance.store.size;
        }
        return distribution;
      }
      

    // getNodeForKey(key) {
    //     const node = this.ring.route(key);
    //     return node.name;
    //   }

    getNodeForKey(key) {
        const nodeName = this.ring.getNode(key); // ✅ Correct method name
        return nodeName;
    }
    
    clearAllNodes() {
        for (const node of Object.values(this.nodes)) {
          node.store.clear();
        }
      }
      
    
}

module.exports = ClusterRedis;
