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
        // Dados iniciais fornecidos no seu modelo HTML original
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

async function buscarDadosPaisAPI(nomePais) {
    if (!nomePais) return null;
    try {
        const resposta = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(nomePais)}?lang=por`);
        if (!resposta.ok) throw new Error('País não encontrado na API');
        const [paisData] = await resposta.json();
        
        return {
            nomeOficial: paisData.name.nativeName ? Object.values(paisData.name.nativeName)[0].official : paisData.name.official,
            capital: paisData.capital ? paisData.capital[0] : 'Não informada',
            moeda: paisData.currencies ? Object.values(paisData.currencies).map(c => `${c.name} (${c.symbol || ''})`).join(', ') : 'Não informada',
            populacao: paisData.population ? paisData.population.toLocaleString('pt-BR') : 'Não informada',
            continente: paisData.continents ? paisData.continents[0] : 'Não informado',
            bandeira: paisData.flags ? paisData.flags.svg || paisData.flags.png : ''
        };
    } catch (error) {
        console.warn('Erro ao consumir API de países:', error);
        return null;
    }
}

function configurarPaginaPrincipal() {
    renderizarTabelaViagens();
    atualizarResumoRapido();

    // Eventos de Filtro, Pesquisa e Ordenação em tempo real ou via botão
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

    let viagens = obterViagens();

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
        let viagens = obterViagens();
        viagens = viagens.filter(v => v.id !== id);
        salvarViagens(viagens);
        renderizarTabelaViagens();
        atualizarResumoRapido();
    }
}

function atualizarResumoRapido() {
    const asideUl = document.querySelector('aside ul');
    if (!asideUl) return;

    const viagens = obterViagens();
    const total = viagens.length;

    const hoje = new Date().toISOString().split('T')[0];
    const futuras = viagens.filter(v => v.dataIda >= hoje).sort((a, b) => new Date(a.dataIda) - new Date(b.dataIda));
    const proxima = futuras.length > 0 ? `${futuras[0].destino} (${futuras[0].pais})` : 'Nenhuma programada';

    asideUl.innerHTML = `
        <li>Total de viagens: <strong>${total}</strong></li>
        <li>Próximo destino: <strong>${proxima}</strong></li>
    `;
}