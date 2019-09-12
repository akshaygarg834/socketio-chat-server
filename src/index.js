var app = require("express")();
var http = require("http").createServer(app);
var io = require("socket.io")(http);

const EVENTS_CONSTANTS = {
  JOIN_ROOM: "JOIN_ROOM",
  CREATE_ROOM: "CREATE_ROOM",
  SNED_MESSAGE: "SNED_MESSAGE",
  ERROR: "ERROR"
};

const ERROR_CODES = {
  ROOM_NOT_EXIST: "ROOM_NOT_EXIST",
  ROOM_ALREDY_EXIST: "ROOM_ALREDY_EXIST"
};

const SUCCESS_CODES = {
  ROOM_CREATION_SUCESSFULL: "ROOM_CREATION_SUCESSFULL",
  ROOM_JOIN_SUCCESSFUL: "ROOM_JOIN_SUCCESSFUL"
};

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

http.listen(process.env.PORT || 5000, function() {
  console.log("listening on *:8080");
});

io.on("connection", function(socket) {
  console.log("A user connected");

  //broadcast event (goes to all)
  io.sockets.emit("broadcast", { description: " clients connected!" });
  socket.broadcast.emit("newclientconnect", {
    description: "newclientconnect clients connected!"
  });

  socket.on("chat message", function(msg) {
    io.emit("chat message", msg);
  });

  socket.on(EVENTS_CONSTANTS.CREATE_ROOM, data => {
    if (io.nsps["/"].adapter.rooms[data.room]) {
      socket.emit(EVENTS_CONSTANTS.ERROR, {
        error: ERROR_CODES.ROOM_ALREDY_EXIST
      });
    } else {
      socket.join(data.room);
      socket.emit("success", {
        message: SUCCESS_CODES.ROOM_CREATION_SUCESSFULL
      });
    }
  });

  socket.on(EVENTS_CONSTANTS.JOIN_ROOM, data => {
    if (!io.nsps["/"].adapter.rooms[data.room]) {
      socket.emit(EVENTS_CONSTANTS.ERROR, {
        error: ERROR_CODES.ROOM_NOT_EXIST
      });
      socket.disconnect();
    } else {
      socket.join(data.room);
      socket.emit("success", {
        message: SUCCESS_CODES.ROOM_JOIN_SUCCESSFUL
      });
    }
  });
  socket.on("error", (...rest) => console.log(rest));
  socket.on(EVENTS_CONSTANTS.SNED_MESSAGE, data => {
    console.log(socket.rooms);
    console.log(io.nsps["/"].adapter.rooms);
    io.sockets.in(data.room).emit(EVENTS_CONSTANTS.SNED_MESSAGE, data.message);
  });

  socket.on("disconnect", function() {
    console.log("A user disconnected   ", socket.id);
  });
});
