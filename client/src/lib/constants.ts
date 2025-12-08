import { 
  Briefcase, 
  FileText, 
  ClipboardCheck, 
  MessageSquare, 
  Users, 
  UserCheck, 
  BookOpen, 
  GraduationCap, 
  Target, 
  BarChart,
  LayoutDashboard,
  UserCircle,
  Brain
} from "lucide-react";

export const APP_NAME = "Resume Logik";

export const MODULES = [
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview of your HR activities",
    color: "from-slate-500 to-slate-600",
    bgColor: "bg-gradient-to-br from-slate-500 to-slate-600",
    lightBg: "bg-slate-100 dark:bg-slate-900/30",
    textColor: "text-slate-600 dark:text-slate-400"
  },
  {
    title: "Candidates",
    path: "/candidates",
    icon: UserCircle,
    description: "View and manage all candidates",
    color: "from-indigo-500 to-violet-500",
    bgColor: "bg-gradient-to-br from-indigo-500 to-violet-500",
    lightBg: "bg-indigo-100 dark:bg-indigo-900/30",
    textColor: "text-indigo-600 dark:text-indigo-400"
  },
  {
    title: "Hiring Pipeline",
    path: "/hiring",
    icon: Users,
    description: "Track candidates through stages",
    color: "from-rose-500 to-red-500",
    bgColor: "bg-gradient-to-br from-rose-500 to-red-500",
    lightBg: "bg-rose-100 dark:bg-rose-900/30",
    textColor: "text-rose-600 dark:text-rose-400"
  },
  {
    title: "Job Descriptions",
    path: "/jobs",
    icon: Briefcase,
    description: "Generate JDs and salary ranges",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-gradient-to-br from-blue-500 to-cyan-500",
    lightBg: "bg-blue-100 dark:bg-blue-900/30",
    textColor: "text-blue-600 dark:text-blue-400"
  },
  {
    title: "Resume Logic",
    path: "/resume-analyzer",
    icon: Brain,
    description: "AI-powered resume analysis",
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-gradient-to-br from-purple-500 to-pink-500",
    lightBg: "bg-purple-100 dark:bg-purple-900/30",
    textColor: "text-purple-600 dark:text-purple-400",
    featured: true
  },
  {
    title: "Skills Tests",
    path: "/skills-test",
    icon: ClipboardCheck,
    description: "Build and score skills tests",
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-gradient-to-br from-green-500 to-emerald-500",
    lightBg: "bg-green-100 dark:bg-green-900/30",
    textColor: "text-green-600 dark:text-green-400"
  },
  {
    title: "Interviews",
    path: "/interviews",
    icon: MessageSquare,
    description: "Interview questions and rubrics",
    color: "from-orange-500 to-amber-500",
    bgColor: "bg-gradient-to-br from-orange-500 to-amber-500",
    lightBg: "bg-orange-100 dark:bg-orange-900/30",
    textColor: "text-orange-600 dark:text-orange-400"
  },
  {
    title: "Reference Check",
    path: "/references",
    icon: UserCheck,
    description: "Automated reference requests",
    color: "from-teal-500 to-cyan-500",
    bgColor: "bg-gradient-to-br from-teal-500 to-cyan-500",
    lightBg: "bg-teal-100 dark:bg-teal-900/30",
    textColor: "text-teal-600 dark:text-teal-400"
  },
  {
    title: "Onboarding",
    path: "/onboarding",
    icon: GraduationCap,
    description: "Onboarding checklists and plans",
    color: "from-lime-500 to-green-500",
    bgColor: "bg-gradient-to-br from-lime-500 to-green-500",
    lightBg: "bg-lime-100 dark:bg-lime-900/30",
    textColor: "text-lime-600 dark:text-lime-400"
  },
  {
    title: "Policies & Docs",
    path: "/policies",
    icon: BookOpen,
    description: "Generate HR policies",
    color: "from-yellow-500 to-orange-500",
    bgColor: "bg-gradient-to-br from-yellow-500 to-orange-500",
    lightBg: "bg-yellow-100 dark:bg-yellow-900/30",
    textColor: "text-yellow-600 dark:text-yellow-400"
  },
  {
    title: "Performance",
    path: "/performance",
    icon: Target,
    description: "Goals and performance tracking",
    color: "from-fuchsia-500 to-purple-500",
    bgColor: "bg-gradient-to-br from-fuchsia-500 to-purple-500",
    lightBg: "bg-fuchsia-100 dark:bg-fuchsia-900/30",
    textColor: "text-fuchsia-600 dark:text-fuchsia-400"
  },
  {
    title: "Analytics",
    path: "/analytics",
    icon: BarChart,
    description: "HR metrics and insights",
    color: "from-sky-500 to-blue-500",
    bgColor: "bg-gradient-to-br from-sky-500 to-blue-500",
    lightBg: "bg-sky-100 dark:bg-sky-900/30",
    textColor: "text-sky-600 dark:text-sky-400"
  }
];

export function getModuleByPath(path: string) {
  return MODULES.find(m => m.path === path) || MODULES[0];
}
