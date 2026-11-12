// Contexto global de autenticação
// Disponibiliza o usuário logado para qualquer tela do app
import React, { createContext, useContext, useEffect, useState } from 'react';
import { inicializarBanco } from '../services/sqliteService';

const AuthContext = createContext(null);

const USUARIO_DEMO = {
  uid: 'fightmatch-demo-user',
  email: 'rafa.demo@example.com',
  demo: true,
};

const PERFIL_DEMO = {
  uid: USUARIO_DEMO.uid,
  email: USUARIO_DEMO.email,
  nome: 'Rafa Silva',
  peso: 72,
  modalidade: 'MMA',
  tempoTreino: '3 anos',
  bio: 'Perfil fictício para testar o FightMatch.',
  cidade: 'Sao Paulo',
  estado: 'SP',
};

export const AuthProvider = ({ children }) => {
  const usuario = USUARIO_DEMO;
  const [perfil, setPerfil] = useState(PERFIL_DEMO);

  useEffect(() => {
    inicializarBanco().catch((e) => {
      console.error('Não foi possível inicializar o banco local:', e.message);
    });
  }, []);

  const atualizarPerfilLocal = (novosDados) => {
    setPerfil((prev) => ({ ...prev, ...novosDados }));
  };

  return (
    <AuthContext.Provider value={{ usuario, perfil, carregando: false, atualizarPerfilLocal }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar o contexto
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
};
