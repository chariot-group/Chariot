/** @see FR-admin-business-kpis */

export const KPI_INFO = {
  acquisition:
    "Comptes Adventure créés sur la période (premier appel API authentifié). Pas de visites anonymes : tout le site exige un login. Un volume bas signale un problème d’acquisition, pas de trafic site.",
  activation:
    "Utilisateurs distincts ayant participé à au moins une session au statut lancée ou clôturée. C’est le passage du compte à une vraie table. Un écart large avec l’acquisition indique un onboarding cassé.",
  retention:
    "Utilisateurs distincts ayant participé à au moins deux tables lancées différentes. Mesure le retour à l’usage, pas la création de contenu. Un taux bas après activation = le produit ne retient pas.",
  referral:
    "Filleuls dont le premier achat a été validé. Compte les parrainages qui convertissent vraiment, pas les invitations envoyées. Utile pour juger le levier affiliation.",
  revenue:
    "Utilisateurs avec au moins un paiement COMPLETED. C’est la monétisation réelle du funnel, pas le stock de wheels offertes.",
  lobbyLaunch:
    "Part des sessions créées qui passent réellement en table lancée, versus abandonnées en lobby. Un taux bas = friction au lancement (joueurs manquants, UX lobby, wheels).",
  wheelsCirculation:
    "Somme des soldes wheels actuels (stock). Vendues = crédits shop sur la période ; dépensées = wheels consommées. Un stock qui explose sans dépenses = inflation / cadeaux non utilisés.",
  payingAmongActivated:
    "Utilisateurs ayant au moins un paiement COMPLETED, parmi ceux qui ont joué au moins une table. C’est le taux de conversion des joueurs actifs, pas de tous les comptes.",
  noShopPurchase:
    "Total des non-convertis shop : gift encore intact plus gift déjà consommé sans jamais acheter. C’est la somme des deux cartes exclusives de la page Adventure.",
  unusedGift:
    "Comptes encore à exactement 1 wheel, sans aucune dépense. Ils n’ont pas utilisé le cadeau d’inscription. N’inclut pas ceux qui ont déjà dépensé le gift.",
  spentGiftNeverBought:
    "Comptes à solde 0 qui n’ont jamais acheté en boutique. Ils ont consommé le cadeau (ou d’autres crédits non-shop) sans passer payant. N’inclut pas ceux qui ont encore le gift.",
  delayFirstPlayer:
    "Médiane des heures entre la création du compte (sur la période) et le premier personnage joueur. Un délai long = friction à la création de fiche.",
  delayFirstCampaign:
    "Médiane des heures entre la création du compte et la première campagne créée (pas forcément lancée). Mesure l’activation contenu MJ, pas la table.",
  deadCampaigns:
    "Campagnes créées sur la période dont l’identifiant n’apparaît dans aucune session lancée. Du contenu mort : créé puis jamais joué.",
  giftToPaid:
    "Part des comptes créés sur la période qui ont au moins un achat shop. Taux de conversion gift → payant sur la cohorte d’acquisition.",
  gmConcentration:
    "Part des tables lancées organisées par les 10 % de MJ les plus actifs. Un chiffre élevé = dépendance à très peu de MJ ; un choc sur ces comptes casse l’offre de tables.",
  timeToLaunch:
    "Médiane des minutes entre la création de la session et launchedAt. Un délai long = lobby qui traîne (attente de joueurs, setup).",
  participantsAtLaunch:
    "Moyenne de participants au moment du lancement, et part de tables lancées avec le MJ seul. Beaucoup de solo-MJ = tables fragiles ou tests.",
  earlyClose:
    "Part des tables fermées avant les 8 heures réglementaires. Un taux haut peut être sain (fin de partie) ou signaler des crashs / abandons ; à croiser avec la durée réelle.",
  repeatPlayers:
    "Nombre de MJ et de joueurs avec au moins deux tables sur la période. Mesure la récurrence d’usage, pas le volume brut de sessions.",
  liveNow:
    "Snapshot actuel, hors filtre de période : tables lancées encore ouvertes et participants connectés maintenant. Sert à voir la charge live, pas la tendance.",
  firstTableToPurchase:
    "Médiane des heures entre la première table lancée d’un utilisateur et son premier paiement COMPLETED. Les achats avant la première table sont exclus. Un délai long = monétisation tardive.",
  repeatPurchase:
    "Part des premiers acheteurs de la période qui ont déjà un deuxième achat. Mesure la répétition d’achat, pas le panier moyen.",
  firstPurchases:
    "Comptes dont le premier paiement COMPLETED tombe dans la période. C’est l’entrée en client payant, pas le chiffre d’affaires (voir le P&L).",
  referralValidated:
    "Filleuls dont le premier achat a été validé sur la période. Conversion affiliation réelle, pas le nombre de codes partagés.",
  gmVsPlayer:
    "Répartition des utilisateurs activés entre MJ (ont lancé / hosté) et joueurs. Un déséquilibre fort MJ ou joueurs oriente le levier d’activation à pousser.",
  funnelChart:
    "Volume quotidien (ou selon la maille) de chaque étape AARRR. Sert à voir si une baisse est localisée (ex. activation) ou globale (acquisition).",
} as const;
