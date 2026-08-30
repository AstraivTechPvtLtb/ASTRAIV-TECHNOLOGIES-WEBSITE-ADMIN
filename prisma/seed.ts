import { Role } from '@prisma/client';
import { hashPassword } from 'better-auth/crypto';
import { db as prisma } from '../src/db/prisma';

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

  // 13. Create Services
  await prisma.serviceItem.createMany({
    data: [
      {
        title: 'Custom Web Application Development',
        slug: 'custom-web-applications',
        category: 'Engineering',
        shortDesc: 'Ultra-fast Next.js and React full-stack applications engineered for high scale.',
        fullDesc: 'End-to-end web engineering utilizing modern React 19 architecture, PostgreSQL databases, edge middleware, and hardened security practices.',
        features: ['Next.js 16 App Router', 'PostgreSQL & Prisma ORM', 'Real-time WebSockets', 'Tailwind CSS Modern UI'],
        badge: 'Popular',
        icon: 'Code2',
        active: true,
        orderIndex: 1,
      },
      {
        title: 'Cloud Infrastructure & DevOps',
        slug: 'cloud-infrastructure-devops',
        category: 'Cloud',
        shortDesc: 'Automated CI/CD pipelines, container orchestration, and serverless hosting.',
        fullDesc: 'Robust cloud architectures with automated deployment pipelines, Docker & Kubernetes orchestration, CDN edge caching, and 99.99% uptime SLAs.',
        features: ['Automated CI/CD', 'AWS & Cloudflare Edge', 'Zero-Downtime Deployments', '24/7 Monitoring & Alerting'],
        badge: 'Enterprise',
        icon: 'Cloud',
        active: true,
        orderIndex: 2,
      },
      {
        title: 'AI & Business Automation',
        slug: 'ai-business-automation',
        category: 'AI & Data',
        shortDesc: 'Intelligent LLM agent integration, workflow automation, and predictive analytics.',
        fullDesc: 'Empower your enterprise with AI agents, automated customer support pipelines, semantic search, and predictive data intelligence.',
        features: ['Custom LLM Pipelines', 'RAG & Vector Embeddings', 'Workflow Automations', 'Enterprise Data Protection'],
        badge: 'Cutting-Edge',
        icon: 'Cpu',
        active: true,
        orderIndex: 3,
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
