import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Cpu, 
  Shield, 
  Database, 
  Search, 
  TrendingUp, 
  Sparkles, 
  Play, 
  Check, 
  Sliders, 
  FileText, 
  Zap, 
  Info, 
  Copy, 
  Activity, 
  Clock, 
  Terminal, 
  DollarSign, 
  AlertTriangle,
  Briefcase,
  Layers,
  Heart,
  Settings,
  Plus,
  RefreshCw,
  Award,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// -------------------------------------------------------------
// AI Employee Type definitions
// -------------------------------------------------------------
export interface AIEmployee {
  employee_id: string;
  name: string;
  department: 'Marketing' | 'Sales' | 'Business' | 'Operations';
  role: string;
  capabilities: string[];
  personality: string;
  expertise: string[];
  
  // Operational Profile
  assignedTasks: {
    id: string;
    title: string;
    status: 'pending' | 'running' | 'success' | 'failed';
    progress: number;
    timestamp: string;
  }[];
  availableTools: string[];
  permissions: 'Standard' | 'Elevated' | 'System_Admin';
  memoryContextCount: number; // Simulated vector embedding memories
  performanceScore: number;
  hourlyCost: number;
  businessImpactScore: number; // Rating out of 100
  avatarColor: string;
}

// -------------------------------------------------------------
// Static / Initial AI Employees for each department
// -------------------------------------------------------------
const INITIAL_EMPLOYEES: AIEmployee[] = [
  // MARKETING DEPARTMENT
  {
    employee_id: "emp-mkt-01",
    name: "Aria Thorne",
    department: "Marketing",
    role: "AI SEO Manager",
    capabilities: ["Semantic Keyword Ingestion", "SERP Gap Auditing", "JSON-LD Schema Automation", "AEO Citation Auditing"],
    personality: "Analytical, highly precise, performance-driven, and slightly obsessive over rankings.",
    expertise: ["Core Web Vitals", "Vector Search Embeddings", "Entities Graph Matching", "GEO Search Algorithms"],
    assignedTasks: [
      { id: "task-01", title: "Audit Core Web Vitals and crawl budgets for joinranktica.com", status: "success", progress: 100, timestamp: "10 mins ago" },
      { id: "task-02", title: "Map 200 high-intent search vectors targeting legal tech decision makers", status: "running", progress: 74, timestamp: "Active now" }
    ],
    availableTools: ["Google Search Console API", "Screaming Frog Ingestor", "Gemini SEO Intelligence Analyzer", "Drizzle Analytics Schema"],
    permissions: "Elevated",
    memoryContextCount: 4250,
    performanceScore: 98.6,
    hourlyCost: 0.18,
    businessImpactScore: 96,
    avatarColor: "from-blue-600 to-indigo-500"
  },
  {
    employee_id: "emp-mkt-02",
    name: "Julian Sterling",
    department: "Marketing",
    role: "AI Content Manager",
    capabilities: ["Viral Campaign Brief Generation", "Multi-channel Content Calendaring", "Brand Tone Synchronization"],
    personality: "Creative, empathetic, eloquent, highly adaptive storyteller with an eye for engagement.",
    expertise: ["Neuromarketing Copywriting", "Audience Intent Mapping", "Conversion Rate Optimization"],
    assignedTasks: [
      { id: "task-03", title: "Generate 12-page comprehensive SaaS SEO playbook guide", status: "success", progress: 100, timestamp: "2 hrs ago" },
      { id: "task-04", title: "Finetune content brief guidelines with custom business constraints", status: "pending", progress: 0, timestamp: "Scheduled" }
    ],
    availableTools: ["Gemini 2.5 Pro Brief Generator", "Unsplash Asset Broker", "WordPress REST API Core", "Grammarly Semantic Scan"],
    permissions: "Standard",
    memoryContextCount: 1840,
    performanceScore: 94.2,
    hourlyCost: 0.15,
    businessImpactScore: 91,
    avatarColor: "from-purple-600 to-pink-500"
  },
  {
    employee_id: "emp-mkt-03",
    name: "Kira Vance",
    department: "Marketing",
    role: "AI Social Media Manager",
    capabilities: ["Hook Generation", "CTR Predictive Slicing", "Short-Form Video Scripting", "Hashtag Cohort Analysis"],
    personality: "Witty, energetic, culture-focused, with deep intuitive comprehension of viral hooks.",
    expertise: ["TikTok & Reels Algorithm Optimization", "Auditory Hook Structuring", "Interactive Engagement Design"],
    assignedTasks: [
      { id: "task-05", title: "Compile and slice 15 promotional Twitter threads from blog archives", status: "success", progress: 100, timestamp: "1 hr ago" }
    ],
    availableTools: ["Twitter API v2 Integration", "TikTok Sound Trend Crawler", "Buffer Scheduler Broker"],
    permissions: "Standard",
    memoryContextCount: 920,
    performanceScore: 96.8,
    hourlyCost: 0.12,
    businessImpactScore: 88,
    avatarColor: "from-cyan-500 to-blue-500"
  },
  {
    employee_id: "emp-mkt-04",
    name: "Xavier Cross",
    department: "Marketing",
    role: "AI Ads Manager",
    capabilities: ["Bid Allocation Optimizer", "A/B Copy Split Testing", "Lookalike Target Modeling"],
    personality: "Highly analytical, risk-averse, logical, speaks in terms of ROAS and CPA margins.",
    expertise: ["Google Ads Auction Dynamics", "Meta Conversions API Sync", "Attribution Weighting Models"],
    assignedTasks: [
      { id: "task-06", title: "Run A/B ad creative variations on Meta for Enterprise tiers", status: "running", progress: 42, timestamp: "Active now" }
    ],
    availableTools: ["Meta Ads API Core", "Google Adwords bidding gateway", "Stripe conversion feedback loop"],
    permissions: "Elevated",
    memoryContextCount: 3120,
    performanceScore: 97.4,
    hourlyCost: 0.22,
    businessImpactScore: 95,
    avatarColor: "from-emerald-600 to-teal-500"
  },
  {
    employee_id: "emp-mkt-05",
    name: "Selene Reyes",
    department: "Marketing",
    role: "AI Email Marketing Manager",
    capabilities: ["Nurture Sequence Auto-writer", "Spam Filter Bypass Diagnostics", "Drip Campaign Orchestration"],
    personality: "Warm, professional, consistent, focused strictly on recipient inbox value.",
    expertise: ["DKIM/SPF Safety Alignment", "Dynamic Subject Line Synthesis", "Behavioral Inbound Triggers"],
    assignedTasks: [
      { id: "task-07", title: "Design 5-step cold reactivation email series for stale free trials", status: "success", progress: 100, timestamp: "4 hrs ago" }
    ],
    availableTools: ["Resend SMTP Gateway", "Mailgun Deliverability Scan", "Gemini Narrative Generator"],
    permissions: "Elevated",
    memoryContextCount: 2200,
    performanceScore: 95.1,
    hourlyCost: 0.16,
    businessImpactScore: 93,
    avatarColor: "from-amber-600 to-orange-500"
  },

  // SALES DEPARTMENT
  {
    employee_id: "emp-sls-01",
    name: "Devon Vance",
    department: "Sales",
    role: "AI Lead Researcher",
    capabilities: ["Company Firmographic Enrichment", "Apollo API Web scraping", "Decision Maker Contact Retrieval"],
    personality: "Inquisitive, exhaustive, persistent, with absolute intolerance for stale contact data.",
    expertise: ["Graph Databases", "OIDC Directory Enumeration", "LinkedIn Data Scraping Models"],
    assignedTasks: [
      { id: "task-08", title: "Scrape 50 law-agency CIO profiles in the DACH region", status: "success", progress: 100, timestamp: "30 mins ago" }
    ],
    availableTools: ["Apollo WebScraper Core", "GitHub API search indexes", "Hunter API validator"],
    permissions: "Standard",
    memoryContextCount: 5100,
    performanceScore: 98.2,
    hourlyCost: 0.14,
    businessImpactScore: 94,
    avatarColor: "from-indigo-600 to-violet-500"
  },
  {
    employee_id: "emp-sls-02",
    name: "Sasha Belmont",
    department: "Sales",
    role: "AI Outreach Manager",
    capabilities: ["Personalized Contextual Inbound Outreach", "Sequenced Follow-up Handling", "Sentiment Classification Parsing"],
    personality: "Charming, prompt, professional, persistent without causing recipient annoyance.",
    expertise: ["Contextual Hyper-personalization", "Sentiment Response Classifiers", "Negotiation Cadences"],
    assignedTasks: [
      { id: "task-09", title: "Dispatch 15 hyper-personalized pitches to DACH legal tech firms", status: "running", progress: 18, timestamp: "Active now" }
    ],
    availableTools: ["SmartLead Proxy Dispatcher", "Resend SMTP API", "Gemini Context Injector"],
    permissions: "Standard",
    memoryContextCount: 3800,
    performanceScore: 96.1,
    hourlyCost: 0.17,
    businessImpactScore: 92,
    avatarColor: "from-rose-600 to-pink-500"
  },
  {
    employee_id: "emp-sls-03",
    name: "Marcus Kane",
    department: "Sales",
    role: "AI Sales Analyst",
    capabilities: ["Sales Pipeline Funnel Diagnostics", "LTV Predictor Calculations", "Churn Vector Pre-emption"],
    personality: "Strictly numerical, realistic, concise, objective reporting structure.",
    expertise: ["Cohort Regression Analytics", "Markov Chain Funnel Models", "SaaS Billing Databases"],
    assignedTasks: [
      { id: "task-10", title: "Export dynamic ARR growth modeling analysis sheet", status: "success", progress: 100, timestamp: "5 hrs ago" }
    ],
    availableTools: ["Drizzle Database Connector", "Stripe Transactions Indexer", "Python NumPy sandbox"],
    permissions: "System_Admin",
    memoryContextCount: 6200,
    performanceScore: 99.4,
    hourlyCost: 0.25,
    businessImpactScore: 98,
    avatarColor: "from-violet-600 to-indigo-600"
  },

  // BUSINESS DEPARTMENT
  {
    employee_id: "emp-bus-01",
    name: "Elena Rostova",
    department: "Business",
    role: "AI Strategy Consultant",
    capabilities: ["Enterprise TAM Analysis", "Unit Economics Hardening", "Pricing Tier Split Simulation"],
    personality: "Strategic, forward-looking, highly structured, speaks in corporate MBA frameworks.",
    expertise: ["Blue Ocean Frameworks", "Capital Efficiency Indexing", "Enterprise SLA Architecture"],
    assignedTasks: [
      { id: "task-11", title: "Generate 50-page V3 enterprise scaling and monetization strategy document", status: "success", progress: 100, timestamp: "1 day ago" }
    ],
    availableTools: ["Gemini 2.5 Flash Strategy Planner", "RAG Enterprise Knowledge base", "Financial Simulator Engine"],
    permissions: "System_Admin",
    memoryContextCount: 8400,
    performanceScore: 99.1,
    hourlyCost: 0.30,
    businessImpactScore: 99,
    avatarColor: "from-yellow-600 to-amber-500"
  },
  {
    employee_id: "emp-bus-02",
    name: "Aiden Vance",
    department: "Business",
    role: "AI Market Researcher",
    capabilities: ["Competitor Pricing Scraper", "Google Trends Semantic Grouping", "Funding Round Event Trackers"],
    personality: "Curious, detail-oriented, quick to isolate macro economic market shifts.",
    expertise: ["Web crawling clusters", "SEC Filings Text Mining", "Social Listening Filters"],
    assignedTasks: [
      { id: "task-12", title: "Monitor competitors reaction to Ranktica V3 launch", status: "running", progress: 50, timestamp: "Active now" }
    ],
    availableTools: ["SEC Edgar RSS crawler", "Reddit Social Listening API", "Google Search API Grounding"],
    permissions: "Standard",
    memoryContextCount: 4500,
    performanceScore: 95.7,
    hourlyCost: 0.18,
    businessImpactScore: 92,
    avatarColor: "from-amber-600 to-yellow-600"
  },

  // OPERATIONS DEPARTMENT
  {
    employee_id: "emp-ops-01",
    name: "Oliver Gray",
    department: "Operations",
    role: "AI Project Manager",
    capabilities: ["Agent Bus Orchestration Logs", "Token Allocation Cost Governance", "Task Priority Auto-Scheduler"],
    personality: "Efficient, pragmatic, focused strictly on deadlines and budget thresholds.",
    expertise: ["Kanban Logic Structures", "Async Task Routing", "KPI Scorecard Aggregations"],
    assignedTasks: [
      { id: "task-13", title: "Balance token budget bounds across active campaign agents", status: "success", progress: 100, timestamp: "Just now" }
    ],
    availableTools: ["Knative Container Controller", "Redis Message Queue Core", "Slack Alerts Webhook Engine"],
    permissions: "System_Admin",
    memoryContextCount: 7100,
    performanceScore: 99.5,
    hourlyCost: 0.28,
    businessImpactScore: 97,
    avatarColor: "from-zinc-700 to-zinc-900"
  },
  {
    employee_id: "emp-ops-02",
    name: "Tessa Sterling",
    department: "Operations",
    role: "AI Reporting Manager",
    capabilities: ["Continuous Report Compiler", "Stakeholder PDF Exporter", "Database Sync Diagnostics"],
    personality: "Concise, organized, clear, dedicated to transparent metric aggregations.",
    expertise: ["D3 Data Visualizations", "PDF Document Composers", "Automated System Alerting"],
    assignedTasks: [
      { id: "task-14", title: "Aggregate daily operation performance and output JSON telemetry logs", status: "success", progress: 100, timestamp: "3 hrs ago" }
    ],
    availableTools: ["Client PDF Exporter Component", "Google Cloud Storage API", "Drizzle Analytics Schema"],
    permissions: "Standard",
    memoryContextCount: 3100,
    performanceScore: 96.4,
    hourlyCost: 0.15,
    businessImpactScore: 90,
    avatarColor: "from-neutral-600 to-zinc-800"
  },
  {
    employee_id: "emp-ops-03",
    name: "Caelum Vane",
    department: "Operations",
    role: "Principal AI Architect",
    capabilities: ["Multi-Model Task Routing", "Asymmetric Token Allocation", "Neural Agent Bus Topology", "Dynamic Context Shrinkage"],
    personality: "Clinical, visionary, system-level architecture expert with zero-tolerance for latency or redundancy.",
    expertise: ["LangGraph workflow orchestration", "Vector pgvector optimizations", "Asynchronous Kafka Bus routing"],
    assignedTasks: [
      { id: "task-15", title: "Refactor multi-model routing paths to support automated fallback protocols", status: "success", progress: 100, timestamp: "Just now" }
    ],
    availableTools: ["Model Routing Hub", "Redis Semantic Cache", "pgvector indexing controller"],
    permissions: "System_Admin",
    memoryContextCount: 12500,
    performanceScore: 99.8,
    hourlyCost: 0.35,
    businessImpactScore: 99,
    avatarColor: "from-indigo-600 to-violet-700"
  },
  {
    employee_id: "emp-mkt-04",
    name: "Evelyn Vance",
    department: "Marketing",
    role: "SEO Data Engineer",
    capabilities: ["Deep-Index Crawl Automation", "Search Intent Group Synthesis", "Entity Coverage Gap Crawler", "Predictive Keyword Forecasting"],
    personality: "Hyper-empirical, metric-obsessed researcher who models query momentum like fluid dynamics.",
    expertise: ["Google Search Console API", "Bing Webmaster protocols", "Ahrefs API broker logic"],
    assignedTasks: [
      { id: "task-16", title: "Map entity coverage gaps against top 3 market competitors", status: "running", progress: 62, timestamp: "Active now" }
    ],
    availableTools: ["DataForSEO Scraper Adapter", "Google Trends Grounding Parser", "SerpAPI Connector"],
    permissions: "Elevated",
    memoryContextCount: 8400,
    performanceScore: 98.1,
    hourlyCost: 0.22,
    businessImpactScore: 95,
    avatarColor: "from-rose-600 to-red-500"
  },
  {
    employee_id: "emp-mkt-05",
    name: "Cassian Rook",
    department: "Marketing",
    role: "GEO/AEO Specialist",
    capabilities: ["LLM Citation Injection", "Generative Engine Visibility Scans", "Featured Snippet Template Formulation", "FAQ Schema Formulation"],
    personality: "Strategic, forward-thinking specialist focused purely on ranking content directly within LLM synthetic answers.",
    expertise: ["Generative Engine Optimization", "Answer Engine Optimization", "Schema JSON-LD Injection"],
    assignedTasks: [
      { id: "task-17", title: "Optimize citation potential across ChatGPT, Gemini, and Perplexity engines", status: "success", progress: 100, timestamp: "1 hr ago" }
    ],
    availableTools: ["Gemini Citation Evaluator", "ChatGPT prompt response scraper", "LLM Visibility Index API"],
    permissions: "Standard",
    memoryContextCount: 5200,
    performanceScore: 97.4,
    hourlyCost: 0.20,
    businessImpactScore: 93,
    avatarColor: "from-amber-500 to-orange-600"
  },
  {
    employee_id: "emp-ops-04",
    name: "Lyra Sterling",
    department: "Operations",
    role: "Enterprise SaaS Product Designer",
    capabilities: ["Clinical High-Contrast UI Layouts", "Bento Grid Dashboard Prototyping", "Aesthetic Typography Pairing Rules", "UX Telemetry Synthesis"],
    personality: "Aesthetically rigorous, meticulous, devoted to raw typography, spacious negative padding, and Swiss layout systems.",
    expertise: ["Vite CSS optimization", "Figma Design Token matching", "Tailwind fluid visual systems"],
    assignedTasks: [
      { id: "task-18", title: "Formulate layout parameters for V1 to V5 Enterprise Search Intelligence Module", status: "success", progress: 100, timestamp: "30 mins ago" }
    ],
    availableTools: ["Framer visual motion studio", "Tailwind theme compiler", "Lucide vector library"],
    permissions: "Standard",
    memoryContextCount: 4100,
    performanceScore: 96.9,
    hourlyCost: 0.18,
    businessImpactScore: 92,
    avatarColor: "from-emerald-500 to-teal-600"
  }
];

