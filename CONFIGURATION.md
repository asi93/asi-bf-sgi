# 🚀 GUIDE CONFIGURATION ASI-BF-SGI + WHATSAPP

## ✅ FICHIERS CRÉÉS

Tous les fichiers suivants ont été créés avec succès :

### Structure WhatsApp
```
src/
├── app/api/whatsapp/
│   ├── webhook/route.ts     ✅ Endpoint Meta WhatsApp
│   └── send/route.ts         ✅ Envoi messages proactifs
├── lib/whatsapp/
│   ├── client.ts             ✅ Client WhatsApp API
│   └── templates.ts          ✅ Templates messages
└── lib/email/
    ├── client.ts             ✅ Client Resend
    └── templates.ts          ✅ Templates emails
```

### API Notifications
```
src/app/api/notifications/
└── email/route.ts            ✅ API envoi emails
```

### Base de données
```
supabase/
└── whatsapp-tables.sql       ✅ Tables WhatsApp
```

---

## 🔧 ÉTAPES DE CONFIGURATION

### ÉTAPE 1 : Variables d'environnement

Éditez le fichier `.env.local` et remplacez les placeholders :

```bash
# Supabase (déjà configuré ✅)
NEXT_PUBLIC_SUPABASE_URL=https://plezrwcjwslqnwkkolly.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# OpenAI (déjà configuré ✅)
OPENAI_API_KEY=sk-proj-ILyumcZ...

# WhatsApp Business API (À CONFIGURER ⚠️)
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAABsbCS1iHgBO...
WHATSAPP_VERIFY_TOKEN=asi-bf-2026-secure

# Email Resend (À CONFIGURER ⚠️)
RESEND_API_KEY=re_123456789
FROM_EMAIL=noreply@asi-bf.com

# URL de l'app (À CONFIGURER après déploiement)
NEXT_PUBLIC_APP_URL=https://votre-app.vercel.app
```

---

### ÉTAPE 2 : Créer compte Resend (Email)

1. **Aller sur** : https://resend.com/signup
2. **S'inscrire** (gratuit 100 emails/jour)
3. **Aller dans** : API Keys
4. **Create API Key**
5. **Copier la clé** qui commence par `re_`
6. **Ajouter dans `.env.local`** :
   ```
   RESEND_API_KEY=re_votre_cle_ici
   ```

7. **Configuration domaine** (optionnel mais recommandé) :
   - Domains → Add Domain
   - Ajouter votre domaine (ex: asi-bf.com)
   - Configurer DNS records
   - Ou utiliser domaine test : `onboarding@resend.dev`

---

### ÉTAPE 3 : Configuration WhatsApp Business

#### A. Récupérer WHATSAPP_ACCESS_TOKEN

1. **Aller sur** : https://developers.facebook.com/apps/
2. **Sélectionner votre App WhatsApp**
3. **Panneau gauche** → WhatsApp → **API Setup**
4. **Section "Temporary access token"**
5. **Copier le token** (commence par `EAABsbCS...`)
6. **Ajouter dans `.env.local`** :
   ```
   WHATSAPP_ACCESS_TOKEN=EAABsbCS...votre_token
   ```

#### B. Récupérer WHATSAPP_PHONE_NUMBER_ID

1. **Même page** (API Setup)
2. **Section "Phone Number ID"**
3. **Copier le numéro** (15 chiffres)
4. **Ajouter dans `.env.local`** :
   ```
   WHATSAPP_PHONE_NUMBER_ID=123456789012345
   ```

#### C. WHATSAPP_VERIFY_TOKEN

**Déjà configuré** : `asi-bf-2026-secure`

Vous pouvez le changer si vous voulez, mais utilisez la même valeur dans Meta.

---

### ÉTAPE 4 : Créer tables Supabase

#### Option A : Via Interface Supabase (Recommandé)

1. **Aller sur** : https://supabase.com/dashboard
2. **Sélectionner votre projet** : plezrwcjwslqnwkkolly
3. **SQL Editor** (panneau gauche)
4. **New Query**
5. **Copier-coller** le contenu de `supabase/whatsapp-tables.sql`
6. **Run** (bouton vert)
7. **Vérifier** : Tables → whatsapp_messages et whatsapp_subscriptions apparaissent

#### Option B : Via npm (si schéma principal à jour)

```bash
cd C:\Users\oaser\Documents\n\All\ASI-BI\BI\asi-bf-sgi
npm run db:migrate
```

---

### ÉTAPE 5 : Installer dépendances

```bash
cd C:\Users\oaser\Documents\n\All\ASI-BI\BI\asi-bf-sgi

# Aucune nouvelle dépendance requise !
# Tout est déjà installé ✅
```

**Vérification** :
```bash
npm list @supabase/supabase-js next react
```

---

### ÉTAPE 6 : Test local

```bash
npm run dev
```

**Ouvrir** : http://localhost:3000

**Endpoints à tester** :

1. **Webhook WhatsApp** :
   - GET : http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=asi-bf-2026-secure&hub.challenge=test
   - Devrait retourner : `test`

2. **Chat IA** :
   - POST : http://localhost:3000/api/chat
   - Body : `{"message": "Combien de projets en cours?"}`

