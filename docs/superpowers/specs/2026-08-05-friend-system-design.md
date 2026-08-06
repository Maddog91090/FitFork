# Système d'ami

Date : 2026-08-05
Statut : approuvé pour planification

## Contexte

La gamification sportive (livrée précédemment) inclut un "bonus d'équipe"
coopératif entre profils. La review finale de cette fonctionnalité a
trouvé deux failles : la RPC `team_week_progress` était lisible sans
connexion (corrigé depuis), et surtout, elle traitait **n'importe quel
autre utilisateur authentifié** comme "le binôme" — alors que le projet
compte déjà 3-4 comptes réels et n'est pas destiné à rester à cette
échelle (l'objectif est une publication Google Play). Le bonus d'équipe a
donc été désactivé côté UI en attendant ce système d'ami, qui définit
enfin correctement qui est le binôme.

Conçu comme une vraie fonctionnalité produit, pas un bricolage pour 2
personnes : index par utilisateur (pas de balayage global), tables et RPC
qui tiennent à l'échelle d'un vrai nombre d'utilisateurs.

## Décisions de portée

- **Ciblage par code d'invitation**, pas par recherche d'utilisateur — le
  projet n'a ni pseudo ni annuaire, et les règles de sécurité actuelles
  empêchent même de voir le profil d'un autre utilisateur. Un code généré
  et partagé hors de l'app (SMS, WhatsApp, etc.) évite de construire un
  annuaire de recherche, avec les questions de confidentialité que ça
  poserait.
- **Plusieurs amis possibles**, pas un binôme unique exclusif.
- **Chaque bonus d'équipe est indépendant par amitié** : matcher avec
  deux amis la même semaine compte comme deux bonus distincts, pas un
  seul bonus partagé entre tous les amis.

## Modèle de données

```sql
create table public.friend_invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  redeemed_by uuid references auth.users(id) on delete set null,
  redeemed_at timestamptz
);

create index on public.friend_invites (created_by);
create unique index on public.friend_invites (code);

alter table public.friend_invites enable row level security;

create policy "Users can select own invites"
  on public.friend_invites for select
  using (auth.uid() = created_by);

create policy "Users can insert own invites"
  on public.friend_invites for insert
  with check (auth.uid() = created_by);
```

```sql
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id_a uuid not null references auth.users(id) on delete cascade,
  user_id_b uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint friendships_ordered check (user_id_a < user_id_b),
  constraint friendships_unique unique (user_id_a, user_id_b)
);

create index on public.friendships (user_id_a);
create index on public.friendships (user_id_b);

alter table public.friendships enable row level security;

create policy "Users can select own friendships"
  on public.friendships for select
  using (auth.uid() = user_id_a or auth.uid() = user_id_b);

create policy "Users can delete own friendships"
  on public.friendships for delete
  using (auth.uid() = user_id_a or auth.uid() = user_id_b);
```

- `user_id_a < user_id_b` range toujours la paire dans le même ordre
  (comparaison uuid standard de Postgres), ce qui empêche une paire en
  double dans les deux sens (A-B et B-A).
- Un code est à usage unique (`redeemed_at` non nul = consommé) et expire
  après 7 jours. Un utilisateur peut générer plusieurs codes actifs en
  parallèle (un code = une invitation destinée à une seule personne).
- Aucune politique d'`insert`/`update` directe sur `friendships` pour les
  utilisateurs — la création passe uniquement par la RPC de rédemption
  ci-dessous, qui garantit l'atomicité de "vérifier le code + créer la
  relation + marquer le code utilisé".

## RPC de rédemption

```sql
create or replace function public.redeem_friend_invite(invite_code text)
returns table(friend_user_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite record;
  v_me uuid := auth.uid();
  v_a uuid;
  v_b uuid;
begin
  if v_me is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_invite
  from public.friend_invites
  where code = invite_code
    and redeemed_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception 'Code invalide ou expiré';
  end if;

  if v_invite.created_by = v_me then
    raise exception 'Tu ne peux pas utiliser ton propre code';
  end if;

  v_a := least(v_invite.created_by, v_me);
  v_b := greatest(v_invite.created_by, v_me);

  insert into public.friendships (user_id_a, user_id_b)
  values (v_a, v_b)
  on conflict (user_id_a, user_id_b) do nothing;

  update public.friend_invites
  set redeemed_by = v_me, redeemed_at = now()
  where id = v_invite.id;

  return query select v_invite.created_by;
end;
$$;

grant execute on function public.redeem_friend_invite(text) to authenticated;
revoke execute on function public.redeem_friend_invite(text) from public, anon;
```

Le `for update` verrouille la ligne du code pendant la transaction,
éliminant la course où deux personnes tenteraient de rédimer le même code
en même temps. `on conflict do nothing` rend l'insertion idempotente si la
relation existe déjà d'une manière ou d'une autre.

## RPC de listage des amis

Aucune table ne permet de lire l'email d'un autre utilisateur (RLS et
schéma `auth` fermés par défaut). Une RPC minimale expose l'email
**uniquement pour les amis déjà acceptés** — jamais pour un inconnu,
jamais de recherche :

```sql
create or replace function public.list_my_friends()
returns table(friend_user_id uuid, friend_email text, friended_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select
    case when f.user_id_a = auth.uid() then f.user_id_b else f.user_id_a end,
    u.email,
    f.created_at
  from public.friendships f
  join auth.users u
    on u.id = case when f.user_id_a = auth.uid() then f.user_id_b else f.user_id_a end
  where f.user_id_a = auth.uid() or f.user_id_b = auth.uid();
$$;

grant execute on function public.list_my_friends() to authenticated;
revoke execute on function public.list_my_friends() from public, anon;
```

## Correction de `team_week_progress`

La RPC existante (déjà corrigée pour bloquer les appels anonymes) est
maintenant filtrée sur les amitiés acceptées, remplaçant "tout
utilisateur authentifié" par "moi et mes amis seulement" :

```sql
create or replace function public.team_week_progress(weeks_back int default 26)
returns table(user_id uuid, week_start date, days_that_week int)
language sql
security definer
set search_path = public
as $$
  select
    wc.user_id,
    (date_trunc('week', wc.completed_date))::date as week_start,
    count(distinct wc.completed_date)::int as days_that_week
  from public.workout_completions wc
  where wc.completed_date >= (current_date - (weeks_back * 7))
    and (
      wc.user_id = auth.uid()
      or exists (
        select 1 from public.friendships f
        where (f.user_id_a = auth.uid() and f.user_id_b = wc.user_id)
           or (f.user_id_b = auth.uid() and f.user_id_a = wc.user_id)
      )
    )
  group by wc.user_id, (date_trunc('week', wc.completed_date))::date;
$$;
```

Ceci règle en même temps le point resté ouvert après la review finale de
la gamification (`authenticated` pouvait encore tout lire) et le vrai
problème de fond (l'absence de notion de binôme).

## Calcul du bonus multi-amis

Nouveau fichier `src/lib/friendGamification.ts`, pure logique (zéro
dépendance Supabase), qui réutilise sans le modifier
`computeTeamBonusWeeks` déjà existant dans `workoutGamification.ts` (un
appel par amitié) :

```ts
export type FriendBonusSummary = {
  friendUserId: string;
  bonusWeekStarts: string[];
  bonusStreak: number;
  thisWeekCombinedDays: number; // plafonné à 6 pour l'affichage
};

export function computeFriendBonuses(
  myWeeks: WeekDayCount[],
  friends: { friendUserId: string; weeks: WeekDayCount[] }[],
  todayStr: string
): FriendBonusSummary[];

export function flattenTeamBonusWeeks(summaries: FriendBonusSummary[]): string[];
// concatène sans dédupliquer : matcher 2 amis la même semaine = 2 bonus
// de 15 points, cohérent avec "chaque bonus est indépendant"

export function maxTeamBonusStreak(summaries: FriendBonusSummary[]): number;
// la meilleure série parmi les amitiés — c'est elle qui conditionne le
// badge "Duo en or"
```

### Changement de signature sur `computeStats` (déjà en production)

`computeStats` calculait jusqu'ici sa propre série d'équipe en interne à
partir d'une liste plate de semaines. Avec plusieurs amitiés
indépendantes, cette logique doit vivre dans l'appelant (via
`maxTeamBonusStreak`), pas dans `computeStats` lui-même :

```ts
// avant : computeStats(completions, teamBonusWeekStarts, todayStr)
// après :
computeStats(completions, teamBonusWeekStarts, teamBonusStreak, todayStr)
```

Le calcul des points, du niveau, de la série personnelle et des badges ne
change pas — seule la source de `teamBonusStreak` change (fournie par
l'appelant plutôt que dérivée en interne). C'est une évolution du fichier
existant, pas une réécriture, mais elle touche du code déjà livré et
testé : le plan d'implémentation devra mettre à jour les tests existants
de `computeStats` en conséquence.

## Fichiers

- `supabase/migrations/0019_friend_system.sql` (nouveau) : tables
  `friend_invites`/`friendships`, RPC `redeem_friend_invite` et
  `list_my_friends`, mise à jour de `team_week_progress`.
- `src/lib/friendGamification.ts` (nouveau) : calcul pur multi-amis
  (`computeFriendBonuses`, `flattenTeamBonusWeeks`,
  `maxTeamBonusStreak`).
- `src/lib/friendsData.ts` (nouveau) : accès Supabase
  (`createFriendInvite`, `redeemFriendInvite`, `fetchMyFriends`,
  `removeFriendship`). `fetchTeamWeekProgress` reste inchangé dans
  `workoutCompletionsData.ts` — son comportement SQL change (filtré sur
  les amis désormais) mais sa signature côté client ne change pas, donc
  aucune raison de le déplacer.
- `src/lib/workoutGamification.ts` (modifié) : signature de
  `computeStats` mise à jour.
- `src/app/friends.tsx` (nouveau) : écran de gestion des amis (liste,
  génération de code + partage, saisie de code).
- `src/app/progression.tsx` (modifié) : remet une section bonus
  d'équipe, une ligne par ami.
- `src/app/(tabs)/home.tsx` (modifié) : `computeStats` reçoit désormais
  aussi `teamBonusStreak`.
- Fichiers de test correspondants pour chaque nouveau module, plus mise
  à jour des tests existants de `computeStats`/`home.tsx`/
  `progression.tsx` touchés par le changement de signature.

## Interface

**Écran `/friends`** (nouveau) :
- Section "Mes amis" : liste (email + date), action "Retirer" par ami
  (suppression optimiste avec annulation en cas d'échec).
- Section "Inviter quelqu'un" : bouton "Générer un code" → affiche le
  code avec un bouton "Partager" (feuille de partage native `Share` de
  React Native) et un bouton "Copier" (presse-papiers).
- Section "J'ai un code" : champ de saisie + bouton "Valider", message
  d'erreur inline en français si le code est invalide/expiré/le sien.

**Écran `/progression`** (modifié) : la section bonus d'équipe revient,
sous forme de liste — une ligne par ami ("Avec <email> : X/6 cette
semaine — bonus à 6/6"), avec un lien vers `/friends`. Même schéma que la
relation Accueil → Progression déjà en place : résumé compact, écran de
détail séparé pour la gestion.

## Gestion d'erreurs

- Code invalide, expiré, ou son propre code : message inline en
  français, géré par l'exception levée dans `redeem_friend_invite`.
- Échec réseau sur `fetchMyFriends`/`fetchTeamWeekProgress` : isolé,
  n'empêche pas le reste de l'écran Progression de s'afficher (même
  tolérance de panne partielle que le reste de la gamification).
- Retrait d'un ami : mise à jour optimiste avec annulation en cas
  d'échec, même pattern que le bouton de complétion de séance.

## Tests

- Migration : vérifiée en direct sur le projet Supabase (transaction
  annulée pour les tests d'insertion/rédemption, vérification des
  policies RLS, vérification du filtrage de `team_week_progress`), même
  méthode que pour `workout_completions`.
- `friendGamification.ts` : tests unitaires purs avec fixtures
  multi-amis (au moins 2 amis avec des semaines de bonus qui se
  chevauchent partiellement, pour vérifier l'indépendance et le calcul
  du max streak).
- `friendsData.ts` : tests avec client Supabase mocké, même convention
  que `workoutCompletionsData.test.ts`.
- `src/app/friends.tsx`, `progression.tsx`, `home.tsx` : tests
  `@testing-library/react-native`, mêmes conventions (mock
  auth/lib/router, horloge système figée pour les calculs dépendants de
  la date) que le reste de la gamification.

## Hors périmètre (explicitement)

- Recherche d'utilisateurs par pseudo/email — remplacé par le code
  d'invitation.
- Notifications (push ou in-app) quand quelqu'un rejoint via un code —
  la personne qui invite voit simplement l'ami apparaître dans sa liste
  la prochaine fois qu'elle ouvre l'écran.
- Blocage / signalement d'utilisateur.
- Nom d'affichage personnalisé pour un ami (l'email suffit pour
  l'instant, les deux parties se connaissent déjà puisqu'elles ont
  échangé le code hors de l'app).
- Annuler ou régénérer un code d'invitation actif avant son expiration —
  aucune politique `update`/`delete` n'existe sur `friend_invites` pour
  son créateur, et l'écran ne propose pas d'action "Annuler". Un code
  non utilisé expire de lui-même après 7 jours.
