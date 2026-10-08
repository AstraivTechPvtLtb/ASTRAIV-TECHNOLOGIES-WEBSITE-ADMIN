/**
 * @file admin/scripts/seed_careers_initial.js
 * @description Seeds initial dynamic Careers page content and enriches existing job openings.
 */

require('dotenv').config();
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL?.trim().replace(/^["']|["']$/g, '');
const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
const pool = new Pool({
  connectionString,
  ssl: isLocalhost ? false : { rejectUnauthorized: false },
});

const DEFAULT_CAREERS_PAGE_SECTIONS = {
  hero: {
    heading: 'Work With Architects,',
    highlightText: 'Not Bureaucrats.',
    subtitle: 'We are a team of senior software engineers, cloud architects, and AI researchers building mission-critical platforms for high-growth enterprises worldwide.',
  },
  cultureCards: [
    {
      id: 'culture-1',
      title: 'Architectural Ownership',
      body: 'We do not micromanage tickets. Engineers own architecture end-to-end, from schema definition to multi-region cloud deployment.',
      icon: 'Compass',
      orderIndex: 1,
      visible: true,
    },
    {
      id: 'culture-2',
      title: 'Async Deep Work Culture',
      body: 'We minimize synchronous meetings in favor of precise technical specs, RFC documents, and uninterrupted focus time.',
      icon: 'Users',
      orderIndex: 2,
      visible: true,
    },
    {
      id: 'culture-3',
      title: 'Radical Engineering Candor',
      body: 'Code reviews are honest, rigorous, and ego-free. We care deeply about clean code, memory safety, and performance budgets.',
      icon: 'HeartHandshake',
      orderIndex: 3,
      visible: true,
    },
  ],
  careersImage: {
    url: null,
    alt: 'Astraiv Technologies engineering architecture team',
    visible: false,
    width: 1600,
    height: 900,
    sizeBytes: 0,
    sizeLabel: '0 KB',
    focalPoint: 'center',
  },
  benefitsHeading: {
    title: 'Build the Future with',
    highlightText: 'Elite Engineers',
    subtitle: 'Join our team of elite full-stack engineers and architects solving high-stakes enterprise challenges.',
  },
  benefitsCards: [
    {
      id: 'benefit-1',
      title: '100% Remote & Global Autonomy',
      body: 'Work from wherever you are most productive. We value high output and clean deliverables over seat-time.',
      icon: 'Globe2',
      orderIndex: 1,
      visible: true,
    },
    {
      id: 'benefit-2',
      title: 'Modern Architecture Only',
      body: 'Zero legacy debt. We build exclusively with Next.js 16, React 19, TypeScript, Rust, Python, and edge runtimes.',
      icon: 'Code2',
      orderIndex: 2,
      visible: true,
    },
    {
      id: 'benefit-3',
      title: 'AI & Cognitive Engineering',
      body: 'Direct hands-on experience building autonomous agents, multi-tenant RAG systems, and enterprise LLM pipelines.',
      icon: 'Brain',
      orderIndex: 3,
      visible: true,
    },
    {
      id: 'benefit-4',
      title: 'Competitive Compensation',
      body: 'Top-tier global market rates, milestone sprint bonuses, and accelerated career growth into staff architectural roles.',
      icon: 'ShieldCheck',
      orderIndex: 4,
      visible: true,
    },
  ],
  opportunities: {
    heading: 'Current Open Opportunities',
    supportingText: 'Direct applications reviewed within 48 business hours by our engineering founders.',
    searchPlaceholder: 'Search skills, title...',
    emptyStateHeading: 'No Roles Found Matching Criteria',
    emptyStateText: 'No active openings match your current search or filter. Clear the filter or submit a speculative application below.',
  },
  speculativeCta: {
    heading: "Don't See Your Exact Specialty Listed?",
    body: 'If you are a world-class systems engineer, compiler enthusiast, or AI infrastructure architect, we always make room for exceptional talent.',
    buttonText: 'Send Speculative Application',
    visible: true,
  },
  speculativePage: {
    heading: 'Unsolicited & Speculative Engineering Application',
    subtitle: 'We are always seeking exceptional architects, systems engineers, and ambitious fresh talent. Submit your background directly to our engineering founders.',
    noticeText: 'Strict candidate privacy. Your submission is reviewed directly by our founding engineers under strict confidentiality.',
    ctaButtonText: 'Transmit Speculative Application',
    successMessage: 'Thank you for reaching out! Our engineering founders review speculative applications weekly and will connect if an architecture alignment arises.',
  },
  sharedDefaults: {
    interviewHeading: 'Transparent 4-Stage Interview Process',
    interviewIntro: 'Fast, respectful, and zero algorithmic trick questions. We respect your time.',
    interviewStages: [
      {
        num: '01',
        title: 'Profile & Architecture Review',
        desc: 'Our senior architects review your GitHub, past system implementations, and RFCs within 48 business hours.',
      },
      {
        num: '02',
        title: 'Technical & Systems Discussion',
        desc: 'A 45-minute deep-dive with our engineering founders into real-world architecture trade-offs, concurrency, and reliability.',
      },
      {
        num: '03',
        title: 'Practical System Design Exercise',
        desc: 'A scoped, paid system design discussion or take-home RFC tailored to your specialty. No inverted binary trees on whiteboards.',
      },
      {
        num: '04',
        title: 'Mutual Offer & Onboarding',
        desc: 'Transparent compensation offer, equity allocation, home workstation budget setup, and seamless async onboarding.',
      },
    ],
    defaultBenefits: [
      '100% remote work autonomy with flexible hours and zero seat-time bureaucracy.',
      'Top-of-market global base compensation plus meaningful performance incentives.',
      'Home workstation and latest Apple hardware stipend upon joining.',
      'Annual continuous learning & technical conference budget.',
      'Comprehensive health insurance coverage and flexible time-off policy.',
    ],
    referralBonusTitle: 'Know an exceptional architect?',
    referralBonusText: 'We offer a $2,500 referral bonus for successfully placed senior engineers and architects.',
    referralBonusAmount: '$2,500',
    defaultPrivacyCopy: 'By submitting, your data is processed strictly under our NDA protocols and privacy policy. No unsolicited third-party recruiter sharing.',
  },
};

const ENRICHED_JOBS = [
  {
    slug: 'java-full-stack-developer',
    title: 'Java Full-Stack Developer',
    categoryId: 'cat-eng',
    department: 'Engineering',
    employmentType: 'full-time',
    workMode: 'remote',
    geographicLocation: 'India · Remote',
    experienceLevel: 'experienced',
    minExperienceYears: 3,
    maxExperienceYears: 6,
    description: 'Design backend architectures with Java Spring Boot 3, REST APIs, JDBC, and PostgreSQL. Implement SOLID principles, clean modular architectures, and maintain production reliability.',
    skills: ['Java 17/21', 'Spring Boot 3', 'PostgreSQL', 'JDBC', 'React', 'REST APIs', 'Docker', 'Git'],
    responsibilities: [
      'Develop robust, high-throughput microservices using Java 17/21 and Spring Boot 3.',
      'Design optimized relational schemas and execute efficient database queries with PostgreSQL and JDBC.',
      'Build responsive frontend views and dashboards in React and TypeScript.',
      'Apply SOLID principles, design patterns, and automated JUnit/Mockito testing suites.',
      'Manage Git workflows, containerized local environments, and CI/CD deployment pipelines.',
    ],
    requirements: [
      '3+ years of production experience developing enterprise applications with Java and Spring Boot.',
      'Strong expertise in relational databases (PostgreSQL, MySQL), SQL tuning, and connection pooling.',
      'Hands-on proficiency with modern frontend development in React and TypeScript.',
      'Firm grasp of RESTful API contracts, microservices architecture, and clean code principles.',
      'Experience with containerization (Docker) and Git version control.',
    ],
    niceToHave: [
      'Experience with Spring Cloud, Kafka, or RabbitMQ message brokers.',
      'Knowledge of cloud platforms (AWS, GCP) and container orchestration.',
      'Familiarity with GraphQL APIs and Next.js.',
    ],
    benefits: [
      '100% remote work autonomy with flexible hours.',
      'Top-of-market compensation with milestone bonuses.',
      'Comprehensive health insurance and hardware support stipend.',
      'Annual continuous learning and professional certification budget.',
    ],
    useSharedBenefits: true,
    useSharedInterview: true,
    showReferral: true,
    referralBonus: '$2,500',
    showSalary: false,
    orderIndex: 1,
    publishedAt: '2026-10-07T16:29:52.143Z',
  },
  {
    slug: 'senior-full-stack-architect',
    title: 'Senior Full-Stack Architect',
    categoryId: 'cat-eng',
    department: 'Engineering',
    employmentType: 'full-time',
    workMode: 'remote',
    geographicLocation: 'Worldwide · Remote',
    experienceLevel: 'experienced',
    minExperienceYears: 5,
    maxExperienceYears: 10,
    description: 'Lead high-throughput web applications and SaaS portal architectures using Next.js App Router, TypeScript, and Postgres.',
    skills: ['Next.js', 'React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Prisma', 'Tailwind CSS'],
    responsibilities: [
      'Design and build high-concurrency full-stack web applications using Next.js App Router, React Server Components, and TypeScript.',
      'Architect robust PostgreSQL database schemas with Prisma ORM and enforce strict ACID transaction boundaries.',
      'Lead architectural RFCs and system design reviews, rejecting low-quality technical debt in favor of clean modular boundaries.',
      'Partner directly with enterprise clients and technical founders to translate business workflows into deterministic software architectures.',
      'Implement automated end-to-end testing, continuous integration checks, and sub-second page performance optimizations.',
    ],
    requirements: [
      '5+ years of production experience building and deploying modern full-stack web platforms at scale.',
      'Deep mastery of TypeScript, Next.js (App Router), React, and server-side state management patterns.',
      'Proven expertise in relational database design (PostgreSQL), index optimization, and migration pipelines.',
      'Strong understanding of web security fundamentals (CSRF, XSS, OAuth 2.0, RBAC, JWT revocation).',
      'Excellent written communication and asynchronous RFC authoring skills.',
    ],
    niceToHave: [
      'Experience with Rust or Go microservices for performance-critical background tasks.',
      'Familiarity with cloud-native primitives on AWS, Cloudflare Workers, and serverless Docker runtimes.',
      'Prior experience working in high-trust, asynchronous, distributed engineering squads.',
    ],
    benefits: [
      '100% remote work autonomy with flexible hours and no micromanagement.',
      'Top-of-market base compensation plus meaningful equity participation.',
      '$3,500 home office & latest Apple hardware stipend upon joining.',
      'Annual $2,000 continuous learning & technical conference budget.',
      'Comprehensive health coverage & generous paid time off.',
    ],
    useSharedBenefits: true,
    useSharedInterview: true,
    showReferral: true,
    referralBonus: '$2,500',
    showSalary: false,
    orderIndex: 2,
    publishedAt: '2026-09-11T06:35:53.047Z',
  },
  {
    slug: 'ai-systems-llm-engineer',
    title: 'AI Systems & LLM Engineer',
    categoryId: 'cat-ai',
    department: 'AI & Automation',
    employmentType: 'full-time',
    workMode: 'remote',
    geographicLocation: 'Worldwide · Remote',
    experienceLevel: 'experienced',
    minExperienceYears: 3,
    maxExperienceYears: 7,
    description: 'Design and deploy state-of-the-art cognitive agents, hybrid vector retrieval (RAG), and asynchronous task queues.',
    skills: ['Python', 'FastAPI', 'LangChain', 'Vector DBs', 'PyTorch', 'Agentic Workflows'],
    responsibilities: [
      'Architect and deploy multi-agent cognitive pipelines, contextual RAG systems, and autonomous task swarms.',
      'Develop high-throughput asynchronous inference APIs using Python, FastAPI, Redis, and Celery.',
      'Implement hybrid search engines combining dense vector embeddings (Pinecone, pgvector) with BM25 keyword rankings.',
      'Optimize token efficiency, latency budgets, and caching layers across open-source and proprietary foundation models.',
      'Establish automated model evaluation frameworks, regression benchmarks, and hallucination guardrails.',
    ],
    requirements: [
      '3+ years of hands-on experience building production AI, ML, or NLP applications.',
      'Strong programming proficiency in Python, modern async programming, and typed APIs.',
      'Demonstrated experience with embedding models, vector databases (Qdrant, Milvus, pgvector), and retrieval techniques.',
      'Practical understanding of LLM fine-tuning, prompt optimization, and agentic orchestration architectures.',
      'Solid foundations in system architecture, Docker containerization, and cloud deployment.',
    ],
    niceToHave: [
      'Contributions to open-source AI frameworks or published research in retrieval or agent architectures.',
      'Experience with local model deployment using vLLM, TensorRT-LLM, or Ollama.',
      'Knowledge of enterprise compliance standards (SOC-2, HIPAA) for AI data processing.',
    ],
    benefits: [
      'Dedicated cloud compute credits and high-end workstation access for experiments.',
      '100% remote-first autonomy with async-first collaboration.',
      'Competitive salary with generous equity grant.',
      'Comprehensive healthcare, dental, and wellness coverage.',
      'Generous parental leave and flexible paid vacation.',
    ],
    useSharedBenefits: true,
    useSharedInterview: true,
    showReferral: true,
    referralBonus: '$2,500',
    showSalary: false,
    orderIndex: 3,
    publishedAt: '2026-09-11T06:35:53.109Z',
  },
  {
    slug: 'cloud-devops-infrastructure-lead',
    title: 'Cloud & DevOps Infrastructure Lead',
    categoryId: 'cat-cloud',
    department: 'Cloud Ops',
    employmentType: 'full-time',
    workMode: 'remote',
    geographicLocation: 'Worldwide · Remote',
    experienceLevel: 'experienced',
    minExperienceYears: 4,
    maxExperienceYears: 9,
    description: 'Engineer zero-downtime CI/CD pipelines, container orchestration, edge caching on Cloudflare R2, and AWS infrastructure.',
    skills: ['AWS', 'Cloudflare Workers/R2', 'Docker', 'Terraform', 'Turborepo', 'Security Hardening'],
    responsibilities: [
      'Design, provision, and maintain multi-region infrastructure as code using Terraform and AWS / Cloudflare.',
      'Build zero-downtime CI/CD deployment pipelines with automated rollback capabilities and canary releases.',
      'Enforce enterprise cloud security standards, IAM principle of least privilege, and ISO 27001 / SOC-2 compliance.',
      'Configure real-time distributed telemetry, Prometheus/Grafana dashboards, and automated incident response runbooks.',
      'Optimize cloud infrastructure expenditure, implementing auto-scaling policies that cut redundant resource burn.',
    ],
    requirements: [
      '4+ years managing production cloud infrastructure across AWS, GCP, or Cloudflare edge environments.',
      'Proficiency in declarative Infrastructure as Code (Terraform, OpenTofu, AWS CDK).',
      'Hands-on experience with container orchestration (Docker, ECS, EKS) and modern build tooling (Turborepo, GitHub Actions).',
      'Deep understanding of networking, DNS, TLS termination, CDN caching, and edge routing.',
      'Experience participating in on-call rotations with a focus on blameless post-mortems.',
    ],
    niceToHave: [
      'AWS Certified Solutions Architect - Professional or equivalent certification.',
      'Experience securing financial or healthcare environments requiring strict compliance audit trails.',
      'Familiarity with Kubernetes operator patterns and GitOps workflows (ArgoCD / Flux).',
    ],
    benefits: [
      'Work from anywhere in the world with full remote equipment support.',
      'Competitive global compensation with annual performance bonus.',
      'Flexible time-off policy and company-wide recharge weeks.',
      'Access to premium continuous learning platforms and certification sponsorship.',
      'Comprehensive international health insurance coverage.',
    ],
    useSharedBenefits: true,
    useSharedInterview: true,
    showReferral: true,
    referralBonus: '$2,500',
    showSalary: false,
    orderIndex: 4,
    publishedAt: '2026-09-11T06:35:53.112Z',
  },
];

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🔄 Seeding Careers Page Content...');
    // 1. Seed or update page_contents for 'careers'
    await client.query(`
      INSERT INTO page_contents (id, page_key, title, sections, status, created_at, updated_at)
      VALUES (
        gen_random_uuid()::text,
        'careers',
        'Careers & Open Roles',
        $1::jsonb,
        'published',
        NOW(),
        NOW()
      )
      ON CONFLICT (page_key) DO UPDATE
      SET
        title = EXCLUDED.title,
        sections = CASE 
          WHEN page_contents.sections IS NULL OR page_contents.sections = '{}'::jsonb 
          THEN EXCLUDED.sections 
          ELSE page_contents.sections 
        END,
        updated_at = NOW();
    `, [JSON.stringify(DEFAULT_CAREERS_PAGE_SECTIONS)]);
    console.log('✅ Careers page content initialized in page_contents table.');

    // 2. Enrich Job Openings
    console.log('🔄 Enriching existing job openings with full details...');
    for (const job of ENRICHED_JOBS) {
      await client.query(`
        UPDATE job_openings
        SET
          category_id = $1,
          employment_type = $2,
          work_mode = $3,
          geographic_location = $4,
          experience_level = $5,
          min_experience_years = $6,
          max_experience_years = $7,
          description = $8,
          skills = $9,
          responsibilities = $10,
          requirements = $11,
          nice_to_have = $12,
          benefits = $13,
          use_shared_benefits = $14,
          use_shared_interview = $15,
          show_referral = $16,
          referral_bonus = $17,
          show_salary = $18,
          order_index = $19,
          published_at = COALESCE(published_at, $20::timestamp)
        WHERE slug = $21;
      `, [
        job.categoryId,
        job.employmentType,
        job.workMode,
        job.geographicLocation,
        job.experienceLevel,
        job.minExperienceYears,
        job.maxExperienceYears,
        job.description,
        job.skills,
        job.responsibilities,
        job.requirements,
        job.niceToHave,
        job.benefits,
        job.useSharedBenefits,
        job.useSharedInterview,
        job.showReferral,
        job.referralBonus,
        job.showSalary,
        job.orderIndex,
        job.publishedAt,
        job.slug,
      ]);
      console.log(`✔ Enriched opening: ${job.title} (${job.slug})`);
    }

    console.log('🎉 Seeding completed successfully!');
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

seed();
