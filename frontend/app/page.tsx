'use client'

import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Mail, ShieldCheck, Sparkles } from "lucide-react"

export default function Home() {
    const { data: session } = useSession()
    const router = useRouter()

    useEffect(() => {
        if (session) {
            router.push('/dashboard')
        }
    }, [session, router])

    return (
        <div className="flex min-h-screen flex-col bg-background relative overflow-hidden">
            <header className="px-4 lg:px-6 h-16 flex items-center border-b border-border/40 relative z-10 backdrop-blur-xl bg-background/50">
                {/* Background Gradients */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-float" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
                </div>
            </header>

            <div className="z-10 max-w-5xl w-full flex flex-col items-center text-center px-4 mx-auto">
                <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                        AI-Powered Email Assistant
                    </span>
                </div>

                <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                    <span className="text-gradient">MailBuddy</span>
                </h1>

                <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                    Just like you, your mail needs a buddy.
                    <br />
                    <span className="text-base md:text-lg mt-4 block opacity-80">
                        Classify emails, detect fake domains, and generate smart replies instantly.
                    </span>
                </p>

                <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                    <Button
                        onClick={() => signIn('google')}
                        size="lg"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 rounded-full shadow-lg shadow-primary/25 transition-all hover:scale-105"
                    >
                        Get Started <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
                    <div className="glass p-6 rounded-2xl text-left">
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 text-blue-500">
                            <Mail className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Smart Classification</h3>
                        <p className="text-muted-foreground text-sm">Automatically categorizes your emails into Work, Social, Updates, and more.</p>
                    </div>
                    <div className="glass p-6 rounded-2xl text-left">
                        <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 text-purple-500">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">AI Replies</h3>
                        <p className="text-muted-foreground text-sm">Generate context-aware replies in seconds with advanced AI models.</p>
                    </div>
                    <div className="glass p-6 rounded-2xl text-left">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-500">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Fraud Detection</h3>
                        <p className="text-muted-foreground text-sm">Instantly spots fake domains and phishing attempts to keep you safe.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
