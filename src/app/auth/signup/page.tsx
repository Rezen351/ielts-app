'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Globe, ArrowRight } from "lucide-react"

export default function SignupPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Account created", {
          description: "Welcome to IELTS Master. Redirecting to login...",
        });
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 2000);
      } else {
        toast.error("Signup failed", {
          description: data.message || data.error || "Please check your information.",
        });
      }
    } catch (err) {
      toast.error("Error", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/50 px-4">
      <Card className="w-full max-w-md shadow-2xl shadow-slate-200/50 border-slate-100 rounded-[32px] overflow-hidden">
        <CardHeader className="space-y-4 text-center pt-12">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Create an account</CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              Start your journey to Band 8.5 today
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 px-8 pb-8">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Full Name</Label>
              <Input 
                id="name" 
                type="text" 
                placeholder="John Doe" 
                required 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="rounded-xl border-slate-200 h-12 focus-visible:ring-blue-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                required 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="rounded-xl border-slate-200 h-12 focus-visible:ring-blue-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="rounded-xl border-slate-200 h-12 focus-visible:ring-blue-600"
              />
              <p className="text-[10px] text-slate-400 font-medium">Minimum 6 characters required.</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-6 px-8 pb-12">
            <Button className="w-full font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 flex items-center gap-2 group" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Sign Up"}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <div className="text-center text-sm">
              <span className="text-xs text-slate-400 font-medium">Already have an account? </span>
              <Link href="/auth/login" className="text-xs text-blue-600 font-bold hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
