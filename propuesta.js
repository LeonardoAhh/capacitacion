import React, { useState, useEffect } from 'react';
import {
    Menu, X, Moon, Sun, ChevronRight,
    Factory, Cog, Layers, Wrench,
    Zap, Truck, Cpu, PenTool
} from 'lucide-react';

const App = () => {
    const [darkMode, setDarkMode] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Efecto para detectar scroll y ajustar el navbar
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Efecto para aplicar clase dark al body
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const navLinks = [
        { name: 'Inicio', href: '#home' },
        { name: 'Servicios', href: '#services' },
        { name: 'Empresa', href: '#about' },
        { name: 'Maquinaria', href: '#machinery' },
        { name: 'Productos', href: '#products' },
    ];

    return (
        <div className={`min-h-screen transition-colors duration-500 ease-in-out ${darkMode ? 'bg-[#050505] text-white' : 'bg-slate-50 text-slate-900'} font-sans selection:bg-red-500 selection:text-white`}>

            {/* --- Navigation --- */}
            <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 py-3' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">

                    {/* Logo */}
                    <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white">
                            V
                        </div>
                        <span className={darkMode ? 'text-white' : 'text-slate-900'}>
                            Viño<span className="text-red-600">plastic</span>
                        </span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                {link.name}
                            </a>
                        ))}

                        {/* Theme Toggle */}
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                        >
                            {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-600" />}
                        </button>

                        <button className="bg-slate-900 dark:bg-white text-white dark:text-black px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity">
                            Contacto
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-4">
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="p-2"
                        >
                            {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-600" />}
                        </button>
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Dropdown */}
                {mobileMenuOpen && (
                    <div className="absolute top-full left-0 w-full bg-white dark:bg-[#0a0a0a] border-b border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4 md:hidden animate-fade-in-down shadow-2xl">
                        {navLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="text-lg font-medium py-2 border-b border-slate-100 dark:border-slate-800"
                            >
                                {link.name}
                            </a>
                        ))}
                    </div>
                )}
            </nav>

            {/* --- Hero Section --- */}
            <section id="home" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Background Elements */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen opacity-50 animate-pulse-slow"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-red-500/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen opacity-50"></div>

                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                            Innovación Industrial
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                            Excelencia en <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-red-500">
                                Inyección de Plásticos
                            </span>
                        </h1>

                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
                            Transformamos plásticos de ingeniería con precisión milimétrica desde 1970. Soluciones integrales para la industria nacional e internacional.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <button className="bg-gradient-to-r from-blue-700 to-blue-600 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] transition-all flex items-center gap-2">
                                Nuestros Servicios <ChevronRight size={18} />
                            </button>
                            <button className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-8 py-4 rounded-2xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                                Contáctanos
                            </button>
                        </div>
                    </div>

                    <div className="relative">
                        {/* Abstract 3D-like representation */}
                        <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-white/50 dark:border-white/10 flex items-center justify-center group">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>

                            {/* Floating Cards */}
                            <div className="absolute top-10 left-10 right-10 p-6 bg-white/60 dark:bg-black/40 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-white/5 shadow-xl transform group-hover:-translate-y-2 transition-transform duration-500">
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="p-2 bg-red-500 rounded-lg text-white"><Zap size={20} /></div>
                                    <div className="h-2 w-24 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full mb-2"></div>
                                <div className="h-2 w-2/3 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                            </div>

                            <div className="absolute bottom-10 right-10 left-10 p-6 bg-blue-600/90 backdrop-blur-md rounded-2xl shadow-xl transform group-hover:translate-y-2 transition-transform duration-500 z-20">
                                <div className="flex justify-between items-center text-white">
                                    <span className="font-bold">Calidad Certificada</span>
                                    <span className="text-2xl font-mono">100%</span>
                                </div>
                            </div>

                            <Factory className="text-slate-300 dark:text-slate-700 w-48 h-48 opacity-20" />
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Services Section --- */}
            <section id="services" className="py-24 bg-slate-50 dark:bg-[#0a0a0a]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl md:text-4xl font-bold">Nuestros Servicios</h2>
                        <p className="text-slate-600 dark:text-slate-400">Soluciones integrales de manufactura</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <ServiceCard
                            icon={<Factory />}
                            title="Maquila de Inyección"
                            desc="Producción de alto volumen con maquinaria de última generación."
                        />
                        <ServiceCard
                            icon={<PenTool />}
                            title="Decorado y Tampografía"
                            desc="Acabados estéticos y funcionales de alta precisión."
                        />
                        <ServiceCard
                            icon={<Layers />}
                            title="Sub-ensambles"
                            desc="Integración de componentes para entregar productos semiterminados."
                        />
                        <ServiceCard
                            icon={<Wrench />}
                            title="Moldes"
                            desc="Diseño, fabricación y mantenimiento preventivo de moldes."
                        />
                    </div>
                </div>
            </section>

            {/* --- About / Company Section --- */}
            <section id="about" className="py-24 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                    <div className="order-2 lg:order-1">
                        <div className="aspect-[4/3] rounded-3xl bg-slate-200 dark:bg-slate-800 relative overflow-hidden group">
                            {/* Decorative image placeholder */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-black opacity-80"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <span className="block text-6xl font-bold text-white/10 group-hover:text-white/20 transition-colors">1970</span>
                                    <span className="text-white/60 text-sm uppercase tracking-[0.5em]">Fundación</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="order-1 lg:order-2 space-y-6">
                        <h2 className="text-3xl md:text-4xl font-bold">La Empresa</h2>
                        <div className="w-20 h-1 bg-red-600 rounded-full"></div>
                        <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                            <span className="text-blue-600 dark:text-blue-400 font-semibold">Viñoplastic</span> es una empresa fundada en 1970, dedicada a la transformación de plásticos por el proceso de inyección.
                        </p>
                        <p className="text-slate-600 dark:text-slate-400">
                            Satisfacemos las necesidades de la industria nacional e internacional con estándares de calidad rigurosos. Nuestra trayectoria nos permite abordar proyectos complejos con la seguridad de la experiencia.
                        </p>
                        <a href="#" className="inline-flex items-center text-blue-600 dark:text-blue-400 font-semibold hover:gap-2 transition-all">
                            Ver más sobre nosotros <ChevronRight size={16} className="ml-1" />
                        </a>
                    </div>
                </div>
            </section>

            {/* --- Machinery & Capabilities --- */}
            <section id="machinery" className="py-24 bg-black text-white relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-black to-black"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-white/10 pb-8">
                        <div>
                            <h2 className="text-3xl md:text-5xl font-bold mb-2">Maquinaria y Equipo</h2>
                            <p className="text-slate-400">Tecnología auxiliar para procesos perfectos</p>
                        </div>
                        <button className="hidden md:block text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-colors">
                            Ver inventario completo
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {['Secadores', 'Cargadores', 'Montacargas', 'Termoreguladores', 'Enfriadores', 'Controladores de colada'].map((item, idx) => (
                            <div key={idx} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex flex-col items-center text-center gap-3 group">
                                <Cog className="text-red-500 group-hover:rotate-90 transition-transform duration-700" />
                                <span className="text-sm font-medium text-slate-200">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- Products / Industries --- */}
            <section id="products" className="py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Industrias y Productos</h2>
                        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Nuestra versatilidad nos permite servir a sectores clave con precisión y conformidad normativa.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <IndustryCard title="Automotriz" icon={<Truck />} items={['Piezas interiores', 'Componentes de motor', 'Clips y sujeciones']} />
                        <IndustryCard title="Electrodomésticos" icon={<Zap />} items={['Carcasas', 'Botones', 'Mecanismos internos']} />
                        <IndustryCard title="Electrónica" icon={<Cpu />} items={['Conectores', 'Aislantes', 'Soportes de PCB']} />
                    </div>

                    <div className="mt-12 flex flex-wrap justify-center gap-4">
                        {['Eléctrico', 'Juguetes', 'Enseres domésticos', 'Médico', 'Aeroespacial'].map((tag) => (
                            <span key={tag} className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-default">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- Footer --- */}
            <footer className="bg-slate-100 dark:bg-[#050505] border-t border-slate-200 dark:border-slate-800 pt-20 pb-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-1 md:col-span-2">
                            <div className="text-2xl font-bold mb-6">
                                Viño<span className="text-red-600">plastic</span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                                Excelencia en inyección de plásticos de ingeniería. Transformando ideas en productos tangibles desde 1970.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-bold mb-6 text-slate-900 dark:text-white">Enlaces</h4>
                            <ul className="space-y-4 text-slate-500 dark:text-slate-400">
                                <li><a href="#home" className="hover:text-blue-600 transition-colors">Inicio</a></li>
                                <li><a href="#services" className="hover:text-blue-600 transition-colors">Servicios</a></li>
                                <li><a href="#machinery" className="hover:text-blue-600 transition-colors">Maquinaria</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold mb-6 text-slate-900 dark:text-white">Contacto</h4>
                            <ul className="space-y-4 text-slate-500 dark:text-slate-400">
                                <li>contacto@vinoplastic.com</li>
                                <li>+52 (55) 1234 5678</li>
                                <li>Ciudad de México, México</li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
                        <p>&copy; {new Date().getFullYear()} Viñoplastic. Todos los derechos reservados.</p>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-slate-900 dark:hover:text-white">Privacidad</a>
                            <a href="#" className="hover:text-slate-900 dark:hover:text-white">Términos</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

// --- Subcomponents ---

const ServiceCard = ({ icon, title, desc }) => (
    <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 dark:border-slate-800 group">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            {React.cloneElement(icon, { size: 28 })}
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4">{desc}</p>
        <a href="#" className="text-red-500 text-sm font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">
            Ver detalle <ChevronRight size={14} />
        </a>
    </div>
);

const IndustryCard = ({ title, icon, items }) => (
    <div className="relative group overflow-hidden rounded-3xl bg-slate-100 dark:bg-slate-900 p-8 hover:bg-blue-600 hover:text-white transition-all duration-300">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transform group-hover:scale-150 transition-transform">
            {React.cloneElement(icon, { size: 100 })}
        </div>

        <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400 group-hover:text-white group-hover:bg-white/20">
                {React.cloneElement(icon, { size: 24 })}
            </div>
            <h3 className="text-2xl font-bold mb-4">{title}</h3>
            <ul className="space-y-2">
                {items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 group-hover:text-blue-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 group-hover:bg-white"></div>
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    </div>
);

export default App;