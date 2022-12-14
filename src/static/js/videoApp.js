const connectionServer = io();

// Conatiner
const formContainer = document.querySelector(".formContainer"); // [form Container]
const peerContainer = document.querySelector("#peerContainer"); // [peer Container]
const loadingContainer = document.querySelector(".loading"); // [loading Container]
const btnContainer = document.querySelector(".btnContainer"); // [button Container]
const chatContainer = document.querySelector("#chatContainer"); // [chatting Container]

const myForm = formContainer.querySelector("form"); // [form]
const myInput = myForm.querySelector("input"); // [input]
const myVideo = peerContainer.querySelector("#myVideo"); // [video]
const mySelect = peerContainer.querySelector("select"); // [select]
const muteBtn = btnContainer.querySelector("#muteBtn"); // [btn]
const camBtn = btnContainer.querySelector("#camBtn"); // [btn]
const chatRoom = chatContainer.querySelector("#chatRoom"); // [div]
const chatForm = chatContainer.querySelector("form"); // [form]
const chatInput = chatContainer.querySelector("input"); // [input]
const chatBtn = chatContainer.querySelector("button"); // [btn]

/** @type {RTCPeerConnection} */
let myPeer; // [myPeer]: 상대방에게 전달할 나의 스트림 정보

let myDataChannel;
let myStream; // [myStream]: video,audio가 결합된 정보
let roomName; // [roomName]: 채팅방 이름 저장
let muteState = false; // [default]: audio unmuted
let camState = true; // [default]: camera on

// 🚀 [fn] 유저 모든 카메라 정보 얻기
async function getOptionCams() {
  try {
    const allDevices = await navigator.mediaDevices.enumerateDevices(); // all of video, audio
    const allCameras = allDevices.filter(
      (device) => device.kind === "videoinput"
    );
    const currentCamera = myStream.getVideoTracks()[0];
    allCameras.forEach((camera) => {
      const myOption = document.createElement("option");
      myOption.value = camera.deviceId;
      myOption.innerText = camera.label;
      if (currentCamera.label === camera.label) {
        myOption.selected = true;
      }
      mySelect.appendChild(myOption);
    });
  } catch (error) {
    console.log(error);
  }
}
// 🚀 [fn] 유저 스트림 정보 얻기
async function getStream(deviceId) {
  try {
    // 처음 캠 켰을 때
    const initSet = {
      audio: true,
      video: true,
    };
    // 다른 캠 선택했을 때
    const idSet = {
      audio: true,
      video: { deviceId: { exact: deviceId } },
    };
    setLoaded(); // 👨🏻‍💻 LOADING ...
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? idSet : initSet
    );
    // 비디오 태그에 paint
    myVideo.srcObject = myStream;
    // 다른캠 선택했을 때는 옵션 캠 찾는 함수 실행 X
    if (!deviceId) {
      await getOptionCams();
    }
    setCompleted(); // ✅ COMPLTED !
  } catch (error) {
    console.log(error);
  }
}
// 🚀 [fn] 폼 숨기고, 쇼 컨테이너 보여주기 & 유저 스트림 정보 얻기 & webRTC 설정
async function setShowing() {
  formContainer.style.display = "none";
  document.querySelectorAll(".showing").forEach((showing) => {
    showing.style.display = "flex";
  });
  await getStream();
  setWebRTC();
}

// 🖱 [click] 음소거 버튼 클릭
muteBtn.addEventListener("click", () => {
  console.log(myStream.getAudioTracks());
  myStream.getAudioTracks().forEach((audio) => {
    audio.enabled = !audio.enabled;
  });
  if (!muteState) {
    muteBtn.src = "static/images/unmute-icon.png";
    muteBtn.innerText = "음소거 해제";
    muteBtn.style.border = "2px solid #0E8BEE";
    muteState = true;
  } else {
    muteBtn.src = "static/images/mute-icon.png";
    muteBtn.innerText = "음소거";
    muteBtn.style.border = "2px solid black";
    muteState = false;
  }
});
// 🖱 [click] 카메라 버튼 클릭
camBtn.addEventListener("click", () => {
  myStream.getVideoTracks().forEach((video) => {
    video.enabled = !video.enabled;
  });
  if (!camState) {
    camBtn.src = "static/images/cam-off.png";
    camBtn.innerText = "카메라 켜기";
    camBtn.style.border = "2px solid black";
    camState = true;
  } else {
    camBtn.src = "static/images/cam-on.png";
    camBtn.innerText = "카메라 끄기";
    camBtn.style.border = "2px solid #0E8BEE";
    camState = false;
  }
});
// 🖱 [click] 카메라 변경 버튼 클릭
mySelect.addEventListener("input", async () => {
  await getStream(mySelect.value); // 선택한 비디오 정보로 변경

  // 상대방과 연결이 되어 있다면
  if (myPeer) {
    const selectedVideo = myStream.getVideoTracks()[0]; // [selectedVideo]: 내가 선택한 비디오 정보
    const videoSender = myPeer
      .getSenders()
      .find((sender) => sender.track.kind === "video"); // [videoSender]: 상대방 화면에서 보이는 나의 비디오 정보
    // 상대방화면의 나의 비디오 정보 변경
    videoSender.replaceTrack(selectedVideo);
  }
});
// 🖱 [click] 메시지 전송 버튼 클릭
chatBtn.addEventListener("click", (event) => {
  event.preventDefault();

  chatInput.value = "";
});
// 🖱 [loading] 로딩 컴포넌트 함수
function setLoaded() {
  loadingContainer.style.display = "inline";
}
function setCompleted() {
  loadingContainer.style.display = "none";
}

