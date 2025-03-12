const redis = require("./redis")

console.log(redis);
console.log(redis.set("Name" , "Akash"));
console.log(redis.set("age" , 27));

console.log(redis.store);

console.log(redis.get("Name"));
console.log(redis.get("age"));
console.log(redis.get("city"));

console.log(redis.delete("age"));




