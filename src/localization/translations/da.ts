export default {
  settings: {
    title: 'Indstillinger',
    language: 'Sprog',
    darkMode: 'Mørk tilstand',
    logout: 'Log ud',
    selectLanguage: 'Vælg sprog',
    english: 'Engelsk',
    spanish: 'Spansk',
    finnish: 'Finsk',
    danish: 'Dansk',
    german: 'Tysk',
    policies: 'Politikker',
    privacyPolicy: 'Privatlivspolitik',
    termsOfService: 'Servicevilkår',
    appearance: 'Udseende',
  },
  scan: {
    title: 'Scan',
    instructions: 'Ret dit kamera mod produktets stregkode for at scanne',
    processing: 'Behandler...',
    productNotFound: 'Produkt ikke fundet',
    error: 'Fejl',
    tryAgain: 'Prøv venligst igen',
    scanNext: 'Scan næste',
    viewDetails: 'Se detaljer',
    requestingCamera: 'Anmoder om kameratilladelse...',
    noCamera: 'Ingen adgang til kamera.',
    openSettings: 'Åbn Indstillinger',
    ingredientsMissing: 'Ingrediensinformation ikke tilgængelig',
    ingredientsMissingDesc: 'Ingrediensdetaljer for dette produkt mangler. Derfor kan vi ikke bestemme tilstedeværelsen af ingredienser. Udvis venligst forsigtighed og overvej at verificere informationen fra produktemballagen eller producenten.',
    productNotFoundDesc: 'Denne stregkode er ikke genkendt i nogen database.',
    unexpectedError: 'Der opstod en uventet fejl. Prøv venligst igen.',
    scansRemaining: 'Resterende scanninger i dag: {{count}}',
    scanLimitReached: 'Daglig Scanningsgrænse Nået',
    watchAdPrompt: 'Se en videoreklame for at få 3 flere scanninger!',
    watchAdButton: 'Se Reklame for Flere Scanninger',
  },
  ingredients: {
    title: 'Ingrediensprofil',
    addCustom: 'Tilføj tilpasset ingrediens',
    deleted: 'slettet',
    added: 'tilføjet til',
    enabled: 'aktiveret',
    disabled: 'deaktiveret',
    group: 'gruppe',
    invalidInput: 'Ugyldig indtastning',
    enterIngredient: 'Indtast venligst et ingrediensnavn.',
    alreadyExists: 'Ingrediens findes allerede',
    alreadyExistsDesc: 'Denne ingrediens er allerede på din liste.',
    notFound: 'Ingrediens ikke fundet',
    notFoundDesc: 'Denne ingrediens er ikke genkendt i taksonomien.',
    deleteConfirm: 'Slet ingrediens',
    deleteConfirmDesc: 'Er du sikker på, at du vil slette "{name}" fra din ingrediensliste?',
    cancel: 'Annuller',
    delete: 'Slet',
    undo: 'Fortryd',
    loading: 'Indlæser...',
    selectGroup: 'Vælg gruppe for',
  },
  product: {
    brand: 'Mærke:',
    countries: 'Lande:',
    detectedIngredients: 'Registrerede ingredienser:',
    ingredients: 'Ingredienser:',
    nutritionalInfo: 'Næringsindhold:',
    safeToConsume: 'Sikker at indtage',
    caution: 'Advarsel',
    safe: 'Dette produkt er sikkert baseret på dine ingredienspræferencer.',
    unsafe: 'Dette produkt indeholder ingredienser, du bør være forsigtig med.',
    unavailable: 'Ingrediensinformation er ikke tilgængelig for dette produkt.',
    calories: 'Kalorier',
    protein: 'Protein',
    carbs: 'Kulhydrater',
    fat: 'Fedt',
    noNutritionalInfo: 'Næringsindhold ikke tilgængeligt.',
    nutriments: {
      title: 'Næringsindhold:',
      'energy-kcal': 'Kalorier: {value} {unit}',
      proteins: 'Protein: {value}g',
      carbohydrates: 'Kulhydrater: {value}g',
      fat: 'Fedt: {value}g',
      na: 'N/A'
    },
    unknownBrand: 'Ukendt mærke',
  },
  categories: {
    allergens: 'Allergener',
    vegan: 'Animalske',
    eNumbers: 'Tilsætningsstoffer',
    pregnancy: 'Graviditet',
    environment: 'Miljøpåvirkning',
    glutenFree: 'Indeholder Gluten',
    ketoFriendly: 'Højt Kulhydrat',
    lowSodium: 'Højt Natrium',
    organic: 'Ikke Økologisk',
    dairyFree: 'Indeholder Mælk',
    sugarFree: 'Sukker',
    halalKosher: 'Halal/Kosher',
    other: 'Andet',
  },
  auth: {
    welcome: 'Velkommen til PurePlate',
    subtitle: 'Tag informerede madvalg ved at scanne stregkoder og tjekke ingredienser',
    email: 'Email',
    password: 'Adgangskode',
    signIn: 'Log ind',
    signUp: 'Tilmeld',
    googleSignIn: 'Log ind med Google',
    noAccount: 'Har du ikke en konto? Tilmeld dig',
    haveAccount: 'Har du allerede en konto? Log ind',
    authFailed: 'Godkendelse mislykkedes. Prøv venligst igen.',
    enterEmailAndPassword: 'Indtast venligst både email og adgangskode',
    accountCreated: 'Konto oprettet med succes',
    signedIn: 'Logget ind med succes',
    googleSignInSuccess: 'Logget ind med Google med succes',
    googleSignInFailed: 'Google-login mislykkedes. Prøv venligst igen.',
    errors: {
      'user-not-found': 'Ingen konto fundet med denne email',
      'wrong-password': 'Forkert adgangskode',
      'invalid-email': 'Ugyldig email-adresse',
      'too-many-requests': 'For mange forsøg. Prøv igen senere',
      'network-request-failed': 'Netværksfejl. Tjek din forbindelse',
      'email-already-in-use': 'En konto med denne email findes allerede',
      'weak-password': 'Adgangskoden skal være mindst 6 tegn',
      'default': 'Der opstod en fejl under login',
      'signUpFailed': 'Kunne ikke oprette konto'
    }
  },
  navigation: {
    scan: 'Scan',
    ingredients: 'Ingredienser',
    settings: 'Indstillinger',
  },
};