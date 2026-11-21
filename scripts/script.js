/**
 * Steam Game Finder
 * Busca informações de jogos, descrições em português,
 * imagens e preços, verificando descontos automaticamente.
 */

let chave = "Nome";

// Ordena os cards de acordo com o critério do usuário, o padrão é ordem alfabética
function ordenarCards(desordenado) {

  if (chave === "Nome"){
    const ordenado = Object.fromEntries(Object.entries(desordenado).sort(([a,],[b,]) => a.localeCompare(b)));
    return ordenado;
  }

  else if (chave === "Preço"){
    const ordenado = Object.fromEntries(Object.entries(desordenado).sort(([,a],[,b]) => a.precoAtual - b.precoAtual));
    return ordenado;
  }

  else if (chave === "Desconto"){
    const ordenado = Object.fromEntries(Object.entries(desordenado).sort(([,a],[,b]) => {
      const diferenca = b.desconto - a.desconto;
      if (diferenca !== 0) return diferenca;
      return a.nome.localeCompare(b.nome);
    }));
    return ordenado;
  }
}

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

  const jogos = ordenarCards(await resposta.json());

  container.replaceChildren();
  Object.values(jogos).forEach((jogo) => renderizarJogo(jogo, container));
}

//contorla o funcionamento do botão de ordenação
function controleMenu() {
  const botao = document.querySelector('[name="principal"]');
  const popover = document.querySelector('#popover');
  const opcoes = document.querySelectorAll('#popover .filtro');
  const texto = botao.querySelector('span');

  botao.addEventListener('click', () => {
    const aberto = popover.classList.toggle('aberto');

    botao.setAttribute('aria-expanded', aberto);
  });

  opcoes.forEach(opcao => {
    opcao.addEventListener('click', () => {
        texto.textContent = opcao.textContent;

        popover.classList.remove('aberto');
        botao.setAttribute('aria-expanded', 'false');
        
        chave = opcao.textContent;
        carregarJogos();
    });
  });

  document.addEventListener('click', (evento) => {
    if (!evento.target.closest('#controles')) {
        popover.classList.remove('aberto');
        botao.setAttribute('aria-expanded', 'false');
    }
  });
}

// Executa o carregamento
carregarJogos();
controleMenu();
