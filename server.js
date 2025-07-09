// const net = require("net")

// const RedisClone = require("./redis");

// const redis = new RedisClone();

// const server = net.createServer((socket)=>{
//     console.log("client is connected");

//     socket.on("data" , (data)=>{
//         const command = data.toString().trim().split(" ");
//         const action = command[0].toUpperCase();

//         let response;

//         switch (action) {
//             case "SET":
//                 response = redis.set(command[1], command[2], Number(command[3] || null));
//                 break;
//             case "GET":
//                 response = redis.get(command[1]);
//                 break;
//             case "DELETE":
//                 response = redis.delete(command[1]);
//                 break;
//                 case "PUBLISH":
//                     response = redis.publish(command[1], command.slice(2).join(" "));
//                     socket.write(`Published to ${response} subscribers\n`);
//                     break;
//                 case "SUBSCRIBE":
//                     redis.subscribe(command[1], (message) => {
//                         socket.write(`Message from ${command[1]}: ${message}\n`);
//                     });
//                     socket.write(`Subscribed to ${command[1]}\n`);
//                     break;
//                 case "UNSUBSCRIBE":
//                     redis.unsubscribe(command[1], (message) => {
//                         socket.write(`Unsubscribed from ${command[1]}\n`);
//                     });
//                     socket.write(`Unsubscribed from ${command[1]}\n`);
//                     break;
                
//             default:
//                 response = "ERROR: Unknown command";
//         }

//         socket.write(response + "\n")

//     })

//     socket.on("end" , ()=>{
//         console.log("Client disconnected");
//     })
    
// })

// const port = 6379;

// server.listen(port , ()=>{
//     console.log("Server is connected to 6379");
    
// })





const net = require("net");
const ClusterRedis = require("./ClusterRedis");

const cluster = new ClusterRedis(["node1", "node2", "node3"]); // Replace with actual node names

const server = net.createServer((socket) => {
  console.log("Client is connected");

  socket.on("data", (data) => {
    const command = data.toString().trim().split(" ");
    const action = command[0].toUpperCase();
    const key = command[1];

    let response;

    switch (action) {
      case "SET":
        response = cluster.set(key, command[2], Number(command[3] || null));
        break;

      case "GET":
        response = cluster.get(key);
        break;

      case "DELETE":
        response = cluster.delete(key);
        break;

      case "PUBLISH":
        response = cluster.route(key).publish(key, command.slice(2).join(" "));
        socket.write(`Published to ${response} subscribers\n`);
        return;

      case "SUBSCRIBE":
        cluster.route(key).subscribe(key, (message) => {
          socket.write(`Message from ${key}: ${message}\n`);
        });
        socket.write(`Subscribed to ${key}\n`);
        return;

      case "UNSUBSCRIBE":
        cluster.route(key).unsubscribe(key, (message) => {
          socket.write(`Unsubscribed from ${key}\n`);
        });
        socket.write(`Unsubscribed from ${key}\n`);
        return;

      default:
        response = "ERROR: Unknown command";
    }

    socket.write(response + "\n");
  });

  socket.on("end", () => {
    console.log("Client disconnected");
  });
});

const port = 6379;
server.listen(port, () => {
  console.log(`Sharded RedisClone server running on port ${port}`);
});
