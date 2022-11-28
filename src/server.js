import express from "express";
import http from "http";
import ws from "ws";
import { Server } from "socket.io";

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

// express http 서버 기반으로 생성한 socketIO 서버
const ioServer = new Server(httpServer);

/*
    📦 socketIO Server
    - frontSocket : 서버와 연결된 브라우저(프론트)
    - onAny : socketIO 이벤트 로그
    - enterRoom : 채팅방 생성 및 입장 요청 이벤트
*/
ioServer.on("connection", (frontSocket) => {
  frontSocket.onAny((event) => console.log(`🚀 [Event] ${event}`));

  frontSocket.on("enterRoom", (roomName, done) => {
    frontSocket.join(roomName);
    done(roomName);
  });
});

/*
    📦 webSocket Server
        - wsServer : express http 서버 기반으로 생성한 webSocket 서버
        - fakeDatabase : 가짜 데이터베이스
        - frontSocket : 서버와 연결된 브라우저(프론트)

const wsServer = new ws.WebSocketServer({ server: httpServer });
const fakeDatabase = [];
// WebSocket 연결 유무
wsServer.on("connection", (frontSocket) => {
  frontSocket.name = "익명"; // 브라우저 소켓의 닉네임 설정
  fakeDatabase.push(frontSocket); // 연결된 브라우저 정보를 DB에 저장
  console.log("✅ Connect Browser");

  // 🚀 브라우저에게 받은 메시지 처리 함수
  frontSocket.on("message", (blobMsg) => {
    // 브라우저에게 받은 메시지 타입 변환
    const msgToString = blobMsg.toString();
    const parsedMsg = JSON.parse(msgToString);

    // 브라우저로부터 온 메시지 타입에 따라 실행
    switch (parsedMsg.type) {
      case "chat":
        // 연결된 모든 브라우저에게 메시지 전달
        fakeDatabase.forEach((socket) => {
          socket.send(`${frontSocket.name}: ${parsedMsg.text}`);
        });
        break;
      case "name":
        frontSocket.name = parsedMsg.text;
        break;
    }
  });
});
*/

// http Server
httpServer.listen(3000);
