const crypto = require('crypto');

class ConsistentHashRing{
    constructor(nodes = [], virtualNodes = 10){
        this.ring = new Map();         // Hash -> Node
    this.sortedHashes = [];        // Sorted array of hashes
    this.virtualNodes = virtualNodes;

    nodes.forEach(node => this.addNode(node));
    }

     // Simpler and stronger hash function using Node's crypto module
  hash(str) {
    const hash = crypto.createHash('sha256').update(str).digest();
    return hash.readUInt32BE(0); // Take the first 4 bytes as a 32-bit int
  }

    // Add a node with virtual nodes
    addNode(node) {
        for (let i = 0; i < this.virtualNodes; i++) {
          const virtualNodeId = `${node}#${i}`;
          const hash = this.hash(virtualNodeId);
          this.ring.set(hash, node);
          this.sortedHashes.push(hash);
        }
        this.sortedHashes.sort((a, b) => a - b); // Keep hashes sorted
      }


       // Remove a node (optional for now)
  removeNode(node) {
    for (let i = 0; i < this.virtualNodes; i++) {
      const virtualNodeId = `${node}#${i}`;
      const hash = this.hash(virtualNodeId);
      this.ring.delete(hash);
      this.sortedHashes = this.sortedHashes.filter(h => h !== hash);
    }
  }


   // Find the node for a given key
   getNode(key) {
    if (this.ring.size === 0) {
      return null;
    }

    const hash = this.hash(key);
    for (const nodeHash of this.sortedHashes) {
      if (hash <= nodeHash) {
        return this.ring.get(nodeHash);
      }
    }
    // Wrap around
    return this.ring.get(this.sortedHashes[0]);
  }

}

module.exports = ConsistentHashRing;