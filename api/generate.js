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

  // 发送请求到API服务器
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

  let tries = 0;
  const maxRetries = 5; // 设置最多重试5次
  const intervalTime = 5000; // 每次重试等待5秒

  async function checkGenerationStatus() {
    tries++;
    if (tries > maxRetries) {
      alert("生成任务超时，请稍后再试。");
      document.getElementById("loading").style.display = "none";
      return;
    }

    // 发送请求获取生成状态
    const statusResponse = await fetch("/api/generate/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ generateUuid })
    });

    const statusResult = await statusResponse.json();
    if (statusResult.code === 0 && statusResult.data.generateStatus === 5) {
      // 如果生成完成，显示图片
      const imgUrl = statusResult.data.images[0].imageUrl;
      const img = document.getElementById("resultImage");
      img.src = imgUrl;
      img.style.display = "block";
      img.style.opacity = 0;
      setTimeout(() => img.style.opacity = 1, 50);
      document.getElementById("loading").style.display = "none";
    } else {
      // 如果生成未完成，等待5秒后重试
      setTimeout(checkGenerationStatus, intervalTime);
    }
  }

  checkGenerationStatus();
}
