const net = require("net");

const RedisClone = require("./redis");

const redis = new RedisClone();

const server = net.createServer((socket)=>{
    console.log("📡 Slave connected to master");

    redis.slaves.push(socket);

    socket.on("end", () => {
        console.log("❌ Slave disconnected");
    });

    socket.on("error", (err) => {
        console.error("💥 Slave connection error:", err.message);
    });
})

const PORT = 7000; // Separate from 6379 to avoid port clash
server.listen(PORT, () => {
    console.log(`🚀 Master is listening for slaves on port ${PORT}`);
});