function sendChat(msg, who) {
  console.log(who);
  const chatSpan = document.createElement("span");
  chatSpan.classList.add("myChat");
  chatSpan.innerText = msg;
  chatRoom.appendChild(chatSpan);
}
function receivedChat(msg, who) {
  console.log(who);
  const chatSpan = document.createElement("span");
  chatSpan.classList.add("peerChat");
  chatSpan.innerText = msg;
  chatRoom.appendChild(chatSpan);
}

/*
    -------------- 🌟 socketIO --------------
*/
// 🖱 [submit] 채팅방 폼 제출
myForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  // 🖱 myStream 가져와서 myPeer에 저장
  await setShowing();
  // ✅ socketIO START
  connectionServer.emit("entered", myInput.value);
  roomName = myInput.value;
  myInput.value = "";
});

// ➡️ [A에서 실행 - otehrEntered]: 상대방(B)이 입장했을 때
connectionServer.on("otherEntered", async () => {
  myDataChannel = myPeer.createDataChannel("chat"); // [myDataChannel]: 상대방(B)과 소통할 데이터채널 생성
  myDataChannel.addEventListener("message", (event) => {
    console.log("send", event.data);
  });

  const myOffer = await myPeer.createOffer(); // [myOffer]: 상대방(B)에게 보낼 초대장
  console.log("send offer");
  myPeer.setLocalDescription(myOffer); // 나(A)의 오퍼를 세팅
  // ➡️ [sendOffer]: 내(A)가 상대방(B)에게 오퍼 전송
  connectionServer.emit("sendOffer", myOffer, roomName);
});

// ⬅️ [B에서 실행 - getOffer]: 내(B)가 상대방(A)의 오퍼 받기
connectionServer.on("getOffer", async (receivedOffer) => {
  myPeer.addEventListener("datachannel", (event) => {
    myDataChannel = event.channel;
    myDataChannel.addEventListener("message", (event) => {
      console.log(event.data);
    });
  });

  myPeer.setRemoteDescription(receivedOffer); // 상대방(A)에게 받은 오퍼를 나(B)에게 세팅
  console.log("get offer");
  const myAnswer = await myPeer.createAnswer(); // [myAnswer]: 상대방(A)에게 보낼 답장
  myPeer.setLocalDescription(myAnswer); // 나(B)의 답장을 세팅
  console.log("send answer");
  // ⬅️ [sendAnswer]: 내(B)가 상대방(A)에게 답장 전송
  connectionServer.emit("sendAnswer", myAnswer, roomName);
});

// ➡️ [A에서 실행 - getAnswer]: 내(A)가 상대방(B)의 답장 받기
connectionServer.on("getAnswer", (receivedAnswer) => {
  console.log("get answer");
  myPeer.setRemoteDescription(receivedAnswer); // 상대방(B)에게 받은 답장을 나(A)에게 세팅
});

// ❄️ [getIce] : 상대방의 소통방법(receivedIce)을 나(myPeer)에게 저장
connectionServer.on("getIce", (receivedIce) => {
  console.log("get icecandidate");
  myPeer.addIceCandidate(receivedIce);
});

/*
    -------------- 🌟 webRTC --------------
*/
function setWebRTC() {
  myPeer = new RTCPeerConnection({
    iceServers: [
      { urls: ["stun:ntk-turn-1.xirsys.com"] },
      {
        username:
          "Bq_h0nI-LRmH5C5Dn8d7S_aIj6JPbVkDRfZmBmd73lsfIKSVrJiN99hlQ1T8boziAAAAAGOTQkxjaG9paHl1aw==",
        credential: "838ad558-77cb-11ed-b9b2-0242ac120004",
        urls: [
          "turn:ntk-turn-1.xirsys.com:80?transport=udp",
          "turn:ntk-turn-1.xirsys.com:3478?transport=udp",
          "turn:ntk-turn-1.xirsys.com:80?transport=tcp",
          "turn:ntk-turn-1.xirsys.com:3478?transport=tcp",
          "turns:ntk-turn-1.xirsys.com:443?transport=tcp",
          "turns:ntk-turn-1.xirsys.com:5349?transport=tcp",
        ],
      },
    ],
  });

  // ❄️ [sendIce] : 나의 소통방법(data.candidate)을 상대방에게 전송
  myPeer.addEventListener("icecandidate", (data) => {
    console.log("send icecandidate");
    connectionServer.emit("sendIce", data.candidate, roomName);
  });

  // 상대방과 연결 되었을 때 (상대의 스트림정보가 생겼을 때)
  myPeer.addEventListener("track", (peerData) => {
    console.log("연결!");
    const peerVideo = document.querySelector("#peerVideo");
    peerVideo.srcObject = peerData.streams[0];
  });

  // myPeer에 나의 스트림정보 추가
  myStream.getTracks().forEach((track) => {
    myPeer.addTrack(track, myStream);
  });
}
