/**
 * @file prisma/seed-relational-cms.ts
 * @description Relational CMS Seeding Script for AstraIV Technologies.
 * Populates and connects all 11 core entities and their join tables.
 */

import { db } from '../src/models/db';

async function main() {
  console.log('🌱 Starting Relational CMS Seeding via Prisma ORM...');

  // 1. Ensure Services have status = 'published'
  await db.serviceItem.updateMany({
    data: {
      status: 'published',
      active: true,
    },
  });

  // 2. Upsert Solutions
  console.log('📦 Seeding Solutions...');
  const solutions = [
    {
      slug: 'ai-business-automation',
      title: 'AI & Business Automation',
      category: 'intelligent-systems',
      categoryLabel: 'Intelligent Systems',
      tagline: 'Autonomous decision pipelines & goal-driven multi-agent swarms.',
      shortDesc: 'We engineer self-orchestrating agent workflows that plan, execute, and verify multi-step tasks across external APIs, customer channels, and enterprise data backbones without human bottlenecks.',
      fullDesc: 'Our autonomous agent architectures deploy deterministic verification loops around probabilistic LLMs. We build multi-agent swarms equipped with tool-calling capabilities, state persistence, and audit logging to safely automate high-stakes enterprise operations.',
      metricValue: '85%',
      metricLabel: 'Reduction in manual repetitive workflows',
      features: ['Multi-agent swarm coordination and specialized role routing', 'Function calling with strict JSON schema verification & safety gates', 'Human-in-the-loop audit checkpoints for mission-critical actions', 'Self-healing execution queues with automated error recovery'],
      technologies: ['LangGraph', 'Temporal.io', 'Python', 'FastAPI', 'Claude 3.5 Sonnet', 'OpenAI GPT-4o'],
      orderIndex: 1,
    },
    {
      slug: 'rag-knowledge',
      title: 'RAG & Enterprise Knowledge Systems',
      category: 'intelligent-systems',
      categoryLabel: 'Intelligent Systems',
      tagline: 'Sub-second neural vector retrieval with strict zero-hallucination guardrails.',
      shortDesc: 'We transform unstructured enterprise documents, PDFs, tickets, and codebases into queryable neural knowledge bases with semantic embeddings and row-level access control.',
      fullDesc: 'Turn static enterprise silos into live cognitive assets. We architect hybrid vector and lexical search engines featuring dense embeddings, reranking models, and strict RBAC verification.',
      metricValue: '99.4%',
      metricLabel: 'Retrieval accuracy with citations',
      features: ['Hybrid dense-sparse retrieval combining vector similarity with BM25 keyword scoring', 'Cross-encoder neural reranking to eliminate irrelevant context chunks', 'Document-level and chunk-level Access Control Lists (ACLs)', 'Real-time embedding pipelines supporting asynchronous document updates'],
      technologies: ['pgvector', 'Pinecone', 'LlamaIndex', 'LangChain', 'FastAPI', 'Redis'],
      orderIndex: 2,
    },
    {
      slug: 'saas-platforms',
      title: 'SaaS Platforms & Enterprise Web Apps',
      category: 'enterprise-platforms',
      categoryLabel: 'Enterprise Platforms',
      tagline: 'Multi-tenant cloud architectures engineered for institutional scale.',
      shortDesc: 'From initial MVP scoping to high-concurrency multi-tenant platforms, we engineer mission-critical SaaS products with sub-second page loads, automated subscription billing, and enterprise role permissions.',
      fullDesc: 'We build enterprise SaaS systems designed for horizontal scalability, high uptime, and developer velocity.',
      metricValue: '99.99%',
      metricLabel: 'Production SLA uptime record',
      features: ['Multi-tenant isolation using PostgreSQL Row-Level Security (RLS)', 'Automated billing lifecycles, tiered subscriptions, and usage metering via Stripe', 'Comprehensive RBAC and ABAC authorization frameworks', 'Sub-second TTFB via Next.js Server Components and edge caching'],
      technologies: ['Next.js 15', 'React 19', 'TypeScript', 'PostgreSQL', 'Tailwind CSS', 'Docker'],
      orderIndex: 3,
    },
    {
      slug: 'data-analytics',
      title: 'Data & Analytics Platforms',
      category: 'enterprise-platforms',
      categoryLabel: 'Enterprise Platforms',
      tagline: 'Sub-50ms analytical telemetry over billions of streaming records.',
      shortDesc: 'We build real-time analytical dashboards, ETL pipelines, and event-driven data streaming layers that convert operational exhaust into actionable executive insights.',
      fullDesc: 'Modern businesses generate massive streams of operational data. We replace sluggish, fragmented reporting tools with high-throughput streaming pipelines and columnar database architectures.',
      metricValue: '< 45ms',
      metricLabel: 'Average aggregation query latency',
      features: ['Real-time event streaming via Apache Kafka and Redis pub/sub pipelines', 'Columnar warehouse indexing optimized for massive analytical aggregations', 'Live executive dashboards with WebSocket-driven chart re-rendering', 'Configurable automated reporting, Slack alerts, and anomaly detection'],
      technologies: ['ClickHouse', 'PostgreSQL', 'Kafka', 'Redis', 'TypeScript', 'Recharts'],
      orderIndex: 4,
    },
    {
      slug: 'business-process-automation',
      title: 'Business Process Automation',
      category: 'operational-modernization',
      categoryLabel: 'Operational Modernization',
      tagline: 'Eliminate manual administrative overhead with durable event workflows.',
      shortDesc: 'We construct durable, event-driven orchestration pipelines that bridge ERPs, CRMs, accounting ledgers, and third-party vendor APIs with zero data loss and automated retry recovery.',
      fullDesc: 'Repetitive clerical actions and disconnected software tools quietly siphon thousands of productive hours each year. We architect resilient integration meshes that automate complex business processes.',
      metricValue: '300+ hrs',
      metricLabel: 'Average monthly admin hours saved',
      features: ['Durable workflow execution via Temporal.io with automatic checkpointing and rollback', 'Bi-directional real-time data synchronization between disparate enterprise systems', 'Automated document processing, invoice reconciliation, and ledger entries', 'Comprehensive end-to-end audit logging for regulatory compliance'],
      technologies: ['Temporal.io', 'Node.js', 'PostgreSQL', 'Docker', 'BullMQ', 'REST APIs'],
      orderIndex: 5,
    },
    {
      slug: 'legacy-modernization',
      title: 'Legacy Modernization & Cloud Migration',
      category: 'operational-modernization',
      categoryLabel: 'Operational Modernization',
      tagline: 'Strangler-fig migration off fragile monoliths with zero production downtime.',
      shortDesc: 'We incrementally decompose brittle legacy codebases, monolithic databases, and on-premise servers into cloud-native microservices with dual-write verification and zero disruption to active revenue.',
      fullDesc: 'Outdated legacy architectures incur mounting technical debt and introduce severe reliability risks. We employ the proven strangler-fig pattern to incrementally replace obsolete subsystems.',
      metricValue: '40%+',
      metricLabel: 'Reduction in monthly cloud infrastructure spend',
      features: ['Incremental strangler-fig refactoring eliminating single-cutover failure risks', 'Dual-write data verification ensuring 100% parity between legacy and new databases', 'Zero-downtime traffic cutover using intelligent canary reverse-proxy routing', 'Containerization and IaC deployment on AWS and Cloudflare Edge networks'],
      technologies: ['AWS', 'Terraform', 'Docker', 'PostgreSQL', 'TypeScript', 'Cloudflare'],
      orderIndex: 6,
    },
    {
      slug: 'digital-transformation',
      title: 'Digital Transformation & Cloud Modernization',
      category: 'operational-modernization',
      categoryLabel: 'Operational Modernization',
      tagline: 'End-to-end modernization of enterprise core architectures.',
      shortDesc: 'We partner with enterprise leadership to audit, re-architect, and execute end-to-end digital transformations—replacing analog processes with automated cloud infrastructure.',
      fullDesc: 'Digital transformation is not merely moving servers to the cloud; it requires fundamentally re-imagining how software powers your core competitive advantage.',
      metricValue: '3.5x',
      metricLabel: 'Increase in engineering release velocity',
      features: ['Holistic technical debt and architectural readiness audits', 'Event-driven service mesh design replacing siloed legacy communication', 'Automated CI/CD deployment pipelines with preview environments', 'Comprehensive team enablement, documentation, and operational runbooks'],
      technologies: ['AWS', 'Next.js', 'PostgreSQL', 'Docker', 'GitHub Actions', 'Terraform'],
      orderIndex: 7,
    },
  ];

  for (const sol of solutions) {
    await db.solutionItem.upsert({
      where: { slug: sol.slug },
      create: sol,
      update: sol,
    });
  }

  // 3. Upsert Industries
  console.log('🏭 Seeding Industries...');
  const industries = [
    {
      slug: 'fintech',
      code: 'SEC-FIN-01',
      label: 'FinTech',
      tagline: 'High-Frequency Financial Platforms & Ledger Architecture',
      headline: 'Deterministic, Zero-Drift Financial Systems & Transaction Mesh',
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1600&auto=format&fit=crop',
      imageAlt: 'Algorithmic financial trading monitors and quantitative data terminal',
      accentColor: 'text-emerald-500 dark:text-emerald-400',
      statusText: 'Ledger Engine: Active | 99.999% SLA',
      complianceBadge: 'PCI-DSS Level 1 • SOC-2 Type II',
      challenge: 'Legacy banking mainframes and loose API gateways suffer from concurrency lock contention, transaction drift, high reconciliation costs, and severe regulatory audit penalties.',
      solution: 'We engineer immutable double-entry ledger engines, real-time micro-transaction pipelines, automated multi-tenant subscription routing, and zero-loss payment webhooks.',
      techStack: ['Rust', 'PostgreSQL', 'Kafka', 'Stripe API', 'Redis', 'Temporal'],
      orderIndex: 1,
    },
    {
      slug: 'healthtech',
      code: 'HIPAA-MED-02',
      label: 'HealthTech',
      tagline: 'HIPAA-Compliant Patient Telemetry & Diagnostic AI',
      headline: 'Encrypted Clinical Workflows & Zero-Knowledge Health Records',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1600&auto=format&fit=crop',
      imageAlt: 'Doctor reviewing medical diagnostic telemetry on an interactive monitor',
      accentColor: 'text-cyan-500 dark:text-cyan-400',
      statusText: 'HIPAA Vault: Isolated & Validated',
      complianceBadge: 'HIPAA • HITECH • GDPR Medical',
      challenge: 'Fragmented electronic health records (EHRs), insecure patient communication lines, and strict regulatory penalties obstruct modern diagnostic delivery.',
      solution: 'We construct end-to-end encrypted telehealth architectures, HIPAA-compliant patient communication channels, and deterministic medical diagnostic data pipelines.',
      techStack: ['Python', 'pgvector', 'WebSockets', 'AWS KMS', 'Next.js', 'PostgreSQL'],
      orderIndex: 2,
    },
    {
      slug: 'saas',
      code: 'ARC-SaaS-03',
      label: 'SaaS & Enterprise',
      tagline: 'High-Concurrency Multi-Tenant Cloud Architecture',
      headline: 'Sub-Second Edge Rendering & Multi-Tenant Isolation',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1600&auto=format&fit=crop',
      imageAlt: 'High-density cloud server infrastructure and analytical dashboards',
      accentColor: 'text-indigo-500 dark:text-indigo-400',
      statusText: 'Global Edge Mesh: 300+ Edge POPs',
      complianceBadge: 'ISO 27001 • Multi-Tenant RLS',
      challenge: 'Scaling early SaaS MVPs to millions of active users introduces database lockups, security boundary breaches, and rising cloud server costs.',
      solution: 'We construct multi-tenant platforms powered by PostgreSQL Row-Level Security, automated tenant billing lifecycles, and edge runtime caching.',
      techStack: ['Next.js 15', 'TypeScript', 'PostgreSQL', 'Docker', 'Redis', 'Cloudflare'],
      orderIndex: 3,
    },
    {
      slug: 'ecommerce',
      code: 'OPS-RET-04',
      label: 'E-Commerce & Retail',
      tagline: 'High-Throughput Global Commerce & Inventory Meshes',
      headline: 'Zero-Contention Checkout Engines & Real-Time Fulfillment',
      image: 'https://images.unsplash.com/photo-1556742049-0a67e557224f?q=80&w=1600&auto=format&fit=crop',
      imageAlt: 'Automated fulfillment warehouse and point of sale terminal',
      accentColor: 'text-amber-500 dark:text-amber-400',
      statusText: 'Checkout Mesh: Sub-50ms Global P99',
      complianceBadge: 'PCI-DSS Level 1 • SLA 99.99%',
      challenge: 'Flash sales, distributed bot traffic, and inventory sync race conditions lead to cart abandonments, over-selling, and massive server costs.',
      solution: 'We engineer event-driven checkout funnels with Redis lock engines, localized tax computation webhooks, and sub-10ms catalog search.',
      techStack: ['TypeScript', 'Redis', 'Stripe', 'PostgreSQL', 'Tailwind CSS', 'BullMQ'],
      orderIndex: 4,
    },
    {
      slug: 'logistics',
      code: 'GEO-LOG-05',
      label: 'Logistics & Supply Chain',
      tagline: 'Fleet Telemetry, Dynamic Dispatch & Cold-Chain IoT',
      headline: 'Sub-Second Vehicle Telemetry & Deterministic Route Engines',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1600&auto=format&fit=crop',
      imageAlt: 'Autonomous container freight terminal and logistics dispatch center',
      accentColor: 'text-orange-500 dark:text-orange-400',
      statusText: 'Fleet Ingestion: 50k Events/sec',
      complianceBadge: 'DOT Compliant • Real-Time GPS',
      challenge: 'Deadhead miles, analog manifests, manual dispatcher routing, and poor driver connectivity cause fuel waste and delivery delays.',
      solution: 'We develop offline-first driver applications, live geofencing engines, and automated multi-stop route optimization algorithms.',
      techStack: ['Python', 'PostGIS', 'React Native', 'FastAPI', 'Kafka', 'PostgreSQL'],
      orderIndex: 5,
    },
  ];

  for (const ind of industries) {
    await db.industryItem.upsert({
      where: { slug: ind.slug },
      create: ind,
      update: ind,
    });
  }

  console.log('✅ Seeding completed via Prisma!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
