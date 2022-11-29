// socketIO 사용하는 서버와 연결
const connectionServer = io();

// 닉네임 변수
const nameForm = document.querySelector("#nameForm");
const nameInput = nameForm.querySelector("input");
const useNameBtn = nameForm.querySelector("#useNameBtn");
const editNameBtn = nameForm.querySelector("#editNameBtn");

// 대기실 변수
const waitingRoom = document.querySelector("#waitingRoom");
const enterForm = waitingRoom.querySelector("form");
const enterInput = enterForm.querySelector("input");

// 채팅방 변수
const chatRoom = document.querySelector("#chatRoom");
const chatForm = chatRoom.querySelector("form");
const chatInput = chatForm.querySelector("input");
const chatDiv = document.querySelector("#chatDiv"); // ul태그 감싼 div

// 🚀 닉네임 폼 submit 이벤트
nameForm.addEventListener("submit", (event) => {
  event.preventDefault();
  waitingRoom.style.display = "inline-block";

  connectionServer.emit("setName", nameInput.value, () => {
    nameInput.disabled = true;
    useNameBtn.style.display = "none";
    editNameBtn.style.display = "inline-block";
  });
});
/* 닉네임 수정 이벤트 (수정 필요)
editNameBtn.addEventListener("click", (event) => {
  event.preventDefault();

  nameInput.disabled = false;
  useNameBtn.style.display = "inline-block";
  editNameBtn.style.display = "none";
});
*/
// 🚀 대기실 폼 submit 이벤트: 대기실 -> 채팅방 입장 함수
enterForm.addEventListener("submit", (event) => {
  event.preventDefault();

  connectionServer.emit("enterRoom", enterInput.value, (roomName) => {
    chatRoom.style.display = "inline-block";
    waitingRoom.style.display = "none";

    document.querySelector("#roomTitle").innerText = `채팅방: ${roomName}`;
  });
});
// 🚀 채팅방 폼 usbmit 이벤트: 채팅방 채팅 함수
chatForm.addEventListener("submit", (event) => {
  event.preventDefault();

  connectionServer.emit(
    "sendChat",
    chatInput.value,
    enterInput.value,
    (msg) => {
      addMyMsg(msg);
    }
  );
  chatInput.value = "";
  chatInput.focus();
});

/* 
    🚀 socketIO 함수
    - welcomeMsg : 입장 알림
    - byeMsg : 퇴장 알림
    - sendChat : 채팅 입력
    - editName : 닉네임 변경 알림
*/
connectionServer.on("welcomeMsg", (name) => {
  addMsg(`${name}님이 입장하셨습니다.`);
});
connectionServer.on("byeMsg", (name) => {
  addMsg(`${name}님이 퇴장하셨습니다.`);
});
connectionServer.on("sendChat", (msg, name) => {
  addMsg(`[${name}]: ${msg}`);
});
connectionServer.on("editNameMsg", (prevName, editName) => {
  addMsg(`${prevName} -> ${editName} 이름변경`);
});
/*
    🚀 공통함수
        - addMsg() : 채팅 추가 함수
        - addMyMsg() : 나의 채팅 추가 함수
*/
function addMsg(msg) {
  const chatList = chatRoom.querySelector("ul");
  const chat = document.createElement("li");
  chat.innerText = msg;
  chatList.appendChild(chat);
  chatDiv.scrollTop = chatDiv.scrollHeight; // 채팅 스크롤 항상 아래로
}
function addMyMsg(msg) {
  const chatList = chatRoom.querySelector("ul");
  const chat = document.createElement("li");
  chat.id = "myMsg";
  chat.innerText = msg;
  chatList.appendChild(chat);
  chatDiv.scrollTop = chatDiv.scrollHeight; // 채팅 스크롤 항상 아래로
}
