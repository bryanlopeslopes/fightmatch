// Tela de Chat — Mensagens em tempo real entre matched fighters
// Inclui atalho para visualizar academias próximas
import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useDemo } from '../context/DemoContext';
import { enviarMensagem, ouvirMensagens } from '../services/firestoreService';

export default function Chat() {
  const { matchId, nomeOutro } = useLocalSearchParams();
  const { usuario } = useAuth();
  const modoDemo = Boolean(usuario?.demo);
  const { mensagensPorMatch, adicionarMensagemDemo } = useDemo();
  const router = useRouter();
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState('');
  const [carregando, setCarregando] = useState(true);
  const listaRef = useRef(null);

  useEffect(() => {
    if (!matchId || !usuario) {
      setCarregando(false);
      return;
    }

    if (modoDemo) {
      setMensagens(mensagensPorMatch[matchId] || []);
      setCarregando(false);
      return;
    }

    // Listener em tempo real — atualiza mensagens automaticamente
    const cancelar = ouvirMensagens(matchId, (novasMensagens) => {
      setMensagens(novasMensagens);
      setCarregando(false);
    });

    return cancelar; // Para de ouvir quando sair da tela
  }, [matchId, mensagensPorMatch, modoDemo, usuario]);

  const handleEnviar = async () => {
    const textoLimpo = texto.trim();
    if (!textoLimpo || !usuario || !matchId) return;

    setTexto('');
    if (modoDemo) {
      const mensagem = adicionarMensagemDemo(matchId, usuario.uid, textoLimpo);
      setMensagens((atuais) => [...atuais, mensagem]);
      return;
    }

    await enviarMensagem(matchId, usuario.uid, textoLimpo);
  };

  const renderMensagem = ({ item }) => {
    if (!usuario) return null;
    const ehMinha = item.uidRemetente === usuario.uid;

    return (
      <View style={[styles.msgContainer, ehMinha ? styles.msgDireita : styles.msgEsquerda]}>
        <View style={[styles.bubble, ehMinha ? styles.bubbleMinha : styles.bubbleDele]}>
          <Text style={[styles.msgTexto, ehMinha && styles.msgTextoMeu]}>{item.texto}</Text>
        </View>
        <Text style={styles.msgHora}>
          {item.enviadoEm?.toDate ? item.enviadoEm.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
        </Text>
      </View>
    );
  };

  if (carregando) return (
    <View style={styles.center}>
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  );

  if (!usuario || !matchId) {
    return (
      <View style={styles.center}>
        <Text style={styles.vazioTexto}>Chat indisponível sem um match selecionado.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.voltar}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.voltar}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerNome}>🥊 {nomeOutro}</Text>
          <Text style={styles.headerSub}>Match confirmado</Text>
        </View>
        {!modoDemo ? (
          <TouchableOpacity
            style={styles.btnAgendar}
            onPress={() => router.push({ pathname: '/(tabs)/academias' })}
          >
            <Text style={styles.btnAgendarTexto}>📍 Academias</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Lista de mensagens */}
      <FlatList
        ref={listaRef}
        data={mensagens}
        keyExtractor={(item) => item.id}
        renderItem={renderMensagem}
        contentContainerStyle={styles.lista}
        onContentSizeChange={() => listaRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Text style={styles.vazioEmoji}>👋</Text>
            <Text style={styles.vazioTexto}>Início do chat! Envie uma mensagem.</Text>
          </View>
        }
      />

      {/* Input de mensagem */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Manda a mensagem..."
          placeholderTextColor={COLORS.textMuted}
          value={texto}
          onChangeText={setTexto}
          onSubmitEditing={handleEnviar}
          returnKeyType="send"
          multiline
        />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Enviar mensagem"
          style={styles.btnEnviar}
          onPress={handleEnviar}
        >
          <Text style={styles.btnEnviarTexto}>🔥</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.md,
    paddingHorizontal: SIZES.lg, paddingTop: 60, paddingBottom: SIZES.md,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  voltar: { fontSize: 24, color: COLORS.textPrimary },
  headerInfo: { flex: 1 },
  headerNome: { fontFamily: FONTS.semiBold, fontSize: SIZES.textLg, color: COLORS.textPrimary },
  headerSub: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.success },
  btnAgendar: { backgroundColor: COLORS.primary, paddingHorizontal: SIZES.sm, paddingVertical: 6, borderRadius: SIZES.radiusMd },
  btnAgendarTexto: { fontFamily: FONTS.semiBold, fontSize: SIZES.textXs, color: COLORS.white },
  lista: { padding: SIZES.md, gap: SIZES.sm, flexGrow: 1, justifyContent: 'flex-end' },
  msgContainer: { maxWidth: '80%' },
  msgDireita: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  msgEsquerda: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { borderRadius: SIZES.radiusLg, paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, ...SHADOWS.sm },
  bubbleMinha: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleDele: { backgroundColor: COLORS.surface, borderBottomLeftRadius: 4 },
  msgTexto: { fontFamily: FONTS.regular, fontSize: SIZES.textMd, color: COLORS.textSecondary },
  msgTextoMeu: { color: COLORS.white },
  msgHora: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted, marginTop: 2, paddingHorizontal: 4 },
  vazio: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  vazioEmoji: { fontSize: 48, marginBottom: SIZES.md },
  vazioTexto: { fontFamily: FONTS.regular, fontSize: SIZES.textMd, color: COLORS.textMuted, textAlign: 'center' },
  inputRow: {
    flexDirection: 'row', gap: SIZES.sm, padding: SIZES.md,
    backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  input: {
    flex: 1, backgroundColor: COLORS.surfaceLight, borderRadius: SIZES.radiusLg,
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm,
    color: COLORS.textPrimary, fontFamily: FONTS.regular, maxHeight: 100,
  },
  btnEnviar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', ...SHADOWS.lg,
  },
  btnEnviarTexto: { fontSize: 20 },
});
