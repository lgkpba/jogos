import { readFile, writeFile } from "node:fs/promises";

const ARQUIVO_JOGOS = "assets/jogos.json";
const ARQUIVO_SAIDA = "assets/dados.json";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8"
};

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

async function consultar(appId, tentativas = 3) {
  const url =
    `https://store.steampowered.com/api/appdetails` +
    `?appids=${encodeURIComponent(appId)}&cc=br&l=brazilian`;

  for (let i = 1; i <= tentativas; i++) {
    const res = await fetch(url, { headers: HEADERS });

    if (res.ok) {
      const json = await res.json();
      const item = json[appId];
      if (!item?.success || !item.data) {
        throw new Error("Jogo não encontrado na Steam");
      }
      return item.data;
    }

    console.warn(`  tentativa ${i}/${tentativas}: HTTP ${res.status}`);
    if (i < tentativas) await pausa(2000 * i);
  }

  throw new Error("Falha após várias tentativas");
}

function normalizar(nome, jogo) {
  const preco = jogo.price_overview ?? null;
  const desconto = preco?.discount_percent ?? 0;

  return {
    id: jogo.steam_appid,
    nome,
    descricao: jogo.short_description ?? "",
    imagem: jogo.header_image,
    desenvolvedores: jogo.developers ?? [],
    publicadoras: jogo.publishers ?? [],
    gratuito: jogo.is_free ?? false,
    emPromocao: desconto > 0,
    desconto,
    precoOriginal: preco ? preco.initial / 100 : null,
    precoAtual: preco ? preco.final / 100 : null,
    moeda: preco?.currency ?? null,
    precoFormatado: preco?.final_formatted ?? null,
    url: `https://store.steampowered.com/app/${jogo.steam_appid}/`
  };
}

async function main() {
  const jogos = JSON.parse(await readFile(ARQUIVO_JOGOS, "utf8"));

  let anteriores = {};
  try {
    anteriores = JSON.parse(await readFile(ARQUIVO_SAIDA, "utf8"));
  } catch {
    // primeira execução: ainda não existe dados.json
  }

  const saida = {};
  let sucessos = 0;

  for (const [nome, id] of Object.entries(jogos)) {
    console.log(`Consultando ${nome} (${id})...`);
    try {
      saida[nome] = normalizar(nome, await consultar(id));
      sucessos++;
    } catch (erro) {
      console.error(`  ERRO em ${nome}: ${erro.message}`);
      if (anteriores[nome]) saida[nome] = anteriores[nome]; // mantém o dado antigo
    }
    await pausa(1000);
  }

  if (sucessos === 0) {
    console.error("Nenhum jogo foi atualizado.");
    process.exit(1);
  }

  await writeFile(ARQUIVO_SAIDA, JSON.stringify(saida, null, 2) + "\n");
  console.log(`Concluído: ${sucessos}/${Object.keys(jogos).length} atualizados.`);
}

main();