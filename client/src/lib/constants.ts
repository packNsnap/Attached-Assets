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
  UserCircle
} from "lucide-react";

export const APP_NAME = "HR Nexus";

export const MODULES = [
  {
    title: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
    description: "Overview of your HR activities"
  },
  {
    title: "Job Descriptions",
    path: "/jobs",
    icon: Briefcase,
    description: "Generate JDs and salary ranges"
  },
  {
    title: "Resume Logic",
    path: "/resume-analyzer",
    icon: FileText,
    description: "Analyze resume logic and consistency"
  },
  {
    title: "Skills Tests",
    path: "/skills-test",
    icon: ClipboardCheck,
    description: "Build and score skills tests"
  },
  {
    title: "Interviews",
    path: "/interviews",
    icon: MessageSquare,
    description: "Interview questions and rubrics"
  },
  {
    title: "Reference Check",
    path: "/references",
    icon: UserCheck,
    description: "Automated reference request templates"
  },
  {
    title: "Candidates",
    path: "/candidates",
    icon: UserCircle,
    description: "View and manage all candidates"
  },
  {
    title: "Hiring Pipeline",
    path: "/hiring",
    icon: Users,
    description: "Track candidates through stages"
  },
  {
    title: "Onboarding",
    path: "/onboarding",
    icon: GraduationCap,
    description: "Onboarding checklists and plans"
  },
  {
    title: "Policies & Docs",
    path: "/policies",
    icon: BookOpen,
    description: "Generate HR policies and templates"
  },
  {
    title: "Performance",
    path: "/performance",
    icon: Target,
    description: "Goals and performance tracking"
  },
  {
    title: "Analytics",
    path: "/analytics",
    icon: BarChart,
    description: "HR metrics and administration"
  }
];
