# Embedded Map File Analyzer

A professional full-stack application for parsing and visualizing embedded system map files (.map). This tool extracts memory configuration and section information from linker map files and presents them in an intuitive dashboard with interactive charts, tables, and summaries.

## ✨ Features

### 🎨 Modern Dashboard UI
- **Purple-themed Interface** - Professional grape/purple color scheme with Mantine UI
- **Light/Dark Mode** - Toggle between light and dark themes
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Tabbed Layout** - Organized Summary, Sections, and Visualization tabs

### 📊 Data Visualization
- **Memory Summary Cards** - Flash and RAM usage with ring progress indicators
- **Interactive Tables** - Sortable sections table with search functionality
- **Bar Charts** - Visual comparison of top 10 sections by size
- **Pie Charts** - Memory distribution visualization
- **Percentage Calculations** - Automatic calculation of memory usage percentages

### 🚀 Advanced Features
- **Mock Data Mode** - Toggle to use sample data for testing and demos
- **File Upload** - Mantine FileButton for seamless .map file uploads
- **Loading States** - Visual feedback during file processing
- **Error Handling** - User-friendly error messages
- **Type-Safe** - Full TypeScript implementation

### 🧩 Modular Architecture
- **FileUploader Component** - Handles file selection and upload
- **MemorySummary Component** - Displays Flash/RAM usage cards
- **SectionsTable Component** - Interactive, sortable sections table
- **MemoryChart Component** - Bar and pie chart visualizations

## Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Mantine UI v7** - Comprehensive component library
- **Recharts** - Powerful charting library
- **Tabler Icons** - Beautiful icon set

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **Multer** - File upload middleware
- **CORS** - Cross-origin resource sharing
- **Modular Parser** - Separated parsing logic in `parser/parseMapFile.js`

## Project Structure

```
embedded-map-file-analyzer/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUploader.tsx      # File upload component
│   │   │   ├── MemorySummary.tsx     # Memory cards component
│   │   │   ├── SectionsTable.tsx     # Sections table component
│   │   │   └── MemoryChart.tsx       # Chart visualizations
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript interfaces
│   │   ├── data/
│   │   │   └── mockData.ts           # Sample/mock data
│   │   ├── App.tsx                   # Main app with tabs
│   │   └── main.tsx
│   └── package.json
├── backend/
│   ├── parser/
│   │   └── parseMapFile.js           # Map file parsing logic
│   ├── server.js                     # Express server
│   └── package.json
├── package.json                      # Root scripts
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation

1. Clone or navigate to the project directory:
```bash
cd embedded-map-file-analyzer
```

2. Install all dependencies (root, frontend, and backend):
```bash
npm run install:all
```

Alternatively, install dependencies manually:
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## Running the Application

### Development Mode (Recommended)

Run both frontend and backend concurrently:
```bash
npm run dev
```

This will start:
- **Backend server** on `http://localhost:5000`
- **Frontend dev server** on `http://localhost:5173`

### Running Separately

If you prefer to run them separately:

**Backend:**
```bash
npm run dev:backend
```

**Frontend:**
```bash
npm run dev:frontend
```

## Usage Guide

### Using the Application

1. **Open the app** - Navigate to `http://localhost:5173`

2. **View Mock Data** - The app loads with sample data by default
   - Toggle "Use Mock Data" switch to disable mock mode

3. **Upload a .map file**:
   - Click "Select File" button
   - Choose your `.map` file
   - Click "Analyze" to process

4. **Explore the Dashboard**:
   - **Summary Tab**:
     - Flash memory usage with ring progress
     - RAM usage with ring progress
     - Available memory calculations

   - **Sections Tab**:
     - Searchable table of all sections
     - Click column headers to sort
     - View size in bytes and percentages

   - **Visualization Tab**:
     - Bar Chart: Top 10 sections comparison
     - Pie Chart: Memory distribution

5. **Toggle Theme** - Use sun/moon icon to switch between light/dark mode

### Component Features

#### FileUploader
- File selection with Mantine FileButton
- Display selected filename
- Loading indicator during analysis
- Error alerts for failed uploads

#### MemorySummary
- Flash and RAM usage cards
- Ring progress indicators
- Used, total, and available memory
- Automatic byte formatting (KB/MB/GB)

#### SectionsTable
- Search functionality
- Sortable columns (name, size)
- Percentage of total calculations
- Scrollable for large datasets
- Shows filtered count

#### MemoryChart
- Tabbed chart interface
- Bar chart with rotated labels
- Pie chart with percentages
- Responsive sizing

## API Endpoint

### POST /analyze

Accepts a `.map` file upload and returns parsed data.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Form data with `mapFile` field containing the .map file

**Response:**
```json
{
  "memory": {
    "FLASH": {
      "origin": "0x08000000",
      "length": "0x00100000",
      "lengthBytes": 1048576
    },
    "RAM": {
      "origin": "0x20000000",
      "length": "0x00030000",
      "lengthBytes": 196608
    }
  },
  "sections": [
    {
      "name": ".text",
      "size": 458752
    },
    {
      "name": ".rodata",
      "size": 122880
    }
  ]
}
```

## Map File Format

The parser expects standard embedded linker map files with:

### Memory Configuration Section
Defines memory regions with origins and lengths:
```
Memory Configuration

Name             Origin             Length             Attributes
FLASH            0x0000000008000000 0x0000000000100000 xr
RAM              0x0000000020000000 0x0000000000030000 xrw
```

### Linker Script and Memory Map Section
Lists sections with addresses and sizes:
```
Linker script and memory map

.text           0x0000000008000000     0x8a94
.rodata         0x0000000008008a94     0x1e000
.data           0x0000000020000000     0x2000
```

## Development

### TypeScript Types

The project uses TypeScript interfaces defined in [frontend/src/types/index.ts](frontend/src/types/index.ts):

- `MemoryRegion` - Memory region information
- `Section` - Section name and size
- `AnalysisResult` - Complete analysis response
- `MemorySummary` - Calculated memory statistics

### Mock Data

Development mock data is available in [frontend/src/data/mockData.ts](frontend/src/data/mockData.ts). Toggle the "Use Mock Data" switch to test the UI without uploading files.

### Backend Parser

The map file parsing logic is modular and located in [backend/parser/parseMapFile.js](backend/parser/parseMapFile.js). It can be easily extended to support additional map file formats.

## Customization

### Theme Colors

The purple theme can be customized in [frontend/src/App.tsx](frontend/src/App.tsx):

```typescript
const theme = createTheme({
  primaryColor: 'grape',
  colors: {
    grape: [/* custom color shades */],
  },
});
```

### Chart Colors

Bar and pie chart colors are defined in the respective components and can be customized using the `COLORS` array.

## Troubleshooting

### Port Already in Use
If ports 5000 or 5173 are in use, you can change them:
- Backend: Edit `PORT` in [backend/server.js](backend/server.js)
- Frontend: Add `--port 3000` to vite command in [frontend/package.json](frontend/package.json)

### CORS Errors
Ensure the backend CORS is configured to allow your frontend origin. The default configuration allows all origins for development.

### File Upload Issues
- Check that the file has a `.map` extension
- Ensure the map file follows the expected format
- Check browser console and backend logs for detailed errors

## License

ISC

---

**Built with ❤️ using React, TypeScript, Mantine, and Express**
