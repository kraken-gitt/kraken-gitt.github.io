# Kraken-AI

Kraken-AI est un assistant de programmation avec inscription, connexion persistante par cookie HttpOnly et historique privé. Le chat utilise **Devstral Small 2**, le modèle Mistral open-weight orienté code, via Ollama en local : aucune clé API Mistral n’est nécessaire.

## Lancement gratuit en local

Prérequis : Node.js 20+ et [Ollama](https://ollama.com/download).

```bash
npm install
ollama serve
ollama pull devstral-small-2
JWT_SECRET="change-me-with-a-long-random-secret" OLLAMA_MODEL=devstral-small-2 npm start
```

Ouvre ensuite `http://localhost:3000`.

## Docker

```bash
docker compose up -d --build
# Une seule fois, télécharger le modèle dans Ollama
docker compose exec ollama ollama pull devstral-small-2
```

Devstral 2 (123B) est le modèle Mistral open-weight le plus puissant de cette famille, mais il nécessite plusieurs GPU serveur. **Devstral Small 2 (24B)** est le choix local réaliste : Apache 2.0 et déployable sur du matériel grand public selon la mémoire disponible.

## GitHub Pages

Le dépôt GitHub peut conserver le code source, mais GitHub Pages ne peut pas exécuter Node.js, SQLite ou Ollama. Pour mettre Kraken-AI en ligne, il faudra un hébergeur capable d’exécuter Node.js/Docker et une machine avec assez de mémoire pour le modèle. Le dépôt ne contient aucune clé API.