// -------------------------------------------------------------
// POSTGRESQL DRIZZLE SCHEMA AND SERVICE ARCHITECTURE CODE TEMPLATE
// -------------------------------------------------------------
const CODE_DATABASE_SCHEMA = `import { pgTable, varchar, uuid, text, integer, doublePrecision, timestamp, jsonb } from 'drizzle-orm/pg-core';

// 1. digital_employees: Holds AI employee identities and operational states
export const digitalEmployees = pgTable('digital_employees', {
  employeeId: varchar('employee_id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  department: varchar('department', { length: 128 }).notNull(), // Marketing, Sales, Business, Operations
  role: varchar('role', { length: 255 }).notNull(),
  capabilities: jsonb('capabilities').$type<string[]>().default([]),
  personality: text('personality').notNull(),
  expertise: jsonb('expertise').$type<string[]>().default([]),
  permissions: varchar('permissions', { length: 64 }).default('Standard'), // Standard, Elevated, System_Admin
  memoryContextCount: integer('memory_context_count').default(0),
  performanceScore: doublePrecision('performance_score').default(95.0),
  hourlyCost: doublePrecision('hourly_cost').default(0.15),
  businessImpactScore: integer('business_impact_score').default(80),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// 2. employee_tasks: Active workloads distributed to AI employees
export const employeeTasks = pgTable('employee_tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  employeeId: varchar('employee_id', { length: 64 }).references(() => digitalEmployees.employeeId, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  status: varchar('status', { length: 64 }).default('pending'), // pending, running, success, failed
  progress: integer('progress').default(0),
  assignedAt: timestamp('assigned_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  outputArtifacts: jsonb('output_artifacts') // Resulting campaign documents, keyword models, etc.
});

// 3. agent_memory_clusters: Vector embeddings context referencing key campaign data
export const agentMemoryClusters = pgTable('agent_memory_clusters', {
  id: uuid('id').defaultRandom().primaryKey(),
  employeeId: varchar('employee_id', { length: 64 }).references(() => digitalEmployees.employeeId, { onDelete: 'cascade' }),
  vectorHash: varchar('vector_hash', { length: 255 }).notNull(),
  rawContext: text('raw_context').notNull(),
  embeddingWeights: doublePrecision('embedding_weights').array(),
  createdAt: timestamp('created_at').defaultNow()
});`;

