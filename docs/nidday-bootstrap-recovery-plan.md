# Plan de récupération du bootstrap NIDDAY

**Statut de la décision : NO-GO pour toute application de DDL sur Supabase ou sur une base de production.**

Ce rapport est un audit de récupération en lecture seule du dépôt `/home/ubuntu/nidday-repo` et du projet Supabase associé. Il décrit ce qui existe réellement, ce qui est compatible avec Midday, ce qui manque pour amorcer une base vide, et la séquence à suivre avant toute opération SQL. Aucun fichier source, aucune migration, aucun objet Supabase et aucun secret n’a été créé ou modifié pour produire ce rapport.

## 1. Conclusion exécutive

Le bootstrap identifié n’est **pas un fichier SQL monolithique**. Le dépôt utilise une chaîne de migrations Drizzle PostgreSQL, configurée par `packages/db/drizzle.config.ts` avec `schema: ./src/schema.ts`, `out: ./migrations`, `dialect: postgresql` et la variable `DATABASE_SESSION_POOLER` [1]. Cette chaîne est dérivée du schéma et des migrations historiques **Midday**. Elle n’est pas un bootstrap autonome exécutable sur une base Supabase vide.

Le meilleur point de compatibilité upstream est `midday-ai/midday`, commit `51587319f26a0ffaa9dfccab1920373cb65689b7`. Le HEAD local NIDDAY `a23f2914f25810e0b0c346c3725d03eb0baa9f5b` a cet upstream comme ancêtre et est douze commits en avance, sans retard. Les fichiers de migration `0001` à `0038` et les métadonnées Drizzle observées sont identiques à upstream. La seule migration locale absente d’upstream est `0039_add_nidday_security_traceability_foundation.sql`, qui constitue l’extension NIDDAY additive. Il ne faut donc rien « récupérer » depuis Midday pour remplacer NIDDAY [2].

L’**initial migration est absente**. Le répertoire commence par `0001_add_report_types.sql`, contient des numéros manquants et des préfixes dupliqués, et ne fournit aucun SQL `0000` correspondant au snapshot ou au journal Drizzle. Le fichier `0000_snapshot.json` est une description JSON de schéma, pas un script SQL d’amorçage. Le `_journal.json` contient une seule entrée, `0000_silly_sage`, et ne trace manifestement pas la série complète jusqu’à `0039` [3].

La migration NIDDAY `0039` est additive et préserve Midday : elle ajoute les tables `nidday_role_assignments`, `evidence_items` et `audit_events`, ainsi que leurs enums, index, RLS, policies de lecture et le trigger append-only. Elle référence toutefois les tables Midday existantes `teams`, `users` et `documents`. Elle **ne peut pas être appliquée seule** sur le projet Supabase observé, car son schéma `public` est vide [4].

La génération d’un bootstrap à partir de `schema.ts` et du snapshot n’est **pas sûre dans l’état actuel**. Le schéma TypeScript contient 53 déclarations `pgTable` et 36 enums, alors que le snapshot contient 43 tables et 22 enums. Le schéma courant contient des objets absents du snapshot et le snapshot contient à l’inverse des objets absents du schéma courant. Des dépendances hors schéma sont également nécessaires : extensions, schémas `auth` et `private`, fonctions Supabase et fonctions auxiliaires. Une génération automatique avant convergence pourrait donc supprimer, recréer ou omettre des objets Midday et produire un faux bootstrap.

Le projet Supabase est techniquement sain comme infrastructure (`ACTIVE_HEALTHY`, PostgreSQL 17, région `eu-central-1`), mais il n’est pas applicativement initialisé : zéro table applicative publique, zéro enum public, zéro migration applicative, zéro utilisateur Auth et zéro bucket Storage. Aucun DDL n’a été appliqué. La décision correcte est donc **NO-GO**, jusqu’à obtention ou reconstruction contrôlée d’un bootstrap canonique Midday, validation de sa provenance, replay complet sur une base isolée, puis application ordonnée et contrôlée de l’extension NIDDAY.

