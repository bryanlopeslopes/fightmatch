// Funções de autenticação com Firebase Auth
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, firebaseConfigurado } from './firebase';

const validarConfiguracaoFirebase = () => {
  if (!firebaseConfigurado) {
    const erro = new Error('Configure as variáveis EXPO_PUBLIC_FIREBASE no arquivo .env.');
    erro.code = 'app/firebase-config-missing';
    throw erro;
  }
};

// Cadastrar novo usuário
export const cadastrarUsuario = async (email, senha, dadosPerfil) => {
  validarConfiguracaoFirebase();
  // 1. Cria conta no Firebase Auth
  const resultado = await createUserWithEmailAndPassword(auth, email, senha);
  const uid = resultado.user.uid;

  // 2. Salva perfil no Firestore
  await setDoc(doc(db, 'lutadores', uid), {
    uid,
    email,
    ...dadosPerfil,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });

  return resultado.user;
};

// Login
export const login = async (email, senha) => {
  validarConfiguracaoFirebase();
  const resultado = await signInWithEmailAndPassword(auth, email, senha);
  return resultado.user;
};

// Logout
export const logout = async () => {
  await signOut(auth);
};

// Ouvir mudanças de autenticação (login/logout automático)
export const ouvirAuth = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Buscar dados do usuário logado
export const buscarPerfil = async (uid) => {
  const snap = await getDoc(doc(db, 'lutadores', uid));
  if (snap.exists()) return snap.data();
  return null;
};
