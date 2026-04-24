import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AvatarSelector from '../components/AvatarSelector';

const Register = () => {
    const [step, setStep] = useState(1); // Step 1: Email/OTP, Step 2: Profile Details
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        otp: '',
    });
    const [avatar, setAvatar] = useState('/avatars/avatar1.png');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);
    const navigate = useNavigate();

    const { name, email, password, otp } = formData;

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const onChange = (e) => {
        const { name, value } = e.target;
        if (name === 'otp') {
            const numericValue = value.replace(/[^0-9]/g, '');
            setFormData({ ...formData, [name]: numericValue });
        } else if (name === 'name') {
            const lettersOnly = value.replace(/[^a-zA-Z\s]/g, '');
            setFormData({ ...formData, [name]: lettersOnly });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const sendOTP = async () => {
        if (!email) {
            setError('Please enter your email first');
            return;
        }
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const res = await axios.post('/api/users/send-otp', { email });
            setOtpSent(true);
            setTimer(60); // 1 minute
            setSuccess(res.data.message || 'OTP sent to your email');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyEmail = async () => {
        if (!otp) {
            setError('Please enter the verification code');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await axios.post('/api/users/verify-otp', { email, otp });
            setSuccess('Email verified successfully!');
            setTimeout(() => {
                setStep(2);
                setSuccess('');
            }, 1000);
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Full Name Validation
        if (name.trim().length < 2) {
            setError('Please enter a valid name');
            return;
        }

        // Password Validation: min 6 chars, at least one letter and one number
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
        if (!passwordRegex.test(password)) {
            setError('Password must be at least 6 characters and include both letters and numbers');
            return;
        }

        setLoading(true);

        try {
            const payload = { ...formData, avatar, role: 'student' };
            const res = await axios.post('/api/users', payload);
            console.log('Register Success', res.data);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data));
            navigate('/profiles');
        } catch (err) {
            console.error(err.response?.data?.message || err.message);
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 mb-20 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden"
            >
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100">
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ width: '0%' }}
                        animate={{ width: step === 1 ? '50%' : '100%' }}
                        transition={{ duration: 0.5 }}
                    />
                </div>

                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-primary font-heading">
                        {step === 1 ? 'Verify Email' : 'Setup Profile'}
                    </h1>
                    <span className="text-sm font-bold text-text-muted bg-bg-main px-3 py-1 rounded-full border border-gray-100">
                        Step {step} of 2
                    </span>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-50 text-error p-4 rounded-xl mb-6 text-sm text-center font-medium border border-red-100"
                    >
                        {error}
                    </motion.div>
                )}
                {success && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-50 text-green-600 p-4 rounded-xl mb-6 text-sm text-center font-medium border border-green-100"
                    >
                        {success}
                    </motion.div>
                )}

                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            <p className="text-text-secondary text-sm leading-relaxed">
                                Enter your SLIIT email address to receive a 6-digit verification code.
                            </p>
                            <div>
                                <label className="block text-text-secondary text-xs font-bold uppercase tracking-wider mb-2">Email Address</label>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        name="email"
                                        value={email}
                                        onChange={onChange}
                                        required
                                        disabled={otpSent}
                                        className="flex-1 px-4 py-3 rounded-xl bg-bg-main border border-gray-200 focus:border-primary focus:ring-4 focus:ring-blue-50 outline-none transition-all disabled:opacity-50 font-medium"
                                        placeholder="it21xxxxxx@my.sliit.lk"
                                    />
                                    {!otpSent ? (
                                        <button
                                            type="button"
                                            onClick={sendOTP}
                                            disabled={loading}
                                            className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
                                        >
                                            {loading ? '...' : 'Send'}
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setOtpSent(false)}
                                            className="px-4 py-3 text-primary bg-blue-50 hover:bg-blue-100 rounded-xl text-sm font-bold transition-all"
                                        >
                                            Change
                                        </button>
                                    )}
                                </div>
                            </div>

                            {otpSent && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="space-y-6 pt-2"
                                >
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-text-secondary text-xs font-bold uppercase tracking-wider">Verification Code</label>
                                            {timer > 0 ? (
                                                <span className="text-xs font-bold text-accent">Expires in {timer}s</span>
                                            ) : (
                                                <button onClick={sendOTP} className="text-xs font-bold text-primary hover:underline">Resend Code</button>
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            name="otp"
                                            value={otp}
                                            onChange={onChange}
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            required
                                            className="w-full px-4 py-3 rounded-xl bg-bg-main border border-gray-200 focus:border-primary focus:ring-4 focus:ring-blue-50 outline-none transition-all text-center text-2xl font-bold tracking-widest"
                                            placeholder="••••••"
                                            maxLength="6"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleVerifyEmail}
                                        disabled={loading || !otp}
                                        className="w-full bg-accent hover:bg-accent-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-accent/20 transition-all transform active:scale-95 disabled:opacity-50"
                                    >
                                        {loading ? 'Verifying...' : 'Verify Email'}
                                    </button>
                                </motion.div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <form onSubmit={onSubmit} className="space-y-6">
                                <div className="flex flex-col items-center mb-6">
                                    <label className="block text-text-secondary text-xs font-bold uppercase tracking-wider mb-4">Choose your avatar</label>
                                    <AvatarSelector selectedAvatar={avatar} setSelectedAvatar={setAvatar} />
                                </div>

                                <div>
                                    <label className="block text-text-secondary text-xs font-bold uppercase tracking-wider mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={name}
                                        onChange={onChange}
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-bg-main border border-gray-200 focus:border-primary focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium"
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div>
                                    <label className="block text-text-secondary text-xs font-bold uppercase tracking-wider mb-2">Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={password}
                                        onChange={onChange}
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-bg-main border border-gray-200 focus:border-primary focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all transform active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? 'Creating Account...' : 'Complete Registration'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="w-full text-text-muted font-bold text-sm hover:text-primary transition-colors py-2"
                                >
                                    Go Back
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                <p className="mt-8 text-center text-text-secondary text-sm font-medium">
                    Already have an account? <Link to="/login" className="text-accent font-bold hover:underline">Login</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Register;
