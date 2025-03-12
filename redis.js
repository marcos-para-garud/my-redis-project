class RedisClone{
    constructor(){
        this.store = new Map();
        this.expiry = new Map();
    }

    set(key,value,ttl=null)
    {
        this.store.set(key , value);
        // if(ttl)
        // {
        //     const expireAt = Date.now() + ttl*1000;
        //     this.expiry.set(key , expireAt);
        //     setTimeout(()=>this.store.delete(key) , expireAt)
        // }
        if (ttl) {
            const expireAt = Date.now() + ttl * 1000; // Convert seconds to milliseconds
            this.expiry.set(key, expireAt);
            setTimeout(() => this.delete(key), ttl * 1000); // Auto-delete key when TTL expires
          }
        return "OK";
    }

    get(key)
    {
        if(this.expiry.has(key) && Date.now()>=this.expiry.get(key))
        {
            this.delete(key);
            return "(nil)";
        }
        return this.store.has(key)? this.store.get(key):null;
    }

    delete(key)
    {
        const deleted = this.store.delete(key);
        this.expiry.delete(key); // Remove expiry time if key is deleted
        return deleted ? "1" : "0";
    }

    flushAll()
    {
        this.store.clear();
        this.expiry.clear();
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
      
        return value;
      }

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
      
        return "OK";
      }
    
      lpush(key, value) {
        if (!this.store.has(key)) {
          this.store.set(key, []);
        } else if (!Array.isArray(this.store.get(key))) {
          throw new Error("Key is not a list");
        }
      
        this.store.get(key).unshift(value); // Add to front
        return this.store.get(key).length;
      }
      
      rpush(key, value) {
        if (!this.store.has(key)) {
          this.store.set(key, []);
        } else if (!Array.isArray(this.store.get(key))) {
          throw new Error("Key is not a list");
        }
      
        this.store.get(key).push(value); // Add to end
        return this.store.get(key).length;
      }
      
}
module.exports = new RedisClone();