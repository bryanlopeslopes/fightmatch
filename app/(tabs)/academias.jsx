import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';

const LOCALIZACAO_DF = { latitude: -15.7939, longitude: -47.8828 };
const LIMITES_MAPA = { minLat: -15.91, maxLat: -15.70, minLng: -48.12, maxLng: -47.76 };

const ACADEMIAS = [
  {
    id: 'asa-sul', nome: 'Fight Lab Asa Sul', bairro: 'Asa Sul', modalidade: 'MMA · Jiu-Jitsu',
    latitude: -15.8115, longitude: -47.8942, mapaX: 62, mapaY: 55,
  },
  {
    id: 'asa-norte', nome: 'Centro de Lutas Norte', bairro: 'Asa Norte', modalidade: 'Boxe · Muay Thai',
    latitude: -15.7562, longitude: -47.8834, mapaX: 66, mapaY: 28,
  },
  {
    id: 'lago-sul', nome: 'Arena 61', bairro: 'Lago Sul', modalidade: 'MMA · Wrestling',
    latitude: -15.8314, longitude: -47.8711, mapaX: 75, mapaY: 68,
  },
  {
    id: 'aguas-claras', nome: 'DF Combat', bairro: 'Aguas Claras', modalidade: 'Boxe · Kickboxing',
    latitude: -15.8404, longitude: -48.0260, mapaX: 28, mapaY: 73,
  },
  {
    id: 'taguatinga', nome: 'Taguatinga Fight Club', bairro: 'Taguatinga', modalidade: 'Jiu-Jitsu · MMA',
    latitude: -15.8297, longitude: -48.0571, mapaX: 15, mapaY: 64,
  },
];

