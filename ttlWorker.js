const {parentPort} = require("worker_threads");

const expiryMap = new Map();


function checkExpirations(){
    const now = Date.now();
    expiryMap.forEach((expireAt , ttl)=>{
        if (now >= expireAt) {
            parentPort.postMessage({ type: "delete", key });
            expiryMap.delete(key);
        }
    })

    setTimeout(checkExpirations, 1000); // Run every second
}


parentPort.on("message" , (message)=>{
    if(message.type == "setTTL")
    {
        expiryMap.set(message.key , Date.now()+message.ttl*1000);
    }
    else if (message.type === "delete") {
        expiryMap.delete(message.key);
    }
})

checkExpirations();