// socketIO 사용하는 서버와 연결
const connectionServer = io();

// 대기실 변수
const waitingRoom = document.querySelector("#waitingRoom");
const enterForm = waitingRoom.querySelector("form");
const enterInput = enterForm.querySelector("input");

// 채팅방 변수
const chatRoom = document.querySelector("#chatRoom");

/*
    🚀 대기실 -> 채팅방 입장 함수
*/
enterForm.addEventListener("submit", (event) => {
  event.preventDefault();

  /*
    🚀 Server에게 채팅방 이름 전달 함수
  */
  connectionServer.emit("enterRoom", enterInput.value, (roomName) => {
    chatRoom.style.display = "inline-block";
    waitingRoom.style.display = "none";

    document.querySelector("#roomTitle").innerText = `ROOM: ${roomName}`;
  });
  enterInput.value = "";
});
