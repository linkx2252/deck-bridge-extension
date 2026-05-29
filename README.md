# Deck Bridge

A Chrome extension that sends decks from [Piltover Archive](https://piltoverarchive.com) to [TCG-Arena](https://tcg-arena.fr) in one click.

## How it works

1. Browse to any deck on Piltover Archive
2. Click the **Send to TCG-Arena** button next to the deck options
3. The extension exports the deck, imports it into TCG-Arena, and redirects you to Play

## Installation

1. Download this repo: click **Code > Download ZIP** and unzip it
2. Open Chrome and go to chrome://extensions
3. Enable **Developer mode** (toggle top right)
4. Click **Load unpacked** and select the unzipped folder

## Usage

Navigate to any deck on Piltover Archive and click **Send to TCG-Arena**. The extension handles everything:

- Exports the deck as a text list
- Opens TCG-Arena and finds a matching deck by name, or creates a new one
- Imports, saves if needed, and redirects to Play

## Notes

- Deck matching is by name: same name = update existing, new name = create new
- If the deck is already identical, the Save step is skipped automatically