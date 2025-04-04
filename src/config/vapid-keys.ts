
// Configuração centralizada das chaves VAPID para push notifications
// Essas chaves devem ser as mesmas no frontend e no backend

export const VAPID_KEYS = {
  publicKey: 'BG8J-PHbRd2rvyen2PBFpSRu4X-NgGWxTu-l1B2ihuL1FFezmKZsaXizsWC69liXaRTnYXtkjHXFDlC4A8h0FwI',
  privateKey: 'Rcy3ZpFjpm5CpVaNfgjf7zE_HfrXFChj8M6Pxkk7aRs'
};

// Exportar a chave pública para uso no frontend
export const PUBLIC_VAPID_KEY = VAPID_KEYS.publicKey;
export default VAPID_KEYS;
