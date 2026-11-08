const CHAVE_STORAGE = 'trip_planner_viagens';

function carregarViagens() {
    const dados = localStorage.getItem(CHAVE_STORAGE);
    if (!dados) return [];
    try {
        return JSON.parse(dados);
    } catch (e) {
        console.error('Erro ao analisar dados do localStorage', e);
        return [];
    }
}

function salvarViagens(viagens) {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(viagens));
}

function inicializarDadosLocalStorage() {
    if (!localStorage.getItem(CHAVE_STORAGE)) {
        const viagensIniciais = [
            {
                id: '1',
                destino: 'Paris',
                pais: 'França',
                bandeira: 'https://flagcdn.com/w320/fr.png',
                dataIda: '2027-05-10',
                dataVolta: '2027-05-20',
                orcamento: 15000.00,
                status: 'planejada',
                observacoes: 'Visitar a Torre Eiffel, Museu do Louvre e fazer passeio de barco pelo Rio Sena. Comprar ingressos com antecedência.'
            },
            {
                id: '2',
                destino: 'Tóquio',
                pais: 'Japão',
                bandeira: 'https://flagcdn.com/w320/jp.png',
                dataIda: '2026-10-01',
                dataVolta: '2026-10-15',
                orcamento: 22500.00,
                status: 'em-andamento',
                observacoes: 'Explorar os templos de Quioto e a tecnologia de Tóquio.'
            },
            {
                id: '3',
                destino: 'Buenos Aires',
                pais: 'Argentina',
                bandeira: 'https://flagcdn.com/w320/ar.png',
                dataIda: '2025-01-12',
                dataVolta: '2025-01-18',
                orcamento: 4500.00,
                status: 'concluida',
                observacoes: 'Curtir a gastronomia local e shows de tango.'
            }
        ];
        salvarViagens(viagensIniciais);
    }
}

let promessaListaPaises = null;

function normalizarNomePais(nome) {
    return String(nome || '').trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ');
}

async function buscarDadosPaisAPI(nomePais) {
    const nomeBuscado = normalizarNomePais(nomePais);
    if (!nomeBuscado) return null;

    try {
        if (!promessaListaPaises) {
            const campos = 'name,alpha2Code,capital,currencies,population,region,flags,nativeName';
            promessaListaPaises = fetch(`https://countries.dev/countries?fields=${campos}`)
                .then(async resposta => {
                    if (!resposta.ok) throw new Error(`API de países retornou HTTP ${resposta.status}`);
                    const lista = await resposta.json();
                    if (!Array.isArray(lista)) throw new Error('Formato inesperado da API de países');
                    return lista;
                })
                .catch(erro => {
                    promessaListaPaises = null;
                    throw erro;
                });
        }

        const listaPaises = await promessaListaPaises;
        const nomesEmPortugues = new Intl.DisplayNames(['pt-BR'], { type: 'region' });
        const codigosAlternativos = {
            'eua': 'US', 'usa': 'US', 'estados unidos da america': 'US',
            'inglaterra': 'GB', 'gra bretanha': 'GB',
            'holanda': 'NL', 'paises baixos': 'NL'
        };
        const codigoAlternativo = codigosAlternativos[nomeBuscado];

        const paisData = listaPaises.find(pais => {
            const nomePortugues = pais.alpha2Code ? nomesEmPortugues.of(pais.alpha2Code) : '';
            return (codigoAlternativo && pais.alpha2Code === codigoAlternativo) ||
                [pais.name, pais.nativeName, nomePortugues, pais.alpha2Code, pais.alpha3Code]
                    .some(nome => normalizarNomePais(nome) === nomeBuscado);
        });

        if (!paisData) {
            console.info(`País não encontrado: ${nomePais}`);
            return null;
        }

        const nomePortugues = nomesEmPortugues.of(paisData.alpha2Code);
        const regioes = {
            'Americas': 'Américas', 'Europe': 'Europa', 'Asia': 'Ásia',
            'Africa': 'África', 'Oceania': 'Oceania', 'Polar': 'Região polar'
        };

        return {
            nome: nomePortugues || paisData.name || 'Não informado',
            capital: paisData.capital || 'Não informada',
            moeda: Array.isArray(paisData.currencies) && paisData.currencies.length
                ? paisData.currencies.map(m => `${m.name} (${m.code || m.symbol || ''})`).join(', ')
                : 'Não informada',
            populacao: typeof paisData.population === 'number'
                ? paisData.population.toLocaleString('pt-BR') : 'Não informada',
            regiao: regioes[paisData.region] || paisData.region || 'Não informada',
            bandeira: paisData.flags?.svg || paisData.flags?.png ||
                (paisData.alpha2Code ? `https://flagcdn.com/w320/${paisData.alpha2Code.toLowerCase()}.png` : '')
        };
    } catch (error) {
        console.warn('Não foi possível consultar os dados do país:', error);
        return null;
    }
}

