// Tela Home — Swipe de Lutadores
// CRUD 2 (Create do Match via like) + leitura de perfis (CRUD 1 Read)
import { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  ActivityIndicator, Alert, Animated, PanResponder, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useDemo } from '../../context/DemoContext';
import { useNetInfo } from '../../hooks/useNetInfo';
import { buscarLutadores, darLike } from '../../services/firestoreService';
import { buscarPerfisLocais, salvarPerfilLocal, salvarLikePendente } from '../../services/sqliteService';

const { width: LARGURA } = Dimensions.get('window');

export default function Home() {
  const router = useRouter();
  const { usuario } = useAuth();
  const modoDemo = Boolean(usuario?.demo);
  const { lutadoresDisponiveis, temPerfisSemMatch, avaliarPerfil, recarregarSemMatch } = useDemo();
  const temInternet = useNetInfo(modoDemo ? undefined : usuario?.uid);
  const [lutadores, setLutadores] = useState([]);
  const [indice, setIndice] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [matchInfo, setMatchInfo] = useState(null);

  const [posicao] = useState(() => new Animated.ValueXY());
  const [matchAnim] = useState(() => new Animated.Value(0));
  const [matchProgress] = useState(() => new Animated.Value(1));
  const matchTimer = useRef(null);

  const fecharMatch = () => {
    if (matchTimer.current) clearTimeout(matchTimer.current);
    matchTimer.current = null;
    matchAnim.stopAnimation();
    matchProgress.stopAnimation();
    setMatchInfo(null);
  };

  useEffect(() => () => {
    if (matchTimer.current) clearTimeout(matchTimer.current);
  }, []);

  const mostrarMatch = (lutador, matchId) => {
    if (matchTimer.current) clearTimeout(matchTimer.current);
    setMatchInfo({ nome: lutador.nome, matchId });
    matchAnim.setValue(0);
    matchProgress.setValue(1);
    Animated.parallel([
      Animated.spring(matchAnim, {
        toValue: 1,
        friction: 5,
        tension: 90,
        useNativeDriver: false,
      }),
      Animated.timing(matchProgress, {
        toValue: 0,
        duration: 3000,
        useNativeDriver: false,
      }),
    ]).start();

    matchTimer.current = setTimeout(() => {
      Animated.timing(matchAnim, { toValue: 0, duration: 160, useNativeDriver: false }).start(() => {
        setMatchInfo(null);
        matchTimer.current = null;
      });
    }, 3000);
  };

  const abrirChatDoMatch = () => {
    if (!matchInfo) return;
    const parametros = { pathname: '/chat', params: { matchId: matchInfo.matchId, nomeOutro: matchInfo.nome } };
    fecharMatch();
    router.push(parametros);
  };

  const carregarLutadores = useCallback(async () => {
    try {
      if (!usuario || modoDemo) {
        setLutadores([]);
        return;
      }

      if (temInternet) {
        // Com internet: busca do Firestore e salva no cache local
        const lista = await buscarLutadores(usuario.uid);
        setLutadores(lista);
        for (const l of lista) await salvarPerfilLocal(l);
      } else {
        // Sem internet: busca do cache SQLite
        const lista = await buscarPerfisLocais();
        setLutadores(lista.filter((l) => l.uid !== usuario.uid));
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar lutadores.');
    } finally {
      setCarregando(false);
    }
  }, [modoDemo, temInternet, usuario]);

  useEffect(() => {
    Promise.resolve().then(carregarLutadores);
  }, [carregarLutadores]);

  const recarregarLutadores = () => {
    if (modoDemo) {
      recarregarSemMatch();
      posicao.setValue({ x: 0, y: 0 });
      return;
    }
    startTransition(() => setCarregando(true));
    carregarLutadores();
  };

  const lutadorAtual = modoDemo ? lutadoresDisponiveis[0] : lutadores[indice];

  const proximoLutador = () => {
    posicao.setValue({ x: 0, y: 0 });
    setIndice((i) => i + 1);
  };

  const handleLike = async () => {
    if (!lutadorAtual) return;
    if (modoDemo) {
      const foiMatch = avaliarPerfil(lutadorAtual, true);
      if (foiMatch) {
        mostrarMatch(lutadorAtual, lutadorAtual.id);
      }
      posicao.setValue({ x: 0, y: 0 });
      return;
    }
    if (!usuario) return;
    try {
      if (temInternet) {
        // Com internet: registra like no Firestore
        const foiMatch = await darLike(usuario.uid, lutadorAtual.uid);
        if (foiMatch) {
          const matchId = [usuario.uid, lutadorAtual.uid].sort().join('_');
          mostrarMatch(lutadorAtual, matchId);
        }
      } else {
        // Sem internet: salva like no SQLite para sincronizar depois
        await salvarLikePendente(usuario.uid, lutadorAtual.uid);
        Alert.alert('Sem internet', 'Like salvo! Será enviado quando voltar a conexão. 📴');
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível registrar o like.');
    }
    proximoLutador();
  };

  const handleDislike = () => {
    if (modoDemo && lutadorAtual) {
      avaliarPerfil(lutadorAtual, false);
      posicao.setValue({ x: 0, y: 0 });
      return;
    }
    proximoLutador();
  };

  // PanResponder para arrastar o card (swipe)
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: Animated.event(
      [null, { dx: posicao.x, dy: posicao.y }],
      { useNativeDriver: false }
    ),
    onPanResponderRelease: (_, gesto) => {
      if (gesto.dx > 100) {
        Animated.timing(posicao, { toValue: { x: LARGURA, y: 0 }, duration: 200, useNativeDriver: false }).start(() => { handleLike(); });
      } else if (gesto.dx < -100) {
        Animated.timing(posicao, { toValue: { x: -LARGURA, y: 0 }, duration: 200, useNativeDriver: false }).start(() => { handleDislike(); });
      } else {
        Animated.spring(posicao, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
      }
    },
  });

  const rotacao = posicao.x.interpolate({ inputRange: [-LARGURA / 2, 0, LARGURA / 2], outputRange: ['-10deg', '0deg', '10deg'] });
  const escalaLike = posicao.x.interpolate({
    inputRange: [-LARGURA, 0, 24, LARGURA],
    outputRange: [1, 1, 1.08, 1.3],
    extrapolate: 'clamp',
  });
  const opacidadeLike = posicao.x.interpolate({
    inputRange: [-LARGURA, 0, LARGURA],
    outputRange: [0.55, 0.7, 1],
    extrapolate: 'clamp',
  });
  const escalaDislike = posicao.x.interpolate({
    inputRange: [-LARGURA, -24, 0, LARGURA],
    outputRange: [1.3, 1.08, 1, 1],
    extrapolate: 'clamp',
  });
  const opacidadeDislike = posicao.x.interpolate({
    inputRange: [-LARGURA, 0, LARGURA],
    outputRange: [1, 0.7, 0.55],
    extrapolate: 'clamp',
  });

  if (carregando) return (
    <View style={styles.center}>
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titulo}>🥊 FightMatch</Text>
        <View style={[styles.badge, temInternet ? styles.badgeOn : styles.badgeOff]}>
          <Text style={styles.badgeTexto}>{modoDemo ? 'Demonstração' : (temInternet ? '📶 Online' : '📴 Offline')}</Text>
        </View>
      </View>

      {/* Toast de Match */}
      {matchInfo ? (
        <Animated.View
          style={[
            styles.matchToast,
            {
              opacity: matchAnim,
              transform: [{ scale: matchAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
            },
          ]}
        >
          <View style={styles.matchToastCabecalho}>
            <Text style={styles.matchToastTitulo}>🔥 MATCH! 🔥</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Fechar aviso de match"
              onPress={fecharMatch}
            >
              <Text style={styles.matchFechar}>×</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.matchToastTexto}>Você e {matchInfo.nome} curtiram um ao outro.</Text>
          <TouchableOpacity style={styles.matchChatBotao} onPress={abrirChatDoMatch}>
            <Text style={styles.matchChatTexto}>💬 Chat liberado · Abrir conversa</Text>
          </TouchableOpacity>
          <View style={styles.matchTimerTrilho}>
            <Animated.View
              style={[styles.matchTimerBarra, {
                width: matchProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              }]}
            />
          </View>
        </Animated.View>
      ) : null}

      {/* Card do Lutador */}
      {lutadorAtual ? (
        <Animated.View
          style={[styles.card, { transform: [{ translateX: posicao.x }, { translateY: posicao.y }, { rotate: rotacao }] }]}
          {...panResponder.panHandlers}
        >
          {/* Foto */}
          <View style={styles.fotoContainer}>
            {lutadorAtual.fotoUrl
              ? <Image source={{ uri: lutadorAtual.fotoUrl }} style={styles.foto} />
              : <View style={styles.fotoPlaceholder}><Text style={styles.fotoEmoji}>🥊</Text></View>
            }
          </View>

          {/* Infos */}
          <View style={styles.infos}>
            <Text style={styles.nome}>{lutadorAtual.nome}</Text>
            <View style={styles.tags}>
              <View style={styles.tag}><Text style={styles.tagTexto}>⚖️ {lutadorAtual.peso} kg</Text></View>
              <View style={styles.tag}><Text style={styles.tagTexto}>🥋 {lutadorAtual.modalidade || lutadorAtual.modalidade}</Text></View>
            </View>
            <Text style={styles.detalhe}>🕐 {lutadorAtual.tempoTreino || lutadorAtual.tempo_treino}</Text>
            <Text style={styles.detalhe}>📍 {lutadorAtual.cidade || lutadorAtual.cidade}, {lutadorAtual.estado}</Text>
            {lutadorAtual.bio ? <Text style={styles.bio} numberOfLines={2}>{lutadorAtual.bio}</Text> : null}
            {modoDemo ? (
              <Text style={styles.likeStatus}>
                {lutadorAtual.curtiuVoce ? '💚 Já curtiu você' : 'Ainda não curtiu você'}
              </Text>
            ) : null}
          </View>

        </Animated.View>
      ) : (
        <View style={styles.semLutadores}>
          <Text style={styles.semEmoji}>🏆</Text>
          <Text style={styles.semTexto}>
            {modoDemo ? 'Fim desta rodada de demonstração' : 'Você viu todos os lutadores!'}
          </Text>
          <Text style={styles.dicaSwipe}>
            {modoDemo
              ? 'Os matches ficam salvos nesta sessão. Recarregue para rever somente quem não deu match.'
              : 'Tente carregar novamente.'}
          </Text>
          {usuario || temPerfisSemMatch ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={modoDemo ? 'Recarregar sem match' : 'Recarregar lutadores'}
              style={styles.recarregarBtn}
              onPress={recarregarLutadores}
            >
              <Text style={styles.recarregarTexto}>{modoDemo ? 'Recarregar sem match' : 'Recarregar'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {lutadorAtual ? (
        <View style={styles.swipeSafeZone} {...panResponder.panHandlers}>
          <Text selectable={false} style={styles.swipeSafeZoneTexto}>↔  Arraste aqui para decidir  ↔</Text>
        </View>
      ) : null}

      {/* Botões de Ação */}
      {lutadorAtual && (
        <View style={styles.botoes}>
          <Animated.View style={[styles.botaoIndicador, { opacity: opacidadeDislike, transform: [{ scale: escalaDislike }] }]}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Passar este perfil"
              style={styles.botaoDislike}
              onPress={handleDislike}
            >
              <Text style={styles.botaoEmoji}>👎</Text>
            </TouchableOpacity>
          </Animated.View>
          <Animated.View style={[styles.botaoIndicador, { opacity: opacidadeLike, transform: [{ scale: escalaLike }] }]}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Gostei deste perfil"
              style={styles.botaoLike}
              onPress={handleLike}
            >
              <Text style={styles.botaoEmoji}>🔥</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SIZES.lg, paddingTop: 60, paddingBottom: SIZES.md,
  },
  titulo: { fontFamily: FONTS.bold, fontSize: SIZES.textXl, color: COLORS.textPrimary },
  badge: { paddingHorizontal: SIZES.sm, paddingVertical: 4, borderRadius: SIZES.radiusFull },
  badgeOn: { backgroundColor: '#1a3a1a' },
  badgeOff: { backgroundColor: '#3a1a1a' },
  badgeTexto: { fontFamily: FONTS.medium, fontSize: SIZES.textXs, color: COLORS.textSecondary },
  matchToast: {
    marginHorizontal: SIZES.lg, backgroundColor: COLORS.primary,
    padding: SIZES.md, borderRadius: 6, alignItems: 'stretch', gap: SIZES.xs,
    marginBottom: SIZES.sm, ...SHADOWS.lg,
  },
  matchToastCabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  matchToastTitulo: { fontFamily: FONTS.bold, fontSize: SIZES.textLg, color: COLORS.white },
  matchFechar: { fontFamily: FONTS.regular, fontSize: 24, color: COLORS.white, paddingHorizontal: SIZES.xs },
  matchToastTexto: { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.white },
  matchChatBotao: { alignSelf: 'flex-start', marginTop: SIZES.xs, paddingHorizontal: SIZES.sm, paddingVertical: SIZES.xs, borderRadius: 4, backgroundColor: COLORS.surface },
  matchChatTexto: { fontFamily: FONTS.semiBold, fontSize: SIZES.textXs, color: COLORS.textPrimary },
  matchTimerTrilho: { height: 3, backgroundColor: '#ffffff66', borderRadius: 2, overflow: 'hidden', marginTop: SIZES.xs },
  matchTimerBarra: { height: '100%', backgroundColor: COLORS.white },
  card: {
    flex: 1, marginHorizontal: SIZES.lg, marginBottom: SIZES.xs,
    backgroundColor: COLORS.surface, borderRadius: 6,
    overflow: 'hidden', ...SHADOWS.md,
  },
  fotoContainer: { height: 280 },
  foto: { width: '100%', height: '100%' },
  fotoPlaceholder: {
    flex: 1, backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center', alignItems: 'center',
  },
  fotoEmoji: { fontSize: 80 },
  infos: { padding: SIZES.lg },
  nome: { fontFamily: FONTS.bold, fontSize: SIZES.textXxl, color: COLORS.textPrimary, marginBottom: SIZES.sm },
  tags: { flexDirection: 'row', gap: SIZES.sm, marginBottom: SIZES.sm, flexWrap: 'wrap' },
  tag: {
    backgroundColor: COLORS.surfaceLight, borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.sm, paddingVertical: 4,
  },
  tagTexto: { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textSecondary },
  detalhe: { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textSecondary, marginBottom: 4 },
  bio: { fontFamily: FONTS.regular, fontSize: SIZES.textMd, color: COLORS.textPrimary, marginTop: SIZES.sm },
  likeStatus: { fontFamily: FONTS.semiBold, fontSize: SIZES.textSm, color: COLORS.success, marginTop: SIZES.sm },
  dicaSwipe: { textAlign: 'center', color: COLORS.textMuted, fontFamily: FONTS.regular, fontSize: SIZES.textXs, paddingBottom: SIZES.sm },
  swipeSafeZone: {
    height: 42, marginHorizontal: SIZES.lg, marginBottom: SIZES.xs,
    borderRadius: SIZES.radiusMd, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center',
  },
  swipeSafeZoneTexto: { fontFamily: FONTS.semiBold, fontSize: SIZES.textXs, color: COLORS.textSecondary },
  semLutadores: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  semEmoji: { fontSize: 60, marginBottom: SIZES.md },
  semTexto: { fontFamily: FONTS.semiBold, fontSize: SIZES.textLg, color: COLORS.textSecondary, marginBottom: SIZES.md },
  recarregarBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SIZES.lg, paddingVertical: SIZES.md, borderRadius: SIZES.radiusMd },
  recarregarTexto: { fontFamily: FONTS.bold, color: COLORS.white },
  botoes: { flexDirection: 'row', justifyContent: 'center', gap: SIZES.xl, padding: SIZES.md, paddingBottom: SIZES.lg },
  botaoIndicador: { alignItems: 'center', justifyContent: 'center' },
  botaoDislike: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: COLORS.surface,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  botaoLike: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', ...SHADOWS.lg,
  },
  botaoEmoji: { fontSize: 28 },
});
