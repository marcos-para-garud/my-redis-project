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


      // remaing time for expiry

      ttl(key)
      {
        if(!this.expiry.has(key)) return -1;
        if(!this.store.has(key)) return -2;

        const timeLeft = Math.ceil((this.expiry.get(key) - Date.now())/1000);
        return timeLeft > 0 ? timeLeft : -2;
      }


      // rename a key
      rename(oldKey, newKey) {
        if (!this.store.has(oldKey)) throw new Error("No such key");
      
        const value = this.store.get(oldKey);
        this.store.set(newKey, value);
        this.delete(oldKey); // Remove old key
      
        return "OK";
      }
    
      
      // adding to left and right

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


      // removing from left and right

      lpop(key) {
        if (!this.store.has(key) || !Array.isArray(this.store.get(key)) || this.store.get(key).length === 0) {
          return "(nil)";
        }
      
        return this.store.get(key).shift(); // Remove first element
      }
        
      rpop(key) {
        if (!this.store.has(key) || !Array.isArray(this.store.get(key)) || this.store.get(key).length === 0) {
          return "(nil)";
        }
      
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

              return hash[field];
          }


          // set a time to live ttl


          
      
}
module.exports = new RedisClone();