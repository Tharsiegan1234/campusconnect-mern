import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

const QuestionDetail = () => {
    const { id } = useParams();
    const [question, setQuestion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchQuestionDetail = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const res = await axios.get(`/api/qa/admin/questions/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setQuestion(res.data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to load question details");
                setLoading(false);
            }
        };

        fetchQuestionDetail();
    }, [id]);

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;

    if (error) return (
        <div className="p-6">
            <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
            </div>
            <Link to="/admin/qa/questions" className="mt-4 inline-block text-primary font-bold hover:underline">← Back to Questions</Link>
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <Link to="/admin/qa/questions" className="text-primary font-bold flex items-center gap-2 hover:underline">
                    ← Back to Questions
                </Link>
                <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${question.isSolved ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'}`}>
                        {question.isSolved ? 'Solved' : 'Open'}
                    </span>
                </div>
            </div>

            {/* Question Section */}
            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden border-2 border-white shadow-sm shrink-0">
                        {question.askedBy?.avatar ? (
                            <img 
                                src={question.askedBy.avatar.startsWith('/') ? question.askedBy.avatar : `/${question.askedBy.avatar}`} 
                                alt="" 
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                            />
                        ) : null}
                        <span style={{ display: question.askedBy?.avatar ? 'none' : 'block' }}>{question.askedBy?.name?.[0]}</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-text-main leading-tight">{question.title}</h1>
                        <p className="text-sm text-text-muted">
                            Asked by <span className="font-bold text-text-secondary">{question.askedBy?.name}</span> in <span className="font-bold text-primary">{question.group?.name}</span> • {new Date(question.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="prose prose-sm max-w-none text-text-secondary leading-relaxed mb-6">
                    <p className="whitespace-pre-wrap">{question.description}</p>
                </div>

                {question.code && (
                    <div className="bg-gray-900 rounded-2xl p-6 mb-6 overflow-x-auto border border-gray-800 shadow-inner">
                        <div className="flex items-center justify-between mb-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                            <span>{question.language || 'Code Snippet'}</span>
                            <span className="bg-gray-800 px-2 py-0.5 rounded text-gray-400">Read Only</span>
                        </div>
                        <pre className="text-gray-300 font-mono text-sm leading-6"><code>{question.code}</code></pre>
                    </div>
                )}
            </section>

            {/* Answers Section */}
            <div className="space-y-6">
                <h2 className="text-xl font-black text-text-main flex items-center gap-3">
                    <span className="w-2 h-6 bg-green-500 rounded-full" />
                    Expert Responses ({question.answers?.length || 0})
                </h2>

                {question.answers?.length > 0 ? (
                    question.answers.map((answer) => (
                        <motion.div 
                            key={answer._id} 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }}
                            className={`bg-white rounded-3xl shadow-sm border ${answer.isSolved ? 'border-green-200 ring-4 ring-green-50' : 'border-gray-100'} p-8 relative overflow-hidden`}
                        >
                            {answer.isSolved && (
                                <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                                    Solution
                                </div>
                            )}

                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold overflow-hidden border-2 border-green-50 shrink-0">
                                    {answer.answeredBy?.avatar ? (
                                        <img 
                                            src={answer.answeredBy.avatar.startsWith('/') ? answer.answeredBy.avatar : `/${answer.answeredBy.avatar}`} 
                                            alt="" 
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                                        />
                                    ) : null}
                                    <span style={{ display: answer.answeredBy?.avatar ? 'none' : 'block' }}>{answer.answeredBy?.name?.[0]}</span>
                                </div>
                                <div>
                                    <p className="font-bold text-text-main">{answer.answeredBy?.name}</p>
                                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Platform Expert • {new Date(answer.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <p className="text-text-secondary leading-relaxed whitespace-pre-wrap mb-6">
                                {answer.content}
                            </p>

                            {answer.code && (
                                <div className="bg-gray-900 rounded-2xl p-6 overflow-x-auto border border-gray-800 shadow-inner">
                                    <div className="flex items-center justify-between mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        <span>{answer.language || 'Solution Implementation'}</span>
                                    </div>
                                    <pre className="text-gray-300 font-mono text-sm leading-6"><code>{answer.code}</code></pre>
                                </div>
                            )}
                        </motion.div>
                    ))
                ) : (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center text-text-muted">
                        <p className="font-bold text-lg">No answers yet</p>
                        <p className="text-sm">Platform experts have not responded to this question.</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default QuestionDetail;
