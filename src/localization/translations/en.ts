export default {
  settings: {
    title: 'Settings',
    language: 'Language',
    darkMode: 'Dark Mode',
    logout: 'Logout',
    selectLanguage: 'Select Language',
    english: 'English',
    spanish: 'Spanish',
    finnish: 'Finnish',
    danish: 'Danish',
    german: 'German',
    policies: 'Policies',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    appearance: 'Appearance',
  },
  scan: {
    title: 'Scan',
    instructions: 'Point your camera at a product barcode to scan',
    processing: 'Processing...',
    productNotFound: 'Product Not Found',
    error: 'Error',
    tryAgain: 'Please try again',
    scanNext: 'Scan Next',
    viewDetails: 'View Details',
    requestingCamera: 'Requesting camera permission...',
    noCamera: 'No access to camera.',
    openSettings: 'Open Settings',
    ingredientsMissing: 'Ingredient Information Unavailable',
    ingredientsMissingDesc: 'Ingredient details for this product are missing. Therefore, we cannot determine the presence of ingredients. Please exercise caution and consider verifying the information from the product packaging or manufacturer.',
    productNotFoundDesc: 'This barcode is not recognized in any database.',
    unexpectedError: 'An unexpected error occurred. Please try again.',
    scansRemaining: 'Scans remaining today: {{count}}',
    scanLimitReached: 'Daily Scan Limit Reached',
    watchAdPrompt: 'Watch a video ad to get 3 more scans!',
    watchAdButton: 'Watch Ad for More Scans',
  },
  ingredients: {
    title: 'Ingredient Profile',
    addCustom: 'Add custom Ingredient',
    deleted: 'deleted',
    added: 'added to',
    enabled: 'enabled',
    disabled: 'disabled',
    group: 'group',
    invalidInput: 'Invalid Input',
    enterIngredient: 'Please enter an ingredient name.',
    alreadyExists: 'Ingredient already exists',
    alreadyExistsDesc: 'This ingredient is already in your list.',
    notFound: 'Ingredient Not Found',
    notFoundDesc: 'This ingredient is not recognized in the taxonomy.',
    deleteConfirm: 'Delete Ingredient',
    deleteConfirmDesc: 'Are you sure you want to delete "{name}" from your ingredient list?',
    cancel: 'Cancel',
    delete: 'Delete',
    undo: 'Undo',
    loading: 'Loading...',
    selectGroup: 'Select a group for',
  },
  product: {
    brand: 'Brand:',
    countries: 'Countries:',
    detectedIngredients: 'Detected Ingredients:',
    ingredients: 'Ingredients:',
    nutritionalInfo: 'Nutritional Information:',
    safeToConsume: 'Safe to Consume',
    caution: 'Caution',
    safe: 'This product is safe based on your ingredient preferences.',
    unsafe: 'This product contains ingredients you should be cautious about.',
    unavailable: 'Ingredients information is unavailable for this product.',
    calories: 'Calories',
    protein: 'Protein',
    carbs: 'Carbs',
    fat: 'Fat',
    noNutritionalInfo: 'Nutritional information not available.',
    nutriments: {
      title: 'Nutritional Information:',
      energy: 'Calories: {value} {unit}',
      proteins: 'Protein: {value}g',
      carbohydrates: 'Carbs: {value}g',
      fat: 'Fat: {value}g',
      na: 'N/A'
    },
    unknownBrand: 'Unknown Brand',
  },
  categories: {
    allergens: 'Allergens & Sensitivities',
    vegan: 'Animal Products',
    eNumbers: 'Additives & Preservatives',
    pregnancy: 'Pregnancy Warnings',
    environment: 'Environmental Impact',
    glutenFree: 'Contains Gluten',
    ketoFriendly: 'High Carbs',
    lowSodium: 'High Sodium',
    organic: 'Non-Organic',
    dairyFree: 'Contains Dairy',
    sugarFree: 'Sugars & Sweeteners',
    halalKosher: 'Non-Halal/Kosher',
    other: 'Other',
  },
  auth: {
    welcome: 'Welcome to PurePlate',
    subtitle: 'Make informed food choices by scanning barcodes and checking ingredients',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    googleSignIn: 'Sign in with Google',
    noAccount: "Don't have an account? Sign Up",
    haveAccount: 'Already have an account? Sign In',
    authFailed: 'Authentication failed. Please try again.',
    enterEmailAndPassword: 'Please enter both email and password',
    accountCreated: 'Account created successfully',
    signedIn: 'Signed in successfully',
    googleSignInSuccess: 'Signed in with Google successfully',
    googleSignInFailed: 'Google Sign-In failed. Please try again.',
    errors: {
      'user-not-found': 'No account found with this email',
      'wrong-password': 'Incorrect password',
      'invalid-email': 'Invalid email address',
      'too-many-requests': 'Too many attempts. Please try again later',
      'network-request-failed': 'Network error. Please check your connection',
      'email-already-in-use': 'An account with this email already exists',
      'weak-password': 'Password should be at least 6 characters',
      'default': 'An error occurred during sign in',
      'signUpFailed': 'Failed to create account'
    }
  },
  navigation: {
    scan: 'Scan',
    ingredients: 'Ingredients',
    settings: 'Settings',
  },
};