> **Règle de récupération : préserver Midday comme source de vérité existante et ne jamais fabriquer un `0000.sql` en extrapolant le snapshot.**

## 2. État audité et provenance

### 2.1 Dépôt local et baselines Git

Le dépôt était propre au moment de l’audit, sur la branche `nidday/phase-2-audit-foundation`, synchronisée avec son remote d’origine. Le HEAD est `a23f2914f25810e0b0c346c3725d03eb0baa9f5b`. La baseline NIDDAY Phase 1 est `8e796284874ca5505f8e4b461a609eac5fd3b046`, intégrée dans `main` par `602a72078c691011ebec34ec50e085f72dde1834`. Cette Phase 1 ne contenait pas de bootstrap base de données. Le premier ajout base de données NIDDAY est `d08d47fcdf4859ccbf94ba33df419c4665cb8163`, ensuite consolidé dans `96e2cf0649143a3d71a321159a9c080c44aa8c53`. Le contrat RBAC et son test ont suivi avec `c9c80fef88dc2fc9f1d99b9d7d30eeb29415c7fc` [5].

Le remote upstream officiel est `https://github.com/midday-ai/midday.git`. La référence upstream locale est `51587319f26a0ffaa9dfccab1920373cb65689b7`, décrit comme la branche `main` de Midday. Les tags historiques `midday-v0.4.0` et `midday-v0.5.0` s’arrêtent à la migration `0022`; ils sont donc historiquement compatibles, mais incomplets par rapport à l’état actuel. Ils ne sont pas des bootstraps complets [2].

### 2.2 Compatibilité exacte local/upstream

| Élément comparé | Résultat local/upstream | Décision |
|---|---|---|
| Base de comparaison | `upstream/main` à `51587319f26a0ffaa9dfccab1920373cb65689b7` | Référence Midday compatible observée |
| Ancêtres Git | upstream est un ancêtre du HEAD local ; local 12 commits en avance et 0 en retard | Pas de récupération upstream nécessaire |
| Migrations `0001`–`0038` | SHA-256 identiques à upstream, fichier par fichier | Conserver sans remplacement |
| `meta/0000_snapshot.json` | Identique à upstream | Conserver, mais ne pas l’interpréter comme SQL |
| `meta/_journal.json` | Identique à upstream ; une seule entrée `0000_silly_sage` | Gap de traçabilité à résoudre |
| Migration `0039` | Présente localement seulement ; absente d’upstream | Préserver comme extension NIDDAY additive |
| Schéma et fichiers NIDDAY | Extensions locales `schema.ts`, RBAC et tests | Préserver ; ne pas les remplacer par Midday |
| Tags `v0.4.0`/`v0.5.0` | Migrations jusqu’à `0022` seulement | Ne pas les utiliser comme bootstrap |

Cette compatibilité signifie que les migrations Midday existantes sont bien conservées dans le dépôt NIDDAY. Elle ne signifie pas qu’elles forment une chaîne rejouable depuis une base PostgreSQL vide. L’absence du bootstrap initial reste un défaut distinct.

## 3. Méthode de bootstrap identifiée

La méthode observée est la suivante :

1. Le schéma TypeScript `packages/db/src/schema.ts` sert de source déclarative Drizzle pour la génération de migrations.
2. Les migrations SQL versionnées résident dans `packages/db/migrations`.
3. La configuration de test utilise une autre configuration Drizzle et exécute `setup-test-db.sql`, puis `drizzle-kit push --config=drizzle.config.test.ts --force`.
4. La configuration de production pointe vers `DATABASE_SESSION_POOLER`, mais aucun script de package, workflow, Dockerfile ou entrypoint ne lance les migrations de production.
5. `packages/supabase` fournit `db:generate` pour générer des types TypeScript depuis un projet Supabase ; il ne contient ni provisioning local, ni `supabase/config.toml`, ni commande `supabase start` ou `supabase db push` [1] [6].

