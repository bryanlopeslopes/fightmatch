// Hook para monitorar conexão com internet
// Quando voltar a internet, sincroniza dados locais com o Firestore
import { useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { sincronizarTudo } from '../services/syncService';

export const useNetInfo = (uid) => {
  const [temInternet, setTemInternet] = useState(true);
  const foiOffline = useRef(false); // Controla se ficou offline antes
  const conexaoAnterior = useRef(null);

  useEffect(() => {
    const cancelar = NetInfo.addEventListener((state) => {
      const desconectado = state.isConnected === false || state.isInternetReachable === false;

      if (desconectado) {
        // Ficou sem internet
        foiOffline.current = true;
        conexaoAnterior.current = false;
        setTemInternet(false);
        console.log('📴 Sem internet — modo offline ativado');
      } else if (state.isConnected === true) {
        // Voltou a ter internet
        setTemInternet(true);

        if ((foiOffline.current || conexaoAnterior.current !== true) && uid) {
          foiOffline.current = false;
          conexaoAnterior.current = true;
          console.log('📶 Internet voltou — sincronizando...');
          sincronizarTudo(uid).catch((e) => {
            console.log('Erro ao iniciar sincronização:', e.message);
          });
        }
      }
    });

    return cancelar; // Para de ouvir quando desmontar
  }, [uid]);

  return temInternet;
};
