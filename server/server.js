const server = require("express")();
const http = require("http").createServer(server);
const io = require("socket.io")(http, {
  cors: {
    origin: /localhost/,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("user connected! ", socket.id);

  socket.on("disconnect", () => {
    console.log("user disconnected! ", socket.id);
  });
});

http.listen(3000, () => {
  console.log("server started! yay!");
});
