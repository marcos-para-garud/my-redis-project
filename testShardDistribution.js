// // const ClusterRedis = require("./ClusterRedis");
// // const cluster = new ClusterRedis(["node1", "node2", "node3"]);

// // function randomString(length = 5) {
// //     return Math.random().toString(36).substring(2, 2 + length);
// // }

// // // Insert 1000 random keys
// // for (let i = 0; i < 1000; i++) {
// //     const key = `key_${randomString()}`;
// //     const value = `val_${i}`;
// //     cluster.set(key, value);
// // }

// // // Show how many keys are in each shard
// // console.log("Key distribution:");
// // console.log(cluster.getNodeKeyDistribution());









// const ClusterRedis = require("./ClusterRedis");
// const cluster = new ClusterRedis(["node1", "node2", "node3"]);

// function randomString(length = 5) {
//     return Math.random().toString(36).substring(2, 2 + length);
// }

// const distribution = {}; // ✅ Optional: for custom tracking

// // Insert 1000 random keys
// for (let i = 0; i < 1000; i++) {
//     const key = `key_${randomString()}`;
//     const value = `val_${i}`;

//     const node = cluster.getNodeForKey(key); // Add this helper in your ClusterRedis if needed
//     console.log(`Routing key "${key}" to node: ${node}`);

//     distribution[node] = (distribution[node] || 0) + 1;

//     cluster.set(key, value);
// }

// // Show how many keys are in each shard
// console.log("\nKey distribution from cluster tracking:");
// console.log(cluster.getNodeKeyDistribution());

// console.log("\nKey distribution from manual tracking:");
// console.log(distribution);










const ClusterRedis = require("./ClusterRedis");
const cluster = new ClusterRedis(["node1", "node2", "node3"]);

function randomString(length = 5) {
    return Math.random().toString(36).substring(2, 2 + length);
}

const distribution = {};
const keys = [];

(async () => {
    cluster.clearAllNodes();
    // Insert 1000 random keys with tracking
    for (let i = 0; i < 1000; i++) {
       // cluster.clearAllNodes();

        const key = `key_${randomString()}`;
        const value = `val_${i}`;
        keys.push(key);

        const nodeName = cluster.getNodeForKey(key);
        distribution[nodeName] = (distribution[nodeName] || 0) + 1;
        

        await cluster.set(key, value); // ✅ Await the set so it actually stores
    }

    // Now print the actual key distribution
    console.log("\nKey distribution from cluster tracking:");
    console.log(cluster.getNodeKeyDistribution());

    console.log("\nKey distribution from manual tracking:");
    console.log(distribution);
})();
