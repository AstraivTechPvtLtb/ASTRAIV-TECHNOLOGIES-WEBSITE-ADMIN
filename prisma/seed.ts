import { Role } from '@prisma/client';
import { hashPassword } from 'better-auth/crypto';
import { db as prisma } from '../src/models/db';

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing records in dependency-safe order
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.clientTicket.deleteMany();
  await prisma.project.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.blogCategory.deleteMany();
  await prisma.portfolioProject.deleteMany();
  await prisma.cRMLead.deleteMany();
  await prisma.contactSubmission.deleteMany();
  await prisma.review.deleteMany();
  await prisma.serviceItem.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Cleaned existing database tables.');

  // 2. Generate standard password hashes
  // "Password123" hashed via Better Auth's default scrypt configuration
  const defaultPasswordHash = await hashPassword('Password123');

  // 3. Create Users
  const adminUser = await prisma.user.create({
    data: {
      name: 'Astraiv Admin',
      email: 'admin@astraiv.com',
      emailVerified: true,
      role: Role.ADMIN,
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&h=256&fit=crop',
    },
  });

  const pmUser = await prisma.user.create({
    data: {
      name: 'Sarah Mitchell',
      email: 'pm@astraiv.com',
      emailVerified: true,
      role: Role.PROJECT_MANAGER,
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&h=256&fit=crop',
    },
  });

  const clientUser = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'client@astraiv.com',
      emailVerified: true,
      role: Role.CLIENT,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&h=256&fit=crop',
    },
  });

  const standardUser = await prisma.user.create({
    data: {
      name: 'Alice Smith',
      email: 'user@astraiv.com',
      emailVerified: true,
      role: Role.USER,
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&h=256&fit=crop',
    },
  });

  console.log('👤 Created User profiles.');

  // 4. Create Better Auth Accounts linked to the users
  const accountsData = [
    { id: 'acc-admin', email: adminUser.email, userId: adminUser.id },
    { id: 'acc-pm', email: pmUser.email, userId: pmUser.id },
    { id: 'acc-client', email: clientUser.email, userId: clientUser.id },
    { id: 'acc-user', email: standardUser.email, userId: standardUser.id },
  ];

  for (const acc of accountsData) {
    await prisma.account.create({
      data: {
        id: acc.id,
        accountId: acc.email,
        providerId: 'credential',
        userId: acc.userId,
        password: defaultPasswordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  console.log('🔐 Created authentication credentials in Account table.');

  // 5. Create Blog Categories
  const categoryTech = await prisma.blogCategory.create({
    data: {
      name: 'Technology & AI',
      slug: 'tech-ai',
    },
  });

  const categoryDesign = await prisma.blogCategory.create({
    data: {
      name: 'UI/UX & Branding',
      slug: 'design-branding',
    },
  });

  await prisma.blogCategory.create({
    data: {
      name: 'Business Strategy',
      slug: 'business-strategy',
    },
  });

  console.log('📂 Created Blog Categories.');

  // 6. Create Blog Posts
  await prisma.blogPost.createMany({
    data: [
      {
        title: 'Building Scalable SaaS Solutions in 2026',
        slug: 'building-scalable-saas-2026',
        summary: 'Explore the modern architectures powering high-performance, enterprise-grade SaaS environments using Next.js 16 and Prisma.',
        content: '<p>Enterprise-grade SaaS demands rigorous attention to database normalization, edge-caching strategies, and secure session handshakes.</p><h2>The Core Stack</h2><p>Our typical stack features Next.js as the frontend/backend engine coupled with PostgreSQL. High concurrency is sustained using connection pools combined with optimized serverless action routes.</p>',
        published: true,
        authorId: adminUser.id,
        categoryId: categoryTech.id,
        featuredImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop',
      },
      {
        title: 'The Psychology of Modern UX/UI Systems',
        slug: 'psychology-modern-uxui-systems',
        summary: 'How strict layout grids, subtle micro-interactions, and curated visual tokens establish immediate customer trust.',
        content: '<p>A user interface is the digital storefront of a corporation. The presence of subtle hover animations, predictable inputs, and high-contrast styling makes software feel organic and premium.</p>',
        published: true,
        authorId: pmUser.id,
        categoryId: categoryDesign.id,
        featuredImage: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?q=80&w=800&auto=format&fit=crop',
      },
      {
        title: 'Why Cloudflare R2 is the Future of Asset Delivery',
        slug: 'cloudflare-r2-asset-delivery',
        summary: 'A deep dive comparing AWS S3 egress costs with Cloudflare’s zero-egress asset bucket architecture.',
        content: '<p>Egress pricing has long plagued scale-out media systems. With R2, developers benefit from standard API connectivity without the penalty of delivery premiums.</p>',
        published: false, // Draft
        authorId: adminUser.id,
        categoryId: categoryTech.id,
        featuredImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
      },
    ],
  });

  console.log('📝 Seeded Blog Posts.');

  // 7. Create Portfolio Projects
  await prisma.portfolioProject.createMany({
    data: [
      {
        title: 'Nova CRM – SaaS Platform',
        slug: 'nova-crm-saas',
        description: 'An AI-powered client relationship manager serving over 20,000 active daily enterprise brokers.',
        content: '<h3>The Scope</h3><p>Nova CRM requested a total visual overhaul and architecture rebuild. We migrated legacy databases to PostgreSQL and set up real-time analytics dashboards using Recharts and WebSockets.</p>',
        tags: ['Next.js', 'PostgreSQL', 'AI Agents', 'Recharts'],
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop',
        projectUrl: 'https://nova-crm-demo.astraiv.com',
        published: true,
      },
      {
        title: 'Lumina – Brand Strategy & Visual Identity',
        slug: 'lumina-brand-strategy',
        description: 'Premium branding kit, logotypes, design tokens, and guideline manuals for a digital energy company.',
        content: '<h3>Brand Overhaul</h3><p>Lumina required a brand strategy communicating security and modernism. We crafted color tokens based on royal blues and neon teals, and created matching visual guidelines.</p>',
        tags: ['Branding', 'Design System', 'Figma'],
        imageUrl: 'https://images.unsplash.com/photo-1561070791-26c113006238?q=80&w=800&auto=format&fit=crop',
        projectUrl: 'https://lumina-brand.astraiv.com',
        published: true,
      },
    ],
  });

  console.log('💼 Seeded Portfolio Projects.');

  // 8. Create Projects
  await prisma.project.create({
    data: {
      name: 'Astraiv Dashboard Portal Rebuild',
      description: 'Migrating legacy client metrics portals to the modern Next.js 16 stack.',
      status: 'ACTIVE',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-08-30'),
      budget: 35000,
      clientId: clientUser.id,
      managerId: pmUser.id,
    },
  });

  await prisma.project.create({
    data: {
      name: 'Cloudflare Migration & SLA Setup',
      description: 'Configuring edge caches, CDN rules, and zero-egress R2 media buckets for static assets.',
      status: 'PLANNING',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-09-15'),
      budget: 15000,
      clientId: clientUser.id,
      managerId: pmUser.id,
    },
  });

  console.log('📂 Seeded Projects.');

  // 9. Create Support Tickets
  await prisma.clientTicket.createMany({
    data: [
      {
        subject: 'Database Migration Failure on Staging',
        description: 'Prisma db push is failing due to constraint conflicts on the old Session table records. Need database architect support.',
        status: 'OPEN',
        priority: 'HIGH',
        clientId: clientUser.id,
        assignedToId: pmUser.id,
      },
      {
        subject: 'SSO Login Integration Request',
        description: 'Clients are requesting Google and GitHub login shortcuts. We need to enable socialProviders configurations.',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        clientId: clientUser.id,
        assignedToId: adminUser.id,
      },
      {
        subject: 'Framer Motion Easing Adjustments',
        description: 'The navbar smooth indicator has a slight jump on Safari 17. Adjust damping coefficients.',
        status: 'RESOLVED',
        priority: 'LOW',
        clientId: clientUser.id,
        assignedToId: pmUser.id,
      },
    ],
  });

  console.log('🎫 Seeded Support Tickets.');

  // 10. Create CRM Leads
  await prisma.cRMLead.createMany({
    data: [
      {
        name: 'Richard Branson',
        email: 'rbranson@virgin.com',
        phone: '+1 (415) 888-2991',
        company: 'Virgin Systems',
        status: 'QUALIFIED',
        source: 'WEBSITE',
        notes: 'Lead requested a comprehensive SaaS estimate for their cloud automation project. High intent.',
      },
      {
        name: 'Melissa Croft',
        email: 'm.croft@aperture.com',
        phone: '+1 (312) 555-0144',
        company: 'Aperture Laboratories',
        status: 'NEW',
        source: 'SOCIAL_MEDIA',
        notes: 'Interested in UI/UX brand guidelines and custom designs.',
      },
      {
        name: 'Hassan Bin-Salman',
        email: 'hassan@saudi-ventures.sa',
        company: 'Saudi Digital Ventures',
        status: 'PROPOSAL_SENT',
        source: 'OUTREACH',
        notes: 'Proposal sent for localizing their enterprise ERP systems into Arabic.',
      },
    ],
  });

  console.log('📈 Seeded CRM Leads.');

  // 11. Create Contact Submissions (Enquiries)
  await prisma.contactSubmission.createMany({
    data: [
      {
        name: 'Alexander Wright',
        email: 'a.wright@solartechnica.io',
        phone: '+1 (415) 555-9012',
        company: 'Solar Technica',
        service: 'Custom Web Application',
        message: 'Looking for a full platform rebuild with Next.js 16 and real-time telemetry dashboards.',
        status: 'pending',
      },
      {
        name: 'Elena Rostova',
        email: 'elena@novafinancial.eu',
        phone: '+44 20 7946 0912',
        company: 'Nova Financial',
        service: 'Cloud Infrastructure & DevOps',
        message: 'Need assistance setting up high-availability PostgreSQL clusters and zero-egress CDN infrastructure.',
        status: 'contacted',
      },
      {
        name: 'David Kim',
        email: 'dkim@apexlogistics.kr',
        phone: '+82 2 312 3456',
        company: 'Apex Logistics',
        service: 'Enterprise SaaS Development',
        message: 'Requesting consultation on migrating our warehouse ERP to a unified modern web portal.',
        status: 'closed',
      },
    ],
  });
  console.log('📬 Seeded Contact Submissions (Enquiries).');

  // 12. Create Client Reviews
  await prisma.review.createMany({
    data: [
      {
        clientName: 'Marcus Vance',
        company: 'Vance Capital',
        designation: 'Managing Director',
        review: 'AstraIV transformed our institutional trading portal. The performance gains and design elegance exceeded all expectations.',
        rating: 5,
        imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&h=256&fit=crop',
        status: 'approved',
        featured: true,
        publishedAt: new Date(),
      },
      {
        clientName: 'Sarah Jenkins',
        company: 'BioHealth Analytics',
        designation: 'Head of Product',
        review: 'The team delivered our HIPAA-compliant analytics dashboard two weeks ahead of schedule. Truly enterprise caliber.',
        rating: 5,
        imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&h=256&fit=crop',
        status: 'approved',
        featured: true,
        publishedAt: new Date(),
      },
      {
        clientName: 'Devon Miles',
        company: 'Aether Robotics',
        designation: 'Chief Technology Officer',
        review: 'Unrivaled expertise in modern web systems, Postgres optimization, and reactive UI architecture.',
        rating: 5,
        imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256&h=256&fit=crop',
        status: 'approved',
        featured: false,
        publishedAt: new Date(),
      },
    ],
  });
  console.log('⭐ Seeded Client Reviews.');

  // 13. Create Services (12 verified enterprise services)
  await prisma.serviceItem.createMany({
    data: [
      {
        title: 'Custom Software',
        slug: 'custom-software',
        category: 'Engineering',
        shortDesc: 'Bespoke, high-performance software engineered specifically for your core business operations.',
        fullDesc: "### Tailored Software Engineering for High-Stakes Operations\n\nOff-the-shelf software often forces growing enterprises into rigid, inefficient workflows. Astraiv designs and builds bespoke software systems tailored precisely to your company's operational blueprint, data architecture, and commercial objectives.\n\n#### What We Deliver\n- **Bespoke Enterprise Systems**: Custom ERP, CRM, and order fulfillment systems built from the ground up to support unique proprietary logic.\n- **Scalable Backend Engines**: Distributed systems built with Node.js, Go, or Python capable of processing millions of concurrent transactions.\n- **API & Protocol Integration**: Seamless bridges between legacy databases, modern microservices, and external third-party partner APIs.\n- **Long-Term Maintainability**: Clean architecture, domain-driven design (DDD), comprehensive test suites, and detailed architectural documentation.",
        features: ['Domain-Driven Architecture', 'High-Throughput Backends', 'Legacy System Modernization', 'Comprehensive Automated Testing'],
        badge: 'Enterprise',
        icon: 'Cpu',
        active: true,
        orderIndex: 2,
      },
      {
        title: 'AI Solutions',
        slug: 'ai-solutions',
        category: 'Artificial Intelligence',
        shortDesc: 'Integration of Large Language Models, custom agents, and predictive analytics into your pipelines.',
        fullDesc: '### Cognitive Intelligence & Custom AI Systems\n\nAt Astraiv Technologies, we build next-generation Artificial Intelligence solutions that transform complex enterprise data into actionable automated workflows. Our AI engineering squad specializes in custom Large Language Model (LLM) fine-tuning, Retrieval-Augmented Generation (RAG) knowledge systems, autonomous agent swarms, and predictive machine learning models.\n\n#### Key Capabilities & Architecture\n- **Autonomous Agent Swarms**: Multi-agent task execution systems capable of reasoning, researching, and orchestrating complex business processes without human bottlenecks.\n- **Enterprise RAG Systems**: High-precision vector database integrations (pgvector, Pinecone, Qdrant) delivering instant semantic search across millions of documents with strict data isolation and zero hallucinations.\n- **Custom LLM Fine-Tuning & Quantization**: Domain-adapted open-source models (Llama 3, Mistral, DeepSeek) deployed on private secure clusters to ensure intellectual property and regulatory compliance.\n- **Predictive Analytics & Forecasting**: Real-time telemetry processing, customer churn forecasting, demand prediction, and risk modeling pipelines.\n\n#### Our Approach\nWe work alongside your engineering and product teams to assess data readiness, design secure API gateways, and deploy resilient AI pipelines with sub-second inference speeds and enterprise SLA guarantees.',
        features: ['Custom LLM & Agent Swarms', 'Enterprise RAG & Semantic Search', 'Private Inference Clusters', 'Predictive Telemetry & Analytics'],
        badge: 'Popular',
        icon: 'Bot',
        active: true,
        orderIndex: 3,
      },
      {
        title: 'Web Applications',
        slug: 'web-applications',
        category: 'Engineering',
        shortDesc: 'Custom, scalable SaaS applications and dashboards designed for optimal workflow performance.',
        fullDesc: '### Enterprise SaaS Platforms & Reactive Web Applications\n\nWe engineer high-performance, mission-critical web applications designed for hyper-growth and extreme reliability. Combining modern React 19 / Next.js 16 architectures with strictly-typed backend microservices, our web apps deliver instantaneous response times, fluid micro-interactions, and intuitive user experiences.\n\n#### Key Architecture Highlights\n- **Sub-Second Performance**: Server-side rendering (SSR), streaming components, edge middleware, and zero-bundle-overhead client hydration.\n- **Multi-Tenant SaaS Architecture**: Strict row-level security (RLS), automated tenant provisioning, role-based access control (RBAC), and SOC-2 compliant data segregation.\n- **Real-Time Collaboration**: WebSocket integration, optimistic UI updates, and real-time state synchronization for seamless multiplayer experiences.\n- **Hardened API Gateways**: REST, GraphQL, and tRPC endpoints with automated rate limiting, circuit breaking, and telemetry monitoring.',
        features: ['Next.js 16 & React 19 Architecture', 'Multi-Tenant SaaS Engine', 'Real-Time WebSockets', 'Strict Type Safety & Contracts'],
        badge: 'Core',
        icon: 'Terminal',
        active: true,
        orderIndex: 3,
      },
      {
        title: 'Cloud Solutions',
        slug: 'cloud-solutions',
        category: 'Infrastructure',
        shortDesc: 'Sleek, highly available AWS and Cloudflare R2 infrastructure designed for near-zero downtime.',
        fullDesc: '### Resilient Cloud Infrastructure & Edge Architectures\n\nModern digital applications require cloud architectures that scale automatically under load, prevent single points of failure, and maintain uncompromising data integrity. We architect and manage high-availability infrastructure across AWS, Google Cloud, and Cloudflare.\n\n#### Infrastructure Capabilities\n- **Serverless & Edge Computing**: Global edge networks routing requests to the nearest points of presence, minimizing latency and maximizing throughput.\n- **Zero-Egress Asset Delivery**: Cost-effective storage architectures using Cloudflare R2 and S3-compatible CDNs to eliminate punitive bandwidth fees.\n- **High-Availability PostgreSQL**: Multi-region read replicas, automated failover loops, connection pooling with PgBouncer, and point-in-time recovery.\n- **Disaster Recovery & Redundancy**: Multi-zone deployment topologies with 99.99% uptime SLAs and automated health checks.',
        features: ['AWS & Cloudflare Edge Setup', 'Zero-Egress Media Buckets', 'High-Availability Database Clusters', '99.99% Uptime SLA Topologies'],
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
        fullDesc: '### High-Converting Digital Storefronts & Corporate Websites\n\nYour website is the single most important digital touchpoint for your brand. Astraiv crafts visually arresting, ultra-fast corporate websites that establish immediate market authority, captivate visitors, and drive commercial conversions.\n\n#### Engineering & Design Standards\n- **Pixel-Perfect Execution**: Precision typography, harmonious color systems, custom layout grids, and bespoke micro-interactions.\n- **Extreme Speed & Core Web Vitals**: Perfect 95+ Lighthouse scores, sub-second First Contentful Paint (FCP), and optimized dynamic asset delivery.\n- **Headless CMS Integration**: Empower marketing teams with intuitive content management while maintaining developer control over design fidelity.\n- **Internationalization (i18n)**: Multi-language support with localized routing, RTL handling, and dynamic translation caching.',
        features: ['Ultra-Fast Next.js Rendering', 'Stripe-Level Aesthetics', 'Headless CMS & Dynamic Content', 'Comprehensive SEO & Core Web Vitals'],
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
        fullDesc: "### Native-Grade Mobile Applications for iOS and Android\n\nDeliver fluid, engaging mobile experiences directly to your users' fingertips. We engineer cross-platform and native mobile applications using React Native and Flutter, ensuring native 60fps animations, offline resilience, and seamless device hardware integrations.\n\n#### Mobile Engineering Scope\n- **Cross-Platform Velocity**: Single codebase deployment across App Store and Google Play with zero compromise on platform-native UI conventions.\n- **Offline-First Synchronization**: Local SQLite / WatermelonDB storage with conflict-free replicated data types (CRDT) for continuous offline functionality.\n- **Push Notification Engines**: Targeted, personalized push campaigns via Firebase Cloud Messaging (FCM) and Apple Push Notification Service (APNs).\n- **Biometric & Secure Hardware**: FaceID, fingerprint authentication, keychain encryption, and secure on-device token storage.",
        features: ['React Native & Flutter Development', 'Offline-First Data Sync', 'Biometric Security & Hardware APIs', 'Automated App Store CI/CD'],
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
        fullDesc: '### World-Class Product Design, Design Systems & User Experience\n\nGreat software is defined by how effortless it feels to use. Our UI/UX design studio creates comprehensive digital design systems that blend refined aesthetics with rigorous human-computer interaction (HCI) principles.\n\n#### Design System & UX Principles\n- **Design Tokens & Component Systems**: Unified design languages in Figma with modular component libraries, color palettes, and typographic scales.\n- **Micro-Interactions & Motion Design**: Subtle hover states, smooth page transitions, and tactile feedback using Framer Motion.\n- **User Journey Optimization**: Wireframing, interactive prototyping, user testing loops, and friction-reducing onboarding flows.\n- **WCAG 2.1 AA Accessibility**: High-contrast modes, keyboard navigation, screen reader compatibility, and inclusive layout hierarchies.',
        features: ['Figma Design Systems & Tokens', 'Tactile Micro-Interactions', 'User Journey & Conversion UX', 'WCAG Accessibility Compliance'],
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
        fullDesc: '### Automated Delivery Pipelines & Infrastructure as Code\n\nAccelerate your engineering release cadence while eliminating human error. We implement automated continuous integration and continuous deployment (CI/CD) pipelines, Docker container orchestration, and Infrastructure as Code (IaC) solutions.\n\n#### DevOps Capabilities\n- **Automated CI/CD Pipelines**: GitHub Actions, GitLab CI, and ArgoCD workflows executing unit tests, linting, security scanning, and preview builds automatically.\n- **Container Orchestration**: Docker packaging, Kubernetes (EKS/GKE) clusters, and lightweight serverless container runtimes.\n- **Infrastructure as Code**: Reproducible environment provisioning via Terraform, OpenTofu, and Pulumi.\n- **Observability & APM**: Centralized telemetry dashboards with Datadog, Prometheus, Grafana, and Sentry error alerting.',
        features: ['GitHub Actions & ArgoCD', 'Docker & Kubernetes (EKS/GKE)', 'Terraform Infrastructure as Code', 'Real-Time APM & Sentry Monitoring'],
        badge: 'DevOps',
        icon: 'GitBranch',
        active: true,
        orderIndex: 7,
      },
      {
        title: 'Business Automation',
        slug: 'business-automation',
        category: 'Automation',
        shortDesc: 'Automate internal databases, billing pipelines, CRM syncs, and client support flows.',
        fullDesc: '### Intelligent Workflow Automation & Operational Velocity\n\nEliminate repetitive manual tasks and eliminate operational bottlenecks across your organization. We engineer automated workflows that sync customer records, trigger financial reconciliations, and handle client support tickets seamlessly.\n\n#### Automation Capabilities\n- **CRM & Data Synchronization**: Bidirectional real-time syncing between HubSpot, Salesforce, Stripe, PostgreSQL, and Google Workspace.\n- **Automated Billing & Invoicing**: Webhook-driven billing events, invoice generation, failed payment retry logic, and revenue recognition.\n- **Support Workflow Bots**: AI-powered triage and ticketing systems that classify, route, and resolve tier-1 customer inquiries automatically.\n- **Custom Webhooks & Event Buses**: Event-driven architectures using Apache Kafka, RabbitMQ, and AWS EventBridge.',
        features: ['CRM & Database Bidirectional Sync', 'Stripe & Financial Webhooks', 'AI Support Routing Bots', 'Event-Driven Message Buses'],
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
        fullDesc: '### Mission-Critical Enterprise Platforms & Legacy Modernization\n\nLarge enterprises face complex integration challenges, strict compliance mandates, and high transaction volumes. Astraiv provides senior architectural engineering to refactor legacy monoliths and build secure, resilient enterprise platforms.\n\n#### Enterprise Engineering Focus\n- **Microservices & Modular Monoliths**: Decoupled service boundaries that allow independent scaling, localized deployments, and fault isolation.\n- **Database Partitioning & High Concurrency**: PostgreSQL sharding, connection management, caching layers (Redis/Dragonfly), and read/write splitting.\n- **Enterprise Security & Compliance**: SOC-2 compliance, HIPAA alignment, end-to-end data encryption in transit and at rest, and audit trail logging.\n- **Zero-Downtime Migration**: Blue/green deployments, canary releases, and shadow traffic testing during legacy migrations.',
        features: ['Microservices & Service Meshes', 'Postgres Partitioning & Redis Caching', 'SOC-2 / HIPAA Compliance', 'Zero-Downtime Blue/Green Rollouts'],
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
        fullDesc: '### Strategic Technology Modernization & Digital Evolution\n\nTransition your organization away from slow, analog workflows and fragmented spreadsheets into unified, automated cloud platforms. We guide businesses through phased, risk-free digital transformation initiatives that unlock exponential operational scale.\n\n#### Transformation Roadmap\n- **Process Auditing & Blueprinting**: In-depth operational audits to pinpoint inefficiencies, manual data entry traps, and system bottlenecks.\n- **Cloud-Native Migration Strategy**: Structured phased migration plans that safeguard business continuity while replacing outdated systems.\n- **Unified Operations Dashboard**: Central command centers providing leadership with live operational metrics and real-time reporting.\n- **Change Management & Training**: Comprehensive developer and team training to ensure smooth, enthusiastic adoption of modern toolchains.',
        features: ['End-to-End Operational Audits', 'Phased Risk-Free Migrations', 'Executive Unified Dashboards', 'Team Onboarding & Documentation'],
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
        fullDesc: '### Senior Technical Advisory, Architecture Audits & Strategic Guidance\n\nNavigate complex technology decisions with seasoned principal software architects. Astraiv provides Fractional CTO advisory, deep architectural audits, cybersecurity evaluations, and roadmap planning for scaling companies.\n\n#### Advisory Services\n- **Full-Stack Architecture Audits**: Deep-dive code reviews, database performance tuning, security vulnerability scans, and scalability assessments.\n- **Fractional CTO & Tech Leadership**: Senior technical guidance on vendor selection, cloud spending optimization, and engineering hiring.\n- **Security & Compliance Reviews**: Threat modeling, access control audits, data protection compliance, and disaster preparedness checks.\n- **Technology Stack Rationalization**: Consolidating redundant SaaS tools and migrating to lean, modern frameworks to reduce operating overhead.',
        features: ['Principal Architect Code Audits', 'Fractional CTO Leadership', 'Cloud Spend & FinOps Optimization', 'Security Threat Modeling'],
        badge: 'Advisory',
        icon: 'HelpCircle',
        active: true,
        orderIndex: 12,
      },
    ],
  });
  console.log('⚙️ Seeded Services.');

  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
