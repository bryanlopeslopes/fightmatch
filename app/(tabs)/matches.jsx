// Tela de Matches — CRUD 2 (Read, Update, Delete de Matches)
import { useState, useEffect, useCallback, startTransition } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useDemo } from '../../context/DemoContext';
import { buscarMatches, buscarLutadorPorId, deletarMatch } from '../../services/firestoreService';

export default function Matches() {
  const { usuario } = useAuth();
  const modoDemo = Boolean(usuario?.demo);
  const { matchesDemo, excluirMatch: excluirMatchDemo } = useDemo();
  const router = useRouter();
  const [matches, setMatches] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregarMatches = useCallback(async () => {
    if (modoDemo || !usuario) {
      setMatches(matchesDemo);
      setCarregando(false);
      return;
    }

    try {
      const lista = await buscarMatches(usuario.uid);
      // Para cada match, busca os dados do outro lutador
      const comDados = await Promise.all(
        lista.map(async (match) => {
          const uidOutro = match.lutadores.find((id) => id !== usuario.uid);
          const lutador = await buscarLutadorPorId(uidOutro);
          return { ...match, lutador };
        })
      );
      setMatches(comDados.filter((m) => m.lutador)); // Filtra matches válidos
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os matches.');
    } finally {
      setCarregando(false);
    }
  }, [matchesDemo, modoDemo, usuario]);

  useEffect(() => {
    Promise.resolve().then(carregarMatches);
  }, [carregarMatches]);

  const recarregarMatches = () => {
    startTransition(() => setCarregando(true));
    carregarMatches();
  };

  const handleDeletar = (match) => {
    if (modoDemo) {
      excluirMatchDemo(match.id);
      return;
    }
    Alert.alert(
      'Desfazer match',
      `Deseja desfazer o match com ${match.lutador?.nome}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desfazer',
          style: 'destructive',
          onPress: async () => {
            await deletarMatch(match.id);
            carregarMatches();
          },
        },
      ]
    );
  };

  const entrarNoChat = (match) => {
    router.push({ pathname: '/chat', params: { matchId: match.id, nomeOutro: match.lutador?.nome } });
  };

  const renderMatch = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.fotoContainer}>
        <Text style={styles.fotoEmoji}>🥊</Text>
      </View>

      <View style={styles.infos}>
        <Text style={styles.nome}>{item.lutador?.nome}</Text>
        <Text style={styles.detalhe}>⚖️ {item.lutador?.peso} kg · 🥋 {item.lutador?.modalidade}</Text>
        <Text style={styles.detalhe}>📍 {item.lutador?.cidade}, {item.lutador?.estado}</Text>
        <View style={[styles.statusBadge, item.status === 'bloqueado' && styles.statusBloqueado]}>
          <Text style={styles.statusTexto}>{item.status === 'bloqueado' ? '🚫 Bloqueado' : '🔥 Match ativo'}</Text>
        </View>
      </View>

      <View style={styles.acoes}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Entrar no chat com ${item.lutador?.nome}`}
          style={styles.botaoChat}
          onPress={() => entrarNoChat(item)}
        >
          <Text style={styles.botaoTexto}>💬 Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Desfazer match com ${item.lutador?.nome}`}
          style={styles.botaoDeletar}
          onPress={() => handleDeletar(item)}
        >
          <Text style={styles.botaoTexto}>↩ Desfazer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (carregando) return (
    <View style={styles.center}>
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>🔥 Seus Matches</Text>
        <Text style={styles.subtitulo}>
          {matches.length} {modoDemo ? 'match(es) da demonstração' : 'lutador(es) prontos pra encarar'}
        </Text>
      </View>

      {matches.length === 0 ? (
        <View style={styles.vazio}>
          <Text style={styles.vazioEmoji}>{modoDemo ? '🥊' : '😴'}</Text>
          <Text style={styles.vazioTexto}>
            {modoDemo ? 'Nenhum match encontrado nesta demonstração.' : 'Nenhum match ainda.'}
          </Text>
          {!modoDemo ? <Text style={styles.vazioSub}>Volte para a tela de lutar e dê mais likes!</Text> : null}
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          renderItem={renderMatch}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          onRefresh={recarregarMatches}
          refreshing={carregando}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { paddingHorizontal: SIZES.lg, paddingTop: 60, paddingBottom: SIZES.md },
  titulo: { fontFamily: FONTS.bold, fontSize: SIZES.textXxl, color: COLORS.textPrimary },
  subtitulo: { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textSecondary, marginTop: 4 },
  lista: { padding: SIZES.lg, paddingTop: SIZES.md, gap: SIZES.md },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 6,
    padding: SIZES.md, flexDirection: 'row', alignItems: 'center', gap: SIZES.md, ...SHADOWS.sm,
  },
  fotoContainer: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center', alignItems: 'center',
  },
  fotoEmoji: { fontSize: 28 },
  infos: { flex: 1 },
  nome: { fontFamily: FONTS.semiBold, fontSize: SIZES.textLg, color: COLORS.textPrimary },
  detalhe: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textSecondary, marginTop: 2 },
  statusBadge: {
    marginTop: SIZES.xs, alignSelf: 'flex-start',
    backgroundColor: '#1a3020', paddingHorizontal: SIZES.sm, paddingVertical: 2,
    borderRadius: SIZES.radiusFull,
  },
  statusBloqueado: { backgroundColor: '#3a1a1a' },
  statusTexto: { fontFamily: FONTS.medium, fontSize: SIZES.textXs, color: COLORS.textSecondary },
  acoes: { gap: SIZES.xs, alignItems: 'stretch' },
  botaoChat: {
    minWidth: 72, paddingHorizontal: SIZES.sm, paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusMd, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  botaoDeletar: {
    minWidth: 72, paddingHorizontal: SIZES.sm, paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusMd, backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center', alignItems: 'center',
  },
  botaoTexto: { fontFamily: FONTS.medium, fontSize: SIZES.textXs, color: COLORS.textPrimary },
  vazio: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SIZES.xxl },
  vazioEmoji: { fontSize: 60, marginBottom: SIZES.md },
  vazioTexto: { fontFamily: FONTS.semiBold, fontSize: SIZES.textLg, color: COLORS.textSecondary },
  vazioSub: { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textMuted, textAlign: 'center', marginTop: SIZES.sm },
});
