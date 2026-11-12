// API ViaCEP — Busca endereço a partir do CEP
// Documentação: https://viacep.com.br/

// Buscar endereço pelo CEP
export const buscarEnderecoPorCEP = async (cep) => {
  // Remove caracteres não numéricos do CEP
  const cepLimpo = cep.replace(/\D/g, '');

  if (cepLimpo.length !== 8) {
    throw new Error('CEP inválido. O CEP deve ter 8 dígitos.');
  }

  const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);

  if (!resposta.ok) {
    throw new Error('Erro ao consultar o CEP.');
  }

  const dados = await resposta.json();

  // ViaCEP retorna { erro: true } se o CEP não existir
  if (dados.erro) {
    throw new Error('CEP não encontrado.');
  }

  return {
    cep: dados.cep,
    cidade: dados.localidade,  // Ex: "São Paulo"
    estado: dados.uf,          // Ex: "SP"
    bairro: dados.bairro,      // Ex: "Vila Olímpia"
    logradouro: dados.logradouro,
  };
};
