const net = require("net");
const RedisClone = require("./redis");

const redis = new RedisClone();

const MASTER_HOST = "localhost";
const MASTER_PORT = 7000;

const client = net.createConnection({ host: MASTER_HOST, port: MASTER_PORT }, () => {
    console.log("🛰️  Connected to master");
});

client.on("data" , (data)=>{
    const messages = data.toString().trim().split("\n");
    messages.forEach(msg => {
        try {
            const { command, args } = JSON.parse(msg);

            // if (command === "set") {
            //     redis.set(...args); // replicate key-value locally
            //     console.log(`📥 Replicated: SET ${args.join(" ")}`);
            // }

            switch (command) {
                case "set":
                    redis.set(...args);
                    console.log(`📥 Replicated: SET ${args.join(" ")}`);
                    break;

                case "delete":
                    redis.delete(...args);
                    console.log(`📥 Replicated: DELETE ${args.join(" ")}`);
                    break;

                case "lpush":
                    redis.lpush(...args);
                    console.log(`📥 Replicated: LPUSH ${args.join(" ")}`);
                    break;

                case "rpush":
                    redis.rpush(...args);
                    console.log(`📥 Replicated: RPUSH ${args.join(" ")}`);
                    break;

                case "hset":
                    redis.hset(...args);
                    console.log(`📥 Replicated: HSET ${args.join(" ")}`);
                    break;

                default:
                    console.warn(`⚠️ Unknown replicated command: ${command}`);
            }
        } catch (err) {
            console.error("❌ Failed to parse replication message:", err.message);
        }
    });
})

client.on("end", () => {
    console.log("❌ Disconnected from master");
});

client.on("error", (err) => {
    console.error("💥 Error in slave connection:", err.message);
});



// 2. Create TCP Server to Handle Client Read Operations (GET)



const SLAVE_PORT = 7001;

const readServer = net.createServer((socket) => {
    console.log("📡 Client connected to slave for read ops");

    socket.on("data", (data) => {
        const command = data.toString().trim().split(" ");
        const action = command[0].toUpperCase();

        let response;

        switch (action) {
            case "GET":
                response = redis.get(command[1]) || "null";
                break;
            case "LRANGE":
                response = redis.lrange(command[1], Number(command[2]), Number(command[3]));
                break;
            case "HGET":
                response = redis.hget(command[1], command[2]);
                break;
            default:
                response = "ERROR: Only read operations like GET, LRANGE, HGET are supported by slave";
        }

        socket.write(response.toString() + "\n");
    });

    socket.on("end", () => {
        console.log("❌ Read client disconnected");
    });
});

readServer.listen(SLAVE_PORT, () => {
    console.log(`🚀 Slave ready for read operations on port ${SLAVE_PORT}`);
});