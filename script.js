// script.js
const imageInput = document.getElementById('imageInput');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const imagePreview = document.getElementById('imagePreview');
const removeImageBtn = document.getElementById('removeImage');

// Handle image preview
imageInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreviewContainer.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
});

// Handle image removal
removeImageBtn.addEventListener('click', () => {
    imageInput.value = '';
    imagePreviewContainer.classList.add('hidden');
    imagePreview.src = '';
});

let currentRecipeIndex = 0;
let recipes = [];

document.getElementById('uploadForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    console.log('Form submitted');

    const ingredientsInput = document.getElementById('ingredients');
    const mealType = document.getElementById('mealType').value;
    const servings = document.getElementById('servings').value;
    const dietaryType = document.getElementById('dietaryType').value;
    const spiceLevel = document.getElementById('spiceLevel').value;
    const cookingTime = document.getElementById('cookingTime').value;
    const calories = document.getElementById('calories').value;
    const allergies = document.getElementById('allergies').value;
    
    const progressContainer = document.getElementById('progressContainer');
    const resultsSection = document.getElementById('resultsSection');
    const recipeList = document.getElementById('recipeList');
    const recipeDots = document.getElementById('recipeDots');

    if (!recipeList || !recipeDots) {
        console.error('Required elements not found');
        return;
    }

    if (!mealType) {
        alert('Please select a meal type');
        return;
    }

    // Show progress
    progressContainer.classList.remove('hidden');
    resultsSection.classList.add('hidden');

    try {
        let response;
        if (imageInput.files.length > 0) {
            console.log('Processing image upload');
            const formData = new FormData();
            formData.append('file', imageInput.files[0]);
            formData.append('mealType', mealType);
            formData.append('servings', servings);
            formData.append('dietaryType', dietaryType);
            formData.append('spiceLevel', spiceLevel);
            formData.append('cookingTime', cookingTime);
            formData.append('calories', calories);
            formData.append('allergies', allergies);
            
            response = await fetch('http://127.0.0.1:5000/upload', {
                method: 'POST',
                body: formData
            });
        } else if (ingredientsInput.value.trim()) {
            console.log('Processing text input');
            const ingredients = ingredientsInput.value.split(',').map(s => s.trim());
            console.log('Ingredients:', ingredients);
            
            response = await fetch('http://127.0.0.1:5000/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    ingredients: ingredients,
                    mealType: mealType,
                    servings: parseInt(servings),
                    dietaryType: dietaryType,
                    spiceLevel: spiceLevel,
                    cookingTime: cookingTime,
                    calories: calories,
                    allergies: allergies
                })
            });
        } else {
            throw new Error('Please either upload an image or enter ingredients');
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch recipes');
        }

        const data = await response.json();
        console.log('Received data:', data);
        
        // Reset recipe state
        currentRecipeIndex = 0;
        recipes = [];
        
        // Clear previous results
        recipeList.innerHTML = '';
        recipeDots.innerHTML = '';
        
        // Create a container for the first recipe
        let currentRecipe = document.createElement('li');
        let currentSection = null;
        let currentList = null;
        
        // Parse the content line by line
        const recipeContent = data.recipes.trim();
        const lines = recipeContent.split('\n').map(line => line.trim()).filter(line => line);
        
        lines.forEach(line => {
            // Skip empty lines and the initial "Ingredients" line
            if (!line || line === 'Ingredients') {
                return;
            }
            
            // Handle recipe title
            if (line.match(/^Recipe \d+:/)) {
                if (currentRecipe && currentRecipe.hasChildNodes()) {
                    recipes.push(currentRecipe.cloneNode(true));
                    currentRecipe = document.createElement('li');
                }
                const titleDiv = document.createElement('div');
                titleDiv.className = 'recipe-title';
                titleDiv.textContent = line;
                currentRecipe.appendChild(titleDiv);
            }
            // Handle sections
            else if (line.toLowerCase().includes('ingredients:')) {
                currentSection = createSection('Ingredients');
                currentList = document.createElement('ul');
                currentList.className = 'ingredients-list';
                currentSection.appendChild(currentList);
                currentRecipe.appendChild(currentSection);
            }
            else if (line.toLowerCase().includes('instructions:')) {
                currentSection = createSection('Instructions');
                currentList = document.createElement('ol');
                currentList.className = 'instructions-list';
                currentSection.appendChild(currentList);
                currentRecipe.appendChild(currentSection);
            }
            else if (line.toLowerCase().includes('nutritional information')) {
                currentSection = createSection('Nutritional Information');
                currentList = document.createElement('div');
                currentList.className = 'nutrition-info';
                currentSection.appendChild(currentList);
                currentRecipe.appendChild(currentSection);
            }
            // Handle list items
            else if (currentList && currentSection) {
                if (line.toLowerCase().includes('ingredients:') || 
                    line.toLowerCase().includes('instructions:') || 
                    line.toLowerCase().includes('nutritional information') ||
                    !line.trim()) {
                    return;
                }

                if (currentList.className === 'ingredients-list') {
                    if (line.match(/^[•\-\*]/)) {
                        const li = document.createElement('li');
                        li.textContent = line.replace(/^[•\-\*]\s*/, '').trim();
                        currentList.appendChild(li);
                    }
                }
                else if (currentList.className === 'instructions-list') {
                    if (line.match(/^\d+\./)) {
                        const li = document.createElement('li');
                        li.textContent = line.replace(/^\d+\.\s*/, '').trim();
                        currentList.appendChild(li);
                    }
                }
                else if (currentList.className === 'nutrition-info') {
                    if (line.match(/^[•\-\*]/)) {
                        const nutritionText = line.replace(/^[•\-\*]\s*/, '').trim();
                        if (nutritionText.includes(':')) {
                            const [label, value] = nutritionText.split(':').map(s => s.trim());
                            const item = document.createElement('div');
                            item.className = 'nutrition-item';
                            const labelSpan = document.createElement('span');
                            labelSpan.className = 'nutrition-label';
                            labelSpan.textContent = label;
                            const valueSpan = document.createElement('span');
                            valueSpan.className = 'nutrition-value';
                            valueSpan.textContent = value;
                            item.appendChild(labelSpan);
                            item.appendChild(valueSpan);
                            currentList.appendChild(item);
                        }
                    }
                }
            }
        });

        // Add the last recipe if it exists and has content
        if (currentRecipe && currentRecipe.hasChildNodes()) {
            recipes.push(currentRecipe.cloneNode(true));
        }

        // Only proceed if we have recipes
        if (recipes.length > 0) {
            // Create dots for navigation
            recipes.forEach((_, index) => {
                const dot = document.createElement('div');
                dot.className = 'recipe-dot';
                dot.addEventListener('click', () => showRecipe(index));
                recipeDots.appendChild(dot);
            });

            // Show first recipe
            showRecipe(0);
            resultsSection.classList.remove('hidden');

            // Add event listeners for navigation buttons
            const prevBtn = document.getElementById('prevRecipe');
            const nextBtn = document.getElementById('nextRecipe');
            if (prevBtn && nextBtn) {
                prevBtn.addEventListener('click', showPreviousRecipe);
                nextBtn.addEventListener('click', showNextRecipe);
            }
        } else {
            throw new Error('No recipes were generated');
        }

    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'An error occurred while fetching recipes.');
    } finally {
        progressContainer.classList.add('hidden');
        ingredientsInput.value = '';
    }
});