Le chemin de test est donc une preuve de prérequis techniques pour un PostgreSQL de test, pas un bootstrap de production. Le fichier `setup-test-db.sql` crée notamment `vector`, les schémas `auth` et `private`, ainsi que des fonctions stub. Il indique explicitement que les tables, enums et index sont ensuite traités par `drizzle-kit push`. Les stubs de test ne doivent pas être promus en fonctions d’authentification de production sans définition canonique et revue de permissions [7].

Aucun seed NIDDAY de production n’a été trouvé. Le seed sous `packages/db/src/test/helpers/seed.ts` est un fixture de tests. Le package base de données ne contient aucun script `migrate`, `bootstrap` ou `seed` NIDDAY dédié. Le rôle de `packages/banking/scripts/seed.ts` n’est pas suffisamment établi pour en faire un seed de production.

## 4. L’initial migration est-elle absente ?

**Oui.** Le constat est explicite et bloquant.

Le répertoire contient 40 fichiers SQL numérotés de `0001` à `0039`, avec des numéros manquants et des préfixes dupliqués, mais aucun fichier `0000`. Le snapshot `0000_snapshot.json` porte la version 7, le dialecte PostgreSQL et l’identifiant `ffd83524-3d65-4a77-bb4e-e9ab9a912890`. Le journal ne contient que l’entrée `0000_silly_sage`. Il n’existe donc pas, dans le dépôt audité, de script initial exécutable qui transforme une base vierge en baseline Midday.

Le problème ne se réduit pas au nom du fichier. Les migrations existantes supposent des objets préexistants, notamment des tables Midday, des enums, des extensions, des fonctions, des schémas et une intégration Supabase Auth. Réordonner les fichiers par leur préfixe ne suffirait pas à reconstituer une histoire de migration fiable. Les doublons `0010`, `0011`, `0012` et `0013` montrent en outre que l’ordre canonique doit venir d’un manifeste ou d’une chaîne validée, non d’un simple tri lexical.

**Conséquence :** `0039` ne doit pas être traité comme bootstrap. Les fichiers `0001`–`0038` ne doivent pas être appliqués sur une base vide avant d’avoir établi leur prérequis et leur ordre canonique. Le snapshot ne doit pas être converti manuellement en « faux `0000.sql` ».

## 5. Faisabilité de génération depuis le schéma

### 5.1 Verdict

La génération d’un bootstrap initial est **possible seulement après une phase de convergence contrôlée**, mais elle est **non faisable de manière sûre maintenant**. Une commande Drizzle de génération pourrait produire du SQL syntaxiquement plausible ; elle ne prouverait ni la compatibilité avec Midday, ni la complétude des dépendances Supabase, ni la sécurité RLS, ni la rejouabilité.

### 5.2 Divergences observées

| Source | Ce qu’elle décrit | Risque |
|---|---|---|
| `schema.ts` | 53 `pgTable`, 36 `pgEnum`, dont les objets NIDDAY et plusieurs objets postérieurs au baseline | Source courante non équivalente au snapshot historique |
| `0000_snapshot.json` | 43 tables, 22 enums, version 7 | Baseline incomplet et partiellement obsolète |
| Snapshot inverse | Présence de `inbox_embeddings` et `transaction_embeddings`, absents du schéma courant | Risque de recréer des objets supprimés |
| Journal | Une seule entrée `0000_silly_sage` | Historique Drizzle non représentatif de `0001`–`0039` |
| Migrations SQL | Évolutions correctives, suppressions et extensions successives | Le tri des noms ne reconstitue pas les dépendances |

### 5.3 Dépendances hors `schema.ts`