3. **Email** (après config Resend) :
   - POST : http://localhost:3000/api/notifications/email
   - Body : Voir exemples ci-dessous

---

### ÉTAPE 7 : Déploiement Vercel

```bash
# 1. Build de production
npm run build

# 2. Si pas de compte Vercel
npm install -g vercel
vercel login

# 3. Déployer
vercel --prod
```

**Configuration Vercel** :
1. **Project Settings** → **Environment Variables**
2. **Ajouter toutes les variables** de `.env.local`
3. **Redéployer** si nécessaire

**Récupérer URL** :
- Ex: https://asi-bf-sgi.vercel.app
- **Mettre à jour** `NEXT_PUBLIC_APP_URL` dans Vercel

---

### ÉTAPE 8 : Configuration Webhook Meta

1. **Aller sur** : https://developers.facebook.com/apps/
2. **Votre App** → WhatsApp → **Configuration**
3. **Webhook** :
   - **Callback URL** : `https://votre-app.vercel.app/api/whatsapp/webhook`
   - **Verify Token** : `asi-bf-2026-secure`
   - **Cliquer** "Verify and Save"

4. **Subscribe to** :
   - ✅ messages
   - ✅ message_status (optionnel)

5. **Test** :
   - Envoyer message WhatsApp au numéro test
   - Vérifier réponse IA

---

## 🧪 TESTS

### Test 1 : WhatsApp Bot

**Envoyer via WhatsApp** :
```
Combien de projets en cours au Burkina Faso?
```

**Réponse attendue** :
```
[Agent IA répond avec stats projets]
```

---

### Test 2 : Email Rapport Quotidien

**Curl / Postman** :
```bash
POST https://votre-app.vercel.app/api/notifications/email
Content-Type: application/json

{
  "type": "daily_report",
  "to": "votre-email@example.com",
  "data": {
    "projetsActifs": 15,
    "budgetJour": 2500000,
    "alertesCritiques": 2,
    "incidentsOuverts": 3,
    "tauxExecution": 87,
    "stocksCritiques": 5,
    "date": "2026-02-11"
  }
}
```

**Vérifier email reçu.**

---

### Test 3 : Alerte Stock

```bash
POST https://votre-app.vercel.app/api/notifications/email
Content-Type: application/json

{
  "type": "stock_alert",
  "to": "votre-email@example.com",
  "data": {
    "articles": [
      {
        "nom": "Tuyau PVC Ø110",
        "stock": 5,
        "seuil": 20
      },
      {
        "nom": "Vanne papillon DN200",
        "stock": 2,
        "seuil": 10
      }
    ]
  }
}
```

---

### Test 4 : Message WhatsApp Proactif

```bash
POST https://votre-app.vercel.app/api/whatsapp/send
Content-Type: application/json

{
  "to": "+22670123456",
  "message": "🚨 Test alerte ASI-BF\n\nCeci est un message de test.",
  "type": "test"
}
```

---

## 🎯 CHECKLIST FINALE

### Configuration
- [ ] `.env.local` complété avec toutes les clés
- [ ] Compte Resend créé et configuré
- [ ] Tables Supabase créées
- [ ] Tokens WhatsApp récupérés
- [ ] App déployée sur Vercel
- [ ] Variables Vercel configurées
- [ ] Webhook Meta configuré

### Tests
- [ ] Bot WhatsApp répond aux questions
- [ ] Email rapport quotidien envoyé
- [ ] Email alerte stock envoyé
- [ ] Message WhatsApp proactif envoyé
- [ ] Dashboard accessible
- [ ] Agent IA fonctionne

---

## 🚨 TROUBLESHOOTING

### WhatsApp ne répond pas

1. **Vérifier logs Vercel** : Functions → whatsapp
2. **Vérifier token** : Copier à nouveau depuis Meta
3. **Vérifier webhook** : Doit être "Active" dans Meta
4. **Vérifier numéro** : Bien configuré dans WABA

### Email ne s'envoie pas

1. **Vérifier Resend API Key** : Valide et active
2. **Vérifier FROM_EMAIL** : Domaine vérifié ou `onboarding@resend.dev`
3. **Vérifier logs** : `npm run dev` en local
4. **Quota** : 100 emails/jour en gratuit

### Tables Supabase manquantes

1. **SQL Editor** → Vérifier syntaxe
2. **Copier script complet** depuis `whatsapp-tables.sql`
3. **Run une à une** les commandes CREATE TABLE

---

## 📞 SUPPORT

**Documentation** :
- Resend : https://resend.com/docs
- WhatsApp : https://developers.facebook.com/docs/whatsapp
- Supabase : https://supabase.com/docs
- Vercel : https://vercel.com/docs

---

## ✅ PROCHAINES ÉTAPES

Une fois tout configuré :

1. **Tester tous les endpoints**
2. **Configurer alertes automatiques** (Semaine 2)
3. **Créer rapports programmés** (Semaine 3)
4. **Optimiser agent IA** (Semaine 2)
5. **Améliorer dashboard** (Semaine 1)

---

**Tout est prêt ! Il ne reste qu'à configurer les tokens.** 🚀
