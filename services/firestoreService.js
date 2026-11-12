// Funções do Firestore para os 3 CRUDs

import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  serverTimestamp,
  addDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';

// ─────────────────────────────────────────────
// CRUD 1 — PERFIS DE LUTADORES
// ─────────────────────────────────────────────

// Atualizar perfil
export const atualizarPerfil = async (uid, dados) => {
  await updateDoc(doc(db, 'lutadores', uid), {
    ...dados,
    atualizadoEm: serverTimestamp(),
  });
};

// Buscar todos os lutadores (exceto o próprio usuário)
export const buscarLutadores = async (uidAtual) => {
  const snap = await getDocs(collection(db, 'lutadores'));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((l) => l.uid !== uidAtual);
};

// Buscar um lutador por uid
export const buscarLutadorPorId = async (uid) => {
  const snap = await getDoc(doc(db, 'lutadores', uid));
  if (snap.exists()) return { id: snap.id, ...snap.data() };
  return null;
};

// Deletar perfil
export const deletarPerfil = async (uid) => {
  await deleteDoc(doc(db, 'lutadores', uid));
};

// ─────────────────────────────────────────────
// CRUD 2 — MATCHES
// ─────────────────────────────────────────────

// Registrar um like (curtida)
export const darLike = async (uidQuemCurtiu, uidCurtido) => {
  const likeId = `${uidQuemCurtiu}_${uidCurtido}`;
  await setDoc(doc(db, 'likes', likeId), {
    de: uidQuemCurtiu,
    para: uidCurtido,
    criadoEm: serverTimestamp(),
  });

  // Verifica se o outro também curtiu (match mútuo)
  const likeInversoId = `${uidCurtido}_${uidQuemCurtiu}`;
  const likeInverso = await getDoc(doc(db, 'likes', likeInversoId));

  if (likeInverso.exists()) {
    // É um match! Cria o documento de match
    const matchId = [uidQuemCurtiu, uidCurtido].sort().join('_');
    await setDoc(doc(db, 'matches', matchId), {
      lutadores: [uidQuemCurtiu, uidCurtido],
      status: 'ativo',
      criadoEm: serverTimestamp(),
    });
    return true; // Retorna true = houve match
  }

  return false; // Sem match ainda
};

// Buscar todos os matches do usuário
export const buscarMatches = async (uid) => {
  const snap = await getDocs(
    query(collection(db, 'matches'), where('lutadores', 'array-contains', uid))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Atualizar status do match (ativo / bloqueado)
export const atualizarMatch = async (matchId, status) => {
  await updateDoc(doc(db, 'matches', matchId), { status });
};

// Desfazer match (deletar)
export const deletarMatch = async (matchId) => {
  await deleteDoc(doc(db, 'matches', matchId));
};

// ─────────────────────────────────────────────
// CRUD 3 — AGENDAMENTOS DE LUTAS
// ─────────────────────────────────────────────

// Criar agendamento
export const criarAgendamento = async (dados) => {
  const ref = await addDoc(collection(db, 'agendamentos'), {
    ...dados,
    status: 'pendente',
    criadoEm: serverTimestamp(),
  });
  return ref.id;
};

export const criarAgendamentoComId = async (id, dados) => {
  await setDoc(doc(db, 'agendamentos', id), {
    ...dados,
    status: dados.status || 'pendente',
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
};

// Buscar agendamentos de um match
export const buscarAgendamentos = async (matchId) => {
  const snap = await getDocs(
    query(
      collection(db, 'agendamentos'),
      where('matchId', '==', matchId),
      orderBy('criadoEm', 'desc')
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Buscar todos agendamentos do usuário
export const buscarMeusAgendamentos = async (uid) => {
  const snap = await getDocs(
    query(collection(db, 'agendamentos'), where('lutadores', 'array-contains', uid))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Atualizar agendamento
export const atualizarAgendamento = async (id, dados) => {
  await updateDoc(doc(db, 'agendamentos', id), {
    ...dados,
    atualizadoEm: serverTimestamp(),
  });
};

// Cancelar/deletar agendamento
export const deletarAgendamento = async (id) => {
  await deleteDoc(doc(db, 'agendamentos', id));
};

// ─────────────────────────────────────────────
// CHAT — Mensagens em tempo real
// ─────────────────────────────────────────────

// Enviar mensagem
export const enviarMensagem = async (matchId, uidRemetente, texto) => {
  await addDoc(collection(db, 'matches', matchId, 'mensagens'), {
    uidRemetente,
    texto,
    enviadoEm: serverTimestamp(),
  });
};

// Ouvir mensagens em tempo real
export const ouvirMensagens = (matchId, callback) => {
  const q = query(
    collection(db, 'matches', matchId, 'mensagens'),
    orderBy('enviadoEm', 'asc')
  );
  return onSnapshot(q, (snap) => {
    const mensagens = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(mensagens);
  });
};