Le snapshot ne crée pas les extensions, fonctions ou schémas nécessaires. Les dépendances repérées comprennent `vector`, `pg_trgm`, `pgcrypto` ou `gen_random_uuid`, `tsvector`, `to_tsvector`, `auth.uid()`, `auth.jwt()`, `private.get_teams_for_authenticated_user()`, `extract_product_names` et `generate_inbox_fts`. Les versions, permissions et corps de production de plusieurs fonctions restent inconnus.

Le mapping `usersInAuth` est particulièrement sensible : `schema.ts` référence `auth.users`, tandis que le snapshot observé l’indexe sous `public.auth.users` et ne déclare aucun schéma. `auth.users` est une table gérée par Supabase et ne doit pas être recréée par un bootstrap applicatif. Ce mapping doit être validé contre la plateforme réelle avant toute génération.

Le snapshot contient des policies mais indique `isRLSEnabled=false` pour ses tables. Les migrations ultérieures activent explicitement RLS sur certaines tables. Il serait donc dangereux d’inférer qu’une policy implique automatiquement l’activation RLS.

## 6. État réel de Supabase

Le projet audité est **NIDDAY's Project**, référence `iysvfjsnoiomtyptuply`, URL `https://iysvfjsnoiomtyptuply.supabase.co`, région `eu-central-1`, statut `ACTIVE_HEALTHY`, PostgreSQL 17. Auth et Storage sont présents comme services gérés par Supabase [4].

| Zone | État observé |
|---|---|
| `public` | 0 table applicative, 0 vue, 0 enum, 0 table applicative avec RLS |
| Migrations applicatives Supabase | `list_migrations` renvoie une liste vide |
| `auth` | 23 tables gérées ; `auth.users` existe avec 0 utilisateur |
| `storage` | 8 tables gérées ; 0 bucket et 0 objet |
| Policies visibles par la requête catalogue | aucune policy observée dans `public`, `auth` ou `storage` |
| RLS géré | 16/23 tables Auth et 8/8 tables Storage ont RLS activé |
| Extensions installées observées | `pgcrypto`, `uuid-ossp`, `pg_stat_statements`, `supabase_vault`, `plpgsql` |
| Extensions applicatives requises non prouvées comme installées | notamment `vector` et `pg_trgm` |

La liste vide de `pg_policies` est limitée à la visibilité de la requête de catalogue exécutée ; elle ne permet pas de conclure sur d’éventuels contrôles internes hors des schémas audités. En revanche, elle suffit à constater qu’aucune policy applicative publique attendue par NIDDAY n’a été observée.

Aucun DDL, bucket, utilisateur, donnée, policy, credential ou seed n’a été créé. Les migrations internes `auth.schema_migrations` et `storage.migrations` sont gérées par Supabase et ne constituent pas l’historique des migrations applicatives Midday.

## 7. Plan SQL et migration ordonné proposé

Le plan ci-dessous est un **runbook conditionnel**, pas une autorisation d’exécution. Les commandes exactes et les objets du bootstrap initial doivent être fournis par une source canonique validée. Aucun SQL n’est à appliquer tant que les préconditions du niveau correspondant ne sont pas satisfaites.

### Étape 0 — Geler et inventorier

Conserver le dépôt à `a23f2914f25810e0b0c346c3725d03eb0baa9f5b`, conserver les migrations Midday `0001`–`0038`, conserver `0039`, et enregistrer les SHA-256. Ne pas rebaser, écraser ou renommer les migrations pour masquer le gap du journal. Capturer l’état Supabase en lecture seule et confirmer que l’état applicatif public est toujours vide.

### Étape 1 — Établir la source canonique du baseline Midday

Obtenir le SQL initial officiel ou une procédure de provisioning approuvée par le propriétaire du schéma Midday. Upstream `51587319f26a0ffaa9dfccab1920373cb65689b7` est la référence de compatibilité des migrations `0001`–`0038`, mais il ne fournit pas davantage le `0000` manquant. Il ne faut donc pas présenter upstream comme une solution déjà complète.