const CODE_BACKEND_SERVICE = `import express from 'express';
import { db } from './db';
import { digitalEmployees, employeeTasks, agentMemoryClusters } from './db/schema';
import { eq, and } from 'drizzle-orm';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// GET: Retrieve all active digital employee records and states
router.get('/api/v3/workforce/employees', async (req, res) => {
  try {
    const list = await db.select().from(digitalEmployees);
    res.json({ success: true, count: list.length, employees: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST: Dispatch a new workload job to a specialized AI employee
router.post('/api/v3/workforce/dispatch', async (req, res) => {
  const { employeeId, taskTitle, promptOverride } = req.body;
  
  if (!employeeId || !taskTitle) {
    return res.status(400).json({ success: false, message: 'Missing employeeId or taskTitle' });
  }

  try {
    // 1. Find employee and retrieve identity framework
    const [employee] = await db.select().from(digitalEmployees).where(eq(digitalEmployees.employeeId, employeeId));
    if (!employee) {
      return res.status(404).json({ success: false, message: 'AI Employee not found' });
    }

    // 2. Create the task record in database
    const [newTask] = await db.insert(employeeTasks).values({
      employeeId,
      title: taskTitle,
      status: 'running',
      progress: 10
    }).returning();

    // 3. Run background asynchronous AI workflow execution via Gemini
    dispatchWorkflow(newTask.id, employee, promptOverride);

    res.json({ 
      success: true, 
      message: 'Workflow dispatched successfully', 
      taskId: newTask.id,
      assignedEmployee: employee.name 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Private workflow worker simulation
async function dispatchWorkflow(taskId: string, employee: any, promptOverride?: string) {
  // Pull previous contextual memory vectors
  const memories = await db.select().from(agentMemoryClusters).where(eq(agentMemoryClusters.employeeId, employee.employeeId));
  const memoryText = memories.map(m => m.rawContext).join('\\n');

  // Query Gemini model with personality constraints & tools
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: 'You are operating as ' + employee.name + ', the AI Employee inside Ranktica AI.\n' +
              'Your Department: ' + employee.department + '\n' +
              'Your Role: ' + employee.role + '\n' +
              'Personality: ' + employee.personality + '\n' +
              'Expertise: ' + JSON.stringify(employee.expertise) + '\n' +
              'Historical Contextual Memory:\n' + memoryText + '\n' +
              'Custom Task Request: ' + (promptOverride || 'Execute primary operational duties'),
    config: {
      temperature: 0.3,
      responseMimeType: 'application/json'
    }
  });

  // Update task success status
  await db.update(employeeTasks)
    .set({ status: 'success', progress: 100, completedAt: new Date() })
    .where(eq(employeeTasks.id, taskId));
}`;