function configurarPaginaPrincipal() {
    renderizarTabelaViagens();
    atualizarResumoRapido();

    const btnFiltrar = document.querySelector('.busca button');
    const inputPesquisa = document.getElementById('pesquisa');
    const selectStatus = document.getElementById('filtro-status');
    const selectOrdenacao = document.getElementById('ordenacao');

    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', (e) => {
            e.preventDefault();
            aplicarFiltrosEEsponsividade();
        });
    }

    if (inputPesquisa) inputPesquisa.addEventListener('input', aplicarFiltrosEEsponsividade);
    if (selectStatus) selectStatus.addEventListener('change', aplicarFiltrosEEsponsividade);
    if (selectOrdenacao) selectOrdenacao.addEventListener('change', aplicarFiltrosEEsponsividade);
}

function aplicarFiltrosEEsponsividade() {
    const termoPesquisa = document.getElementById('pesquisa').value.toLowerCase().trim();
    const statusFiltro = document.getElementById('filtro-status').value;
    const ordenacao = document.getElementById('ordenacao').value;

    let viagens = carregarViagens();

    if (termoPesquisa) {
        viagens = viagens.filter(v => 
            v.destino.toLowerCase().includes(termoPesquisa) || 
            v.pais.toLowerCase().includes(termoPesquisa)
        );
    }

    if (statusFiltro) {
        viagens = viagens.filter(v => v.status === statusFiltro);
    }

    viagens.sort((a, b) => {
        if (ordenacao === 'data-asc') {
            return new Date(a.dataIda) - new Date(b.dataIda);
        } else if (ordenacao === 'data-desc') {
            return new Date(b.dataIda) - new Date(a.dataIda);
        } else if (ordenacao === 'orcamento-desc') {
            return b.orcamento - a.orcamento;
        } else if (ordenacao === 'orcamento-asc') {
            return a.orcamento - b.orcamento;
        }
        return 0;
    });

    renderizarTabelaViagens(viagens);
}