Si aucun SQL canonique n’existe, produire une reconstruction dans un environnement isolé uniquement après décision explicite sur la source de vérité : schéma courant, snapshot corrigé, ou historique SQL externe. Cette reconstruction doit être revue par un propriétaire Midday et comparée aux contrats applicatifs avant toute promotion. Elle ne doit pas être créée directement dans Supabase.

### Étape 2 — Définir les prérequis de plateforme

Sur une base de staging jetable, vérifier les extensions réellement disponibles et installer seulement celles autorisées par la plateforme. Définir ou valider les schémas `private` et les fonctions nécessaires. Réutiliser `auth` et `auth.users` gérés par Supabase ; ne jamais créer une copie applicative d’Auth. Valider le mapping des foreign keys, les rôles SQL, les permissions et les fonctions `auth.uid`, `auth.jwt` et `private.get_teams_for_authenticated_user`.

### Étape 3 — Rejouer le baseline Midday validé

Appliquer d’abord le bootstrap canonique initial, puis les migrations Midday `0001`–`0038` dans l’ordre issu du manifeste validé. L’ordre ne doit pas être déduit uniquement des noms de fichiers à cause des préfixes manquants et dupliqués. Après chaque migration, enregistrer le résultat, le checksum, les objets créés ou modifiés et l’état de la transaction.

Vérifier au minimum les tables historiques `teams`, `users`, `documents`, les enums, les foreign keys, les index, les fonctions, les policies et l’activation RLS. Comparer le schéma obtenu avec le schéma Midday attendu avant de poursuivre.

### Étape 4 — Réconcilier le journal Drizzle

Décider avec le propriétaire du dépôt comment représenter l’historique réellement rejoué. Le journal actuel ne peut pas être déclaré complet. Toute correction doit préserver l’auditabilité, éviter une fausse entrée historique et documenter le lien entre le bootstrap initial, les fichiers `0001`–`0038` et la migration NIDDAY `0039`. Ne pas réécrire rétroactivement l’historique sans validation.

### Étape 5 — Appliquer l’extension NIDDAY `0039`

Seulement après la réussite du baseline Midday, vérifier la présence et les contraintes des tables `teams`, `users` et `documents`, ainsi que la fonction `private.get_teams_for_authenticated_user()`. Appliquer ensuite `0039` comme migration additive : enums NIDDAY, tables `nidday_role_assignments`, `evidence_items`, `audit_events`, index, RLS, policies de lecture et trigger append-only.

Ne pas ajouter à cette étape les domaines explicitement non livrés : paiements, portail citoyen, publication de données, banques/mobile money, procurement, approbation automatique ou géolocalisation. Ne pas créer le bucket Evidence Vault avant validation séparée des chemins, de la confidentialité et des policies Storage.

### Étape 6 — Vérifier la sécurité et l’isolation

Tester avec au moins deux organisations et plusieurs identités Auth : lecture autorisée dans la même organisation, lecture refusée entre organisations, absence de writes client non autorisés, écriture serveur autorisée, rejet des mises à jour et suppressions de `audit_events`, et cohérence du filtrage par `private.get_teams_for_authenticated_user`. Tester également les contraintes d’unicité, les suppressions en cascade et les références optionnelles des preuves.

### Étape 7 — Promotion contrôlée

Après replay réussi, comparaison de schéma, tests PostgreSQL/RLS et revue de sécurité, prendre un backup vérifié de la cible, appliquer le même ordre en staging Supabase isolé, puis obtenir une approbation distincte pour la production. Le déploiement applicatif ne doit pas être considéré comme un mécanisme de migration : les Dockerfiles, l’entrypoint et les workflows observés ne lancent pas de migration de production.

## 8. Contrôles d’additivité, d’idempotence et de récupération

### Additivité

