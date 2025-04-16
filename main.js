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
      const image = document.getElementById("resultImage");
      image.src = result.imageUrl;
      image.style.display = "block";
    }
  } catch (error) {
    document.getElementById("loading").style.display = "none";
    console.error("生成请求失败：", error);
    alert("生成请求失败，请稍后再试！");
  }
}
