import { GoogleGenAI } from "@google/genai";
import { PrdStructure } from '../types';

const API_KEY = process.env.API_KEY || '';

if (!API_KEY) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateCodeSnippet = async (prd: PrdStructure): Promise<string> => {
    const prompt = `
    You are an expert Frontend & 3D Motion Engineer.
    Generate a single, standalone HTML file for "${prd.projectName}".
    
    THE "REMOTION" 3D DIRECTIVE:
    Treat this web page like a cinematic video composition (Remotion style).
    1. 3D SCENE: Use Three.js (CDN: https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.min.js) to create a high-fidelity 3D environment.
       - Implement a "Camera Path": As the user scrolls or on entry, move the Three.js camera through the 3D space.
       - Include 3D geometric objects or a particle system that reacts dynamically.
    2. GSAP STAGING: Use GSAP (CDN: https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js) and ScrollTrigger (CDN: https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js) for time-based reveals.
       - Every text block should have a staged entry (stagger, scale, blur-to-focus).
       - Create a "Video-like" feel where elements enter and exit based on scroll position.
    3. UI/UX: ${prd.uiUxDirection || 'Dark, high-contrast, premium aesthetic.'}
    4. TECH: Strictly use Tailwind CSS (CDN: https://cdn.tailwindcss.com) for responsive layout.
    5. THEME: ${prd.colorPalette.join(', ')}.
    
    PRD CONTEXT:
    Name: ${prd.projectName}
    Summary: ${prd.summary}
    Features: ${prd.features.join(', ')}
    Roadmap: ${prd.roadmap?.join(' -> ') || 'Initial launch'}
    Market Analysis: ${prd.marketAnalysis || 'N/A'}
    
    Return ONLY the raw HTML code. Do NOT wrap it in markdown code blocks.
    The code must be production-ready and visually STUNNING.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt
        });
        
        let text = response.text || "";
        // Clean up common wrapper formats if the model ignores the "no markdown" rule
        text = text.replace(/```html/g, '').replace(/```/g, '');
        return text.trim();
    } catch (e) {
        console.error("Code Gen Error", e);
        return "<!-- Error generating 3D preview code. -->";
    }
}