import axios from 'axios';

// Fonction pour envoyer un missile
export const envoyerMissile = async (baseURL, gameId, token) => {
    const apiClient = axios.create({
        baseURL: baseURL,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return await apiClient.post(`/parties/${gameId}/missiles`, {});
};

// Fonction pour mettre à jour le résultat d'un tire
export const mettreAJourResultat = async (baseURL, gameId, coordonnees, resultat, token) => {
    const apiClient = axios.create({
        baseURL: baseURL,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return await apiClient.put(`/parties/${gameId}/missiles/${coordonnees}`, { resultat });
};

//Fonction pour créer une partie
export const creerPartie = async (baseURL, token, nom_joueur) => {
    const apiClient = axios.create({
        baseURL: baseURL,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return await apiClient.post('/parties', { adversaire: nom_joueur });
};

//Fonction pour supprimer une partie
export const detruirePartie = async (baseURL, gameId, token) => {
    const apiClient = axios.create({
        baseURL: baseURL,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return await apiClient.delete(`/parties/${gameId}`);
};