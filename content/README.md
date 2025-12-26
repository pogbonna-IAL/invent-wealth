# Content Directory

This directory contains editable marketing content in JSON format. All content files are loaded at runtime and can be edited without modifying code.

## Available Content Files

- **home.json** - Homepage content (hero, features, how it works, CTA)
- **about.json** - About page content (mission, values, what we do)
- **faq.json** - FAQ questions organized by category

## Editing Content

1. Open the JSON file you want to edit
2. Modify the content while maintaining valid JSON syntax
3. Save the file
4. Restart the development server to see changes (content is cached)

## Content Structure

Each content file follows a specific structure. Refer to the TypeScript types in `lib/content.ts` for the expected format.

## Adding New Content Files

1. Create a new JSON file in this directory
2. Add TypeScript types in `lib/content.ts`
3. Use `getContent<YourType>("filename")` in your page/component

