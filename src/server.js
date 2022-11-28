import express from "express";
import http from "http";
import ws from "ws";

const app = express();
// static 폴더 세팅
app.use("/static", express.static(__dirname + "/static"));

// View Engine PUG 설정
app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.get("/", (req, res) => {
  res.render("index");
});
app.get("/*", (req, res) => {
  res.redirect("/");
});

// express http 서버
const httpServer = http.createServer(app);
// express http 서버 기반으로 생성한 webSocket 서버
const wsServer = new ws.WebSocketServer({ server: httpServer });

/*
    📦 webSocket Server
        - frontSocket : ws서버와 연결된 브라우저(프론트)

*/
wsServer.on("connection", (frontSocket) => {
  // 브라우저에게 메시지 전송
  frontSocket.send("브라우저로 보내는 메시지");

  // 브라우저에게 메시지 받기
  frontSocket.on("message", (msg) => {
    console.log(msg.toString());
  });
});

// http Server
httpServer.listen(3000);
