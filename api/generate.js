async function generateImage() {
  const flower = document.getElementById("flowerInput").value.trim();
  const jellyfish = document.getElementById("jellyfishInput").value.trim();

  if (!flower || !jellyfish) {
    alert("请输入花和水母的提示词！");
    return;
  }

  document.getElementById("loading").style.display = "flex";
  document.getElementById("resultImage").style.display = "none";

  const requestBody = {
    templateUuid: "4df2efa0f18d46dc9758803e478eb51c",
    generateParams: {
      "63": {
        class_type: "CLIPTextEncode",
        inputs: {
          text: jellyfish
        }
      },
      "65": {
        class_type: "CLIPTextEncode",
        inputs: {
          text: flower
        }
      },
      workflowUuid: "5f7cf756fd804deeac558322dc5bd813"
    }
  };

  const response = await fetch("https://openapi.liblibai.cloud/api/generate/comfyui/app", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "AccessKey": "NRXABtFaq2nlj-fRV4685Q",
      "SecretKey": "VnS-NP3SKlOgws0zGW8OfkpOm-vohzvf"
    },
    body: JSON.stringify(requestBody)
  });

  const result = await response.json();
  if (result.code !== 0) {
    alert("生成失败：" + result.msg);
    document.getElementById("loading").style.display = "none";
    return;
  }

  const generateUuid = result.data.generateUuid;
  checkStatus(generateUuid);
}

async function checkStatus(generateUuid) {
  let tries = 0;
  const interval = setInterval(async () => {
    tries++;
    const res = await fetch("https://openapi.liblibai.cloud/api/generate/comfy/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "AccessKey": "NRXABtFaq2nlj-fRV4685Q",
        "SecretKey": "VnS-NP3SKlOgws0zGW8OfkpOm-vohzvf"
      },
      body: JSON.stringify({ generateUuid })
    });

    const result = await res.json();
    if (result.code === 0 && result.data.generateStatus === 5) {
      clearInterval(interval);
      const imgUrl = result.data.images[0].imageUrl;
      const img = document.getElementById("resultImage");
      img.src = imgUrl;
      img.style.display = "block";
      img.style.opacity = 0;
      setTimeout(() => img.style.opacity = 1, 50);
      document.getElementById("loading").style.display = "none";
    }

    if (tries >= 20) {
      clearInterval(interval);
      alert("生成超时，请稍后再试。");
      document.getElementById("loading").style.display = "none";
    }
  }, 3000);
}
