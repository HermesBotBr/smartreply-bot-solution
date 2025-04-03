
// Configuração centralizada das chaves VAPID para push notifications
// Essas chaves devem ser as mesmas no frontend e no backend

export const VAPID_KEYS = {
  publicKey: 'BPdifDqItbFmUtgI1PjwhcwjQUKXUZDFYFX95rBC9K6_NlAjMkhoVbKd2Ivm8f5rHUYFfMC4tvxaMtbovaTJr6A',
  privateKey: 'C_Af9nEg6Gjlwp14KHEI8ftl8FcjpWA4HZF5GMFMr5w'
};

// Exportar a chave pública para uso no frontend
export const PUBLIC_VAPID_KEY = VAPID_KEYS.publicKey;
