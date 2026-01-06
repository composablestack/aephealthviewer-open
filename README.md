# AEP Health Viewer

*Adobe Experience Platform Monitoring and Analysis System*

[![GitHub](https://img.shields.io/badge/GitHub-composablestack%2Faephealthviewer-blue?style=for-the-badge&logo=github)](https://github.com/composablestack/aephealthviewer-open)
[![Code Wiki](https://img.shields.io/badge/Code%20Wiki-Evolution%20Documentation-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://codewiki.google/github.com/composablestack/aephealthviewer-open)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

## Overview

The AEP Health Viewer is a monitoring system for Adobe Experience Platform (AEP) that provides real-time operational insights through direct API access. This open source version is designed for local deployment and provides core monitoring capabilities for understanding your AEP environment.

> **Note**: This open source version provides basic monitoring through direct AEP API access. For advanced analytics, historical trend analysis, anomaly detection, database-backed insights, and enterprise support, [checkout ComposableStack.ai](https://composablestack.ai) and reach out to [info@composablestack.ai](mailto:info@composablestack.ai) to discuss tailored solutions for your organization.

## 📖 Documentation & Code Evolution

Explore the **[Google Code Wiki](https://codewiki.google/github.com/composablestack/aephealthviewer-open)** to understand how this codebase evolved over time. The Code Wiki provides:

- **Development Timeline**: See the complete evolution of features and architectural decisions
- **Code Changes**: Track how the codebase transformed from initial concept to production
- **AI-Guided Development**: Learn how AI assistance accelerated the development process
- **Best Practices**: Understand the patterns and principles applied throughout development
- **Decision Rationale**: Discover why specific technical choices were made

The Code Wiki serves as a living documentation of this project's journey, offering insights into modern AI-assisted development workflows and composable architecture patterns.

## Key Capabilities (Open Source Version)

### 🔍 **Real-Time API Monitoring**
- Live AEP API connection status with health indicators
- Direct API access to AEP services
- Environment configuration management
- Connection testing and validation

### 📊 **Current State Visibility**
- View active segment jobs and their current status
- Monitor destination activation flows
- Browse catalog datasets and schemas
- Query service dataset inspection

### 🔄 **Basic Flow Monitoring**
- Source connection status checks
- Destination activation monitoring
- Flow execution visibility
- Current state of data flows

> **Advanced Capabilities Available**: Historical analytics, anomaly detection, trend analysis, predictive insights, and automated monitoring require database integration and are available through ComposableStack.ai's enterprise offerings. [Contact us](mailto:info@composablestack.ai) to learn more.

## Architecture

### Open Source - Direct API Access
- **Profile & Event Access**: Direct profile and event querying via AEP API
- **Sources Management**: Connection status and flow monitoring
- **Destinations**: Activation status and delivery checks
- **Catalog & Datasets**: Data discovery and schema browsing
- **Flow Service**: Current state monitoring of data flows
- **Segmentation**: View segment definitions and current job status

### Enterprise - Advanced Intelligence (Contact [ComposableStack.ai](mailto:info@composablestack.ai))
- **Historical Analysis**: Database-backed trend analysis and performance tracking
- **Anomaly Detection**: Automated identification of performance deviations
- **Predictive Analytics**: Expected completion times and capacity planning
- **Export Intelligence**: Job correlation and cross-system tracking
- **Operational Monitoring**: Performance optimization and resource planning
- **Automated Insights**: Pattern recognition and recommendations

## Technology Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes with Adobe Experience Platform integration
- **Authentication**: Adobe IMS OAuth integration
- **Monitoring**: Real-time health checks and status indicators
- **API Client**: Direct AEP REST API integration

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Adobe Experience Platform credentials (API key, client ID, client secret)

### Installation

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Configuring Access to Your IMS Organization

This application uses **client-side configuration** stored securely in your browser using [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API). All credentials remain on your local machine and are never transmitted to or stored on any remote server.

#### Initial Setup

When you first launch the application at [http://localhost:3000](http://localhost:3000), you'll be prompted to configure your Adobe Experience Platform environment through the browser interface. You'll need:

- **Client ID**: Your Adobe API client identifier
- **Organization ID**: Your IMS Org ID (format: `your-org-id@AdobeOrg`)
- **Sandbox Name**: The AEP sandbox name (e.g., `prod`, `dev`)
- **Access Token**: A valid Adobe IMS access token
- *OPTIONAL* **Client Secret**: Your Adobe API client secret. *Exercise caution handling this key based on your Organization's Security Policies*

#### Recommended: Using Pre-Generated Access Tokens

For enhanced security, we recommend using **pre-generated access tokens** that expire rather than storing long-lived client secrets. Benefits include:

- **Limited exposure window**: Tokens expire automatically (typically 24 hours)
- **Reduced risk**: Compromised tokens have limited lifespan
- **Audit trail**: Token generation is logged in Adobe systems
- **Revocable**: Tokens can be invalidated without changing client credentials

**Generate an access token:**
1. Visit the [Adobe Experience Platform API Authentication Tutorial](https://experienceleague.adobe.com/en/docs/platform-learn/tutorials/api/generate-an-access-token)
2. Follow the Postman or curl-based token generation process
3. Copy the generated access token
4. Paste it into the application's configuration panel
5. Regenerate tokens before expiration (recommended: daily)

#### Security Best Practices

- **Never commit credentials** to version control (`.env.local` is git-ignored)
- **Use separate credentials** for development and production environments
- **Rotate tokens regularly**: Generate fresh access tokens daily or before expiration
- **Limit API permissions**: Ensure your Adobe API project has only necessary permissions
- **Review browser storage**: IndexedDB data persists across sessions; clear it when no longer needed
- **Use HTTPS in production**: Protect credentials in transit when deploying

#### Local Development (Optional)

For convenience during local development, you may optionally set environment variables in a `.env.local` file. However, **browser-based configuration is the primary method**:

```env
# Optional: Default values for development
AEP_CLIENT_ID=your-client-id
AEP_CLIENT_SECRET=your-client-secret
AEP_ORG_ID=your-org-id@AdobeOrg
AEP_SANDBOX=prod
```

**Note**: Environment variables are only used as fallback defaults. The application primarily relies on browser-stored configurations entered through the UI.

### Development

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build

```bash
npm run build
npm start
```

## Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/composablestack/aephealthviewer-open)

## Features

### Navigation & Configuration
- Unified navigation with active tab highlighting
- Live connection status with configuration management
- Environment variable management with connection testing
- IMS Org ID and sandbox display with health indicators

### Monitoring Pages
- **Dashboard**: System overview and connection status
- **Ingestion**: Source connection and data flow status
- **Segmentation**: Current segment jobs and definitions
- **Destinations**: Activation monitoring and status checks
- **Query Service**: Dataset browsing and inspection

## How It Works

The open source AEP Health Viewer provides a web interface for direct API access to Adobe Experience Platform:

1. **Configuration**: Set up your AEP credentials in environment variables
2. **Connection**: Establish authenticated connection to AEP APIs
3. **Monitoring**: View current state of sources, destinations, segments, and datasets
4. **Inspection**: Drill into details of specific resources and their current status

This tool is designed for teams who need visibility into their AEP environment for troubleshooting, validation, and operational monitoring.

### Need More?

For teams requiring historical analysis, automated monitoring, anomaly detection, and predictive insights, [contact ComposableStack.ai](mailto:info@composablestack.ai) to discuss enterprise capabilities including:
- Database-backed historical tracking and trend analysis
- Automated alerting and anomaly detection
- Performance optimization recommendations
- Cross-system data flow correlation
- Custom integrations and workflows

## Related Projects

- **aepp-ts** - TypeScript SDK for AEP: [composablestack/aepp-ts](https://github.com/composablestack/aepp-ts)
- **aepp-ts-premium** - Premium features: [composablestack/aepp-ts-premium](https://github.com/composablestack/aepp-ts-premium)
- **aepMonitoringAgent** - Monitoring agent: [composablestack/aepMonitoringAgent](https://github.com/composablestack/aepMonitoringAgent)
- **aepHealthTooling** - Documentation: [composablestack/aepHealthTooling](https://github.com/composablestack/aepHealthTooling)

## Support

### Community Support
- [GitHub Issues](https://github.com/composablestack/aephealthviewer/issues)
- [Documentation](https://github.com/composablestack/aepHealthTooling)

### Enterprise & Custom Development
For advanced monitoring capabilities, custom integrations, and professional services:
- **Website**: [composablestack.ai](https://composablestack.ai)
- **Contact**: Reach out to discuss custom development and enterprise support options

## License

MIT © ComposableStack.ai
