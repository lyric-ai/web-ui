async function generateImage() {
  const flower = document.getElementById("flowerInput").value.trim();
  const jellyfish = document.getElementById("jellyfishInput").value.trim();

  if (!flower || !jellyfish) {
    alert("请填写完整的提示词！");
    return;
  }

  document.getElementById("loading").style.display = "block";
  document.getElementById("resultImage").style.display = "none";

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flower, jellyfish })
    });

    const result = await response.json();
    document.getElementById("loading").style.display = "none";

    if (result.imageUrl) {
      const image = document.getElementById("resultImage");
      image.src = result.imageUrl;
      image.style.display = "block";
    } else {
      alert("生成失败！");
      console.error(result);
    }
  } catch (err) {
    document.getElementById("loading").style.display = "none";
    alert("生成请求失败！");
    console.error("生成请求失败：", err);
  }
}
