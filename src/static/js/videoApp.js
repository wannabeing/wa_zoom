const connectionServer = io();

const selectedVideo = document.querySelector("#selectedVideo");
const streamVideo = document.querySelector("#streamVideo");
const muteBtn = document.querySelector("#muteBtn");
const camBtn = document.querySelector("#camBtn");

let streamInfo;
let muteStatus = true; // default : 음소거 ON
let camStatus = false; // default : 캠 OFF

// 1. 유저 정보 얻기
async function getStreamInfo() {
  try {
    streamInfo = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: true,
    });
    streamVideo.srcObject = streamInfo;
    await getCamsInfo(); // 2번 실행
  } catch (error) {
    console.log(error);
  }
}
// 2.
async function getCamsInfo() {
  try {
    const allDevicesInfo = await navigator.mediaDevices.enumerateDevices(); // 모든 비디오/오디오 정보
    // 모든 비디오 정보
    const camsInfo = allDevicesInfo.filter(
      (deviceInfo) => deviceInfo.kind === "videoinput"
    );
    // 유저가 비디오를 선택할 수 있게 비디오 옵션 렌더링
    camsInfo.forEach((camInfo) => {
      const optionVideo = document.createElement("option");
      optionVideo.value = camInfo.deviceId;
      optionVideo.innerText = camInfo.label;
      selectedVideo.appendChild(optionVideo);
    });
    console.log(camsInfo);
  } catch (error) {
    console.log(error);
  }
}

muteBtn.addEventListener("click", () => {
  // 노트북or휴대폰 모든 오디오 mute/unmute
  streamInfo.getAudioTracks().forEach((audio) => {
    audio.enable = !audio.enable;
  });

  // btnText, status 설정
  if (muteStatus) {
    muteStatus = false;
    muteBtn.innerText = "음소거 풀기";
  } else {
    muteStatus = true;
    muteBtn.innerText = "음소거";
  }
});

camBtn.addEventListener("click", async () => {
  if (camStatus) {
    // 노트북or휴대폰 모든 비디오 off
    streamInfo.getVideoTracks().forEach((video) => {
      video.enabled = false;
    });

    camStatus = false;
    muteBtn.style.display = "none";
    camBtn.innerText = "카메라 켜기";
  } else {
    await getStreamInfo();

    // 노트북or휴대폰 모든 비디오 on
    streamInfo.getVideoTracks().forEach((video) => {
      video.enabled = true;
    });

    camStatus = true;
    muteBtn.style.display = "inline-block";
    camBtn.innerText = "카메라 끄기";
  }
});
