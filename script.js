// --- App State ---
const state = {
    apiKey: localStorage.getItem('prepai_api_key') || '',
    engine: localStorage.getItem('prepai_engine') || 'ollama',
    model: localStorage.getItem('prepai_model') || 'gemini-1.5-flash',
    ollamaUrl: localStorage.getItem('prepai_ollama_url') || 'http://localhost:11434',
    ollamaModel: localStorage.getItem('prepai_ollama_model') || 'gemma3',
    history: JSON.parse(localStorage.getItem('prepai_history')) || [],
    currentPlan: null,
    
    // Teleprompter state
    prompter: {
        isRunning: false,
        timer: null,
        scrollInterval: null,
        seconds: 0,
        speed: 3, // 1 to 10 scale
        fontSize: 32 // px
    }
};

// --- Local Fallback Database ---
const LOCAL_DATABASES = {
    frontend: {
        matchScore: 88,
        roleAnalysis: {
            industry: "Software Engineering / Web Development",
            roleType: "Frontend Engineer",
            hardSkills: ["React & Hooks", "TypeScript", "CSS Grid & Flexbox", "State Management"],
            softSkills: ["Cross-Functional Collaboration", "UX Sensibility", "Constructive Code Reviews"],
            topCompetencies: ["UI Component Architecture", "Web Performance Optimization", "Accessibility (a11y)"]
        },
        skills: {
            tech: [
                { name: "React & Hooks", level: "Expert", importance: 95 },
                { name: "TypeScript", level: "Intermediate", importance: 90 },
                { name: "CSS Grid & Flexbox", level: "Expert", importance: 85 },
                { name: "State Management (Zustand/Redux)", level: "Intermediate", importance: 80 },
                { name: "Web Performance & Core Web Vitals", level: "Intermediate", importance: 75 },
                { name: "Accessibility (a11y / WCAG)", level: "Entry", importance: 70 }
            ],
            soft: [
                { name: "Cross-Functional Collaboration", level: "High", importance: 90 },
                { name: "UX Sensibility & Attention to Detail", level: "High", importance: 85 },
                { name: "Constructive Code Reviews", level: "High", importance: 80 }
            ]
        },
        technicalQuestions: [
            {
                question: "How do you optimize the loading and rendering performance of a React application?",
                difficulty: "hard",
                category: "Performance",
                answer: "1. **Code Splitting**: Use dynamic imports via `React.lazy` and `Suspense` to break bundles into smaller chunks loaded on demand.\n2. **Avoid Unnecessary Re-renders**: Implement `React.memo` for expensive functional components, and use `useMemo` / `useCallback` to cache computations and function references.\n3. **Virtualize Large Lists**: Use libraries like `react-window` or `react-virtualized` to only render items currently visible in the viewport.\n4. **Optimize Images & Assets**: Serve responsive modern images (WebP), lazy-load offscreen media, and compress assets.\n5. **Analyze Bundle**: Use tools like `Webpack Bundle Analyzer` to inspect and purge bloated node_modules dependencies."
            },
            {
                question: "Explain the Critical Rendering Path (CRP) and how you optimize it.",
                difficulty: "medium",
                category: "Browser Concepts",
                answer: "The Critical Rendering Path is the sequence of steps the browser takes to convert HTML, CSS, and JS into pixels on screen: HTML -> DOM, CSS -> CSSOM, combine into Render Tree, Layout (reflow), and Paint.\n\n**Optimization Strategies**:\n- **Minimize Render-Blocking Resources**: Inline critical CSS, media query tags for CSS files, defer/async non-critical JS.\n- **Optimize DOM Depth**: Keep HTML semantic and flat to reduce layout computations.\n- **Preload Critical Assets**: Use `<link rel='preload'>` for fonts and crucial hero images."
            },
            {
                question: "How do you manage complex global state in a large client-side application?",
                difficulty: "medium",
                category: "Architecture",
                answer: "1. **Avoid Over-engineering**: Keep state local (`useState`) or lift it up to shared parent nodes if only a few components share it.\n2. **Context API**: Use for low-frequency global updates (e.g., UI theme, user session credentials) to avoid context re-render thrashing.\n3. **External Stores (Zustand/Redux)**: Use unidirectional data-store patterns for complex business state with high-frequency updates.\n4. **Server Cache Libraries**: Leverage `React Query` or `RTK Query` to manage server-synchronized states, separating networking cache from purely client-side UI states."
            },
            {
                question: "What is the difference between debouncing and throttling? Write a basic debounce helper.",
                difficulty: "medium",
                category: "Coding",
                answer: "**Debouncing** groups multiple rapid calls into a single execution that runs after a quiet interval. Useful for search autocomplete queries.\n**Throttling** limits the execution of a function to at most once per defined time window. Useful for scroll/resize listener handlers.\n\n```javascript\nfunction debounce(func, wait) {\n  let timeout;\n  return function(...args) {\n    clearTimeout(timeout);\n    timeout = setTimeout(() => func.apply(this, args), wait);\n  };\n}\n```"
            },
            {
                question: "How do you ensure web accessibility (a11y) in custom interactive components?",
                difficulty: "hard",
                category: "Web Core",
                answer: "1. **Semantic HTML**: Favor `<button>`, `<dialog>` over generic elements whenever possible.\n2. **Keyboard Access**: Ensure all elements are reachable via `Tab`, support `Enter` and `Space` triggers, and handle focus trapping inside modals.\n3. **ARIA Roles**: Assign proper labels (`aria-label`, `aria-describedby`) and states (`aria-expanded`, `aria-hidden`) so screen readers understand dynamic states.\n4. **Contrast & Testing**: Maintain a 4.5:1 ratio for normal text and perform testing with screen readers (NVDA/VoiceOver) and keyboard-only runs."
            }
        ],
        behavioralQuestions: [
            {
                question: "Tell me about a time you had to resolve a technical disagreement with a designer or product manager.",
                situation: "During a major user onboarding revamp, the design team proposed an immersive complex animation sequence that would add 2.5MB of asset baggage and increase TTI by 2 seconds.",
                task: "As the lead frontend engineer, I needed to protect application load speeds while fulfilling the designer's visual vision.",
                action: "I arranged a collaborative sandbox session. I created two quick prototypes: one using the full asset-heavy animation, and another using an optimized CSS-driven animation that weighed just 45KB. I showed them side-by-side on low-end mobile devices to visually demonstrate the responsiveness gap.",
                result: "The product manager saw the high drop-off risk on mobile. The designer agreed to the lightweight CSS alternative. The launch was successful, and our onboarding completion rate improved by 15% with zero performance lag.",
                sampleAnswer: "At my previous company, we were redesigning our core registration flow. The lead designer wanted an intricate, video-background animation. I knew this would severely impact our mobile Core Web Vitals, specifically LCP. Instead of just saying 'no', I built two sandboxes: one with the video background, and another using CSS-based transition layers that simulated the depth effects but loaded instantly. I sat down with both the designer and PM and showed them the load metrics on a 3G network simulation. Seeing the metrics made it a joint decision. We went with the CSS version, which kept our LCP under 1.8s while maintaining the design aesthetic, helping us boost conversions by 14%."
            },
            {
                question: "Describe a complex UI bug you encountered in production and how you fixed it.",
                situation: "An intermittent memory leak was causing browser tabs to crash on customers running our analytics dashboard page for more than 15 minutes.",
                task: "I had to isolate the cause of the leak in a massive component tree and deploy a hotfix immediately.",
                action: "I utilized the Chrome DevTools Memory profiler, capturing Heap Snapshots over interval cycles. I observed that the detached DOM element count was expanding linearly. I traced the leak to an uncleaned window event listener inside a custom React charting hook.",
                result: "I added a cleanup function in the `useEffect` hook to remove the event listener on unmount. The hotfix was pushed, and monitoring tools showed a flat, stable memory profile over long sessions, reducing page crashes to 0%.",
                sampleAnswer: "We had a production bug where our live dashboard would lock up and crash the browser after about 20 minutes of continuous use. I opened Chrome DevTools, captured multiple Heap Snapshots, and recorded memory allocations. I noticed that chart node elements were being retained in memory even after they were replaced. I dug into our charting wrapper hook and found that a `resize` listener attached to the global `window` object was capturing closed closures and not being unregistered. I added the clean-up return function inside our hook's `useEffect`. Within 2 hours, I verified the fix locally using the profiler, pushed the patch, and dashboard-related crashes dropped to zero."
            }
        ],
        resumeAudit: {
            keywords: ["TypeScript", "React Component Lifecycle", "Lighthouse Audit", "Web Accessibility", "Core Web Vitals", "State Management (Zustand/Redux)"],
            bullets: [
                {
                    before: "Wrote React code and fixed bugs on the web platform.",
                    after: "Architected a reusable React/TypeScript component library, reducing feature implementation cycles by 30% and maintaining absolute UI consistency.",
                    impact: "Converts passive tasks into high-impact accomplishments using strong verbs and quantifiable time-saving results."
                },
                {
                    before: "Helped improve the dashboard load time.",
                    after: "Optimized critical rendering path, code-splitting strategies, and image asset weights, raising Lighthouse performance scores from 65 to 92.",
                    impact: "Demonstrates specialized technical expertise in web performance optimization with specific metric gains."
                }
            ],
            generalTips: [
                "Feature your GitHub portfolio or live web links at the top of your resume.",
                "Mention key modern frontend build tools (Vite, Webpack, ESLint) you have worked with.",
                "Detail your experience working directly with design handoffs (Figma/Adobe XD) and designer-collaboration steps."
            ]
        },
        elevatorPitch: "Hi, I'm a frontend developer passionate about building highly performant, accessible user experiences. Over the past few years, I've specialized in React, TypeScript, and fine-tuning frontend architectures. At my last company, I led a UI system initiative that reduced developer cycle times by 30% and significantly improved Core Web Vitals across our web portals. I'm very excited about the opportunity at [Company] because of your focus on sleek user interfaces and robust design standards, and I look forward to contributing my frontend skills to your engineering team."
    },
    backend: {
        matchScore: 85,
        roleAnalysis: {
            industry: "Software Engineering / Backend Services",
            roleType: "Backend Engineer",
            hardSkills: ["API Design (REST / GraphQL)", "Database Design & SQL Optimization", "Distributed Systems"],
            softSkills: ["Technical Mentorship", "System Ownership", "Clear Architecture Documentation"],
            topCompetencies: ["API Latency Optimization", "Database Schema Design", "Microservices Communication"]
        },
        skills: {
            tech: [
                { name: "API Design (REST / GraphQL)", level: "Expert", importance: 95 },
                { name: "Database Design & SQL Optimization", level: "Expert", importance: 90 },
                { name: "Distributed Systems & Architecture", level: "Intermediate", importance: 85 },
                { name: "Caching (Redis / Memcached)", level: "Intermediate", importance: 80 },
                { name: "Message Brokers (Kafka / RabbitMQ)", level: "Entry", importance: 75 },
                { name: "Docker & Containerization", level: "Intermediate", importance: 70 }
            ],
            soft: [
                { name: "Technical Mentorship", level: "High", importance: 85 },
                { name: "System Ownership & On-call Reliability", level: "High", importance: 80 },
                { name: "Clear Architecture Documentation", level: "High", importance: 80 }
            ]
        },
        technicalQuestions: [
            {
                question: "How do you design a database indexing strategy to resolve slow queries?",
                difficulty: "hard",
                category: "Database",
                answer: "1. **Identify Bottlenecks**: Run `EXPLAIN ANALYZE` on SQL queries to evaluate join paths and look for expensive sequential table scans.\n2. **Target Filters**: Add indexes on columns commonly used in `WHERE`, `JOIN` conditions, and `ORDER BY` clauses.\n3. **Use Composite Indexes**: For queries filtering by multiple columns, create a composite index ordering from highest cardinality (most unique) to lowest.\n4. **Avoid Over-indexing**: Too many indexes slow down write operations (`INSERT`, `UPDATE`, `DELETE`) as index trees must be modified. Monitor index usage and delete unused indexes."
            },
            {
                question: "What is database connection pooling, and why is it essential?",
                difficulty: "medium",
                category: "Performance",
                answer: "Creating a new database connection for every incoming HTTP request is extremely expensive (handshakes, authentication, allocation).\n\n**Connection Pooling** maintains a cache of active database connections that are shared and reused across concurrent threads/requests. When a thread finishes a query, it returns the connection to the pool rather than closing it. This cuts API latency and protects databases from connection limit crashes."
            },
            {
                question: "Explain the circuit breaker pattern in distributed microservices.",
                difficulty: "hard",
                category: "System Design",
                answer: "If microservice A calls microservice B, and B is suffering outages, A's threads can pool up waiting for timeouts, causing cascading failures.\n\n**The Circuit Breaker** intercepts these calls:\n- **Closed**: Requests pass through normally. If error rates cross a threshold, the breaker trips.\n- **Open**: Requests fail immediately with a local fallback response, sparing resources.\n- **Half-Open**: After a cooldown, limited test requests are sent. If they succeed, the circuit closes again; if they fail, it returns to open."
            },
            {
                question: "How do you prevent SQL Injection and CSRF attacks in backend systems?",
                difficulty: "medium",
                category: "Security",
                answer: "1. **SQL Injection**: Never concatenate inputs into query strings. Always use **Parameterized Queries** / Prepared Statements where parameters are parameterized separately from SQL logic.\n2. **CSRF**: Implement unique anti-CSRF token verification on state-changing requests, and configure cookies with `SameSite=Strict` or `Lax` flags."
            }
        ],
        behavioralQuestions: [
            {
                question: "Describe a time when a critical production server went down under your watch.",
                situation: "During Black Friday traffic, our primary catalog database CPU spiked to 100%, causing checkout API endpoints to timeout globally.",
                task: "As the on-call engineer, I had to recover the system under high pressure and establish a preventative system.",
                action: "I immediately analyzed database active threads and found a lock-contention loop caused by an unindexed query. I dynamically scaled up the DB instance read replicas to absorb read traffic, ran a manual migration to inject the missing composite index, and enabled an API-level rate-limiter.",
                result: "The database CPU normalized within 8 minutes. We recovered normal operation, and I followed up with a post-mortem to automate query timeout limits and database alert systems.",
                sampleAnswer: "We had an outage where our main database hit 100% CPU utilization, blocking API servers. I checked our datadog alerts, isolated the slow query, and identified a newly launched feature query missing an index. I immediately spun up a read replica to offload search traffic, created the index directly on the production DB, and introduced query timeout thresholds. The system recovered in under 10 minutes. I later automated slow-query alerts in our staging CI/CD pipeline to catch missing indexes before they reach production."
            }
        ],
        resumeAudit: {
            keywords: ["SQL Profiling", "Redis Caching", "API Design", "Distributed Systems", "Docker", "Database Schema Migrations"],
            bullets: [
                {
                    before: "Wrote backend APIs and fixed SQL query issues.",
                    after: "Optimized complex query execution paths and database indexes, reducing search API response latencies by 45%.",
                    impact: "Uses technical terms like 'query execution paths' and displays strong latency reduction numbers."
                },
                {
                    before: "Moved backend code into docker containers.",
                    after: "Containerized backend microservices using Docker, streamlining local environment setups and automating Kubernetes autoscaling rules.",
                    impact: "Indicates experience in cloud architectures and modern deployment pipelines."
                }
            ],
            generalTips: [
                "Clearly list the databases (PostgreSQL, MongoDB, Redis) and protocols (HTTP, gRPC, WebSocket) you are proficient in.",
                "Reference the scale of systems you've worked on (e.g. QPS handled, database storage size, concurrent users).",
                "Highlight clean database migration practices and backup recovery protocols."
            ]
        },
        elevatorPitch: "Hi, I'm a backend engineer focused on building highly scalable, reliable server architectures. I have extensive experience in API design, database schema optimization, and caching strategies using Redis and PostgreSQL. In my previous role, I optimized database performance for our payment gateway, reducing API response times by 45% and ensuring high availability during peak traffic. I'm very eager to bring my system design skills to [Company], whose high engineering standards and performance scales I have admired for a long time."
    },
    cloud: {
        matchScore: 87,
        roleAnalysis: {
            industry: "DevOps / Infrastructure Engineering",
            roleType: "DevOps / SRE Engineer",
            hardSkills: ["Infrastructure as Code (Terraform)", "AWS Cloud Services", "Kubernetes & Docker"],
            softSkills: ["SRE Mentality", "Security First Mindset", "Blameless Post-Mortem Leadership"],
            topCompetencies: ["CI/CD Pipeline Automation", "Container Orchestration", "Cloud Resource Management"]
        },
        skills: {
            tech: [
                { name: "Infrastructure as Code (Terraform)", level: "Expert", importance: 95 },
                { name: "AWS Cloud Services", level: "Expert", importance: 90 },
                { name: "Kubernetes & Docker", level: "Expert", importance: 90 },
                { name: "CI/CD Pipeline Automation", level: "Expert", importance: 85 },
                { name: "Monitoring & Alerting (Prometheus/ELK)", level: "Intermediate", importance: 80 },
                { name: "Shell Scripting (Bash/Python)", level: "Intermediate", importance: 75 }
            ],
            soft: [
                { name: "SRE Mentality & Cost Awareness", level: "High", importance: 90 },
                { name: "Security First Mindset", level: "High", importance: 85 },
                { name: "Blameless Post-Mortems leadership", level: "High", importance: 80 }
            ]
        },
        technicalQuestions: [
            {
                question: "How do you design a blue-green deployment pipeline for zero-downtime updates?",
                difficulty: "medium",
                category: "CI/CD",
                answer: "1. **Dual Environments**: Maintain two identical production environments, 'Blue' (running current code) and 'Green' (running new release).\n2. **Testing**: Deploy and run smoke tests directly on the green environment.\n3. **Traffic Shift**: Update the main Load Balancer or DNS routing target to green. If tests pass, all users instantly swap to Green.\n4. **Rollback**: Keep Blue active for a cooldown window. If errors spike, toggle the load balancer back to Blue in seconds."
            },
            {
                question: "What is GitOps, and how does it improve infrastructure reliability?",
                difficulty: "hard",
                category: "DevOps Methodology",
                answer: "GitOps uses Git repositories as the single source of truth for infrastructure configuration. Changes to infrastructure (like Kubernetes manifests) are made via pull requests.\n\n**Key Advantages**:\n- **Audit Trails**: Complete history of who changed what, when, and why.\n- **Reconciliation**: Continuous delivery tools (like ArgoCD) monitor the cluster and automatically pull it back to the Git state if manual drifts occur."
            }
        ],
        behavioralQuestions: [
            {
                question: "Tell me about a time when a cloud migration or automated deployment failed.",
                situation: "During an automated migration of S3 bucket configurations, an incorrect Terraform variable caused access permissions to drop, blocking file uploads.",
                task: "I had to instantly restore customer uploads and resolve the Terraform configuration drift.",
                action: "I quickly triggered a rollback by checking out the previous stable git commit and running Terraform apply. I then audited the configuration, added variable validation blocks, and established dry-run checks in our CI pipeline.",
                result: "S3 access was restored in 4 minutes. Dry-run checks now prevent untested variable modifications from deploying.",
                sampleAnswer: "We were rolling out a Kubernetes upgrade in staging that unexpectedly crashed critical core services due to API version deprecations. I halted the automated pipeline, rolled back the cluster state to the previous backup snapshot, and set up local tests. I identified the API drifts, updated our deployment manifests, and modified our CI/CD pipelines to run validator checks (`kubeval`) on every pull request to catch deprecated APIs before clusters apply them."
            }
        ],
        resumeAudit: {
            keywords: ["Terraform", "Kubernetes", "AWS IAM Security", "Docker Containerization", "GitHub Actions", "Prometheus & Grafana"],
            bullets: [
                {
                    before: "Wrote CI/CD pipelines and scripts.",
                    after: "Automated container builds and testing pipelines via GitHub Actions, reducing overall release cycles from 45 minutes to 6 minutes.",
                    impact: "Shows specific speedups in pipelines, which represents direct developer efficiency."
                },
                {
                    before: "Created AWS cloud setups.",
                    after: "Migrated legacy infrastructure into Terraform IaC, reducing multi-region deployment setup times by 90%.",
                    impact: "Shows mastery of infrastructure as code and dramatic environment spin-up improvements."
                }
            ],
            generalTips: [
                "Clearly list AWS/GCP/Azure certifications you possess.",
                "Detail your experience with cost control, detailing specific annual or monthly dollar savings.",
                "Highlight security initiatives (compliance, vulnerability scanning, IAM security)."
            ]
        },
        elevatorPitch: "Hi, I'm a DevOps and Site Reliability Engineer focused on automated deployments, container orchestration, and building robust cloud systems. I specialize in AWS, Terraform, and Kubernetes. In my last role, I migrated our platform's infrastructure to Terraform, speeding up staging deployments by 90% and optimizing our cloud footprint to save $120k annually. I'm excited about joining [Company] to help build, scale, and secure your deployment pipelines and ensure high availability."
    },
    pm: {
        matchScore: 84,
        roleAnalysis: {
            industry: "Product Management",
            roleType: "Product Manager",
            hardSkills: ["Product Strategy", "Agile & Scrum Methodologies", "User Analytics", "A/B Testing"],
            softSkills: ["Cross-Functional Leadership", "Stakeholder Management", "Negotiation"],
            topCompetencies: ["Roadmap Planning", "Backlog Prioritization", "User Discovery"]
        },
        skills: {
            tech: [
                { name: "Product Strategy & Roadmap Planning", level: "Expert", importance: 95 },
                { name: "Agile & Scrum Methodologies", level: "Expert", importance: 90 },
                { name: "Data Analytics (SQL/Mixpanel/Amplitude)", level: "Intermediate", importance: 85 },
                { name: "User Research & A/B Testing", level: "Expert", importance: 85 },
                { name: "UX Design Principles", level: "Intermediate", importance: 75 }
            ],
            soft: [
                { name: "Cross-functional Leadership", level: "Expert", importance: 95 },
                { name: "Stakeholder Management", level: "Expert", importance: 90 },
                { name: "Conflict Resolution & Negotiation", level: "High", importance: 85 }
            ]
        },
        technicalQuestions: [
            {
                question: "How do you prioritize your product backlog when faced with competing stakeholder demands?",
                difficulty: "hard",
                category: "Product Management",
                answer: "1. **RICE Framework**: Evaluate tasks on Reach, Impact, Confidence, and Effort. This quantifies priorities and limits subjective arguments.\n2. **Strategic Alignment**: Verify if the feature aligns with the current company North Star metric.\n3. **MoSCoW Method**: Categorize into Must have, Should have, Could have, Won't have for immediate sprint cycles.\n4. **Data Over Opinions**: Present user feedback data, analytics trends, and engineering complexity inputs to build consensus."
            },
            {
                question: "How do you define a minimum viable product (MVP) for a new initiative?",
                difficulty: "medium",
                category: "Scoping",
                answer: "An MVP should not be a buggy or incomplete product; it must be the smallest slice of value that successfully solves a core customer pain point and allows you to gather learning loops.\n\n**Process**:\n- Identify the core problem you want to address.\n- Build a story map showing the user journey.\n- Strip away nice-to-have features, leaving only the critical backbone.\n- Build, launch, measure usage metrics, and iterate."
            }
        ],
        behavioralQuestions: [
            {
                question: "Describe a product launch that failed and what you learned.",
                situation: "We launched an automated notifications feature aimed at increasing re-engagement, but it resulted in a 4% increase in user unsubscribes.",
                task: "I had to analyze user friction points, halt the negative impact, and rebuild our notifications strategy.",
                action: "I paused the notifications, ran targeted qualitative interviews, and reviewed Amplitude usage logs. I learned we were sending too many notifications without clear value context.",
                result: "I redesigned the notifications to be smart (batching alerts and targeting specific user actions). Unsubscribes dropped below baseline, and weekly active users increased by 8%.",
                sampleAnswer: "We launched a recommendation feature that had poor uptake. I organized user testing, analyzed usage logs, and discovered that users didn't trust the automated recommendations because they didn't know why they were suggested. I updated the layout to explain the recommendation reason (e.g. 'Because you read X'). Uptake rose by 32%."
            }
        ],
        resumeAudit: {
            keywords: ["Product Backlog Prioritization", "A/B Testing", "Scrum Master", "Amplitude/Mixpanel", "User Persona Research", "MVP Scoping"],
            bullets: [
                {
                    before: "Managed the product roadmap and held meetings.",
                    after: "Led cross-functional team of 10 engineers and designers to launch our MVP, onboarding 50k users in month one.",
                    impact: "Quantifies team size and launch results, illustrating direct execution leadership."
                },
                {
                    before: "Talked with customers to gather feedback.",
                    after: "Conducted 30+ qualitative customer interviews, translating user pain points into 12 actionable feature updates that reduced churn by 8%.",
                    impact: "Draws a direct line between research steps and real business results (churn reduction)."
                }
            ],
            generalTips: [
                "Clearly list standard metrics you track (DAU, MAU, CAC, LTV, conversion ratios).",
                "Mention your collaboration methods with engineering and design (Agile, Jira, Figma).",
                "Highlight product strategy, user discovery, and data-analysis workflows."
            ]
        },
        elevatorPitch: "Hi, I'm a product manager dedicated to building user-centric software that drives business growth. I have a background in data analysis and cross-functional leadership, bringing together engineering, design, and marketing teams. In my last role, I scoped and delivered a new core dashboard flow that cut onboarding churn by 8% and added 50k users in the first month. I'm very excited about joining [Company] to help refine, prioritize, and scale your product roadmaps."
    },
    data_analyst: {
        matchScore: 85,
        roleAnalysis: {
            industry: "Data Analytics / Business Intelligence",
            roleType: "Data Analyst",
            hardSkills: ["SQL Querying", "Excel Modeling", "Dashboard Creation", "Data Cleaning"],
            softSkills: ["Analytical Thinking", "Attention to Detail", "Communication"],
            topCompetencies: ["SQL Database Queries", "Spreadsheet Modeling", "Data Interpretation"]
        },
        skills: {
            tech: [
                { name: "SQL Querying", level: "Expert", importance: 95 },
                { name: "Excel Modeling", level: "Expert", importance: 90 },
                { name: "Dashboard Creation (Tableau/PowerBI)", level: "Intermediate", importance: 85 },
                { name: "Data Cleaning & Preparation", level: "Intermediate", importance: 80 }
            ],
            soft: [
                { name: "Analytical Thinking", level: "High", importance: 90 },
                { name: "Attention to Detail", level: "High", importance: 85 },
                { name: "Communication", level: "High", importance: 85 }
            ]
        },
        technicalQuestions: [
            {
                question: "Explain the difference between INNER JOIN, LEFT JOIN, and RIGHT JOIN. When would you use a LEFT JOIN?",
                difficulty: "medium",
                category: "SQL Queries",
                answer: "- **INNER JOIN**: Returns rows only when there is a match in both tables.\n- **LEFT JOIN**: Returns all rows from the left table, and matching rows from the right table. If no match, right-side columns are NULL.\n- **RIGHT JOIN**: Returns all rows from the right table, and matching rows from the left.\n\nUse a **LEFT JOIN** when you want to keep all records from a primary table (e.g., Customers) regardless of whether they have matching actions in another table (e.g., Orders)."
            },
            {
                question: "What are some best practices for organizing large datasets in Excel, and how do you use VLOOKUP or INDEX/MATCH?",
                difficulty: "medium",
                category: "Excel Modeling",
                answer: "- **Best Practices**: Keep raw data separate from calculations, use Excel Tables for dynamic ranges, and avoid merged cells in headers.\n- **VLOOKUP vs INDEX/MATCH**: VLOOKUP searches only left-to-right. INDEX/MATCH is more flexible, handles column insertions safely, and consumes less memory on large datasets."
            },
            {
                question: "How do you choose which chart type to use when designing a dashboard for executive leadership?",
                difficulty: "easy",
                category: "Dashboard Creation",
                answer: "- **Trends over time**: Use Line Charts to show continuous changes.\n- **Comparisons**: Use Bar Charts for category comparison.\n- **Relationships**: Use Scatter Plots to highlight correlations.\n- **Proportions**: Use Pie or Donut charts only for 2-3 categories. Keep it clear, minimal, and focused on key business KPIs."
            },
            {
                question: "What is your process for identifying and handling duplicate or missing data in a raw dataset?",
                difficulty: "hard",
                category: "Data Cleaning",
                answer: "1. **Profile**: Run summary statistics or value counts to locate missing percentages.\n2. **Isolate**: Group by unique identifiers to spot duplicate entries.\n3. **Decide Action**: For missing data, choose to delete rows (if negligible), impute using mean/median, or flag with a placeholder. For duplicates, verify if they represent actual duplicate records and drop them accordingly."
            }
        ],
        behavioralQuestions: [
            {
                question: "Describe a time when you found an unexpected trend or insight in a dataset. How did you share it?",
                situation: "While auditing customer retention logs, I noticed user churn spiked by 12% specifically on the second Tuesday of each month.",
                task: "I had to isolate the cause and present the finding to the product operations team.",
                action: "I cross-referenced system logs and found a scheduled server maintenance window was locking out mobile API sessions on those Tuesdays. I built a quick line chart showing the time correlation and walked the product manager through it.",
                result: "We shifted maintenance to 2 AM on Sundays. Mobile checkouts recovered immediately, and recurring monthly churn dropped by 8%.",
                sampleAnswer: "I was looking at our user engagement metrics and noticed a sharp drop-off on a specific signup screen. I isolated the step and found it coincided with a new security script release. I made a simple dashboard highlighting the drop-off rate, presented it to the product lead, and they rolled back the update. Conversions returned to normal within an hour."
            }
        ],
        resumeAudit: {
            keywords: ["SQL Querying", "Excel Pivot Tables", "Data Visualization", "Dashboard Design", "Data Wrangling"],
            bullets: [
                {
                    before: "Looked at data and made reports.",
                    after: "Designed dynamic SQL queries and Tableau dashboards, reducing report generation time by 40% and uncovering $15k in cost savings.",
                    impact: "Demonstrates data tool expertise and translates passive analysis tasks into business value."
                }
            ],
            generalTips: [
                "Clearly list specific tools (Tableau, PowerBI, Excel, SQL) at the top of your resume.",
                "Detail your experience working directly with business stakeholders to solve real queries.",
                "Mention any experience with data warehousing or ETL pipelines if applicable."
            ]
        },
        elevatorPitch: "Hi, I'm a Data Analyst passionate about turning raw data into actionable business insights. I specialize in SQL, advanced Excel, and building intuitive dashboards in Tableau. At my last company, I optimized our dashboard reports which saved stakeholders 5 hours per week and helped identify a 10% leakage in resource allocations. I'm excited about the opportunity at [Company] because of your data-driven culture and look forward to contributing my analytical skills to your team."
    },
    project_management: {
        matchScore: 86,
        roleAnalysis: {
            industry: "Operations / Project Management",
            roleType: "Project Manager",
            hardSkills: ["Timeline Management", "Risk Management", "Project Tracking Tools", "Resource Allocation"],
            softSkills: ["Stakeholder Communication", "Leadership", "Organization"],
            topCompetencies: ["Agile/Scrum Frameworks", "Timeline Optimization", "Risk Mitigation"]
        },
        skills: {
            tech: [
                { name: "Timeline Management", level: "Expert", importance: 90 },
                { name: "Project Tracking Tools (Jira/Asana)", level: "Expert", importance: 85 },
                { name: "Risk Management", level: "Intermediate", importance: 80 },
                { name: "Resource Allocation", level: "Intermediate", importance: 80 }
            ],
            soft: [
                { name: "Stakeholder Communication", level: "High", importance: 95 },
                { name: "Leadership", level: "High", importance: 90 },
                { name: "Organization", level: "High", importance: 90 }
            ]
        },
        technicalQuestions: [
            {
                question: "How do you define the critical path in a project timeline, and how do you handle scope creep?",
                difficulty: "hard",
                category: "Timeline Management",
                answer: "- **Critical Path**: The longest sequence of dependent tasks that must be completed to deliver the project on time. Any delay here delays the project.\n- **Scope Creep**: Manage it through a strict change control process. Evaluate the impact of new requests on the timeline, budget, and resources, and obtain formal stakeholder sign-off before making adjustments."
            },
            {
                question: "What is your framework for identifying, assessing, and mitigating project risks before they delay delivery?",
                difficulty: "medium",
                category: "Risk Management",
                answer: "1. **Identify**: Conduct pre-mortem workshops with team members to list potential issues.\n2. **Assess**: Plot risks on a probability-impact matrix.\n3. **Mitigate**: Develop mitigation plans for high-priority risks, assign owners, and track triggers weekly in a risk register."
            },
            {
                question: "Which tools do you prefer for tracking project tasks (e.g. Asana, Jira), and how do you configure them for high team visibility?",
                difficulty: "easy",
                category: "Project Tracking Tools",
                answer: "- Use Kanban boards for continuous flow or Sprint boards for structured iterations.\n- Create clear custom columns (e.g., Backlog, In Progress, Blocked, Done).\n- Configure automated notifications for status updates and maintain a clean dashboard for executive summaries."
            }
        ],
        behavioralQuestions: [
            {
                question: "Tell me about a time a project was falling behind schedule. How did you communicate this to stakeholders?",
                situation: "During a client onboarding rollout, a vendor delay pushed back our hardware delivery schedule by two weeks, threatening the go-live deadline.",
                task: "As the Project Manager, I had to keep stakeholders aligned, adjust resources, and minimize delay impact.",
                action: "I immediately set up a status alignment meeting. I presented two options: a phased rollout (critical users first) or a compressed testing schedule. I communicated the options clearly, highlighting the risks of each.",
                result: "The client agreed to the phased rollout. We met the critical user deadline with zero downtime, and the complete rollout finished just 3 days late, maintaining high client satisfaction.",
                sampleAnswer: "We had a shipping delay that threatened a product launch. I gathered the team, came up with a list of backup suppliers, and presented the options along with adjusted budget forecasts to our director. Because I brought solutions instead of just a problem, we got approval to switch suppliers and launched on time."
            }
        ],
        resumeAudit: {
            keywords: ["Scope Scoping", "Timeline Planning", "Risk Mitigation", "Agile / Scrum", "Stakeholder Alignment"],
            bullets: [
                {
                    before: "Organized tasks and kept projects on schedule.",
                    after: "Managed cross-functional timelines for 3 major product launches, reducing schedule delays by 25% and ensuring 100% on-time delivery.",
                    impact: "Quantifies execution capacity and showcases direct ownership of timeline outcomes."
                }
            ],
            generalTips: [
                "Mention standard methodologies (PMP, CAPM, Agile, Scrum) on your resume.",
                "Detail the size, scope, and budget of projects you have managed.",
                "Emphasize your experience in risk management and stakeholder communication."
            ]
        },
        elevatorPitch: "Hi, I'm a Project Manager dedicated to aligning cross-functional teams to deliver projects on time and within budget. I specialize in agile methodologies, risk management, and stakeholder communication. In my previous role, I spearheaded a process improvement that cut delivery bottlenecks by 20% and successfully launched three concurrent initiatives. I'm excited about joining [Company] because of your focus on execution speed and high operational standards."
    },
    business_development: {
        matchScore: 85,
        roleAnalysis: {
            industry: "Sales / Business Development",
            roleType: "Business Development Representative",
            hardSkills: ["Outbound Prospecting", "LinkedIn Sales Navigator", "Lead Qualification", "Outreach Strategy"],
            softSkills: ["Resilience", "Relationship Building", "Active Listening"],
            topCompetencies: ["B2B Prospecting", "CRM Pipeline Tracking", "Cold Outreach Sequences"]
        },
        skills: {
            tech: [
                { name: "Outbound Prospecting", level: "Expert", importance: 95 },
                { name: "Lead Qualification", level: "Expert", importance: 90 },
                { name: "CRM Tools (Salesforce/HubSpot)", level: "Intermediate", importance: 85 },
                { name: "LinkedIn Sales Navigator", level: "Intermediate", importance: 80 }
            ],
            soft: [
                { name: "Resilience", level: "High", importance: 90 },
                { name: "Relationship Building", level: "High", importance: 90 },
                { name: "Active Listening", level: "High", importance: 85 }
            ]
        },
        technicalQuestions: [
            {
                question: "What is your approach to identifying and researching high-value prospects in a new target market?",
                difficulty: "medium",
                category: "Outbound Prospecting",
                answer: "1. **Ideal Customer Profile (ICP)**: Define criteria like industry, company size, and revenue.\n2. **Buyer Personas**: Locate key decision-makers (e.g. Director of Operations).\n3. **Trigger Events**: Look for signals like funding rounds or job posts to tailor outreach relevance."
            },
            {
                question: "How do you leverage LinkedIn Sales Navigator to find and connect with decision-makers at target accounts?",
                difficulty: "easy",
                category: "LinkedIn Sales Navigator",
                answer: "- Use advanced filters to map titles, seniority, geography, and company size.\n- Save target accounts and leads to track updates.\n- Draft customized connection requests referencing shared connections or recent company updates."
            },
            {
                question: "What criteria do you use to qualify a lead before passing them to an Account Executive?",
                difficulty: "medium",
                category: "Lead Qualification",
                answer: "Use frameworks like **BANT** (Budget, Authority, Need, Timeline):\n- **Need**: Does the prospect have a clear challenge our product solves?\n- **Authority**: Are they a decision-maker or key influencer?\n- **Timeline**: Are they looking to implement a solution in the next 3-6 months?\n- **Budget**: Do they have resources to allocate to a solution?"
            }
        ],
        behavioralQuestions: [
            {
                question: "Describe a time you faced a series of rejections from prospects. How did you stay motivated and adjust your approach?",
                situation: "During an outbound push into the logistics sector, I hit 40 straight cold call rejections or gatekeeper blocks in a single week.",
                task: "I needed to maintain outbound volume while adapting my messaging to improve conversion.",
                action: "Instead of calling blindly, I paused and listened to call recordings. I noticed I was pitching features too early. I rewrote the hook to ask a question about their current warehouse capacity constraints.",
                result: "The revised hook doubled talk-time on my next 20 calls, resulting in 4 booked meetings and a 10% qualification rate for the quarter.",
                sampleAnswer: "Rejection is part of sales. I always focus on pipeline metrics. When my reply rate fell, I split-tested two email subject lines and customized the hooks. By personalizing the first sentence, my reply rates rose by 12%."
            }
        ],
        resumeAudit: {
            keywords: ["Lead Generation", "Sales Pipeline", "B2B Outreach", "Cold Calling", "Salesforce CRM"],
            bullets: [
                {
                    before: "Emailed people to try to sell them our product.",
                    after: "Built a pipeline of 120 qualified leads using LinkedIn Sales Navigator, exceeding monthly outbound sales quotas by 115%.",
                    impact: "Displays target quota metrics and highlights technical tools used for prospecting."
                }
            ],
            generalTips: [
                "Clearly list lead metrics, call volumes, and pipeline values you generated.",
                "Detail your experience with CRM platforms (Salesforce, HubSpot).",
                "Highlight target industries and client profiles you worked with."
            ]
        },
        elevatorPitch: "Hi, I'm a Business Development professional focused on building robust sales pipelines and identifying new growth opportunities. I specialize in outbound prospecting, lead qualification, and consultative sales. In my last role, I generated over $80k in new pipeline value by designing custom outreach sequences that had a 25% open rate. I'm eager to bring my prospecting skills to [Company] to help drive pipeline and expand your customer base."
    },
    marketing: {
        matchScore: 84,
        roleAnalysis: {
            industry: "Marketing / Growth",
            roleType: "Marketing Specialist",
            hardSkills: ["Campaign Analysis", "Audience Segmentation", "Content Strategy", "Performance Attribution"],
            softSkills: ["Collaboration", "Creativity", "Data Interpretation"],
            topCompetencies: ["Digital Campaigns", "Google Analytics", "Campaign Performance Attribution"]
        },
        skills: {
            tech: [
                { name: "Campaign Analysis", level: "Expert", importance: 90 },
                { name: "Audience Segmentation", level: "Expert", importance: 85 },
                { name: "Content Strategy", level: "Intermediate", importance: 80 },
                { name: "Google Analytics / SEO", level: "Intermediate", importance: 80 }
            ],
            soft: [
                { name: "Collaboration", level: "High", importance: 90 },
                { name: "Creativity", level: "High", importance: 85 },
                { name: "Data Interpretation", level: "High", importance: 80 }
            ]
        },
        technicalQuestions: [
            {
                question: "What metrics (e.g., CAC, ROAS, CTR) do you prioritize when evaluating the success of a marketing campaign?",
                difficulty: "medium",
                category: "Campaign Analysis",
                answer: "- **CTR (Click-Through Rate)**: Tests creative/ad relevance.\n- **CAC (Customer Acquisition Cost)**: Measures budget efficiency.\n- **ROAS (Return on Ad Spend)**: Measures direct revenue returns on ad spend.\n- **Conversion Rate**: Measures landing page performance."
            },
            {
                question: "How do you approach segmenting an email list or advertising audience to improve engagement rates?",
                difficulty: "medium",
                category: "Audience Segmentation",
                answer: "1. **Demographics / Firmographics**: Group by age, location, or industry.\n2. **Behavioral Data**: Segment by past purchases, email opens, or website visits.\n3. **Lifecycle Stage**: Tailor messages differently for new subscribers vs. loyal customers."
            },
            {
                question: "How do you align content creation with different stages of the customer acquisition funnel?",
                difficulty: "easy",
                category: "Content Strategy",
                answer: "- **Top of Funnel (Awareness)**: Use blog posts, social media, and guides to address customer problems.\n- **Middle of Funnel (Consideration)**: Use case studies, webinars, and comparison sheets.\n- **Bottom of Funnel (Decision)**: Use free trials, product demos, and pricing calculators."
            }
        ],
        behavioralQuestions: [
            {
                question: "Describe a marketing campaign you worked on where you had to come up with a creative angle on a tight budget.",
                situation: "We wanted to launch a new product line with only $500 in ad budget, which was too low for a traditional paid search campaign.",
                task: "I had to design an organic and partner-focused outreach strategy to drive traffic.",
                action: "I researched micro-influencers in our niche with high engagement rates. I offered them free product samples in exchange for honest reviews and co-hosted a user giveaway.",
                result: "The campaign generated 15,000 organic video views, drove a 22% increase in site traffic, and resulted in 80 sales, yielding a 4.5x return on our sample costs.",
                sampleAnswer: "We had a small budget for our summer promotion. I launched an organic social media campaign focusing on user-generated content, encouraging customers to share photos. This grew our followers by 25% and generated $4k in sales with zero ad spend."
            }
        ],
        resumeAudit: {
            keywords: ["Google Analytics", "Audience Targeting", "Content Optimization", "Conversion Rate (CRO)", "Email Campaigns"],
            bullets: [
                {
                    before: "Wrote social media posts and did marketing.",
                    after: "Designed a targeted social media campaign that grew audience engagement by 35% and increased referral traffic by 18%.",
                    impact: "Demonstrates creative strategy and highlights performance metrics."
                }
            ],
            generalTips: [
                "Clearly list specific digital marketing platforms (Google Ads, Meta Ads Manager, HubSpot) you are proficient in.",
                "Detail your experience with analytical tools (Google Analytics, SEO search consoles).",
                "Emphasize content creation, copywriting, or video marketing achievements."
            ]
        },
        elevatorPitch: "Hi, I'm a Marketing professional dedicated to executing campaigns that grow brand awareness and customer acquisition. I specialize in campaign analysis, content strategy, and audience segmentation. In my last role, I managed a digital campaign that improved conversion rates by 15% and lowered client acquisition costs. I'm excited about joining [Company] to help amplify your message and drive brand engagement."
    },
    finance: {
        matchScore: 86,
        roleAnalysis: {
            industry: "Finance / Accounting",
            roleType: "Financial Analyst",
            hardSkills: ["Financial Statements", "Forecasting Models", "KPI Analysis", "Excel Modeling"],
            softSkills: ["Critical Thinking", "Accuracy", "Financial Data Presentation"],
            topCompetencies: ["Variance Analysis", "Financial Statements Linkage", "EBITDA Forecasting"]
        },
        skills: {
            tech: [
                { name: "Financial Statements", level: "Expert", importance: 95 },
                { name: "Forecasting Models", level: "Expert", importance: 90 },
                { name: "KPI Analysis", level: "Intermediate", importance: 85 },
                { name: "Excel Modeling", level: "Intermediate", importance: 80 }
            ],
            soft: [
                { name: "Accuracy", level: "High", importance: 95 },
                { name: "Critical Thinking", level: "High", importance: 90 },
                { name: "Data Presentation", level: "High", importance: 85 }
            ]
        },
        technicalQuestions: [
            {
                question: "How do the three core financial statements (Income Statement, Balance Sheet, Cash Flow) link together?",
                difficulty: "hard",
                category: "Financial Statements",
                answer: "- **Net Income** from the Income Statement flows into Retained Earnings on the Balance Sheet and serves as the starting line for Cash Flow from Operations.\n- **Depreciation** on the Income Statement reduces Asset values on the Balance Sheet and is added back on the Cash Flow Statement.\n- **Ending Cash** from the Cash Flow Statement becomes the Cash asset on the Balance Sheet."
            },
            {
                question: "What is your methodology for building a revenue forecast model under conditions of market uncertainty?",
                difficulty: "hard",
                category: "Forecasting Models",
                answer: "1. **Define Drivers**: Break revenue down into key drivers (e.g. traffic, conversion, average selling price).\n2. **Scenario Planning**: Build Base, Best, and Worst case tabs.\n3. **Historical Baseline**: Analyze prior growth rates and adjust for seasonality.\n4. **Sensitivity Analysis**: Test how variations in single drivers (like client churn) alter bottom-line cash flow."
            },
            {
                question: "Which financial KPIs are most critical for assessing a company's operational health?",
                difficulty: "medium",
                category: "KPI Analysis",
                answer: "- **Gross Profit Margin**: Tests production pricing efficiency.\n- **EBITDA Margin**: Measures core operating profitability.\n- **Operating Cash Flow**: Verifies if net earnings are translating into actual cash.\n- **Current Ratio**: Evaluates short-term liquidity and ability to cover short-term debts."
            }
        ],
        behavioralQuestions: [
            {
                question: "Describe a time when you caught a significant error in a financial report or model. How did you handle it?",
                situation: "While preparing the quarterly budget variance report, I noticed a formula error in our spreadsheet had double-counted vendor overhead costs, showing a $40k budget deficit.",
                task: "I had to verify the error, correct the calculations, and report the correction before it went to the CFO.",
                action: "I audited the cell references, located the circular formula loop, and corrected it. I draft-tested the new sheet against actual bank ledgers. I then alerted my manager with the corrected metrics.",
                result: "The revised budget showed a $5k surplus instead. The report was corrected in time, and I instituted a sheet protection review protocol to prevent locked cell editing errors.",
                sampleAnswer: "I found a circular reference error in a monthly forecast model that skewed projections. I locked the formulas, fixed the references, and cross-referenced with bank cash records. I flag-marked the correction to my team lead, keeping our budget reporting accurate."
            }
        ],
        resumeAudit: {
            keywords: ["Financial Forecasting", "Budget Variance", "Excel VBA / Modeling", "Revenue Tracking", "KPI Dashboards"],
            bullets: [
                {
                    before: "Looked over budgets and did calculations.",
                    after: "Built structured Excel forecasting models that improved budget projection accuracy by 15% and identified $20k in operational cost savings.",
                    impact: "Shows Excel tool mastery and connects mathematical forecasting with direct cost-reduction results."
                }
            ],
            generalTips: [
                "Clearly list your spreadsheet capabilities (macros, lookups, pivot tables) and accounting software tools.",
                "Detail the asset values, budgets, or revenue streams you audited or managed.",
                "Emphasize experience with variance calculations and financial compliance guidelines."
            ]
        },
        elevatorPitch: "Hi, I'm a Financial Analyst focused on helping organizations optimize their financial health and support strategic growth decisions. I specialize in financial statements analysis, forecasting, and data modeling in Excel. In my last role, I streamlined our monthly variance reporting process, saving the team 4 hours of preparation time while improving forecasting accuracy. I'm excited about [Company] because of your scale and look forward to contributing my analytical skills to your finance team."
    },
    generic: {
        matchScore: 82,
        roleAnalysis: {
            industry: "General Professional",
            roleType: "General Contributor",
            hardSkills: ["Task Organization", "Time Management", "Written Documentation"],
            softSkills: ["Problem Solving", "Collaboration", "Active Communication"],
            topCompetencies: ["Adaptability", "Team Work", "Problem Solving"]
        },
        skills: {
            tech: [
                { name: "Time Management", level: "Expert", importance: 90 },
                { name: "Task Organization", level: "Expert", importance: 85 },
                { name: "Technical / Written Communication", level: "Intermediate", importance: 80 }
            ],
            soft: [
                { name: "Problem Solving", level: "High", importance: 90 },
                { name: "Collaboration", level: "High", importance: 90 },
                { name: "Active Listening", level: "High", importance: 85 }
            ]
        },
        technicalQuestions: [
            {
                question: "How do you manage and organize your tasks when faced with competing deadlines?",
                difficulty: "easy",
                category: "Task Organization",
                answer: "- **Prioritization**: Use frameworks like Eisenhower Matrix to separate urgent vs. important tasks.\n- **Scoping**: Break down large goals into small daily steps.\n- **Tracking**: Maintain a central digital planner (Trello/Asana) to keep due dates clear.\n- **Focus**: Dedicate blocks of uninterrupted time for deep task execution."
            },
            {
                question: "What makes documentation clear and effective, and how do you ensure team members can find the info they need?",
                difficulty: "medium",
                category: "Written Documentation",
                answer: "- Keep it structured with clear headings, bullet points, and screenshots.\n- Maintain a central documentation index rather than isolated file links.\n- Archive outdated materials and review core pages regularly to keep content correct."
            }
        ],
        behavioralQuestions: [
            {
                question: "Describe a mistake you made at work and how you handled the consequences.",
                situation: "I accidentally sent an incorrect project roadmap update to our entire team list, which caused confusion about delivery dates.",
                task: "I had to correct the mistake immediately and restore team alignment.",
                action: "I notified my manager, drafted a corrected version with bolded date corrections, and sent a follow-up email explaining the date typo within 20 minutes. I then added a draft-review step to my weekly workflow.",
                result: "The correct dates were communicated, confusion was resolved within the hour, and peer-reviewing roadmap logs has prevented any recurrence.",
                sampleAnswer: "I once sent out a meeting invitation with the wrong date link. As soon as I realized, I updated the invitation, sent a quick note apologizing for the mix-up, and verified all participants had the correct access links. The meeting proceeded smoothly."
            }
        ],
        resumeAudit: {
            keywords: ["Time Management", "Project Coordination", "Team Collaboration", "Problem Solving", "Process Documentation"],
            bullets: [
                {
                    before: "Worked on tasks and attended meetings with the team.",
                    after: "Coordinated cross-functional tasks to deliver 4 major team initiatives, resolving 35+ project blockers with zero delays.",
                    impact: "Demonstrates active execution, project ownership, and productive collaboration."
                }
            ],
            generalTips: [
                "Clearly list task-tracking software (Trello, Slack, Google Workspace) you are proficient in.",
                "Detail your experience working inside cross-functional or hybrid teams.",
                "Highlight process improvements or organization projects you owned."
            ]
        },
        elevatorPitch: "Hi, I'm a professional dedicated to driving team success through structured organization, proactive communication, and creative problem-solving. I specialize in workflow coordination, process documentation, and collaborative execution. In my previous role, I helped coordinate operations for a key team milestone, speeding up task execution by 30%. I'm excited about joining [Company] to help tackle complex challenges and grow within your collaborative culture."
    }
};

