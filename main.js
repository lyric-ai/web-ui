async function generateImage() {
  const flower = document.getElementById("flowerInput").value.trim();
  const jellyfish = document.getElementById("jellyfishInput").value.trim();

  // 显示“生成中，请稍候”
  const loadingEl = document.getElementById("loading");
  loadingEl.style.display = "block";

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flower, jellyfish })
    });

    const text = await response.text();

    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      alert("服务器返回了非 JSON 内容，可能出错了：\n" + text);
      loadingEl.style.display = "none";
      return;
    }

    if (!response.ok || result.error) {
      alert("生成失败：" + (result?.error || "未知错误"));
      loadingEl.style.display = "none";
      return;
    }

    console.log("生成成功，UUID:", result.generateUuid);
    alert("生成成功，UUID: " + result.generateUuid);

  } catch (err) {
    console.error("请求异常：", err);
    alert("发生错误：" + err.message);
  } finally {
    loadingEl.style.display = "none";
  }
}
