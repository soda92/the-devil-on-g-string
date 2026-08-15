# Introduction

Welcome to the technical documentation for the **G-Senjou no Maou (The Devil on G-String)** Web Visual Novel Engine.

This project is a modern, high-performance web runtime for Akabei Soft2's classic visual novel *G-Senjou no Maou*. Built with **React 19**, **TypeScript**, and **Vite**, it delivers a full-fidelity desktop and mobile reading experience in modern web browsers without requiring native Windows emulators or plugins.

---

## 🎯 Key Goals & Features

- **Full KiriKiri (KAG) Script Fidelity**: Parses and interprets original KAG bytecode, conditions, and labels.
- **Bilingual Experience**: Instant on-the-fly toggling between Japanese and English translations with specialized tokenizers (word-by-word for English, char-by-char for Japanese).
- **Physical Book Reading Features**: 
  - Interactive **Table of Contents** for instant topic and scene jumping.
  - Interactive **Page Flipper / Timeline Scrubber** with live text previews and choice markers.
- **Modern Rendering Modes**:
  - **AVG Mode**: Classic lower-third dialogue box with character nameplates and face icons.
  - **NVL (Novel) Mode**: Full-screen semi-transparent backdrop for immersive novel-reading sections.
  - **Subtitle / Immersive Mode**: Clean floating subtitles with zero obstructive UI overlays.
- **Backlog Time-Travel**: Full dialogue history log with instant keyword search and the ability to jump back in time to any previous dialogue point without corrupting game variables.
- **Route Choice Flowchart**: Live visual heroine route status meters (Tsubaki, Kanon, Mizuha, Haru) and decision tree backtracking.
- **BGM & Sound Isolation**: Multi-channel audio manager handling BGM, sound effects (SE), and voice clips with smart mute isolation and background auto-pause.
- **Cloud & Multi-Profile Persistence**: Multi-user profiles with 24 save slots per profile, automated checkpointing, and REST backend synchronization.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Language & Typing** | TypeScript 5.9+, Strict Types, Vite Client Environment |
| **UI Framework** | React 19 (Hooks, StrictMode, React DOM) |
| **Styling** | Vanilla Modern CSS3, CSS Variables, Glassmorphism, Backdrop Filters |
| **Bundler & Dev Server** | Vite 8, Rolldown / ESBuild |
| **Audio Engine** | Web Audio API / HTML5 Audio Singleton Channels |
| **Quality Assurance** | Vitest 4, Testing Library, TypeScript ESLint |

---

## 🧭 Navigating this Documentation

- **Architecture & Design**: Learn how the visual novel bytecode is structured and how the state machine coordinates rendering.
- **Core Engine Mechanics**: Deep dive into the instruction runner, typewriter, and pre-scanner.
- **State & Variables**: Understand `f`, `sf`, and `tf` variable scopes and expression evaluation.
- **Media & Persistence**: Audio subsystem, sprite compositing, and save management.
- **Developer Guide**: How to test, debug, build, and deploy the application.