// --- DOM Selector Queries ---
const DOM = {
    // Inputs & Forms
    prepForm: document.getElementById('prep-form'),
    jobTitle: document.getElementById('job-title'),
    companyName: document.getElementById('company-name'),
    experienceLevel: document.getElementById('experience-level'),
    jobDescription: document.getElementById('job-description'),
    generateBtn: document.getElementById('generate-btn'),
    
    // Sidebar History
    historyList: document.getElementById('history-list'),
    historyCount: document.getElementById('history-count'),
    mobileCloseBtn: document.getElementById('mobile-close-btn'),
    menuToggleBtn: document.getElementById('menu-toggle-btn'),
    sidebar: document.getElementById('sidebar'),
    
    // Top Bar Status
    apiStatus: document.getElementById('api-status'),
    statusText: document.getElementById('status-text'),
    
    // Panels
    welcomePanel: document.getElementById('welcome-panel'),
    loadingPanel: document.getElementById('loading-panel'),
    dashboardPanel: document.getElementById('dashboard-panel'),
    
    // Dashboard Metadata Headers
    dashJobTitle: document.getElementById('dash-job-title'),
    dashCompanyName: document.getElementById('dash-company-name'),
    dashQCount: document.getElementById('dash-q-count'),
    matchScoreText: document.getElementById('match-score-text'),
    scoreCircleProgress: document.getElementById('score-circle-progress'),
    deleteCurrentPlan: document.getElementById('delete-current-plan'),
    
    // Tabs Navigation
    dashboardTabs: document.getElementById('dashboard-tabs'),
    tabPanes: document.querySelectorAll('.tab-pane'),
    
    // Tab Panes content
    skillsTechList: document.getElementById('skills-tech-list'),
    skillsSoftList: document.getElementById('skills-soft-list'),
    techQuestionsList: document.getElementById('tech-questions-list'),
    behavioralQuestionsList: document.getElementById('behavioral-questions-list'),
    resumeKeywordsList: document.getElementById('resume-keywords-list'),
    resumeBulletsList: document.getElementById('resume-bullets-list'),
    resumeGeneralTips: document.getElementById('resume-general-tips'),
    elevatorPitchText: document.getElementById('elevator-pitch-text'),
    copyPitchBtn: document.getElementById('copy-pitch-btn'),
    startPrompterBtn: document.getElementById('start-prompter-btn'),
    
    // Settings Modal
    settingsBtn: document.getElementById('settings-btn'),
    settingsModal: document.getElementById('settings-modal'),
    settingsEngine: document.getElementById('settings-engine'),
    // Ollama fields
    ollamaUrlGroup: document.getElementById('ollama-url-group'),
    ollamaModelGroup: document.getElementById('ollama-model-group'),
    settingsOllamaUrl: document.getElementById('settings-ollama-url'),
    settingsOllamaModel: document.getElementById('settings-ollama-model'),
    // Gemini fields
    apiKeyGroup: document.getElementById('api-key-group'),
    modelSelectGroup: document.getElementById('model-select-group'),
    settingsApiKey: document.getElementById('settings-api-key'),
    settingsModel: document.getElementById('settings-model'),
    clearHistoryBtn: document.getElementById('clear-history-btn'),
    settingsCancelBtn: document.getElementById('settings-cancel-btn'),
    settingsSaveBtn: document.getElementById('settings-save-btn'),
    settingsCloseBtn: document.getElementById('settings-close-btn'),
    
    // Teleprompter Modal
    prompterModal: document.getElementById('prompter-modal'),
    prompterCloseBtn: document.getElementById('prompter-close-btn'),
    prompterScroller: document.getElementById('prompter-scroller'),
    prompterTimer: document.getElementById('prompter-timer'),
    prompterPlay: document.getElementById('prompter-play'),
    prompterPlayIcon: document.getElementById('prompter-play-icon'),
    prompterReset: document.getElementById('prompter-reset'),
    prompterSpeed: document.getElementById('prompter-speed'),
    prompterFont: document.getElementById('prompter-font'),
    
    // Loader texts
    loaderTitle: document.getElementById('loader-title'),
    loaderTip: document.getElementById('loader-tip'),
    progressBarFill: document.getElementById('progress-bar-fill')
};

