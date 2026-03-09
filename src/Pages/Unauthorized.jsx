import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Unauthorized() {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-center">
            <div className="space-y-6 max-w-md">
                <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                    <ShieldAlert className="w-8 h-8 text-red-500" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-white">Access Denied</h1>
                    <p className="text-slate-400">You don't have the required permissions to view this page.</p>
                </div>
                <Button asChild className="bg-violet-600 hover:bg-violet-700">
                    <Link to="/">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>
                </Button>
            </div>
        </div>
    );
}
