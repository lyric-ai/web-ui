async function generateImage() {
  // 调用你的 vercel 部署的代理 API
  const flower = document.getElementById("flowerInput").value.trim();
  const jellyfish = document.getElementById("jellyfishInput").value.trim();

  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ flower, jellyfish })
  });

  const result = await response.json();
  console.log(result);
}
