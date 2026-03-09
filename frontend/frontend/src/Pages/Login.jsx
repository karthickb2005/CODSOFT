// Phase 3 Final Fix - Correct Login Condition
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { base44, api as axios } from '@/api/base44Client';
import { API_BASE_URL } from '../config/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldCheck, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = { email, password };
            const response = await axios.post(`${API_BASE_URL}/api/auth/login`, formData);

            console.log("[LOGIN_RESPONSE]", response.data);

            if (response.data && response.data.success === true) {
                const token = response.data.accessToken;

                console.log("[AUTH_TOKEN_RECEIVED]", token);

                localStorage.setItem("accessToken", token);

                console.log("[AUTH_TOKEN_SAVED]", localStorage.getItem("accessToken"));

                console.log("[NAVIGATING_TO_DASHBOARD]");

                navigate("/dashboard");
            } else {
                console.log("[LOGIN_FAILED]", response.data);
            }
        } catch (error) {
            console.error("Login Error:", error);
            toast.error(error.response?.data?.message || error.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.1),transparent_70%)]" />
            <Card className="w-full max-w-md bg-slate-900/50 border-slate-800 backdrop-blur-xl relative z-10">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center mb-4">
                        <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">Welcome Back</CardTitle>
                    <p className="text-slate-400">Enter your credentials to access your account</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-300">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    className="bg-slate-800/50 border-slate-700 text-white pl-10"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-300">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <Input
                                    id="password"
                                    type="password"
                                    className="bg-slate-800/50 border-slate-700 text-white pl-10"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 h-11" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
                        </Button>
                    </form>
                    <div className="mt-6 text-center text-sm">
                        <span className="text-slate-400">Don't have an account? </span>
                        <Link to="/signup" className="text-violet-400 hover:text-violet-300 font-medium">Create one</Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
