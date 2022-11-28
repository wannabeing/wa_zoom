// express Server와 연결
const connectionServer = new WebSocket(`ws://${window.location.host}`);

// express Server과 연결 되었을 때 ✅
connectionServer.addEventListener("open", () => {
  console.log("서버와 연결되었나요??");
  connectionServer.send("서버에게 메시지 보내볼게요");
});
// express Server에게 메시지 받기 📨
connectionServer.addEventListener("message", (msg) => {
  console.log(msg.data);
});
// express Server과 연결이 끊겼을 때 ❌
connectionServer.addEventListener("close", (socket) => {
  console.log("서버와 연결이 끊겼을 때 나오는 메시지");
});
