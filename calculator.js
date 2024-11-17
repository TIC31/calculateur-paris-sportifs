// Configuration API
const API_KEY = '5ec58a20924fc17bd56eb9c09518e680';
const API_URL = 'https://api.the-odds-api.com/v4/sports';

// Fonction pour récupérer les cotes
async function fetchOdds() {
    try {
        const response = await fetch(`${API_URL}/soccer/odds/?apiKey=${API_KEY}&regions=eu&markets=h2h`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erreur lors de la récupération des cotes:', error);
        return null;
    }
}

// Fonction pour calculer le score final
function calculateScore(data) {
    const {
        forme,
        composition,
        contexte,
        conditions,
        cote
    } = data;

    // Calcul des scores par catégorie
    const formeScore = calculateFormeScore(forme);
    const compositionScore = calculateCompositionScore(composition);
    const contexteScore = calculateContexteScore(contexte);
    const conditionsScore = calculateConditionsScore(conditions);

    // Score total sur 1000
    const totalScore = formeScore + compositionScore + contexteScore + conditionsScore;
    
    // Calcul du ratio
    const ratio = (totalScore * (cote - 1)) / 1000;

    return {
        details: {
            forme: formeScore,
            composition: compositionScore,
            contexte: contexteScore,
            conditions: conditionsScore
        },
        totalScore,
        ratio: Math.round(ratio * 100) / 100
    };
}

// Fonctions de calcul par catégorie
function calculateFormeScore(forme) {
    const {
        victoires,
        butsMarques,
        butsEncaisses,
        cleanSheets,
        matchsSansDefaite
    } = forme;

    let score = 0;
    score += victoires * 20;        // 20 points par victoire
    score += butsMarques * 5;       // 5 points par but marqué
    score += cleanSheets * 15;      // 15 points par clean sheet
    score += matchsSansDefaite * 10;// 10 points par match sans défaite

    return Math.min(score, 250);    // Maximum 250 points
}

function calculateCompositionScore(composition) {
    const {
        titulairesDisponibles,
        remplacantsQualite,
        absentsCles,
        fatigue
    } = composition;

    let score = 0;
    score += titulairesDisponibles * 15;  // 15 points par titulaire disponible
    score += remplacantsQualite * 10;     // 10 points pour la qualité des remplaçants
    score -= absentsCles * 20;            // -20 points par absent clé
    score -= fatigue * 10;                // -10 points par niveau de fatigue

    return Math.min(Math.max(score, 0), 200); // Entre 0 et 200 points
}

function calculateContexteScore(contexte) {
    const {
        importance,
        classement,
        avantageTerrain,
        motivation
    } = contexte;

    let score = 0;
    score += importance * 15;       // 15 points par niveau d'importance
    score += classement * 10;       // 10 points selon le classement
    score += avantageTerrain * 20;  // 20 points pour l'avantage terrain
    score += motivation * 15;       // 15 points par niveau de motivation

    return Math.min(score, 150);    // Maximum 150 points
}

function calculateConditionsScore(conditions) {
    const {
        meteo,
        etatTerrain,
        distance,
        horaire
    } = conditions;

    let score = 0;
    score += meteo * 10;           // 10 points pour conditions météo
    score += etatTerrain * 15;     // 15 points pour état du terrain
    score -= distance * 0.1;       // -0.1 point par km de déplacement
    score += horaire * 5;          // 5 points pour horaire favorable

    return Math.min(Math.max(score, 0), 100); // Entre 0 et 100 points
}

// Fonction pour mettre à jour l'interface
function updateUI(result) {
    const resultDiv = document.getElementById('result');
    if (!resultDiv) return;

    resultDiv.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-md">
            <h3 class="text-xl font-bold mb-4">Résultats de l'analyse</h3>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="font-medium">Forme: ${result.details.forme}/250</p>
                    <p class="font-medium">Composition: ${result.details.composition}/200</p>
                    <p class="font-medium">Contexte: ${result.details.contexte}/150</p>
                    <p class="font-medium">Conditions: ${result.details.conditions}/100</p>
                </div>
                <div>
                    <p class="text-xl font-bold">Score Total: ${result.totalScore}/700</p>
                    <p class="text-2xl font-bold text-blue-600">Ratio: ${result.ratio}</p>
                </div>
            </div>
        </div>
    `;
}

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    // Charger les matches disponibles
    const matches = await fetchOdds();
    if (matches) {
        const matchesTable = document.getElementById('matchesTable');
        if (matchesTable) {
            matchesTable.innerHTML = matches.map(match => `
                <tr class="bg-white border-b">
                    <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        ${match.home_team} - ${match.away_team}
                    </td>
                    <td class="px-6 py-4">${match.odds.h2h[0]}</td>
                    <td class="px-6 py-4">${match.odds.h2h[1]}</td>
                    <td class="px-6 py-4">${match.odds.h2h[2] || '-'}</td>
                    <td class="px-6 py-4">
                        <button onclick="analyzeMatch('${match.id}')" 
                                class="text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-sm px-4 py-2">
                            Analyser
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    }
});
