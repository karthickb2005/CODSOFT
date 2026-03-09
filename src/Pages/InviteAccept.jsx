import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "../api/base44Client";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";

export default function InviteAccept() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [inviteData, setInviteData] = useState(null);
    const [accepting, setAccepting] = useState(false);

    useEffect(() => {
        const fetchInvite = async () => {
            try {
                setLoading(true);
                const data = await base44.entities.Invite.get(token);
                setInviteData(data);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch invite:", err);
                setError(err.response?.data?.message || "Invalid or expired invitation link.");
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchInvite();
        }
    }, [token]);

    const handleAccept = async () => {
        try {
            setAccepting(true);
            await base44.entities.Invite.accept(token);
            toast.success("Welcome to TaskPilotAI! Invitation accepted.");
            navigate("/dashboard");
        } catch (err) {
            console.error("Failed to accept invite:", err);
            toast.error(err.response?.data?.message || "Failed to accept invitation.");
        } finally {
            setAccepting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground font-medium">Validating invitation...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background px-4">
                <div className="max-w-md w-full bg-card border border-border p-8 rounded-2xl shadow-xl text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                        <AlertCircle className="h-8 w-8 text-destructive" />
                    </div>
                    <h2 className="mt-6 text-2xl font-bold tracking-tight text-foreground">Invitation Error</h2>
                    <p className="mt-2 text-muted-foreground">{error}</p>
                    <button
                        onClick={() => navigate("/login")}
                        className="mt-8 w-full inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-2xl overflow-hidden relative">
                {/* Abstract Background Decoration */}
                <div className="absolute -top-24 -right-24 h-48 w-48 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 h-48 w-48 bg-purple-500/10 rounded-full blur-3xl" />

                <div className="relative">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 shadow-inner">
                        <CheckCircle2 className="h-10 w-10 text-primary" />
                    </div>

                    <div className="mt-8 text-center">
                        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Joined the Team?
                        </h2>
                        <p className="mt-3 text-slate-500 dark:text-slate-400">
                            You've been invited to join <span className="font-semibold text-slate-900 dark:text-white">TaskPilotAI</span> as a:
                        </p>

                        <div className="mt-6 inline-block px-6 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800">
                            <span className="text-purple-700 dark:text-purple-300 font-bold uppercase tracking-wider text-sm">
                                {inviteData?.role?.replace('_', ' ') || 'Member'}
                            </span>
                        </div>

                        <p className="mt-8 text-sm text-slate-400 dark:text-slate-500">
                            Accepting this invitation will add <span className="text-slate-600 dark:text-slate-300 font-medium">{inviteData?.email}</span> to the workspace.
                        </p>
                    </div>

                    <div className="mt-10 space-y-4">
                        <button
                            onClick={handleAccept}
                            disabled={accepting}
                            className="group relative w-full flex items-center justify-center rounded-xl bg-primary py-4 px-6 text-base font-bold text-primary-foreground transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 shadow-lg shadow-primary/25"
                        >
                            {accepting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Accepting...
                                </>
                            ) : (
                                <>
                                    Accept Invitation
                                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => navigate("/login")}
                            className="w-full py-3 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                        >
                            Sign in to another account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
