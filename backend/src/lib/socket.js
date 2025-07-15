import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173"]
    }
});

function getReceiverSocketId(userId) {
    return userSocketMap[userId]; 
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
    console.log("a user connected", socket.id);

    const { userId } = socket.handshake.query;

    // Kiểm tra userId tồn tại và hợp lệ
    if (typeof userId === "string" && userId.trim() !== "") {
      userSocketMap[userId] = socket.id; // Gán userId vào socketId
    } 

    // io.emit() is used to send events to all the connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        console.log("user disconnected", socket.id);
        delete userSocketMap[userId]
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

export { io, app, server, getReceiverSocketId };