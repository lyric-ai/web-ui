function generateSignature() {
    const AccessKey = "NRXABtFaq2nlj-fRV4685Q";
    const SecretKey = "VnS-NP3SKlOgws0zGW8OfkpOm-vohzvf";
    const Timestamp = Date.now().toString();
    const SignatureNonce = Math.random().toString(36).substring(2, 15);
    const rawString = `AccessKey=${AccessKey}&SecretKey=${SecretKey}&Timestamp=${Timestamp}&SignatureNonce=${SignatureNonce}`;
    const Signature = btoa(rawString).replace(/=+$/, ''); // 模拟签名，真实环境应使用后端生成
    return { AccessKey, Signature, Timestamp, SignatureNonce };
}