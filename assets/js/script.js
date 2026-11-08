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