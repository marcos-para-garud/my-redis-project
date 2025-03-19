const net = require("net")

const RedisClone = require("./redis");

const redis = new RedisClone();

const server = net.createServer((socket)=>{
    console.log("client is connected");

    socket.on("data" , (data)=>{
        const command = data.toString().trim().split(" ");
        const action = command[0].toUpperCase();

        let response;

        switch (action) {
            case "SET":
                response = redis.set(command[1], command[2], Number(command[3] || null));
                break;
            case "GET":
                response = redis.get(command[1]);
                break;
            case "DELETE":
                response = redis.delete(command[1]);
                break;
            default:
                response = "ERROR: Unknown command";
        }

        socket.write(response + "\n")

    })

    socket.on("end" , ()=>{
        console.log("Client disconnected");
    })
    
})

const port = 6379;

server.listen(port , ()=>{
    console.log("Server is connected to 6379");
    
})



