// Tela de Perfil — CRUD 1 (Read + Update + Delete do Perfil)
import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { atualizarPerfil, deletarPerfil } from '../../services/firestoreService';
import { logout } from '../../services/authService';
import { buscarEnderecoPorCEP } from '../../services/viaCepService';

const MODALIDADES = ['MMA', 'Boxe', 'Muay Thai', 'Jiu-Jitsu', 'Judô', 'Wrestling', 'Kickboxing'];

export default function Perfil() {
  const { usuario, perfil, atualizarPerfilLocal } = useAuth();
  const modoDemo = Boolean(usuario?.demo);
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [carregando, setCarregando] = useState(false);

  // Campos de edição
  const [nome, setNome] = useState(perfil?.nome || '');
  const [peso, setPeso] = useState(String(perfil?.peso || ''));
  const [tempoTreino, setTempoTreino] = useState(perfil?.tempoTreino || '');
  const [bio, setBio] = useState(perfil?.bio || '');
  const [cep, setCep] = useState(perfil?.cep || '');
  const [cidade, setCidade] = useState(perfil?.cidade || '');
  const [estado, setEstado] = useState(perfil?.estado || '');
  const [modalidade, setModalidade] = useState(perfil?.modalidade || 'MMA');
  const [buscandoCep, setBuscandoCep] = useState(false);

  const abrirEdicao = () => {
    setNome(perfil.nome || '');
    setPeso(String(perfil.peso || ''));
    setTempoTreino(perfil.tempoTreino || '');
    setBio(perfil.bio || '');
    setCep(perfil.cep || '');
    setCidade(perfil.cidade || '');
    setEstado(perfil.estado || '');
    setModalidade(perfil.modalidade || 'MMA');
    setEditando(true);
  };

  const handleBuscarCEP = async () => {
    setBuscandoCep(true);
    try {
      const end = await buscarEnderecoPorCEP(cep);
      setCidade(end.cidade);
      setEstado(end.estado);
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleSalvar = async () => {
    setCarregando(true);
    try {
      const novosDados = { nome, peso: parseFloat(peso), tempoTreino, bio, cep, cidade, estado, modalidade };
      if (modoDemo) {
        atualizarPerfilLocal(novosDados);
        setEditando(false);
        Alert.alert('Perfil atualizado', 'As alterações ficam apenas nesta sessão de demonstração.');
        return;
      }
      await atualizarPerfil(usuario.uid, novosDados);
      atualizarPerfilLocal(novosDados); // Atualiza contexto local
      setEditando(false);
      Alert.alert('✅ Perfil atualizado!');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setCarregando(false);
    }
  };

  const handleDeletarConta = () => {
    Alert.alert(
      '⚠️ Deletar conta',
      'Tem certeza? Esta ação é irreversível e todos os seus dados serão apagados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar', style: 'destructive',
          onPress: async () => {
            try {
              await deletarPerfil(usuario.uid);
              await logout();
              router.replace('/(tabs)/home');
            } catch {
              Alert.alert('Erro', 'Não foi possível deletar a conta.');
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(tabs)/home');
  };

  if (!usuario || !perfil) return (
    <View style={styles.center}>
      <Text style={styles.infoTitulo}>Perfil indisponível</Text>
      <Text style={styles.email}>Autenticação desativada nesta versão de demonstração.</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>

      {/* Foto e nome */}
      <View style={styles.topSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>🥊</Text>
        </View>
        <Text style={styles.nome}>{perfil.nome}</Text>
        <Text style={styles.email}>{perfil.email}</Text>
        {modoDemo ? <Text style={styles.demoAviso}>Perfil fictício · alterações desta sessão</Text> : null}
      </View>

      {/* Infos do lutador */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitulo}>⚡ Dados de Luta</Text>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Peso</Text>
            <Text style={styles.infoValor}>{perfil.peso} kg</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Modalidade</Text>
            <Text style={styles.infoValor}>{perfil.modalidade}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Treino</Text>
            <Text style={styles.infoValor}>{perfil.tempoTreino || '—'}</Text>
          </View>
        </View>
        {perfil.cidade ? (
          <Text style={styles.localizacao}>📍 {perfil.cidade}, {perfil.estado}</Text>
        ) : null}
        {perfil.bio ? <Text style={styles.bio}>&quot;{perfil.bio}&quot;</Text> : null}
      </View>

      {/* Botões */}
      <TouchableOpacity style={styles.btnEditar} onPress={abrirEdicao}>
        <Text style={styles.btnEditarTexto}>✏️ Editar Perfil</Text>
      </TouchableOpacity>

      {!modoDemo ? (
        <>
          <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
            <Text style={styles.btnLogoutTexto}>Sair da conta</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDeletarConta}>
            <Text style={styles.linkDeletar}>Deletar minha conta</Text>
          </TouchableOpacity>
        </>
      ) : null}

      {/* Modal de Edição */}
      <Modal visible={editando} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>✏️ Editar Perfil</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Nome</Text>
              <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholderTextColor={COLORS.textMuted} />

              <Text style={styles.label}>Peso (kg)</Text>
              <TextInput style={styles.input} value={peso} onChangeText={setPeso} keyboardType="decimal-pad" placeholderTextColor={COLORS.textMuted} />

              <Text style={styles.label}>Tempo de Treino</Text>
              <TextInput style={styles.input} value={tempoTreino} onChangeText={setTempoTreino} placeholderTextColor={COLORS.textMuted} />

              <Text style={styles.label}>Bio</Text>
              <TextInput style={[styles.input, { height: 60 }]} value={bio} onChangeText={setBio} multiline placeholderTextColor={COLORS.textMuted} />

              <Text style={styles.label}>Modalidade</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {MODALIDADES.map((m) => (
                  <TouchableOpacity key={m} style={[styles.tag, modalidade === m && styles.tagSel]} onPress={() => setModalidade(m)}>
                    <Text style={[styles.tagTexto, modalidade === m && { color: COLORS.white }]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>CEP</Text>
              <View style={styles.cepRow}>
                <TextInput style={[styles.input, { flex: 1 }]} value={cep} onChangeText={setCep} keyboardType="numeric" maxLength={9} placeholderTextColor={COLORS.textMuted} />
                <TouchableOpacity style={styles.botaoCep} onPress={handleBuscarCEP} disabled={buscandoCep}>
                  {buscandoCep ? <ActivityIndicator color={COLORS.white} size="small" /> : <Text style={{ color: COLORS.white, fontFamily: FONTS.semiBold }}>Buscar</Text>}
                </TouchableOpacity>
              </View>
              {cidade ? <Text style={styles.cidadeTexto}>📍 {cidade} — {estado}</Text> : null}
            </ScrollView>

            <View style={styles.modalAcoes}>
              <TouchableOpacity style={styles.btnCancelarModal} onPress={() => setEditando(false)}>
                <Text style={{ color: COLORS.textSecondary, fontFamily: FONTS.semiBold }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSalvar} onPress={handleSalvar} disabled={carregando}>
                {carregando ? <ActivityIndicator color={COLORS.white} /> : <Text style={{ color: COLORS.white, fontFamily: FONTS.semiBold }}>Salvar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  topSection: { alignItems: 'center', paddingTop: 70, paddingBottom: SIZES.xl },
  avatar: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: COLORS.primary, marginBottom: SIZES.md, ...SHADOWS.lg,
  },
  avatarEmoji: { fontSize: 48 },
  nome: { fontFamily: FONTS.bold, fontSize: SIZES.textXxl, color: COLORS.textPrimary },
  email: { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textSecondary, marginTop: 4 },
  demoAviso: { fontFamily: FONTS.medium, fontSize: SIZES.textXs, color: COLORS.success, marginTop: SIZES.xs },
  infoCard: { marginHorizontal: SIZES.lg, backgroundColor: COLORS.surface, borderRadius: 6, padding: SIZES.lg, ...SHADOWS.sm },
  infoTitulo: { fontFamily: FONTS.semiBold, fontSize: SIZES.textLg, color: COLORS.textPrimary, marginBottom: SIZES.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: SIZES.md },
  infoItem: { alignItems: 'center' },
  infoLabel: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textMuted },
  infoValor: { fontFamily: FONTS.bold, fontSize: SIZES.textLg, color: COLORS.textPrimary, marginTop: 4 },
  localizacao: { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textSecondary, textAlign: 'center' },
  bio: { fontFamily: FONTS.regular, fontSize: SIZES.textSm, color: COLORS.textMuted, textAlign: 'center', fontStyle: 'italic', marginTop: SIZES.sm },
  btnEditar: { marginHorizontal: SIZES.lg, marginTop: SIZES.lg, backgroundColor: COLORS.primary, padding: SIZES.md, borderRadius: SIZES.radiusMd, alignItems: 'center', ...SHADOWS.lg },
  btnEditarTexto: { fontFamily: FONTS.semiBold, color: COLORS.white, fontSize: SIZES.textMd },
  btnLogout: { marginHorizontal: SIZES.lg, marginTop: SIZES.md, backgroundColor: COLORS.surfaceLight, padding: SIZES.md, borderRadius: SIZES.radiusMd, alignItems: 'center' },
  btnLogoutTexto: { fontFamily: FONTS.semiBold, color: COLORS.textSecondary, fontSize: SIZES.textMd },
  linkDeletar: { textAlign: 'center', marginTop: SIZES.lg, color: COLORS.error, fontFamily: FONTS.regular, fontSize: SIZES.textSm },
  modalOverlay: { flex: 1, backgroundColor: '#000000CC', justifyContent: 'flex-end' },
  modal: { backgroundColor: COLORS.surface, borderTopLeftRadius: SIZES.radiusXl, borderTopRightRadius: SIZES.radiusXl, padding: SIZES.lg, maxHeight: '90%' },
  modalTitulo: { fontFamily: FONTS.bold, fontSize: SIZES.textXl, color: COLORS.textPrimary, marginBottom: SIZES.md },
  label: { fontFamily: FONTS.medium, fontSize: SIZES.textSm, color: COLORS.textSecondary, marginBottom: 4, marginTop: SIZES.sm },
  input: { backgroundColor: COLORS.surfaceLight, borderRadius: SIZES.radiusMd, padding: SIZES.md, color: COLORS.textPrimary, fontFamily: FONTS.regular, borderWidth: 1, borderColor: COLORS.border },
  cepRow: { flexDirection: 'row', gap: SIZES.sm },
  botaoCep: { backgroundColor: COLORS.primary, borderRadius: SIZES.radiusMd, paddingHorizontal: SIZES.md, justifyContent: 'center' },
  cidadeTexto: { fontFamily: FONTS.medium, color: COLORS.success, fontSize: SIZES.textSm, marginTop: SIZES.xs },
  tag: { paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusFull, borderWidth: 1, borderColor: COLORS.border, marginRight: SIZES.sm, backgroundColor: COLORS.surfaceLight },
  tagSel: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tagTexto: { fontFamily: FONTS.medium, color: COLORS.textSecondary, fontSize: SIZES.textSm },
  modalAcoes: { flexDirection: 'row', gap: SIZES.md, marginTop: SIZES.lg },
  btnCancelarModal: { flex: 1, padding: SIZES.md, borderRadius: SIZES.radiusMd, backgroundColor: COLORS.surfaceLight, alignItems: 'center' },
  btnSalvar: { flex: 1, padding: SIZES.md, borderRadius: SIZES.radiusMd, backgroundColor: COLORS.primary, alignItems: 'center' },
});