// Loading Screen Tip Cycles
const LOADING_TIPS = [
    { title: "Analyzing Job Requirements", tip: "Extracting core technical frameworks and stack expectations..." },
    { title: "Mapping Skill Matrix", tip: "Evaluating proficiency importance and soft skill expectations..." },
    { title: "Formulating Q&A Guides", tip: "Mapping role-specific technical prompts and STAR responses..." },
    { title: "Auditing Resume Gaps", tip: "Analyzing ATS keywords and action bullet improvements..." },
    { title: "Composing Elevator Pitch", tip: "Tailoring introductory script and preparing custom teleprompter..." }
];

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();
    
    // Load config state
    loadConfig();
    
    // Render Sidebar History
    renderHistory();
    
    // Add Event Listeners
    setupEventListeners();
});

// --- Config State Managers ---
function loadConfig() {
    state.apiKey = localStorage.getItem('prepai_api_key') || '';
    state.engine = localStorage.getItem('prepai_engine') || 'ollama';
    state.model = localStorage.getItem('prepai_model') || 'gemini-1.5-flash';
    state.ollamaUrl = localStorage.getItem('prepai_ollama_url') || 'http://localhost:11434';
    state.ollamaModel = localStorage.getItem('prepai_ollama_model') || 'gemma3';
    
    // Populate settings form values
    DOM.settingsEngine.value = state.engine;
    DOM.settingsApiKey.value = state.apiKey;
    DOM.settingsModel.value = state.model;
    DOM.settingsOllamaUrl.value = state.ollamaUrl;
    DOM.settingsOllamaModel.value = state.ollamaModel;
    
    toggleEngineFieldVisibility();
    updateApiStatusIndicator();
}

