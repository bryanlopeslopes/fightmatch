import React, { createContext, useContext, useState } from 'react';

const lutadoresDemo = [
  {
    id: 'demo-ana',
    nome: 'Ana Costa',
    peso: 61,
    modalidade: 'Jiu-Jitsu',
    tempoTreino: '4 anos',
    cidade: 'Sao Paulo',
    estado: 'SP',
    bio: 'Gosto de treinar tecnica e competir.',
    curtiuVoce: true,
  },
  {
    id: 'demo-bruno',
    nome: 'Bruno Lima',
    peso: 78,
    modalidade: 'Boxe',
    tempoTreino: '2 anos',
    cidade: 'Campinas',
    estado: 'SP',
    bio: 'Treino boxe durante a semana.',
    curtiuVoce: false,
  },
  {
    id: 'demo-camila',
    nome: 'Camila Rocha',
    peso: 57,
    modalidade: 'Muay Thai',
    tempoTreino: '5 anos',
    cidade: 'Santos',
    estado: 'SP',
    bio: 'Buscando novas parceiras de treino.',
    curtiuVoce: true,
  },
  {
    id: 'demo-diego',
    nome: 'Diego Alves',
    peso: 84,
    modalidade: 'MMA',
    tempoTreino: '3 anos',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    bio: 'Preparando minha proxima luta.',
    curtiuVoce: false,
  },
  {
    id: 'demo-julia',
    nome: 'Julia Martins',
    peso: 66,
    modalidade: 'Wrestling',
    tempoTreino: '1 ano',
    cidade: 'Curitiba',
    estado: 'PR',
    bio: 'Sempre pronta para aprender.',
    curtiuVoce: true,
  },
];

const DemoContext = createContext(null);

export const DemoProvider = ({ children }) => {
  const [avaliados, setAvaliados] = useState([]);
  const [matches, setMatches] = useState([]);
  const [mensagensPorMatch, setMensagensPorMatch] = useState({});

  const lutadoresDisponiveis = lutadoresDemo.filter((lutador) =>
    !avaliados.includes(lutador.id) && !matches.some((match) => match.lutador.id === lutador.id)
  );
  const temPerfisSemMatch = lutadoresDemo.some((lutador) =>
    !matches.some((match) => match.lutador.id === lutador.id)
  );

  const avaliarPerfil = (lutador, curtiu) => {
    setAvaliados((atuais) => atuais.includes(lutador.id) ? atuais : [...atuais, lutador.id]);

    if (curtiu && lutador.curtiuVoce) {
      setMatches((atuais) => atuais.some((match) => match.lutador.id === lutador.id)
        ? atuais
        : [...atuais, { id: lutador.id, lutador, status: 'ativo' }]
      );
      return true;
    }

    return false;
  };

  const recarregarSemMatch = () => {
    const idsComMatch = matches.map((match) => match.lutador.id);
    setAvaliados(idsComMatch);
  };

  const atualizarMatch = (matchId, status) => {
    setMatches((atuais) => atuais.map((match) =>
      match.id === matchId ? { ...match, status } : match
    ));
  };

  const excluirMatch = (matchId) => {
    setMatches((atuais) => atuais.filter((match) => match.id !== matchId));
    setMensagensPorMatch((atuais) => {
      const { [matchId]: removidas, ...restantes } = atuais;
      return restantes;
    });
  };

  const adicionarMensagemDemo = (matchId, uidRemetente, texto) => {
    const mensagem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      uidRemetente,
      texto,
      enviadoEm: new Date(),
    };
    setMensagensPorMatch((atuais) => ({
      ...atuais,
      [matchId]: [...(atuais[matchId] || []), mensagem],
    }));
    return mensagem;
  };

  return (
    <DemoContext.Provider value={{
      lutadoresDisponiveis,
      matchesDemo: matches,
      temPerfisSemMatch,
      avaliarPerfil,
      recarregarSemMatch,
      atualizarMatch,
      excluirMatch,
      mensagensPorMatch,
      adicionarMensagemDemo,
    }}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemo deve ser usado dentro de DemoProvider');
  return context;
};