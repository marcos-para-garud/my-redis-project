const fs = require("fs");
const path = require("path");
const {Worker} = require("worker_threads");
const {fork} = require("child_process");

class RedisClone{
    constructor(maxSize = 100){
        this.store = new Map();
        this.expiry = new Map();
        this.filePath = path.join(__dirname , "data.json");
        this.loadFromFile();
         this.autoSaveInterval = 30000; // Auto-save every 30 seconds (adjust as needed)
         this.scheduleAutoSave();
         this.maxSize = maxSize;
         this.channels = new Map();

         this.ttlWorker = new Worker(path.join(__dirname, "ttlWorker.js"));
         this.ttlWorker.on("message", (message) => {
             if (message.type === "delete") {
                 this.delete(message.key, false);
             }
         });

         this.rdbWorker = fork(path.join(__dirname, "rdbWorker.js"));
    }

    // Publish a message to channel

    publish(channel , message)
    {
      if(!this.channels.has(channel)) return 0;

      const subscribers = this.channels.get(channel);
      subscribers.forEach((callback) => {
        callback(message);
    });

    return subscribers.length; // Return the number of subscribers notified
    }


    // subscribe to a channel
    subscribe(channel , callback)
    {
      if (!this.channels.has(channel)) {
        this.channels.set(channel, new Set());
    }
    this.channels.get(channel).add(callback);
    }


    // unsubscribe to a channel

    unsubscribe(channel, callback) {
        if(this.channels.has(channel))
        {
          this.channels.get(channel).delete(callback);
          if (this.channels.get(channel).size === 0) {
            this.channels.delete(channel);
        }
        }
    }

    // save data to file
    saveToFile(){
        try {
            const data = {
                store: Array.from(this.store.entries()),
                expiry: Array.from(this.expiry.entries()),
            };
           // fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
           this.rdbWorker.send(data);
          } catch (error) {
            console.error("Error saving RDB file:", error);
        }
    }

    // load data from file

    loadFromFile() {
        if (fs.existsSync(this.filePath)) {
            try {
                const data = JSON.parse(fs.readFileSync(this.filePath, "utf-8"));

                this.store = new Map(data.store);
                this.expiry = new Map(data.expiry);

                // Restart expiration timers
                this.expiry.forEach((expireAt, key) => {
                    const timeLeft = expireAt - Date.now();
                    if (timeLeft > 0) {
                       // setTimeout(() => this.delete(key), timeLeft);
                       this.ttlWorker.postMessage({ type: "setTTL", key, ttl: timeLeft / 1000 });
                    } else {
                        this.delete(key);
                    }
                });
            } catch (error) {
                console.error("Error loading RDB file:", error);
            }
        }
    }


    scheduleAutoSave() {
        setInterval(() => {
            this.saveToFile();
        }, this.autoSaveInterval);
    }


    /*** LRU Mechanism: Move item to end when accessed ***/
    _updateLRU(key){
      if(this.store.has(key))
      {
        const value = this.store.get(key);
        this.store.delete(key);
        this.store.set(key , value);
      }
    }

     /*** LRU Eviction: Remove least recently used item if needed ***/
     _evictLRU() {
      if(this.store.size > this.maxSize)
      {
        const oldestKey = this.store.keys().next().value;
        this.delete(oldestKey);
      }
     }

    set(key,value,ttl=null)
    {
       // this.store.set(key , value);
        // if(ttl)
        // {
        //     const expireAt = Date.now() + ttl*1000;
        //     this.expiry.set(key , expireAt);
        //     setTimeout(()=>this.store.delete(key) , expireAt)
        // }
        if (this.store.has(key)) {
          this.store.delete(key); // Remove old instance to update LRU order
      }
      this.store.set(key, value);
      this._evictLRU(); // Ensure maxSize limit
        // if (ttl) {
        //     const expireAt = Date.now() + ttl * 1000; // Convert seconds to milliseconds
        //     this.expiry.set(key, expireAt);
        //     setTimeout(() => this.delete(key), ttl * 1000); // Auto-delete key when TTL expires
        //   }
        if (ttl) {
          this.ttlWorker.postMessage({ type: "setTTL", key, ttl });
      }
          this.saveToFile(); 
        return "OK";
    }

    get(key)
    {
        // if(this.expiry.has(key) && Date.now()>=this.expiry.get(key))
        // {
        //     this.delete(key);
        //     return "(nil)";
        // }
        // return this.store.has(key)? this.store.get(key):null;

        if (this.expiry.has(key) && Date.now() >= this.expiry.get(key)) {
          this.delete(key);
          return "(nil)";
      }
      if (this.store.has(key)) {
          this._updateLRU(key); // Mark as recently used
          return this.store.get(key);
      }
      return null;
    }

    // delete(key)
    // {
    //     const deleted = this.store.delete(key);
    //     this.expiry.delete(key); // Remove expiry time if key is deleted
    //     this.saveToFile(); 
    //     return deleted ? "1" : "0";
    // }

    delete(key, notifyWorker = true) {
      const deleted = this.store.delete(key);
      this.expiry.delete(key);
      if (notifyWorker) {
          this.ttlWorker.postMessage({ type: "delete", key });
      }
      this.saveToFile();
      return deleted ? "1" : "0";
  }

    flushAll()
    {
        this.store.clear();
        this.expiry.clear();
        this.saveToFile(); 
        return "Flushed"
    }

    keys()
    {
        return Array.from(this.store.keys());
    }

    exists(key)
    {
        return this.store.has(key) ? 1:0;
    }

    expire(key , ttl)
    {
        if(!this.store.has(key)) return 0;

        const expireAt = Date.now() + ttl*1000;
        this.expiry.set(key , expireAt);

        setTimeout(() => {
            this.delete(key)
        }, ttl*1000);
        this.saveToFile();
        return 1;
    }