function toggleEngineFieldVisibility() {
    const engine = DOM.settingsEngine.value;

    // Ollama fields
    DOM.ollamaUrlGroup.style.display   = engine === 'ollama' ? 'block' : 'none';
    DOM.ollamaModelGroup.style.display = engine === 'ollama' ? 'block' : 'none';

    // Gemini fields
    DOM.apiKeyGroup.style.display      = engine === 'gemini' ? 'block' : 'none';
    DOM.modelSelectGroup.style.display = engine === 'gemini' ? 'block' : 'none';
}

// Keep legacy name working (referenced by event listener below)
const toggleApiKeyVisibility = toggleEngineFieldVisibility;

function updateApiStatusIndicator() {
    const indicator = DOM.apiStatus.querySelector('.status-indicator');
    if (state.engine === 'ollama') {
        indicator.className = 'status-indicator status-active';
        DOM.statusText.textContent = `Ollama • ${state.ollamaModel}`;
    } else if (state.engine === 'gemini' && state.apiKey) {
        indicator.className = 'status-indicator status-active';
        DOM.statusText.textContent = `Gemini AI (${state.model})`;
    } else {
        indicator.className = 'status-indicator status-fallback';
        DOM.statusText.textContent = 'Static Fallback (Offline)';
    }
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    // Form Submit
    DOM.prepForm.addEventListener('submit', handleFormSubmit);
    
    // Settings modal interactions
    DOM.settingsBtn.addEventListener('click', () => openModal(DOM.settingsModal));
    DOM.settingsCloseBtn.addEventListener('click', () => closeModal(DOM.settingsModal));
    DOM.settingsCancelBtn.addEventListener('click', () => closeModal(DOM.settingsModal));
    DOM.settingsEngine.addEventListener('change', toggleApiKeyVisibility);
    DOM.settingsSaveBtn.addEventListener('click', saveConfigurations);
    DOM.clearHistoryBtn.addEventListener('click', clearHistory);
    
    // History panel item clicks
    DOM.historyList.addEventListener('click', handleHistoryListClick);
    
    // Menu toggles for Mobile
    DOM.menuToggleBtn.addEventListener('click', () => DOM.sidebar.classList.add('mobile-open'));
    DOM.mobileCloseBtn.addEventListener('click', () => DOM.sidebar.classList.remove('mobile-open'));
    
    // Dashboard tab switching controls
    DOM.dashboardTabs.addEventListener('click', handleTabClick);
    
    // Current Plan Actions
    DOM.deleteCurrentPlan.addEventListener('click', deleteActivePlan);
    
    // Copy Pitch & Start Teleprompter
    DOM.copyPitchBtn.addEventListener('click', copyElevatorPitch);
    DOM.startPrompterBtn.addEventListener('click', openTeleprompter);
    
    // Teleprompter interactions
    DOM.prompterCloseBtn.addEventListener('click', closeTeleprompter);
    DOM.prompterPlay.addEventListener('click', toggleTeleprompterPlay);
    DOM.prompterReset.addEventListener('click', resetTeleprompter);
    DOM.prompterSpeed.addEventListener('input', updateTeleprompterSpeed);
    DOM.prompterFont.addEventListener('input', updateTeleprompterFontSize);
    
    // Close modals on clicking overlay background
    window.addEventListener('click', (e) => {
        if (e.target === DOM.settingsModal) closeModal(DOM.settingsModal);
        if (e.target === DOM.prompterModal) closeTeleprompter();
    });
}

