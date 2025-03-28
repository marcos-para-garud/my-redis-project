const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "data.json");

process.on("message", (data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        process.send({ status: "success" });
    } catch (error) {
        process.send({ status: "error", error: error.message });
    }
});