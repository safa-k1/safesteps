# SafeSteps

SafeSteps is a web app designed to help students navigate safely on campus. Users can mark unsafe areas, like dark spots, dangerous traffic zones, or harassment-prone areas, and the app calculates the safest walking route in real time.

---

## Features

- **Dynamic Safety Markers:** Add color-coded circle markers for:
  - Dark areas (blue)
  - Dangerous traffic (orange)
  - Harassment (red)
- **Route Calculation:** Calculates the **safest route (green)** and an **alternate route (yellow)**
- **Interactive Map Panel:** Enter your current location and destination for real-time routing
- **Responsive UI:** Works on desktop browsers, easy-to-use interface

---

## Tech Stack

- Next.js  
- React  
- Leaflet  
- OpenRouteService API

---

## Getting Started

### Prerequisites

- Node.js installed
- OpenRouteService API key (for route calculation)

### Install & Run

```bash
npm install --legacy-peer-deps
npm run dev