    info() {
        return `Total keys stored: ${this.store.size}`;
      }
    
      incr(key)
      {
        if(!this.store.has(key))
        {
            this.store.set(key , 1);
            return 1;
        }

        let value = this.store.get(key);
        if (isNaN(value)) throw new Error("Value is not a number");

        value = Number(value) + 1;
        this.store.set(key, value);
        this.saveToFile();
        return value;
      }

      decr(key) {
        if (!this.store.has(key)) {
          this.store.set(key, -1);
          return -1;
        }
      
        let value = this.store.get(key);
        if (isNaN(value)) throw new Error("Value is not a number");
      
        value = Number(value) - 1;
        this.store.set(key, value);
        this.saveToFile();
        return value;
      }


      // remaining time for expiry
      ttl(key) {
        if (!this.store.has(key)) return -2; // -2 if key doesn't exist
        if (!this.expiry.has(key)) return -1; // -1 if key has no expiration
        
        const timeLeft = Math.ceil((this.expiry.get(key) - Date.now()) / 1000);
        return timeLeft > 0 ? timeLeft : -2; // -2 if expired
      }
        
      rename(oldKey, newKey) {
        if (!this.store.has(oldKey)) throw new Error("No such key");
      
        const value = this.store.get(oldKey);
        this.store.set(newKey, value);
        this.delete(oldKey); // Remove old key
        this.saveToFile();
        return "OK";
      }
    
      lpush(key, value) {
        if (!this.store.has(key)) {
          this.store.set(key, []);
        } else if (!Array.isArray(this.store.get(key))) {
          throw new Error("Key is not a list");
        }
      
        this.store.get(key).unshift(value); // Add to front
        this.saveToFile();
        return this.store.get(key).length;
      }
      
      rpush(key, value) {
        if (!this.store.has(key)) {
          this.store.set(key, []);
        } else if (!Array.isArray(this.store.get(key))) {
          throw new Error("Key is not a list");
        }
      
        this.store.get(key).push(value); // Add to end
        this.saveToFile();
        return this.store.get(key).length;
      }


     


     
      
      // adding to left and right

      lpush(key, value) {
        if (!this.store.has(key)) {
          this.store.set(key, []);
        } else if (!Array.isArray(this.store.get(key))) {
          throw new Error("Key is not a list");
        }
      
        this.store.get(key).unshift(value); // Add to front
        this.saveToFile();
        return this.store.get(key).length;
      }
      
      rpush(key, value) {
        if (!this.store.has(key)) {
          this.store.set(key, []);
        } else if (!Array.isArray(this.store.get(key))) {
          throw new Error("Key is not a list");
        }
      
        this.store.get(key).push(value); // Add to end
        this.saveToFile();
        return this.store.get(key).length;
      }


      // removing from left and right

      lpop(key) {
        if (!this.store.has(key) || !Array.isArray(this.store.get(key)) || this.store.get(key).length === 0) {
          return "(nil)";
        }
        this.saveToFile();
        return this.store.get(key).shift(); // Remove first element
      }
        
      rpop(key) {
        if (!this.store.has(key) || !Array.isArray(this.store.get(key)) || this.store.get(key).length === 0) {
          return "(nil)";
        }
        this.saveToFile();
        return this.store.get(key).pop(); // Remove last element
      }
        
      
      // setting hash set

      hset(key , field , value)
      {
        if(!this.store.has(key))
        {
             this.store.set(key , {})
        }
        else if (typeof this.store.get(key) !== "object" || Array.isArray(this.store.get(key))) {
            throw new Error("WRONGTYPE Operation against a key holding the wrong kind of value");
          }
          this.store.get(key)[field] = value;
          this.saveToFile();
          return 1;
      }


      // get a field value from the hash

      hget(key , field)
      {
        if(!this.store.has(key))
        { 
            return "(nil)";

        }
           

        else if (typeof this.store.get(key) !== "object" || Array.isArray(this.store.get(key))) {
            throw new Error("WRONGTYPE Operation against a key holding the wrong kind of value");
          }
          return this.store.get(key)[field]!== undefined ? this.store.get(key)[field] : "(nil)";     
         }
      

         // hash field deletion

         hdel(key , field)
         {
            if(!this.store.has(key))
            {
                return 0;
            }
            else if (typeof this.store.get(key) !== "object" || Array.isArray(this.store.get(key))) {
                throw new Error("WRONGTYPE Operation against a key holding the wrong kind of value");
              }
              const hash = this.store.get(key);
              if(hash[field] !== undefined)
              {
                delete hash[field];
                this.saveToFile();
                return 1;
              }
              return 0;
         }


         // get all fields and values from a key


         hgetall(key) {
            if (!this.store.has(key)) {
              return {}; // Return an empty object if the key doesn't exist
            } else if (typeof this.store.get(key) !== "object" || Array.isArray(this.store.get(key))) {
              throw new Error("WRONGTYPE Operation against a key holding the wrong kind of value");
            }
          
            return this.store.get(key); // Return all fields and values
          }



          // increment a hash field

          hincrby(key , field , increment)
          {
            if(!this.store.has(key))
            {
                this.store.set(key, {});
            }
            else if (typeof this.store.get(key) !== "object" || Array.isArray(this.store.get(key))) {
                throw new Error("WRONGTYPE Operation against a key holding the wrong kind of value");
              }

              const hash = this.store.get(key);

              if(!(field in hash))
              {
                hash[field] = increment;
              }
              else if (typeof hash[field] !== "number") {
                throw new Error("ERR hash value is not an integer");
              }
              else{
                hash[field]+=increment;
              }
              this.saveToFile();
              return hash[field];
          }


          // set a time to live ttl



      
}
module.exports =  RedisClone;