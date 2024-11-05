// parseIngredientsTaxonomy.js

const fs = require('fs');
const path = require('path');

// Function to parse the ingredients.txt file
function parseTaxonomyFile(fileContent) {
    const lines = fileContent.split('\n');
    const ingredientsMap = {};

    let currentId = null;
    let currentIngredient = null;
    lines.forEach((line) => {
        line = line.trim();

        // Skip comments and empty lines
        if (!line || line.startsWith('#')) {
            return;
        }

        // Handle hierarchy (parent-child relationships)
        if (line.startsWith('<')) {
            // Example: "< en:caramel syrup"
            const parent = line.substring(1).trim();
            if (currentIngredient) {
                currentIngredient.parents.push(parent);
            }
            return;
        }

        // Handle new ingredient entries
        const langCodeMatch = line.match(/^([a-z]{2,3}):\s*(.+)$/);
        if (langCodeMatch) {
            const langCode = langCodeMatch[1];
            const name = langCodeMatch[2].trim();

            // If the line is in English, set the current ID without 'en:' prefix
            if (langCode === 'en') {
                currentId = name.toLowerCase().replace(/\s+/g, '-');
            } else if (!currentId) {
                // Use the first encountered name as ID if English name is not available
                currentId = name.toLowerCase().replace(/\s+/g, '-');
            }

            if (!ingredientsMap[currentId]) {
                currentIngredient = ingredientsMap[currentId] = {
                    id: currentId,
                    labels: {},
                    synonyms: {},
                    parents: [],
                };
            } else {
                currentIngredient = ingredientsMap[currentId];
            }

            // **Split labels by commas and add them individually**
            const labels = name.split(',').map((label) => label.trim());

            // Add labels
            currentIngredient.labels[langCode] = currentIngredient.labels[langCode] || [];
            currentIngredient.labels[langCode].push(...labels);
        } else if (line.startsWith('wikidata:')) {
            // Handle Wikidata entries
            const [key, value] = line.split(':', 2);
            currentIngredient.wikidata = value.trim();
        } else if (line.startsWith('wikipedia:')) {
            // Handle Wikipedia entries
            const [key, value] = line.split(':', 2);
            currentIngredient.wikipedia = value.trim();
        } else if (line.startsWith('synonyms:')) {
            // Handle synonyms
            const [key, value] = line.split(':', 2);
            const langCode = key.split(':')[1];
            if (langCode && value) {
                currentIngredient.synonyms = currentIngredient.synonyms || {};
                currentIngredient.synonyms[langCode] = value.split(',').map((s) => s.trim());
            }
        } else if (line.startsWith('description:')) {
            // Handle descriptions
            const [key, value] = line.split(':', 2);
            const langCode = key.split(':')[1];
            if (langCode && value) {
                currentIngredient.description = currentIngredient.description || {};
                currentIngredient.description[langCode] = value.trim();
            }
        } else if (/^[^:]+$/.test(line)) {
            // If the line is just an ingredient name without language code
            const name = line.trim();
            if (name) {
                currentIngredient.labels['en'] = currentIngredient.labels['en'] || [];
                currentIngredient.labels['en'].push(name);
            }
        } else {
            // Unknown line format, skip
        }
    });

    return ingredientsMap;
}

// Read ingredients.txt
const taxonomyFilePath = path.join(__dirname, 'ingredients.txt');
const fileContent = fs.readFileSync(taxonomyFilePath, 'utf8');

const ingredientsMap = parseTaxonomyFile(fileContent);

// Save as JSON
const outputPath = path.join(__dirname, 'ingredients.json');
fs.writeFileSync(outputPath, JSON.stringify(ingredientsMap, null, 2), 'utf8');

console.log('Ingredients taxonomy parsed and saved to ingredients.json');
