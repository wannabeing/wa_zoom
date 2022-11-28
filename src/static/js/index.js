// name 관련 변수
const nameForm = document.querySelector("#nameForm");
const nameInput = document.querySelector("#nameInput");

// chat 관련 변수
const chatList = document.querySelector("#chatList");
const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");

// 기타 변수
const nameBtn = document.querySelector("#nameBtn");
const editBtn = document.querySelector("#editBtn");

// express Server와 연결 변수
const connectionServer = new WebSocket(`ws://${window.location.host}`);

/* 
    🚀 공통 함수
    1. makeMsg: JSON 형식의 데이터를 string화 시키는 함수
*/
function makeMsg(type, text) {
  const msg = { type, text };
  return JSON.stringify(msg);
}

/* 
    🚀 채팅 폼 관련 이벤트 함수
*/
chatForm.addEventListener("submit", (event) => {
  event.preventDefault();

  // express Server에게 메시지 보내기 📨
  connectionServer.send(makeMsg("chat", chatInput.value));
  chatInput.value = "";
});
/* 
    🚀 닉네임 설정 관련 이벤트 함수
*/
nameForm.addEventListener("submit", (event) => {
  event.preventDefault();

  // express Server에게 메시지 보내기 📨
  connectionServer.send(makeMsg("name", nameInput.value));

  // 보낸 이후
  nameInput.disabled = true;
  chatForm.style.display = "block";
  nameBtn.style.display = "none";
  editBtn.style.display = "inline-block";
});
/* 
    🚀 닉네임 수정 관련 이벤트 함수
*/
editBtn.addEventListener("click", (event) => {
  event.preventDefault();

  nameInput.disabled = false;
  nameBtn.style.display = "inline-block";
  editBtn.style.display = "none";
});

/* 
    🚀 express Server 관련 이벤트 함수
*/
// express Server과 연결 되었을 때 ✅
connectionServer.addEventListener("open", () => {
  console.log("✅ Connect Server");
});
// express Server에게 메시지 받기 📨
connectionServer.addEventListener("message", (msg) => {
  const li = document.createElement("li");
  li.innerText = msg.data;
  chatList.append(li);
});
// express Server과 연결이 끊겼을 때 ❌
connectionServer.addEventListener("close", (socket) => {
  console.log("끊겼습니다.");
});
