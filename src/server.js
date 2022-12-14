import express from "express";
import http from "http";
import ws from "ws";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";

const app = express();
// static 폴더 세팅
app.use("/static", express.static(__dirname + "/static"));

// View Engine PUG 설정
app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.get("/", (req, res) => {
  res.render("index");
});
app.get("/video", (req, res) => {
  res.render("video");
});
app.get("/*", (req, res) => {
  res.redirect("/");
});

// express http 서버
const httpServer = http.createServer(app);

// express http 서버 기반으로 생성한 socketIO 서버
const ioServer = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});
// socketIO admin 페이지 설정
instrument(ioServer, {
  auth: false,
});

/* 
    🚀 getPublicRooms(): 공개방만 구하는 함수
        sids: 서버와 연결된 socket ID 리스트
        rooms: 생성된 채팅방 리스트 (개인방 포함)
        publicRooms : 유저가 직접 생성한 채팅방 리스트 (공개방만)
    
     🚀 getCount() : 해당 공개방의 인원수 구하는 함수
*/
function getPublicRooms() {
  const { sids, rooms } = ioServer.sockets.adapter;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}
function getCount(roomName) {
  return ioServer.sockets.adapter.rooms.get(roomName)?.size;
}

/*
    📦 socketIO Server
    - connection : 서버와 브라우저가 연결되었을 때
    - disconnecting : 채팅방과 연결 끊기기 직전 이벤트
    - disconnect : 채팅방과 연결이 끊어진 이후 이벤트
*/
ioServer.on("connection", (frontSocket) => {
  frontSocket.onAny((event) => console.log(`🚀 [Event] ${event}`));
  frontSocket.name = "익명"; // 초기 닉네임 설정

  // 🎥 [Video] Entered: 입장
  frontSocket.on("entered", (roomName) => {
    frontSocket.join(roomName);
    // 🎥 [Video] Other Entered: 상대방 입장
    frontSocket.to(roomName).emit("otherEntered");
  });

  // ➡️ [webRTC] sendOffer: 상대방(B)에게 초대장 전달
  frontSocket.on("sendOffer", (offer, roomName) => {
    // ⬅️ [webRTC] getOffer: 상대방(A)으로부터 초대장 받기
    frontSocket.to(roomName).emit("getOffer", offer);
  });
  // ➡️ [webRTC] sendAnswer: 상대방(A)에게 답장 전달
  frontSocket.on("sendAnswer", (answer, roomName) => {
    // ⬅️ [webRTC] getAnswer: 상대방(B)으로부터 답장 받기
    frontSocket.to(roomName).emit("getAnswer", answer);
  });

  // ❄️ [Video] sendIce: 나의 소통 방법을 상대방에게 전송
  frontSocket.on("sendIce", (iceCandidate, roomName) => {
    // ❄️ [Video] getIce: 상대방의 소통 방법을 나에게 저장
    frontSocket.to(roomName).emit("getIce", iceCandidate);
  });

  // 🚀 changeRoom()
  ioServer.sockets.emit("changeRoom", getPublicRooms());

  // 🚀 setName()
  frontSocket.on("setName", (editName, done) => {
    const prevName = frontSocket.name;
    frontSocket.name = editName;
    // 🚀 editNameMsg()
    frontSocket.rooms.forEach((eachRoom) => {
      frontSocket.to(eachRoom).emit("editNameMsg", prevName, editName);
    });
    done();
  });

  // 🚀 enterRoom()
  frontSocket.on("enterRoom", (roomName, done) => {
    frontSocket.join(roomName); // 해당 채팅방 입장
    done(roomName, getCount(roomName)); // 입장 이후 브라우저에게 채팅방 이름을 포함한 제어권 전달

    // 🚀 welcomeMsg()
    frontSocket
      .to(roomName)
      .emit("welcomeMsg", frontSocket.name, getCount(roomName)); // 본인 이외에 같은 채팅방 유저에게 id전달
    // 🚀 changeRoom()
    ioServer.sockets.emit("changeRoom", getPublicRooms());
  });

  // 🚀 sendChat()
  frontSocket.on("sendChat", (msg, roomName, done) => {
    frontSocket.to(roomName).emit("sendChat", msg, frontSocket.name);
    done(msg);
  });

  frontSocket.on("disconnecting", () => {
    // 🚀 byeMsg()
    frontSocket.rooms.forEach((eachRoom) => {
      frontSocket
        .to(eachRoom)
        .emit("byeMsg", frontSocket.name, getCount(eachRoom) - 1);
    });
  });
  frontSocket.on("disconnect", () => {
    // 🚀 changeRoom()
    ioServer.sockets.emit("changeRoom", getPublicRooms());
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
