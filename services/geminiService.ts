import { GoogleGenAI } from "@google/genai";
import { PrdStructure } from '../types';

const API_KEY = process.env.API_KEY || '';

if (!API_KEY) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// We keep this service for the heavy lifting of generating the actual code
// once the "Live" session has determined the PRD.
export const generateCodeSnippet = async (prd: PrdStructure): Promise<string> => {
    const prompt = `
    You are an expert Frontend Engineer.
    Generate a single, standalone HTML file containing a responsive landing page or dashboard for this app.
    
    CRITICAL LAYOUT RULES:
    1. Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
    2. MOBILE FIRST: The design must be fully responsive. 
       - Use 'flex-col' on mobile and 'md:flex-row' for desktop layouts.
       - Inputs and buttons should be 'w-full' on mobile.
    3. SPACING & GAPS: 
       - Use ample padding (p-4, p-6).
       - ALWAYS use 'gap-4' or 'gap-6' for Flexbox and Grid containers. 
       - DO NOT rely on margins between neighbors. 
       - Ensure buttons have 'min-h-[48px]' for touch targets.
       - PREVENT OVERLAP: If creating a grid (like a calculator or gallery), use 'grid gap-4' to strictly separate elements.
    4. SCROLLING: The body must be scrollable. Do not use 'overflow-hidden' on the body or main container unless it's a specific full-screen tool.
    5. COLOR: Strictly follow the Color Palette from the PRD.
    6. VIBE: Make it look modern, high-quality, and "App-like" with rounded corners (rounded-xl).
    7. ICONS: Use Font Awesome via CDN (<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">).
    
    PRD Project Name: ${prd.projectName}
    PRD Summary: ${prd.summary}
    PRD Features: ${prd.features.join(', ')}
    PRD Colors: ${prd.colorPalette.join(', ')}
    
    Return ONLY the raw HTML code. Do NOT wrap it in markdown code blocks.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // High intelligence model for code
            contents: prompt
        });
        
        let text = response.text || "";
        text = text.replace(/```html/g, '').replace(/```/g, '');
        return text;
    } catch (e) {
        console.error("Code Gen Error", e);
        return "<!-- Error generating preview code. -->";
    }
}