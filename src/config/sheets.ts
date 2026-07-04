// Map each sector to its Google Sheets published-as-CSV URL.
// To get the URL:
//   1. Open your Google Sheet
//   2. File → Share → Publish to web
//   3. Choose the tab (e.g. "Banks"), choose CSV format, click Publish
//   4. Copy the URL and paste it here
//
// Leave a value as '' to disable sheet fetching for that sector
// (the app will fall back to any data hardcoded in the .md frontmatter).

export const SECTOR_SHEETS: Record<string, string> = {
  Banking:
    'https://docs.google.com/spreadsheets/d/1OjcVARV3IWMkxHY9Ih9Yl7ARf5eezq8bIkKIix9m-EU/export?format=csv&sheet=Bank',
  Coal: 'https://docs.google.com/spreadsheets/d/1OjcVARV3IWMkxHY9Ih9Yl7ARf5eezq8bIkKIix9m-EU/export?format=csv&gid=118175068',
  Telco: '',
  Consumer: '',
}