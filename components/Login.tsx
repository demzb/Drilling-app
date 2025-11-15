import React, { useState } from 'react';
import supabase from '../supabase';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [isLoginView, setIsLoginView] = useState(true);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setMessage(null);

        try {
            if (isLoginView) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                // The onAuthStateChange listener in App.tsx will handle the redirect
            } else {
                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setMessage('Success! Please check your email for a verification link.');
            }
        } catch (err: any) {
            setError(err.error_description || err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 space-y-6 border-t-4 border-blue-600">
                <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                         <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                         <h1 className="text-4xl font-bold ml-3 text-gray-800">DrillSoft</h1>
                    </div>
                    <p className="text-gray-500">Your All-in-One Borehole Business Suite</p>
                </div>

                <div className="flex border-b">
                    <button
                        onClick={() => { setIsLoginView(true); setError(null); setMessage(null); }}
                        className={`w-1/2 py-3 text-center font-semibold transition-colors ${isLoginView ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => { setIsLoginView(false); setError(null); setMessage(null); }}
                        className={`w-1/2 py-3 text-center font-semibold transition-colors ${!isLoginView ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Sign Up
                    </button>
                </div>
                
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="text-sm font-bold text-gray-600 block">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 mt-1 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password"  className="text-sm font-bold text-gray-600 block">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 mt-1 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
                        >
                            {isSubmitting ? 'Processing...' : (isLoginView ? 'Login' : 'Sign Up')}
                        </button>
                    </div>
                </form>

                {error && <div className="text-center text-red-500 bg-red-50 p-3 rounded-lg">{error}</div>}
                {message && <div className="text-center text-green-500 bg-green-50 p-3 rounded-lg">{message}</div>}
            </div>
        </div>
    );
};

export default Login;