const calcularDistanciaKm = (origem, destino) => {
  const radianos = (graus) => (graus * Math.PI) / 180;
  const deltaLatitude = radianos(destino.latitude - origem.latitude);
  const deltaLongitude = radianos(destino.longitude - origem.longitude);
  const latitudeOrigem = radianos(origem.latitude);
  const latitudeDestino = radianos(destino.latitude);
  const haversine = Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(latitudeOrigem) * Math.cos(latitudeDestino) * Math.sin(deltaLongitude / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const formatarDistancia = (quilometros) => (
  quilometros < 1
    ? `${Math.round(quilometros * 1000)} m`
    : `${quilometros.toFixed(1)} km`
);

export default function Agendamentos() {
  const [localizacao, setLocalizacao] = useState(LOCALIZACAO_DF);
  const [gpsAtivo, setGpsAtivo] = useState(false);
  const [buscandoGps, setBuscandoGps] = useState(false);
  const [statusGps, setStatusGps] = useState('Distancias aproximadas desde o Plano Piloto');
  const [academiaSelecionada, setAcademiaSelecionada] = useState(ACADEMIAS[0].id);

  const academiasProximas = useMemo(() => ACADEMIAS
    .map((academia) => ({
      ...academia,
      distancia: calcularDistanciaKm(localizacao, academia),
    }))
    .sort((a, b) => a.distancia - b.distancia), [localizacao]);

  const localizarAgora = async () => {
    setBuscandoGps(true);
    setStatusGps('Aguardando permissao de localizacao...');

    try {
      const permissao = await Location.requestForegroundPermissionsAsync();
      if (permissao.status !== 'granted') {
        setGpsAtivo(false);
        setStatusGps('Permissao negada · usando Plano Piloto como referencia');
        return;
      }

      const posicao = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const atual = {
        latitude: posicao.coords.latitude,
        longitude: posicao.coords.longitude,
      };
      setLocalizacao(atual);
      setGpsAtivo(true);
      setStatusGps(
        atual.latitude >= LIMITES_MAPA.minLat && atual.latitude <= LIMITES_MAPA.maxLat
          && atual.longitude >= LIMITES_MAPA.minLng && atual.longitude <= LIMITES_MAPA.maxLng
          ? 'GPS ativo · distancias aproximadas'
          : 'GPS fora do mapa demonstrativo do DF'
      );
    } catch {
      setGpsAtivo(false);
      setStatusGps('GPS indisponivel · usando Plano Piloto como referencia');
    } finally {
      setBuscandoGps(false);
    }
  };

  const renderAcademia = ({ item, index }) => {
    const selecionada = item.id === academiaSelecionada;
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`${item.nome}, ${item.bairro}, ${formatarDistancia(item.distancia)}`}
        style={[styles.academiaLinha, selecionada && styles.academiaSelecionada]}
        onPress={() => setAcademiaSelecionada(item.id)}
      >
        <View style={[styles.indiceAcademia, selecionada && styles.indiceAcademiaSelecionado]}>
          <Text style={styles.indiceTexto}>{index + 1}</Text>
        </View>
        <View style={styles.academiaInfo}>
          <Text style={styles.nomeAcademia}>{item.nome}</Text>
          <Text style={styles.detalheAcademia}>{item.bairro} · {item.modalidade}</Text>
        </View>
        <Text style={styles.distancia}>{formatarDistancia(item.distancia)}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titulos}>
          <Text style={styles.titulo}>Academias no DF</Text>
          <Text style={styles.subtitulo}>Mapa demonstrativo · locais ficticios</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Usar minha localizacao GPS"
          style={styles.botaoGps}
          onPress={localizarAgora}
          disabled={buscandoGps}
        >
          {buscandoGps
            ? <ActivityIndicator color={COLORS.white} size="small" />
            : <Text style={styles.botaoGpsTexto}>◎ GPS</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.mapa}>
        {academiasProximas.map((academia, index) => (
          <TouchableOpacity
            key={academia.id}
            accessibilityRole="button"
            accessibilityLabel={`Marcar ${academia.nome}`}
            style={[
              styles.marcador,
              { left: `${academia.mapaX}%`, top: `${academia.mapaY}%` },
              academia.id === academiaSelecionada && styles.marcadorSelecionado,
            ]}
            onPress={() => setAcademiaSelecionada(academia.id)}
          >
            <Text style={styles.numeroMarcador}>{index + 1}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statusLocalizacao}>
        <View style={[styles.statusPonto, gpsAtivo && styles.statusPontoGps]} />
        <Text style={styles.statusTexto} numberOfLines={1}>{statusGps}</Text>
        <Text style={styles.contagem}>{academiasProximas.length} locais</Text>
      </View>

      <View style={styles.listaCabecalho}>
        <Text style={styles.listaTitulo}>Academias proximas</Text>
        <Text style={styles.listaNota}>Distancia em linha reta</Text>
      </View>

      <FlatList
        data={academiasProximas}
        keyExtractor={(item) => item.id}
        renderItem={renderAcademia}
        style={styles.lista}
        contentContainerStyle={styles.listaConteudo}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 48 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg, paddingBottom: SIZES.md, gap: SIZES.sm,
  },
  titulos: { flex: 1 },
  titulo: { fontFamily: FONTS.bold, fontSize: SIZES.textXl, color: COLORS.textPrimary },
  subtitulo: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textSecondary, marginTop: 3 },
  botaoGps: {
    minWidth: 76, height: 40, paddingHorizontal: SIZES.sm,
    borderRadius: 6, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  botaoGpsTexto: { fontFamily: FONTS.semiBold, fontSize: SIZES.textSm, color: COLORS.white },
  mapa: {
    height: 300, marginHorizontal: SIZES.md, overflow: 'hidden',
    borderRadius: 6, backgroundColor: '#E4E9E1', position: 'relative',
    borderWidth: 1, borderColor: '#C8D0C5',
  },
  marcador: {
    position: 'absolute', width: 30, height: 30, marginLeft: -15, marginTop: -15,
    borderRadius: 15, backgroundColor: COLORS.white, borderWidth: 2, borderColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm,
  },
  marcadorSelecionado: { backgroundColor: COLORS.primary, transform: [{ scale: 1.18 }] },
  numeroMarcador: { fontFamily: FONTS.bold, fontSize: SIZES.textXs, color: COLORS.primary },
  marcadorUsuario: { position: 'absolute', alignItems: 'center', marginLeft: -25, marginTop: -10 },
  pontoUsuario: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#1686F8', borderWidth: 3, borderColor: COLORS.white, ...SHADOWS.sm },
  rotuloUsuario: { marginTop: 2, fontFamily: FONTS.semiBold, fontSize: 9, color: '#1C5FA8' },
  seloMapa: { position: 'absolute', right: SIZES.sm, top: SIZES.sm, paddingHorizontal: SIZES.sm, paddingVertical: 4, backgroundColor: '#FFFFFFD9', borderRadius: 4 },
  seloMapaTexto: { fontFamily: FONTS.bold, fontSize: 9, color: '#4B5947' },
  statusLocalizacao: { flexDirection: 'row', alignItems: 'center', gap: SIZES.xs, paddingHorizontal: SIZES.lg, paddingVertical: SIZES.sm },
  statusPonto: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.accent },
  statusPontoGps: { backgroundColor: COLORS.success },
  statusTexto: { flex: 1, fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textSecondary },
  contagem: { fontFamily: FONTS.semiBold, fontSize: SIZES.textXs, color: COLORS.textMuted },
  listaCabecalho: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: SIZES.lg, paddingTop: SIZES.xs, paddingBottom: SIZES.xs },
  listaTitulo: { fontFamily: FONTS.semiBold, fontSize: SIZES.textMd, color: COLORS.textPrimary },
  listaNota: { fontFamily: FONTS.regular, fontSize: 10, color: COLORS.textMuted },
  lista: { flex: 1 },
  listaConteudo: { paddingHorizontal: SIZES.md, paddingBottom: SIZES.md },
  academiaLinha: {
    minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: SIZES.sm,
    paddingHorizontal: SIZES.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  academiaSelecionada: { backgroundColor: COLORS.surfaceLight, borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  indiceAcademia: { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  indiceAcademiaSelecionado: { backgroundColor: COLORS.primary },
  indiceTexto: { fontFamily: FONTS.bold, fontSize: SIZES.textXs, color: COLORS.textPrimary },
  academiaInfo: { flex: 1 },
  nomeAcademia: { fontFamily: FONTS.semiBold, fontSize: SIZES.textSm, color: COLORS.textPrimary },
  detalheAcademia: { fontFamily: FONTS.regular, fontSize: SIZES.textXs, color: COLORS.textSecondary, marginTop: 2 },
  distancia: { fontFamily: FONTS.semiBold, fontSize: SIZES.textSm, color: COLORS.success },
});