import React from "react";
import { Brain, Activity, Users, BarChart3 } from "lucide-react";
interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12">
          {/* Illustration */}
          <div className="relative mb-8">
            {/* Brain/Circuit Pattern */}
            <div className="w-64 h-64 relative">
            <img src="/sideimg.svg" alt="Neuro Clarity Illustration" className="w-full h-full object-contain" />
              {/* Circuit dots */}
              <div className="absolute top-8 left-8 w-3 h-3 bg-blue-400 rounded-full"></div>
              <div className="absolute top-8 right-8 w-3 h-3 bg-blue-400 rounded-full"></div>
              <div className="absolute bottom-8 left-8 w-3 h-3 bg-blue-400 rounded-full"></div>
              <div className="absolute bottom-8 right-8 w-3 h-3 bg-blue-400 rounded-full"></div>
              {/* People icons */}
              <Users className="absolute -top-4 -left-4 w-8 h-8 text-indigo-600" />
              <Users className="absolute -bottom-4 -right-4 w-8 h-8 text-indigo-600" />
            </div>
          </div>

          {/* Charts and Graphs */}
          <div className="flex space-x-4 mb-8">
            <div className="bg-white rounded-lg p-3 shadow-lg">
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
            <div className="bg-white rounded-lg p-3 shadow-lg">
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </div>

          {/* Text Content */}
          <div className="text-center max-w-md">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Neuro Electrical Mind for All
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              NEMA AI is a neuroscience and AI based consumer insight platform which makes learning, branding & marketing efficient.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-600">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
