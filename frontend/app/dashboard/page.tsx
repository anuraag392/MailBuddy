'use client'

import { useSession, signOut, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { fetchEmails, classifyEmail, generateReply, sendReply } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, LogOut, RefreshCw, Send, ShieldAlert, ShieldCheck, Mail, Sparkles, ChevronLeft, ChevronRight, Briefcase, Search, Building2, Tag, Users, Bell, ArrowLeftRight } from "lucide-react"

export default function Dashboard() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [emails, setEmails] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedEmail, setSelectedEmail] = useState<any>(null)
    const [replyText, setReplyText] = useState("")
    const [generatingReply, setGeneratingReply] = useState(false)
    const [currentTab, setCurrentTab] = useState<'inbox' | 'spam' | 'verified' | 'job_update' | 'job_ads' | 'work' | 'promotions' | 'social' | 'updates'>('inbox')
    const [isCollapsed, setIsCollapsed] = useState(false)
    const processedIds = useRef(new Set<string>())

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/')
        }
        // @ts-ignore
        if (session?.error === "RefreshAccessTokenError") {
            signOut() // Force sign out to break loop
        }
    }, [status, router, session])

    const loadEmails = async (silent = false) => {
        if (!silent) setLoading(true)
        try {
            const data = await fetchEmails()

            // Merge new data with existing state to preserve summaries
            setEmails(prev => {
                const existingMap = new Map(prev.map(e => [e.id, e]))
                return data.map((newEmail: any) => {
                    const existing = existingMap.get(newEmail.id)
                    // If we already have a summary/category, keep it
                    if (existing && existing.summary) {
                        return existing
                    }
                    return newEmail
                })
            })

            if (!silent) setLoading(false)

            // Classify new emails sequentially in background
            const processEmails = async () => {
                for (const email of data) {
                    // Only classify if not already processed
                    if (!processedIds.current.has(email.id)) {
                        processedIds.current.add(email.id) // Mark as processed immediately

                        try {
                            const classification = await classifyEmail({
                                subject: email.subject,
                                body: email.body || email.snippet,
                                sender: email.sender,
                                message_id: email.id
                            })

                            // If classification failed (Uncategorized), allow retry next time
                            if (classification.category === 'Uncategorized') {
                                processedIds.current.delete(email.id)
                            }

                            setEmails(prev => prev.map(e =>
                                e.id === email.id ? { ...e, ...classification } : e
                            ))
                        } catch (err) {
                            console.error("Failed to classify email", email.id, err)
                            setEmails(prev => prev.map(e =>
                                e.id === email.id ? { ...e, summary: "Analysis failed.", category: "Uncategorized" } : e
                            ))
                            processedIds.current.delete(email.id) // Retry next time on failure
                        }

                        // Wait 2 seconds between requests to respect rate limits
                        await new Promise(resolve => setTimeout(resolve, 2000))
                    }
                }
            }
            processEmails()
        } catch (error) {
            console.error("Failed to fetch emails", error)
            if (!silent) setLoading(false)
        }
    }

    // Initial load and polling
    useEffect(() => {
        if (status === 'authenticated') {
            loadEmails() // Initial load
            const interval = setInterval(() => {
                loadEmails(true) // Silent refresh
            }, 15000) // 15 seconds
            return () => clearInterval(interval)
        }
    }, [status])

    const handleGenerateReply = async (email: any) => {
        setGeneratingReply(true)
        try {
            const res = await generateReply({
                subject: email.subject,
                body: email.snippet,
                to: email.sender,
                context_id: null // TODO: Extract ID
            })
            setReplyText(res.reply)
        } catch (error) {
            console.error("Failed to generate reply", error)
        } finally {
            setGeneratingReply(false)
        }
    }

    const handleSendReply = async () => {
        if (!selectedEmail || !replyText) return

        try {
            await sendReply({
                subject: `Re: ${selectedEmail.subject}`,
                body: replyText,
                to: selectedEmail.sender,
                context_id: null
            })
            alert("Reply sent successfully!")
            setSelectedEmail(null)
            setReplyText("")
        } catch (error) {
            console.error("Failed to send reply", error)
            alert("Failed to send reply.")
        }
    }

    const filteredEmails = emails.filter(email => {
        if (currentTab === 'spam') {
            return email.category === 'Spam' || email.is_fake || email.category === 'Fake Job'
        } else if (currentTab === 'verified') {
            return !email.is_fake && email.category !== 'Spam' && email.category !== 'Fake Job'
        } else if (currentTab === 'job_update') {
            return email.category === 'Job Update'
        } else if (currentTab === 'job_ads') {
            return email.category === 'Job Ads'
        } else if (currentTab === 'work') {
            return email.category === 'Work'
        } else if (currentTab === 'promotions') {
            return email.category === 'Promotions'
        } else if (currentTab === 'social') {
            return email.category === 'Social'
        } else if (currentTab === 'updates') {
            return email.category === 'Updates'
        } else {
            // Inbox: Show everything
            return true
        }
    })

    if (status === 'loading') return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside className={`${isCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 border-r border-border bg-card/50 backdrop-blur-xl hidden md:flex flex-col p-4 fixed h-full z-20 overflow-y-auto`}>
                <div className={`flex items-center gap-2 mb-8 ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">M</div>
                    {!isCollapsed && <span className="font-bold text-xl tracking-tight animate-in fade-in duration-300">MailBuddy</span>}
                </div>

                <nav className="space-y-1">
                    <Button
                        variant={currentTab === 'inbox' ? 'secondary' : 'ghost'}
                        className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start'} ${currentTab === 'inbox' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setCurrentTab('inbox')}
                        title="Inbox"
                    >
                        <Mail className={`${isCollapsed ? 'mr-0' : 'mr-2'} h-4 w-4`} />
                        {!isCollapsed && "Inbox"}
                    </Button>
                    <Button
                        variant={currentTab === 'spam' ? 'secondary' : 'ghost'}
                        className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start'} ${currentTab === 'spam' ? 'bg-destructive/10 text-destructive font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setCurrentTab('spam')}
                        title="Spam"
                    >
                        <ShieldAlert className={`${isCollapsed ? 'mr-0' : 'mr-2'} h-4 w-4`} />
                        {!isCollapsed && "Spam"}
                    </Button>
                    <Button
                        variant={currentTab === 'verified' ? 'secondary' : 'ghost'}
                        className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start'} ${currentTab === 'verified' ? 'bg-green-500/10 text-green-600 font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setCurrentTab('verified')}
                        title="Verified"
                    >
                        <ShieldCheck className={`${isCollapsed ? 'mr-0' : 'mr-2'} h-4 w-4`} />
                        {!isCollapsed && "Verified"}
                    </Button>

                    <div className="my-4 border-t border-border/50" />

                    <Button
                        variant={currentTab === 'job_update' ? 'secondary' : 'ghost'}
                        className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start'} ${currentTab === 'job_update' ? 'bg-green-500/10 text-green-600 font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setCurrentTab('job_update')}
                        title="Job Updates"
                    >
                        <Briefcase className={`${isCollapsed ? 'mr-0' : 'mr-2'} h-4 w-4`} />
                        {!isCollapsed && "Job Updates"}
                    </Button>
                    <Button
                        variant={currentTab === 'job_ads' ? 'secondary' : 'ghost'}
                        className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start'} ${currentTab === 'job_ads' ? 'bg-blue-500/10 text-blue-600 font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setCurrentTab('job_ads')}
                        title="Job Ads"
                    >
                        <Search className={`${isCollapsed ? 'mr-0' : 'mr-2'} h-4 w-4`} />
                        {!isCollapsed && "Job Ads"}
                    </Button>
                    <Button
                        variant={currentTab === 'work' ? 'secondary' : 'ghost'}
                        className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start'} ${currentTab === 'work' ? 'bg-purple-500/10 text-purple-600 font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setCurrentTab('work')}
                        title="Work"
                    >
                        <Building2 className={`${isCollapsed ? 'mr-0' : 'mr-2'} h-4 w-4`} />
                        {!isCollapsed && "Work"}
                    </Button>
                    <Button
                        variant={currentTab === 'promotions' ? 'secondary' : 'ghost'}
                        className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start'} ${currentTab === 'promotions' ? 'bg-yellow-500/10 text-yellow-600 font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setCurrentTab('promotions')}
                        title="Promotions"
                    >
                        <Tag className={`${isCollapsed ? 'mr-0' : 'mr-2'} h-4 w-4`} />
                        {!isCollapsed && "Promotions"}
                    </Button>
                    <Button
                        variant={currentTab === 'social' ? 'secondary' : 'ghost'}
                        className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start'} ${currentTab === 'social' ? 'bg-pink-500/10 text-pink-600 font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setCurrentTab('social')}
                        title="Social"
                    >
                        <Users className={`${isCollapsed ? 'mr-0' : 'mr-2'} h-4 w-4`} />
                        {!isCollapsed && "Social"}
                    </Button>
                    <Button
                        variant={currentTab === 'updates' ? 'secondary' : 'ghost'}
                        className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start'} ${currentTab === 'updates' ? 'bg-orange-500/10 text-orange-600 font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setCurrentTab('updates')}
                        title="Updates"
                    >
                        <Bell className={`${isCollapsed ? 'mr-0' : 'mr-2'} h-4 w-4`} />
                        {!isCollapsed && "Updates"}
                    </Button>
                </nav>

                <div className="mt-auto pt-6 border-t border-border space-y-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-center text-muted-foreground hover:text-foreground"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <span className="text-sm flex items-center gap-2">Collapse Sidebar <ChevronLeft className="h-4 w-4" /></span>}
                    </Button>

                    <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {session?.user?.name?.[0]}
                        </div>
                        {!isCollapsed && (
                            <div className="flex-1 overflow-hidden animate-in fade-in duration-300">
                                <p className="text-sm font-medium truncate">{session?.user?.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                            </div>
                        )}
                    </div>
                    <Button variant="outline" className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start'} text-primary hover:text-primary hover:bg-primary/10`} onClick={() => signIn('google', { prompt: 'select_account' })} title="Switch Account">
                        <ArrowLeftRight className={`${isCollapsed ? 'mr-0' : 'mr-2'} h-4 w-4`} />
                        {!isCollapsed && "Switch Account"}
                    </Button>
                    <Button variant="outline" className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start'} text-destructive hover:text-destructive hover:bg-destructive/10`} onClick={() => signOut()} title="Sign Out">
                        <LogOut className={`${isCollapsed ? 'mr-0' : 'mr-2'} h-4 w-4`} />
                        {!isCollapsed && "Sign Out"}
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 ${isCollapsed ? 'md:ml-20' : 'md:ml-64'} p-8 transition-all duration-300`}>
                <header className="flex justify-between items-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-1 capitalize">{currentTab.replace('_', ' ')}</h1>
                        <p className="text-muted-foreground text-sm">Just like you, your mail needs a buddy.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="flex items-center px-3 py-1 text-xs font-medium text-green-600 bg-green-500/10 border border-green-500/20 rounded-full animate-pulse">
                            <span className="w-1.5 h-1.5 mr-2 bg-green-500 rounded-full"></span>
                            Live Updates
                        </span>
                        <Button variant="outline" size="icon" onClick={() => loadEmails(false)} disabled={loading} className="rounded-full">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        </Button>
                    </div>
                </header>

                <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    {filteredEmails.map((email, index) => (
                        <Card
                            key={email.id}
                            className="glass-card cursor-pointer group border-l-4 border-l-transparent hover:border-l-primary"
                            onClick={() => setSelectedEmail(email)}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <CardContent className="p-5">
                                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                                                {email.subject}
                                            </h3>
                                            {email.is_fake || email.category === 'Fake Job' ? (
                                                <Badge variant="destructive" className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider"><ShieldAlert className="w-3 h-3 mr-1" /> Fake</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-green-600 border-green-600/30 bg-green-500/5 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider"><ShieldCheck className="w-3 h-3 mr-1" /> Verified</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">{email.sender}</p>
                                    </div>
                                    <Badge variant="secondary" className={`rounded-full px-3 py-1 font-medium ${email.category === 'Job Update' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                        email.category === 'Job Ads' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                            email.category === 'Work' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' :
                                                email.category === 'Fake Job' ? 'bg-red-500/10 text-red-600 border-red-500/20' : ''
                                        }`}>
                                        {email.category}
                                    </Badge>
                                </div>

                                <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                                    <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">AI Summary</p>
                                    {email.summary ? (
                                        <p className="text-sm text-foreground/80 line-clamp-2">{email.summary}</p>
                                    ) : (
                                        <div className="flex items-center text-xs text-muted-foreground animate-pulse">
                                            <Loader2 className="w-3 h-3 mr-2 animate-spin" /> Analyzing content...
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Dialog open={!!selectedEmail} onOpenChange={(open) => !open && setSelectedEmail(null)}>
                    <DialogContent className="sm:max-w-[700px] glass border-white/10">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">{selectedEmail?.subject}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border/50">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">From</p>
                                    <p className="font-medium">{selectedEmail?.sender}</p>
                                </div>
                                <Badge variant="outline">{selectedEmail?.category}</Badge>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Content</p>
                                <div className="p-6 bg-card rounded-xl border border-border text-sm leading-relaxed max-h-[300px] overflow-y-auto">
                                    {selectedEmail?.snippet}
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-border/50">
                                {['Promotions', 'Spam', 'Fake Job', 'Updates', 'Social'].includes(selectedEmail?.category) || selectedEmail?.is_fake ? (
                                    <div className="flex items-center text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-full">
                                        <ShieldAlert className="w-4 h-4 mr-2" />
                                        Replies disabled for this category.
                                    </div>
                                ) : (
                                    <Button onClick={() => handleGenerateReply(selectedEmail)} disabled={generatingReply} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6">
                                        {generatingReply ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                        Generate AI Reply
                                    </Button>
                                )}
                            </div>

                            {replyText && !(['Promotions', 'Spam', 'Fake Job', 'Updates', 'Social'].includes(selectedEmail?.category) || selectedEmail?.is_fake) && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-primary" /> Suggested Reply
                                    </label>
                                    <Textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        rows={6}
                                        className="bg-card/50 border-border focus:ring-primary/50 resize-none rounded-xl"
                                    />
                                    <Button className="w-full rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20" onClick={handleSendReply}>
                                        <Send className="mr-2 h-4 w-4" /> Send Reply
                                    </Button>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    )
}