// --- Modal Helper Functions ---
function openModal(modalEl) {
    modalEl.classList.add('active');
}

function closeModal(modalEl) {
    modalEl.classList.remove('active');
}

// Save Settings Configurations
function saveConfigurations() {
    const engine        = DOM.settingsEngine.value;
    const apiKey        = DOM.settingsApiKey.value.trim();
    const model         = DOM.settingsModel.value;
    const ollamaUrl     = DOM.settingsOllamaUrl.value.trim() || 'http://localhost:11434';
    const ollamaModel   = DOM.settingsOllamaModel.value.trim() || 'gemma3';
    
    if (engine === 'gemini' && !apiKey) {
        alert('Please provide a Gemini API Key to use the Gemini engine.');
        return;
    }
    
    localStorage.setItem('prepai_engine', engine);
    localStorage.setItem('prepai_api_key', apiKey);
    localStorage.setItem('prepai_model', model);
    localStorage.setItem('prepai_ollama_url', ollamaUrl);
    localStorage.setItem('prepai_ollama_model', ollamaModel);
    
    state.engine      = engine;
    state.apiKey      = apiKey;
    state.model       = model;
    state.ollamaUrl   = ollamaUrl;
    state.ollamaModel = ollamaModel;
    
    updateApiStatusIndicator();
    closeModal(DOM.settingsModal);
}

// Clear History logs
function clearHistory() {
    if (confirm("Are you sure you want to delete all saved interview plans? This cannot be undone.")) {
        state.history = [];
        localStorage.setItem('prepai_history', JSON.stringify([]));
        renderHistory();
        closeModal(DOM.settingsModal);
        showPanel(DOM.welcomePanel);
        state.currentPlan = null;
    }
}

