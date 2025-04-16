async function generateImage() {
  const flower = document.getElementById("flowerInput").value.trim();
  const jellyfish = document.getElementById("jellyfishInput").value.trim();

  if (!flower || !jellyfish) {
    alert("请填写完整的提示词！");
    return;
  }

  // 显示加载动画
  document.getElementById("loading").style.display = "flex";
  document.getElementById("resultImage").style.display = "none";

  try {
    // 发送生成请求
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flower, jellyfish })
    });

    const result = await response.json();
    document.getElementById("loading").style.display = "none"; // 隐藏加载动画

    if (result.error) {
      console.error("生成失败：", result.error);
      alert("生成失败，请重试！");
    } else {
      // 获取生成图像的 UUID
      const generateUuid = result.generateUuid;

      // 查询图像状态直到成功
      let imageReady = false;
      let retryCount = 0;
      const maxRetries = 10;
      const waitTime = 3000; // 每3秒检查一次

      while (!imageReady && retryCount < maxRetries) {
        const imageResponse = await fetch(`/api/generate-image?generateUuid=${generateUuid}`);
        const imageStatus = await imageResponse.json();

        if (imageStatus.error) {
          console.error("获取图像失败：", imageStatus.error);
          alert("获取图像失败，请重试！");
          break;
        } else if (imageStatus.imageUrl) {
          // 如果图像生成成功，显示图像
          const image = document.getElementById("resultImage");
          image.src = imageStatus.imageUrl;
          image.style.display = "block"; // 显示图像
          imageReady = true;
        } else {
          // 如果图像未准备好，继续重试
          retryCount++;
          console.log(`重试 ${retryCount}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, waitTime)); // 等待3秒
        }
      }

      // 如果重试次数超过最大次数，提示失败
      if (!imageReady) {
        alert("图像生成超时，请稍后再试！");
      }
    }
  } catch (error) {
    document.getElementById("loading").style.display = "none";
    console.error("生成请求失败：", error);
    alert("生成请求失败，请稍后再试！");
  }
}
