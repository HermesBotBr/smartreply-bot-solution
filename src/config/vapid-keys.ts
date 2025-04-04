
// Configuração centralizada das chaves VAPID para push notifications
// Essas chaves devem ser as mesmas no frontend e no backend

export const VAPID_KEYS = {
  publicKey: 'BKn2JKQCh-yQod3HLXVIAKvjmrgPLGexdNGSv9SNXM4HbWbu6J7pg1Z0pvdvQn2YZQeWx-AYDnAkGL2rFE8fnpM',
  privateKey: 'C_Af9nEg6Gjlwp14KHEI8ftl8FcjpWA4HZF5GMFMr5w'
};

// Exportar a chave pública para uso no frontend
export const PUBLIC_VAPID_KEY = VAPID_KEYS.publicKey;
export default VAPID_KEYS;
