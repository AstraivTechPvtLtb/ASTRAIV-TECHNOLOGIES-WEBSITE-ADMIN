const { Pool } = require('pg');
const { randomUUID } = require('crypto');

const pool = new Pool({
  connectionString: 'postgresql://postgres.cvdiedebmguahkmzkwtd:REDACTED_DATABASE_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('--- Seeding Canonical Legal Documents, FAQs, Awards, Solutions, Industries & Technologies ---');

    // 1. Legal Documents & Revisions
    const privacyDocId = 'doc-privacy-policy';
    const privacyRevId = 'rev-privacy-v1';
    const privacySections = [
      {
        icon: 'Eye',
        title: '1. Information We Collect',
        content: `Astraiv Technologies collects information to provide higher-quality enterprise software, architectural consultations, and platform performance. This includes:
- **Direct Submissions**: Information you voluntarily provide when requesting a software architecture quote, submitting project requirements, applying for an open engineering role, or submitting client feedback (e.g. name, work email address, company name, telephone number, resume files, and project scope).
- **Technical Telemetry**: Information automatically generated through your interaction with our website and client portal, such as IP address, browser type, device identifiers, referring URLs, operating system, and pages visited, captured via privacy-focused telemetry.
- **Client Engagement Data**: For contracted enterprise clients, project specifications, architectural repositories, ticket communications, and billing metrics managed through encrypted database connections.`
      },
      {
        icon: 'Database',
        title: '2. How We Use Your Information',
        content: `We utilize gathered information exclusively for legitimate business, architectural, and contractual purposes:
- Delivering, operating, testing, and optimizing custom software engineering platforms.
- Responding to project inquiries, preparing commercial proposals, and scheduling technical discovery sessions.
- Administering client portal accounts, support tickets, and role-based access controls.
- Complying with regulatory, tax, accounting, and institutional security mandates.
- Evaluating engineering job applicants and scheduling founder interviews.
- Protecting our systems against unauthorized access, credential stuffing, DDoS attacks, and security vulnerabilities.`
      },
      {
        icon: 'Lock',
        title: '3. Data Security & Storage Standards',
        content: `Astraiv adheres to strict institutional security benchmarks:
- **Encryption**: All data in transit is encrypted using modern TLS 1.3 cryptographic suites. Persistent data at rest is encrypted using AES-256 standards across PostgreSQL clusters and Cloudflare R2 object storage.
- **Access Control**: Strict principle of least privilege (PoLP) and multi-factor authentication (MFA) govern developer and system access to production databases.
- **Tenant Isolation**: Client data in multi-tenant environments is segregated through Row-Level Security (RLS) policies and dedicated tenant partitions.
- **Data Retention**: We retain commercial records and communication logs only as long as necessary to satisfy contractual obligations or statutory requirements.`
      },
      {
        icon: 'Globe',
        title: '4. Third-Party Sub-Processors',
        content: `We partner with world-class, SOC-2 compliant cloud infrastructure providers to host and secure our platforms:
- **Cloud Infrastructure**: Amazon Web Services (AWS) and Cloudflare for global edge delivery, caching, and CDN routing.
- **Database & Persistence**: Managed PostgreSQL via Supabase and dedicated VPC database clusters.
- **Analytics & Telemetry**: Google Analytics 4 (configured with IP anonymization) to monitor Core Web Vitals and site usability.
We do not sell, rent, or monetize client or visitor data to third-party data brokers or marketing conglomerates.`
      },
      {
        icon: 'ShieldCheck',
        title: '5. Your Rights (GDPR & CCPA Compliance)',
        content: `Depending on your jurisdiction, you have statutory privacy rights regarding your personal information:
- **Access & Portability**: Request a copy of the personal information we maintain concerning you in a structured, machine-readable format.
- **Correction & Rectification**: Request correction of any incomplete or inaccurate data.
- **Erasure ("Right to be Forgotten")**: Request deletion of your personal records, subject to ongoing legal or contractual record-retention requirements.
- **Objection & Restriction**: Object to our processing of your personal data or request restricted processing.
To exercise any of these rights, contact our Data Governance team at privacy@astraivtechnologies.com.`
      },
      {
        icon: 'Mail',
        title: '6. Contact & Data Governance Officer',
        content: `If you have questions, concerns, or requests regarding this Privacy Policy or our security posture, please reach out directly:
- **Email**: privacy@astraivtechnologies.com / info@astraivtechnologies.com
- **Mailing Address**: Astraiv Technologies, Ashoknagar, Kolkata, West Bengal, India
- **Response SLA**: Inquiries are reviewed and answered within 48 business hours.`
      }
    ];

    await client.query(`
      INSERT INTO "legal_documents" ("id", "slug", "title", "description", "current_revision_id")
      VALUES ($1, 'privacy', 'Privacy Policy', 'Data governance, telemetry management, and client privacy commitments.', $2)
      ON CONFLICT ("slug") DO UPDATE SET "title" = EXCLUDED."title", "current_revision_id" = EXCLUDED."current_revision_id";
    `, [privacyDocId, privacyRevId]);

    await client.query(`
      INSERT INTO "legal_revisions" (
        "id", "document_id", "document_slug", "version_number", "effective_date", "title", "summary", "sections", "status", "author_name", "published_at"
      ) VALUES ($1, $2, 'privacy', 1, 'September 2026', 'Privacy Policy', 'Initial canonical baseline revision matching production client policy.', $3, 'published', 'Astraiv Legal & Compliance', NOW())
      ON CONFLICT ("id") DO NOTHING;
    `, [privacyRevId, privacyDocId, JSON.stringify(privacySections)]);

    const termsDocId = 'doc-terms-of-service';
    const termsRevId = 'rev-terms-v1';
    const termsSections = [
      {
        icon: 'FileText',
        title: '1. Engagement Scope & Master Service Agreements',
        content: `Astraiv Technologies provides high-performance custom software engineering, AI intelligent systems, distributed cloud architecture, and technical consulting services.
- **Statement of Work (SOW)**: Each client engagement is governed by a dedicated Statement of Work or commercial proposal defining deliverables, architectural milestones, technology stacks, pricing, and delivery timelines.
- **Mutual Agreement**: Engaging Astraiv or executing an SOW constitutes binding acceptance of these Terms of Service alongside any custom Master Services Agreement (MSA) executed between the parties.`
      },
      {
        icon: 'Award',
        title: '2. Intellectual Property & Ownership Rights',
        content: `We believe in unconditional, unencumbered client ownership:
- **100% Client Ownership**: Upon full payment of milestone fees, all bespoke source code, UI/UX designs, database schemas, and custom algorithms developed specifically for the client transfer completely and exclusively to the client.
- **Pre-Existing Frameworks & Boilerplates**: Astraiv retains ownership of its internal reusable engineering libraries, development toolchains, and open-source contributions. The client is granted a perpetual, irrevocable, royalty-free, worldwide license to utilize and modify any incorporated Astraiv frameworks within their bespoke application.
- **No Vendor Lock-In**: We construct platforms with standard, documented, cloud-native technologies (Next.js, Node.js, PostgreSQL, Docker, Kubernetes) ensuring clients can independently host, deploy, and maintain their codebases.`
      },
      {
        icon: 'ShieldAlert',
        title: '3. Confidentiality & Non-Disclosure (NDA)',
        content: `Astraiv treats all proprietary client information with institutional rigor:
- **Mutual Non-Disclosure**: All trade secrets, architectural schematics, business roadmaps, client data, and proprietary algorithms shared during discovery or execution are protected under strict mutual confidentiality.
- **Code & Credential Isolation**: Developer access to client repositories, staging environments, and production systems is governed by role-based credentials, SSH keys, and encrypted secret vaults. Astraiv developers never share or commit private client keys or customer data to public repositories.`
      },
      {
        icon: 'CheckCircle2',
        title: '4. Delivery Milestones, Invoicing & Acceptance',
        content: `Project milestones adhere to structured engineering sprints:
- **Sprint Reviews & Demo Sign-Off**: Deliverables are deployed to staging environments for client validation. Clients have an agreed acceptance window (typically 10 business days) to review features and submit revision requests.
- **Payment Terms**: Invoices for milestone phases or dedicated monthly retainer sprints are payable within the net terms defined in the SOW (typically Net-15 or Net-30). Late payments may result in temporary staging deployment freezes.
- **Warranty & Hypercare**: Astraiv includes a 30 to 90-day post-launch warranty window (as defined in the SOW) to rectify any functional defects or deviations from approved specifications at zero additional charge.`
      },
      {
        icon: 'RefreshCw',
        title: '5. Service Level Agreements (SLAs) & Hosting Availability',
        content: `For clients engaging Astraiv for DevOps, Cloud Architecture, and Managed Infrastructure:
- **High-Availability Targets**: We engineer systems targeting 99.9% uptime across multi-region cloud infrastructures (AWS, Cloudflare, Supabase, Google Cloud).
- **Incident Response Levels**: P1 critical production outages are prioritized with initial technical response within 1 hour. P2 and P3 issues are addressed within standard business hours as dictated by the support agreement.
- **Third-Party Outages**: Astraiv is not liable for infrastructure downtime caused by global outages of upstream cloud providers (e.g. AWS regional power losses, Cloudflare global edge degradation).`
      },
      {
        icon: 'Scale',
        title: '6. Limitation of Liability & Governing Law',
        content: `To the maximum extent permitted by applicable law:
- **Liability Cap**: In no event shall either party's total aggregate liability arising out of or related to these Terms exceed the total fees paid by the client under the specific Statement of Work giving rise to the claim.
- **Consequential Damages**: Neither party shall be liable for indirect, incidental, punitive, or consequential damages (including loss of profits or data interruptions).
- **Governing Law**: These Terms and any dispute arising hereunder shall be governed by and construed in accordance with the laws of West Bengal, India, without regard to conflict of law principles. Parties agree to submit to the jurisdiction of competent courts in Kolkata, India, or mutually agreed international arbitration.`
      },
      {
        icon: 'Mail',
        title: '7. Inquiries & Legal Notices',
        content: `Legal notices, contractual revisions, or enterprise MSA inquiries should be addressed to:
- **Email**: legal@astraivtechnologies.com / info@astraivtechnologies.com
- **Corporate Entity**: Astraiv Technologies, Ashoknagar, Kolkata, West Bengal, India.`
      }
    ];

    await client.query(`
      INSERT INTO "legal_documents" ("id", "slug", "title", "description", "current_revision_id")
      VALUES ($1, 'terms', 'Terms of Service', 'Master commercial framework, IP rights assignment, and warranty standards.', $2)
      ON CONFLICT ("slug") DO UPDATE SET "title" = EXCLUDED."title", "current_revision_id" = EXCLUDED."current_revision_id";
    `, [termsDocId, termsRevId]);

    await client.query(`
      INSERT INTO "legal_revisions" (
        "id", "document_id", "document_slug", "version_number", "effective_date", "title", "summary", "sections", "status", "author_name", "published_at"
      ) VALUES ($1, $2, 'terms', 1, 'September 2026', 'Terms of Service', 'Initial canonical baseline revision matching production client terms.', $3, 'published', 'Astraiv Legal & Compliance', NOW())
      ON CONFLICT ("id") DO NOTHING;
    `, [termsRevId, termsDocId, JSON.stringify(termsSections)]);

    console.log('✔ Privacy Policy and Terms of Service seeded.');

    // 2. FAQs
    const faqs = [
      {
        id: 'core-services',
        category: 'general',
        question: 'What core services does Astraiv Technologies provide?',
        answer: 'Astraiv Technologies provides end-to-end technology solutions: AI & machine learning integrations (multi-agent workflows, enterprise RAG), custom software development, high-velocity Next.js web applications, cross-platform mobile apps (iOS/Android), cloud infrastructure & DevOps, and legacy system modernization.',
        is_featured: true,
        order_index: 1
      },
      {
        id: 'start-project',
        category: 'general',
        question: 'How can we start a project with Astraiv Technologies?',
        answer: 'You can reach out directly via our contact form, email us at info@astraivtechnologies.com, or call +91 8167409664. We typically arrange an initial 30-minute discovery call within 24 hours to review your requirements and provide an architecture estimate.',
        is_featured: true,
        order_index: 2
      },
      {
        id: 'custom-software',
        category: 'services',
        question: 'Can Astraiv build custom enterprise software completely from scratch?',
        answer: 'Yes. We architect, design, and code bespoke systems from greenfield state through production deployment. Our senior full-stack architects establish scalable database schemas, microservices, and typesafe APIs engineered specifically for your core business operations.',
        is_featured: true,
        order_index: 3
      },
      {
        id: 'ai-integration',
        category: 'services',
        question: 'Do you provide enterprise AI integration services?',
        answer: 'Absolutely. We specialize in practical, production-ready AI capabilities. This includes connecting your internal databases to LLMs with pgvector RAG, deploying autonomous multi-agent task runners, and fine-tuning open-source models with zero data retention or third-party leakage.',
        is_featured: true,
        order_index: 4
      },
      {
        id: 'legacy-modernization',
        category: 'engineering',
        question: 'Can you modernize our existing legacy application?',
        answer: 'Yes. We frequently help organizations migrate legacy monoliths, slow databases, and outdated codebases to modern serverless architectures (Next.js, TypeScript, PostgreSQL, and AWS/Cloudflare). We execute migrations incrementally to ensure zero downtime for your active users.',
        is_featured: true,
        order_index: 5
      },
      {
        id: 'process-communication',
        category: 'process',
        question: 'How does the project development process and communication work?',
        answer: 'We follow our disciplined 6-stage roadmap: Discover, Strategize, Design, Build, Launch, and Scale. Clients receive access to our real-time Astraiv Client Portal to review live sprint boards, milestone releases, and communicate directly with dedicated senior architects.',
        is_featured: true,
        order_index: 6
      },
      {
        id: 'ip-ownership',
        category: 'pricing',
        question: 'Who owns the intellectual property and source code?',
        answer: 'You do. 100% of the repository code, technical documentation, design assets, and architectural configurations are transferred directly to your organization upon project milestones and completion.',
        is_featured: true,
        order_index: 7
      },
      {
        id: 'pricing-structure',
        category: 'pricing',
        question: 'How are engagement costs structured and billed?',
        answer: 'We offer flexible engagement models: Fixed-Price Milestone deliverables with clear acceptance criteria, Two-Week Agile Sprint retainers for dynamic product roadmaps, and Dedicated Squads for enterprise scale. All contracts feature transparent deliverables with zero hidden surcharges.',
        is_featured: true,
        order_index: 8
      },
      {
        id: 'warranty-guarantee',
        category: 'pricing',
        question: 'Do you provide a post-launch warranty and SLA support?',
        answer: 'Yes. Every production delivery includes a 30 to 90-day comprehensive defect warranty. We also provide ongoing SLA maintenance packages covering 24/7 telemetry monitoring, security patching, and proactive performance optimization.',
        is_featured: true,
        order_index: 9
      },
      {
        id: 'currencies-invoicing',
        category: 'pricing',
        question: 'What currencies and international payment methods do you support?',
        answer: 'We accept global electronic wire transfers (ACH, SEPA, SWIFT), corporate credit cards, and multi-currency invoicing in USD ($), EUR (€), GBP (£), and INR (₹) with transparent localized pricing.',
        is_featured: false,
        order_index: 10
      }
    ];

    for (const faq of faqs) {
      await client.query(`
        INSERT INTO "faqs" ("id", "category", "question", "answer", "is_featured", "status", "order_index")
        VALUES ($1, $2, $3, $4, $5, 'published', $6)
        ON CONFLICT ("id") DO UPDATE SET "question" = EXCLUDED."question", "answer" = EXCLUDED."answer";
      `, [faq.id, faq.category, faq.question, faq.answer, faq.is_featured, faq.order_index]);
    }
    console.log(`✔ ${faqs.length} Canonical FAQs seeded.`);

    // 3. Awards & Accolades (Trust items)
    const awards = [
      {
        id: 'iso-27001',
        type: 'certification',
        title: 'ISO 27001:2022 Certified Information Security',
        organization: 'International Organization for Standardization',
        year: '2026',
        category: 'Security Governance',
        description: 'Audited information security management system (ISMS) governing client intellectual property, data encryption, and access controls.',
        achievement: 'Zero non-conformities during third-party surveillance audit.',
        verification_url: 'https://www.iso.org/standard/27001',
        verification_label: 'Verify Certificate',
        badge_text: 'ISO 27001:2022',
        status: 'verified',
        icon: 'ShieldCheck',
        order_index: 1,
        highlights: ['AES-256 Data-at-Rest Encryption', 'Mandatory 2FA & Least Privilege Access', 'Continuous Vulnerability Scans']
      },
      {
        id: 'soc2-compliance',
        type: 'certification',
        title: 'SOC-2 Type II Attestation Ready',
        organization: 'AICPA Standards',
        year: '2026',
        category: 'Cloud Compliance',
        description: 'Comprehensive evaluation of internal controls regarding security, availability, processing integrity, and confidentiality.',
        achievement: 'Strict adherence to Trust Services Criteria across all VPC environments.',
        verification_url: 'https://www.aicpa.org/soc4so',
        verification_label: 'View Security Posture',
        badge_text: 'SOC-2 Type II',
        status: 'verified',
        icon: 'Lock',
        order_index: 2,
        highlights: ['Isolated Multi-Tenant Databases', 'Automated CI/CD Security Gates', 'Quarterly Third-Party Penetration Tests']
      },
      {
        id: 'aws-advanced-partner',
        type: 'partnership',
        title: 'AWS Select Tier Services Partner',
        organization: 'Amazon Web Services',
        year: '2025',
        category: 'Cloud Architecture',
        description: 'Accredited technical proficiency in AWS Well-Architected Framework, multi-region ECS/EKS clusters, and serverless architectures.',
        achievement: '50+ Enterprise production deployments with zero architectural downtime.',
        verification_url: 'https://aws.amazon.com/partners/',
        verification_label: 'Partner Network Profile',
        badge_text: 'AWS Partner',
        status: 'contractual',
        icon: 'Cloud',
        order_index: 3,
        highlights: ['Certified Solutions Architects', 'Well-Architected Review Certified', 'Direct Tier-2 Enterprise AWS Support']
      },
      {
        id: 'clutch-top-developer',
        type: 'recognition',
        title: 'Top Custom Software Developers 2026',
        organization: 'Clutch B2B Ratings',
        year: '2026',
        category: 'Industry Excellence',
        description: 'Ranked top enterprise engineering boutique based on verified client reviews, project delivery velocity, and architectural quality.',
        achievement: '5.0 / 5.0 Star Rating across 20+ verified client enterprise reviews.',
        verification_url: 'https://clutch.co',
        verification_label: 'Read Clutch Reviews',
        badge_text: '5.0 / 5.0 Rated',
        status: 'verified',
        icon: 'Star',
        order_index: 4,
        highlights: ['100% On-Time SLA Delivery', '98% Client Net Promoter Score', 'Zero Vendor Lock-In Guarantee']
      }
    ];

    for (const award of awards) {
      await client.query(`
        INSERT INTO "awards" (
          "id", "type", "title", "organization", "year", "category", "description", "achievement",
          "verification_url", "verification_label", "badge_text", "status", "icon", "highlights", "published", "featured", "order_index"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true, true, $15)
        ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "description" = EXCLUDED."description";
      `, [
        award.id, award.type, award.title, award.organization, award.year, award.category,
        award.description, award.achievement, award.verification_url, award.verification_label,
        award.badge_text, award.status, award.icon, award.highlights, award.order_index
      ]);
    }
    console.log(`✔ ${awards.length} Canonical Awards & Trust items seeded.`);

    // 4. Solutions
    const solutions = [
      {
        id: 'sol-intelligent-systems',
        slug: 'intelligent-systems',
        title: 'AI & Intelligent Systems',
        category: 'intelligent-systems',
        category_label: 'Artificial Intelligence',
        tagline: 'Autonomous AI agents, enterprise RAG, and private model orchestration.',
        short_desc: 'Deploy high-security, custom AI workflows connected directly to your proprietary enterprise databases with zero training data leakage.',
        full_desc: 'We architect and build enterprise-grade intelligence layers. From autonomous multi-agent task engines to private retrieval-augmented generation (RAG) pipelines on pgvector, we transform unstructured company knowledge into secure, real-time automated workflows.',
        metric_value: '85%',
        metric_label: 'Manual Workflow Reduction',
        features: ['Enterprise pgvector RAG Pipeline', 'Autonomous Agent Orchesration', 'Private On-Premise LLM Fine-Tuning', 'Multi-Modal Vision & Document Parsing'],
        technologies: ['Python', 'PyTorch', 'LangChain', 'FastAPI', 'PostgreSQL', 'Next.js'],
        order_index: 1
      },
      {
        id: 'sol-enterprise-modernization',
        slug: 'enterprise-modernization',
        title: 'Enterprise Modernization',
        category: 'enterprise-modernization',
        category_label: 'Architecture Modernization',
        tagline: 'Incremental migration from legacy monoliths to resilient microservices.',
        short_desc: 'Modernize legacy codebases, monolithic databases, and slow workflows without operational downtime or data loss.',
        full_desc: 'Legacy systems slow development velocity and increase infrastructure overhead. We apply the strangler fig migration pattern, transforming legacy systems into modular, type-safe Next.js and Go/Node.js microservices with automated CI/CD pipelines.',
        metric_value: '40%+',
        metric_label: 'Infrastructure Cost Savings',
        features: ['Zero-Downtime Database Migration', 'Type-Safe API Gateways', 'Modular Microservice Architecture', 'Automated Test Coverage > 90%'],
        technologies: ['TypeScript', 'Next.js', 'Go', 'Docker', 'PostgreSQL', 'Redis'],
        order_index: 2
      },
      {
        id: 'sol-distributed-systems',
        slug: 'distributed-systems',
        title: 'Distributed Cloud Architecture',
        category: 'distributed-systems',
        category_label: 'Cloud & Infrastructure',
        tagline: 'Multi-region, sub-millisecond edge infrastructure designed for 99.99% uptime.',
        short_desc: 'Architect global, fault-tolerant distributed systems capable of processing millions of concurrent events.',
        full_desc: 'Modern applications require real-time processing and global scalability. We design geo-distributed serverless and Kubernetes architectures with automated autoscaling, multi-region database failover, and Cloudflare edge caching.',
        metric_value: '99.99%',
        metric_label: 'Audited Server Uptime',
        features: ['Global CDN & Edge Compute', 'Kubernetes & Docker Container Orchestration', 'Multi-Region PostgreSQL Replication', 'Real-Time Telemetry & Prometheus Alerts'],
        technologies: ['AWS', 'Cloudflare', 'Kubernetes', 'Docker', 'PostgreSQL', 'Kafka'],
        order_index: 3
      },
      {
        id: 'sol-security-governance',
        slug: 'security-governance',
        title: 'Security & Data Governance',
        category: 'security-governance',
        category_label: 'Security & Compliance',
        tagline: 'Institutional security, Row-Level Security, and ISO 27001 standards.',
        short_desc: 'Protect customer records and company data with hardware-backed encryption, RBAC, and SOC-2 compliance.',
        full_desc: 'Security cannot be an afterthought. We implement cryptographic data protection in transit and at rest, automated security scanning in CI/CD, granular PostgreSQL Row-Level Security (RLS) policies, and immutable audit logs.',
        metric_value: '100%',
        metric_label: 'Audit Pass Rate',
        features: ['AES-256 & TLS 1.3 End-to-End Encryption', 'PostgreSQL Row-Level Security (RLS)', 'Automated SAST & DAST Security Gates', 'GDPR / CCPA / HIPAA Data Isolation'],
        technologies: ['PostgreSQL', 'Supabase', 'Vault', 'Cloudflare', 'OpenFGA'],
        order_index: 4
      }
    ];

    for (const sol of solutions) {
      await client.query(`
        INSERT INTO "solutions" (
          "id", "slug", "title", "category", "category_label", "tagline", "short_desc", "full_desc",
          "metric_value", "metric_label", "features", "technologies", "active", "status", "featured", "order_index"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, 'published', true, $13)
        ON CONFLICT ("slug") DO UPDATE SET "title" = EXCLUDED."title", "short_desc" = EXCLUDED."short_desc";
      `, [
        sol.id, sol.slug, sol.title, sol.category, sol.category_label, sol.tagline,
        sol.short_desc, sol.full_desc, sol.metric_value, sol.metric_label,
        sol.features, sol.technologies, sol.order_index
      ]);
    }
    console.log(`✔ ${solutions.length} Canonical Solutions seeded.`);

    // 5. Industries
    const industries = [
      {
        id: 'ind-healthcare',
        slug: 'healthcare-life-sciences',
        label: 'Healthcare & Life Sciences',
        tagline: 'HIPAA-compliant clinical workflows, diagnostic AI, and telemetry.',
        headline: 'Secure Medical Informatics & Telehealth Platforms',
        image: '/images/industries/healthcare.webp',
        image_alt: 'Healthcare & Life Sciences Software',
        accent_color: '#3b82f6',
        compliance_badge: 'HIPAA & ISO 27001 Compliant',
        challenge: 'Healthcare systems face severe data fragmentation, legacy EHR interfaces, and strict regulatory penalties for data leakage.',
        solution: 'We construct end-to-end encrypted medical software with role-based clinical permissions, FHIR interoperability, and real-time patient vitals telemetry.',
        tech_stack: ['Next.js', 'TypeScript', 'PostgreSQL', 'FastAPI', 'AWS HealthLake', 'Docker'],
        order_index: 1
      },
      {
        id: 'ind-fintech',
        slug: 'fintech-banking',
        label: 'Fintech & Digital Banking',
        tagline: 'High-frequency transaction processing and SOC-2 security.',
        headline: 'Next-Generation Banking & Payment Processing Architecture',
        image: '/images/industries/fintech.webp',
        image_alt: 'Fintech Software Engineering',
        accent_color: '#10b981',
        compliance_badge: 'PCI-DSS & SOC-2 Ready',
        challenge: 'Financial platforms require sub-millisecond transaction execution, audit immutability, and zero tolerance for balance discrepancies.',
        solution: 'We build ACID-compliant double-entry ledger engines, automated KYC verification pipelines, and AI-powered transaction anomaly detection.',
        tech_stack: ['Go', 'Next.js', 'PostgreSQL', 'Kafka', 'Redis', 'AWS'],
        order_index: 2
      },
      {
        id: 'ind-logistics',
        slug: 'logistics-supply-chain',
        label: 'Logistics & Supply Chain',
        tagline: 'Real-time fleet tracking, automated routing, and warehouse management.',
        headline: 'Intelligent Supply Chain & Multi-Modal Fleet Telematics',
        image: '/images/industries/logistics.webp',
        image_alt: 'Logistics & Supply Chain Management',
        accent_color: '#f59e0b',
        compliance_badge: '99.99% Telemetry Uptime',
        challenge: 'Supply chains suffer from blind-spot tracking delays, route inefficiencies, and manual dispatch bottlenecks.',
        solution: 'We engineer real-time WebSocket telemetry engines, automated vehicle route optimization algorithms, and inventory ERP platforms.',
        tech_stack: ['TypeScript', 'Next.js', 'Node.js', 'PostgreSQL', 'Cloudflare', 'Mapbox'],
        order_index: 3
      },
      {
        id: 'ind-saas',
        slug: 'saas-digital-platforms',
        label: 'Enterprise SaaS & Cloud Platforms',
        tagline: 'Multi-tenant architecture, automated billing, and high-velocity UI.',
        headline: 'Scalable Multi-Tenant Platforms for High-Growth Startups & Enterprises',
        image: '/images/industries/saas.webp',
        image_alt: 'Enterprise SaaS Platforms',
        accent_color: '#8b5cf6',
        compliance_badge: 'Multi-Tenant RLS Isolated',
        challenge: 'SaaS platforms struggle with tenant data separation, subscription lifecycle management, and scalable cloud performance.',
        solution: 'We develop multi-tenant SaaS foundations with PostgreSQL Row-Level Security, Stripe billing integration, and sub-100ms API response times.',
        tech_stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'PostgreSQL', 'Supabase'],
        order_index: 4
      }
    ];

    for (const ind of industries) {
      await client.query(`
        INSERT INTO "industries" (
          "id", "slug", "label", "tagline", "headline", "image", "image_alt", "accent_color",
          "compliance_badge", "challenge", "solution", "tech_stack", "active", "status", "featured", "order_index"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, 'published', true, $13)
        ON CONFLICT ("slug") DO UPDATE SET "label" = EXCLUDED."label", "tagline" = EXCLUDED."tagline";
      `, [
        ind.id, ind.slug, ind.label, ind.tagline, ind.headline, ind.image, ind.image_alt,
        ind.accent_color, ind.compliance_badge, ind.challenge, ind.solution, ind.tech_stack, ind.order_index
      ]);
    }
    console.log(`✔ ${industries.length} Canonical Industries seeded.`);

    // 6. Technologies
    const technologies = [
      { id: 'tech-nextjs', name: 'Next.js 16', slug: 'nextjs', category: 'Frontend & Frameworks', icon: 'Globe', description: 'Production App Router with React Server Components and ISR caching.' },
      { id: 'tech-react', name: 'React 19', slug: 'react', category: 'Frontend & Frameworks', icon: 'Code2', description: 'Declarative component architecture with modern concurrent features.' },
      { id: 'tech-typescript', name: 'TypeScript', slug: 'typescript', category: 'Languages & Core', icon: 'FileText', description: 'Strict end-to-end static type safety from database schema to UI.' },
      { id: 'tech-python', name: 'Python', slug: 'python', category: 'Languages & Core', icon: 'Terminal', description: 'High-performance AI, data science, and asynchronous microservices.' },
      { id: 'tech-postgresql', name: 'PostgreSQL', slug: 'postgresql', category: 'Databases & Persistence', icon: 'Database', description: 'ACID-compliant relational database with pgvector and Row-Level Security.' },
      { id: 'tech-docker', name: 'Docker', slug: 'docker', category: 'DevOps & Cloud', icon: 'Layers', description: 'Containerized reproducible microservice deployments.' },
      { id: 'tech-kubernetes', name: 'Kubernetes', slug: 'kubernetes', category: 'DevOps & Cloud', icon: 'Cpu', description: 'Automated container scaling, zero-downtime rolling deploys, and self-healing.' },
      { id: 'tech-aws', name: 'AWS Cloud', slug: 'aws', category: 'DevOps & Cloud', icon: 'Cloud', description: 'Enterprise cloud infrastructure (ECS, RDS, S3, CloudFront, Lambda).' },
      { id: 'tech-cloudflare', name: 'Cloudflare', slug: 'cloudflare', category: 'DevOps & Cloud', icon: 'Shield', description: 'Global edge network, DDoS protection, CDN caching, and R2 storage.' }
    ];

    for (let i = 0; i < technologies.length; i++) {
      const tech = technologies[i];
      await client.query(`
        INSERT INTO "technologies" (
          "id", "name", "slug", "category", "icon", "description", "active", "status", "featured", "order_index"
        ) VALUES ($1, $2, $3, $4, $5, $6, true, 'published', true, $7)
        ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description";
      `, [tech.id, tech.name, tech.slug, tech.category, tech.icon, tech.description, i + 1]);
    }
    console.log(`✔ ${technologies.length} Canonical Technologies seeded.`);

    console.log('--- Canonical Legal & CMS Seeding Complete ---');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
