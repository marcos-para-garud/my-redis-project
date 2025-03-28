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
                case "PUBLISH":
                    response = redis.publish(command[1], command.slice(2).join(" "));
                    socket.write(`Published to ${response} subscribers\n`);
                    break;
                case "SUBSCRIBE":
                    redis.subscribe(command[1], (message) => {
                        socket.write(`Message from ${command[1]}: ${message}\n`);
                    });
                    socket.write(`Subscribed to ${command[1]}\n`);
                    break;
                case "UNSUBSCRIBE":
                    redis.unsubscribe(command[1], (message) => {
                        socket.write(`Unsubscribed from ${command[1]}\n`);
                    });
                    socket.write(`Unsubscribed from ${command[1]}\n`);
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



