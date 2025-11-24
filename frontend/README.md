# Frontend

Modern React application built with:

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **TanStack Router** - File-based routing
- **TanStack Query** - Data fetching and caching
- **TanStack Table** - Powerful table component
- **Zustand** - State management
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Axios** - HTTP client
- **date-fns** - Date utilities
- **Vitest** - Testing framework
- **Biome** - Linting and formatting

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Test

```bash
npm run test
```

### Lint & Format

```bash
npm run lint        # Check for issues
npm run lint:fix    # Fix issues automatically
npm run format      # Format code
```

## Adding shadcn/ui Components

```bash
npx shadcn@latest add button
npx shadcn@latest add card
# etc...
```

## Project Structure

```
src/
├── api/           # API client and endpoints
├── components/    # React components
│   └── ui/        # shadcn/ui components
├── hooks/         # Custom React hooks
├── lib/           # Utility functions
├── routes/        # TanStack Router file-based routes
├── stores/        # Zustand stores
└── main.tsx       # Application entry point
```

## Environment Variables

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```
