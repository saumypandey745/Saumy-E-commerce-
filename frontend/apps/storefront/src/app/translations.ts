export type Language = 'en' | 'es' | 'hi' | 'fr' | 'de';
export type Currency = 'USD' | 'EUR' | 'INR';

export const currencySymbols: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  INR: '₹'
};

export const conversionRates: Record<Currency, number> = {
  USD: 1.0,
  EUR: 0.92,
  INR: 83.50
};

export const translations = {
  en: {
    // Header & Home
    explore: "Explore",
    trending: "Trending",
    categories: "Categories",
    searchPlaceholder: "Search the extraordinary...",
    discover: "Discover the Extraordinary",
    heroTitle: "Elevate Your",
    heroTitleSpan: "Lifestyle.",
    heroSub: "Curated premium products from top-tier creators. Experience shopping redesigned for the modern era.",
    startExploring: "Start Exploring",
    viewCollections: "View Collections",
    curatedPicks: "Curated Picks",
    handSelected: "Hand-selected items just for you.",
    aiRecommendations: "AI Personalized Recommendations",
    aiRecSub: "Tailored to your unique taste using collaborative filtering.",
    chatbotTitle: "AI Shopping Assistant",
    addToCart: "Add to Cart",
    chatbotWelcome: "Hi! I'm your Saumy E-commerce AI Assistant. Ask me to recommend products, track orders, or check returns!",
    chatPlaceholder: "Ask me anything...",
    cart: "Cart",
    profile: "Profile",
    wishlist: "Wishlist",

    // Auth
    signIn: "Sign In",
    createAccount: "Create Account",
    email: "Email Address",
    password: "Password",
    name: "Full Name",
    phone: "Phone Number",
    loginTitle: "Welcome Back",
    registerTitle: "Join Saumy E-commerce",

    // Cart Page
    shoppingCart: "Shopping Cart",
    subtotal: "Subtotal",
    tax: "Estimated Tax",
    total: "Total",
    checkout: "Proceed to Checkout",
    emptyCart: "Your cart is empty",
    remove: "Remove",
    outOfStock: "Out of Stock",
    addedToCart: "Added to Cart",

    // Profile & Orders
    myAccount: "My Account",
    orders: "Orders & Returns",
    signOut: "Sign Out",
    settings: "Settings",
    addresses: "Saved Addresses",
    
    // Product Page
    deliveryCheck: "Check Delivery Availability",
    enterPin: "Enter PIN code",
    check: "Check",

    // Footer
    about: "About Us",
    quickLinks: "Quick Links",
    contact: "Contact",
    rightsReserved: "All rights reserved. Built with Next.js."
  },
  es: {
    // Header & Home
    explore: "Explorar",
    trending: "Tendencias",
    categories: "Categorías",
    searchPlaceholder: "Busca lo extraordinario...",
    discover: "Descubre lo Extraordinario",
    heroTitle: "Eleva Tu",
    heroTitleSpan: "Estilo.",
    heroSub: "Productos premium seleccionados de creadores de primer nivel. Experimente las compras rediseñadas para la era moderna.",
    startExploring: "Comenzar a Explorar",
    viewCollections: "Ver Colecciones",
    curatedPicks: "Selecciones Curadas",
    handSelected: "Artículos seleccionados a mano especialmente para ti.",
    aiRecommendations: "Recomendaciones AI Personalizadas",
    aiRecSub: "Adaptado a su gusto único mediante filtrado colaborativo.",
    chatbotTitle: "Asistente de Compras IA",
    addToCart: "Añadir al Carrito",
    chatbotWelcome: "¡Hola! Soy tu asistente de IA. ¡Pídeme recomendar productos, rastrear pedidos o verificar devoluciones!",
    chatPlaceholder: "Escribe tu consulta...",
    cart: "Carrito",
    profile: "Perfil",
    wishlist: "Lista de deseos",

    // Auth
    signIn: "Iniciar Sesión",
    createAccount: "Crear Cuenta",
    email: "Correo Electrónico",
    password: "Contraseña",
    name: "Nombre Completo",
    phone: "Número de Teléfono",
    loginTitle: "Bienvenido de Nuevo",
    registerTitle: "Únete a Saumy E-commerce",

    // Cart Page
    shoppingCart: "Carrito de Compras",
    subtotal: "Subtotal",
    tax: "Impuesto Estimado",
    total: "Total",
    checkout: "Proceder al Pago",
    emptyCart: "Tu carrito está vacío",
    remove: "Eliminar",
    outOfStock: "Agotado",
    addedToCart: "Añadido",

    // Profile & Orders
    myAccount: "Mi Cuenta",
    orders: "Pedidos y Devoluciones",
    signOut: "Cerrar Sesión",
    settings: "Ajustes",
    addresses: "Direcciones Guardadas",
    
    // Product Page
    deliveryCheck: "Verificar Entrega",
    enterPin: "Ingresar código PIN",
    check: "Verificar",

    // Footer
    about: "Sobre Nosotros",
    quickLinks: "Enlaces Rápidos",
    contact: "Contacto",
    rightsReserved: "Todos los derechos reservados. Creado con Next.js."
  },
  hi: {
    // Header & Home
    explore: "खोजें",
    trending: "रुझान",
    categories: "श्रेणियाँ",
    searchPlaceholder: "असाधारण खोजें...",
    discover: "असाधारण की खोज करें",
    heroTitle: "अपनी जीवनशैली",
    heroTitleSpan: "उन्नत करें।",
    heroSub: "शीर्ष स्तर के रचनाकारों से चुनिंदा प्रीमियम उत्पाद। आधुनिक युग के लिए नए रूप में खरीदारी का अनुभव करें।",
    startExploring: "अन्वेषण शुरू करें",
    viewCollections: "संग्रह देखें",
    curatedPicks: "विशेष चयन",
    handSelected: "खास आपके लिए हाथ से चुनी गई वस्तुएं।",
    aiRecommendations: "एआई व्यक्तिगत अनुशंसाएं",
    aiRecSub: "सहयोगात्मक फ़िल्टरिंग का उपयोग करके आपके अनूठे स्वाद के अनुरूप।",
    chatbotTitle: "एआई शॉपिंग सहायक",
    addToCart: "कार्ट में डालें",
    chatbotWelcome: "नमस्ते! मैं आपका एआई शॉपिंग सहायक हूं। मुझसे उत्पाद सुझाने, ऑर्डर ट्रैक करने या रिटर्न जांचने के लिए कहें!",
    chatPlaceholder: "अपनी क्वेरी लिखें...",
    cart: "कार्ट",
    profile: "प्रोफ़ाइल",
    wishlist: "इच्छा-सूची",

    // Auth
    signIn: "साइन इन करें",
    createAccount: "खाता बनाएं",
    email: "ईमेल पता",
    password: "पासवर्ड",
    name: "पूरा नाम",
    phone: "फ़ोन नंबर",
    loginTitle: "वापसी पर स्वागत है",
    registerTitle: "Saumy E-commerce से जुड़ें",

    // Cart Page
    shoppingCart: "शॉपिंग कार्ट",
    subtotal: "उप-योग",
    tax: "अनुमानित कर",
    total: "कुल",
    checkout: "चेकआउट करें",
    emptyCart: "आपका कार्ट खाली है",
    remove: "निकालें",
    outOfStock: "स्टॉक में नहीं",
    addedToCart: "कार्ट में जोड़ा गया",

    // Profile & Orders
    myAccount: "मेरा खाता",
    orders: "ऑर्डर और रिटर्न",
    signOut: "साइन आउट",
    settings: "सेटिंग्स",
    addresses: "सहेजे गए पते",
    
    // Product Page
    deliveryCheck: "डिलीवरी की उपलब्धता जांचें",
    enterPin: "पिन कोड दर्ज करें",
    check: "जांचें",

    // Footer
    about: "हमारे बारे में",
    quickLinks: "त्वरित लिंक",
    contact: "संपर्क करें",
    rightsReserved: "सर्वाधिकार सुरक्षित। Next.js के साथ निर्मित।"
  },
  fr: {
    // Header & Home
    explore: "Explorer",
    trending: "Tendances",
    categories: "Catégories",
    searchPlaceholder: "Cherchez l'extraordinaire...",
    discover: "Découvrez l'Extraordinaire",
    heroTitle: "Élevez Votre",
    heroTitleSpan: "Style de Vie.",
    heroSub: "Produits premium sélectionnés de créateurs de haut niveau. Expérimentez le shopping repensé pour l'ère moderne.",
    startExploring: "Commencer à Explorer",
    viewCollections: "Voir les Collections",
    curatedPicks: "Sélections Soignées",
    handSelected: "Articles sélectionnés à la main rien que pour vous.",
    aiRecommendations: "Recommandations IA Personnalisées",
    aiRecSub: "Adapté à votre goût unique en utilisant le filtrage collaboratif.",
    chatbotTitle: "Assistant Shopping IA",
    addToCart: "Ajouter au Panier",
    chatbotWelcome: "Salut ! Je suis votre Assistant IA. Demandez-moi de recommander des produits, suivre des commandes ou vérifier des retours !",
    chatPlaceholder: "Demandez-moi n'importe quoi...",
    cart: "Panier",
    profile: "Profil",
    wishlist: "Liste d'envies",

    // Auth
    signIn: "Se Connecter",
    createAccount: "Créer un Compte",
    email: "Adresse Email",
    password: "Mot de passe",
    name: "Nom Complet",
    phone: "Numéro de Téléphone",
    loginTitle: "Bon Retour",
    registerTitle: "Rejoindre Saumy E-commerce",

    // Cart Page
    shoppingCart: "Panier d'achats",
    subtotal: "Sous-total",
    tax: "Taxe Estimée",
    total: "Total",
    checkout: "Passer à la Caisse",
    emptyCart: "Votre panier est vide",
    remove: "Supprimer",
    outOfStock: "Épuisé",
    addedToCart: "Ajouté au Panier",

    // Profile & Orders
    myAccount: "Mon Compte",
    orders: "Commandes & Retours",
    signOut: "Déconnexion",
    settings: "Paramètres",
    addresses: "Adresses Enregistrées",
    
    // Product Page
    deliveryCheck: "Vérifier la Disponibilité",
    enterPin: "Entrez le code PIN",
    check: "Vérifier",

    // Footer
    about: "À Propos",
    quickLinks: "Liens Rapides",
    contact: "Contact",
    rightsReserved: "Tous droits réservés. Construit avec Next.js."
  },
  de: {
    // Header & Home
    explore: "Erkunden",
    trending: "Trends",
    categories: "Kategorien",
    searchPlaceholder: "Suche nach dem Außergewöhnlichen...",
    discover: "Entdecke das Außergewöhnliche",
    heroTitle: "Erhebe Deinen",
    heroTitleSpan: "Lebensstil.",
    heroSub: "Ausgewählte Premium-Produkte von Top-Kreativen. Erlebe Einkaufen neu für das moderne Zeitalter.",
    startExploring: "Beginne zu Erkunden",
    viewCollections: "Kollektionen Ansehen",
    curatedPicks: "Ausgewählte Tipps",
    handSelected: "Handverlesene Artikel nur für dich.",
    aiRecommendations: "KI-Personalisierte Empfehlungen",
    aiRecSub: "Maßgeschneidert auf deinen einzigartigen Geschmack.",
    chatbotTitle: "KI-Einkaufsassistent",
    addToCart: "In den Warenkorb",
    chatbotWelcome: "Hallo! Ich bin dein KI-Assistent. Frag mich nach Empfehlungen, Bestellverfolgung oder Rücksendungen!",
    chatPlaceholder: "Frag mich etwas...",
    cart: "Warenkorb",
    profile: "Profil",
    wishlist: "Wunschzettel",

    // Auth
    signIn: "Anmelden",
    createAccount: "Konto Erstellen",
    email: "E-Mail-Adresse",
    password: "Passwort",
    name: "Vollständiger Name",
    phone: "Telefonnummer",
    loginTitle: "Willkommen Zurück",
    registerTitle: "Saumy E-commerce Beitreten",

    // Cart Page
    shoppingCart: "Warenkorb",
    subtotal: "Zwischensumme",
    tax: "Geschätzte Steuer",
    total: "Gesamt",
    checkout: "Zur Kasse",
    emptyCart: "Dein Warenkorb ist leer",
    remove: "Entfernen",
    outOfStock: "Ausverkauft",
    addedToCart: "Hinzugefügt",

    // Profile & Orders
    myAccount: "Mein Konto",
    orders: "Bestellungen & Retouren",
    signOut: "Abmelden",
    settings: "Einstellungen",
    addresses: "Gespeicherte Adressen",
    
    // Product Page
    deliveryCheck: "Lieferverfügbarkeit Prüfen",
    enterPin: "PIN-Code eingeben",
    check: "Prüfen",

    // Footer
    about: "Über Uns",
    quickLinks: "Schnelllinks",
    contact: "Kontakt",
    rightsReserved: "Alle Rechte vorbehalten. Erstellt mit Next.js."
  }
};
