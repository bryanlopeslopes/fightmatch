// Sincronização entre SQLite (local) e Firestore (nuvem)
import {
  buscarLikesPendentes,
  marcarLikeSincronizado,
  salvarPerfilLocal,
  buscarAgendamentosPendentes,
  removerAgendamentoPendente,
  removerAgendamentoLocal,
  salvarAgendamentoLocal,
} from './sqliteService';
import {
  darLike,
  buscarLutadores,
  criarAgendamentoComId,
  atualizarAgendamento,
  deletarAgendamento,
} from './firestoreService';

let sincronizacaoAtual = null;

const dadosParaFirestore = (dados) => {
  const dadosFirestore = { ...dados };
  delete dadosFirestore.id;
  delete dadosFirestore.usuarioUid;
  delete dadosFirestore.sincronizado;
  delete dadosFirestore.criadoEm;
  return dadosFirestore;
};

export const sincronizarAgendamentosPendentes = async () => {
  const pendentes = await buscarAgendamentosPendentes();

  for (const item of pendentes) {
    try {
      if (item.operacao === 'criar') {
        await criarAgendamentoComId(item.agendamentoId, dadosParaFirestore(item.dados));
        await salvarAgendamentoLocal(item.dados, item.usuarioUid, true);
      } else if (item.operacao === 'atualizar') {
        await atualizarAgendamento(item.agendamentoId, dadosParaFirestore(item.dados));
        await salvarAgendamentoLocal(item.dados, item.usuarioUid, true);
      } else if (item.operacao === 'excluir') {
        await deletarAgendamento(item.agendamentoId);
        await removerAgendamentoLocal(item.agendamentoId);
      }

      await removerAgendamentoPendente(item.id);
    } catch (e) {
      console.log('Erro ao sincronizar agendamento:', e.message);
      break;
    }
  }
};

// Sincroniza likes guardados offline com o Firestore
export const sincronizarLikesPendentes = async (uidAtual) => {
  console.log('🔄 Sincronizando likes pendentes...');
  const pendentes = await buscarLikesPendentes();

  for (const like of pendentes) {
    try {
      await darLike(like.uid_quem_curtiu, like.uid_curtido);
      await marcarLikeSincronizado(like.id);
      console.log(`✅ Like sincronizado: ${like.uid_curtido}`);
    } catch (e) {
      console.log('❌ Erro ao sincronizar like:', e.message);
    }
  }
};

// Atualiza o cache local com dados frescos do Firestore
export const atualizarCacheLocal = async (uidAtual) => {
  console.log('🔄 Atualizando cache local...');
  try {
    const lutadores = await buscarLutadores(uidAtual);
    for (const l of lutadores) {
      await salvarPerfilLocal(l);
    }
    console.log(`✅ Cache atualizado: ${lutadores.length} lutadores`);
  } catch (e) {
    console.log('❌ Erro ao atualizar cache:', e.message);
  }
};

// Função principal — chamada quando o app detecta que voltou a ter internet
export const sincronizarTudo = async (uidAtual) => {
  if (sincronizacaoAtual) return sincronizacaoAtual;

  sincronizacaoAtual = (async () => {
    await sincronizarAgendamentosPendentes();
    await sincronizarLikesPendentes(uidAtual);
    await atualizarCacheLocal(uidAtual);
  })();

  try {
    await sincronizacaoAtual;
  } finally {
    sincronizacaoAtual = null;
  }
};
