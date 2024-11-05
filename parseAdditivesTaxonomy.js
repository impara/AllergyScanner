// parseAdditivesTaxonomy.js

const fs = require('fs');
const path = require('path');

// Function to parse the additives.txt file
function parseTaxonomyFile(fileContent) {
    const lines = fileContent.split('\n');
    const additivesMap = {};

    let currentId = null;
    let currentAdditive = null;
    lines.forEach((line) => {
        line = line.trim();

        // Skip comments and empty lines
        if (!line || line.startsWith('#')) {
            return;
        }

        // Handle hierarchy (parent-child relationships)
        if (line.startsWith('<')) {
            // Example: "< en:caramel color"
            const parent = line.substring(1).trim();
            if (currentAdditive) {
                currentAdditive.parents.push(parent);
            }
            return;
        }

        // Handle new additive entries
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

            if (!additivesMap[currentId]) {
                currentAdditive = additivesMap[currentId] = {
                    id: currentId,
                    labels: {},
                    synonyms: {},
                    parents: [],
                };
            } else {
                currentAdditive = additivesMap[currentId];
            }

            // Split labels by commas and add them individually
            const labels = name.split(',').map((label) => label.trim());

            // Add labels
            currentAdditive.labels[langCode] = currentAdditive.labels[langCode] || [];
            currentAdditive.labels[langCode].push(...labels);
        } else if (line.startsWith('wikidata:')) {
            // Handle Wikidata entries
            const [key, value] = line.split(':', 2);
            currentAdditive.wikidata = value.trim();
        } else if (line.startsWith('wikipedia:')) {
            // Handle Wikipedia entries
            const [key, value] = line.split(':', 2);
            currentAdditive.wikipedia = value.trim();
        } else if (line.startsWith('synonyms:')) {
            // Handle synonyms
            const [key, value] = line.split(':', 2);
            const langCode = key.split(':')[1];
            if (langCode && value) {
                currentAdditive.synonyms = currentAdditive.synonyms || {};
                currentAdditive.synonyms[langCode] = value.split(',').map((s) => s.trim());
            }
        } else if (line.startsWith('description:')) {
            // Handle descriptions
            const [key, value] = line.split(':', 2);
            const langCode = key.split(':')[1];
            if (langCode && value) {
                currentAdditive.description = currentAdditive.description || {};
                currentAdditive.description[langCode] = value.trim();
            }
        } else if (line.startsWith('e_number:')) {
            // Handle E numbers
            const [key, value] = line.split(':', 2);
            currentAdditive.e_number = value.trim();
        } else if (line.startsWith('vegan:') || line.startsWith('vegetarian:')) {
            // Handle vegan and vegetarian status
            const [key, value] = line.split(':', 2);
            currentAdditive[key] = value.trim();
        } else if (/^[^:]+$/.test(line)) {
            // If the line is just an additive name without language code
            const name = line.trim();
            if (name) {
                currentAdditive.labels['en'] = currentAdditive.labels['en'] || [];
                currentAdditive.labels['en'].push(name);
            }
        } else {
            // Unknown line format, skip
        }
    });

    return additivesMap;
}

// Read additives.txt
const taxonomyFilePath = path.join(__dirname, 'additives.txt');
const fileContent = fs.readFileSync(taxonomyFilePath, 'utf8');

const additivesMap = parseTaxonomyFile(fileContent);

// Save as JSON
const outputPath = path.join(__dirname, 'additives.json');
fs.writeFileSync(outputPath, JSON.stringify(additivesMap, null, 2), 'utf8');

console.log('Additives taxonomy parsed and saved to additives.json');