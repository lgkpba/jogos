/**
 * Steam Game Finder
 * Busca informações de jogos, descrições em português,
 * imagens e preços, verificando descontos automaticamente.
 */

// Formata os preços para a moeda brasileira.
function formatarPreco(valor, moeda = "BRL") {
  if (valor == null) return "Preço indisponível";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: moeda
  }).format(valor);
}

// Cria e exibe o card do jogo.
function renderizarJogo(jogo, container) {
  const card = document.createElement("article");
  card.className = "steam-game-card";

  const imagem = document.createElement("img");
  imagem.src = jogo.imagem;
  imagem.alt = jogo.nome;
  imagem.loading = "lazy";

  const titulo = document.createElement("h2");
  titulo.textContent = jogo.nome;

  const descricao = document.createElement("p");
  descricao.textContent = jogo.descricao;

  const detalhes = document.createElement("p");
  detalhes.textContent =
    jogo.desenvolvedores.length > 0
      ? `Desenvolvido por: ${jogo.desenvolvedores.join(", ")}`
      : "Desenvolvedor não informado";

  const preco = document.createElement("div");
  preco.className = "steam-game-price";

  if (jogo.gratuito) {
    preco.textContent = "Gratuito";
  } else if (jogo.precoAtual !== null) {
    if (jogo.emPromocao) {
      const selo = document.createElement("span");
      selo.className = "steam-discount";
      selo.textContent = `-${jogo.desconto}%`;

      const original = document.createElement("del");
      original.textContent = formatarPreco(
        jogo.precoOriginal,
        jogo.moeda
      );

      const atual = document.createElement("strong");
      atual.textContent = formatarPreco(
        jogo.precoAtual,
        jogo.moeda
      );

      preco.append(selo, original, atual);
    } else {
      preco.textContent = formatarPreco(
        jogo.precoAtual,
        jogo.moeda
      );
    }
  } else {
    preco.textContent = "Preço indisponível";
  }

  const link = document.createElement("a");
  link.href = jogo.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Ver na Steam";

  card.append(imagem, titulo, descricao, detalhes, preco, link);
  container.appendChild(card);

  return card;
}

async function carregarJogos(caminho = "./assets/dados.json") {
  const container = document.getElementById("jogos");

  if (!container) {
    throw new Error('Elemento "#jogos" não encontrado.');
  }

  const resposta = await fetch(caminho);

  if (!resposta.ok) {
    throw new Error(`Erro ao carregar dados: ${resposta.status}`);
  }

  const jogos = await resposta.json();

  container.replaceChildren();
  Object.values(jogos).forEach((jogo) => renderizarJogo(jogo, container));
}

// Executa o carregamento
carregarJogos();

