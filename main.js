async function generateImage() {
  const flower = document.getElementById("flowerInput").value.trim();
  const jellyfish = document.getElementById("jellyfishInput").value.trim();

  if (!flower || !jellyfish) {
    alert("请填写完整的提示词！");
    return;
  }

  document.getElementById("loading").style.display = "flex";
  document.getElementById("resultImage").style.display = "none";

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flower, jellyfish })
    });

    const result = await response.json();
    document.getElementById("loading").style.display = "none";

    if (result.error) {
      console.error("生成失败：", result.error);
      alert("生成失败，请重试！");
    } else {
      // 获取生成的图像 UUID
      const generateUuid = result.generateUuid;

      // 根据 UUID 请求生成的图像
      const imageResponse = await fetch(`/api/generate-image?generateUuid=${generateUuid}`);
      const imageUrl = await imageResponse.json();

      if (imageUrl.error) {
        console.error("获取图像失败：", imageUrl.error);
        alert("获取图像失败，请重试！");
      } else {
        // 显示生成的图像
        const image = document.getElementById("resultImage");
        image.src = imageUrl.imageUrl; // 设置图片的 URL
        image.style.display = "block"; // 显示图片
      }
    }
  } catch (error) {
    document.getElementById("loading").style.display = "none";
    console.error("生成请求失败：", error);
    alert("生成请求失败，请稍后再试！");
  }
}
