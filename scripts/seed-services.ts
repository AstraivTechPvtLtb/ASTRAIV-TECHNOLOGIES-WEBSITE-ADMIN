import 'dotenv/config';
import { db } from '../src/models/db';

const SERVICES_DATA = [
  {
    title: 'AI Solutions',
    slug: 'ai-solutions',
    category: 'Artificial Intelligence',
    shortDesc: 'Integration of Large Language Models, custom agents, and predictive analytics into your pipelines.',
    fullDesc: `### Cognitive Intelligence & Custom AI Systems

At Astraiv Technologies, we build next-generation Artificial Intelligence solutions that transform complex enterprise data into actionable automated workflows. Our AI engineering squad specializes in custom Large Language Model (LLM) fine-tuning, Retrieval-Augmented Generation (RAG) knowledge systems, autonomous agent swarms, and predictive machine learning models.

#### Key Capabilities & Architecture
- **Autonomous Agent Swarms**: Multi-agent task execution systems capable of reasoning, researching, and orchestrating complex business processes without human bottlenecks.
- **Enterprise RAG Systems**: High-precision vector database integrations (pgvector, Pinecone, Qdrant) delivering instant semantic search across millions of documents with strict data isolation and zero hallucinations.
- **Custom LLM Fine-Tuning & Quantization**: Domain-adapted open-source models (Llama 3, Mistral, DeepSeek) deployed on private secure clusters to ensure intellectual property and regulatory compliance.
- **Predictive Analytics & Forecasting**: Real-time telemetry processing, customer churn forecasting, demand prediction, and risk modeling pipelines.

#### Our Approach
We work alongside your engineering and product teams to assess data readiness, design secure API gateways, and deploy resilient AI pipelines with sub-second inference speeds and enterprise SLA guarantees.`,
    features: [
      'Custom LLM & Agent Swarms',
      'Enterprise RAG & Semantic Search',
      'Private Inference Clusters',
      'Predictive Telemetry & Analytics',
    ],
    badge: 'Popular',
    icon: 'Bot',
    active: true,
    orderIndex: 1,
  },
  {
    title: 'Web Applications',
    slug: 'web-applications',
    category: 'Engineering',
    shortDesc: 'Custom, scalable SaaS applications and dashboards designed for optimal workflow performance.',
    fullDesc: `### Enterprise SaaS Platforms & Reactive Web Applications

We engineer high-performance, mission-critical web applications designed for hyper-growth and extreme reliability. Combining modern React 19 / Next.js 16 architectures with strictly-typed backend microservices, our web apps deliver instantaneous response times, fluid micro-interactions, and intuitive user experiences.

#### Key Architecture Highlights
- **Sub-Second Performance**: Server-side rendering (SSR), streaming components, edge middleware, and zero-bundle-overhead client hydration.
- **Multi-Tenant SaaS Architecture**: Strict row-level security (RLS), automated tenant provisioning, role-based access control (RBAC), and SOC-2 compliant data segregation.
- **Real-Time Collaboration**: WebSocket integration, optimistic UI updates, and real-time state synchronization for seamless multiplayer experiences.
- **Hardened API Gateways**: REST, GraphQL, and tRPC endpoints with automated rate limiting, circuit breaking, and telemetry monitoring.`,
    features: [
      'Next.js 16 & React 19 Architecture',
      'Multi-Tenant SaaS Engine',
      'Real-Time WebSockets',
      'Strict Type Safety & Contracts',
    ],
    badge: 'Core',
    icon: 'Terminal',
    active: true,
    orderIndex: 2,
  },
  {
    title: 'Custom Software',
    slug: 'custom-software',
    category: 'Engineering',
    shortDesc: 'Bespoke, high-performance software engineered specifically for your core business operations.',
    fullDesc: `### Tailored Software Engineering for High-Stakes Operations

Off-the-shelf software often forces growing enterprises into rigid, inefficient workflows. Astraiv designs and builds bespoke software systems tailored precisely to your company's operational blueprint, data architecture, and commercial objectives.

#### What We Deliver
- **Bespoke Enterprise Systems**: Custom ERP, CRM, and order fulfillment systems built from the ground up to support unique proprietary logic.
- **Scalable Backend Engines**: Distributed systems built with Node.js, Go, or Python capable of processing millions of concurrent transactions.
- **API & Protocol Integration**: Seamless bridges between legacy databases, modern microservices, and external third-party partner APIs.
- **Long-Term Maintainability**: Clean architecture, domain-driven design (DDD), comprehensive test suites, and detailed architectural documentation.`,
    features: [
      'Domain-Driven Architecture',
      'High-Throughput Backends',
      'Legacy System Modernization',
      'Comprehensive Automated Testing',
    ],
    badge: 'Enterprise',
    icon: 'Cpu',
    active: true,
    orderIndex: 3,
  },
  {
    title: 'Cloud Solutions',
    slug: 'cloud-solutions',
    category: 'Infrastructure',
    shortDesc: 'Sleek, highly available AWS and Cloudflare R2 infrastructure designed for near-zero downtime.',
    fullDesc: `### Resilient Cloud Infrastructure & Edge Architectures

Modern digital applications require cloud architectures that scale automatically under load, prevent single points of failure, and maintain uncompromising data integrity. We architect and manage high-availability infrastructure across AWS, Google Cloud, and Cloudflare.

#### Infrastructure Capabilities
- **Serverless & Edge Computing**: Global edge networks routing requests to the nearest points of presence, minimizing latency and maximizing throughput.
- **Zero-Egress Asset Delivery**: Cost-effective storage architectures using Cloudflare R2 and S3-compatible CDNs to eliminate punitive bandwidth fees.
- **High-Availability PostgreSQL**: Multi-region read replicas, automated failover loops, connection pooling with PgBouncer, and point-in-time recovery.
- **Disaster Recovery & Redundancy**: Multi-zone deployment topologies with 99.99% uptime SLAs and automated health checks.`,
    features: [
      'AWS & Cloudflare Edge Setup',
      'Zero-Egress Media Buckets',
      'High-Availability Database Clusters',
      '99.99% Uptime SLA Topologies',
    ],
    badge: 'Cloud',
    icon: 'Cloud',
    active: true,
    orderIndex: 4,
  },
  {
    title: 'Website Development',
    slug: 'website-development',
    category: 'Design & Web',
    shortDesc: 'Premium, pixel-perfect, and highly optimized corporate websites utilizing the latest frameworks.',
    fullDesc: `### High-Converting Digital Storefronts & Corporate Websites

Your website is the single most important digital touchpoint for your brand. Astraiv crafts visually arresting, ultra-fast corporate websites that establish immediate market authority, captivate visitors, and drive commercial conversions.

#### Engineering & Design Standards
- **Pixel-Perfect Execution**: Precision typography, harmonious color systems, custom layout grids, and bespoke micro-interactions.
- **Extreme Speed & Core Web Vitals**: Perfect 95+ Lighthouse scores, sub-second First Contentful Paint (FCP), and optimized dynamic asset delivery.
- **Headless CMS Integration**: Empower marketing teams with intuitive content management while maintaining developer control over design fidelity.
- **Internationalization (i18n)**: Multi-language support with localized routing, RTL handling, and dynamic translation caching.`,
    features: [
      'Ultra-Fast Next.js Rendering',
      'Stripe-Level Aesthetics',
      'Headless CMS & Dynamic Content',
      'Comprehensive SEO & Core Web Vitals',
    ],
    badge: 'Featured',
    icon: 'Globe',
    active: true,
    orderIndex: 5,
  },
  {
    title: 'Mobile Apps',
    slug: 'mobile-apps',
    category: 'Mobile',
    shortDesc: 'Premium cross-platform iOS and Android applications designed with native performance.',
    fullDesc: `### Native-Grade Mobile Applications for iOS and Android

Deliver fluid, engaging mobile experiences directly to your users' fingertips. We engineer cross-platform and native mobile applications using React Native and Flutter, ensuring native 60fps animations, offline resilience, and seamless device hardware integrations.

#### Mobile Engineering Scope
- **Cross-Platform Velocity**: Single codebase deployment across App Store and Google Play with zero compromise on platform-native UI conventions.
- **Offline-First Synchronization**: Local SQLite / WatermelonDB storage with conflict-free replicated data types (CRDT) for continuous offline functionality.
- **Push Notification Engines**: Targeted, personalized push campaigns via Firebase Cloud Messaging (FCM) and Apple Push Notification Service (APNs).
- **Biometric & Secure Hardware**: FaceID, fingerprint authentication, keychain encryption, and secure on-device token storage.`,
    features: [
      'React Native & Flutter Development',
      'Offline-First Data Sync',
      'Biometric Security & Hardware APIs',
      'Automated App Store CI/CD',
    ],
    badge: 'Mobile',
    icon: 'Smartphone',
    active: true,
    orderIndex: 6,
  },
  {
    title: 'UI/UX Design',
    slug: 'ui-ux-design',
    category: 'Design',
    shortDesc: 'Modern, Stripe-like user interfaces designed with strict layout hierarchies and seamless micro-interactions.',
    fullDesc: `### World-Class Product Design, Design Systems & User Experience

Great software is defined by how effortless it feels to use. Our UI/UX design studio creates comprehensive digital design systems that blend refined aesthetics with rigorous human-computer interaction (HCI) principles.

#### Design System & UX Principles
- **Design Tokens & Component Systems**: Unified design languages in Figma with modular component libraries, color palettes, and typographic scales.
- **Micro-Interactions & Motion Design**: Subtle hover states, smooth page transitions, and tactile feedback using Framer Motion.
- **User Journey Optimization**: Wireframing, interactive prototyping, user testing loops, and friction-reducing onboarding flows.
- **WCAG 2.1 AA Accessibility**: High-contrast modes, keyboard navigation, screen reader compatibility, and inclusive layout hierarchies.`,
    features: [
      'Figma Design Systems & Tokens',
      'Tactile Micro-Interactions',
      'User Journey & Conversion UX',
      'WCAG Accessibility Compliance',
    ],
    badge: 'Creative',
    icon: 'Layers',
    active: true,
    orderIndex: 7,
  },
  {
    title: 'DevOps & CI/CD',
    slug: 'devops-ci-cd',
    category: 'Infrastructure',
    shortDesc: 'Zero-downtime deployment pipelines, automated tests, and Kubernetes container management.',
    fullDesc: `### Automated Delivery Pipelines & Infrastructure as Code

Accelerate your engineering release cadence while eliminating human error. We implement automated continuous integration and continuous deployment (CI/CD) pipelines, Docker container orchestration, and Infrastructure as Code (IaC) solutions.

#### DevOps Capabilities
- **Automated CI/CD Pipelines**: GitHub Actions, GitLab CI, and ArgoCD workflows executing unit tests, linting, security scanning, and preview builds automatically.
- **Container Orchestration**: Docker packaging, Kubernetes (EKS/GKE) clusters, and lightweight serverless container runtimes.
- **Infrastructure as Code**: Reproducible environment provisioning via Terraform, OpenTofu, and Pulumi.
- **Observability & APM**: Centralized telemetry dashboards with Datadog, Prometheus, Grafana, and Sentry error alerting.`,
    features: [
      'GitHub Actions & ArgoCD',
      'Docker & Kubernetes (EKS/GKE)',
      'Terraform Infrastructure as Code',
      'Real-Time APM & Sentry Monitoring',
    ],
    badge: 'DevOps',
    icon: 'GitBranch',
    active: true,
    orderIndex: 8,
  },
  {
    title: 'Business Automation',
    slug: 'business-automation',
    category: 'Automation',
    shortDesc: 'Automate internal databases, billing pipelines, CRM syncs, and client support flows.',
    fullDesc: `### Intelligent Workflow Automation & Operational Velocity

Eliminate repetitive manual tasks and eliminate operational bottlenecks across your organization. We engineer automated workflows that sync customer records, trigger financial reconciliations, and handle client support tickets seamlessly.

#### Automation Capabilities
- **CRM & Data Synchronization**: Bidirectional real-time syncing between HubSpot, Salesforce, Stripe, PostgreSQL, and Google Workspace.
- **Automated Billing & Invoicing**: Webhook-driven billing events, invoice generation, failed payment retry logic, and revenue recognition.
- **Support Workflow Bots**: AI-powered triage and ticketing systems that classify, route, and resolve tier-1 customer inquiries automatically.
- **Custom Webhooks & Event Buses**: Event-driven architectures using Apache Kafka, RabbitMQ, and AWS EventBridge.`,
    features: [
      'CRM & Database Bidirectional Sync',
      'Stripe & Financial Webhooks',
      'AI Support Routing Bots',
      'Event-Driven Message Buses',
    ],
    badge: 'Automation',
    icon: 'Settings',
    active: true,
    orderIndex: 9,
  },
  {
    title: 'Enterprise Software',
    slug: 'enterprise-software',
    category: 'Engineering',
    shortDesc: 'Highly available databases, microservices architectures, and legacy system refactoring.',
    fullDesc: `### Mission-Critical Enterprise Platforms & Legacy Modernization

Large enterprises face complex integration challenges, strict compliance mandates, and high transaction volumes. Astraiv provides senior architectural engineering to refactor legacy monoliths and build secure, resilient enterprise platforms.

#### Enterprise Engineering Focus
- **Microservices & Modular Monoliths**: Decoupled service boundaries that allow independent scaling, localized deployments, and fault isolation.
- **Database Partitioning & High Concurrency**: PostgreSQL sharding, connection management, caching layers (Redis/Dragonfly), and read/write splitting.
- **Enterprise Security & Compliance**: SOC-2 compliance, HIPAA alignment, end-to-end data encryption in transit and at rest, and audit trail logging.
- **Zero-Downtime Migration**: Blue/green deployments, canary releases, and shadow traffic testing during legacy migrations.`,
    features: [
      'Microservices & Service Meshes',
      'Postgres Partitioning & Redis Caching',
      'SOC-2 / HIPAA Compliance',
      'Zero-Downtime Blue/Green Rollouts',
    ],
    badge: 'Enterprise',
    icon: 'Database',
    active: true,
    orderIndex: 10,
  },
  {
    title: 'Digital Transformation',
    slug: 'digital-transformation',
    category: 'Consulting',
    shortDesc: 'Transitioning analog workflows to scalable cloud platforms with automated logging.',
    fullDesc: `### Strategic Technology Modernization & Digital Evolution

Transition your organization away from slow, analog workflows and fragmented spreadsheets into unified, automated cloud platforms. We guide businesses through phased, risk-free digital transformation initiatives that unlock exponential operational scale.

#### Transformation Roadmap
- **Process Auditing & Blueprinting**: In-depth operational audits to pinpoint inefficiencies, manual data entry traps, and system bottlenecks.
- **Cloud-Native Migration Strategy**: Structured phased migration plans that safeguard business continuity while replacing outdated systems.
- **Unified Operations Dashboard**: Central command centers providing leadership with live operational metrics and real-time reporting.
- **Change Management & Training**: Comprehensive developer and team training to ensure smooth, enthusiastic adoption of modern toolchains.`,
    features: [
      'End-to-End Operational Audits',
      'Phased Risk-Free Migrations',
      'Executive Unified Dashboards',
      'Team Onboarding & Documentation',
    ],
    badge: 'Strategy',
    icon: 'Shuffle',
    active: true,
    orderIndex: 11,
  },
  {
    title: 'IT Consulting',
    slug: 'it-consulting',
    category: 'Consulting',
    shortDesc: 'Senior architectural audits, technology risk assessment, and system optimization plans.',
    fullDesc: `### Senior Technical Advisory, Architecture Audits & Strategic Guidance

Navigate complex technology decisions with seasoned principal software architects. Astraiv provides Fractional CTO advisory, deep architectural audits, cybersecurity evaluations, and roadmap planning for scaling companies.

#### Advisory Services
- **Full-Stack Architecture Audits**: Deep-dive code reviews, database performance tuning, security vulnerability scans, and scalability assessments.
- **Fractional CTO & Tech Leadership**: Senior technical guidance on vendor selection, cloud spending optimization, and engineering hiring.
- **Security & Compliance Reviews**: Threat modeling, access control audits, data protection compliance, and disaster preparedness checks.
- **Technology Stack Rationalization**: Consolidating redundant SaaS tools and migrating to lean, modern frameworks to reduce operating overhead.`,
    features: [
      'Principal Architect Code Audits',
      'Fractional CTO Leadership',
      'Cloud Spend & FinOps Optimization',
      'Security Threat Modeling',
    ],
    badge: 'Advisory',
    icon: 'HelpCircle',
    active: true,
    orderIndex: 12,
  },
];

