import { GoogleGenAI } from "@google/genai";
import { PrdStructure } from '../types';

const API_KEY = process.env.API_KEY || '';

if (!API_KEY) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateCodeSnippet = async (prd: PrdStructure): Promise<string> => {
    const prompt = `
    You are an expert Frontend & Motion Engineer. Your task is to build a high-end, production-ready prototype for "${prd.projectName}".

    CONTENT DIRECTIVE (STRICT):
    - The website/app content MUST be 100% about "${prd.projectName}" and its purpose: "${prd.summary}".
    - You MUST NOT mention "Remotion", "Cinematic Sequences", "Motion Graphics", "3D Engines", or any technical library names in the UI text.
    - Write copy as if this is a real, standalone product for customers. Do not explain how the app was built.

    VISUAL DIRECTIVE (AUTOMATIC CINEMATIC ENGINE):
    - Automatically use a 3D cinematic style for the UI.
    - VISUALS: Use Three.js (CDN: https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.min.js) for an immersive 3D background or interactive roadmap nodes.
    - INFOGRAPHICS: Represent ${prd.projectName}'s data or roadmap milestones as interactive 3D structures or high-end SVG infographics.
    - ANIMATION: Use GSAP (CDN: https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js) and ScrollTrigger (CDN: https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js) to create smooth, high-fidelity camera movements as the user scrolls.
    - STYLING: Tailwind CSS (CDN: https://cdn.tailwindcss.com). Theme: ${prd.colorPalette.join(', ')}. Use a dark, premium aesthetic.

    PROJECT CONTEXT:
    - App Name: ${prd.projectName}
    - Tagline: ${prd.tagline}
    - User Features: ${prd.features.join(', ')}
    - Data Roadmap: ${prd.roadmap?.join(' -> ')}
    - Market Context: ${prd.marketAnalysis}

    TECHNICAL REQUIREMENT:
    Return ONLY the raw HTML/JS/CSS code in a single standalone file. No markdown, no commentary. The app must feel like a premium, finished product focused solely on its mission.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt
        });
        
        let text = response.text || "";
        text = text.replace(/```html/g, '').replace(/```/g, '');
        return text.trim();
    } catch (e) {
        console.error("Code Gen Error", e);
        return "<!-- Forge failed to manifest the cinematic environment. Verify API key. -->";
    }
}