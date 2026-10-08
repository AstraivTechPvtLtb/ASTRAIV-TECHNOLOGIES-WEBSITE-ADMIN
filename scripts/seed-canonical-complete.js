const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/astraiv_db',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('--- Seeding Comprehensive Canonical CMS Data ---');

    // 1. ALL 7 SOLUTIONS
    const solutions = [
      {
        slug: 'ai-business-automation',
        category: 'intelligent-systems',
        category_label: 'Intelligent Systems',
        title: 'AI & Business Automation',
        tagline: 'Autonomous decision pipelines & goal-driven multi-agent swarms.',
        short_desc: 'We engineer self-orchestrating agent workflows that plan, execute, and verify multi-step tasks across external APIs, customer channels, and enterprise data backbones without human bottlenecks.',
        full_desc: 'Our autonomous agent architectures deploy deterministic verification loops around probabilistic LLMs. We build multi-agent swarms equipped with tool-calling capabilities, state persistence, and audit logging to safely automate high-stakes enterprise operations.',
        metric_value: '85%',
        metric_label: 'Reduction in manual repetitive workflows',
        features: [
          'Multi-agent swarm coordination and specialized role routing',
          'Function calling with strict JSON schema verification & safety gates',
          'Human-in-the-loop audit checkpoints for mission-critical actions',
          'Self-healing execution queues with automated error recovery'
        ],
        technologies: ['LangGraph', 'Python FastAPI', 'Claude 3.5 / GPT-4o', 'Redis', 'Temporal.io'],
        order_index: 1
      },
      {
        slug: 'rag-knowledge',
        category: 'intelligent-systems',
        category_label: 'Intelligent Systems',
        title: 'RAG / Enterprise Knowledge Systems',
        tagline: 'Enterprise search across complex multi-format document lakes.',
        short_desc: 'Turn vast unstructured corporate repositories into high-precision, sub-second queryable neural knowledge systems with real-time vector embeddings and zero hallucination boundaries.',
        full_desc: 'Enterprise documents live across disparate formats, silos, and access permissions. Our Retrieval-Augmented Generation architectures index multi-gigabyte document corpora into high-dimensional vector spaces with hybrid BM25 and neural reranking for zero-hallucination accuracy.',
        metric_value: '99.4%',
        metric_label: 'Contextual citation & factual precision',
        features: [
          'Multi-format parser for PDFs, scanned contracts, audio, and Notion/Slack',
          'Hybrid semantic vector search blended with BM25 keyword reranking',
          'Role-based Access Control (RBAC) filtering at retrieval layer',
          'Deterministic document citation and automated chunk freshness sync'
        ],
        technologies: ['pgvector', 'Pinecone', 'Cohere Rerank', 'LangChain', 'PostgreSQL'],
        order_index: 2
      },
      {
        slug: 'saas-platforms',
        category: 'digital-products',
        category_label: 'Digital Products',
        title: 'SaaS Platforms',
        tagline: 'Enterprise recurring revenue engines & customer portals.',
        short_desc: 'We build market-ready multi-tenant software-as-a-service platforms engineered for scale, global compliance, automated subscription lifecycles, and rapid tenant onboarding.',
        full_desc: 'Launch recurring revenue products on rock-solid architectural foundations. From schema-isolated multi-tenancy and automated Stripe billing to compliance logging, our platforms are engineered for extreme scalability.',
        metric_value: '99.99%',
        metric_label: 'System availability SLA across multi-region clusters',
        features: [
          'Isolated multi-tenant data partitioning and tenant scoping schemas',
          'Usage-metered and tier-based billing with Stripe and Paddle integrations',
          'Self-service tenant provisioning, team invites & granular permission matrices',
          'Custom domain support and white-label theme customization'
        ],
        technologies: ['Next.js 15', 'TypeScript', 'Prisma ORM', 'Stripe Billing', 'PostgreSQL'],
        order_index: 3
      },
      {
        slug: 'data-analytics',
        category: 'intelligent-systems',
        category_label: 'Intelligent Systems',
        title: 'Data & Analytics Platforms',
        tagline: 'Real-time metrics, telemetry & executive predictive dashboards.',
        short_desc: 'Consolidate high-velocity transactional and event streams into lightning-fast analytical engines. Deliver executive dashboards, operational alerting, and predictive forecasts at scale.',
        full_desc: 'Modern businesses produce billions of event data points. We construct real-time streaming pipelines, columnar analytical warehouses, and sub-50ms query interfaces that turn operational telemetry into executive foresight.',
        metric_value: '< 50ms',
        metric_label: 'Analytical query latency on billion-row datasets',
        features: [
          'Real-time event streaming pipelines handling millions of events/day',
          'Sub-second aggregation queries on columnar analytic data stores',
          'Automated anomaly detection and trigger-based webhook alerts',
          'Interactive executive BI dashboards with role-partitioned views'
        ],
        technologies: ['ClickHouse', 'Apache Kafka', 'DuckDB', 'Next.js SSR', 'Tailwind CSS'],
        order_index: 4
      },
      {
        slug: 'business-process-automation',
        category: 'digital-products',
        category_label: 'Digital Products',
        title: 'Business Process Automation',
        tagline: 'End-to-end integration workflows eliminating manual labor.',
        short_desc: 'Automate your core back-office functions, CRM synchronization, invoicing cycles, and partner communications with bulletproof, fault-tolerant orchestration workflows.',
        full_desc: 'Manual data transfer between systems wastes thousands of engineering and operational hours. Our orchestration engines automate complex asynchronous business pipelines with exponential backoff and zero dropped states.',
        metric_value: '60+ hrs',
        metric_label: 'Saved per department per week from manual tasks',
        features: [
          'Cross-platform webhook ingestion and data transformation engines',
          'Automated document extraction, reconciliation, and CRM record enrichment',
          'Dead-letter queue handling and automated exponential retry policies',
          'Real-time execution telemetry and Slack/Teams incident notifications'
        ],
        technologies: ['BullMQ', 'Node.js', 'Temporal.io', 'FastAPI', 'Redis'],
        order_index: 5
      },
      {
        slug: 'legacy-modernization',
        category: 'engineering-transformation',
        category_label: 'Engineering Transformation',
        title: 'Legacy Modernization',
        tagline: 'Zero-downtime refactoring into modern serverless cloud stacks.',
        short_desc: 'Deconstruct fragile monolithic software and technical debt without operational disruption. Migrate to resilient, cloud-native microservices with strictly maintained business continuity.',
        full_desc: 'Legacy software paralyzes feature development and drains maintenance budgets. Using proven strangler-fig migration patterns, we transition monolithic codebases into modular, strictly typed cloud architectures with 100% data parity.',
        metric_value: '0 Downtime',
        metric_label: 'Achieved using strangler-fig gradual migration patterns',
        features: [
          'Strangler-fig migration phasing ensuring zero disruption to live customer traffic',
          'Database modernization with live dual-writing and automated parity testing',
          'Containerization and serverless migration lowering infrastructure costs up to 60%',
          'Strict TypeScript and test automation refactoring reducing regression bugs'
        ],
        technologies: ['Docker', 'AWS ECS / Fargate', 'Next.js', 'PostgreSQL', 'Terraform'],
        order_index: 6
      },
      {
        slug: 'digital-transformation',
        category: 'engineering-transformation',
        category_label: 'Engineering Transformation',
        title: 'Digital Transformation',
        tagline: 'Transitioning analog workflows to unified, scalable cloud platforms.',
        short_desc: 'Transition your enterprise away from slow, analog workflows and fragmented spreadsheets into unified, automated cloud platforms that unlock exponential operational scale.',
        full_desc: 'Analog and spreadsheet-based operations paralyze growing enterprises. Astraiv guides businesses through phased, risk-free digital transformation roadmaps—replacing manual friction with unified web portals, automated logging, and executive telemetry.',
        metric_value: '3x Faster',
        metric_label: 'Operational execution velocity across key departments',
        features: [
          'End-to-end operational audits to identify manual bottlenecks and data traps',
          'Phased, risk-free migration blueprint safeguarding ongoing business continuity',
          'Unified executive command center with real-time operational KPI dashboards',
          'Structured team onboarding, documentation, and change management support'
        ],
        technologies: ['Next.js', 'PostgreSQL', 'TypeScript', 'Docker', 'OpenTelemetry'],
        order_index: 7
      }
    ];

    for (const sol of solutions) {
      await client.query(`
        INSERT INTO "solutions" (
          "id", "slug", "category", "category_label", "title", "tagline", "short_desc", "full_desc",
          "metric_value", "metric_label", "features", "technologies", "status", "active", "featured", "order_index"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'published', true, true, $13
        )
        ON CONFLICT ("slug") DO UPDATE SET
          "title" = EXCLUDED."title",
          "category" = EXCLUDED."category",
          "category_label" = EXCLUDED."category_label",
          "tagline" = EXCLUDED."tagline",
          "short_desc" = EXCLUDED."short_desc",
          "full_desc" = EXCLUDED."full_desc",
          "metric_value" = EXCLUDED."metric_value",
          "metric_label" = EXCLUDED."metric_label",
          "features" = EXCLUDED."features",
          "technologies" = EXCLUDED."technologies",
          "status" = 'published',
          "active" = true,
          "featured" = true,
          "order_index" = EXCLUDED."order_index";
      `, [
        `sol-${sol.slug}`, sol.slug, sol.category, sol.category_label, sol.title, sol.tagline,
        sol.short_desc, sol.full_desc, sol.metric_value, sol.metric_label, sol.features,
        sol.technologies, sol.order_index
      ]);
    }
    console.log(`✔ All ${solutions.length} Canonical Solutions seeded.`);

    // 2. ALL 8 INDUSTRIES
    const industries = [
      {
        slug: 'fintech',
        code: 'SEC-FIN-01',
        label: 'FinTech',
        tagline: 'High-Frequency Financial Platforms & Ledger Architecture',
        headline: 'Deterministic, Zero-Drift Financial Systems & Transaction Mesh',
        image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1600&auto=format&fit=crop',
        accent_color: 'text-primary dark:text-cyan-400',
        status_text: 'Ledger Engine: Active | 99.999% SLA',
        compliance_badge: 'PCI-DSS Level 1 • SOC-2 Type II',
        challenge: 'Legacy banking mainframes and loose API gateways suffer from concurrency lock contention, transaction drift, high reconciliation costs, and severe regulatory audit penalties.',
        solution: 'We engineer immutable double-entry ledger engines, real-time micro-transaction pipelines, automated multi-tenant subscription routing, and zero-loss payment webhooks.',
        tech_stack: ['Rust', 'PostgreSQL', 'Kafka', 'Stripe API', 'Redis', 'Temporal'],
        order_index: 1
      },
      {
        slug: 'healthtech',
        code: 'HLT-MED-02',
        label: 'HealthTech',
        tagline: 'HIPAA & HITECH Compliant Clinical & BioTech Pipelines',
        headline: 'Sovereign Patient Portals, HL7/FHIR Ingestion & Clinical Systems',
        image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=1600&auto=format&fit=crop',
        accent_color: 'text-primary dark:text-cyan-400',
        status_text: 'FHIR v4 Active | AES-256 Vault Locked',
        compliance_badge: 'HIPAA Enforced • HITECH • GDPR Health',
        challenge: 'Fragmented Electronic Health Record (EHR) schemas, rigid legacy HL7 protocol integrations, and stringent patient privacy sanctions hinder modern digital patient care.',
        solution: 'We architect end-to-end zero-knowledge patient portals, automated clinical trial telemetry, and bidirectional FHIR v4 API pipelines with comprehensive audit trails.',
        tech_stack: ['Next.js 15', 'WebRTC', 'AWS HealthLake', 'PostgreSQL', 'Python', 'Docker'],
        order_index: 2
      },
      {
        slug: 'saas',
        code: 'ARC-SAS-03',
        label: 'SaaS & Technology',
        tagline: 'High-Velocity Multi-Tenant Architectures & Cloud Engines',
        headline: 'Next-Gen B2B Product Engineering, Tiered Auth & Extreme Concurrency',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1600&auto=format&fit=crop',
        accent_color: 'text-primary dark:text-cyan-400',
        status_text: 'Tenant Isolation: Tier 4 | Distributed Edge',
        compliance_badge: 'SOC-2 Type II • ISO 27001 Architecture',
        challenge: 'Cross-tenant noisy-neighbor resource starvation, rigid permission schemes, clunky onboarding funnels, and slow server response times that kill user retention.',
        solution: 'We engineer ultra-performant SaaS platforms powered by Next.js App Router, Prisma ORM, row-level tenant security, and distributed event-driven microservices.',
        tech_stack: ['Next.js 15', 'TypeScript', 'Prisma', 'Stripe', 'Redis', 'PostgreSQL'],
        order_index: 3
      },
      {
        slug: 'ecommerce',
        code: 'COM-RT-04',
        label: 'E-commerce & Retail',
        tagline: 'Headless Digital Commerce & Global Inventory Sync',
        headline: 'Sub-Second Checkout Velocity, Multi-Warehouse Inventory & Edge Personalization',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop',
        accent_color: 'text-primary dark:text-cyan-400',
        status_text: 'Checkout Stream: 12,000 req/s | 0 Drift',
        compliance_badge: 'PCI-DSS Compliant • Global Edge CDN',
        challenge: 'Monolithic e-commerce templates buckle under flash-sale traffic surges, creating abandoned checkouts, inventory race conditions, and catastrophic revenue loss.',
        solution: 'We deploy headless e-commerce architectures on Next.js with sub-second storefront rendering, atomic inventory locks, and distributed cart caches.',
        tech_stack: ['Next.js', 'Shopify Storefront API', 'Stripe', 'Redis', 'Algolia'],
        order_index: 4
      },
      {
        slug: 'logistics',
        code: 'LOG-TRK-05',
        label: 'Logistics & Supply Chain',
        tagline: 'Fleet Telematics, Dynamic Route Optimization & Warehouse Mesh',
        headline: 'Real-Time Telemetry Streaming, Geofencing & Automated Manifest Verification',
        image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1600&auto=format&fit=crop',
        accent_color: 'text-primary dark:text-cyan-400',
        status_text: 'IoT Mesh: 48,000 Pings/min | Geo-Lock Active',
        compliance_badge: 'ISO 27001 • Telematics Encrypted',
        challenge: 'Blind delivery spots, disconnected ERP databases, fuel waste from sub-optimal routing, and inaccurate manual dispatch logs.',
        solution: 'We engineer IoT telemetry ingestion engines, automated dynamic dispatch algorithms, driver mobile companion apps, and real-time shipment portals.',
        tech_stack: ['Node.js', 'Go', 'Kafka', 'PostGIS', 'Flutter', 'TimescaleDB'],
        order_index: 5
      },
      {
        slug: 'edtech',
        code: 'EDT-ACD-06',
        label: 'EdTech & Learning',
        tagline: 'Interactive Virtual Classrooms & Adaptive Learning Engines',
        headline: 'High-Concurrency Collaborative Portals, Interactive Media & Student Analytics',
        image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600&auto=format&fit=crop',
        accent_color: 'text-primary dark:text-cyan-400',
        status_text: 'Realtime Mesh: 120ms Latency | Adaptive Active',
        compliance_badge: 'FERPA Compliant • COPPA Enforced',
        challenge: 'High latency during live virtual sessions, fragmented learning tools, low student engagement, and lack of real-time student performance feedback.',
        solution: 'We architect unified learning management ecosystems with sub-150ms WebRTC live virtual classrooms, interactive whiteboards, and predictive learning paths.',
        tech_stack: ['Next.js', 'WebRTC', 'FastAPI', 'PostgreSQL', 'Tailwind CSS', 'Redis'],
        order_index: 6
      },
      {
        slug: 'professional-services',
        code: 'PRO-SRV-07',
        label: 'Professional Services',
        tagline: 'Practice Automation, Secure Client Vaults & Billing Engines',
        headline: 'Unified Practice Management, Automated Trust Accounting & Matter Tracking',
        image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1600&auto=format&fit=crop',
        accent_color: 'text-primary dark:text-cyan-400',
        status_text: 'Vault Encrypted | Automated Trust Sync Active',
        compliance_badge: 'SOC-2 Type II • Strict Confidentiality',
        challenge: 'Disjointed time-tracking, error-prone manual invoicing, insecure email document transfers, and unbilled operational hours.',
        solution: 'We engineer bespoke practice management software that integrates automated time capture, matter tracking, secure client document vaults, and trust accounting.',
        tech_stack: ['Next.js', 'TypeScript', 'Prisma', 'Stripe Invoicing', 'Cloudflare R2'],
        order_index: 7
      },
      {
        slug: 'other-industries',
        code: 'IND-IOT-08',
        label: 'Industrial & IoT Systems',
        tagline: 'Custom Mission-Critical Architectures for Specialized Verticals',
        headline: 'High-Reliability Embedded Telemetry, Edge Computing & Industrial Automation',
        image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1600&auto=format&fit=crop',
        accent_color: 'text-primary dark:text-cyan-400',
        status_text: 'SCADA Bridge: Online | Edge Node Verified',
        compliance_badge: 'ISO 9001 • Industrial Safety Compliant',
        challenge: 'Harsh operational environments, high-frequency sensor noise, unreliable remote network connectivity, and zero tolerance for downtime.',
        solution: 'We develop edge computing software, real-time SCADA sensor visualization portals, and predictive maintenance engines for industrial operations.',
        tech_stack: ['Rust', 'Go', 'TimescaleDB', 'MQTT', 'Docker', 'WebSockets'],
        order_index: 8
      }
    ];

    for (const ind of industries) {
      await client.query(`
        INSERT INTO "industries" (
          "id", "slug", "code", "label", "tagline", "headline", "image", "accent_color",
          "status_text", "compliance_badge", "challenge", "solution", "tech_stack", "status", "active", "order_index"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'published', true, $14
        )
        ON CONFLICT ("id") DO UPDATE SET
          "slug" = EXCLUDED."slug",
          "code" = EXCLUDED."code",
          "label" = EXCLUDED."label",
          "tagline" = EXCLUDED."tagline",
          "headline" = EXCLUDED."headline",
          "image" = EXCLUDED."image",
          "accent_color" = EXCLUDED."accent_color",
          "status_text" = EXCLUDED."status_text",
          "compliance_badge" = EXCLUDED."compliance_badge",
          "challenge" = EXCLUDED."challenge",
          "solution" = EXCLUDED."solution",
          "tech_stack" = EXCLUDED."tech_stack",
          "status" = 'published',
          "active" = true,
          "order_index" = EXCLUDED."order_index";
      `, [
        `ind-${ind.slug}`, ind.slug, ind.code, ind.label, ind.tagline, ind.headline,
        ind.image, ind.accent_color, ind.status_text, ind.compliance_badge, ind.challenge,
        ind.solution, ind.tech_stack, ind.order_index
      ]);
    }
    console.log(`✔ All ${industries.length} Canonical Industries seeded.`);

    // 3. ALL 5 AWARDS & TRUST ACCOLADES
    const awards = [
      {
        id: 'iso-27001',
        type: 'certification',
        title: 'ISO/IEC 27001:2022 Information Security Management',
        organization: 'International Organization for Standardization (ISO)',
        year: '2022 – Present',
        category: 'Information Security & Data Protection',
        description: 'Comprehensive Information Security Management System (ISMS) governing end-to-end cryptographic key rotation, least-privilege role-based access control (RBAC), database row-level security (RLS), and zero-trust infrastructure protocols.',
        achievement: 'Zero security breaches, zero unencrypted credential disclosures, and continuous data isolation maintained across every production client deployment.',
        verification_url: '/privacy',
        verification_label: 'Review Security Governance',
        badge_text: 'ISO 27001:2022',
        status: 'verified',
        icon: 'ShieldCheck',
        order_index: 1,
        highlights: ['Zero-Trust tenant partitioning', 'Automated credential rotation', 'Encrypted transit & storage (TLS 1.3 / AES-256)', 'Regular threat surface assessments']
      },
      {
        id: 'iso-9001',
        type: 'certification',
        title: 'ISO 9001:2015 Quality Management Systems',
        organization: 'International Organization for Standardization (ISO)',
        year: '2015 – Present',
        category: 'Software Engineering Quality & SDLC Governance',
        description: 'Standardized software development lifecycle protocols, mandatory automated regression suites, strictly typed domain contracts, and deterministic peer code reviews ensuring high code quality.',
        achievement: 'Maintained a 99.8% bug-free milestone completion rate across client production deliveries with zero architectural regression drift.',
        verification_url: '/company#process',
        verification_label: 'Inspect Delivery Lifecycle',
        badge_text: 'ISO 9001:2015',
        status: 'verified',
        icon: 'CheckCircle2',
        order_index: 2,
        highlights: ['Standardized SDLC release gates', 'Mandatory double-peer PR reviews', 'Strict automated Vitest & TypeScript verification', 'Continuous quality feedback loops']
      },
      {
        id: 'soc-2-ready',
        type: 'certification',
        title: 'SOC-2 Type II Compliance Architecture',
        organization: 'AICPA Trust Services Criteria (Security, Availability, Confidentiality)',
        year: '2024 – 2026',
        category: 'Enterprise Cloud Governance',
        description: 'Institutional infrastructure blueprints designed to satisfy SOC-2 Type II audit controls: immutable audit trails, database partition isolation, automated health telemetry, and disaster recovery procedures.',
        achievement: 'Passed institutional client third-party architectural compliance assessments on initial submission without corrective action requests.',
        verification_url: '/company#about',
        verification_label: 'View Compliance Architecture',
        badge_text: 'SOC-2 Type II',
        status: 'verified',
        icon: 'Lock',
        order_index: 3,
        highlights: ['Immutable database audit logging', 'Role-based granular access (RBAC)', 'Automated daily backup & failover tests', 'Confidentiality & NDA safeguards']
      },
      {
        id: 'aws-partner',
        type: 'partnership',
        title: 'AWS Partner Network (APN) Architecture',
        organization: 'Amazon Web Services (AWS)',
        year: '2024 – Present',
        category: 'Cloud Infrastructure & Serverless Ecosystem',
        description: 'Verified cloud architecture partnership enabling rapid provisioning of high-availability AWS ECS/EKS clusters, multi-AZ PostgreSQL databases, CloudWatch observability, and serverless compute primitives.',
        achievement: 'Architected multi-region failover topologies delivering 99.99% system availability for enterprise fintech, SaaS, and logistics client platforms.',
        verification_url: 'https://aws.amazon.com/partners/',
        verification_label: 'AWS Partner Directory',
        badge_text: 'Cloud Partner',
        status: 'active',
        icon: 'Cloud',
        order_index: 4,
        highlights: ['Multi-region high availability', 'Serverless auto-scaling microservices', 'Cost-optimized RDS & ECS topologies', 'Sub-millisecond API response gateways']
      },
      {
        id: 'cloudflare-edge',
        type: 'partnership',
        title: 'Cloudflare Technology & Global Edge Network',
        organization: 'Cloudflare Inc.',
        year: '2024 – Present',
        category: 'Global Edge Networking & Zero-Trust CDN',
        description: 'Strategic utilization of Cloudflare Edge Workers, R2 Zero-Egress Object Storage, and automated DDoS/WAF threat protection layers to eliminate egress charges and deliver instantaneous content delivery.',
        achievement: 'Achieved global p95 latency under 50ms and reduced client asset egress bandwidth expenses by 40% in initial production rollouts.',
        verification_url: 'https://www.cloudflare.com/',
        verification_label: 'Cloudflare Network',
        badge_text: 'Edge Partner',
        status: 'active',
        icon: 'Sparkles',
        order_index: 5,
        highlights: ['Global 300+ edge city point-of-presence', 'Zero-egress asset storage via R2', 'Automated DDoS & web application firewall', 'Edge SSL termination']
      }
    ];

    for (const award of awards) {
      await client.query(`
        INSERT INTO "awards" (
          "id", "type", "title", "organization", "year", "category", "description", "achievement",
          "verification_url", "verification_label", "badge_text", "status", "icon", "highlights", "published", "featured", "order_index"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true, true, $15)
        ON CONFLICT ("id") DO UPDATE SET
          "type" = EXCLUDED."type",
          "title" = EXCLUDED."title",
          "organization" = EXCLUDED."organization",
          "description" = EXCLUDED."description",
          "status" = EXCLUDED."status",
          "published" = true,
          "featured" = true,
          "order_index" = EXCLUDED."order_index";
      `, [
        award.id, award.type, award.title, award.organization, award.year, award.category,
        award.description, award.achievement, award.verification_url, award.verification_label,
        award.badge_text, award.status, award.icon, award.highlights, award.order_index
      ]);
    }
    console.log(`✔ All ${awards.length} Canonical Accolades seeded.`);

    // 4. PORTFOLIO CASE STUDIES
    const projects = [
      {
        id: 'financeflow',
        slug: 'financeflow',
        title: 'FinanceFlow AI-Driven Budget & Ledger Engine',
        client: 'FinanceFlow Capital',
        industry_slug: 'fintech',
        industry_name: 'FinTech',
        description: 'Engineered an AI-driven budget analyzer integrating LLMs with bank ledger APIs, featuring secure credential vaulting, deterministic double-entry accounting tables, and automated reconciliation loops.',
        content: 'Engineered an AI-driven budget analyzer integrating LLMs with bank ledger APIs, featuring secure credential vaulting, deterministic double-entry accounting tables, and automated reconciliation loops.',
        challenge: 'Manual financial reconciliation bottlenecks, concurrency lock contention during end-of-month book closing, and complex bank ledger integration compliance.',
        status: 'published',
        published: true,
        featured: true,
        category: 'FinTech & Ledger',
        tags: ['Next.js', 'PostgreSQL', 'Python', 'pgvector', 'TypeScript', 'Docker']
      },
      {
        id: 'pulsefit',
        slug: 'pulsefit',
        title: 'PulseFit Enterprise Telehealth & Analytics Engine',
        client: 'PulseFit Global',
        industry_slug: 'saas',
        industry_name: 'SaaS & Technology',
        description: 'Architected end-to-end zero-knowledge patient portals, automated clinical telemetry, and WebRTC streaming video consultations.',
        content: 'Architected end-to-end zero-knowledge patient portals, automated clinical telemetry, and WebRTC streaming video consultations.',
        challenge: 'Cross-tenant noisy-neighbor resource starvation, rigid permission schemes, clunky onboarding funnels, and slow server response times.',
        status: 'published',
        published: true,
        featured: true,
        category: 'SaaS & Technology',
        tags: ['Next.js 15', 'TypeScript', 'Prisma', 'WebRTC', 'PostgreSQL']
      },
      {
        id: 'aerosync',
        slug: 'aerosync',
        title: 'AeroSync High-Throughput Flight Telemetry Gateway',
        client: 'AeroSync Aviation',
        industry_slug: 'logistics',
        industry_name: 'Logistics & Supply Chain',
        description: 'Engineered high-throughput IoT telemetry ingestion engines handling millions of vehicle coordinates per second with sub-100ms processing latencies.',
        content: 'Engineered high-throughput IoT telemetry ingestion engines handling millions of vehicle coordinates per second with sub-100ms processing latencies.',
        challenge: 'Blind delivery spots, disconnected ERP databases, fuel waste from sub-optimal routing, and inaccurate manual dispatch logs.',
        status: 'published',
        published: true,
        featured: true,
        category: 'Logistics & Supply Chain',
        tags: ['Node.js', 'Go', 'Kafka', 'TimescaleDB', 'Flutter']
      }
    ];

    for (const p of projects) {
      await client.query(`
        INSERT INTO "portfolio_project" (
          "id", "slug", "title", "client", "industry_slug", "industry_name",
          "description", "content", "challenge", "status", "published", "featured",
          "category", "tags", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW()
        )
        ON CONFLICT ("slug") DO UPDATE SET
          "title" = EXCLUDED."title",
          "client" = EXCLUDED."client",
          "industry_slug" = EXCLUDED."industry_slug",
          "industry_name" = EXCLUDED."industry_name",
          "description" = EXCLUDED."description",
          "content" = EXCLUDED."content",
          "challenge" = EXCLUDED."challenge",
          "status" = 'published',
          "published" = true,
          "featured" = true,
          "category" = EXCLUDED."category",
          "tags" = EXCLUDED."tags",
          "updatedAt" = NOW();
      `, [
        p.id, p.slug, p.title, p.client, p.industry_slug, p.industry_name,
        p.description, p.content, p.challenge, p.status, p.published, p.featured,
        p.category, p.tags
      ]);
    }
    console.log(`✔ All ${projects.length} Case Studies seeded.`);

    console.log('✅ COMPLETE CANONICAL CMS SEEDING SUCCESSFUL');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
