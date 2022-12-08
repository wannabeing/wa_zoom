const connectionServer = io();

// Conatiner
const formContainer = document.querySelector(".formContainer"); // [form Container]
const showing = document.querySelector(".showing"); // [showing Container]
const loadingContainer = document.querySelector(".loading"); // [loading Container]
const btnContainer = document.querySelector(".btnContainer");

const myForm = formContainer.querySelector("form"); // [form]
const myInput = myForm.querySelector("input"); // [input]
const myVideo = showing.querySelector("video"); // [video]
const mySelect = showing.querySelector("select"); // [select]
const muteBtn = btnContainer.querySelector("#muteBtn"); // [btn]
const camBtn = btnContainer.querySelector("#camBtn"); // [btn]

let myStream; // [myStream]: video,audio가 결합된 정보
let myPeer; // [myPeer]: 상대방에게 전달할 나의 스트림 정보
let roomName; // [roomName]: 채팅방 이름
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
  showing.style.display = "flex";
  await getStream();
  setWebRTC();
}

// 🖱 [click] 음소거 버튼 클릭
muteBtn.addEventListener("click", () => {
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
  await getStream(mySelect.value);
});

// 🖱 [loading] 로딩 컴포넌트 함수
function setLoaded() {
  loadingContainer.style.display = "inline";
}
function setCompleted() {
  loadingContainer.style.display = "none";
}

/*
    -------------- 🌟 socketIO --------------
*/

// 🖱 [submit] 채팅방 폼 제출
myForm.addEventListener("submit", (event) => {
  event.preventDefault();
  // ✅ socketIO START
  connectionServer.emit("entered", myInput.value, setShowing);
  roomName = myInput.value;
  myInput.value = "";
});
// 🖱 [otehrEntered]: 다른사람이 입장했을 때
connectionServer.on("otherEntered", async () => {
  const myOffer = await myPeer.createOffer(); // [myOffer]: 다른사람에게 보낼 초대장
  myPeer.setLocalDescription(myOffer);
  // 🖱 [sendOffer]: 상대에게 오퍼 전송
  connectionServer.emit("sendOffer", myOffer, roomName);
});
// 🖱 [getOffer]: 상대의 오퍼 받기
connectionServer.on("getOffer", (receivedOffer) => {
  console.log(receivedOffer);
});

/*
    -------------- 🌟 webRTC --------------
*/
function setWebRTC() {
  myPeer = new RTCPeerConnection();
  // 브라우저에 나의 스트림정보 추가
  myStream.getTracks().forEach((track) => {
    myPeer.addTrack(track, myStream);
  });
}
