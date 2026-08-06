# Notifications (rappel de séance / streak à risque)

Date : 2026-08-06
Statut : approuvé pour planification

## Contexte

L'app calcule déjà un streak hebdomadaire (`src/lib/workoutGamification.ts`)
mais ne relance jamais l'utilisateur — rien ne le prévient s'il est en
train de perdre le rythme, ni ne lui rappelle de faire sa séance du jour.
Objectif : deux rappels push, envoyés par le serveur (pas par l'app
elle-même), pour couvrir aussi le cas où l'app n'a pas été rouverte
depuis plusieurs jours.

## Modèle de données et inscription au push

Nouvelle table (migration Supabase) :

```sql
create table public.push_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token text not null,
  updated_at timestamptz not null default now()
);

alter table public.push_tokens enable row level security;

create policy "Users can upsert own push token"
  on public.push_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users can update own push token"
  on public.push_tokens for update
  using (auth.uid() = user_id);

create policy "Users can delete own push token"
  on public.push_tokens for delete
  using (auth.uid() = user_id);
```

Pas de policy `select` publique — seule la tâche planifiée (via la clé
service, qui contourne RLS) lit cette table. `user_id` est la clé
primaire : un seul token par utilisateur (un nouvel enregistrement
remplace l'ancien).

**Inscription client** : la même logique s'utilise à deux endroits (nouvelle
étape d'onboarding, interrupteur sur l'Accueil) — demander la permission
système (`expo-notifications`), récupérer le push token Expo
(`getExpoPushTokenAsync`, avec le `projectId` déjà présent dans
`app.json`), puis `upsert` dans `push_tokens`. Désactiver supprime la
ligne : pas de token stocké = le serveur n'envoie rien à cet utilisateur,
pas besoin d'un champ `enabled` séparé.

## Logique des rappels

Une tâche planifiée (Supabase Edge Function, déclenchée par `pg_cron` une
fois par jour à **17:00 UTC** — 18h heure de Paris en hiver (CET),
19h en été (CEST) ; `pg_cron` tourne à une heure UTC fixe toute l'année,
donc pas de vrai suivi de fuseau horaire dans cette version, juste une
approximation raisonnable d'une fin de journée) parcourt tous les
utilisateurs ayant un `push_tokens.token`, et
pour chacun calcule `joursDepuisDerniereSeance` à partir de
`workout_completions` :

- `joursDepuisDerniereSeance >= 2` (ou aucune séance jamais faite) →
  message **streak à risque**.
- Sinon, si aucune séance validée aujourd'hui → message **rappel de
  séance**.
- Séance déjà faite aujourd'hui → rien envoyé.

Au plus un push par utilisateur par jour. Le calcul (quel message, ou
aucun, à partir d'une date de dernière séance et d'aujourd'hui) est une
fonction pure, testée indépendamment de l'Edge Function elle-même.

**Envoi** : appel direct à l'API push d'Expo
(`POST https://exp.host/--/api/v2/push/send`) avec le token stocké — pas
de service tiers à configurer, pas de clé API supplémentaire (l'API push
d'Expo fonctionne avec les tokens `ExponentPushToken[...]` sans
authentification côté serveur).

## Interface

**Nouvelle étape d'onboarding**, ajoutée après le récapitulatif existant
(`src/app/onboarding.tsx`, actuellement 4 étapes) : titre "Activer les
notifications ?", deux boutons — "Activer les notifications" (déclenche
la demande de permission + l'enregistrement du token) et "Plus tard"
(passe sans rien demander). Ni l'un ni l'autre ne bloque la création du
compte ; les deux mènent à la suite du flux (`/home`).

**Interrupteur sur l'écran Accueil** (`src/app/(tabs)/home.tsx`), à côté
du bouton "Se déconnecter" existant. Son état à l'ouverture de l'écran
reflète la réalité (permission système accordée **et** token présent en
base) plutôt qu'une préférence stockée séparément. L'activer déclenche la
même logique d'inscription que l'étape d'onboarding ; le désactiver
supprime le token.

**Copie des notifications** (tutoiement, sans emoji ni exclamation,
cohérent avec le reste de l'app) :

- Streak à risque : "Ça fait 2 jours — une petite séance aujourd'hui ?"
- Rappel de séance : "Ta séance du jour t'attend."

## Gestion d'erreurs

- **Permission refusée** : l'interrupteur reste désactivé, aucun token
  stocké. Pas de re-demande automatique — retenter passe par
  l'interrupteur, qui redemande la permission (et renvoie vers les
  réglages système si elle a déjà été explicitement refusée, comportement
  natif d'iOS/Android sur une deuxième demande).
- **Token invalide ou expiré** (app désinstallée, etc.) : l'API push
  d'Expo renvoie un statut d'erreur par token dans sa réponse ; l'Edge
  Function supprime la ligne `push_tokens` correspondante plutôt que de
  réessayer indéfiniment à chaque exécution.
- **Utilisateur sans aucune séance jamais validée** : traité comme
  `joursDepuisDerniereSeance >= 2` dès l'inscription — pas de cas
  particulier, encourage simplement à commencer.

## Tests

- Fonction pure de décision (date de dernière séance + date du jour →
  aucun message / rappel de séance / streak à risque) : testée seule,
  tous les cas limites (jamais de séance, séance aujourd'hui, 1/2/3+
  jours d'écart).
- Edge Function : test d'intégration léger simulant plusieurs profils
  utilisateur (avec/sans token, avec/sans séance récente) et vérifiant
  qu'elle appelle l'API push d'Expo pour les bons utilisateurs avec le
  bon message, et qu'elle nettoie les tokens invalides.
- Interrupteur (Accueil) et étape d'onboarding : testés comme les écrans
  existants de l'app, permission système mockée.

## Hors périmètre (explicitement)

- Préférences fines par type de rappel (tout ou rien, pas de réglage
  séparé pour chaque message).
- Fuseau horaire par utilisateur (heure fixe côté serveur).
- Rappels liés au plan de repas ou aux courses.
- Re-demande automatique après un refus de permission.
