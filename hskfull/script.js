const chatBox = document.getElementById("chat-box");
const startBtn = document.getElementById("startBtn");
const levelSelect = document.getElementById("level");
const recordBtn = document.getElementById("recordBtn");
const listenBtn = document.getElementById("listenBtn");

let mediaRecorder;
let audioChunks = [];
let audioURL;
let vocab = [];
let currentLevel = 1;

const HSK_DATA = {
  1: "https://raw.githubusercontent.com/nhtars/hsk-dataset/main/data/hsk1.json",
  2: "https://raw.githubusercontent.com/nhtars/hsk-dataset/main/data/hsk2.json",
  3: "https://raw.githubusercontent.com/nhtars/hsk-dataset/main/data/hsk3.json",
  4: "https://raw.githubusercontent.com/nhtars/hsk-dataset/main/data/hsk4.json",
  5: "https://raw.githubusercontent.com/nhtars/hsk-dataset/main/data/hsk5.json",
  6: "https://raw.githubusercontent.com/nhtars/hsk-dataset/main/data/hsk6.json"
};

async function loadVocab(level) {
  vocab = [];
  for (let i = 1; i <= level; i++) {
    const res = await fetch(HSK_DATA[i]);
    const data = await res.json();
    vocab.push(...data);
  }
}

function appendMessage(hanzi, pinyin = "", meaning = "", sender = "ai") {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.innerHTML = `<div class="hanzi">${hanzi}</div>
                   <div class="pinyin">${pinyin}</div>
                   <div class="meaning">${meaning}</div>`;
  msg.querySelector(".hanzi").addEventListener("click", () => {
    msg.querySelector(".pinyin").style.display =
      msg.querySelector(".pinyin").style.display === "none" ? "block" : "none";
    msg.querySelector(".meaning").style.display =
      msg.querySelector(".meaning").style.display === "none" ? "block" : "none";
  });
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function aiRespond() {
  const random = vocab[Math.floor(Math.random() * vocab.length)];
  const sentence = `你觉得 "${random.simplified}" 这个词怎么样？`;
  appendMessage(sentence, random.pinyin, `Bạn nghĩ từ "${random.meaning}" thế nào?`);
  playChinese(sentence);
}

async function startConversation() {
  currentLevel = Number(levelSelect.value);
  appendMessage("加载中...", "Zàijiāzài...", "Đang tải dữ liệu...");
  await loadVocab(currentLevel);
  appendMessage("你好！我们来练习中文吧？", "Nǐ hǎo! Wǒmen lái liànxí Zhōngwén ba?", "Xin chào! Cùng luyện nói tiếng Trung nhé?");
  aiRespond();
}

recordBtn.onclick = async () => {
  if (!mediaRecorder) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = async () => {
      const blob = new Blob(audioChunks, { type: "audio/mp3" });
      audioChunks = [];
      audioURL = URL.createObjectURL(blob);
      appendMessage("🎤 Bạn vừa nói xong...", "", "", "user");
      checkPronunciation(blob);
    };
  }

  if (mediaRecorder.state === "inactive") {
    mediaRecorder.start();
    recordBtn.textContent = "⏹️ Dừng ghi";
  } else {
    mediaRecorder.stop();
    recordBtn.textContent = "🎙️ Ghi âm";
  }
};

listenBtn.onclick = () => {
  if (audioURL) new Audio(audioURL).play();
  else alert("Chưa có bản ghi âm!");
};

async function checkPronunciation(audioBlob) {
  const base64 = await blobToBase64(audioBlob);
  const res = await fetch("/api/realtime", {
    method: "POST",
    body: JSON.stringify({ audioBase64: base64 })
  });
  const data = await res.json();
  appendMessage(`🧾 ${data.feedback}`, "", "Phản hồi AI về phát âm", "ai");
}

function blobToBase64(blob) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.readAsDataURL(blob);
  });
}

async function playChinese(text) {
  const res = await fetch("/api/tts", {
    method: "POST",
    body: JSON.stringify({ text })
  });
  const audio = new Audio(URL.createObjectURL(await res.blob()));
  audio.play();
}

startBtn.onclick = startConversation;
