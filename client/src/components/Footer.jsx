import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Calendar from './Calendar';

const Footer = () => {
    // Mock free dates for the calendar
    const freeDates = ['2026-03-28', '2026-03-29', '2026-04-04', '2026-04-05'];

    const footerLinks = [
        { name: 'Home', path: '/' },
        { name: 'Courses', path: '/courses' },
        { name: 'Community', path: '/community' },
        { name: 'Events', path: '/events' },
        { name: 'Contact', path: '/contact' },
    ];

    const socialIcons = [
        { name: 'Facebook', icon: 'FB', url: '#' },
        { name: 'Twitter', icon: 'TW', url: '#' },
        { name: 'LinkedIn', icon: 'LI', url: '#' },
        { name: 'Instagram', icon: 'IG', url: '#' },
    ];

    return (
        <footer className="bg-primary-dark text-white pt-16 pb-8 border-t-2 border-accent/20 font-body relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-light/10 blur-[100px] rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 blur-[100px] rounded-full -ml-32 -mb-32" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Column 1: Brand */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="text-2xl font-heading font-bold mb-4 bg-gradient-to-r from-white to-primary-light bg-clip-text text-transparent">
                            CampusConnect
                        </h2>
                        <p className="text-gray-400 mb-6 leading-relaxed">
                            Empowering students through collaboration, shared resources, and community-driven learning. Join the future of education today.
                        </p>
                        <div className="flex space-x-4">
                            {socialIcons.map(social => (
                                <a
                                    key={social.name}
                                    href={social.url}
                                    className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-primary-light hover:border-primary-light transition-all duration-300 group"
                                    aria-label={social.name}
                                >
                                    <span className="text-xs font-bold group-hover:scale-110 transition-transform">{social.icon}</span>
                                </a>
                            ))}
                        </div>
                    </motion.div>

                    {/* Column 2: Quick Links */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <h3 className="text-lg font-heading font-semibold mb-6 text-accent">Quick Links</h3>
                        <ul className="space-y-3">
                            {footerLinks.map(link => (
                                <li key={link.name}>
                                    <Link
                                        to={link.path}
                                        className="text-gray-400 hover:text-white hover:translate-x-1 inline-block transition-all duration-200"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Column 3: Interactive Calendar */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="lg:col-span-1"
                    >
                        <h3 className="text-lg font-heading font-semibold mb-6 text-accent">Availability</h3>
                        <Calendar freeDates={freeDates} />
                    </motion.div>

                    {/* Column 4: Contact */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <h3 className="text-lg font-heading font-semibold mb-6 text-accent">Get in Touch</h3>
                        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                            Have questions or suggestions? We're here to help you make the most of your campus experience.
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3 group">
                                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-all">
                                    <span>📧</span>
                                </div>
                                <span className="text-sm text-gray-300">support@campusconnect.com</span>
                            </div>
                            <div className="flex items-center space-x-3 group">
                                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-all">
                                    <span>📞</span>
                                </div>
                                <span className="text-sm text-gray-300">+1 (555) 123-4567</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} CampusConnect. All rights reserved.</p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