// --- Dynamic Tab Layouts ---
function handleTabClick(e) {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    
    // Clear active classes
    DOM.dashboardTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    DOM.tabPanes.forEach(p => p.classList.remove('active'));
    
    // Add active classes
    btn.classList.add('active');
    const tabName = btn.dataset.tab;
    document.getElementById(`pane-${tabName}`).classList.add('active');
}

// --- App Navigation Panel Switcher ---
function showPanel(panelEl) {
    DOM.welcomePanel.classList.remove('active-panel');
    DOM.loadingPanel.classList.remove('active-panel');
    DOM.dashboardPanel.classList.remove('active-panel');
    
    panelEl.classList.add('active-panel');
}

// --- Generating Plans (Fallback vs API) ---
function handleFormSubmit(e) {
    e.preventDefault();
    
    const jobTitleVal = DOM.jobTitle.value.trim();
    const companyVal = DOM.companyName.value.trim();
    const expVal = DOM.experienceLevel.value;
    const jobDescVal = DOM.jobDescription.value.trim();
    
    if (!jobTitleVal || !companyVal || !jobDescVal) return;
    
    // Close sidebar on mobile
    DOM.sidebar.classList.remove('mobile-open');
    
    // Setup Loading Screen
    showPanel(DOM.loadingPanel);
    DOM.progressBarFill.style.width = '0%';
    
    let currentStep = 0;
    DOM.loaderTitle.textContent = LOADING_TIPS[0].title;
    DOM.loaderTip.textContent = LOADING_TIPS[0].tip;
    
    // Cycle loading prompts dynamically
    const loadingInterval = setInterval(() => {
        currentStep++;
        if (currentStep < LOADING_TIPS.length) {
            DOM.loaderTitle.textContent = LOADING_TIPS[currentStep].title;
            DOM.loaderTip.textContent = LOADING_TIPS[currentStep].tip;
            DOM.progressBarFill.style.width = `${(currentStep / LOADING_TIPS.length) * 80}%`;
        }
    }, 600);
    
    // Route to the configured generation engine
    if (state.engine === 'ollama') {
        generateWithOllamaAPI(jobTitleVal, companyVal, expVal, jobDescVal, loadingInterval);
    } else if (state.engine === 'gemini' && state.apiKey) {
        generateWithGeminiAPI(jobTitleVal, companyVal, expVal, jobDescVal, loadingInterval);
    } else {
        // Static keyword-matching fallback
        setTimeout(() => {
            clearInterval(loadingInterval);
            DOM.progressBarFill.style.width = '100%';
            setTimeout(() => {
                const plan = generateLocalPlan(jobTitleVal, companyVal, expVal, jobDescVal);
                savePlanToHistory(plan);
                displayPlan(plan);
            }, 200);
        }, 3000);
    }
}

// Local Keyword Parser Engine
function generateLocalPlan(jobTitle, companyName, expLevel, jobDesc) {
    const text = (jobTitle + " " + jobDesc).toLowerCase();
    let category = "generic";
    
    if (text.includes("data analyst") || text.includes("analytics") || text.includes("tableau") || text.includes("power bi") || text.includes("powerbi")) {
        category = "data_analyst";
    } else if (text.includes("project manager") || text.includes("project management") || text.includes("asana") || text.includes("jira timeline")) {
        category = "project_management";
    } else if (text.includes("product manager") || text.includes("product owner") || text.includes("roadmap planning")) {
        category = "pm";
    } else if (text.includes("business development") || text.includes("sales representative") || text.includes("prospecting") || text.includes("lead gen") || text.includes("cold outreach") || text.includes("salesforce") || text.includes("hubspot")) {
        category = "business_development";
    } else if (text.includes("marketing") || text.includes("seo campaign") || text.includes("audience segmentation") || text.includes("content strategy")) {
        category = "marketing";
    } else if (text.includes("finance") || text.includes("financial") || text.includes("accounting") || text.includes("forecasting model") || text.includes("budget variance")) {
        category = "finance";
    } else if (text.includes("react") || text.includes("frontend") || text.includes("angular") || text.includes("vue") || text.includes("javascript") || text.includes("css") || text.includes("ui engineer")) {
        category = "frontend";
    } else if (text.includes("backend") || text.includes("node") || text.includes("spring") || text.includes("django") || text.includes("java") || text.includes("python") || text.includes("go ") || text.includes("postgres")) {
        category = "backend";
    } else if (text.includes("aws") || text.includes("cloud") || text.includes("devops") || text.includes("kubernetes") || text.includes("terraform") || text.includes("docker")) {
        category = "cloud";
    }
    
    // Fetch template package copy
    const dbSource = LOCAL_DATABASES[category];
    const expText = DOM.experienceLevel.options[DOM.experienceLevel.selectedIndex].text;
    
    // Parse elevator pitch script mapping variables
    let pitchText = dbSource.elevatorPitch
        .replace("[Company]", companyName)
        .replace("[Job Title]", jobTitle)
        .replace("[Experience Level]", expText);
        
    return {
        id: Date.now(),
        jobTitle,
        companyName,
        expLevel: expText,
        dateStr: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        category,
        matchScore: dbSource.matchScore,
        roleAnalysis: dbSource.roleAnalysis,
        skills: dbSource.skills,
        technicalQuestions: dbSource.technicalQuestions,
        behavioralQuestions: dbSource.behavioralQuestions,
        resumeAudit: dbSource.resumeAudit,
        elevatorPitch: pitchText
    };
}

// --- Ollama Local AI Generator (Gemma) ---
async function generateWithOllamaAPI(jobTitle, companyName, expLevel, jobDesc, loadingInterval) {
    const expText = DOM.experienceLevel.options[DOM.experienceLevel.selectedIndex].text;
    const baseUrl = state.ollamaUrl.replace(/\/$/, ''); // strip trailing slash
    const model   = state.ollamaModel;

    // ── STEP 1: build the universal role-analysis prompt ──────────────────────
    const systemPrompt = `You are an expert career coach, hiring manager, and talent strategist.
Your ONLY output must be a single valid JSON object. No markdown, no code fences, no commentary before or after.

═══════════════════════════════════════════════════════════════
ROLE DETAILS
═══════════════════════════════════════════════════════════════
Job Title      : ${jobTitle}
Company        : ${companyName}
Experience     : ${expText}
Job Description:
${jobDesc}
═══════════════════════════════════════════════════════════════

INSTRUCTIONS:

STEP 1: Role Analysis
Analyze ONLY the provided job description. Extract:
- Job Title
- Responsibilities
- Required Skills
- Preferred Skills
- Soft Skills
- Industry / Function

STEP 2: Key Skills
Generate Key Skills based strictly on the job description.
Rules:
- Key Skills must come directly from the job description.
- Do NOT invent technologies, frameworks, or tools.
- Do NOT default to software engineering skills.
- If a skill is not mentioned or strongly implied in the JD, do not include it.

STEP 3: Technical Questions
Generate Technical Questions testing the actual hard skills required by the role.
Rules:
- "Technical" does NOT mean coding.
- For non-engineering jobs, generate role-specific hard-skill questions.
- Only generate engineering questions if the JD explicitly requires engineering skills.
- Map each question to a competency category from the role analysis.
- Do NOT use software-engineering fallback questions unless software engineering is explicitly required.

STEP 4: Behavioral Questions
Generate Behavioral Questions based directly on the soft skills mentioned in the JD.
Rules:
- Behavioral questions must come directly from the soft skills mentioned in the JD.
- Map every behavioral question to a specific soft skill.

STEP 5: Resume Audit & Pitch
Identify ATS keywords directly from the JD. Create custom bullet point improvements and general tips relevant to this role. Generate a 100-130 word first-person elevator pitch tailored to this role and company.

Return this JSON schema with real, filled-in content based entirely on the above steps:
{
  "matchScore": 85,
  "roleAnalysis": {
    "industry": "Industry / Function extracted from JD",
    "roleType": "Role Type / Title from JD",
    "hardSkills": ["Hard skill 1", "Hard skill 2"],
    "softSkills": ["Soft skill 1", "Soft skill 2"],
    "topCompetencies": ["Competency 1", "Competency 2"]
  },
  "skills": {
    "tech": [
      { "name": "Exact hard skill from JD", "level": "Expert|Intermediate|Entry", "importance": 90 }
    ],
    "soft": [
      { "name": "Exact soft skill from JD", "level": "High|Medium|Low", "importance": 80 }
    ]
  },
  "technicalQuestions": [
    {
      "question": "Role-specific hard-skill question based on JD",
      "difficulty": "hard|medium|easy",
      "category": "Topic / Category",
      "jdRequirement": "Exact hard skill or tool this tests",
      "whyItMatters": "Why this matters for the role",
      "answer": "Detailed answer outline (3-5 sentences)"
    }
  ],
  "behavioralQuestions": [
    {
      "question": "Behavioral question testing a soft skill from the JD",
      "category": "Soft Skill Category (e.g. Communication, Teamwork)",
      "difficulty": "easy|medium|hard",
      "jdRequirement": "The exact soft skill from the JD this maps to",
      "whyItMatters": "Why this soft skill matters for the role",
      "situation": "Situation framing cue",
      "task": "Task framing cue",
      "action": "Action framing cue",
      "result": "Result framing cue",
      "sampleAnswer": "Full STAR-structured sample answer (4-6 sentences)"
    }
  ],
  "resumeAudit": {
    "keywords": ["keyword from JD"],
    "bullets": [
      {
        "before": "Weak bullet point",
        "after": "ATS-optimized bullet point with metrics",
        "impact": "Why this change makes it stronger"
      }
    ],
    "generalTips": ["Specific resume tip tailored to this role"]
  },
  "elevatorPitch": "100-130 word first-person pitch for ${jobTitle} at ${companyName}."
}`;

    try {
        const response = await fetch(`${baseUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                prompt: systemPrompt,
                stream: false,
                format: 'json',
                options: { temperature: 0.7, num_predict: 4096 }
            })
        });

        clearInterval(loadingInterval);

        if (!response.ok) {
            const txt = await response.text();
            throw new Error(`Ollama HTTP ${response.status}: ${txt.slice(0, 200)}`);
        }

        DOM.progressBarFill.style.width = '100%';
        const data = await response.json();

        // Ollama returns the completion in data.response
        let rawText = data.response || '';

        // Strip accidental markdown fences
        rawText = rawText.replace(/^\s*```json/i, '').replace(/```\s*$/, '').trim();

        // Find the outermost JSON object in case there is leading text
        const jsonStart = rawText.indexOf('{');
        const jsonEnd   = rawText.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) throw new Error('No JSON object found in Ollama response.');
        rawText = rawText.slice(jsonStart, jsonEnd + 1);

        const planData = JSON.parse(rawText);

        const plan = {
            id: Date.now(),
            jobTitle,
            companyName,
            expLevel: expText,
            dateStr: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
            generatedBy: `Ollama / ${model}`,
            ...planData
        };

        savePlanToHistory(plan);
        displayPlan(plan);

    } catch (err) {
        clearInterval(loadingInterval);
        console.error('[Ollama]', err);

        const isConnectionError = err.message.includes('Failed to fetch') || err.message.includes('NetworkError');
        const hint = isConnectionError
            ? `Could not reach Ollama at ${baseUrl}.\n\nMake sure Ollama is running:\n  1. Install: https://ollama.com\n  2. Start: ollama serve\n  3. Pull model: ollama pull ${model}\n\nFalling back to static prep plan.`
            : `Ollama error: ${err.message}\n\nFalling back to static prep plan.`;

        alert(hint);
        const plan = generateLocalPlan(jobTitle, companyName, expLevel, jobDesc);
        savePlanToHistory(plan);
        displayPlan(plan);
    }
}

// Live Gemini API generator
async function generateWithGeminiAPI(jobTitle, companyName, expLevel, jobDesc, loadingInterval) {
    const expText = DOM.experienceLevel.options[DOM.experienceLevel.selectedIndex].text;
    
    const prompt = `You are an expert career coach, hiring manager, and talent strategist.
You MUST return a single valid JSON object ONLY. No markdown, no code fences, no text before or after the JSON.

═══════════════════════════════════════════════════════════════
ROLE DETAILS
═══════════════════════════════════════════════════════════════
Job Title      : ${jobTitle}
Company        : ${companyName}
Experience     : ${expText}
Job Description:
${jobDesc}
═══════════════════════════════════════════════════════════════

INSTRUCTIONS:

STEP 1: Role Analysis
Analyze ONLY the provided job description. Extract:
- Job Title
- Responsibilities
- Required Skills
- Preferred Skills
- Soft Skills
- Industry / Function

STEP 2: Key Skills
Generate Key Skills based strictly on the job description.
Rules:
- Key Skills must come directly from the job description.
- Do NOT invent technologies, frameworks, or tools.
- Do NOT default to software engineering skills.
- If a skill is not mentioned or strongly implied in the JD, do not include it.

STEP 3: Technical Questions
Generate Technical Questions testing the actual hard skills required by the role.
Rules:
- "Technical" does NOT mean coding.
- For non-engineering jobs, generate role-specific hard-skill questions.
- Only generate engineering questions if the JD explicitly requires engineering skills.
- Map each question to a competency category from the role analysis.
- Do NOT use software-engineering fallback questions unless software engineering is explicitly required.

STEP 4: Behavioral Questions
Generate Behavioral Questions based directly on the soft skills mentioned in the JD.
Rules:
- Behavioral questions must come directly from the soft skills mentioned in the JD.
- Map every behavioral question to a specific soft skill.

STEP 5: Resume Audit & Pitch
Identify ATS keywords directly from the JD. Create custom bullet point improvements and general tips relevant to this role. Generate a 100-130 word first-person elevator pitch tailored to this role and company.

Return this JSON schema with real, filled-in content based entirely on the above steps:
{
  "matchScore": 85,
  "roleAnalysis": {
    "industry": "Industry / Function extracted from JD",
    "roleType": "Role Type / Title from JD",
    "hardSkills": ["Hard skill 1", "Hard skill 2"],
    "softSkills": ["Soft skill 1", "Soft skill 2"],
    "topCompetencies": ["Competency 1", "Competency 2"]
  },
  "skills": {
    "tech": [
      { "name": "Exact hard skill from JD", "level": "Expert|Intermediate|Entry", "importance": 90 }
    ],
    "soft": [
      { "name": "Exact soft skill from JD", "level": "High|Medium|Low", "importance": 80 }
    ]
  },
  "technicalQuestions": [
    {
      "question": "Role-specific hard-skill question based on JD",
      "difficulty": "hard|medium|easy",
      "category": "Topic / Category",
      "jdRequirement": "Exact hard skill or tool this tests",
      "whyItMatters": "Why this matters for the role",
      "answer": "Detailed answer outline (3-5 sentences)"
    }
  ],
  "behavioralQuestions": [
    {
      "question": "Behavioral question testing a soft skill from the JD",
      "category": "Soft Skill Category (e.g. Communication, Teamwork)",
      "difficulty": "easy|medium|hard",
      "jdRequirement": "The exact soft skill from the JD this maps to",
      "whyItMatters": "Why this soft skill matters for the role",
      "situation": "Situation framing cue",
      "task": "Task framing cue",
      "action": "Action framing cue",
      "result": "Result framing cue",
      "sampleAnswer": "Full STAR-structured sample answer (4-6 sentences)"
    }
  ],
  "resumeAudit": {
    "keywords": ["keyword from JD"],
    "bullets": [
      {
        "before": "Weak bullet point",
        "after": "ATS-optimized bullet point with metrics",
        "impact": "Why this change makes it stronger"
      }
    ],
    "generalTips": ["Specific resume tip tailored to this role"]
  },
  "elevatorPitch": "100-130 word first-person pitch for ${jobTitle} at ${companyName}."
}`;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${state.model}:generateContent?key=${state.apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: 'application/json'
                }
            })
        });
        
        clearInterval(loadingInterval);
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || "HTTP Error connecting to Gemini API.");
        }
        
        DOM.progressBarFill.style.width = '100%';
        const data = await response.json();
        
        let jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Clean up markdown markers if Gemini returned them despite responseMimeType
        jsonText = jsonText.replace(/^\s*```json/i, '').replace(/```\s*$/, '').trim();
        
        const planData = JSON.parse(jsonText);
        
        // Inject metadata fields
        const plan = {
            id: Date.now(),
            jobTitle,
            companyName,
            expLevel: expText,
            dateStr: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
            ...planData
        };
        
        savePlanToHistory(plan);
        displayPlan(plan);
        
    } catch (err) {
        clearInterval(loadingInterval);
        console.error(err);
        alert(`Gemini Generation Failed: ${err.message}\n\nFalling back to local keyword parsing engine.`);
        
        // Fallback to local execution
        const plan = generateLocalPlan(jobTitle, companyName, expLevel, jobDesc);
        savePlanToHistory(plan);
        displayPlan(plan);
    }
}

