/**
 * Content loader utility
 * 
 * Loads and caches content from JSON files in the content/ directory.
 * This allows content to be edited without code changes.
 */

import fs from "fs";
import path from "path";

// Cache for loaded content
const contentCache = new Map<string, any>();

/**
 * Loads content from a JSON file in the content directory
 * @param filename - Name of the JSON file (without extension)
 * @returns Parsed JSON content
 */
export function getContent<T = any>(filename: string): T {
  // Check cache first
  if (contentCache.has(filename)) {
    return contentCache.get(filename) as T;
  }

  // Load from file system
  const contentPath = path.join(process.cwd(), "content", `${filename}.json`);

  try {
    const fileContents = fs.readFileSync(contentPath, "utf8");
    const content = JSON.parse(fileContents) as T;
    
    // Cache the content
    contentCache.set(filename, content);
    
    return content;
  } catch (error) {
    console.error(`Error loading content file ${filename}:`, error);
    throw new Error(`Failed to load content file: ${filename}`);
  }
}

/**
 * Clears the content cache (useful for development/hot reloading)
 */
export function clearContentCache(): void {
  contentCache.clear();
}

/**
 * Type definitions for content files
 */
export interface HomeContent {
  hero: {
    title: string;
    subtitle: string;
    description: string;
    cta: {
      primary: string;
      secondary: string;
    };
  };
  features: {
    title: string;
    items: Array<{
      title: string;
      description: string;
      content: string;
    }>;
  };
  howItWorks: {
    title: string;
    steps: Array<{
      number: number;
      title: string;
      description: string;
    }>;
  };
  cta: {
    title: string;
    description: string;
    button: string;
  };
}

export interface AboutContent {
  title: string;
  subtitle: string;
  mission: {
    title: string;
    content: string[];
  };
  whatWeDo: {
    title: string;
    content: string[];
  };
  values: {
    title: string;
    items: Array<{
      title: string;
      description: string;
    }>;
  };
}

export interface FAQContent {
  categories: Array<{
    name: string;
    questions: Array<{
      q: string;
      a: string;
    }>;
  }>;
}

