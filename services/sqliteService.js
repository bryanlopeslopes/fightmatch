// SQLite — Banco de dados local para funcionamento offline
// No web, usa localStorage como fallback (SQLite só funciona em dispositivos nativos)
import { Platform } from 'react-native';

let SQLite = null;
let db = null;

// ─────────────────────────────────────────────
// INICIALIZAÇÃO
// ─────────────────────────────────────────────

export const inicializarBanco = async () => {
  if (Platform.OS === 'web') {
    // Na web, inicializa estruturas no localStorage
    if (!localStorage.getItem('perfis_cache')) localStorage.setItem('perfis_cache', JSON.stringify([]));
    if (!localStorage.getItem('likes_pendentes')) localStorage.setItem('likes_pendentes', JSON.stringify([]));
    console.log('✅ Banco (localStorage) inicializado');
    return;
  }

  // Mobile: usa SQLite real
  SQLite = require('expo-sqlite');
  db = await SQLite.openDatabaseAsync('fightmatch.db');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS perfis_cache (
      uid TEXT PRIMARY KEY,
      nome TEXT,
      modalidade TEXT,
      peso REAL,
      tempo_treino TEXT,
      cidade TEXT,
      estado TEXT,
      foto_url TEXT,
      bio TEXT,
      atualizado_em TEXT
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS likes_pendentes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uid_quem_curtiu TEXT NOT NULL,
      uid_curtido TEXT NOT NULL,
      criado_em TEXT NOT NULL,
      sincronizado INTEGER DEFAULT 0
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS agendamentos_cache (
      id TEXT PRIMARY KEY NOT NULL,
      usuario_uid TEXT NOT NULL,
      match_id TEXT,
      data TEXT NOT NULL,
      horario TEXT NOT NULL,
      local TEXT NOT NULL,
      modalidade TEXT,
      obs TEXT,
      lutadores TEXT NOT NULL,
      status TEXT NOT NULL,
      criado_em TEXT,
      sincronizado INTEGER NOT NULL DEFAULT 1
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS agendamentos_pendentes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agendamento_id TEXT NOT NULL,
      usuario_uid TEXT NOT NULL,
      operacao TEXT NOT NULL,
      dados TEXT NOT NULL,
      criado_em TEXT NOT NULL
    );
  `);

  console.log('✅ Banco SQLite inicializado');
};

// ─────────────────────────────────────────────
// PERFIS — Cache local
// ─────────────────────────────────────────────

export const salvarPerfilLocal = async (perfil) => {
  if (Platform.OS === 'web') {
    const lista = JSON.parse(localStorage.getItem('perfis_cache') || '[]');
    const idx = lista.findIndex((p) => p.uid === perfil.uid);
    const item = { uid: perfil.uid, nome: perfil.nome, modalidade: perfil.modalidade, peso: perfil.peso, tempo_treino: perfil.tempoTreino, cidade: perfil.cidade, estado: perfil.estado, foto_url: perfil.fotoUrl, bio: perfil.bio };
    if (idx >= 0) lista[idx] = item; else lista.push(item);
    localStorage.setItem('perfis_cache', JSON.stringify(lista));
    return;
  }

  await db.runAsync(
    `INSERT OR REPLACE INTO perfis_cache (uid, nome, modalidade, peso, tempo_treino, cidade, estado, foto_url, bio, atualizado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [perfil.uid, perfil.nome || '', perfil.modalidade || '', perfil.peso || 0, perfil.tempoTreino || '', perfil.cidade || '', perfil.estado || '', perfil.fotoUrl || '', perfil.bio || '', new Date().toISOString()]
  );
};

export const buscarPerfisLocais = async () => {
  if (Platform.OS === 'web') {
    return JSON.parse(localStorage.getItem('perfis_cache') || '[]');
  }
  return await db.getAllAsync('SELECT * FROM perfis_cache');
};

export const deletarPerfilLocal = async (uid) => {
  if (Platform.OS === 'web') {
    const lista = JSON.parse(localStorage.getItem('perfis_cache') || '[]');
    localStorage.setItem('perfis_cache', JSON.stringify(lista.filter((p) => p.uid !== uid)));
    return;
  }
  await db.runAsync('DELETE FROM perfis_cache WHERE uid = ?', [uid]);
};

// ─────────────────────────────────────────────
// LIKES PENDENTES — Offline
// ─────────────────────────────────────────────

export const salvarLikePendente = async (uidQuemCurtiu, uidCurtido) => {
  if (Platform.OS === 'web') {
    const lista = JSON.parse(localStorage.getItem('likes_pendentes') || '[]');
    lista.push({ id: Date.now(), uid_quem_curtiu: uidQuemCurtiu, uid_curtido: uidCurtido, criado_em: new Date().toISOString(), sincronizado: 0 });
    localStorage.setItem('likes_pendentes', JSON.stringify(lista));
    console.log('📴 Like salvo localmente (offline/web)');
    return;
  }
  await db.runAsync(
    `INSERT INTO likes_pendentes (uid_quem_curtiu, uid_curtido, criado_em) VALUES (?, ?, ?)`,
    [uidQuemCurtiu, uidCurtido, new Date().toISOString()]
  );
  console.log('📴 Like salvo localmente (offline)');
};

export const buscarLikesPendentes = async () => {
  if (Platform.OS === 'web') {
    const lista = JSON.parse(localStorage.getItem('likes_pendentes') || '[]');
    return lista.filter((l) => l.sincronizado === 0);
  }
  return await db.getAllAsync('SELECT * FROM likes_pendentes WHERE sincronizado = 0');
};

export const marcarLikeSincronizado = async (id) => {
  if (Platform.OS === 'web') {
    const lista = JSON.parse(localStorage.getItem('likes_pendentes') || '[]');
    const atualizado = lista.map((l) => l.id === id ? { ...l, sincronizado: 1 } : l);
    localStorage.setItem('likes_pendentes', JSON.stringify(atualizado));
    return;
  }
  await db.runAsync('UPDATE likes_pendentes SET sincronizado = 1 WHERE id = ?', [id]);
};

const gerarIdLocal = (uid) => `local_${uid}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const normalizarAgendamento = (agendamento, uid, sincronizado = true) => ({
  id: agendamento.id,
  usuarioUid: uid,
  matchId: agendamento.matchId || '',
  data: agendamento.data || '',
  horario: agendamento.horario || '',
  local: agendamento.local || '',
  modalidade: agendamento.modalidade || '',
  obs: agendamento.obs || '',
  lutadores: agendamento.lutadores || [uid],
  status: agendamento.status || 'pendente',
  criadoEm: agendamento.criadoEm?.toDate
    ? agendamento.criadoEm.toDate().toISOString()
    : typeof agendamento.criadoEm === 'string' || typeof agendamento.criadoEm === 'number'
      ? agendamento.criadoEm
      : new Date().toISOString(),
  sincronizado,
});

export const salvarAgendamentoLocal = async (agendamento, uid, sincronizado = true) => {
  const item = normalizarAgendamento(agendamento, uid, sincronizado);
  if (Platform.OS === 'web') {
    const lista = JSON.parse(localStorage.getItem('agendamentos_cache') || '[]');
    const indice = lista.findIndex((registro) => registro.id === item.id);
    if (indice >= 0 && lista[indice].sincronizado === false && sincronizado) return;
    if (indice >= 0) lista[indice] = item;
    else lista.push(item);
    localStorage.setItem('agendamentos_cache', JSON.stringify(lista));
    return;
  }

  await db.runAsync(
    `INSERT INTO agendamentos_cache
      (id, usuario_uid, match_id, data, horario, local, modalidade, obs, lutadores, status, criado_em, sincronizado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        usuario_uid = excluded.usuario_uid,
        match_id = excluded.match_id,
        data = excluded.data,
        horario = excluded.horario,
        local = excluded.local,
        modalidade = excluded.modalidade,
        obs = excluded.obs,
        lutadores = excluded.lutadores,
        status = excluded.status,
        criado_em = excluded.criado_em,
        sincronizado = excluded.sincronizado
      WHERE agendamentos_cache.sincronizado = 1 OR excluded.sincronizado = 0`,
    [item.id, item.usuarioUid, item.matchId, item.data, item.horario, item.local, item.modalidade,
      item.obs, JSON.stringify(item.lutadores), item.status, item.criadoEm, item.sincronizado ? 1 : 0]
  );
};

export const buscarAgendamentosLocais = async (uid) => {
  if (Platform.OS === 'web') {
    return JSON.parse(localStorage.getItem('agendamentos_cache') || '[]')
      .filter((item) => item.usuarioUid === uid);
  }

  const rows = await db.getAllAsync('SELECT * FROM agendamentos_cache WHERE usuario_uid = ?', [uid]);
  return rows.map((row) => ({
    ...row,
    usuarioUid: row.usuario_uid,
    matchId: row.match_id,
    criadoEm: row.criado_em,
    lutadores: JSON.parse(row.lutadores || '[]'),
    sincronizado: Boolean(row.sincronizado),
  }));
};

export const salvarAgendamentoPendente = async (uid, dados, agendamentoId = null, operacao = 'criar') => {
  const id = agendamentoId || gerarIdLocal(uid);
  const item = normalizarAgendamento({ ...dados, id }, uid, false);

  if (operacao === 'excluir') {
    if (Platform.OS === 'web') {
      const lista = JSON.parse(localStorage.getItem('agendamentos_cache') || '[]');
      localStorage.setItem('agendamentos_cache', JSON.stringify(lista.filter((registro) => registro.id !== id)));
    } else {
      await db.runAsync('DELETE FROM agendamentos_cache WHERE id = ?', [id]);
    }
  } else {
    await salvarAgendamentoLocal(item, uid, false);
  }

  const pendencia = {
    agendamentoId: id,
    usuarioUid: uid,
    operacao,
    dados: item,
    criadoEm: new Date().toISOString(),
  };

  if (Platform.OS === 'web') {
    const lista = JSON.parse(localStorage.getItem('agendamentos_pendentes') || '[]');
    lista.push({ ...pendencia, id: Date.now() + Math.random() });
    localStorage.setItem('agendamentos_pendentes', JSON.stringify(lista));
  } else {
    await db.runAsync(
      'INSERT INTO agendamentos_pendentes (agendamento_id, usuario_uid, operacao, dados, criado_em) VALUES (?, ?, ?, ?, ?)',
      [id, uid, operacao, JSON.stringify(item), pendencia.criadoEm]
    );
  }

  return id;
};

export const buscarAgendamentosPendentes = async () => {
  if (Platform.OS === 'web') {
    return JSON.parse(localStorage.getItem('agendamentos_pendentes') || '[]');
  }

  const rows = await db.getAllAsync('SELECT * FROM agendamentos_pendentes ORDER BY id ASC');
  return rows.map((row) => ({
    id: row.id,
    agendamentoId: row.agendamento_id,
    usuarioUid: row.usuario_uid,
    operacao: row.operacao,
    dados: JSON.parse(row.dados),
  }));
};

export const removerAgendamentoPendente = async (id) => {
  if (Platform.OS === 'web') {
    const lista = JSON.parse(localStorage.getItem('agendamentos_pendentes') || '[]');
    localStorage.setItem('agendamentos_pendentes', JSON.stringify(lista.filter((item) => item.id !== id)));
    return;
  }
  await db.runAsync('DELETE FROM agendamentos_pendentes WHERE id = ?', [id]);
};

export const removerAgendamentoLocal = async (id) => {
  if (Platform.OS === 'web') {
    const lista = JSON.parse(localStorage.getItem('agendamentos_cache') || '[]');
    localStorage.setItem('agendamentos_cache', JSON.stringify(lista.filter((item) => item.id !== id)));
    return;
  }
  await db.runAsync('DELETE FROM agendamentos_cache WHERE id = ?', [id]);
};