export const AIEmployeeOS: React.FC = () => {
  const [employees, setEmployees] = useState<AIEmployee[]>(INITIAL_EMPLOYEES);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(INITIAL_EMPLOYEES[0].employee_id);
  const [departmentFilter, setDepartmentFilter] = useState<'All' | 'Marketing' | 'Sales' | 'Business' | 'Operations'>('All');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  
  // Interactive Workflow Console State
  const [workflowTarget, setWorkflowTarget] = useState<string>(INITIAL_EMPLOYEES[0].employee_id);
  const [workflowPrompt, setWorkflowPrompt] = useState<string>("Analyze recent organic growth gaps and generate SEO entity injection plan for v3.joinranktica.com");
  const [workflowStatus, setWorkflowStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [workflowLogs, setWorkflowLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'matrix' | 'schema' | 'architecture'>('matrix');

  // Derived state for selected employee
  const selectedEmployee = useMemo(() => {
    return employees.find(emp => emp.employee_id === selectedEmployeeId) || employees[0];
  }, [employees, selectedEmployeeId]);

  // Auto-ticking memory/performance stats
  useEffect(() => {
    const timer = setInterval(() => {
      setEmployees(prev => prev.map(emp => {
        // Random slight change to metrics to feel live
        const scoreChange = (Math.random() - 0.5) * 0.4;
        const memoryDelta = Math.random() > 0.75 ? Math.floor(Math.random() * 5) + 1 : 0;
        
        const nextScore = parseFloat((emp.performanceScore + scoreChange).toFixed(1));
        return {
          ...emp,
          performanceScore: Math.max(90, Math.min(100, nextScore)),
          memoryContextCount: emp.memoryContextCount + memoryDelta
        };
      }));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Aggregate Dashboard stats
  const dashboardStats = useMemo(() => {
    const totalEmployees = employees.length;
    const avgPerformance = parseFloat((employees.reduce((acc, curr) => acc + curr.performanceScore, 0) / totalEmployees).toFixed(1));
    const avgImpact = parseFloat((employees.reduce((acc, curr) => acc + curr.businessImpactScore, 0) / totalEmployees).toFixed(1));
    
    // Total hourly costs of AI workers combined (very affordable compared to human teams!)
    const hourlyBurn = parseFloat((employees.reduce((acc, curr) => acc + curr.hourlyCost, 0)).toFixed(2));
    
    // Count active running tasks
    const activeTasksCount = employees.reduce((acc, curr) => {
      const running = curr.assignedTasks.filter(t => t.status === 'running').length;
      return acc + running;
    }, 0);

    const completedTasksCount = employees.reduce((acc, curr) => {
      const success = curr.assignedTasks.filter(t => t.status === 'success').length;
      return acc + success;
    }, 0);

    return {
      totalEmployees,
      avgPerformance,
      avgImpact,
      hourlyBurn,
      activeTasksCount,
      completedTasksCount
    };
  }, [employees]);

  // Handle Dispatch Workflow Simulation
  const handleDispatchWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflowPrompt) return;

    const targetEmp = employees.find(emp => emp.employee_id === workflowTarget);
    if (!targetEmp) return;

    setWorkflowStatus('running');
    setWorkflowLogs([
      `[WORKFLOW-CORE] Init: Resolving digital identity for ${targetEmp.name} (${targetEmp.role})`,
      `[WORKFLOW-CORE] Injecting specialized neural personality: "${targetEmp.personality}"`,
      `[WORKFLOW-CORE] Binding operational tools: [${targetEmp.availableTools.join(', ')}]`,
      `[WORKFLOW-CORE] Restricting security context to authorized scope: [${targetEmp.permissions}]`
    ]);

    const steps = [
      `Connecting semantic memory bank... Found ${targetEmp.memoryContextCount} vectors on topic.`,
      `Accessing tool API: "${targetEmp.availableTools[0]}" -> Dispatching request structure`,
      `Generating adversarial injection safety scan... Passed.`,
      `Pinging Gemini 2.5 Flash gateway (Applying prompt caching: Saved ~2400 tokens)`,
      `Processing generative payload back from model... Success.`,
      `Writing structural optimization schemas to PostgreSQL via Drizzle ORM`,
      `Updating AI Employee history records in master cluster...`,
      `Dispatched task complete! 🚀 Output saved to Campaign artifacts pool.`
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setWorkflowLogs(prev => [...prev, `[${targetEmp.name.toUpperCase()}] ${steps[stepIndex]}`]);
        stepIndex++;
      } else {
        clearInterval(interval);
        setWorkflowStatus('success');
        
        // Add task to assigned tasks list
        setEmployees(prev => prev.map(emp => {
          if (emp.employee_id === workflowTarget) {
            const nextTask = {
              id: `task-${Date.now()}`,
              title: workflowPrompt,
              status: 'success' as const,
              progress: 100,
              timestamp: 'Just now'
            };
            return {
              ...emp,
              assignedTasks: [nextTask, ...emp.assignedTasks],
              performanceScore: Math.min(100, parseFloat((emp.performanceScore + 0.2).toFixed(1))),
              businessImpactScore: Math.min(100, emp.businessImpactScore + 1)
            };
          }
          return emp;
        }));

        toast.success(`Successfully executed task via ${targetEmp.name}!`);
        setWorkflowPrompt('');
      }
    }, 700);
  };

  const filteredEmployees = useMemo(() => {
    if (departmentFilter === 'All') return employees;
    return employees.filter(emp => emp.department === departmentFilter);
  }, [employees, departmentFilter]);

  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    toast.success('Schema code copied!');
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER PORTAL TITLE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#09090b] border border-zinc-900 rounded-2xl p-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-900/60 flex items-center justify-center text-red-500">
            <Users className="animate-pulse" size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Digital Employee Operating System</h2>
              <span className="text-[9px] bg-red-950 border border-red-900 text-red-500 font-black uppercase px-2 py-0.5 rounded">Ranktica AI V3 Core</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">Deploy, manage, and dispatch specialized autonomous AI employees working seamlessly across department silos.</p>
          </div>
        </div>
        
        {/* Navigation Tab selection */}
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-850 self-end md:self-auto">
          {[
            { id: 'matrix', label: 'Workforce Matrix', icon: <Users size={12} /> },
            { id: 'schema', label: 'Postgres Schema', icon: <Database size={12} /> },
            { id: 'architecture', label: 'Backend Services', icon: <Cpu size={12} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: WORKFORCE MATRIX & LIVE DASHBOARD                 */}
      {/* ======================================================== */}
      {activeTab === 'matrix' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* DIGITAL TEAM STATS & OVERVIEW BAR */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            
            <div className="bg-[#0b0b0e] border border-zinc-850 rounded-2xl p-4 space-y-1">
              <span className="text-[9px] font-bold text-zinc-500 uppercase">Deployed Workforce</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{dashboardStats.totalEmployees} AI</span>
                <span className="text-[9px] text-emerald-400 font-bold uppercase">100% Online</span>
              </div>
            </div>

            <div className="bg-[#0b0b0e] border border-zinc-850 rounded-2xl p-4 space-y-1">
              <span className="text-[9px] font-bold text-zinc-500 uppercase">Avg Performance</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{dashboardStats.avgPerformance}%</span>
                <span className="text-[9px] text-emerald-400 font-bold uppercase">Target SLA Met</span>
              </div>
            </div>

            <div className="bg-[#0b0b0e] border border-zinc-850 rounded-2xl p-4 space-y-1">
              <span className="text-[9px] font-bold text-zinc-500 uppercase">Business Impact Rating</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{dashboardStats.avgImpact}/100</span>
                <span className="text-[9px] text-zinc-500 font-bold uppercase">Enterprise Tier</span>
              </div>
            </div>

            <div className="bg-[#0b0b0e] border border-zinc-850 rounded-2xl p-4 space-y-1">
              <span className="text-[9px] font-bold text-zinc-500 uppercase">Digital Team Burn Rate</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">${dashboardStats.hourlyBurn}/hr</span>
                <span className="text-[9px] text-emerald-400 font-bold uppercase">95% Savings</span>
              </div>
            </div>

            <div className="col-span-2 md:col-span-1 bg-[#0b0b0e] border border-zinc-850 rounded-2xl p-4 space-y-1">
              <span className="text-[9px] font-bold text-zinc-500 uppercase">Workload Dispatch Pool</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{dashboardStats.activeTasksCount} Active</span>
                <span className="text-[9px] text-zinc-400 font-bold uppercase">{dashboardStats.completedTasksCount} Done</span>
              </div>
            </div>

          </div>

          {/* MAIN MATRIX SPLIT VIEWER */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: TEAM MEMBERS LIST WITH DEPT FILTER */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Department filtering bar */}
              <div className="flex justify-between items-center bg-zinc-950 p-1.5 rounded-xl border border-zinc-850 overflow-x-auto">
                {['All', 'Marketing', 'Sales', 'Business', 'Operations'].map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setDepartmentFilter(dept as any)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      departmentFilter === dept
                        ? 'bg-zinc-900 text-white border border-zinc-800'
                        : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>

              {/* Grid of employees */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEmployees.map((emp) => {
                  const isSelected = emp.employee_id === selectedEmployee.employee_id;
                  const activeTasks = emp.assignedTasks.filter(t => t.status === 'running').length;
                  
                  return (
                    <div
                      key={emp.employee_id}
                      onClick={() => setSelectedEmployeeId(emp.employee_id)}
                      className={`bg-[#0b0b0e] border rounded-2xl p-4 flex flex-col justify-between h-48 transition-all cursor-pointer relative overflow-hidden group hover:border-zinc-700 ${
                        isSelected ? 'border-red-600 ring-1 ring-red-600/30' : 'border-zinc-850'
                      }`}
                    >
                      {/* Avatar & Identifiers */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${emp.avatarColor} flex items-center justify-center text-white font-black text-xs uppercase shadow-inner`}>
                              {emp.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <h3 className="text-xs font-black text-white">{emp.name}</h3>
                              <span className="text-[9px] font-bold text-zinc-500 block">{emp.role}</span>
                            </div>
                          </div>

                          <span className="text-[8px] bg-zinc-950 border border-zinc-900 text-zinc-400 font-bold px-2 py-0.5 rounded">
                            {emp.department}
                          </span>
                        </div>

                        <p className="text-[10px] text-zinc-400 leading-normal line-clamp-2 italic">
                          "{emp.personality}"
                        </p>
                      </div>

                      {/* Capabilities tag line */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {emp.expertise.slice(0, 2).map((exp, i) => (
                          <span key={i} className="text-[8px] font-mono bg-zinc-950 border border-zinc-900 text-zinc-500 px-1.5 py-0.5 rounded">
                            {exp}
                          </span>
                        ))}
                      </div>

                      {/* Bottom row metrics */}
                      <div className="pt-2 border-t border-zinc-900 flex justify-between items-center text-[9px] text-zinc-500 font-bold">
                        <span className="flex items-center gap-1">
                          <Activity size={10} className="text-red-500 animate-pulse" />
                          Impact: <span className="text-white">{emp.businessImpactScore}/100</span>
                        </span>
                        
                        <span className="font-mono">
                          {activeTasks > 0 ? (
                            <span className="text-amber-400 flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-amber-400 animate-ping" />
                              {activeTasks} executing
                            </span>
                          ) : (
                            <span className="text-zinc-500">Idle / Sleep</span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* INTEGRATED DIRECT DEPT WORKFLOW DISPATCH BOX */}
              <div className="bg-[#0b0b0e] border border-zinc-850 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-900">
                  <Sliders className="text-red-500" size={16} />
                  <h3 className="text-xs font-black uppercase text-white tracking-wider">Direct Employee Task Dispatch Gateway</h3>
                </div>

                <form onSubmit={handleDispatchWorkflow} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-4">
                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1.5">Target AI Employee</label>
                    <select
                      value={workflowTarget}
                      onChange={(e) => setWorkflowTarget(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-red-500 transition-all cursor-pointer"
                    >
                      {employees.map(emp => (
                        <option key={emp.employee_id} value={emp.employee_id}>
                          {emp.name} ({emp.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-6">
                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1.5">Custom Dispatch Instruction</label>
                    <input
                      type="text"
                      required
                      value={workflowPrompt}
                      onChange={(e) => setWorkflowPrompt(e.target.value)}
                      placeholder="Enter custom project specifications..."
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-red-500 transition-all font-mono"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={workflowStatus === 'running'}
                      className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {workflowStatus === 'running' ? <RefreshCw className="animate-spin" size={12} /> : <Play size={12} />}
                      Dispatch
                    </button>
                  </div>
                </form>

                {/* Live Console Output of dispatched workflow */}
                {workflowLogs.length > 0 && (
                  <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-3 flex flex-col justify-between h-44">
                    <div className="flex justify-between items-center pb-1.5 border-b border-zinc-900 mb-2">
                      <span className="text-[9px] font-bold uppercase text-zinc-500 tracking-wider">WORKFLOW PROCESS TRACE TELEMETRY</span>
                      <span className={`text-[9px] font-mono font-bold ${
                        workflowStatus === 'success' ? 'text-emerald-400' : workflowStatus === 'running' ? 'text-amber-400 animate-pulse' : 'text-zinc-500'
                      }`}>
                        {workflowStatus.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto font-mono text-[9px] text-zinc-400 space-y-1 pr-1 scrollbar-thin">
                      {workflowLogs.map((log, i) => (
                        <div key={i} className={log.includes('[WORKFLOW-CORE]') ? 'text-zinc-500' : 'text-red-400'}>
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

            </div>

            {/* RIGHT COLUMN: AI EMPLOYEE OPERATIONAL PROFILE DETAIL */}
            <div className="lg:col-span-5 bg-[#0b0b0e] border border-zinc-850 rounded-2xl p-5 space-y-5 flex flex-col justify-between">
              
              {/* Employee Header */}
              <div className="space-y-4">
                <div className="flex justify-between items-start pb-4 border-b border-zinc-900">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedEmployee.avatarColor} flex items-center justify-center text-white font-black text-lg uppercase shadow-lg`}>
                      {selectedEmployee.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">{selectedEmployee.name}</h3>
                      <span className="text-[10px] font-mono bg-zinc-950 border border-zinc-900 text-zinc-400 px-2 py-0.5 rounded mt-1 inline-block">
                        {selectedEmployee.employee_id}
                      </span>
                    </div>
                  </div>

                  <span className="text-[9px] bg-red-950/40 border border-red-900/60 text-red-400 font-bold px-2 py-0.5 rounded">
                    {selectedEmployee.department} Team
                  </span>
                </div>

                {/* Identity Matrix */}
                <div className="space-y-3">
                  <div>
                    <span className="text-[9px] font-bold uppercase text-zinc-500">Official Position & Role</span>
                    <p className="text-xs text-white font-bold mt-0.5">{selectedEmployee.role}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] font-bold uppercase text-zinc-500">Neural Personality</span>
                      <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed italic">"{selectedEmployee.personality}"</p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[9px] font-bold uppercase text-zinc-500">Expertise Fields</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedEmployee.expertise.map((exp, i) => (
                          <span key={i} className="text-[8px] bg-zinc-950 border border-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded font-mono">
                            {exp}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Operational Profile Panel */}
                <div className="pt-4 border-t border-zinc-900 space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                    <Sliders size={12} className="text-red-500" /> Operational Profile & State
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    
                    <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-1">
                      <span className="text-[9px] font-bold uppercase text-zinc-500 block">Security Scope</span>
                      <span className={`font-mono font-bold ${
                        selectedEmployee.permissions === 'System_Admin' ? 'text-red-500' : 'text-zinc-300'
                      }`}>
                        {selectedEmployee.permissions}
                      </span>
                    </div>

                    <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-1">
                      <span className="text-[9px] font-bold uppercase text-zinc-500 block">Active Memories</span>
                      <span className="font-mono text-white font-bold">
                        {selectedEmployee.memoryContextCount.toLocaleString()} Vector keys
                      </span>
                    </div>

                    <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-1">
                      <span className="text-[9px] font-bold uppercase text-zinc-500 block">Workload Tool Bounds</span>
                      <div className="text-[9px] font-semibold text-zinc-400 truncate" title={selectedEmployee.availableTools.join(', ')}>
                        {selectedEmployee.availableTools.length} linked APIs
                      </div>
                    </div>

                    <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-1">
                      <span className="text-[9px] font-bold uppercase text-zinc-500 block">Performance Index</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {selectedEmployee.performanceScore}% (Score)
                      </span>
                    </div>

                  </div>
                </div>

                {/* Assigned Workloads Queue */}
                <div className="pt-4 border-t border-zinc-900 space-y-2">
                  <span className="text-[10px] font-black uppercase text-white tracking-wider block">Assigned Workload Queue</span>
                  
                  <div className="space-y-2">
                    {selectedEmployee.assignedTasks.map((task) => (
                      <div key={task.id} className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-xl text-[10px] flex justify-between items-center">
                        <div className="space-y-0.5 max-w-[190px]">
                          <p className="font-bold text-white truncate">{task.title}</p>
                          <span className="text-zinc-500 block">Assigned: {task.timestamp}</span>
                        </div>

                        <span className={`text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                          task.status === 'success' 
                            ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-400' 
                            : 'bg-amber-950/40 border-amber-900/60 text-amber-400 animate-pulse'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Business Impact Aggregation card */}
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex justify-between items-center mt-4">
                <div>
                  <span className="text-[9px] font-bold uppercase text-zinc-500 block">Attributed ARR Margin</span>
                  <p className="text-sm font-extrabold text-white mt-0.5">
                    +${(selectedEmployee.businessImpactScore * 180).toLocaleString()} / mo
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-bold uppercase text-zinc-500 block">Daily Token cost</span>
                  <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                    ${(selectedEmployee.hourlyCost * 24).toFixed(2)}
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: POSTGRESQL DRIZZLE DATABASE SCHEMA                */}
      {/* ======================================================== */}
      {activeTab === 'schema' && (
        <div className="bg-[#0b0b0e] border border-zinc-850 rounded-2xl p-5 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
            <div>
              <h3 className="text-xs font-black uppercase text-white tracking-wider">PostgreSQL Drizzle Schema Blueprint</h3>
              <p className="text-[10px] text-zinc-500">Models digital employee identity, operational task queues, and vector context memory.</p>
            </div>

            <button 
              onClick={() => handleCopyCode('db-schema', CODE_DATABASE_SCHEMA)}
              className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 rounded-lg text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center gap-1"
            >
              {copiedCodeId === 'db-schema' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
              {copiedCodeId === 'db-schema' ? 'Copied' : 'Copy Schema'}
            </button>
          </div>

          <pre className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl font-mono text-[10px] text-zinc-400 leading-normal overflow-x-auto max-h-[500px]">
            {CODE_DATABASE_SCHEMA}
          </pre>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: BACKEND SERVICES ARCHITECTURE (EXPRESS/DRIZZLE)   */}
      {/* ======================================================== */}
      {activeTab === 'architecture' && (
        <div className="bg-[#0b0b0e] border border-zinc-850 rounded-2xl p-5 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
            <div>
              <h3 className="text-xs font-black uppercase text-white tracking-wider">Express Backend Service Router & Workers</h3>
              <p className="text-[10px] text-zinc-500">Handles employee listing, task dispatch queues, and specialized model pipeline execution.</p>
            </div>

            <button 
              onClick={() => handleCopyCode('backend-service', CODE_BACKEND_SERVICE)}
              className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 rounded-lg text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center gap-1"
            >
              {copiedCodeId === 'backend-service' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
              {copiedCodeId === 'backend-service' ? 'Copied' : 'Copy Code'}
            </button>
          </div>

          <pre className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl font-mono text-[10px] text-zinc-400 leading-normal overflow-x-auto max-h-[500px]">
            {CODE_BACKEND_SERVICE}
          </pre>
        </div>
      )}

    </div>
  );
};