`0039` est additive par intention et par contenu : elle ne modifie ni ne supprime les migrations Midday existantes. Elle conserve `users_on_team.role` et ajoute un contrat RBAC parallèle. Elle réutilise les tables Midday au lieu de les remplacer. Cette additivité doit être vérifiée par comparaison de schéma avant/après et par contrôle des objets supprimés, qui doit être nul.

### Idempotence

La migration `0039` n’est pas idempotente en exécution brute : elle utilise notamment `CREATE TYPE`, `CREATE TABLE`, `CREATE POLICY`, `CREATE TRIGGER` et `CREATE OR REPLACE FUNCTION` sans enveloppe globale `IF NOT EXISTS` adaptée à tous les objets. Une seconde exécution peut échouer sur des objets déjà présents ou laisser une reprise ambiguë. Il ne faut pas ajouter artificiellement des clauses idempotentes sans revue, car cela pourrait masquer une migration partiellement appliquée.

Chaque migration historique doit être classée comme réexécutable, transactionnelle, partiellement transactionnelle ou non réexécutable. Les contrôles doivent vérifier les checksums et l’existence des objets avant reprise. En cas d’échec, arrêter le replay ; ne pas relancer aveuglément toute la chaîne.

### Récupération

Avant tout replay, créer un snapshot ou un dump restaurable de la cible, même si elle est censée être vide, et conserver les logs SQL. Sur une cible vide de staging, préférer une nouvelle base ou une branche isolée plutôt qu’une réparation destructive. Après un échec, déterminer si la migration est transactionnelle et si elle a été enregistrée dans le mécanisme de suivi avant de reprendre. Sur production, restaurer vers une cible de secours ou utiliser une procédure approuvée ; ne pas exécuter de `DROP SCHEMA`, `DROP TABLE` ou reset Supabase pour « repartir proprement ».

### Checks d’acceptation

| Contrôle | Critère de réussite |
|---|---|
| Provenance | Source du bootstrap initial identifiée, versionnée et approuvée |
| Complétude | Toutes les dépendances hors schéma sont définies ou fournies par Supabase |
| Replay | Baseline vierge rejouable de bout en bout sur PostgreSQL de staging |
| Convergence | Schéma, enums, fonctions, index, policies et RLS correspondent au contrat validé |
| Midday | Tables et workflows Midday conservés ; aucun objet historique remplacé |
| NIDDAY | `0039` s’applique après `teams`, `users`, `documents` et fonctions requises |
| Sécurité | Tests RLS, RBAC, append-only et isolation inter-organisation passants |
| Reprise | Échec simulé, diagnostic, restauration et reprise contrôlée documentés |
| Déploiement | Une étape explicite de migration de production est approuvée et opérable |
| Seed | Décision explicite ; si requis, seed séparé, idempotent et sans credentials |

## 9. Blockers exacts

Les blockers qui interdisent le GO sont les suivants :

1. **Le bootstrap SQL initial `0000` manque.** Le dépôt ne contient pas de SQL exécutable pour créer le baseline Midday sur une base vide.
2. **La chaîne Drizzle est historiquement incohérente ou incomplètement tracée.** Le journal ne contient qu’une entrée alors que les fichiers vont jusqu’à `0039`, avec numéros manquants et doublons.
3. **Le snapshot et le schéma divergent.** Les comptes observés sont 43 tables/22 enums dans le snapshot contre 53 tables/36 enums dans `schema.ts`, avec des objets manquants dans chaque sens.
4. **Les prérequis Supabase/PostgreSQL ne sont pas entièrement définis.** Les schémas, fonctions, extensions, permissions et versions nécessaires ne sont pas tous représentés dans le snapshot.
5. **Le projet Supabase est vide côté applicatif.** `0039` dépend de `teams`, `users` et `documents`, absents du projet réel.
6. **L’état distant n’a aucun historique applicatif.** `list_migrations` est vide ; les migrations internes Auth/Storage ne remplacent pas l’historique Midday.
7. **La sécurité d’exécution n’est pas prouvée.** Les tests réels PostgreSQL, RLS, trigger append-only et isolation inter-organisation n’ont pas été exécutés.
8. **Aucun chemin de migration de production n’est livré.** CI, Docker, Railway et l’entrypoint observés ne lancent pas les migrations de production.
9. **Le build monorepo a un blocage préexistant.** L’incompatibilité `framer-motion`/`motion-dom` bloque le build complet, sans être établie comme défaut NIDDAY. Ce point n’est pas le blocker SQL principal, mais doit rester distingué.

