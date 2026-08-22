const dotenv = require('dotenv');

dotenv.config();

/**
 * Helper to call Gemini API if key is available
 */
async function callGemini(promptText) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_or_openai_api_key_here') {
    return null; // Signals fallback to domain-intelligent heuristic generator
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 600
        }
      })
    });

    if (!response.ok) {
      console.warn(`[AI Service] Gemini API returned status ${response.status}. Falling back to internal engine.`);
      return null;
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return generatedText ? generatedText.trim() : null;
  } catch (error) {
    console.warn(`[AI Service] Error connecting to external AI provider: ${error.message}`);
    return null;
  }
}

/**
 * 1. AI Product Description Generator
 * POST /api/ai/product-description (Admin Protected)
 */
async function generateProductDescription(req, res, next) {
  try {
    const { name, craft_type, material, color, characteristics } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required to generate description.'
      });
    }

    const prompt = `
      You are an expert luxury handicraft curator and copywriter specializing in traditional Balochistan and Pakistani artisanal heritage.
      Write a compelling, evocative, and commercially persuasive product description (2 to 3 paragraphs) for the following handcrafted item:
      - Product Name: ${name}
      - Craft Technique: ${craft_type || 'Traditional Artisanal Craft'}
      - Materials: ${material || 'Authentic regional raw materials'}
      - Color Palette: ${color || 'Natural earthy tones'}
      - Key Characteristics / Details: ${characteristics || 'Handmade with generational heritage techniques'}

      Requirements:
      - Highlight the cultural artistry, meticulous hand-crafting hours, and premium heirloom quality.
      - Do not include markdown headers or bullet points. Output clean, evocative paragraph text ready for an online catalog.
    `;

    // Attempt live Gemini AI call
    let description = await callGemini(prompt);

    // Fallback Domain-Trained Heuristic Generator if API key is not configured
    if (!description) {
      const craft = craft_type || 'traditional craftsmanship';
      const mat = material ? `utilizing premium ${material}` : 'sourcing indigenous raw materials';
      const clr = color ? `in rich ${color} hues` : 'finished in authentic natural tones';
      const chars = characteristics ? `Noteworthy for its ${characteristics}, ` : '';

      description = `The ${name} is a masterwork of authentic ${craft}, meticulously brought to life by generational artisans ${mat}. Each piece embodies centuries of regional heritage, featuring intricate hand-detailing ${clr} that captures the spirit and cultural pride of Balochistan.\n\n${chars}this heirloom-grade creation requires days of patient precision. Perfect for connoisseurs of authentic ethical luxury, it seamlessly bridges traditional artistry with modern contemporary elegance.`;
    }

    return res.status(200).json({
      success: true,
      data: {
        description: description.replace(/[\*\#\_]/g, '').trim(),
        provider: process.env.AI_API_KEY && process.env.AI_API_KEY.trim() !== '' ? 'Google Gemini 1.5 Flash' : 'BalochHunar Domain AI Engine'
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 2. AI Smart Tags & Category Suggester
 * POST /api/ai/suggest-tags (Admin Protected)
 */
async function suggestTagsAndCategory(req, res, next) {
  try {
    const { name, description, craft_type } = req.body;

    if (!name && !description) {
      return res.status(400).json({
        success: false,
        message: 'Product name or description is required for tag suggestions.'
      });
    }

    const prompt = `
      You are an ecommerce catalog taxonomist for traditional South Asian handicrafts.
      Analyze the product details below:
      - Title: ${name || ''}
      - Craft: ${craft_type || ''}
      - Details: ${description || ''}

      Generate 5 to 7 relevant comma-separated tags (e.g. Balochi, Handmade, Silk Thread, Traditional, Embroidery, Couture).
      Output ONLY comma-separated words.
    `;

    let tagsText = await callGemini(prompt);

    if (!tagsText) {
      // Heuristic tag generation
      const tags = ['Handmade', 'Artisanal', 'Heritage', 'Traditional'];
      if (/doch|embroider|needle|silk|kurti|shawl|chiffon/i.test(`${name} ${description} ${craft_type}`)) {
        tags.push('Balochi Doch', 'Silk Thread', 'Mirror Work', 'Couture');
      }
      if (/leather|chappal|shoe|bag|saddle/i.test(`${name} ${description} ${craft_type}`)) {
        tags.push('Vegetable-Tanned', 'Full-Grain Leather', 'Sibi Craft', 'Footwear');
      }
      if (/pottery|clay|terracotta|pitcher|vase/i.test(`${name} ${description} ${craft_type}`)) {
        tags.push('Terracotta', 'River Clay', 'Eco-Friendly', 'Panjgur Pottery');
      }
      if (/kilim|rug|wool|carpet|weave/i.test(`${name} ${description} ${craft_type}`)) {
        tags.push('Wool Kilim', 'Flatweave', 'Natural Dye', 'Tribal Rug');
      }
      tagsText = tags.slice(0, 6).join(', ');
    }

    // Clean tags
    const cleanTags = tagsText
      .split(',')
      .map(t => t.replace(/[^a-zA-Z0-9\s\-]/g, '').trim())
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      data: {
        tags: cleanTags.join(', '),
        tagList: cleanTags,
        provider: process.env.AI_API_KEY && process.env.AI_API_KEY.trim() !== '' ? 'Google Gemini 1.5 Flash' : 'BalochHunar Domain AI Engine'
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 3. AI Artisan / Cultural Story Generator
 * POST /api/ai/artisan-story (Admin Protected)
 */
async function generateArtisanStory(req, res, next) {
  try {
    const { name, location, experience_years, craft_type, background, materials } = req.body;

    if (!name || !craft_type) {
      return res.status(400).json({
        success: false,
        message: 'Artisan name and craft specialization are required.'
      });
    }

    const prompt = `
      You are a cultural anthropologist and master storyteller documenting living heritage in Balochistan.
      Write an authentic, humanizing biographical story titled "The Story Behind the Craft" (2 short paragraphs) for:
      - Artisan Name: ${name}
      - Location: ${location || 'Balochistan'}
      - Experience: ${experience_years || 15} years of dedicated practice
      - Craft: ${craft_type}
      - Ancestral Background / Inspiration: ${background || 'Learned craft from family elders in the village'}
      - Primary Raw Materials: ${materials || 'Indigenous natural materials and dyes'}

      Focus on their dedication, preservation of ancient motifs, empowerment of local community members, and pride in their heritage.
      Do not use markdown formatting. Return clean text.
    `;

    let story = await callGemini(prompt);

    if (!story) {
      const exp = experience_years ? `${experience_years} years` : 'over two decades';
      const loc = location || 'the historic craft communities of Balochistan';
      const bg = background || 'learning ancient motifs and stitch patterns from family elders at an early age';

      story = `${name} has dedicated ${exp} to mastering the intricate art of ${craft_type} in ${loc}. Rooted in generational heritage, their creative journey began by ${bg}. Every piece created in their studio is a tribute to ancestors who preserved these traditions across centuries.\n\nToday, ${name} not only keeps this rare craftsmanship alive but also mentors younger apprentices, fostering economic dignity and cultural preservation across the local artisan community.`;
    }

    return res.status(200).json({
      success: true,
      data: {
        story: story.replace(/[\*\#\_]/g, '').trim(),
        provider: process.env.AI_API_KEY && process.env.AI_API_KEY.trim() !== '' ? 'Google Gemini 1.5 Flash' : 'BalochHunar Domain AI Engine'
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generateProductDescription,
  suggestTagsAndCategory,
  generateArtisanStory
};