async function seedServices() {
  console.log('🚀 Starting Astraiv Services database synchronization...');

  for (const s of SERVICES_DATA) {
    const existing = await db.serviceItem.findUnique({
      where: { slug: s.slug },
    });

    if (existing) {
      await db.serviceItem.update({
        where: { slug: s.slug },
        data: {
          title: s.title,
          category: s.category,
          shortDesc: s.shortDesc,
          fullDesc: s.fullDesc,
          features: s.features,
          badge: s.badge,
          icon: s.icon,
          active: s.active,
          orderIndex: s.orderIndex,
        },
      });
      console.log(`✅ Updated service: ${s.title} (${s.slug})`);
    } else {
      await db.serviceItem.create({
        data: {
          title: s.title,
          slug: s.slug,
          category: s.category,
          shortDesc: s.shortDesc,
          fullDesc: s.fullDesc,
          features: s.features,
          badge: s.badge,
          icon: s.icon,
          active: s.active,
          orderIndex: s.orderIndex,
        },
      });
      console.log(`✨ Created service: ${s.title} (${s.slug})`);
    }
  }

  const count = await db.serviceItem.count();
  console.log(`🎉 Services synchronization complete. Total services in database: ${count}`);
}

seedServices()
  .catch((err) => {
    console.error('❌ Error seeding services:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
