# Summary

[Introduction](introduction.md)

# Architecture & Design
- [Architectural Overview](architecture/overview.md)
- [KAG Bytecode & Scenario Format](architecture/kag-bytecode.md)
- [State Machine & React Hook Architecture](architecture/state-machine.md)

# Core Engine Mechanics
- [Instruction Runner Loop](engine-mechanics/instruction-runner.md)
- [Bilingual Typewriter & Tokenization](engine-mechanics/typewriter-tokenization.md)
- [Dialogue Modes (AVG, Novel, Subtitle)](engine-mechanics/dialogue-modes.md)
- [Pre-Scanner & Deep-Link State Reconstruction](engine-mechanics/deep-linking-prescan.md)

# State & Variables
- [Variables System (f, sf, tf)](state-and-variables/variables-system.md)
- [Expression Evaluation & Sandboxing](state-and-variables/expression-evaluation.md)

# Media & Presentation
- [Audio Subsystem & Channel Isolation](media-systems/audio-channels.md)
- [Sprite Layering & Composite Face Overlay](media-systems/sprite-compositing.md)

# Persistence & Flow
- [Save / Load & Multi-User Persistence](save-and-history/save-load-persistence.md)
- [Backlog History, Search & Rewind](save-and-history/history-backlog.md)
- [Choice Graph & Route Affection Status](save-and-history/choice-graph.md)

# Book Reading Experience
- [Table of Contents & Scene Indexing](reading-features/table-of-contents.md)
- [Page Flipper & Timeline Scrubbing](reading-features/page-flipper.md)
- [CG Gallery & Scene Replay Mode](reading-features/scene-gallery-and-replay.md)

# Developer & QA Guide
- [Engine Debugger & Diagnostics](dev-guide/debug-panel.md)
- [Unit & Integration Testing](dev-guide/testing.md)
- [Build & Deployment Pipeline](dev-guide/building.md)
