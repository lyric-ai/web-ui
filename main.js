async function generateImage() {
  // 获取输入框中的内容
  const flower = document.getElementById("flowerInput").value.trim();
  const jellyfish = document.getElementById("jellyfishInput").value.trim();

  // 检查输入是否为空
  if (!flower || !jellyfish) {
    alert("请填写完整的提示词！");
    return;
  }

  // 显示加载动画
  document.getElementById("loading").style.display = "flex";
  document.getElementById("resultImage").style.display = "none"; // 隐藏图像

  try {
    // 发送 POST 请求到后端的 /api/generate 接口
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flower, jellyfish })
    });

    // 解析返回的 JSON 数据
    const result = await response.json();

    // 隐藏加载动画
    document.getElementById("loading").style.display = "none";

    // 检查生成是否成功
    if (result.error) {
      console.log("生成失败：", result.error);
      alert("生成失败，请重试！");
    } else {
      const imageUrl = result.generateUuid;  // 获取生成的图像 UUID（假设返回的是 UUID）

      // 将生成的图像 URL 设置为结果图像的 src
      const image = document.getElementById("resultImage");
      image.src = `https://your-image-url/${imageUrl}`; // 使用适当的图像 URL 地址
      image.style.display = "block"; // 显示图像
    }
  } catch (error) {
    // 隐藏加载动画
    document.getElementById("loading").style.display = "none";
    console.error("生成请求失败：", error);
    alert("生成请求失败，请稍后再试！");
  }
  const response = await fetch(generateUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(requestBody),
});

const result = await response.json();
console.log("生成请求返回的数据：", result);  // 打印返回的数据

if (result.code !== 0) {
  console.error("生成请求失败，错误信息：", result);
  return res.status(500).json({ error: "生成失败：" + result.msg });
}

}