// Save generated plan to history
function savePlanToHistory(plan) {
    // Keep max 20 plans in list
    state.history = [plan, ...state.history.slice(0, 19)];
    localStorage.setItem('prepai_history', JSON.stringify(state.history));
    renderHistory();
}

// Render Saved plans to sidebar list
function renderHistory() {
    DOM.historyList.innerHTML = '';
    DOM.historyCount.textContent = state.history.length;
    
    if (state.history.length === 0) {
        DOM.historyList.innerHTML = `
            <li class="history-empty" style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 1.5rem 0;">
                No saved plans yet.
            </li>
        `;
        return;
    }
    
    state.history.forEach((plan) => {
        const item = document.createElement('li');
        item.className = `history-item ${state.currentPlan && state.currentPlan.id === plan.id ? 'active' : ''}`;
        item.dataset.id = plan.id;
        
        item.innerHTML = `
            <div class="history-info">
                <span class="history-title">${plan.jobTitle}</span>
                <span class="history-meta">${plan.companyName} • ${plan.dateStr}</span>
            </div>
            <button class="history-delete" title="Delete Plan">
                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
        `;
        DOM.historyList.appendChild(item);
    });
    
    // Re-trigger icon injects
    lucide.createIcons();
}

// Click on history items
function handleHistoryListClick(e) {
    const item = e.target.closest('.history-item');
    const deleteBtn = e.target.closest('.history-delete');
    
    if (!item) return;
    
    const id = parseInt(item.dataset.id);
    const plan = state.history.find(p => p.id === id);
    
    if (deleteBtn) {
        e.stopPropagation();
        if (confirm(`Delete plan for ${plan.jobTitle} at ${plan.companyName}?`)) {
            state.history = state.history.filter(p => p.id !== id);
            localStorage.setItem('prepai_history', JSON.stringify(state.history));
            
            if (state.currentPlan && state.currentPlan.id === id) {
                state.currentPlan = null;
                showPanel(DOM.welcomePanel);
            }
            
            renderHistory();
        }
        return;
    }
    
    // Load selected plan details
    displayPlan(plan);
}

// Delete Active Plan directly from Dashboard
function deleteActivePlan() {
    if (!state.currentPlan) return;
    if (confirm(`Are you sure you want to delete this plan for ${state.currentPlan.jobTitle}?`)) {
        state.history = state.history.filter(p => p.id !== state.currentPlan.id);
        localStorage.setItem('prepai_history', JSON.stringify(state.history));
        state.currentPlan = null;
        showPanel(DOM.welcomePanel);
        renderHistory();
    }
}

// --- Populate Dashboard UI ---
function displayPlan(plan) {
    state.currentPlan = plan;
    
    // Set headers
    DOM.dashJobTitle.textContent = plan.jobTitle;
    DOM.dashCompanyName.textContent = `${plan.companyName} • ${plan.expLevel}`;
    DOM.dashQCount.textContent = (plan.technicalQuestions?.length || 0) + (plan.behavioralQuestions?.length || 0);
    
    // Update Score Circle Gauge
    DOM.matchScoreText.textContent = plan.matchScore;
    const scoreVal = parseInt(plan.matchScore) || 80;
    const strokeDash = 201 - (201 * scoreVal) / 100;
    DOM.scoreCircleProgress.style.strokeDashoffset = strokeDash;
    
    // Render Role Analysis
    const roleAnalysisCard = document.getElementById('role-analysis-card');
    if (plan.roleAnalysis) {
        document.getElementById('analysis-industry').textContent = plan.roleAnalysis.industry || '—';
        document.getElementById('analysis-role-type').textContent = plan.roleAnalysis.roleType || '—';
        
        const hardSkillsContainer = document.getElementById('analysis-hard-skills');
        hardSkillsContainer.innerHTML = '';
        if (plan.roleAnalysis.hardSkills && plan.roleAnalysis.hardSkills.length > 0) {
            plan.roleAnalysis.hardSkills.forEach(skill => {
                const tag = document.createElement('span');
                tag.className = 'analysis-tag';
                tag.textContent = skill;
                hardSkillsContainer.appendChild(tag);
            });
        } else {
            hardSkillsContainer.innerHTML = '<span class="analysis-value">—</span>';
        }
        
        const softSkillsContainer = document.getElementById('analysis-soft-skills');
        softSkillsContainer.innerHTML = '';
        if (plan.roleAnalysis.softSkills && plan.roleAnalysis.softSkills.length > 0) {
            plan.roleAnalysis.softSkills.forEach(skill => {
                const tag = document.createElement('span');
                tag.className = 'analysis-tag';
                tag.textContent = skill;
                softSkillsContainer.appendChild(tag);
            });
        } else {
            softSkillsContainer.innerHTML = '<span class="analysis-value">—</span>';
        }
        
        const competenciesContainer = document.getElementById('analysis-competencies');
        competenciesContainer.innerHTML = '';
        if (plan.roleAnalysis.topCompetencies && plan.roleAnalysis.topCompetencies.length > 0) {
            plan.roleAnalysis.topCompetencies.forEach(comp => {
                const tag = document.createElement('span');
                tag.className = 'analysis-tag';
                tag.textContent = comp;
                competenciesContainer.appendChild(tag);
            });
        } else {
            competenciesContainer.innerHTML = '<span class="analysis-value">—</span>';
        }
        
        roleAnalysisCard.style.display = 'block';
    } else {
        roleAnalysisCard.style.display = 'none';
    }

    // Render TAB contents
    renderSkillsTab(plan);
    renderTechTab(plan);
    renderBehavioralTab(plan);
    renderResumeTab(plan);
    renderPitchTab(plan);
    
    // Highlight sidebar active item
    renderHistory();
    
    // Display dashboard panel
    showPanel(DOM.dashboardPanel);
    
    // Re-render accordion toggle states
    updateTechProgressCount();
    
    // Reset active tab to first
    DOM.dashboardTabs.querySelectorAll('.tab-btn').forEach((b, idx) => {
        if (idx === 0) b.classList.add('active');
        else b.classList.remove('active');
    });
    DOM.tabPanes.forEach((p, idx) => {
        if (idx === 0) p.classList.add('active');
        else p.classList.remove('active');
    });
}

function renderSkillsTab(plan) {
    DOM.skillsTechList.innerHTML = '';
    DOM.skillsSoftList.innerHTML = '';
    
    if (plan.skills?.tech?.length) {
        plan.skills.tech.forEach((skill) => {
            const skillDiv = document.createElement('div');
            skillDiv.className = 'skill-item';
            skillDiv.innerHTML = `
                <div class="skill-meta">
                    <span class="skill-name">${skill.name}</span>
                    <span class="skill-level">${skill.level}</span>
                </div>
                <div class="skill-progress-bar">
                    <div class="skill-fill tech" style="width: ${skill.importance || 70}%"></div>
                </div>
            `;
            DOM.skillsTechList.appendChild(skillDiv);
        });
    }
    
    if (plan.skills?.soft?.length) {
        plan.skills.soft.forEach((skill) => {
            const skillDiv = document.createElement('div');
            skillDiv.className = 'skill-item';
            skillDiv.innerHTML = `
                <div class="skill-meta">
                    <span class="skill-name">${skill.name}</span>
                    <span class="skill-level">${skill.level}</span>
                </div>
                <div class="skill-progress-bar">
                    <div class="skill-fill soft" style="width: ${skill.importance || 70}%"></div>
                </div>
            `;
            DOM.skillsSoftList.appendChild(skillDiv);
        });
    }
}

