export interface WxconfigVo {
    appId: string, // 必填，企业微信的corpID
    timestamp: string, // 必填，生成签名的时间戳
    nonceStr: string, // 必填，生成签名的随机串
    signature: string,// 必填，签名，见 附录-JS-SDK使用权限签名算法
}