function showRecipe(index) {
    if (index < 0 || index >= recipes.length) return;
    
    currentRecipeIndex = index;
    const recipeList = document.getElementById('recipeList');
    const prevBtn = document.getElementById('prevRecipe');
    const nextBtn = document.getElementById('nextRecipe');
    
    // Update navigation buttons
    prevBtn.disabled = currentRecipeIndex === 0;
    nextBtn.disabled = currentRecipeIndex === recipes.length - 1;
    
    // Clear and add new recipe
    const currentRecipe = recipes[index].cloneNode(true);
    currentRecipe.style.opacity = '0';
    currentRecipe.classList.add('active');
    
    // Fade out current recipe if exists
    const existingRecipe = recipeList.querySelector('li');
    if (existingRecipe) {
        existingRecipe.style.opacity = '0';
        setTimeout(() => {
            recipeList.innerHTML = '';
            recipeList.appendChild(currentRecipe);
            // Trigger reflow
            currentRecipe.offsetHeight;
            currentRecipe.style.opacity = '1';
        }, 300);
    } else {
        recipeList.innerHTML = '';
        recipeList.appendChild(currentRecipe);
        // Trigger reflow
        currentRecipe.offsetHeight;
        currentRecipe.style.opacity = '1';
    }
    
    // Update dots
    const dots = document.querySelectorAll('.recipe-dot');
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

function showPreviousRecipe() {
    if (currentRecipeIndex > 0) {
        showRecipe(currentRecipeIndex - 1);
    }
}

function showNextRecipe() {
    if (currentRecipeIndex < recipes.length - 1) {
        showRecipe(currentRecipeIndex + 1);
    }
}

// Helper function to create a section with title
function createSection(title) {
    const section = document.createElement('div');
    section.className = 'recipe-section';
    const titleDiv = document.createElement('div');
    titleDiv.className = 'recipe-section-title';
    titleDiv.textContent = title;
    section.appendChild(titleDiv);
    return section;
}
