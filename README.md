# ASI-BF SGI - Système de Gestion Intégré

## 🎯 Description

Système de Gestion Intégré avec Agent IA pour **ASI-BF** (Afrique Services et Investissements - Burkina Faso).

Solution complète de Business Intelligence pour la gestion des projets BTP, stocks, équipements, finances et plus.

## ✨ Fonctionnalités

- **🤖 Agent IA Conversationnel** - Interrogez vos données en langage naturel
- **📊 Dashboard Temps Réel** - Vue d'ensemble de tous les indicateurs
- **🔔 Système d'Alertes** - Notifications automatiques (stocks, équipements, assurances)
- **📈 11 Modules SGI** - Projets, GESMA, GIFE, GIS, GIFL, GIOM, GIC, GIH, GIASS, IMPORT, GIDE

## 🛠 Stack Technique

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **AI**: LangGraph + OpenAI GPT-4 Turbo
- **Charts**: Recharts

## 📁 Structure du Projet

```
asi-bf-sgi/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API Routes (chat, stats, alertes)
│   │   └── dashboard/    # Pages dashboard
│   ├── agents/           # Agent IA LangGraph
│   ├── components/       # Composants React
│   │   ├── ui/          # Composants de base
│   │   ├── chat/        # Interface chat IA
│   │   └── dashboard/   # Composants dashboard
│   ├── lib/             # Utilitaires
│   └── types/           # Types TypeScript
├── supabase/
│   └── schema.sql       # Schéma base de données
├── scripts/
│   └── import-csv.ts    # Script import données
└── package.json
```

## 🚀 Installation

### 1. Prérequis

- Node.js 18+
- Compte Supabase
- Clé API OpenAI

### 2. Installation des dépendances

```bash
cd asi-bf-sgi
npm install
```

### 3. Configuration des variables d'environnement

Copier `.env.example` vers `.env.local` et remplir :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# OpenAI
OPENAI_API_KEY=sk-...
```

### 4. Configuration de la base de données

1. Créer un projet Supabase
2. Exécuter `supabase/schema.sql` dans l'éditeur SQL
3. Importer les données CSV :

```bash
npm run db:seed
```

### 5. Lancer le serveur de développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## 📊 Données Incluses

| Module | Description | Enregistrements |
|--------|-------------|-----------------|
| PROJETS | Projets d'infrastructure | 60 |
| GESMA | Marchés et contrats | 60 |
| GIFE | Engagements budgétaires | 1000+ |
| GIS | Inventaire stocks | 50+ |
| GIFL | Parc véhicules | 25+ |
| GIOM | Ordres de mission | 500+ |
| GIC | Bons de commande | 200+ |
| GIH | Incidents | 100+ |
| GIASS | Assurances | 50+ |
| IMPORT | Registres importation | 100+ |
| GIDE | Candidatures RH | 200+ |

## 🤖 Utilisation de l'Agent IA

L'agent IA comprend le français et peut répondre à des questions comme :

- "Quels projets sont en cours au Burkina Faso?"
- "Quel est le taux d'exécution budgétaire global?"
- "Quels articles sont en stock critique?"
- "Combien d'incidents non résolus avons-nous?"
- "Résumé des projets par source de financement"

## 📱 Intégration WhatsApp (Optionnel)

Pour activer WhatsApp Business API, configurer :

```env
WHATSAPP_PHONE_NUMBER_ID=xxxxx
WHATSAPP_ACCESS_TOKEN=xxxxx
WHATSAPP_VERIFY_TOKEN=xxxxx
```

## 🔒 Sécurité

- Row Level Security (RLS) activé sur Supabase
- Authentification via Supabase Auth
- Variables d'environnement pour les secrets

## 📝 Scripts Disponibles

```bash
npm run dev          # Serveur développement
npm run build        # Build production
npm run start        # Serveur production
npm run db:seed      # Import CSV vers Supabase
npm run lint         # Vérification ESLint
```

## 🤝 Support

Pour toute question, contacter l'équipe technique ASI-BF.

---

**ASI-BF SGI** - Développé avec ❤️ pour ASI Burkina Faso