function renderizarTabelaViagens(viagensParaExibir = null) {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;

    const viagens = viagensParaExibir || carregarViagens();
    tbody.innerHTML = '';

    if (viagens.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8">Nenhuma viagem encontrada.</td></tr>`;
        return;
    }

    viagens.forEach(viagem => {
        const tr = document.createElement('tr');
        const dataIdaF = formatarDataBR(viagem.dataIda);
        const dataVoltaF = formatarDataBR(viagem.dataVolta);
        const orcamentoF = Number(viagem.orcamento).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const statusFormatado = formatarStatus(viagem.status);

        tr.innerHTML = `
            <td>${viagem.destino}</td>
            <td>${viagem.pais}</td>
            <td><img src="${viagem.bandeira || 'https://flagcdn.com/w320/un.png'}" alt="Bandeira de ${viagem.pais}" width="70"></td>
            <td>${dataIdaF}</td>
            <td>${dataVoltaF}</td>
            <td>${orcamentoF}</td>
            <td>${statusFormatado}</td>
            <td>
                <a href="pages/detalhes-viagem.html?id=${viagem.id}">Ver detalhes</a>
                <a href="pages/cadastro-viagem.html?id=${viagem.id}">Editar</a>
                <button type="button" class="btn-excluir" data-id="${viagem.id}">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.querySelectorAll('.btn-excluir').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            excluirViagem(id);
        });
    });
}

function excluirViagem(id) {
    if (confirm('Tem certeza que deseja excluir esta viagem?')) {
        let viagens = carregarViagens();
        viagens = viagens.filter(v => v.id !== id);
        salvarViagens(viagens);
        renderizarTabelaViagens();
        atualizarResumoRapido();
    }
}

function atualizarResumoRapido() {
    const asideUl = document.querySelector('aside ul');
    if (!asideUl) return;

    const viagens = carregarViagens();
    const total = viagens.length;

    const hoje = new Date().toISOString().split('T')[0];
    const futuras = viagens.filter(v => v.dataIda >= hoje).sort((a, b) => new Date(a.dataIda) - new Date(b.dataIda));
    const proxima = futuras.length > 0 ? `${futuras[0].destino} (${futuras[0].pais})` : 'Nenhuma programada';

    asideUl.innerHTML = `
        <li>Total de viagens: <strong>${total}</strong></li>
        <li>Próximo destino: <strong>${proxima}</strong></li>
    `;
}

function configurarPaginaCadastro() {
    const form = document.querySelector('main.main-cadastro form');
    if (!form) return;

    const urlParams = new URLSearchParams(window.location.search);
    const idEdicao = urlParams.get('id');

    const tituloPagina = document.querySelector('main.main-cadastro h2');
    const botaoSalvar = form.querySelector('button[type="submit"]');

    if (idEdicao) {
        if (tituloPagina) tituloPagina.textContent = 'Editar Viagem';
        if (botaoSalvar) botaoSalvar.textContent = 'Atualizar Viagem';

        const viagens = carregarViagens();
        const viagemParaEditar = viagens.find(v => v.id === idEdicao);

        if (viagemParaEditar) {
            document.getElementById('destino').value = viagemParaEditar.destino;
            document.getElementById('pais').value = viagemParaEditar.pais;
            document.getElementById('data-ida').value = viagemParaEditar.dataIda;
            document.getElementById('data-volta').value = viagemParaEditar.dataVolta;
            document.getElementById('orcamento').value = viagemParaEditar.orcamento;
            document.getElementById('status').value = viagemParaEditar.status;
            document.getElementById('observacoes').value = viagemParaEditar.observacoes || '';
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const destino = document.getElementById('destino').value.trim();
        const pais = document.getElementById('pais').value.trim();
        const dataIda = document.getElementById('data-ida').value;
        const dataVolta = document.getElementById('data-volta').value;
        const orcamento = parseFloat(document.getElementById('orcamento').value);
        const status = document.getElementById('status').value;
        const observacoes = document.getElementById('observacoes').value.trim();

        if (new Date(dataIda) > new Date(dataVolta)) {
            alert('A data de ida não pode ser posterior à data de volta!');
            return;
        }

        const dadosPaisApi = await buscarDadosPaisAPI(pais);
        let viagens = carregarViagens();
        const viagemOriginal = idEdicao ? viagens.find(v => v.id === idEdicao) : null;
        const bandeira = dadosPaisApi?.bandeira ||
            (viagemOriginal?.pais === pais ? viagemOriginal.bandeira : null) ||
            'https://flagcdn.com/w320/un.png';

        if (idEdicao) {
            viagens = viagens.map(v => {
                if (v.id === idEdicao) {
                    return {
                        ...v,
                        destino,
                        pais,
                        bandeira,
                        dataIda,
                        dataVolta,
                        orcamento,
                        status,
                        observacoes
                    };
                }
                return v;
            });
            alert('Viagem atualizada com sucesso!');
        } else {
            const novaViagem = {
                id: Date.now().toString(),
                destino,
                pais,
                bandeira,
                dataIda,
                dataVolta,
                orcamento,
                status,
                observacoes
            };
            viagens.push(novaViagem);
            alert('Viagem cadastrada com sucesso!');
        }

        salvarViagens(viagens);
        window.location.href = '../index.html';
    });
}

async function configurarPaginaDetalhes() {
    const urlParams = new URLSearchParams(window.location.search);
    const idViagem = urlParams.get('id'); 

    if (!idViagem) {
        alert('Nenhuma viagem selecionada!');
        window.location.href = '../index.html';
        return;
    }

    const viagens = carregarViagens();
    const viagem = viagens.find(v => v.id === idViagem);

    if (!viagem) {
        alert('Viagem não encontrada!');
        window.location.href = '../index.html';
        return;
    }

    const d1 = new Date(viagem.dataIda);
    const d2 = new Date(viagem.dataVolta);
    const diffTempo = Math.abs(d2 - d1);
    const diffDias = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));

    const h2Detalhes = document.querySelector('article section h2');
    if (h2Detalhes) h2Detalhes.textContent = `Detalhes da Viagem: ${viagem.destino}`;
    
    const pStatus = document.querySelector('article section p');
    if (pStatus) pStatus.innerHTML = `Status atual: <strong>${formatarStatus(viagem.status)}</strong>`;

    const ulInfo = document.querySelector('article section:nth-of-type(2) ul');
    if (ulInfo) {
        ulInfo.innerHTML = `
            <li><strong>Destino:</strong> ${viagem.destino}</li>
            <li><strong>País:</strong> ${viagem.pais}</li>
            <li><strong>Data de Ida:</strong> ${formatarDataBR(viagem.dataIda)}</li>
            <li><strong>Data de Volta:</strong> ${formatarDataBR(viagem.dataVolta)}</li>
            <li><strong>Duração:</strong> ${diffDias} dias</li>
            <li><strong>Orçamento Planejado:</strong> ${Number(viagem.orcamento).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</li>
        `;
    }

    const pObs = document.querySelector('article section:nth-of-type(2) h4 + p');
    if (pObs) pObs.textContent = viagem.observacoes || 'Nenhuma observação registrada.';

    const dadosApi = await buscarDadosPaisAPI(viagem.pais);
    const imgBandeira = document.querySelector('article figure img');
    if (imgBandeira) {
        const urlBandeira = dadosApi?.bandeira || viagem.bandeira;
        if (urlBandeira) {
            imgBandeira.src = urlBandeira;
            imgBandeira.alt = `Bandeira de ${viagem.pais}`;
        } else {
            imgBandeira.hidden = true;
        }
    }

    const ulApi = document.querySelector('article section:nth-of-type(3) ul');
    if (ulApi) {
        if (dadosApi) {
            ulApi.innerHTML = `
                <li><strong>Nome do país:</strong> ${dadosApi.nome}</li>
                <li><strong>Capital:</strong> ${dadosApi.capital}</li>
                <li><strong>Moeda:</strong> ${dadosApi.moeda}</li>
                <li><strong>População:</strong> ${dadosApi.populacao} habitantes</li>
                <li><strong>Região:</strong> ${dadosApi.regiao}</li>
            `;
        } else {
            // Não mostrar dados fixos de Paris se a consulta de outro país falhar.
            ulApi.innerHTML = '<li>Não foi possível carregar os dados deste país no momento.</li>';
        }
    }

    const btnEditar = document.querySelector('article section:last-child a');
    if (btnEditar) btnEditar.href = `cadastro-viagem.html?id=${viagem.id}`;

    const btnExcluir = document.querySelector('article section:last-child .botao-excluir');
    if (btnExcluir) {
        btnExcluir.addEventListener('click', () => {
            if (confirm('Deseja realmente excluir esta viagem?')) {
                let lista = carregarViagens();
                lista = lista.filter(v => v.id !== idViagem);
                salvarViagens(lista);
                window.location.href = '../index.html';
            }
        });
    }
}

function formatarDataBR(dataStr) {
    if (!dataStr) return '';
    const partes = dataStr.split('-');
    if (partes.length !== 3) return dataStr;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatarStatus(statusKey) {
    const mapa = {
        'planejada': 'Planejada',
        'em-andamento': 'Em Andamento',
        'concluida': 'Concluída',
        'cancelada': 'Cancelada'
    };
    return mapa[statusKey] || statusKey;
}

document.addEventListener('DOMContentLoaded', () => {
    inicializarDadosLocalStorage();
    const path = window.location.pathname;
    if (path.includes('cadastro-viagem.html')) {
        configurarPaginaCadastro();
    } else if (path.includes('detalhes-viagem.html')) {
        configurarPaginaDetalhes();
    } else {
        configurarPaginaPrincipal();
    }
});