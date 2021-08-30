const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const { userJoin, getCurrentUser,userLeave, getRoomUsers } = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//set static folder
app.use(express.static(path.join(__dirname, "public")));

const botName = "Discord Bot";

//run when client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);

    //seen only to user who connects
    socket.emit("message", formatMessage(botName, "Welcome to Discord!"));

    //Broadcast when user connects // seen to everybody except user
    socket.broadcast
      .to(user.room)
      .emit("message", formatMessage(botName, `${user.username} has joined the chat`));

    //send users and room info
    io.to(user.room).emit('roomUsers',{
        room:user.room,
        users:getRoomUsers(user.room)
    })

  });

  //listen to chat message
  socket.on("chatMessage", (msg) => {
      const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  //when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if(user){
        io.to(user.room).emit("message", formatMessage(botName, `${user.username} has left the chat`));

        //send users and room info
        io.to(user.room).emit('roomUsers',{
            room:user.room,
            users:getRoomUsers(user.room)
        })
    }

  });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => {
  console.log(`Server running on PORT:${PORT}`);
});
