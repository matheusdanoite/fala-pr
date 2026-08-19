import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, signInAnonymously, onAuthStateChanged, browserSessionPersistence, setPersistence } from 'firebase/auth';

// ─── Demo Mode ─────────────────────────────────────────────
// Ativado automaticamente quando as variáveis de ambiente do Firebase
// não estão definidas. Permite navegação completa sem backend.
export const DEMO_MODE = !import.meta.env.VITE_FIREBASE_API_KEY;

let app, db, storage, auth;

if (!DEMO_MODE) {
  // Todas as chaves são carregadas via variáveis de ambiente (.env)
  // para evitar exposição no código-fonte versionado.
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };

  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);
} else {
  console.info('🎭 Modo Demo ativo — navegação sem Firebase');
  db = null;
  storage = null;
  auth = null;
}

export { db, storage, auth };

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

/**
 * Garante que o usuário está autenticado (anonimamente para cidadãos).
 * Necessário para que as Firestore Security Rules bloqueiem
 * acessos não-autenticados (scripts, scraping).
 * 
 * Se já existe um user (anônimo ou Google), retorna imediatamente.
 * Se não, faz sign-in anônimo e aguarda a sessão ser estabelecida.
 * 
 * Em DEMO_MODE, retorna um user mock imediatamente.
 * 
 * @returns {Promise<import('firebase/auth').User>} O user autenticado
 */
export function ensureAuth() {
  // Em modo demo, retorna um user mock
  if (DEMO_MODE) {
    return Promise.resolve({
      uid: 'demo-user-001',
      isAnonymous: true,
      email: null,
    });
  }

  return new Promise((resolve, reject) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      resolve(currentUser);
      return;
    }

    // Aguardar possível restauração de sessão
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        // Nenhuma sessão — fazer sign-in anônimo
        signInAnonymously(auth)
          .then((cred) => resolve(cred.user))
          .catch(reject);
      }
    });
  });
}
