import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

socket.on("connect", () => {
    console.log("✅ Connected:", socket.id);

    
    socket.emit("joinRoom", "68d8efa7733db0ce62342e51");

    
    socket.emit("sendMessage", {
        senderId: "68d8efa7733db0ce62342e51",
        receiverId: "68d943223ecaa8e006dacaed",
        content: "Hello from USER1 ",
    });
});

socket.on("newMessage", (msg) => {
    console.log(" New message received:", msg);
});
