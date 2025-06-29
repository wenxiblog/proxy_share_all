const defaultPassword = "admin";

function checkLogin() {
  const input = document.getElementById("password").value;
  if (input === defaultPassword) {
    document.getElementById("login-box").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    loadIPList();
    loadLog();
  } else {
    document.getElementById("login-error").innerText = "密码错误";
  }
}

function logout() {
  document.getElementById("dashboard").style.display = "none";
  document.getElementById("login-box").style.display = "block";
}

function addIP() {
  const ip = document.getElementById("ipInput").value;
  if (!ip) return;
  let list = JSON.parse(localStorage.getItem("blacklist") || "[]");
  list.push(ip);
  localStorage.setItem("blacklist", JSON.stringify(list));
  loadIPList();
  document.getElementById("ipInput").value = "";
}

function loadIPList() {
  const list = JSON.parse(localStorage.getItem("blacklist") || "[]");
  const ul = document.getElementById("ipList");
  ul.innerHTML = "";
  list.forEach((ip, i) => {
    const li = document.createElement("li");
    li.innerHTML = ip + ' <button onclick="removeIP(' + i + ')">移除</button>';
    ul.appendChild(li);
  });
}

function removeIP(index) {
  let list = JSON.parse(localStorage.getItem("blacklist") || "[]");
  list.splice(index, 1);
  localStorage.setItem("blacklist", JSON.stringify(list));
  loadIPList();
}

function testWorker() {
  const file = document.getElementById("fileInput").value;
  const key = document.getElementById("keyInput").value;
  const worker = document.getElementById("workerInput").value;
  const url = `${worker}?file=${file}&key=${key}`;

  fetch(url)
    .then(res => res.text())
    .then(data => {
      log(`测试成功: ${file}`);
      document.getElementById("resultBox").innerText = data;
    })
    .catch(err => {
      log(`测试失败: ${err}`);
      document.getElementById("resultBox").innerText = "请求失败: " + err;
    });
}

function log(msg) {
  let logs = JSON.parse(localStorage.getItem("logs") || "[]");
  logs.unshift(`[${new Date().toLocaleString()}] ${msg}`);
  if (logs.length > 50) logs.pop();
  localStorage.setItem("logs", JSON.stringify(logs));
  loadLog();
}

function loadLog() {
  const logs = JSON.parse(localStorage.getItem("logs") || "[]");
  const ul = document.getElementById("logList");
  ul.innerHTML = "";
  logs.forEach(item => {
    const li = document.createElement("li");
    li.innerText = item;
    ul.appendChild(li);
  });
}
