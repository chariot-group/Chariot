import type { ReleaseNote } from '@/data/release-notes/types';

export const ALL_RELEASE_NOTES: ReleaseNote[] = [
  {
    version: '2.6.1',
    date: '2026-06-07',
    translations: {
      fr: {
        title: 'Paiements gratuits & sessions renforcées',
        highlights: [
          { text: 'Les commandes réduites à 0 € sont désormais traitées sans passer par la caisse — le bouton "Obtenir gratuitement" apparaît automatiquement.' },
          { text: 'La connexion à une session est plus robuste : plus de déconnexions fantômes lors d\'un rechargement de page ni de doubles connexions.' },
          { text: 'Les joueurs peuvent maintenant saisir leur initiative pendant la phase de préparation du combat, si le MJ le permet.' },
          { text: 'Le MJ peut définir en masse la visibilité de plusieurs PNJ en une seule action dans le tracker d\'initiative.' },
        ],
      },
      en: {
        title: 'Free payments & stronger sessions',
        highlights: [
          { text: 'Orders reduced to €0 are now processed without checkout — a "Get for free" button appears automatically.' },
          { text: 'Session connections are now more reliable: no more ghost disconnections on page refresh or duplicate connections.' },
          { text: 'Players can now enter their initiative during the combat preparation phase, if the GM allows it.' },
          { text: 'The GM can bulk-set the visibility of multiple NPCs in a single action from the initiative tracker.' },
        ],
      },
      es: {
        title: 'Pagos gratuitos y sesiones más robustas',
        highlights: [
          { text: 'Los pedidos reducidos a 0 € se procesan ahora sin pasar por caja — el botón "Obtener gratis" aparece automáticamente.' },
          { text: 'La conexión a una sesión es más fiable: sin desconexiones fantasma al recargar la página ni conexiones duplicadas.' },
          { text: 'Los jugadores pueden ahora introducir su iniciativa durante la fase de preparación del combate, si el DJ lo permite.' },
          { text: 'El DJ puede configurar la visibilidad de varios PNJ en masa en una sola acción desde el rastreador de iniciativa.' },
        ],
      },
    },
  },
  {
    version: '2.6.0',
    date: '2026-06-06',
    translations: {
      fr: {
        title: 'Combat enrichi & magie repensée',
        highlights: [
          { text: 'Le tracker d\'initiative affiche désormais les personnages inconscients (fond jaune) et morts (fond rouge) — les tours des créatures mortes sont sautés automatiquement.' },
          { text: 'Le MJ choisit quels champs d\'un PNJ sont visibles par les joueurs : nom, PV, CA, conditions… champ par champ.' },
          { text: 'Saisie groupée d\'initiative : le MJ peut sélectionner plusieurs personnages et leur attribuer la même valeur en une seule fois.' },
          { text: 'Les sorts mineurs (cantrips) ont un nombre d\'utilisations illimité et un bouton "Lancer" dédié. Les emplacements de sorts affichent maintenant les slots utilisés.' },
          { text: 'Les sens (vision dans le noir, perception passive…) s\'ajoutent et s\'éditent dans la fiche joueur et PNJ, avec support Codex.' },
          { text: 'En session, modifiez les pièces, PV et notes directement sans passer en mode édition complet.' },
          { text: 'Ajout des points d\'inspiration : gagnez-en en mode édition, dépensez-les depuis la fiche.' },
        ],
      },
      en: {
        title: 'Richer combat & redesigned magic',
        highlights: [
          { text: 'The initiative tracker now shows unconscious (yellow) and dead (red) characters — dead creatures\' turns are automatically skipped.' },
          { text: 'The GM chooses which NPC fields are visible to players: name, HP, AC, conditions… field by field.' },
          { text: 'Bulk initiative entry: the GM can select multiple characters and assign them the same value in one go.' },
          { text: 'Cantrips have unlimited uses and a dedicated "Cast" button. Spell slots now show used slots instead of remaining ones.' },
          { text: 'Senses (darkvision, passive perception…) can be added and edited on player and NPC sheets, with Codex support.' },
          { text: 'In a session, edit coins, HP, and notes directly without entering full edit mode.' },
          { text: 'Inspiration points added: earn them in edit mode, spend them from the sheet.' },
        ],
      },
      es: {
        title: 'Combate enriquecido y magia rediseñada',
        highlights: [
          { text: 'El rastreador de iniciativa ahora muestra personajes inconscientes (fondo amarillo) y muertos (fondo rojo) — los turnos de las criaturas muertas se saltan automáticamente.' },
          { text: 'El DJ elige qué campos de un PNJ son visibles para los jugadores: nombre, PV, CA, condiciones… campo por campo.' },
          { text: 'Entrada de iniciativa en masa: el DJ puede seleccionar varios personajes y asignarles el mismo valor de una sola vez.' },
          { text: 'Los trucos tienen usos ilimitados y un botón "Lanzar" dedicado. Las ranuras de hechizos ahora muestran las ranuras usadas.' },
          { text: 'Los sentidos (visión en la oscuridad, percepción pasiva…) se añaden y editan en las fichas de jugador y PNJ, con soporte de Codex.' },
          { text: 'En sesión, edita monedas, PV y notas directamente sin entrar en el modo edición completo.' },
          { text: 'Puntos de inspiración añadidos: gánalos en modo edición, gástalos desde la ficha.' },
        ],
      },
    },
  },
  {
    version: '2.5.0',
    date: '2026-05-08',
    translations: {
      fr: {
        title: 'Sessions & navigation améliorées',
        highlights: [
          { text: 'Le MJ dispose d\'une section "Mes joueurs" dédiée pendant les sessions, avec accès direct aux fiches de chaque participant.' },
          { text: 'Les connexions et déconnexions des participants sont notifiées en temps réel à tous les membres de la session.' },
          { text: 'Boutons "Charger plus" sur toutes les listes longues : groupes actifs et archivés, personnages, campagnes.' },
        ],
      },
      en: {
        title: 'Improved sessions & navigation',
        highlights: [
          { text: 'The GM gets a dedicated "My Players" section during sessions, with direct access to each participant\'s sheet.' },
          { text: 'Participant connections and disconnections are notified in real time to all session members.' },
          { text: '"Load more" buttons on all long lists: active and archived groups, characters, campaigns.' },
        ],
      },
      es: {
        title: 'Sesiones y navegación mejoradas',
        highlights: [
          { text: 'El DJ tiene una sección "Mis jugadores" dedicada durante las sesiones, con acceso directo a la ficha de cada participante.' },
          { text: 'Las conexiones y desconexiones de los participantes se notifican en tiempo real a todos los miembros de la sesión.' },
          { text: 'Botones "Cargar más" en todas las listas largas: grupos activos y archivados, personajes, campañas.' },
        ],
      },
    },
  },
  {
    version: '2.4.0',
    date: '2026-05-01',
    translations: {
      fr: {
        title: 'Sorts, repos & vie en session',
        highlights: [
          { text: 'Système de sorts complet : préparez vos sorts, lancez-les, gérez vos emplacements par niveau et lancez-les à des niveaux supérieurs (upcasting).' },
          { text: 'Repos courts et longs : dépensez des dés de vie, récupérez vos emplacements de sorts et habiletés, restaurez vos PV et réduisez l\'épuisement.' },
          { text: 'Compteurs d\'utilisations sur les capacités et traits (ex : Rage du Barbare) avec réinitialisation sur repos court ou long.' },
          { text: 'Rejoignez ou quittez une session volontairement, et consultez qui est actuellement connecté.' },
          { text: 'Infobulle sur le minuteur de session : la session dure 8 h et se ferme automatiquement après 5 min d\'inactivité totale.' },
        ],
      },
      en: {
        title: 'Spells, rests & session life',
        highlights: [
          { text: 'Full spell system: prepare your spells, cast them, manage slots by level, and upcast to higher levels.' },
          { text: 'Short and long rests: spend hit dice, recover spell slots and abilities, restore HP, and reduce exhaustion.' },
          { text: 'Use-count trackers on abilities and traits (e.g. Barbarian Rage) with reset on short or long rest.' },
          { text: 'Voluntarily join or leave a session, and see who is currently connected.' },
          { text: 'Session timer tooltip: sessions last 8 h and auto-close after 5 min of total inactivity.' },
        ],
      },
      es: {
        title: 'Hechizos, descansos & vida en sesión',
        highlights: [
          { text: 'Sistema de hechizos completo: prepara tus hechizos, lánzalos, gestiona las ranuras por nivel y lánzalos a niveles superiores (upcasting).' },
          { text: 'Descansos cortos y largos: gasta dados de golpe, recupera ranuras de hechizos y habilidades, restaura PV y reduce el agotamiento.' },
          { text: 'Contadores de usos en habilidades y rasgos (p. ej. Ira del Bárbaro) con restablecimiento en descanso corto o largo.' },
          { text: 'Únete o abandona una sesión voluntariamente, y consulta quién está conectado actualmente.' },
          { text: 'Información sobre el temporizador de sesión: las sesiones duran 8 h y se cierran automáticamente tras 5 min de inactividad total.' },
        ],
      },
    },
  },
  {
    version: '2.3.0',
    date: '2026-04-26',
    translations: {
      fr: {
        title: 'Sessions de jeu & améliorations Codex',
        highlights: [
          { text: 'Nouveau service de session : rejoignez une partie en temps réel avec votre groupe.' },
          { text: 'Le Codex est maintenant accessible dans toutes les langues de l\'application.' },
        ],
      },
      en: {
        title: 'Game sessions & Codex improvements',
        highlights: [
          { text: 'New session service: join a game in real time with your group.' },
          { text: 'The Codex is now accessible in all application languages.' },
        ],
      },
      es: {
        title: 'Sesiones de juego & mejoras del Codex',
        highlights: [
          { text: 'Nuevo servicio de sesión: únete a una partida en tiempo real con tu grupo.' },
          { text: 'El Codex ahora es accesible en todos los idiomas de la aplicación.' },
        ],
      },
    },
  },
  {
    version: '2.2.0',
    date: '2026-04-10',
    translations: {
      fr: {
        title: 'Formulaires puissants & UX enrichie',
        highlights: [
          { text: 'Calculatrice rapide de PV dans toutes les fiches : +/- pour ajuster, = pour définir une valeur exacte (PV actuels, temporaires et max).' },
          { text: 'Raccourcis clavier dans tous les formulaires : Entrée pour valider, Échap pour annuler.' },
          { text: 'Support des actions bonus : créez des actions de type "Bonus Action" et retrouvez-les filtrées dans la fiche de combat.' },
          { text: 'Dégâts multiples par action : ajoutez plusieurs types de dégâts/soins sur une même action (ex : 1d6 perforant + 1d4 poison).' },
          { text: 'Indice de dangerosité (ID) affiché en fractions pour les valeurs inférieures à 1 (1/2, 1/4, 1/8).' },
        ],
      },
      en: {
        title: 'Powerful forms & richer UX',
        highlights: [
          { text: 'Quick HP calculator on all sheets: +/- to adjust, = to set an exact value (current, temp, and max HP).' },
          { text: 'Keyboard shortcuts in all forms: Enter to submit, Escape to cancel.' },
          { text: 'Bonus action support: create "Bonus Action" actions and find them filtered on the combat sheet.' },
          { text: 'Multiple damage entries per action: add several damage/healing types on one action (e.g. 1d6 piercing + 1d4 poison).' },
          { text: 'Challenge Rating displayed as fractions for sub-1 values (1/2, 1/4, 1/8).' },
        ],
      },
      es: {
        title: 'Formularios potentes & UX enriquecida',
        highlights: [
          { text: 'Calculadora rápida de PV en todas las fichas: +/- para ajustar, = para definir un valor exacto (PV actuales, temporales y máximos).' },
          { text: 'Atajos de teclado en todos los formularios: Intro para confirmar, Escape para cancelar.' },
          { text: 'Soporte de acciones bonus: crea acciones de tipo "Acción de bonus" y encuéntralas filtradas en la ficha de combate.' },
          { text: 'Daños múltiples por acción: añade varios tipos de daño/curación en una sola acción (p. ej. 1d6 perforante + 1d4 veneno).' },
          { text: 'Índice de peligrosidad mostrado como fracciones para valores inferiores a 1 (1/2, 1/4, 1/8).' },
        ],
      },
    },
  },
  {
    version: '2.1.0',
    date: '2026-03-06',
    translations: {
      fr: {
        title: 'Achats & création depuis le Codex',
        highlights: [
          { text: 'Rechargez vos tokens directement depuis l\'application, sans quitter Chariot.' },
          { text: 'Créez un personnage ou un PNJ directement depuis une entrée du Codex en un clic.' },
          { text: 'Nouveau formulaire de création et d\'édition pour les personnages et les PNJ.' },
        ],
      },
      en: {
        title: 'Purchases & creation from the Codex',
        highlights: [
          { text: 'Top up your tokens directly from the app, without leaving Chariot.' },
          { text: 'Create a character or NPC directly from a Codex entry in one click.' },
          { text: 'New creation and edit form for characters and NPCs.' },
        ],
      },
      es: {
        title: 'Compras & creación desde el Codex',
        highlights: [
          { text: 'Recarga tus tokens directamente desde la aplicación, sin salir de Chariot.' },
          { text: 'Crea un personaje o PNJ directamente desde una entrada del Codex en un clic.' },
          { text: 'Nuevo formulario de creación y edición para personajes y PNJ.' },
        ],
      },
    },
  },
  {
    version: '2.0.0',
    date: '2026-02-07',
    translations: {
      fr: {
        title: 'Lancement de Chariot',
        highlights: [
          { text: 'Bienvenue sur Chariot ! L\'application de gestion de personnages D&D est en ligne.' },
          { text: 'Connexion sécurisée avec votre préférence de langue mémorisée (FR, EN, ES).' },
          { text: 'Navigation contextuelle : la barre latérale s\'adapte à votre rôle (Joueur ou Maître du Jeu).' },
          { text: 'Fiches de personnages complètes pour les joueurs et les PNJ : informations générales, combat, magie, inventaire, histoire.' },
          { text: 'Page de profil avec historique de vos tokens.' },
        ],
      },
      en: {
        title: 'Chariot launch',
        highlights: [
          { text: 'Welcome to Chariot! The D&D character management app is live.' },
          { text: 'Secure login with your language preference saved (FR, EN, ES).' },
          { text: 'Contextual navigation: the sidebar adapts to your role (Player or Game Master).' },
          { text: 'Full character sheets for players and NPCs: general info, combat, magic, inventory, history.' },
          { text: 'Profile page with your token history.' },
        ],
      },
      es: {
        title: 'Lanzamiento de Chariot',
        highlights: [
          { text: '¡Bienvenido a Chariot! La aplicación de gestión de personajes de D&D está en línea.' },
          { text: 'Inicio de sesión seguro con tu preferencia de idioma guardada (FR, EN, ES).' },
          { text: 'Navegación contextual: la barra lateral se adapta a tu rol (Jugador o Maestro del Juego).' },
          { text: 'Fichas de personaje completas para jugadores y PNJ: información general, combate, magia, inventario, historia.' },
          { text: 'Página de perfil con tu historial de tokens.' },
        ],
      },
    },
  },
];
