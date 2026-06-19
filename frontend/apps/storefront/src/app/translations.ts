export type Language = 'en' | 'es' | 'hi';
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
    chatbotWelcome: "Hi! I'm your E-Commerce AI Assistant. Ask me to recommend products, track orders, or check returns!",
    chatPlaceholder: "Type your query...",
    cart: "Cart",
    profile: "Profile"
  },
  es: {
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
    chatbotWelcome: "¡Hola! Soy tu asistente de IA. ¡Pídeme recomendar productos, rastrear pedidos o verificar devoluciones!",
    chatPlaceholder: "Escribe tu consulta...",
    cart: "Carrito",
    profile: "Perfil"
  },
  hi: {
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
    chatbotWelcome: "नमस्ते! मैं आपका एआई शॉपिंग सहायक हूं। मुझसे उत्पाद सुझाने, ऑर्डर ट्रैक करने या रिटर्न जांचने के लिए कहें!",
    chatPlaceholder: "अपनी क्वेरी लिखें...",
    cart: "कार्ट",
    profile: "प्रोफ़ाइल"
  }
};