## 10. Recommandation Go/No-Go

### Décision immédiate : NO-GO

Ne pas appliquer `0039` seule. Ne pas appliquer `0001`–`0038` sur le Supabase vide. Ne pas générer ni déposer un faux `0000.sql`. Ne pas modifier le journal, les migrations, Supabase ou l’application pour masquer l’absence du bootstrap. Ne pas créer de seed, de bucket, d’utilisateur fictif ou de credential.

### Conditions minimales pour passer à GO en staging

Le GO pourra être réexaminé uniquement après :

- obtention ou reconstruction approuvée du bootstrap initial Midday ;
- décision formelle sur la source de vérité entre `schema.ts`, le snapshot et l’historique SQL ;
- réconciliation documentée du journal Drizzle ;
- validation des extensions, schémas, fonctions, Auth et permissions Supabase ;
- replay complet sur une base PostgreSQL isolée ;
- tests de schéma, RLS, RBAC, append-only et isolation multi-organisation ;
- définition d’un mécanisme de migration de production distinct du démarrage des conteneurs ;
- revue humaine confirmant la conservation de Midday et l’additivité de NIDDAY.

Le build complet bloqué par `framer-motion`/`motion-dom` peut faire l’objet d’une décision séparée. Il ne doit ni être présenté comme preuve de compatibilité SQL, ni être « corrigé » en modifiant des dépendances pour forcer le bootstrap.

## 11. Références et fichiers audités

[1]: file:///home/ubuntu/nidday-repo/packages/db/drizzle.config.ts "Configuration Drizzle PostgreSQL locale"
[2]: https://github.com/midday-ai/midday/tree/51587319f26a0ffaa9dfccab1920373cb65689b7/packages/db/migrations "Migrations Midday officielles au commit de référence"
[3]: file:///home/ubuntu/nidday-repo/packages/db/migrations/meta/_journal.json "Journal Drizzle local"
[4]: file:///home/ubuntu/nidday-repo/docs/nidday-supabase-readiness.md "Rapport de readiness Supabase NIDDAY"
[5]: file:///home/ubuntu/nidday-repo/docs/nidday-git-recovery-report.md "Rapport de récupération Git NIDDAY"
[6]: file:///home/ubuntu/nidday-repo/packages/supabase/package.json "Package d’intégration Supabase"
[7]: file:///home/ubuntu/nidday-repo/packages/db/src/test/helpers/setup-test-db.sql "Prérequis PostgreSQL du setup de test"
[8]: file:///home/ubuntu/nidday-repo/packages/db/src/schema.ts "Schéma TypeScript Drizzle courant"
[9]: file:///home/ubuntu/nidday-repo/packages/db/migrations/meta/0000_snapshot.json "Snapshot Drizzle historique"
[10]: file:///home/ubuntu/nidday-repo/packages/db/migrations/0039_add_nidday_security_traceability_foundation.sql "Migration additive NIDDAY 0039"
[11]: file:///home/ubuntu/nidday-repo/docs/nidday-phase-2-foundation.md "Fondation NIDDAY Phase 2"
[12]: file:///home/ubuntu/nidday-repo/.github/workflows/production.yml "Workflow CI/CD de production"
[13]: file:///home/ubuntu/nidday-repo/packages/db/package.json "Scripts du package base de données"
[14]: file:///home/ubuntu/nidday-repo/docs/nidday-environment-validation.md "Validation de l’environnement NIDDAY"