function renderTechTab(plan) {
    DOM.techQuestionsList.innerHTML = '';
    
    if (!plan.technicalQuestions || plan.technicalQuestions.length === 0) {
        DOM.techQuestionsList.innerHTML = `<p style="color: var(--text-muted);">No technical questions available.</p>`;
        return;
    }
    
    plan.technicalQuestions.forEach((q, idx) => {
        const item = document.createElement('div');
        item.className = 'accordion-item';
        item.dataset.index = idx;
        
        // Unique key for tracking mastered questions in localStorage
        const masteredKey = `prep_mastered_${plan.id}_t_${idx}`;
        const isMastered = localStorage.getItem(masteredKey) === 'true';
        
        item.innerHTML = `
            <button class="accordion-header">
                <div class="question-text-wrapper">
                    <span class="question-num">Q${idx + 1}</span>
                    <span class="question-title">${q.question}</span>
                </div>
                <div class="question-badges">
                    <span class="badge-tag badge-${q.difficulty || 'medium'}">${q.difficulty || 'medium'}</span>
                    <span class="badge-tag badge-topic">${q.category || 'Topic'}</span>
                    <i data-lucide="chevron-down" class="accordion-icon"></i>
                </div>
            </button>
            <div class="accordion-content">
                <div class="accordion-body">
                    ${q.jdRequirement || q.whyItMatters ? `
                    <div class="question-insight-row">
                        ${q.jdRequirement ? `<div class="insight-chip chip-jd"><span class="chip-label">Maps to JD</span><span class="chip-value">${q.jdRequirement}</span></div>` : ''}
                        ${q.whyItMatters ? `<div class="insight-chip chip-why"><span class="chip-label">Why It Matters</span><span class="chip-value">${q.whyItMatters}</span></div>` : ''}
                    </div>` : ''}
                    <div class="answer-section">
                        <h5>Suggested Answer Outline</h5>
                        <p style="white-space: pre-wrap;">${q.answer}</p>
                    </div>
                    <div class="accordion-actions">
                        <label class="check-label">
                            <input type="checkbox" class="tech-mastery-chk" ${isMastered ? 'checked' : ''} data-key="${masteredKey}">
                            <span>Mark as Mastered</span>
                        </label>
                    </div>
                </div>
            </div>
        `;
        
        // Accordion Expand/Collapse Event
        item.querySelector('.accordion-header').addEventListener('click', (e) => {
            if (e.target.closest('.tech-mastery-chk') || e.target.closest('.check-label')) return;
            toggleAccordion(item);
        });
        
        // Mastery checkbox change
        item.querySelector('.tech-mastery-chk').addEventListener('change', (e) => {
            localStorage.setItem(e.target.dataset.key, e.target.checked);
            updateTechProgressCount();
        });
        
        DOM.techQuestionsList.appendChild(item);
    });
    
    lucide.createIcons();
}

function toggleAccordion(item) {
    const isOpen = item.classList.contains('open');
    const content = item.querySelector('.accordion-content');
    
    // Close other items
    const siblings = item.parentNode.querySelectorAll('.accordion-item');
    siblings.forEach(sib => {
        if (sib !== item) {
            sib.classList.remove('open');
            sib.querySelector('.accordion-content').style.maxHeight = null;
        }
    });
    
    if (isOpen) {
        item.classList.remove('open');
        content.style.maxHeight = null;
    } else {
        item.classList.add('open');
        content.style.maxHeight = content.scrollHeight + "px";
    }
}

function updateTechProgressCount() {
    if (!state.currentPlan || !state.currentPlan.technicalQuestions) return;
    
    const count = state.currentPlan.technicalQuestions.length;
    let masteredCount = 0;
    
    state.currentPlan.technicalQuestions.forEach((q, idx) => {
        const key = `prep_mastered_${state.currentPlan.id}_t_${idx}`;
        if (localStorage.getItem(key) === 'true') {
            masteredCount++;
        }
    });
    
    const pct = count > 0 ? (masteredCount / count) * 100 : 0;
    document.getElementById('tech-progress-text').textContent = `${masteredCount} / ${count} Mastered`;
    document.getElementById('tech-progress-bar').style.width = `${pct}%`;
}

function renderBehavioralTab(plan) {
    DOM.behavioralQuestionsList.innerHTML = '';
    
    if (!plan.behavioralQuestions || plan.behavioralQuestions.length === 0) {
        DOM.behavioralQuestionsList.innerHTML = `<p style="color: var(--text-muted);">No behavioral questions available.</p>`;
        return;
    }
    
    plan.behavioralQuestions.forEach((q, idx) => {
        const item = document.createElement('div');
        item.className = 'accordion-item';
        item.dataset.index = idx;
        
        item.innerHTML = `
            <button class="accordion-header">
                <div class="question-text-wrapper">
                    <span class="question-num">Q${idx + 1}</span>
                    <span class="question-title">${q.question}</span>
                </div>
                <div class="question-badges">
                    ${q.difficulty ? `<span class="badge-tag badge-${q.difficulty}">${q.difficulty}</span>` : ''}
                    ${q.category ? `<span class="badge-tag badge-topic">${q.category}</span>` : '<span class="badge-tag badge-topic">STAR Method</span>'}
                    <i data-lucide="chevron-down" class="accordion-icon"></i>
                </div>
            </button>
            <div class="accordion-content">
                <div class="accordion-body">
                    ${q.jdRequirement || q.whyItMatters ? `
                    <div class="question-insight-row">
                        ${q.jdRequirement ? `<div class="insight-chip chip-jd"><span class="chip-label">Maps to JD</span><span class="chip-value">${q.jdRequirement}</span></div>` : ''}
                        ${q.whyItMatters ? `<div class="insight-chip chip-why"><span class="chip-label">Why It Matters</span><span class="chip-value">${q.whyItMatters}</span></div>` : ''}
                    </div>` : ''}
                    <div class="star-grid">
                        <div class="star-box-col s">
                            <div class="star-letter">S</div>
                            <span class="star-label-text">Situation</span>
                            <p class="star-desc">${q.situation || 'Outline the context...'}</p>
                        </div>
                        <div class="star-box-col t">
                            <div class="star-letter">T</div>
                            <span class="star-label-text">Task</span>
                            <p class="star-desc">${q.task || 'Outline the goals...'}</p>
                        </div>
                        <div class="star-box-col a">
                            <div class="star-letter">A</div>
                            <span class="star-label-text">Action</span>
                            <p class="star-desc">${q.action || 'Outline your work...'}</p>
                        </div>
                        <div class="star-box-col r">
                            <div class="star-letter">R</div>
                            <span class="star-label-text">Result</span>
                            <p class="star-desc">${q.result || 'Outline the metrics...'}</p>
                        </div>
                    </div>
                    
                    <div class="answer-section">
                        <h5>Full Example Answer</h5>
                        <p style="white-space: pre-wrap;">${q.sampleAnswer || q.answer || ''}</p>
                    </div>
                </div>
            </div>
        `;
        
        // Accordion Expand/Collapse Event
        item.querySelector('.accordion-header').addEventListener('click', () => {
            toggleAccordion(item);
        });
        
        DOM.behavioralQuestionsList.appendChild(item);
    });
    
    lucide.createIcons();
}

function renderResumeTab(plan) {
    DOM.resumeKeywordsList.innerHTML = '';
    DOM.resumeBulletsList.innerHTML = '';
    DOM.resumeGeneralTips.innerHTML = '';
    
    // Render Keywords
    if (plan.resumeAudit?.keywords?.length) {
        plan.resumeAudit.keywords.forEach((keyword) => {
            const pill = document.createElement('span');
            pill.className = 'keyword-pill';
            pill.innerHTML = `<i data-lucide="plus-circle"></i><span>${keyword}</span>`;
            DOM.resumeKeywordsList.appendChild(pill);
        });
    } else {
        DOM.resumeKeywordsList.innerHTML = `<p style="color: var(--text-muted);">No keyword suggestions available.</p>`;
    }
    
    // Render Bullet comparison
    if (plan.resumeAudit?.bullets?.length) {
        plan.resumeAudit.bullets.forEach((bullet) => {
            const bItem = document.createElement('div');
            bItem.className = 'bullet-item';
            bItem.innerHTML = `
                <div class="bullet-comparison">
                    <div class="comp-box before">
                        <span class="bullet-label-tag red">Weak / Original</span>
                        <p>"${bullet.before}"</p>
                    </div>
                    <div class="comp-box after">
                        <span class="bullet-label-tag green">ATS Optimized Replacement</span>
                        <p>"${bullet.after}"</p>
                    </div>
                </div>
                <div class="bullets-impact-note">
                    <strong>Coach Note:</strong> ${bullet.impact}
                </div>
            `;
            DOM.resumeBulletsList.appendChild(bItem);
        });
    } else {
        DOM.resumeBulletsList.innerHTML = `<p style="color: var(--text-muted);">No bullet recommendations available.</p>`;
    }
    
    // Render general recommendations
    if (plan.resumeAudit?.generalTips?.length) {
        plan.resumeAudit.generalTips.forEach((tip) => {
            const li = document.createElement('li');
            li.textContent = tip;
            DOM.resumeGeneralTips.appendChild(li);
        });
    } else {
        DOM.resumeGeneralTips.innerHTML = `<li>Use reverse chronological layouts.</li><li>List quantitative metrics alongside actions.</li>`;
    }
    
    lucide.createIcons();
}

function renderPitchTab(plan) {
    DOM.elevatorPitchText.innerHTML = plan.elevatorPitch || "Your elevator pitch script will appear here.";
}

// --- Copy & Practice Features ---
function copyElevatorPitch() {
    if (!state.currentPlan?.elevatorPitch) return;
    
    navigator.clipboard.writeText(state.currentPlan.elevatorPitch)
        .then(() => {
            const textSpan = DOM.copyPitchBtn.querySelector('span');
            const icon = DOM.copyPitchBtn.querySelector('i');
            
            textSpan.textContent = "Copied!";
            icon.setAttribute('data-lucide', 'check');
            lucide.createIcons();
            
            setTimeout(() => {
                textSpan.textContent = "Copy Pitch";
                icon.setAttribute('data-lucide', 'copy');
                lucide.createIcons();
            }, 2000);
        })
        .catch(err => {
            console.error("Clipboard copy failed: ", err);
        });
}

// --- Teleprompter Mode Engine ---
function openTeleprompter() {
    if (!state.currentPlan?.elevatorPitch) return;
    
    // Populate text inside prompter
    DOM.prompterScroller.textContent = state.currentPlan.elevatorPitch;
    
    // Set slider bindings
    DOM.prompterSpeed.value = state.prompter.speed;
    DOM.prompterFont.value = state.prompter.fontSize;
    
    // Apply styling size
    DOM.prompterScroller.style.fontSize = `${state.prompter.fontSize}px`;
    
    // Reset positioning and timers
    resetTeleprompter();
    
    openModal(DOM.prompterModal);
}

function closeTeleprompter() {
    stopTeleprompterScroll();
    closeModal(DOM.prompterModal);
}

function toggleTeleprompterPlay() {
    if (state.prompter.isRunning) {
        stopTeleprompterScroll();
    } else {
        startTeleprompterScroll();
    }
}

function startTeleprompterScroll() {
    state.prompter.isRunning = true;
    
    // Change Play Icon to Pause
    DOM.prompterPlayIcon.setAttribute('data-lucide', 'pause');
    lucide.createIcons();
    
    // Start Time Clock
    state.prompter.timer = setInterval(() => {
        state.prompter.seconds++;
        const mins = String(Math.floor(state.prompter.seconds / 60)).padStart(2, '0');
        const secs = String(state.prompter.seconds % 60).padStart(2, '0');
        DOM.prompterTimer.textContent = `${mins}:${secs}`;
    }, 1000);
    
    // Start Scroll motion loop
    let currentScroll = parseFloat(DOM.prompterScroller.style.transform.replace('translateY(', '').replace('px)', '')) || 100;
    
    state.prompter.scrollInterval = setInterval(() => {
        // Adjust scroll speed (higher speed = scroll faster, translating upwards)
        const scrollFactor = state.prompter.speed * 0.15;
        currentScroll -= scrollFactor;
        
        DOM.prompterScroller.style.transform = `translateY(${currentScroll}px)`;
        
        // Stop scroll if we scrolled past the card bounds
        const containerHeight = DOM.prompterScroller.parentElement.offsetHeight;
        const textHeight = DOM.prompterScroller.offsetHeight;
        
        if (Math.abs(currentScroll) > (textHeight + containerHeight / 2)) {
            stopTeleprompterScroll();
        }
    }, 16); // ~60fps smooth rendering
}

function stopTeleprompterScroll() {
    state.prompter.isRunning = false;
    DOM.prompterPlayIcon.setAttribute('data-lucide', 'play');
    lucide.createIcons();
    
    clearInterval(state.prompter.timer);
    clearInterval(state.prompter.scrollInterval);
}

function resetTeleprompter() {
    stopTeleprompterScroll();
    state.prompter.seconds = 0;
    DOM.prompterTimer.textContent = "00:00";
    
    // Reset positioning
    DOM.prompterScroller.style.transform = `translateY(120px)`;
}

function updateTeleprompterSpeed() {
    state.prompter.speed = parseInt(DOM.prompterSpeed.value);
}

function updateTeleprompterFontSize() {
    state.prompter.fontSize = parseInt(DOM.prompterFont.value);
    DOM.prompterScroller.style.fontSize = `${state.prompter.fontSize}px`;
}
