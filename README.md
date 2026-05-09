# 🚀 3D Portfolio Website

An immersive, interactive portfolio built with modern web technologies, featuring scroll-driven animations, 3D environments, and dynamic user experiences.

## 🌐 Live Demo
[https://pratyaksha-11.vercel.app/]

## 🧠 Overview

This project is a **3D interactive portfolio** that transforms traditional web navigation into an engaging, spatial experience. Users explore different sections (Work, Projects, Literature, Ventures) through animated portals and scroll-based storytelling.

The core concept is inspired by a **"museum of portals"**, where each section acts as an entry point into a unique interactive environment.

## 🛠 Tech Stack

- **Framework:** Next.js 15  
- **UI Library:** React 19  
- **3D Rendering:** Three.js + React Three Fiber  
- **Animation:** GSAP  
- **Styling:** Tailwind CSS (with Vanilla CSS modules for complex animations)  
- **State Management:** Zustand  
- **Type Safety:** TypeScript  

## 🎯 Key Features

### ✨ 1. Portal-Based Navigation
- **Grid-based Interactive Tiles:** Glassmorphic tiles that scale and reveal titles on hover  
- **Seamless Transitions:** Camera-driven navigation using GSAP and `MeshPortalMaterial`  
- **Immersive Entry/Exit:** Smooth zoom-in and reverse transitions between scenes  

### 🎬 2. Scroll-Driven Storytelling
- **GSAP-powered Animations:** Scroll-synced transitions and cinematic motion  
- **Performance Optimized:** IntersectionObserver + `useFrame` for smooth rendering  
- **Timeline Progress Tracking:** Visual indicators for user journey progression  

### 🧩 3. Interactive Sections

#### 🧑‍💼 Work & Education
- 3D vertical timeline with animated nodes  
- Scroll-based progression with glassmorphic cards  
- Custom scroll physics with resistance near key milestones  

#### 🧪 Other Ventures (Product Showcase)
- Interactive 3D cube showcasing premium products  
- Scroll-controlled rotation and transitions  
- HUD-style overlay with contextual information  

#### 📚 Literature
- Interactive 3D environment with animated elements  
- Clickable objects revealing poetic overlays  
- Cinematic parallax background responding to user input  

#### 🧠 Projects (My Journey)
- Interactive project showcase with smooth transitions  
- Atmospheric visual effects (particles, motion elements)  
- Structured presentation of technical work  

### 🖱 4. Adaptive Cursor System
A dynamic, context-aware cursor enhances immersion:

- **Work:** Rotating gear (scroll-reactive)  
- **Literature:** Magnifier for focused interaction  
- **Other Ventures:** Star/sparkle for premium feel  
- **Projects:** Particle-based motion cursor  

## 🧱 Project Structure

```bash
app/
 ├── components/
 │   ├── hero/              # Landing section
 │   ├── experience/        # Portal system (Work, Literature, Ventures)
 │   ├── common/            # Shared UI (Cursor, ScrollWrapper, Loader)
 │   ├── models/            # 3D assets and scenes
 │   └── footer/            # Footer
 │
 ├── stores/                # Zustand state management
 ├── constants/             # Static data/config
 ├── types/                 # TypeScript definitions
 │
 ├── layout.tsx             # Root layout & metadata
 ├── page.tsx               # Entry point
 └── globals.css            # Global styles

public/                     # Static assets (textures, fonts, models)