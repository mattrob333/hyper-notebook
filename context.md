We are building the **Hyper-Interactive Notebook**, a next-generation **AI-native workspace** that unifies research, analysis, and workflow execution into a single, cohesive platform. This project is a deliberate "Frankenstein" assembly, integrating powerful, specialized AI technologies into a cohesive platform.

Below is the technical specification and context for the tools we have integrated so far, including the specific URLs for Claude Code to reference.

---

# Source File for Claude Code: Hyper-Interactive Notebook Handoff

## 1. Project Overview and Current Status

The core mission is to transform the user experience from passive information consumption into active, agent-driven creation. The architecture is designed for a **decoupled, message-passing paradigm**, where the frontend is the presentation layer, A2UI is the communication contract, and Hyperbrowser is the scalable execution engine.

### Status (What has been done so far):
The project is focused on establishing the foundational architecture (Phase 1 and 2). This includes cloning the `hyperbooklm` frontend repository and beginning the integration of the A2UI client renderer and the Hyperbrowser SDK into the backend API routes,.

## 2. Context for the "Frankenstein" Components

This system is built upon three core technological pillars, each chosen for its specific strategic role:

### Pillar 1: Interface Foundation (`hyperbooklm`)

| Role | Details |
| :--- | :--- |
| **Foundation** | Serves as the foundational, Next.js/React frontend and the main user interface,. |
| **Structure** | Provides the multi-panel layout: **Sources Panel** (left), **Chat Panel** (center), and **Studio Panel** (right),. |
| **Tech Stack** | Built with Next.js 15 (App Router), React 19, Tailwind CSS, and uses the Hyperbrowser SDK for web scraping. |
| **Goal** | To transform the Chat Panel into a dynamic, generative UI surface via A2UI integration. |

### Pillar 2: Interactive UI Generation (A2UI)

| Role | Details |
| :--- | :--- |
| **Protocol** | **A Protocol for Agent-Driven Interfaces** that allows agents to generate rich, interactive UIs across platforms without executing arbitrary code,. |
| **Security** | Solves the problem of **how AI agents can safely send rich UIs across trust boundaries**. It uses a **declarative data format, not executable code**, ensuring agents only use pre-approved components from the client's catalog,. |
| **Mechanism** | Agents send a **declarative JSON format** describing the *intent* of the UI. The client application renders this using its own native widgets (React, Flutter, etc.), making it **framework-agnostic**,,. |
| **Status** | A2UI is currently in **v0.8 (Public Preview)** and is Apache 2.0 licensed,,. |

### Pillar 3: Agentic Web Automation (Hyperbrowser)

| Role | Details |
| :--- | :--- |
| **Execution Layer** | Provides the "hands" for the system's backend agents to interact with the web,. |
| **Capabilities** | Provides **fast, reliable cloud browsers** for AI automation, enabling large-scale web scraping, data extraction, and seamless session management,. |
| **Mechanism** | Integrated as an SDK-driven service, accessed via a stateful API, abstracting away the infrastructure complexity of managing browser instances. |
| **Future Use** | Critical for features like the **"Live UI" Browser Agent**, combining live session management with A2UI's real-time rendering. |

## 3. Key Reference URLs for Documentation

Please refer to the following URLs to gather important information on the components and their specifications:

### A2UI (Agent-to-User Interface)

| Resource | Description | URL |
| :--- | :--- | :--- |
| **A2UI Documentation Home** | Main site for specifications, concepts, and developer guides. | `https://a2ui.org` |
| **GitHub Repository** | Source code, technical overview, and status (v0.8 Public Preview),. | `https://github.com/google/A2UI` |
| **A2UI Specification** | Reference for the declarative JSON data format and message types,. | `https://a2ui.org/specificationspecification` |
| **How It Works / Data Flow** | Overview of the 6-step message streaming and rendering process,. | `https://a2ui.org/how-it-works` |

### hyperbooklm (Interface Foundation)

| Resource | Description | URL |
| :--- | :--- | :--- |
| **GitHub Repository** | Source code for the Next.js 15, React 19 frontend,. | `https://github.com/hyperbrowserai/hyperbooklm` |
| **Features Overview** | Details the existing multi-source ingestion (URLs, PDFs) and AI features (Mindmaps, Slides). | `https://github.com/hyperbrowserai/hyperbooklm#features` |

### Hyperbrowser (Automation Engine)

| Resource | Description | URL |
| :--- | :--- | :--- |
| **Hyperbrowser Homepage** | Overview of cloud browser sessions, web scraping, and AI agent capabilities. | `https://hyperbrowser.ai` |
| **SDKs** | Reference for Python and Node SDKs for integration. | `https://hyperbrowser.ai/sdks` |

### Agent Engineering Discipline

| Resource | Description |
| :--- | :--- |
| **Agent Engineering Discipline** | Context on the iterative process (**build, test, ship, observe, refine, repeat**) required to make LLM systems reliable in production,,. This systematic work of iteration is central to our refinement phase,. |